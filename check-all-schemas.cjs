const { Pool } = require('pg');

async function checkSchemas() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const tables = ['regions', 'countries', 'cities'];
    
    for (const table of tables) {
      console.log(`\n${table.toUpperCase()} TABLE:`);
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      
      result.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchemas();
