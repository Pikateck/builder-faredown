const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("✓ Connected\n");

    const queries = [
      {
        name: "Create supplier_master",
        sql: `CREATE TABLE IF NOT EXISTS supplier_master (
          supplier_code TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          enabled BOOLEAN DEFAULT true,
          priority INT DEFAULT 100,
          timeout_ms INT DEFAULT 8000,
          auth_ref TEXT,
          last_health TIMESTAMPTZ,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
      },
      {
        name: "Create hotel_master",
        sql: `CREATE TABLE IF NOT EXISTS hotel_master (
          property_id UUID PRIMARY KEY,
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
        name: "Create hotel_supplier_map",
        sql: `CREATE TABLE IF NOT EXISTS hotel_supplier_map (
          property_id UUID NOT NULL REFERENCES hotel_master(property_id) ON DELETE CASCADE,
          supplier_code TEXT NOT NULL REFERENCES supplier_master(supplier_code),
          supplier_hotel_id TEXT NOT NULL,
          confidence_score NUMERIC(3, 2) DEFAULT 1.00,
          matched_on TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (supplier_code, supplier_hotel_id),
          UNIQUE(property_id, supplier_code)
        )`,
      },
      {
        name: "Create room_offer",
        sql: `CREATE TABLE IF NOT EXISTS room_offer (
          offer_id UUID PRIMARY KEY,
          property_id UUID NOT NULL REFERENCES hotel_master(property_id) ON DELETE CASCADE,
          supplier_code TEXT NOT NULL REFERENCES supplier_master(supplier_code),
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
        name: "Create supplier_field_mapping",
        sql: `CREATE TABLE IF NOT EXISTS supplier_field_mapping (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          supplier_code TEXT NOT NULL REFERENCES supplier_master(supplier_code),
          tbo_field TEXT NOT NULL,
          supplier_field TEXT NOT NULL,
          transform_rule JSONB,
          is_active BOOLEAN DEFAULT true,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(supplier_code, tbo_field)
        )`,
      },
      {
        name: "Create hotel_dedup_audit",
        sql: `CREATE TABLE IF NOT EXISTS hotel_dedup_audit (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          primary_property_id UUID REFERENCES hotel_master(property_id),
          duplicate_property_id UUID,
          supplier_code TEXT,
          match_method TEXT,
          confidence_score NUMERIC(3, 2),
          action TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
      },
      {
        name: "Seed supplier_master",
        sql: `INSERT INTO supplier_master (supplier_code, name, enabled, priority) 
        VALUES 
          ('RATEHAWK', 'RateHawk (WorldOTA)', true, 100),
          ('HOTELBEDS', 'Hotelbeds', false, 90),
          ('TBO', 'Travel Boutique Online', false, 80)
        ON CONFLICT (supplier_code) DO NOTHING`,
      },
      {
        name: "Create index: idx_hotel_giata",
        sql: `CREATE INDEX IF NOT EXISTS idx_hotel_giata ON hotel_master(giata_id)`,
      },
      {
        name: "Create index: idx_hotel_chain_brand",
        sql: `CREATE INDEX IF NOT EXISTS idx_hotel_chain_brand ON hotel_master(chain_code, brand_code)`,
      },
      {
        name: "Create index: idx_hotel_city_country",
        sql: `CREATE INDEX IF NOT EXISTS idx_hotel_city_country ON hotel_master(city, country)`,
      },
      {
        name: "Create index: idx_hotel_coordinates",
        sql: `CREATE INDEX IF NOT EXISTS idx_hotel_coordinates ON hotel_master(lat, lng)`,
      },
      {
        name: "Create index: idx_map_property_id",
        sql: `CREATE INDEX IF NOT EXISTS idx_map_property_id ON hotel_supplier_map(property_id)`,
      },
      {
        name: "Create index: idx_map_supplier_code",
        sql: `CREATE INDEX IF NOT EXISTS idx_map_supplier_code ON hotel_supplier_map(supplier_code)`,
      },
      {
        name: "Create index: idx_offer_property",
        sql: `CREATE INDEX IF NOT EXISTS idx_offer_property ON room_offer(property_id)`,
      },
      {
        name: "Create index: idx_offer_price",
        sql: `CREATE INDEX IF NOT EXISTS idx_offer_price ON room_offer(price_total, currency)`,
      },
      {
        name: "Create index: idx_offer_supplier",
        sql: `CREATE INDEX IF NOT EXISTS idx_offer_supplier ON room_offer(supplier_code)`,
      },
      {
        name: "Create index: idx_offer_expires",
        sql: `CREATE INDEX IF NOT EXISTS idx_offer_expires ON room_offer(expires_at)`,
      },
      {
        name: "Create index: idx_offer_search",
        sql: `CREATE INDEX IF NOT EXISTS idx_offer_search ON room_offer(search_checkin, search_checkout)`,
      },
    ];

    for (const query of queries) {
      try {
        console.log(`Executing: ${query.name}...`);
        await client.query(query.sql);
        console.log(`  ✓ ${query.name}\n`);
      } catch (error) {
        console.error(`  ✗ ${query.name}: ${error.message}\n`);
        throw error;
      }
    }

    console.log("✅ All migrations applied successfully!\n");

    // Verify
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('supplier_master', 'hotel_master', 'hotel_supplier_map', 'room_offer', 'supplier_field_mapping', 'hotel_dedup_audit')
      ORDER BY table_name
    `);

    console.log("Created tables:");
    tables.rows.forEach((row) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    process.exitCode = 0;
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
    setTimeout(() => process.exit(), 300);
  }
})();
