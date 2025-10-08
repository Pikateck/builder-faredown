const db = require('../database/connection.js');

async function verifyUsersTable() {
  try {
    console.log('🔍 Checking users table...\n');
    
    // Get total count
    const countResult = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = countResult.rows[0].total;
    console.log(`📊 Total users in database: ${totalUsers}\n`);
    
    // Get recent users
    const usersResult = await db.query(`
      SELECT id, email, first_name, last_name, is_active, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('📋 Recent users:');
    console.log('=====================================');
    usersResult.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Created: ${user.created_at}`);
    });
    console.log('\n=====================================\n');
    
    // Export CSV for evidence
    console.log('CSV Export (for evidence):');
    console.log('id,email,first_name,last_name,is_active,created_at');
    usersResult.rows.forEach(user => {
      console.log(`${user.id},${user.email},${user.first_name},${user.last_name},${user.is_active},${user.created_at}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyUsersTable();
