/**
 * Update Air Markup Records to Global Scope
 * 
 * Changes:
 * 1. Route: BOM→DXB to ALL→ALL (global)
 * 2. Airline: EK to ALL
 * 3. Rename to "All Sectors Routes – [Class] Markup"
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const globalMarkups = [
  {
    old_class: 'economy',
    new_name: 'All Sectors Routes – Economy Class Markup',
    description: 'Global markup rule for Economy class on all routes',
    m_value: 15.0,
    current_min_pct: 12.0,
    current_max_pct: 18.0,
    bargain_min_pct: 8.0,
    bargain_max_pct: 15.0,
    priority: 1
  },
  {
    old_class: 'premium-economy',
    new_name: 'All Sectors Routes – Premium Economy Class Markup',
    description: 'Global markup rule for Premium Economy class on all routes',
    m_value: 12.0,
    current_min_pct: 10.0,
    current_max_pct: 15.0,
    bargain_min_pct: 7.0,
    bargain_max_pct: 12.0,
    priority: 2
  },
  {
    old_class: 'business',
    new_name: 'All Sectors Routes – Business Class Markup',
    description: 'Global markup rule for Business class on all routes',
    m_value: 10.0,
    current_min_pct: 8.0,
    current_max_pct: 12.0,
    bargain_min_pct: 5.0,
    bargain_max_pct: 10.0,
    priority: 3
  },
  {
    old_class: 'first',
    new_name: 'All Sectors Routes – First Class Markup',
    description: 'Global markup rule for First class on all routes',
    m_value: 8.0,
    current_min_pct: 6.0,
    current_max_pct: 10.0,
    bargain_min_pct: 4.0,
    bargain_max_pct: 8.0,
    priority: 4
  }
];

async function updateToGlobalScope() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating Air Markup Records to Global Scope\n');
    console.log('═══════════════════════════════════════════════════════\n');

    await client.query('BEGIN');

    for (const markup of globalMarkups) {
      const updateQuery = `
        UPDATE markup_rules 
        SET 
          rule_name = $1,
          description = $2,
          airline_code = 'ALL',
          route_from = 'ALL',
          route_to = 'ALL',
          origin_iata = 'ALL',
          dest_iata = 'ALL',
          m_value = $3,
          current_min_pct = $4,
          current_max_pct = $5,
          bargain_min_pct = $6,
          bargain_max_pct = $7,
          priority = $8,
          updated_at = now()
        WHERE module = 'air' 
          AND booking_class = $9
          AND (route_from = 'BOM' OR route_from IS NULL OR route_from = 'ALL')
        RETURNING id, rule_name, booking_class, airline_code, route_from, route_to;
      `;

      const values = [
        markup.new_name,
        markup.description,
        markup.m_value,
        markup.current_min_pct,
        markup.current_max_pct,
        markup.bargain_min_pct,
        markup.bargain_max_pct,
        markup.priority,
        markup.old_class
      ];

      const result = await client.query(updateQuery, values);
      
      if (result.rowCount > 0) {
        const updated = result.rows[0];
        console.log(`✅ Updated: ${updated.rule_name}`);
        console.log(`   Class: ${updated.booking_class}`);
        console.log(`   Route: ${updated.route_from} → ${updated.route_to}`);
        console.log(`   Airline: ${updated.airline_code}`);
        console.log(`   Markup: ${markup.m_value}%\n`);
      } else {
        console.log(`⚠️  No record found for class: ${markup.old_class}\n`);
      }
    }

    await client.query('COMMIT');

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Verification - Updated Global Markup Records:\n');

    const verifyQuery = await client.query(`
      SELECT id, rule_name, booking_class, airline_code, route_from, route_to, 
             m_value, is_active
      FROM markup_rules
      WHERE module = 'air' 
        AND booking_class IN ('economy', 'premium-economy', 'business', 'first')
      ORDER BY priority;
    `);

    verifyQuery.rows.forEach((row, index) => {
      const classLabel = row.booking_class === 'economy' ? 'Economy' :
                        row.booking_class === 'premium-economy' ? 'Premium Economy' :
                        row.booking_class === 'business' ? 'Business' :
                        row.booking_class === 'first' ? 'First' : row.booking_class;

      console.log(`${index + 1}. ${row.rule_name}`);
      console.log(`   Class: All – ${classLabel} Class`);
      console.log(`   Route & Airline: ${row.route_from} → ${row.route_to} | ${row.airline_code}`);
      console.log(`   Markup: ${row.m_value}%`);
      console.log(`   Status: ${row.is_active ? 'Active ✅' : 'Inactive ❌'}\n`);
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Global Scope Update Complete!\n');
    console.log('Expected display in Admin Panel:');
    console.log('  Route & Airline column: "All → All | All Airlines"\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating to global scope:', error);
    console.error('\nError details:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateToGlobalScope()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
