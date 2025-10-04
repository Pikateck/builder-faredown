const fetch = require('node-fetch');

async function testApiResponse() {
  try {
    console.log('🧪 Testing API response for dubai-luxury-experience...\n');
    
    const response = await fetch('http://localhost:3001/api/packages/dubai-luxury-experience');
    const data = await response.json();
    
    if (data.success) {
      const pkg = data.data;
      
      console.log('📦 API Response Analysis:');
      console.log('  Success:', data.success);
      console.log('  Title:', pkg.title);
      console.log('  Description:', pkg.description ? 'EXISTS (' + pkg.description.length + ' chars)' : 'MISSING');
      console.log('  Overview:', pkg.overview ? 'EXISTS (' + pkg.overview.length + ' chars)' : 'MISSING');
      console.log('  Highlights type:', typeof pkg.highlights);
      console.log('  Highlights is array:', Array.isArray(pkg.highlights));
      console.log('  Highlights count:', pkg.highlights?.length || 0);
      console.log('  Inclusions count:', pkg.inclusions?.length || 0);
      console.log('  Exclusions count:', pkg.exclusions?.length || 0);
      
      if (pkg.description) {
        console.log('\n  Description preview:', pkg.description.substring(0, 100) + '...');
      }
      
      if (pkg.highlights && pkg.highlights.length > 0) {
        console.log('\n  Highlights:');
        pkg.highlights.forEach((h, i) => {
          console.log(`    ${i + 1}. ${h}`);
        });
      }
      
      console.log('\n✅ API is returning data correctly!');
    } else {
      console.log('❌ API returned error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApiResponse();
