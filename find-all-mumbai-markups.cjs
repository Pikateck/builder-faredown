const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, rule_name, m_value, booking_class, is_active, created_at
      FROM markup_rules 
      WHERE module = 'air'
      ORDER BY rule_name, created_at DESC;
    `);
    
    console.log('Total Air Markups:', result.rows.length, '\n');
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.rule_name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Markup: ${row.m_value}%`);
      console.log(`   Class: ${row.booking_class || 'null'}`);
      console.log(`   Active: ${row.is_active}`);
      console.log(`   Created: ${row.created_at}`);
      console.log('');
    });
  } finally {
    client.release();
    await pool.end();
  }
})();
