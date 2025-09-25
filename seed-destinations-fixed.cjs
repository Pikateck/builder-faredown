/**
 * Fixed Seeding Script for Complete Destinations Dataset v2
 * Temporarily disables triggers to avoid materialized view refresh issues
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

async function seedDestinationsFixed() {
  console.log("🌱 Seeding Complete Destinations Dataset v2 (Fixed)...");
  
  try {
    // Temporarily disable triggers
    console.log("🔧 Disabling triggers for faster seeding...");
    await pool.query(`DROP TRIGGER IF EXISTS refresh_mv_after_regions ON regions`);
    await pool.query(`DROP TRIGGER IF EXISTS refresh_mv_after_countries ON countries`);
    await pool.query(`DROP TRIGGER IF EXISTS refresh_mv_after_cities ON cities`);
    await pool.query(`DROP TRIGGER IF EXISTS refresh_mv_after_aliases ON destination_aliases`);

    // Step 1: Clear existing data
    console.log("🧹 Clearing existing data...");
    await pool.query(`DELETE FROM destination_aliases`);
    await pool.query(`DELETE FROM cities`);
    await pool.query(`DELETE FROM countries`);
    await pool.query(`DELETE FROM regions`);

    // Step 2: Seed Regions
    console.log("\n📍 Seeding Regions...");
    const regions = [
      { code: 'WORLD', name: 'World', level: 'global', sort_order: 1 },
      { code: 'EUROPE', name: 'Europe', level: 'country-group', sort_order: 10 },
      { code: 'ASIA', name: 'Asia', level: 'country-group', sort_order: 20 },
      { code: 'AFRICA', name: 'Africa', level: 'country-group', sort_order: 30 },
      { code: 'AMERICAS', name: 'Americas', level: 'country-group', sort_order: 40 },
      { code: 'ANZ', name: 'Australia & New Zealand', level: 'country-group', sort_order: 50 },
      { code: 'MIDDLE_EAST', name: 'Middle East', level: 'country-group', sort_order: 60 },
      { code: 'SEA', name: 'South East Asia', level: 'country-group', sort_order: 70 },
      { code: 'NORTHEAST_ASIA', name: 'Japan China Korea Taiwan', level: 'country-group', sort_order: 80 },
      { code: 'NORTH_INDIA', name: 'North India', level: 'india-subregion', sort_order: 110 },
      { code: 'SOUTH_INDIA', name: 'South India', level: 'india-subregion', sort_order: 120 },
      { code: 'EAST_NE_INDIA', name: 'East & North East India', level: 'india-subregion', sort_order: 130 },
      { code: 'RAJASTHAN_WEST_CENTRAL', name: 'Rajasthan West & Central India', level: 'india-subregion', sort_order: 140 },
      { code: 'KASHMIR', name: 'Kashmir', level: 'india-subregion', sort_order: 150 },
      { code: 'LEH_LADAKH', name: 'Leh–Ladakh', level: 'india-subregion', sort_order: 160 },
    ];

    for (const region of regions) {
      await pool.query(`
        INSERT INTO regions (code, name, level, sort_order)
        VALUES ($1, $2, $3, $4)
      `, [region.code, region.name, region.level, region.sort_order]);
      console.log(`   ✓ ${region.name}`);
    }

    // Step 3: Seed key countries
    console.log("\n🌍 Seeding Countries...");
    const countries = [
      // Europe
      { name: 'France', iso2: 'FR', region: 'EUROPE', sort_order: 10 },
      { name: 'Italy', iso2: 'IT', region: 'EUROPE', sort_order: 20 },
      { name: 'Spain', iso2: 'ES', region: 'EUROPE', sort_order: 30 },
      { name: 'Switzerland', iso2: 'CH', region: 'EUROPE', sort_order: 40 },
      { name: 'United Kingdom', iso2: 'GB', region: 'EUROPE', sort_order: 50 },
      { name: 'Germany', iso2: 'DE', region: 'EUROPE', sort_order: 60 },
      { name: 'Netherlands', iso2: 'NL', region: 'EUROPE', sort_order: 70 },
      { name: 'Czech Republic', iso2: 'CZ', region: 'EUROPE', sort_order: 80 },
      { name: 'Greece', iso2: 'GR', region: 'EUROPE', sort_order: 90 },
      { name: 'Austria', iso2: 'AT', region: 'EUROPE', sort_order: 100 },
      
      // Middle East
      { name: 'United Arab Emirates', iso2: 'AE', region: 'MIDDLE_EAST', sort_order: 10 },
      { name: 'Oman', iso2: 'OM', region: 'MIDDLE_EAST', sort_order: 20 },
      { name: 'Qatar', iso2: 'QA', region: 'MIDDLE_EAST', sort_order: 30 },
      { name: 'Jordan', iso2: 'JO', region: 'MIDDLE_EAST', sort_order: 40 },
      
      // Asia
      { name: 'India', iso2: 'IN', region: 'ASIA', sort_order: 10 },
      { name: 'Sri Lanka', iso2: 'LK', region: 'ASIA', sort_order: 20 },
      { name: 'Nepal', iso2: 'NP', region: 'ASIA', sort_order: 30 },
      { name: 'Maldives', iso2: 'MV', region: 'ASIA', sort_order: 40 },
      
      // South East Asia
      { name: 'Singapore', iso2: 'SG', region: 'SEA', sort_order: 10 },
      { name: 'Malaysia', iso2: 'MY', region: 'SEA', sort_order: 20 },
      { name: 'Thailand', iso2: 'TH', region: 'SEA', sort_order: 30 },
      { name: 'Vietnam', iso2: 'VN', region: 'SEA', sort_order: 40 },
      { name: 'Indonesia', iso2: 'ID', region: 'SEA', sort_order: 50 },
      
      // Northeast Asia
      { name: 'Japan', iso2: 'JP', region: 'NORTHEAST_ASIA', sort_order: 10 },
      { name: 'China', iso2: 'CN', region: 'NORTHEAST_ASIA', sort_order: 20 },
      { name: 'South Korea', iso2: 'KR', region: 'NORTHEAST_ASIA', sort_order: 30 },
      { name: 'Hong Kong', iso2: 'HK', region: 'NORTHEAST_ASIA', sort_order: 40 },
      
      // Africa
      { name: 'Egypt', iso2: 'EG', region: 'AFRICA', sort_order: 10 },
      { name: 'South Africa', iso2: 'ZA', region: 'AFRICA', sort_order: 20 },
      { name: 'Mauritius', iso2: 'MU', region: 'AFRICA', sort_order: 30 },
      
      // Americas
      { name: 'United States', iso2: 'US', region: 'AMERICAS', sort_order: 10 },
      { name: 'Canada', iso2: 'CA', region: 'AMERICAS', sort_order: 20 },
      
      // ANZ
      { name: 'Australia', iso2: 'AU', region: 'ANZ', sort_order: 10 },
      { name: 'New Zealand', iso2: 'NZ', region: 'ANZ', sort_order: 20 },
    ];

    for (const country of countries) {
      const regionResult = await pool.query(`SELECT id FROM regions WHERE code = $1`, [country.region]);
      const regionId = regionResult.rows[0].id;
      
      await pool.query(`
        INSERT INTO countries (name, iso2, region_id, sort_order)
        VALUES ($1, $2, $3, $4)
      `, [country.name, country.iso2, regionId, country.sort_order]);
      console.log(`   ✓ ${country.name}`);
    }

    // Step 4: Seed key cities
    console.log("\n🏙️  Seeding Cities...");
    const cities = [
      // Europe
      { name: 'Paris', country: 'France', sort_order: 10 },
      { name: 'Rome', country: 'Italy', sort_order: 10 },
      { name: 'Venice', country: 'Italy', sort_order: 20 },
      { name: 'London', country: 'United Kingdom', sort_order: 10 },
      { name: 'Barcelona', country: 'Spain', sort_order: 10 },
      { name: 'Geneva', country: 'Switzerland', sort_order: 10 },
      { name: 'Zurich', country: 'Switzerland', sort_order: 20 },
      { name: 'Amsterdam', country: 'Netherlands', sort_order: 10 },
      { name: 'Prague', country: 'Czech Republic', sort_order: 10 },
      { name: 'Athens', country: 'Greece', sort_order: 10 },
      { name: 'Vienna', country: 'Austria', sort_order: 10 },
      
      // Middle East
      { name: 'Dubai', country: 'United Arab Emirates', sort_order: 10 },
      { name: 'Abu Dhabi', country: 'United Arab Emirates', sort_order: 20 },
      { name: 'Muscat', country: 'Oman', sort_order: 10 },
      { name: 'Doha', country: 'Qatar', sort_order: 10 },
      { name: 'Petra', country: 'Jordan', sort_order: 10 },
      
      // Asia
      { name: 'Mumbai', country: 'India', region: 'SOUTH_INDIA', sort_order: 10 },
      { name: 'Delhi', country: 'India', region: 'NORTH_INDIA', sort_order: 20 },
      { name: 'Goa', country: 'India', region: 'SOUTH_INDIA', sort_order: 30 },
      { name: 'Jaipur', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 40 },
      { name: 'Udaipur', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 50 },
      { name: 'Agra', country: 'India', region: 'NORTH_INDIA', sort_order: 60 },
      { name: 'Varanasi', country: 'India', region: 'NORTH_INDIA', sort_order: 70 },
      { name: 'Kochi', country: 'India', region: 'SOUTH_INDIA', sort_order: 80 },
      { name: 'Srinagar', country: 'India', region: 'KASHMIR', sort_order: 90 },
      { name: 'Leh', country: 'India', region: 'LEH_LADAKH', sort_order: 100 },
      { name: 'Colombo', country: 'Sri Lanka', sort_order: 10 },
      { name: 'Kathmandu', country: 'Nepal', sort_order: 10 },
      { name: 'Male', country: 'Maldives', sort_order: 10 },
      
      // South East Asia
      { name: 'Singapore', country: 'Singapore', sort_order: 10 },
      { name: 'Kuala Lumpur', country: 'Malaysia', sort_order: 10 },
      { name: 'Bangkok', country: 'Thailand', sort_order: 10 },
      { name: 'Phuket', country: 'Thailand', sort_order: 20 },
      { name: 'Hanoi', country: 'Vietnam', sort_order: 10 },
      { name: 'Bali', country: 'Indonesia', sort_order: 10 },
      
      // Northeast Asia
      { name: 'Tokyo', country: 'Japan', sort_order: 10 },
      { name: 'Kyoto', country: 'Japan', sort_order: 20 },
      { name: 'Beijing', country: 'China', sort_order: 10 },
      { name: 'Shanghai', country: 'China', sort_order: 20 },
      { name: 'Seoul', country: 'South Korea', sort_order: 10 },
      { name: 'Hong Kong', country: 'Hong Kong', sort_order: 10 },
      
      // Africa
      { name: 'Cairo', country: 'Egypt', sort_order: 10 },
      { name: 'Luxor', country: 'Egypt', sort_order: 20 },
      { name: 'Cape Town', country: 'South Africa', sort_order: 10 },
      { name: 'Port Louis', country: 'Mauritius', sort_order: 10 },
      
      // Americas
      { name: 'New York', country: 'United States', sort_order: 10 },
      { name: 'Las Vegas', country: 'United States', sort_order: 20 },
      { name: 'Los Angeles', country: 'United States', sort_order: 30 },
      { name: 'Toronto', country: 'Canada', sort_order: 10 },
      
      // ANZ
      { name: 'Sydney', country: 'Australia', sort_order: 10 },
      { name: 'Melbourne', country: 'Australia', sort_order: 20 },
      { name: 'Auckland', country: 'New Zealand', sort_order: 10 },
    ];

    for (const city of cities) {
      const countryResult = await pool.query(`SELECT id, region_id FROM countries WHERE name = $1`, [city.country]);
      const countryId = countryResult.rows[0].id;
      let regionId = countryResult.rows[0].region_id;
      
      // For India cities with specific regions
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
      console.log(`   ✓ ${city.name}, ${city.country}`);
    }

    // Step 5: Seed Aliases
    console.log("\n🔤 Seeding Aliases...");
    const aliases = [
      { dest_type: 'city', dest_name: 'Dubai', alias: 'DXB', weight: 10 },
      { dest_type: 'city', dest_name: 'Mumbai', alias: 'Bombay', weight: 10 },
      { dest_type: 'city', dest_name: 'Mumbai', alias: 'BOM', weight: 8 },
      { dest_type: 'city', dest_name: 'Varanasi', alias: 'Benares', weight: 8 },
      { dest_type: 'city', dest_name: 'Beijing', alias: 'Peking', weight: 6 },
      { dest_type: 'city', dest_name: 'Paris', alias: 'PAR', weight: 8 },
      { dest_type: 'city', dest_name: 'London', alias: 'LON', weight: 8 },
      { dest_type: 'city', dest_name: 'New York', alias: 'NYC', weight: 10 },
      { dest_type: 'city', dest_name: 'Singapore', alias: 'SIN', weight: 8 },
      { dest_type: 'country', dest_name: 'United Arab Emirates', alias: 'UAE', weight: 10 },
      { dest_type: 'country', dest_name: 'United States', alias: 'USA', weight: 10 },
      { dest_type: 'country', dest_name: 'United Kingdom', alias: 'UK', weight: 10 },
    ];

    for (const alias of aliases) {
      let destQuery, destParams;
      
      if (alias.dest_type === 'city') {
        destQuery = `SELECT id FROM cities WHERE name = $1 LIMIT 1`;
      } else if (alias.dest_type === 'country') {
        destQuery = `SELECT id FROM countries WHERE name = $1 LIMIT 1`;
      }
      
      const destResult = await pool.query(destQuery, [alias.dest_name]);
      if (destResult.rows.length > 0) {
        const destId = destResult.rows[0].id;
        
        await pool.query(`
          INSERT INTO destination_aliases (dest_type, dest_id, alias, weight)
          VALUES ($1, $2, $3, $4)
        `, [alias.dest_type, destId, alias.alias, alias.weight]);
        console.log(`   ✓ ${alias.alias} → ${alias.dest_name}`);
      }
    }

    // Step 6: Refresh materialized view
    console.log("\n🔄 Refreshing search index...");
    await pool.query(`REFRESH MATERIALIZED VIEW destinations_search_mv`);

    // Step 7: Recreate triggers
    console.log("🔧 Recreating triggers...");
    await pool.query(`
      CREATE TRIGGER refresh_mv_after_cities
      AFTER INSERT OR UPDATE OR DELETE ON cities
      FOR EACH STATEMENT EXECUTE PROCEDURE refresh_destinations_mv();
    `);
    await pool.query(`
      CREATE TRIGGER refresh_mv_after_countries
      AFTER INSERT OR UPDATE OR DELETE ON countries
      FOR EACH STATEMENT EXECUTE PROCEDURE refresh_destinations_mv();
    `);
    await pool.query(`
      CREATE TRIGGER refresh_mv_after_regions
      AFTER INSERT OR UPDATE OR DELETE ON regions
      FOR EACH STATEMENT EXECUTE PROCEDURE refresh_destinations_mv();
    `);
    await pool.query(`
      CREATE TRIGGER refresh_mv_after_aliases
      AFTER INSERT OR UPDATE OR DELETE ON destination_aliases
      FOR EACH STATEMENT EXECUTE PROCEDURE refresh_destinations_mv();
    `);

    // Step 8: Final statistics
    console.log("\n📊 Final Statistics:");
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM regions WHERE is_active) as regions,
        (SELECT COUNT(*) FROM countries WHERE is_active) as countries,
        (SELECT COUNT(*) FROM cities WHERE is_active) as cities,
        (SELECT COUNT(*) FROM destination_aliases WHERE is_active) as aliases,
        (SELECT COUNT(*) FROM destinations_search_mv WHERE is_active) as searchable_items
    `);
    
    const stat = stats.rows[0];
    console.log(`   📍 Regions: ${stat.regions}`);
    console.log(`   🌍 Countries: ${stat.countries}`);
    console.log(`   🏙️  Cities: ${stat.cities}`);
    console.log(`   🔤 Aliases: ${stat.aliases}`);
    console.log(`   🔍 Searchable items: ${stat.searchable_items}`);

    console.log("\n🎉 Complete destinations dataset seeded successfully!");
    console.log("✅ Ready for search testing");

  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  } finally {
    await pool.end();
  }
}

seedDestinationsFixed().catch(console.error);
