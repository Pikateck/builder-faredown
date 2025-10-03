const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'promo_codes'
      ORDER BY ordinal_position;
    `);

    console.log("Promo Codes Table Schema:");
    console.log("========================\n");
    result.rows.forEach((row) => {
      console.log(
        `${row.column_name}: ${row.data_type}${row.character_maximum_length ? "(" + row.character_maximum_length + ")" : ""}`,
      );
    });
  } finally {
    client.release();
    await pool.end();
  }
})();
