const fetch = require('node-fetch');

async function testDestinationsAPI() {
  const baseUrl = 'http://localhost:3001/api/destinations';
  
  console.log('\n=== TESTING DESTINATIONS API ===\n');
  
  try {
    // Test 1: Get all regions
    console.log('1. Testing GET /api/destinations/regions');
    const regionsResponse = await fetch(`${baseUrl}/regions`);
    const regionsData = await regionsResponse.json();
    console.log('Status:', regionsResponse.status);
    console.log('Response:', JSON.stringify(regionsData, null, 2));
    
    // Test 2: Get Europe region ID and test cities
    if (regionsData.success && regionsData.data && regionsData.data.items) {
      const europeRegion = regionsData.data.items.find(r => r.name === 'Europe');
      if (europeRegion) {
        console.log(`\n2. Testing GET /api/destinations/regions/${europeRegion.id}/cities`);
        const citiesResponse = await fetch(`${baseUrl}/regions/${europeRegion.id}/cities`);
        const citiesData = await citiesResponse.json();
        console.log('Status:', citiesResponse.status);
        console.log('Response:', JSON.stringify(citiesData, null, 2));
      } else {
        console.log('\n2. Europe region not found in response');
      }
    }
    
    // Test 3: Get all countries
    console.log('\n3. Testing GET /api/destinations/countries');
    const countriesResponse = await fetch(`${baseUrl}/countries`);
    const countriesData = await countriesResponse.json();
    console.log('Status:', countriesResponse.status);
    console.log('Countries count:', countriesData.success ? countriesData.data.length : 'Error');
    console.log('Sample countries:', countriesData.success ? countriesData.data.slice(0, 3) : 'Error');
    
    // Test 4: Get Europe countries specifically
    const europeRegion = regionsData.data?.items?.find(r => r.name === 'Europe');
    if (europeRegion) {
      console.log(`\n4. Testing GET /api/destinations/countries?region_id=${europeRegion.id}`);
      const europeCountriesResponse = await fetch(`${baseUrl}/countries?region_id=${europeRegion.id}`);
      const europeCountriesData = await europeCountriesResponse.json();
      console.log('Status:', europeCountriesResponse.status);
      console.log('Europe countries count:', europeCountriesData.success ? europeCountriesData.data.length : 'Error');
      console.log('Europe countries:', europeCountriesData.success ? europeCountriesData.data.slice(0, 5) : 'Error');
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testDestinationsAPI();
