/**
 * Apply Complete Destinations Schema v2
 * This replaces the existing schema with the authoritative version
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

async function applySchema() {
  console.log("🔨 Applying Complete Destinations Schema v2...");
  console.log("⚠️  This will drop and recreate destinations tables");
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, "api/database/migrations/complete-destinations-schema-v2.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    
    console.log("📋 Executing schema migration...");
    
    // Execute the schema
    await pool.query(schemaSql);
    
    console.log("✅ Schema applied successfully!");
    
    // Verify the setup
    console.log("\n🔍 Verifying setup...");
    
    // Check tables
    const tablesResult = await pool.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN ('regions', 'countries', 'cities', 'destination_aliases')
      ORDER BY table_name;
    `);
    
    console.log("📊 Tables created:");
    tablesResult.rows.forEach(table => {
      console.log(`   ✓ ${table.table_name} (${table.column_count} columns)`);
    });
    
    // Check materialized view
    const mvResult = await pool.query(`
      SELECT COUNT(*) as row_count 
      FROM destinations_search_mv;
    `);
    console.log(`   ✓ destinations_search_mv (${mvResult.rows[0].row_count} rows)`);
    
    // Check indexes
    const indexResult = await pool.query(`
      SELECT COUNT(*) as index_count
      FROM pg_indexes 
      WHERE tablename IN ('regions', 'countries', 'cities', 'destination_aliases', 'destinations_search_mv')
        AND schemaname = 'public';
    `);
    console.log(`   ✓ ${indexResult.rows[0].index_count} indexes created`);
    
    // Check search function
    const functionResult = await pool.query(`
      SELECT COUNT(*) as function_count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'search_destinations';
    `);
    console.log(`   ✓ search_destinations function: ${functionResult.rows[0].function_count > 0 ? 'created' : 'not found'}`);
    
    // Test the search function
    console.log("\n🧪 Testing search function...");
    const testResult = await pool.query(`
      SELECT type, label, score, source 
      FROM search_destinations('test', 5) 
      LIMIT 3;
    `);
    console.log(`   ✓ Search function returns ${testResult.rows.length} test results`);
    
    console.log("\n🎉 Complete Destinations Schema v2 ready!");
    console.log("📝 Next steps:");
    console.log("   1. Seed data (regions, countries, cities, aliases)");
    console.log("   2. Update API endpoints to use new schema");
    console.log("   3. Update admin panel");
    console.log("   4. Test search functionality");
    
  } catch (error) {
    console.error("❌ Schema application failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await pool.end();
  }
}

applySchema().catch(console.error);
