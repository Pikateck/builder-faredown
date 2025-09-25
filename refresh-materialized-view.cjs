/**
 * Refresh the materialized view and test search functionality
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

async function refreshAndTest() {
  console.log("🔄 Refreshing materialized view and testing search...");
  
  try {
    // Refresh the materialized view
    console.log("📊 Refreshing destinations_search_mv...");
    await pool.query(`REFRESH MATERIALIZED VIEW destinations_search_mv`);
    
    // Check the count
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM destinations_search_mv`);
    console.log(`✅ Materialized view refreshed: ${countResult.rows[0].count} items`);
    
    // Check sample data
    const sampleResult = await pool.query(`
      SELECT type, label, label_with_country, is_active 
      FROM destinations_search_mv 
      ORDER BY type, label 
      LIMIT 10
    `);
    
    console.log("\n📋 Sample data in materialized view:");
    sampleResult.rows.forEach(row => {
      console.log(`   ${row.type}: ${row.label_with_country || row.label} (active: ${row.is_active})`);
    });
    
    // Test search function
    console.log("\n🔍 Testing search function...");
    const searchTests = ['dubai', 'paris', 'europe', 'india', 'dxb'];
    
    for (const query of searchTests) {
      const searchResult = await pool.query(`
        SELECT type, label, score, source 
        FROM search_destinations($1, 3)
        ORDER BY score DESC
      `, [query]);
      
      console.log(`\n   "${query}": ${searchResult.rows.length} results`);
      searchResult.rows.forEach(row => {
        console.log(`      ${row.type}: ${row.label} (score: ${parseFloat(row.score).toFixed(2)}, source: ${row.source})`);
      });
    }
    
    console.log("\n🎉 Materialized view refreshed and search tested!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

refreshAndTest().catch(console.error);
