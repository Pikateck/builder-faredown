const https = require('https');

const VERIFICATION_TOKEN = 'fe3cafa8ad547490340a9d2f6bf23c646cd5bed0a53c33cd84f797df375ac72d';

async function verifyEmail() {
  const options = {
    hostname: 'builder-faredown-pricing.onrender.com',
    port: 443,
    path: `/api/auth/verify-email?token=${VERIFICATION_TOKEN}`,
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/json'
    }
  };

  return new Promise((resolve, reject) => {
    console.log('🔗 Testing email verification link...\n');
    console.log(`URL: https://builder-faredown-pricing.onrender.com/api/auth/verify-email?token=${VERIFICATION_TOKEN.substring(0, 20)}...`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n✅ Response Status: ${res.statusCode}`);
        console.log(`Content-Type: ${res.headers['content-type']}\n`);

        if (res.headers['content-type']?.includes('application/json')) {
          try {
            const response = JSON.parse(data);
            console.log('📋 JSON Response:');
            console.log(JSON.stringify(response, null, 2));
            
            if (response.success) {
              console.log('\n✅ Email verified successfully!');
              console.log('   User is now active and can log in');
            } else {
              console.log('\n❌ Verification failed:', response.message);
            }
            resolve(response);
          } catch (e) {
            console.log('📋 Response (not JSON):');
            console.log(data.substring(0, 500));
            resolve(data);
          }
        } else {
          console.log('📋 HTML Response (truncated):');
          console.log(data.substring(0, 500));
          
          if (data.includes('verified') || data.includes('success')) {
            console.log('\n✅ Email appears to be verified (HTML response)');
          }
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function checkUserAfterVerification() {
  const { Client } = require('pg');
  
  const client = new Client({
    connectionString: 'postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, email, first_name, last_name, is_active, is_verified, verified_at
      FROM users 
      WHERE email = 'zubin0478@gmail.com'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n📊 Updated User Status:');
      console.log('='.repeat(50));
      console.log(`Email:     ${user.email}`);
      console.log(`Name:      ${user.first_name} ${user.last_name}`);
      console.log(`Verified:  ${user.is_verified ? '✅ Yes' : '❌ No'}`);
      console.log(`Active:    ${user.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`Verified At: ${user.verified_at || 'Not verified'}`);
      console.log('='.repeat(50));

      if (user.is_verified && user.is_active) {
        console.log('\n✅ Account is fully activated!');
        console.log('   User can now log in with:');
        console.log('   Email: zubin0478@gmail.com');
        console.log('   Password: Pkfd@0405#');
      }
    }
  } finally {
    await client.end();
  }
}

async function runTest() {
  console.log('🧪 Email Verification Test\n');
  console.log('='.repeat(50));

  try {
    await verifyEmail();
    
    // Wait a bit for database update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await checkUserAfterVerification();

    console.log('\n' + '='.repeat(50));
    console.log('✅ Verification test completed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
