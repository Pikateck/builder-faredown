const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTable() {
  const client = await pool.connect();
  
  try {
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'airport_master'
      ) as exists
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ airport_master table EXISTS');
      
      // Get column information
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'airport_master'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Current columns:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Check row count
      const count = await client.query('SELECT COUNT(*) as total FROM airport_master');
      console.log(`\n📊 Total rows: ${count.rows[0].total}`);
      
      if (count.rows[0].total > 0) {
        // Show sample data
        const sample = await client.query('SELECT * FROM airport_master LIMIT 3');
        console.log('\n📄 Sample data:');
        sample.rows.forEach((row, i) => {
          console.log(`   Row ${i + 1}:`, JSON.stringify(row, null, 2));
        });
      }
    } else {
      console.log('❌ airport_master table DOES NOT exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable().catch(console.error);
