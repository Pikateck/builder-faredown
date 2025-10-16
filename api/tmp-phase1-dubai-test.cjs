const supplierAdapterManager = require("./services/adapters/supplierAdapterManager");
const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(
      "\n=== PHASE 1: DUBAI HOTEL SEARCH & UNIFIED MASTER TABLE VERIFICATION ===\n",
    );

    await client.connect();

    // 1. Run Dubai search
    console.log(
      "1️⃣  Running Dubai hotel search (RateHawk, Jan 12-15, 2026, 2 adults)...\n",
    );
    supplierAdapterManager.resetAdapterCircuitBreaker("RATEHAWK");

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

    console.log(`Total results from aggregator: ${searchResult.totalResults}`);
    console.log(
      `Supplier metrics: `,
      JSON.stringify(searchResult.supplierMetrics, null, 2),
    );

    // Wait for master table writes
    console.log("\n2️⃣  Waiting for master table writes (3s)...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 2. Verify unified hotel_master
    console.log("\n3️⃣  Checking hotel_unified table...");
    const hotelCount = await client.query(
      "SELECT COUNT(*) as count FROM hotel_unified WHERE city = 'Dubai'",
    );
    console.log(`   Hotels inserted in Dubai: ${hotelCount.rows[0].count}\n`);

    // 3. Sample hotels
    console.log("4️⃣  Sample hotels from hotel_unified (first 5):\n");
    const sampleHotels = await client.query(
      `SELECT property_id, hotel_name, star_rating, review_score FROM hotel_unified WHERE city = 'Dubai'
       ORDER BY created_at DESC LIMIT 5`,
    );

    if (sampleHotels.rows.length === 0) {
      console.log(
        "   (No hotels found in hotel_unified - checking room_offer_unified instead)\n",
      );

      // Maybe hotels are in room_offer, let's check that
      const offers = await client.query(
        `SELECT property_id, hotel_name, price_total, currency, supplier_code
         FROM room_offer_unified ru
         WHERE city = 'Dubai' 
         ORDER BY created_at DESC LIMIT 5`,
      );

      if (offers.rows.length > 0) {
        offers.rows.forEach((offer, idx) => {
          console.log(
            `   ${idx + 1}. ${offer.hotel_name} | ${offer.currency} ${offer.price_total} | ${offer.supplier_code}`,
          );
        });
      }
    } else {
      sampleHotels.rows.forEach((hotel, idx) => {
        console.log(
          `   ${idx + 1}. ${hotel.hotel_name} (ID: ${hotel.property_id.substring(0, 8)}...)`,
        );
        console.log(
          `      Rating: ${hotel.star_rating}★ | Score: ${hotel.review_score}`,
        );
      });
    }

    // 4. Count room offers by supplier
    console.log("\n5️⃣  Room offers by supplier:");
    const offerCount = await client.query(
      `SELECT COUNT(*) as count, supplier_code
       FROM room_offer_unified
       WHERE city = 'Dubai'
       GROUP BY supplier_code
       ORDER BY count DESC`,
    );

    offerCount.rows.forEach((row) => {
      console.log(`   ${row.supplier_code}: ${row.count} offers`);
    });

    // 5. Price statistics
    console.log("\n6️⃣  Price distribution:");
    const priceStats = await client.query(
      `SELECT 
        COUNT(*) as total,
        MIN(price_total) as min_price,
        MAX(price_total) as max_price,
        ROUND(AVG(price_total)::numeric, 2) as avg_price,
        currency
       FROM room_offer_unified
       WHERE city = 'Dubai'
       GROUP BY currency
       ORDER BY total DESC`,
    );

    priceStats.rows.forEach((row) => {
      console.log(`\n   Currency: ${row.currency}`);
      console.log(`   - Offers: ${row.total}`);
      console.log(`   - Price range: ${row.min_price} - ${row.max_price}`);
      console.log(`   - Average: ${row.avg_price}`);
    });

    // 6. Show cheapest offers (what the UI would display)
    console.log("\n7️⃣  Cheapest offers by property (what UI shows):\n");
    const cheapest = await client.query(
      `SELECT DISTINCT ON (property_id)
        hu.property_id, hu.hotel_name, hu.city, ru.currency, ru.price_total, ru.room_name, ru.supplier_code
       FROM room_offer_unified ru
       JOIN hotel_unified hu ON ru.property_id = hu.property_id
       WHERE hu.city = 'Dubai'
       ORDER BY ru.property_id, ru.price_total ASC
       LIMIT 10`,
    );

    if (cheapest.rows.length > 0) {
      cheapest.rows.forEach((row, idx) => {
        console.log(
          `   ${idx + 1}. ${row.hotel_name} | ${row.currency} ${row.price_total} | ${row.room_name} | ${row.supplier_code}`,
        );
      });
    }

    // 7. Sample JSON response for API contract
    console.log("\n8️⃣  Sample hotel card JSON (what API returns to UI):\n");
    const sampleQuery = await client.query(
      `SELECT 
        hu.property_id, hu.hotel_name, hu.address, hu.city, hu.country, 
        hu.lat, hu.lng, hu.star_rating, hu.review_score, hu.review_count,
        hu.thumbnail_url,
        (SELECT COUNT(*) FROM room_offer_unified WHERE property_id = hu.property_id) as offers_count,
        (SELECT MIN(price_total) FROM room_offer_unified WHERE property_id = hu.property_id) as cheapest_price,
        (SELECT currency FROM room_offer_unified WHERE property_id = hu.property_id ORDER BY price_total LIMIT 1) as currency,
        (SELECT supplier_code FROM room_offer_unified WHERE property_id = hu.property_id ORDER BY price_total LIMIT 1) as cheapest_supplier
       FROM hotel_unified hu
       WHERE hu.city = 'Dubai'
       LIMIT 1`,
    );

    if (sampleQuery.rows.length > 0) {
      const hotel = sampleQuery.rows[0];
      const sampleJSON = {
        property_id: hotel.property_id,
        hotel_name: hotel.hotel_name,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        lat: parseFloat(hotel.lat),
        lng: parseFloat(hotel.lng),
        star_rating: parseFloat(hotel.star_rating),
        review_score: parseFloat(hotel.review_score),
        review_count: hotel.review_count,
        thumbnail_url: hotel.thumbnail_url,
        badges: {
          breakfastIncluded: false,
          freeCancellation: false,
        },
        price: {
          currency: hotel.currency,
          total: parseFloat(hotel.cheapest_price),
          perNight: null,
        },
        cheapest_supplier: hotel.cheapest_supplier,
        offers_count: hotel.offers_count,
      };
      console.log(JSON.stringify(sampleJSON, null, 2));
    }

    // 8. SQL verification queries
    console.log("\n9️⃣  SQL Verification Queries (copy-paste ready):\n");
    console.log("-- Count hotels in Dubai");
    console.log("SELECT COUNT(*) FROM hotel_unified WHERE city = 'Dubai';\n");

    console.log("-- Count room offers in Dubai");
    console.log(
      "SELECT COUNT(*) FROM room_offer_unified WHERE city = 'Dubai';\n",
    );

    console.log("-- View sample data");
    console.log(
      "SELECT property_id, hotel_name, price_total, currency FROM room_offer_unified WHERE city = 'Dubai' LIMIT 10;\n",
    );

    console.log("-- Cheapest hotels (ranked)");
    console.log(
      `SELECT DISTINCT ON (property_id) hu.hotel_name, ru.price_total, ru.currency, ru.supplier_code
       FROM room_offer_unified ru
       JOIN hotel_unified hu ON ru.property_id = hu.property_id
       WHERE hu.city = 'Dubai'
       ORDER BY ru.property_id, ru.price_total ASC LIMIT 10;`,
    );

    console.log("\n✅ PHASE 1 VERIFICATION COMPLETE\n");
    process.exitCode = 0;
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
    setTimeout(() => process.exit(), 300);
  }
})();
