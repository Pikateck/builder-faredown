const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Creating Phase 1 unified hotel master schema...\n");

    const queries = [
      {
        name: "Drop hotel_master_unified if exists",
        sql: `DROP TABLE IF EXISTS room_offer_unified CASCADE`,
      },
      {
        name: "Drop hotel_unified if exists",
        sql: `DROP TABLE IF EXISTS hotel_unified CASCADE`,
      },
      {
        name: "Create hotel_unified (Phase 1 canonical property table)",
        sql: `CREATE TABLE IF NOT EXISTS hotel_unified (
          property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          supplier_code TEXT,
          supplier_hotel_id TEXT,
          hotel_name TEXT NOT NULL,
          address TEXT,
          city TEXT,
          country TEXT,
          postal_code TEXT,
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          star_rating NUMERIC(3, 1),
          review_score NUMERIC(3, 1),
          review_count INT,
          chain_code TEXT,
          brand_code TEXT,
          giata_id TEXT,
          thumbnail_url TEXT,
          district TEXT,
          zone TEXT,
          neighborhood TEXT,
          amenities_json JSONB,
          checkin_from TEXT,
          checkout_until TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
      },
      {
        name: "Create hotel_supplier_map_unified (deduplication bridge)",
        sql: `CREATE TABLE IF NOT EXISTS hotel_supplier_map_unified (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          property_id UUID NOT NULL REFERENCES hotel_unified(property_id) ON DELETE CASCADE,
          supplier_code TEXT NOT NULL,
          supplier_hotel_id TEXT NOT NULL,
          confidence_score NUMERIC(3, 2) DEFAULT 1.00,
          matched_on TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(supplier_code, supplier_hotel_id)
        )`,
      },
      {
        name: "Create room_offer_unified (normalized rates)",
        sql: `CREATE TABLE IF NOT EXISTS room_offer_unified (
          offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          property_id UUID NOT NULL REFERENCES hotel_unified(property_id) ON DELETE CASCADE,
          supplier_code TEXT NOT NULL,
          room_name TEXT,
          board_basis TEXT,
          bed_type TEXT,
          refundable BOOLEAN,
          cancellable_until TIMESTAMPTZ,
          free_cancellation BOOLEAN,
          occupancy_adults INT,
          occupancy_children INT,
          inclusions_json JSONB,
          currency TEXT NOT NULL,
          price_base NUMERIC(12, 2),
          price_taxes NUMERIC(12, 2),
          price_total NUMERIC(12, 2),
          price_per_night NUMERIC(12, 2),
          rate_key_or_token TEXT,
          availability_count INT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          search_checkin DATE,
          search_checkout DATE
        )`,
      },
      {
        name: "Index: hotel_unified on city, country",
        sql: `CREATE INDEX IF NOT EXISTS idx_hotel_unified_city_country ON hotel_unified(city, country)`,
      },
      {
        name: "Index: hotel_unified on giata",
        sql: `CREATE INDEX IF NOT EXISTS idx_hotel_unified_giata ON hotel_unified(giata_id)`,
      },
      {
        name: "Index: hotel_supplier_map_unified on property_id",
        sql: `CREATE INDEX IF NOT EXISTS idx_map_unified_property_id ON hotel_supplier_map_unified(property_id)`,
      },
      {
        name: "Index: hotel_supplier_map_unified on supplier",
        sql: `CREATE INDEX IF NOT EXISTS idx_map_unified_supplier ON hotel_supplier_map_unified(supplier_code)`,
      },
      {
        name: "Index: room_offer_unified on property_id",
        sql: `CREATE INDEX IF NOT EXISTS idx_offer_unified_property ON room_offer_unified(property_id)`,
      },
      {
        name: "Index: room_offer_unified on price",
        sql: `CREATE INDEX IF NOT EXISTS idx_offer_unified_price ON room_offer_unified(price_total, currency)`,
      },
      {
        name: "Index: room_offer_unified on supplier",
        sql: `CREATE INDEX IF NOT EXISTS idx_offer_unified_supplier ON room_offer_unified(supplier_code)`,
      },
      {
        name: "Index: room_offer_unified on search dates",
        sql: `CREATE INDEX IF NOT EXISTS idx_offer_unified_search ON room_offer_unified(search_checkin, search_checkout)`,
      },
    ];

    for (const query of queries) {
      try {
        console.log(`${query.name}...`);
        await client.query(query.sql);
        console.log(`  ✓\n`);
      } catch (error) {
        console.error(`  ✗ ${error.message}\n`);
        if (!query.name.includes("Drop")) throw error;
      }
    }

    // Verify tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('hotel_unified', 'hotel_supplier_map_unified', 'room_offer_unified')
      ORDER BY table_name
    `);

    console.log("\n✅ Phase 1 Tables Created:");
    tables.rows.forEach((row) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    process.exitCode = 0;
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
    setTimeout(() => process.exit(), 300);
  }
})();
