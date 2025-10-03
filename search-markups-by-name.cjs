const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, rule_name, m_value, booking_class, airline_code, route_from, route_to
      FROM markup_rules 
      WHERE rule_name LIKE '%Mumbai-Dubai%' OR rule_name LIKE '%Amadeus%' OR rule_name LIKE '%BOM%'
      ORDER BY rule_name
    `);
    console.log("Found markups:", result.rows.length);
    console.log(JSON.stringify(result.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
})();
