const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    console.log("\n=== PHASE 1 UNIFIED TABLES CONTENTS ===\n");

    const hotelCount = await client.query(
      "SELECT COUNT(*) as count FROM hotel_unified",
    );
    console.log(`hotel_unified total rows: ${hotelCount.rows[0].count}`);

    const offerCount = await client.query(
      "SELECT COUNT(*) as count FROM room_offer_unified",
    );
    console.log(`room_offer_unified total rows: ${offerCount.rows[0].count}`);

    const mapCount = await client.query(
      "SELECT COUNT(*) as count FROM hotel_supplier_map_unified",
    );
    console.log(
      `hotel_supplier_map_unified total rows: ${mapCount.rows[0].count}`,
    );

    if (hotelCount.rows[0].count > 0) {
      console.log("\nSample hotels:");
      const hotels = await client.query(
        "SELECT property_id, hotel_name, city, country LIMIT 3",
      );
      hotels.rows.forEach((h, i) => {
        console.log(`  ${i + 1}. ${h.hotel_name} (${h.city}, ${h.country})`);
      });
    }

    if (offerCount.rows[0].count > 0) {
      console.log("\nSample offers:");
      const offers = await client.query(
        "SELECT offer_id, hotel_name, city, price_total, currency LIMIT 3",
      );
      offers.rows.forEach((o, i) => {
        console.log(
          `  ${i + 1}. ${o.hotel_name} | ${o.currency} ${o.price_total}`,
        );
      });
    }

    process.exitCode = 0;
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
    setTimeout(() => process.exit(), 300);
  }
})();
