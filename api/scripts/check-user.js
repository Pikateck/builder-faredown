const { Pool } = require("pg");

async function checkUser(email) {
  if (!email) {
    console.error("❌ Please provide an email");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, is_active, is_verified, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       ORDER BY created_at DESC
       LIMIT 1`,
      [email],
    );

    if (result.rows.length === 0) {
      console.log(`⚠️ No user found for email: ${email}`);
    } else {
      console.log("✅ User record found:");
      console.table(result.rows);
    }
  } catch (error) {
    console.error("❌ Error checking user:", error.message);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];
checkUser(email);
