const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// European countries with their ISO2 codes
const europeanCountries = [
  'AD', 'AL', 'AT', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GE', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SK', 'SM', 'UA', 'VA'
];

// Major cities for European countries
const europeanCities = [
  // France
  { country_iso2: 'FR', name: 'Paris', code: 'PAR' },
  { country_iso2: 'FR', name: 'Lyon', code: 'LYO' },
  { country_iso2: 'FR', name: 'Marseille', code: 'MRS' },
  { country_iso2: 'FR', name: 'Nice', code: 'NCE' },
  
  // Italy
  { country_iso2: 'IT', name: 'Rome', code: 'ROM' },
  { country_iso2: 'IT', name: 'Milan', code: 'MIL' },
  { country_iso2: 'IT', name: 'Venice', code: 'VCE' },
  { country_iso2: 'IT', name: 'Florence', code: 'FLR' },
  { country_iso2: 'IT', name: 'Naples', code: 'NAP' },
  
  // Spain
  { country_iso2: 'ES', name: 'Madrid', code: 'MAD' },
  { country_iso2: 'ES', name: 'Barcelona', code: 'BCN' },
  { country_iso2: 'ES', name: 'Seville', code: 'SVQ' },
  { country_iso2: 'ES', name: 'Valencia', code: 'VLC' },
  
  // Germany
  { country_iso2: 'DE', name: 'Berlin', code: 'BER' },
  { country_iso2: 'DE', name: 'Munich', code: 'MUC' },
  { country_iso2: 'DE', name: 'Frankfurt', code: 'FRA' },
  { country_iso2: 'DE', name: 'Hamburg', code: 'HAM' },
  
  // United Kingdom
  { country_iso2: 'GB', name: 'London', code: 'LON' },
  { country_iso2: 'GB', name: 'Edinburgh', code: 'EDI' },
  { country_iso2: 'GB', name: 'Manchester', code: 'MAN' },
  { country_iso2: 'GB', name: 'Liverpool', code: 'LPL' },
  
  // Netherlands
  { country_iso2: 'NL', name: 'Amsterdam', code: 'AMS' },
  { country_iso2: 'NL', name: 'Rotterdam', code: 'RTM' },
  { country_iso2: 'NL', name: 'The Hague', code: 'HAG' },
  
  // Austria
  { country_iso2: 'AT', name: 'Vienna', code: 'VIE' },
  { country_iso2: 'AT', name: 'Salzburg', code: 'SZG' },
  { country_iso2: 'AT', name: 'Innsbruck', code: 'INN' },
  
  // Switzerland
  { country_iso2: 'CH', name: 'Zurich', code: 'ZUR' },
  { country_iso2: 'CH', name: 'Geneva', code: 'GVA' },
  { country_iso2: 'CH', name: 'Basel', code: 'BSL' },
  
  // Belgium
  { country_iso2: 'BE', name: 'Brussels', code: 'BRU' },
  { country_iso2: 'BE', name: 'Antwerp', code: 'ANR' },
  { country_iso2: 'BE', name: 'Bruges', code: 'BRG' },
  
  // Portugal
  { country_iso2: 'PT', name: 'Lisbon', code: 'LIS' },
  { country_iso2: 'PT', name: 'Porto', code: 'OPO' },
  
  // Greece
  { country_iso2: 'GR', name: 'Athens', code: 'ATH' },
  { country_iso2: 'GR', name: 'Thessaloniki', code: 'SKG' },
  { country_iso2: 'GR', name: 'Mykonos', code: 'JMK' },
  { country_iso2: 'GR', name: 'Santorini', code: 'JTR' },
  
  // Czech Republic
  { country_iso2: 'CZ', name: 'Prague', code: 'PRG' },
  
  // Poland
  { country_iso2: 'PL', name: 'Warsaw', code: 'WAW' },
  { country_iso2: 'PL', name: 'Krakow', code: 'KRK' },
  
  // Hungary
  { country_iso2: 'HU', name: 'Budapest', code: 'BUD' },
  
  // Croatia
  { country_iso2: 'HR', name: 'Zagreb', code: 'ZAG' },
  { country_iso2: 'HR', name: 'Dubrovnik', code: 'DBV' },
  { country_iso2: 'HR', name: 'Split', code: 'SPU' },
  
  // Ireland
  { country_iso2: 'IE', name: 'Dublin', code: 'DUB' },
  { country_iso2: 'IE', name: 'Cork', code: 'ORK' },
  
  // Denmark
  { country_iso2: 'DK', name: 'Copenhagen', code: 'CPH' },
  
  // Sweden
  { country_iso2: 'SE', name: 'Stockholm', code: 'STO' },
  { country_iso2: 'SE', name: 'Gothenburg', code: 'GOT' },
  
  // Norway
  { country_iso2: 'NO', name: 'Oslo', code: 'OSL' },
  { country_iso2: 'NO', name: 'Bergen', code: 'BGO' },
  
  // Finland
  { country_iso2: 'FI', name: 'Helsinki', code: 'HEL' },
  
  // Iceland
  { country_iso2: 'IS', name: 'Reykjavik', code: 'REK' }
];

async function fixDestinationsData() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== FIXING DESTINATIONS DATA ===\n');
    
    await client.query('BEGIN');
    
    // Step 1: Link European countries to Europe region
    console.log('1. Linking European countries to Europe region...');
    
    const europeRegionId = 2; // Europe region ID
    const europeanCountriesStr = europeanCountries.map(iso => `'${iso}'`).join(',');
    
    const linkCountriesQuery = `
      UPDATE countries 
      SET region_id = $1, updated_at = NOW()
      WHERE iso2 IN (${europeanCountriesStr})
    `;
    
    const linkResult = await client.query(linkCountriesQuery, [europeRegionId]);
    console.log(`✅ Linked ${linkResult.rowCount} European countries to Europe region`);
    
    // Step 2: Verify countries are linked
    const linkedCountriesQuery = `
      SELECT COUNT(*) as count 
      FROM countries 
      WHERE region_id = $1
    `;
    
    const linkedResult = await client.query(linkedCountriesQuery, [europeRegionId]);
    console.log(`✅ Verified: ${linkedResult.rows[0].count} countries now linked to Europe`);
    
    // Step 3: Add cities for European countries
    console.log('\n2. Adding cities for European countries...');
    
    let citiesAdded = 0;
    
    for (const city of europeanCities) {
      try {
        // Get country ID for the ISO2 code
        const countryQuery = `
          SELECT id FROM countries WHERE iso2 = $1
        `;
        const countryResult = await client.query(countryQuery, [city.country_iso2]);
        
        if (countryResult.rows.length > 0) {
          const countryId = countryResult.rows[0].id;
          
          // Insert city
          const insertCityQuery = `
            INSERT INTO cities (country_id, region_id, name, code, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
            ON CONFLICT (country_id, name) DO UPDATE SET
              code = EXCLUDED.code,
              region_id = EXCLUDED.region_id,
              is_active = EXCLUDED.is_active,
              updated_at = NOW()
          `;
          
          await client.query(insertCityQuery, [countryId, europeRegionId, city.name, city.code]);
          citiesAdded++;
        } else {
          console.log(`⚠️  Country not found for ISO2: ${city.country_iso2}`);
        }
      } catch (error) {
        console.error(`❌ Error adding city ${city.name}:`, error.message);
      }
    }
    
    console.log(`✅ Added/updated ${citiesAdded} cities`);
    
    // Step 4: Verify final state
    console.log('\n3. Verifying final state...');
    
    const finalStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM regions WHERE is_active = TRUE) as regions_count,
        (SELECT COUNT(*) FROM countries WHERE region_id IS NOT NULL) as countries_with_regions,
        (SELECT COUNT(*) FROM countries WHERE region_id = 2) as europe_countries,
        (SELECT COUNT(*) FROM cities WHERE is_active = TRUE) as cities_count,
        (SELECT COUNT(*) FROM cities WHERE region_id = 2) as europe_cities
    `;
    
    const statsResult = await client.query(finalStatsQuery);
    const stats = statsResult.rows[0];
    
    console.log('Final statistics:');
    console.log(`- Active regions: ${stats.regions_count}`);
    console.log(`- Countries with regions: ${stats.countries_with_regions}`);
    console.log(`- Europe countries: ${stats.europe_countries}`);
    console.log(`- Active cities: ${stats.cities_count}`);
    console.log(`- Europe cities: ${stats.europe_cities}`);
    
    // Step 5: Test the cities query that the API will use
    console.log('\n4. Testing API query for Europe cities...');
    const testCitiesQuery = `
      SELECT
        ci.id, ci.name, ci.code,
        jsonb_build_object(
          'id', co.id,
          'name', co.name,
          'iso', co.iso2
        ) as country
      FROM cities ci
      JOIN countries co ON co.id = ci.country_id
      WHERE ci.is_active = TRUE
        AND (co.region_id = $1 OR ci.region_id = $1)
      ORDER BY ci.name
      LIMIT 10
    `;
    
    const testResult = await client.query(testCitiesQuery, [europeRegionId]);
    console.log(`✅ API query returns ${testResult.rows.length} cities for Europe`);
    console.log('Sample cities:', testResult.rows.slice(0, 5).map(c => `${c.name} (${c.country.name})`));
    
    await client.query('COMMIT');
    console.log('\n✅ All data fixes completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing destinations data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDestinationsData();
