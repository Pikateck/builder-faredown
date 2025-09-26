/**
 * Test script to debug Dubai packages API
 */

const fetch = require('node-fetch');

async function testDubaiAPI() {
  try {
    const url = 'http://localhost:3001/api/packages?destination=Dubai%2C%20United%20Arab%20Emirates&destination_code=DXB&destination_type=city&departure_date=2025-10-01&return_date=2025-10-04&category=any&adults=2&children=0';
    
    console.log('🔍 Testing Dubai API call...');
    console.log('URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('🔍 Response Status:', response.status);
    console.log('🔍 Response Data:', {
      success: data.success,
      packages_count: data.packages?.length || 0,
      package_titles: data.packages?.map(p => p.title) || [],
      total: data.pagination?.total || 0
    });
    
  } catch (error) {
    console.error('❌ Error testing Dubai API:', error.message);
  }
}

testDubaiAPI();
