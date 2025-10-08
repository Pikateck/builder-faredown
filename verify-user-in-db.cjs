const { Client } = require('pg');

const connectionString = 'postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db';

async function verifyUser() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Query for the user
    const query = `
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        is_active, 
        is_verified,
        verification_token,
        verification_token_expires_at,
        verification_sent_at,
        verified_at,
        created_at,
        updated_at
      FROM users 
      WHERE email = $1
    `;

    const result = await client.query(query, ['zubin0478@gmail.com']);

    if (result.rows.length > 0) {
      console.log('✅ User found in database!\n');
      console.log('📋 User Details:');
      console.log('='.repeat(60));
      
      const user = result.rows[0];
      console.log(`ID:                 ${user.id}`);
      console.log(`Email:              ${user.email}`);
      console.log(`Name:               ${user.first_name} ${user.last_name}`);
      console.log(`Active:             ${user.is_active}`);
      console.log(`Verified:           ${user.is_verified}`);
      console.log(`Verification Token: ${user.verification_token ? user.verification_token.substring(0, 20) + '...' : 'null'}`);
      console.log(`Token Expires:      ${user.verification_token_expires_at}`);
      console.log(`Verification Sent:  ${user.verification_sent_at}`);
      console.log(`Verified At:        ${user.verified_at}`);
      console.log(`Created:            ${user.created_at}`);
      console.log(`Updated:            ${user.updated_at}`);
      console.log('='.repeat(60));

      // Generate verification URL
      if (user.verification_token) {
        const verificationUrl = `https://builder-faredown-pricing.onrender.com/api/auth/verify-email?token=${user.verification_token}`;
        console.log('\n📧 Verification Link:');
        console.log(verificationUrl);
        console.log('\n💡 Copy this link and paste it in your browser to verify the account.');
      }

      // Check status
      console.log('\n📊 Account Status:');
      if (!user.is_verified) {
        console.log('⏳ Status: Pending Verification');
        console.log('   User needs to click verification link in email');
      } else if (user.is_verified && user.is_active) {
        console.log('✅ Status: Active');
        console.log('   User can log in');
      } else if (user.is_verified && !user.is_active) {
        console.log('⚠️  Status: Inactive');
        console.log('   Account verified but deactivated by admin');
      }

    } else {
      console.log('❌ User not found in database');
      console.log('   Email searched: zubin0478@gmail.com');
    }

    // Also get all users count
    const countResult = await client.query('SELECT COUNT(*) as total FROM users');
    console.log(`\n📈 Total users in database: ${countResult.rows[0].total}`);

  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

verifyUser();
