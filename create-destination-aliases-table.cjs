/**
 * Create destination_aliases table and seed with common aliases
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

async function createAliasesTable() {
  console.log("🔨 Creating destination_aliases table...");
  
  try {
    // Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS destination_aliases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dest_type VARCHAR(10) NOT NULL CHECK (dest_type IN ('region', 'country', 'city')),
        dest_id UUID NOT NULL,
        alias VARCHAR(100) NOT NULL,
        weight SMALLINT DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_aliases_dest_type ON destination_aliases (dest_type);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_aliases_dest_id ON destination_aliases (dest_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_aliases_alias_trgm ON destination_aliases USING gin (alias gin_trgm_ops);
    `);
    
    console.log("✅ Table and indexes created successfully");

    // Get some destination IDs for seeding
    const dubaiiResult = await pool.query("SELECT id FROM cities WHERE name ILIKE 'Dubai%' LIMIT 1");
    const mumbaiResult = await pool.query("SELECT id FROM cities WHERE name ILIKE 'Mumbai%' LIMIT 1");
    const varanasiiResult = await pool.query("SELECT id FROM cities WHERE name ILIKE 'Varanasi%' LIMIT 1");
    const beijinggResult = await pool.query("SELECT id FROM cities WHERE name ILIKE 'Beijing%' LIMIT 1");
    
    // Seed with common aliases
    const aliases = [];
    
    if (dubaiiResult.rows.length > 0) {
      aliases.push(['city', dubaiiResult.rows[0].id, 'DXB', 10]);
      aliases.push(['city', dubaiiResult.rows[0].id, 'Dubai Airport', 8]);
    }
    
    if (mumbaiResult.rows.length > 0) {
      aliases.push(['city', mumbaiResult.rows[0].id, 'Bombay', 10]);
      aliases.push(['city', mumbaiResult.rows[0].id, 'BOM', 8]);
    }
    
    if (varanasiiResult.rows.length > 0) {
      aliases.push(['city', varanasiiResult.rows[0].id, 'Benares', 8]);
      aliases.push(['city', varanasiiResult.rows[0].id, 'Kashi', 6]);
    }
    
    if (beijinggResult.rows.length > 0) {
      aliases.push(['city', beijinggResult.rows[0].id, 'Peking', 6]);
    }
    
    // Insert aliases
    for (const [destType, destId, alias, weight] of aliases) {
      try {
        await pool.query(`
          INSERT INTO destination_aliases (dest_type, dest_id, alias, weight)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [destType, destId, alias, weight]);
        console.log(`   ✓ Added alias: ${alias} → ${destType}`);
      } catch (error) {
        console.log(`   ❌ Failed to add alias ${alias}: ${error.message}`);
      }
    }
    
    // Show final count
    const countResult = await pool.query("SELECT COUNT(*) as total FROM destination_aliases");
    console.log(`\n📊 Total aliases: ${countResult.rows[0].total}`);
    
    console.log("\n🎉 Destination aliases table created and seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

createAliasesTable().catch(console.error);
