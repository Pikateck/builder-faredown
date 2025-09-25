/**
 * Complete seeding with missing key destinations and aliases
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

async function completeKeyDestinations() {
  console.log("🔧 Adding missing key destinations and aliases...");
  
  try {
    // Add missing cities that should be in the tests
    const missingCities = [
      { name: 'Dubai', country: 'United Arab Emirates', sort_order: 10 },
      { name: 'Mumbai', country: 'India', region: 'SOUTH_INDIA', sort_order: 220 },
    ];

    console.log("\n🏙️  Adding missing cities...");
    for (const city of missingCities) {
      // Check if city already exists
      const existingCheck = await pool.query(`
        SELECT c.id FROM cities c
        JOIN countries co ON c.country_id = co.id
        WHERE c.name = $1 AND co.name = $2
      `, [city.name, city.country]);

      if (existingCheck.rows.length > 0) {
        console.log(`   ✓ ${city.name} already exists`);
        continue;
      }

      // Get country and region IDs
      const countryResult = await pool.query(`SELECT id, region_id FROM countries WHERE name = $1`, [city.country]);
      if (countryResult.rows.length === 0) {
        console.log(`   ⚠️  Country ${city.country} not found for ${city.name}`);
        continue;
      }
      
      const countryId = countryResult.rows[0].id;
      let regionId = countryResult.rows[0].region_id;
      
      // For cities with specific regions (like India subregions)
      if (city.region) {
        const subregionResult = await pool.query(`SELECT id FROM regions WHERE code = $1`, [city.region]);
        if (subregionResult.rows.length > 0) {
          regionId = subregionResult.rows[0].id;
        }
      }
      
      await pool.query(`
        INSERT INTO cities (name, country_id, region_id, sort_order, is_package_destination)
        VALUES ($1, $2, $3, $4, $5)
      `, [city.name, countryId, regionId, city.sort_order, true]);
      
      console.log(`   ✓ Added ${city.name}, ${city.country}`);
    }

    // Add missing aliases
    console.log("\n🔤 Adding key aliases...");
    const keyAliases = [
      { dest_type: 'city', dest_name: 'Dubai', alias: 'DXB', weight: 10 },
      { dest_type: 'city', dest_name: 'Mumbai', alias: 'BOM', weight: 8 },
      { dest_type: 'city', dest_name: 'Mumbai', alias: 'Bombay', weight: 10 },
      { dest_type: 'country', dest_name: 'United Arab Emirates', alias: 'UAE', weight: 10 },
      { dest_type: 'country', dest_name: 'United Kingdom', alias: 'UK', weight: 10 },
      { dest_type: 'city', dest_name: 'Delhi', alias: 'DEL', weight: 8 },
      { dest_type: 'city', dest_name: 'Paris', alias: 'PAR', weight: 8 },
      { dest_type: 'city', dest_name: 'London', alias: 'LON', weight: 8 },
    ];

    for (const alias of keyAliases) {
      // Check if alias already exists
      const existingAlias = await pool.query(`
        SELECT id FROM destination_aliases WHERE alias = $1
      `, [alias.alias]);

      if (existingAlias.rows.length > 0) {
        console.log(`   ✓ Alias ${alias.alias} already exists`);
        continue;
      }

      // Find destination ID
      let destQuery, destParams;
      
      if (alias.dest_type === 'city') {
        destQuery = `SELECT id FROM cities WHERE name = $1 LIMIT 1`;
      } else if (alias.dest_type === 'country') {
        destQuery = `SELECT id FROM countries WHERE name = $1 LIMIT 1`;
      } else if (alias.dest_type === 'region') {
        destQuery = `SELECT id FROM regions WHERE name = $1 LIMIT 1`;
      }
      
      const destResult = await pool.query(destQuery, [alias.dest_name]);
      if (destResult.rows.length === 0) {
        console.log(`   ⚠️  ${alias.dest_type} ${alias.dest_name} not found for alias ${alias.alias}`);
        continue;
      }
      
      const destId = destResult.rows[0].id;
      
      await pool.query(`
        INSERT INTO destination_aliases (dest_type, dest_id, alias, weight)
        VALUES ($1, $2, $3, $4)
      `, [alias.dest_type, destId, alias.alias, alias.weight]);
      
      console.log(`   ✓ Added alias: ${alias.alias} → ${alias.dest_name}`);
    }

    // Refresh materialized view
    console.log("\n🔄 Refreshing materialized view...");
    await pool.query(`REFRESH MATERIALIZED VIEW destinations_search_mv`);
    console.log("   ✓ Materialized view refreshed");

    // Check final counts
    console.log("\n📊 Final counts:");
    const finalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM regions WHERE is_active = true) as regions,
        (SELECT COUNT(*) FROM countries WHERE is_active = true) as countries,
        (SELECT COUNT(*) FROM cities WHERE is_active = true) as cities,
        (SELECT COUNT(*) FROM destination_aliases WHERE is_active = true) as aliases,
        (SELECT COUNT(*) FROM destinations_search_mv WHERE is_active = true) as searchable_items
    `);
    
    const stat = finalStats.rows[0];
    console.log(`   📍 Regions: ${stat.regions}`);
    console.log(`   🌍 Countries: ${stat.countries}`);
    console.log(`   🏙️  Cities: ${stat.cities}`);
    console.log(`   🔤 Aliases: ${stat.aliases}`);
    console.log(`   🔍 Searchable items: ${stat.searchable_items}`);

    // Test key searches
    console.log("\n🧪 Testing key searches:");
    const testQueries = ['dubai', 'mumbai', 'dxb', 'bombay', 'uae'];
    
    for (const query of testQueries) {
      const searchResult = await pool.query(`
        SELECT type, label, score 
        FROM search_destinations($1, 3)
        ORDER BY score DESC
      `, [query]);
      
      console.log(`   "${query}": ${searchResult.rows.length} results`);
      searchResult.rows.forEach(row => {
        console.log(`      ${row.type}: ${row.label} (score: ${parseFloat(row.score).toFixed(2)})`);
      });
    }

    console.log("\n🎉 Key destinations and aliases completed!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

completeKeyDestinations().catch(console.error);
