const db = require("./database/connection");
const supplierAdapterManager = require("./services/adapters/supplierAdapterManager");
const HotelRankingService = require("./services/ranking/hotelRankingService");

(async () => {
  try {
    console.log("\n=== PHASE 1 VERIFICATION: Unified Master Hotel Schema ===\n");

    // 1. Reset RateHawk circuit breaker
    console.log("1. Resetting RateHawk circuit breaker...");
    supplierAdapterManager.resetAdapterCircuitBreaker("RATEHAWK");

    // 2. Run Dubai search (Jan 12-15, 2026, 2 adults)
    console.log("2. Running Dubai hotel search (RateHawk only)...");
    const searchResult = await supplierAdapterManager.searchAllHotels(
      {
        destination: "DXB",
        destinationName: "Dubai",
        checkIn: "2026-01-12",
        checkOut: "2026-01-15",
        rooms: [{ adults: 2, children: 0, childAges: [] }],
        currency: "AED",
        maxResults: 50,
        adults: 2,
        children: 0,
        roomsCount: 1,
        childAges: [],
        destinationCode: "DXB",
        rawDestination: "Dubai",
      },
      ["RATEHAWK"],
    );

    console.log(`   Total results: ${searchResult.totalResults}`);
    console.log(`   Supplier metrics:`, searchResult.supplierMetrics);

    // Wait for master schema writes to complete
    console.log("3. Waiting for master schema writes...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 4. Verify supplier_master has RATEHAWK
    console.log("\n4. Checking supplier_master...");
    const suppliers = await db.query(
      "SELECT supplier_code, name, enabled FROM supplier_master ORDER BY supplier_code",
    );
    console.log("   Suppliers:");
    suppliers.rows.forEach((row) => {
      console.log(`   - ${row.supplier_code}: ${row.name} (enabled: ${row.enabled})`);
    });

    // 5. Count hotels in hotel_master
    console.log("\n5. Checking hotel_master table...");
    const hotelCount = await db.query(
      "SELECT COUNT(*) as count FROM hotel_master WHERE city = 'Dubai'",
    );
    console.log(`   Hotels in Dubai: ${hotelCount.rows[0].count}`);

    // 6. Sample hotels from master
    console.log("\n6. Sample hotels (first 5):");
    const sampleHotels = await db.query(
      `SELECT property_id, hotel_name, city, country, star_rating, review_score
       FROM hotel_master WHERE city = 'Dubai'
       ORDER BY created_at DESC LIMIT 5`,
    );
    sampleHotels.rows.forEach((hotel, idx) => {
      console.log(
        `   ${idx + 1}. ${hotel.hotel_name} | ${hotel.country} | ⭐ ${hotel.star_rating} | Score: ${hotel.review_score}`,
      );
      console.log(`      ID: ${hotel.property_id}`);
    });

    // 7. Count room offers
    console.log("\n7. Checking room_offer table...");
    const offerCount = await db.query(
      `SELECT COUNT(*) as count, supplier_code
       FROM room_offer ro
       JOIN hotel_master hm ON ro.property_id = hm.property_id
       WHERE hm.city = 'Dubai'
       GROUP BY supplier_code
       ORDER BY supplier_code`,
    );
    console.log("   Room offers by supplier:");
    offerCount.rows.forEach((row) => {
      console.log(`   - ${row.supplier_code}: ${row.count} offers`);
    });

    // 8. Show price distribution
    console.log("\n8. Price distribution (room offers in Dubai):");
    const priceStats = await db.query(
      `SELECT 
        COUNT(*) as total,
        MIN(price_total) as min_price,
        MAX(price_total) as max_price,
        ROUND(AVG(price_total)::numeric, 2) as avg_price,
        currency
       FROM room_offer ro
       JOIN hotel_master hm ON ro.property_id = hm.property_id
       WHERE hm.city = 'Dubai'
       GROUP BY currency`,
    );
    priceStats.rows.forEach((row) => {
      console.log(`   Currency: ${row.currency}`);
      console.log(`   - Min: ${row.min_price}, Avg: ${row.avg_price}, Max: ${row.max_price}`);
      console.log(`   - Total offers: ${row.total}`);
    });

    // 9. Check hotel_supplier_map for dedup
    console.log("\n9. Checking hotel_supplier_map (deduplication)...");
    const mapCount = await db.query(
      `SELECT COUNT(*) as count, COUNT(DISTINCT property_id) as unique_properties
       FROM hotel_supplier_map hsm
       JOIN hotel_master hm ON hsm.property_id = hm.property_id
       WHERE hm.city = 'Dubai'`,
    );
    console.log(`   Total mappings: ${mapCount.rows[0].count}`);
    console.log(`   Unique properties: ${mapCount.rows[0].unique_properties}`);

    // 10. Demonstrate ranking (cheapest-first)
    console.log("\n10. Test ranking service (cheapest-first)...");
    const rankedHotels = await HotelRankingService.searchAndRankHotels({
      city: "Dubai",
      country: "AE",
      checkIn: "2026-01-12",
      checkOut: "2026-01-15",
      adults: 2,
      children: 0,
      currency: "AED",
      limit: 5,
    });

    console.log(`   Ranked hotels (top 5 cheapest):`);
    rankedHotels.forEach((hotel, idx) => {
      console.log(
        `   ${idx + 1}. ${hotel.hotel_name} | ${hotel.price.currency} ${hotel.price.total} | Supplier: ${hotel.cheapest_supplier} | Offers: ${hotel.offers_count}`,
      );
    });

    // 11. Sample JSON response for frontend
    console.log("\n11. Sample JSON response (matching API contract):");
    if (rankedHotels.length > 0) {
      const sample = rankedHotels[0];
      console.log(
        JSON.stringify(
          {
            property_id: sample.property_id,
            hotel_name: sample.hotel_name,
            address: sample.address,
            city: sample.city,
            country: sample.country,
            lat: sample.lat,
            lng: sample.lng,
            star_rating: sample.star_rating,
            review_score: sample.review_score,
            review_count: sample.review_count,
            thumbnail_url: sample.thumbnail_url,
            badges: sample.badges,
            price: sample.price,
            cheapest_supplier: sample.cheapest_supplier,
            offers_count: sample.offers_count,
          },
          null,
          2,
        ),
      );
    }

    // 12. SQL verification queries
    console.log("\n12. SQL verification queries (copy-paste ready):");
    console.log(
      `\nSELECT COUNT(*) FROM hotel_master WHERE city = 'Dubai';`,
    );
    console.log(
      `SELECT COUNT(*) FROM room_offer ro JOIN hotel_master hm ON ro.property_id = hm.property_id WHERE hm.city = 'Dubai';`,
    );
    console.log(
      `SELECT supplier_code, COUNT(*) FROM hotel_supplier_map hsm JOIN hotel_master hm ON hsm.property_id = hm.property_id WHERE hm.city = 'Dubai' GROUP BY supplier_code;`,
    );

    console.log("\n=== PHASE 1 VERIFICATION COMPLETE ===\n");

    process.exitCode = 0;
  } catch (error) {
    console.error("\n❌ ERROR during verification:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    setTimeout(() => process.exit(), 300);
  }
})();
