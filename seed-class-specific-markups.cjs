/**
 * Seed Class-Specific Air Markup Records
 *
 * This script creates 4 distinct markup records in the database,
 * one for each cabin class: Economy, Premium Economy, Business, First
 *
 * Run with: node seed-class-specific-markups.cjs
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const classSpecificMarkups = [
  {
    module: "air",
    rule_name: "Mumbai-Dubai Economy Markup",
    description: "Economy class markup for Mumbai to Dubai route",
    airline_code: "ALL",
    route_from: "BOM",
    route_to: "DXB",
    origin_iata: "BOM",
    dest_iata: "DXB",
    booking_class: "economy",
    m_type: "percentage",
    m_value: 15.0,
    current_min_pct: 12.0,
    current_max_pct: 18.0,
    bargain_min_pct: 8.0,
    bargain_max_pct: 15.0,
    valid_from: "2024-01-01",
    valid_to: "2024-12-31",
    priority: 1,
    user_type: "all",
    is_active: true,
  },
  {
    module: "air",
    rule_name: "Mumbai-Dubai Premium Economy Markup",
    description: "Premium Economy class markup for Mumbai to Dubai route",
    airline_code: "ALL",
    route_from: "BOM",
    route_to: "DXB",
    origin_iata: "BOM",
    dest_iata: "DXB",
    booking_class: "premium-economy",
    m_type: "percentage",
    m_value: 12.0,
    current_min_pct: 10.0,
    current_max_pct: 15.0,
    bargain_min_pct: 7.0,
    bargain_max_pct: 12.0,
    valid_from: "2024-01-01",
    valid_to: "2024-12-31",
    priority: 2,
    user_type: "all",
    is_active: true,
  },
  {
    module: "air",
    rule_name: "Mumbai-Dubai Business Class Markup",
    description: "Business class markup for Mumbai to Dubai route",
    airline_code: "ALL",
    route_from: "BOM",
    route_to: "DXB",
    origin_iata: "BOM",
    dest_iata: "DXB",
    booking_class: "business",
    m_type: "percentage",
    m_value: 10.0,
    current_min_pct: 8.0,
    current_max_pct: 12.0,
    bargain_min_pct: 5.0,
    bargain_max_pct: 10.0,
    valid_from: "2024-01-01",
    valid_to: "2024-12-31",
    priority: 3,
    user_type: "all",
    is_active: true,
  },
  {
    module: "air",
    rule_name: "Mumbai-Dubai First Class Markup",
    description: "First class markup for Mumbai to Dubai route",
    airline_code: "ALL",
    route_from: "BOM",
    route_to: "DXB",
    origin_iata: "BOM",
    dest_iata: "DXB",
    booking_class: "first",
    m_type: "percentage",
    m_value: 8.0,
    current_min_pct: 6.0,
    current_max_pct: 10.0,
    bargain_min_pct: 4.0,
    bargain_max_pct: 8.0,
    valid_from: "2024-01-01",
    valid_to: "2024-12-31",
    priority: 4,
    user_type: "all",
    is_active: true,
  },
];

async function seedClassSpecificMarkups() {
  const client = await pool.connect();

  try {
    console.log("🚀 Starting class-specific markup seeding...\n");

    // Check if markup_rules table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'markup_rules'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error("❌ Error: markup_rules table does not exist!");
      console.log("Please run the markup system migration first.");
      return;
    }

    // Begin transaction
    await client.query("BEGIN");

    // Delete existing sample markups for this route to avoid duplicates
    const deleteResult = await client.query(`
      DELETE FROM markup_rules 
      WHERE module = 'air' 
        AND route_from = 'BOM' 
        AND route_to = 'DXB'
        AND booking_class IN ('economy', 'premium-economy', 'business', 'first')
      RETURNING id;
    `);

    if (deleteResult.rowCount > 0) {
      console.log(
        `🗑️  Removed ${deleteResult.rowCount} existing sample markup(s)\n`,
      );
    }

    // Insert the 4 class-specific markup records
    let insertedCount = 0;

    for (const markup of classSpecificMarkups) {
      const insertQuery = `
        INSERT INTO markup_rules (
          module, rule_name, description, airline_code, 
          route_from, route_to, origin_iata, dest_iata, booking_class,
          m_type, m_value, current_min_pct, current_max_pct, 
          bargain_min_pct, bargain_max_pct, valid_from, valid_to,
          priority, user_type, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING id, rule_name, booking_class;
      `;

      const values = [
        markup.module,
        markup.rule_name,
        markup.description,
        markup.airline_code,
        markup.route_from,
        markup.route_to,
        markup.origin_iata,
        markup.dest_iata,
        markup.booking_class,
        markup.m_type,
        markup.m_value,
        markup.current_min_pct,
        markup.current_max_pct,
        markup.bargain_min_pct,
        markup.bargain_max_pct,
        markup.valid_from,
        markup.valid_to,
        markup.priority,
        markup.user_type,
        markup.is_active,
      ];

      const result = await client.query(insertQuery, values);
      const inserted = result.rows[0];

      console.log(`✅ Created: ${inserted.rule_name}`);
      console.log(`   ID: ${inserted.id}`);
      console.log(`   Class: ${inserted.booking_class}`);
      console.log(`   Markup: ${markup.m_value}%`);
      console.log(
        `   Current Fare Range: ${markup.current_min_pct}% - ${markup.current_max_pct}%`,
      );
      console.log(
        `   Bargain Fare Range: ${markup.bargain_min_pct}% - ${markup.bargain_max_pct}%\n`,
      );

      insertedCount++;
    }

    // Commit transaction
    await client.query("COMMIT");

    console.log("═══════════════════════════════════════════════════════");
    console.log(
      `✨ SUCCESS! Created ${insertedCount} class-specific markup records`,
    );
    console.log("═══════════════════════════════════════════════════════\n");

    // Verify the records
    const verifyQuery = await client.query(`
      SELECT id, rule_name, booking_class, m_value, is_active
      FROM markup_rules
      WHERE module = 'air' 
        AND route_from = 'BOM' 
        AND route_to = 'DXB'
      ORDER BY priority;
    `);

    console.log("📊 Verification - Current BOM → DXB markup records:\n");
    verifyQuery.rows.forEach((row, index) => {
      const classLabel =
        row.booking_class === "economy"
          ? "Economy"
          : row.booking_class === "premium-economy"
            ? "Premium Economy"
            : row.booking_class === "business"
              ? "Business"
              : row.booking_class === "first"
                ? "First"
                : row.booking_class;

      console.log(`${index + 1}. ${row.rule_name}`);
      console.log(`   Class: All – ${classLabel} Class`);
      console.log(`   Markup: ${row.m_value}%`);
      console.log(
        `   Status: ${row.is_active ? "Active ✅" : "Inactive ❌"}\n`,
      );
    });

    console.log("═══════════════════════════════════════════════════════");
    console.log("🎉 Class-specific markup seeding completed successfully!");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\nNext steps:");
    console.log("1. Refresh the admin panel (F5)");
    console.log("2. Navigate to Markup Management (Air)");
    console.log("3. You should see 4 distinct records for each cabin class");
    console.log('4. Each record shows "All – [Class Name] Class" label');
    console.log("5. Test filtering by cabin class");
    console.log("6. Verify bargain logic uses correct class-specific markup\n");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error seeding class-specific markups:", error);
    console.error("\nError details:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedClassSpecificMarkups()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error.message);
    process.exit(1);
  });
