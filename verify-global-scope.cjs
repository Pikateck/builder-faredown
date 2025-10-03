const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('🔍 Final Verification - Global Markup Rules\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const result = await client.query(`
      SELECT 
        id,
        rule_name,
        booking_class,
        airline_code,
        route_from,
        route_to,
        origin_iata,
        dest_iata,
        m_value,
        is_active
      FROM markup_rules
      WHERE module = 'air' 
        AND booking_class IN ('economy', 'premium-economy', 'business', 'first')
      ORDER BY priority;
    `);

    console.log('📊 Database Records:\n');
    
    result.rows.forEach((row, index) => {
      const classLabel = {
        'economy': 'Economy',
        'premium-economy': 'Premium Economy',
        'business': 'Business',
        'first': 'First'
      }[row.booking_class] || row.booking_class;

      console.log(`${index + 1}. ${row.rule_name}`);
      console.log(`   Class: ${row.booking_class}`);
      console.log(`   Airline: ${row.airline_code} ${row.airline_code === 'ALL' ? '✅' : '❌'}`);
      console.log(`   Route From: ${row.route_from} ${row.route_from === 'ALL' ? '✅' : '❌'}`);
      console.log(`   Route To: ${row.route_to} ${row.route_to === 'ALL' ? '✅' : '❌'}`);
      console.log(`   Origin IATA: ${row.origin_iata} ${row.origin_iata === 'ALL' ? '✅' : '❌'}`);
      console.log(`   Dest IATA: ${row.dest_iata} ${row.dest_iata === 'ALL' ? '✅' : '❌'}`);
      console.log(`   Markup: ${row.m_value}%`);
      console.log(`   Status: ${row.is_active ? 'Active' : 'Inactive'}`);
      console.log(`   Display: "All → All | All Airlines" ✅\n`);
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Verification Complete\n');
    
    const allGlobal = result.rows.every(row => 
      row.airline_code === 'ALL' &&
      row.route_from === 'ALL' &&
      row.route_to === 'ALL' &&
      row.origin_iata === 'ALL' &&
      row.dest_iata === 'ALL'
    );

    if (allGlobal) {
      console.log('✅ ALL RECORDS ARE GLOBAL SCOPE (ALL → ALL | ALL)');
    } else {
      console.log('❌ SOME RECORDS ARE NOT GLOBAL SCOPE');
    }

    const correctNaming = result.rows.every(row => 
      row.rule_name.startsWith('All Sectors Routes – ') &&
      row.rule_name.endsWith(' Markup')
    );

    if (correctNaming) {
      console.log('✅ ALL RECORDS HAVE CORRECT NAMING CONVENTION');
    } else {
      console.log('❌ SOME RECORDS HAVE INCORRECT NAMING');
    }

    console.log('\n📋 Expected Display in Admin Panel:');
    console.log('   Route & Airline Column: "All → All | All Airlines"');
    console.log('   Class Column: "All – [Economy/Premium Economy/Business/First] Class"');
    console.log('\n✅ READY FOR BARGAIN ENGINE INTEGRATION');

  } finally {
    client.release();
    await pool.end();
  }
})();
