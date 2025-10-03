const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkAllMarkups() {
  const client = await pool.connect();

  try {
    console.log("🔍 Checking ALL markup records in database\n");

    const result = await client.query(`
      SELECT id, rule_name, booking_class, airline_code, route_from, route_to, 
             m_value, is_active, created_at
      FROM markup_rules 
      WHERE module = 'air'
      ORDER BY created_at DESC;
    `);

    console.log(`Total Air Markups: ${result.rows.length}\n`);

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.rule_name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Class: ${row.booking_class}`);
      console.log(`   Airline: ${row.airline_code}`);
      console.log(`   Route: ${row.route_from} → ${row.route_to}`);
      console.log(`   Markup: ${row.m_value}%`);
      console.log(`   Active: ${row.is_active}`);
      console.log(`   Created: ${row.created_at}`);
      console.log("");
    });

    // Check BOM-DXB specifically
    const bomDxb = await client.query(`
      SELECT * FROM markup_rules 
      WHERE module = 'air' 
        AND route_from = 'BOM' 
        AND route_to = 'DXB'
      ORDER BY 
        CASE booking_class
          WHEN 'economy' THEN 1
          WHEN 'premium-economy' THEN 2
          WHEN 'business' THEN 3
          WHEN 'first' THEN 4
        END;
    `);

    console.log("\n═══════════════════════════════════════════════════════");
    console.log(`BOM → DXB Markups: ${bomDxb.rows.length}\n`);

    bomDxb.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.rule_name} (${row.booking_class})`);
      console.log(`   Markup: ${row.m_value}%`);
      console.log(`   Active: ${row.is_active}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllMarkups();
