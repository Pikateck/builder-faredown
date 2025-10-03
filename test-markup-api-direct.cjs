const fetch = require('node-fetch');

(async () => {
  try {
    // Test with mock admin token
    const response = await fetch('http://localhost:3001/api/markup/air?page=1&limit=10', {
      headers: {
        'Authorization': 'Bearer mock-admin-token-for-testing',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.status === 200) {
      const json = JSON.parse(data);
      console.log('\nParsed Response:');
      console.log(JSON.stringify(json, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
