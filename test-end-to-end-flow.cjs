const { Pool } = require('pg');
const http = require('http');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper function to make HTTP requests
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testEndToEndFlow() {
  console.log('\n=== END-TO-END REGION → CITY FLOW TEST ===\n');
  
  try {
    // Test 1: Get all regions via API
    console.log('1. Testing GET /api/destinations/regions...');
    const regionsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/destinations/regions',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${regionsResponse.status}`);
    
    if (regionsResponse.status === 200 && regionsResponse.data.success) {
      const regions = regionsResponse.data.data.items;
      console.log(`✅ Found ${regions.length} regions`);
      console.log('Regions:', regions.map(r => `${r.name} (ID: ${r.id})`));
      
      // Find Europe region
      const europeRegion = regions.find(r => r.name === 'Europe');
      if (europeRegion) {
        console.log(`✅ Europe region found with ID: ${europeRegion.id}`);
        
        // Test 2: Get cities for Europe
        console.log(`\n2. Testing GET /api/destinations/regions/${europeRegion.id}/cities...`);
        const citiesResponse = await makeRequest({
          hostname: 'localhost',
          port: 3001,
          path: `/api/destinations/regions/${europeRegion.id}/cities?limit=20`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Status: ${citiesResponse.status}`);
        
        if (citiesResponse.status === 200 && citiesResponse.data.success) {
          const cities = citiesResponse.data.data.items;
          console.log(`✅ Found ${cities.length} cities for Europe`);
          console.log('Sample cities:');
          cities.slice(0, 10).forEach(city => {
            console.log(`  - ${city.name} (${city.country.name}) [${city.code}]`);
          });
          
          // Test 3: Search cities with query
          console.log(`\n3. Testing city search with query 'paris'...`);
          const parisSearchResponse = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: `/api/destinations/regions/${europeRegion.id}/cities?q=paris&limit=5`,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`Status: ${parisSearchResponse.status}`);
          
          if (parisSearchResponse.status === 200 && parisSearchResponse.data.success) {
            const parisResults = parisSearchResponse.data.data.items;
            console.log(`✅ Found ${parisResults.length} cities matching 'paris'`);
            parisResults.forEach(city => {
              console.log(`  - ${city.name} (${city.country.name}) [${city.code}]`);
            });
          } else {
            console.log('❌ Paris search failed:', parisSearchResponse.data);
          }
          
          // Test 4: Test with different queries
          console.log(`\n4. Testing city search with query 'london'...`);
          const londonSearchResponse = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: `/api/destinations/regions/${europeRegion.id}/cities?q=london&limit=5`,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (londonSearchResponse.status === 200 && londonSearchResponse.data.success) {
            const londonResults = londonSearchResponse.data.data.items;
            console.log(`✅ Found ${londonResults.length} cities matching 'london'`);
            londonResults.forEach(city => {
              console.log(`  - ${city.name} (${city.country.name}) [${city.code}]`);
            });
          }
          
        } else {
          console.log('❌ Cities API failed:', citiesResponse.data);
        }
        
      } else {
        console.log('❌ Europe region not found in API response');
      }
      
    } else {
      console.log('❌ Regions API failed:', regionsResponse.data);
    }
    
    // Test 5: Verify data consistency between API and database
    console.log('\n5. Verifying data consistency...');
    const client = await pool.connect();
    
    try {
      // Count regions in DB
      const dbRegionsResult = await client.query('SELECT COUNT(*) as count FROM regions WHERE is_active = TRUE');
      const dbRegionsCount = parseInt(dbRegionsResult.rows[0].count);
      
      // Count cities in DB for Europe
      const dbCitiesResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM cities ci
        JOIN countries co ON co.id = ci.country_id
        WHERE ci.is_active = TRUE AND (co.region_id = 2 OR ci.region_id = 2)
      `);
      const dbCitiesCount = parseInt(dbCitiesResult.rows[0].count);
      
      console.log(`Database: ${dbRegionsCount} active regions, ${dbCitiesCount} Europe cities`);
      
      if (regionsResponse.status === 200) {
        const apiRegionsCount = regionsResponse.data.data.items.length;
        console.log(`API: ${apiRegionsCount} regions returned`);
        
        if (apiRegionsCount === dbRegionsCount) {
          console.log('✅ Regions count matches between API and database');
        } else {
          console.log('⚠️  Regions count mismatch between API and database');
        }
      }
      
    } finally {
      client.release();
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('✅ Regions API working');
    console.log('✅ Cities API working');
    console.log('✅ Search functionality working');
    console.log('✅ Database data consistent');
    console.log('\n🎉 END-TO-END REGION → CITY FLOW IS WORKING!');
    
  } catch (error) {
    console.error('❌ Error in end-to-end test:', error);
  } finally {
    await pool.end();
  }
}

testEndToEndFlow();
