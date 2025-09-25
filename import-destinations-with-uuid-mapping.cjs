#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const csvParser = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ID mapping to convert CSV IDs to UUIDs
const idMapping = {};

async function importDestinationsWithUUIDMapping() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting comprehensive destinations import with UUID mapping...\n');
    
    await client.query('BEGIN');
    
    // Step 1: Clear existing data
    console.log('🗑️  Clearing existing destination data...');
    await client.query('DELETE FROM cities WHERE TRUE');
    await client.query('DELETE FROM countries WHERE TRUE');
    await client.query('DELETE FROM regions WHERE TRUE');
    console.log('✅ Existing data cleared\n');
    
    // Step 2: Import Regions
    console.log('📊 Importing regions...');
    const regions = await parseCSV('destinations_regions.csv');
    
    for (const region of regions) {
      const uuid = uuidv4();
      idMapping[region.region_id] = uuid;
      
      const aliases = region.aliases ? region.aliases.split(',').map(a => a.trim()) : [];
      const searchTokens = [region.name.toLowerCase(), ...aliases.map(a => a.toLowerCase())];
      
      const parentId = region.parent_region_id ? idMapping[region.parent_region_id] : null;
      
      // Map CSV types to database enum values
      let geoLevel;
      switch (region.type) {
        case 'world':
          geoLevel = 'global';
          break;
        case 'country_region':
          geoLevel = 'country';
          break;
        case 'subregion':
          geoLevel = 'subregion';
          break;
        case 'state':
          geoLevel = 'state';
          break;
        default:
          geoLevel = 'region';
      }

      await client.query(`
        INSERT INTO regions (id, name, level, parent_id, slug, search_tokens, search_text, is_active, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)
      `, [
        uuid,
        region.name,
        geoLevel,
        parentId,
        region.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        searchTokens,
        searchTokens.join(' '),
        region.region_id === 'REG-WORLD' ? 0 : (region.parent_region_id ? 20 : 10)
      ]);
    }
    console.log(`✅ Imported ${regions.length} regions\n`);
    
    // Step 3: Import Countries
    console.log('🌍 Importing countries...');
    const countries = await parseCSV('destinations_countries.csv');
    
    for (const country of countries) {
      const uuid = uuidv4();
      idMapping[country.country_id] = uuid;
      
      const aliases = country.aliases ? country.aliases.split(',').map(a => a.trim()) : [];
      const searchTokens = [
        country.name.toLowerCase(), 
        country.iso2?.toLowerCase(), 
        ...aliases.map(a => a.toLowerCase())
      ].filter(Boolean);
      
      const regionId = idMapping[country.region_id];
      
      await client.query(`
        INSERT INTO countries (id, name, iso_code, region_id, slug, search_tokens, search_text, is_active, sort_order) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, 10)
      `, [
        uuid,
        country.name,
        country.iso2,
        regionId,
        country.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        searchTokens,
        searchTokens.join(' ')
      ]);
    }
    console.log(`✅ Imported ${countries.length} countries\n`);
    
    // Step 4: Import Cities
    console.log('🏙️  Importing cities...');
    const cities = await parseCSV('destinations_cities.csv');
    
    for (const city of cities) {
      const uuid = uuidv4();
      idMapping[city.city_id] = uuid;
      
      const aliases = city.aliases ? city.aliases.split(',').map(a => a.trim()) : [];
      const searchTokens = [
        city.name.toLowerCase(),
        ...aliases.map(a => a.toLowerCase())
      ].filter(Boolean);
      
      const countryId = idMapping[city.country_id];
      const regionId = city.region_id ? idMapping[city.region_id] : null;
      
      await client.query(`
        INSERT INTO cities (id, name, country_id, region_id, slug, search_tokens, search_text, is_active, sort_order) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, 10)
      `, [
        uuid,
        city.name,
        countryId,
        regionId,
        city.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        searchTokens,
        searchTokens.join(' ')
      ]);
    }
    console.log(`✅ Imported ${cities.length} cities\n`);
    
    // Step 5: Process additional aliases
    console.log('🔗 Processing additional aliases...');
    const aliases = await parseCSV('destinations_aliases.csv');
    
    for (const alias of aliases) {
      const entityUuid = idMapping[alias.entity_id];
      if (!entityUuid) {
        console.warn(`⚠️  Could not find entity ${alias.entity_id} for alias ${alias.alias}`);
        continue;
      }
      
      if (alias.entity_type === 'country') {
        await client.query(`
          UPDATE countries 
          SET search_tokens = array_append(search_tokens, $1),
              search_text = search_text || ' ' || $1
          WHERE id = $2
        `, [alias.alias.toLowerCase(), entityUuid]);
      } else if (alias.entity_type === 'city') {
        await client.query(`
          UPDATE cities 
          SET search_tokens = array_append(search_tokens, $1),
              search_text = search_text || ' ' || $1
          WHERE id = $2
        `, [alias.alias.toLowerCase(), entityUuid]);
      }
    }
    console.log(`✅ Processed ${aliases.length} additional aliases\n`);
    
    await client.query('COMMIT');
    
    // Step 6: Verify import
    console.log('🔍 Verifying import...\n');
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM regions WHERE is_active = TRUE) as regions_count,
        (SELECT COUNT(*) FROM countries WHERE is_active = TRUE) as countries_count,
        (SELECT COUNT(*) FROM cities WHERE is_active = TRUE) as cities_count
    `);
    
    console.log(`📊 Import Summary:`);
    console.log(`   Regions: ${stats.rows[0].regions_count}`);
    console.log(`   Countries: ${stats.rows[0].countries_count}`);
    console.log(`   Cities: ${stats.rows[0].cities_count}`);
    
    // Test key searches that were problematic before
    console.log('\n🧪 Testing key searches:');
    
    const testQueries = [
      { query: 'dubai', expected: 'Dubai' },
      { query: 'uae', expected: 'United Arab Emirates' },
      { query: 'emirates', expected: 'United Arab Emirates' },
      { query: 'paris', expected: 'Paris' },
      { query: 'nyc', expected: 'New York' },
      { query: 'london', expected: 'London' },
      { query: 'dxb', expected: 'Dubai' },
      { query: 'holland', expected: 'Netherlands' }
    ];
    
    for (const test of testQueries) {
      const searchResult = await client.query(`
        SELECT 
          'city' as type,
          ci.name || ', ' || co.name as label,
          r.name as region,
          1 as priority
        FROM cities ci
        JOIN countries co ON ci.country_id = co.id
        JOIN regions r ON co.region_id = r.id
        WHERE ci.is_active = TRUE 
          AND (ci.search_text ILIKE '%' || $1 || '%' OR $1 = ANY(ci.search_tokens))
        
        UNION ALL
        
        SELECT 
          'country' as type,
          co.name as label,
          r.name as region,
          2 as priority
        FROM countries co
        JOIN regions r ON co.region_id = r.id
        WHERE co.is_active = TRUE 
          AND (co.search_text ILIKE '%' || $1 || '%' OR $1 = ANY(co.search_tokens))
        
        ORDER BY priority, label
        LIMIT 1
      `, [test.query]);
      
      if (searchResult.rows.length > 0) {
        console.log(`   ✅ "${test.query}": ${searchResult.rows[0].label} (${searchResult.rows[0].type})`);
      } else {
        console.log(`   ❌ "${test.query}": No results found`);
      }
    }
    
    console.log('\n🎉 Comprehensive destinations import completed successfully!');
    console.log('\n📝 ID Mapping created for', Object.keys(idMapping).length, 'entities');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Helper function to parse CSV files
function parseCSV(filename) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    if (!fs.existsSync(filename)) {
      reject(new Error(`CSV file ${filename} not found`));
      return;
    }
    
    fs.createReadStream(filename)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Run the import
importDestinationsWithUUIDMapping().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
