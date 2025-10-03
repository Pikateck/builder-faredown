const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'promo_codes'::regclass
        AND contype = 'c';
    `);

    console.log("Promo Codes Check Constraints:");
    console.log("==============================\n");
    result.rows.forEach((row) => {
      console.log(`${row.constraint_name}:`);
      console.log(`  ${row.constraint_definition}\n`);
    });
  } finally {
    client.release();
    await pool.end();
  }
})();
