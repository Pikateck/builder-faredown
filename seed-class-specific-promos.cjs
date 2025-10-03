/**
 * Seed Class-Specific Promo Codes
 * 
 * This script creates class-specific promo codes,
 * one for each cabin class: Economy, Premium Economy, Business, First
 * 
 * Run with: node seed-class-specific-promos.cjs
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const classSpecificPromos = [
  {
    code: 'FAREDOWN-ECO',
    description: 'Special discount for Economy class flights',
    module: 'flight',
    discount_type: 'percentage',
    discount_min: 5,
    discount_max: 10,
    min_fare_amount: 5000,
    marketing_budget: 50000,
    expires_on: '2024-12-31',
    show_on_home: true,
    status: 'active',
    service_class: 'economy',
    airline_code: 'ALL',
    origin: null,
    destination: null
  },
  {
    code: 'FAREDOWN-PE',
    description: 'Special discount for Premium Economy class flights',
    module: 'flight',
    discount_type: 'percentage',
    discount_min: 7,
    discount_max: 12,
    min_fare_amount: 8000,
    marketing_budget: 75000,
    expires_on: '2024-12-31',
    show_on_home: true,
    status: 'active',
    service_class: 'premium-economy',
    airline_code: 'ALL',
    origin: null,
    destination: null
  },
  {
    code: 'FAREDOWN-BIZ',
    description: 'Special discount for Business class flights',
    module: 'flight',
    discount_type: 'percentage',
    discount_min: 10,
    discount_max: 15,
    min_fare_amount: 15000,
    marketing_budget: 100000,
    expires_on: '2024-12-31',
    show_on_home: true,
    status: 'active',
    service_class: 'business',
    airline_code: 'ALL',
    origin: null,
    destination: null
  },
  {
    code: 'FAREDOWN-FIRST',
    description: 'Special discount for First class flights',
    module: 'flight',
    discount_type: 'percentage',
    discount_min: 12,
    discount_max: 20,
    min_fare_amount: 25000,
    marketing_budget: 150000,
    expires_on: '2024-12-31',
    show_on_home: true,
    status: 'active',
    service_class: 'first',
    airline_code: 'ALL',
    origin: null,
    destination: null
  }
];

async function seedClassSpecificPromos() {
  const client = await pool.connect();
  
  try {
    console.log('🎫 Starting class-specific promo code seeding...\n');

    // Check if promo_codes table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'promo_codes'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  promo_codes table does not exist. Creating it...\n');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS promo_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          category VARCHAR(50),
          discount_type VARCHAR(20),
          discount_min_value DECIMAL(10,2),
          discount_max_value DECIMAL(10,2),
          minimum_fare_amount DECIMAL(10,2),
          marketing_budget DECIMAL(10,2),
          expiry_date DATE,
          promo_code_image TEXT,
          display_on_home_page VARCHAR(10),
          status VARCHAR(20),
          origin VARCHAR(10),
          destination VARCHAR(10),
          carrier_code VARCHAR(10),
          cabin_class VARCHAR(50),
          flight_by VARCHAR(100),
          hotel_city VARCHAR(100),
          hotel_name VARCHAR(100),
          created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          module VARCHAR(50),
          validity_type VARCHAR(20),
          usage_count INTEGER DEFAULT 0,
          max_usage INTEGER
        );
      `);
      
      console.log('✅ promo_codes table created successfully\n');
    }

    // Begin transaction
    await client.query('BEGIN');

    // Delete existing class-specific promo codes to avoid duplicates
    const deleteResult = await client.query(`
      DELETE FROM promo_codes 
      WHERE code IN ('FAREDOWN-ECO', 'FAREDOWN-PE', 'FAREDOWN-BIZ', 'FAREDOWN-FIRST')
      RETURNING code;
    `);
    
    if (deleteResult.rowCount > 0) {
      console.log(`🗑️  Removed ${deleteResult.rowCount} existing promo code(s)\n`);
    }

    // Insert the class-specific promo codes
    let insertedCount = 0;
    
    for (const promo of classSpecificPromos) {
      const insertQuery = `
        INSERT INTO promo_codes (
          code, description, category, discount_type,
          discount_min_value, discount_max_value, minimum_fare_amount,
          marketing_budget, expiry_date, display_on_home_page,
          status, cabin_class, carrier_code, module, validity_type
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING id, code, cabin_class;
      `;

      const values = [
        promo.code,
        promo.description,
        promo.category,
        promo.discount_type,
        promo.discount_min_value,
        promo.discount_max_value,
        promo.minimum_fare_amount,
        promo.marketing_budget,
        promo.expiry_date,
        promo.display_on_home_page,
        promo.status,
        promo.cabin_class,
        promo.carrier_code,
        promo.module,
        promo.validity_type
      ];

      const result = await client.query(insertQuery, values);
      const inserted = result.rows[0];
      
      const classLabel = inserted.cabin_class === 'economy' ? 'Economy' :
                        inserted.cabin_class === 'premium-economy' ? 'Premium Economy' :
                        inserted.cabin_class === 'business' ? 'Business' :
                        inserted.cabin_class === 'first' ? 'First' : inserted.cabin_class;
      
      console.log(`✅ Created: ${inserted.code}`);
      console.log(`   ID: ${inserted.id}`);
      console.log(`   Class: All – ${classLabel} Class`);
      console.log(`   Discount: ${promo.discount_min_value}% - ${promo.discount_max_value}%`);
      console.log(`   Min Fare: ₹${promo.minimum_fare_amount}`);
      console.log(`   Budget: ₹${promo.marketing_budget}\n`);
      
      insertedCount++;
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('═══════════════════════════════════════════════════════');
    console.log(`✨ SUCCESS! Created ${insertedCount} class-specific promo codes`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Verify the records
    const verifyQuery = await client.query(`
      SELECT id, code, cabin_class, discount_min_value, discount_max_value, status
      FROM promo_codes
      WHERE code IN ('FAREDOWN-ECO', 'FAREDOWN-PE', 'FAREDOWN-BIZ', 'FAREDOWN-FIRST')
      ORDER BY 
        CASE cabin_class
          WHEN 'economy' THEN 1
          WHEN 'premium-economy' THEN 2
          WHEN 'business' THEN 3
          WHEN 'first' THEN 4
        END;
    `);

    console.log('📊 Verification - Class-specific promo codes:\n');
    verifyQuery.rows.forEach((row, index) => {
      const classLabel = row.cabin_class === 'economy' ? 'Economy' :
                        row.cabin_class === 'premium-economy' ? 'Premium Economy' :
                        row.cabin_class === 'business' ? 'Business' :
                        row.cabin_class === 'first' ? 'First' : row.cabin_class;
      
      console.log(`${index + 1}. ${row.code}`);
      console.log(`   Class: All – ${classLabel} Class`);
      console.log(`   Discount: ${row.discount_min_value}% - ${row.discount_max_value}%`);
      console.log(`   Status: ${row.status === 'active' ? 'Active ✅' : 'Inactive ❌'}\n`);
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Class-specific promo code seeding completed!');
    console.log('══════════════════��════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('1. Refresh the admin panel (F5)');
    console.log('2. Navigate to Promo Code Manager');
    console.log('3. You should see 4 distinct promo codes for each cabin class');
    console.log('4. Each code shows "All – [Class Name] Class" label');
    console.log('5. Test filtering by cabin class');
    console.log('6. Test applying promo codes in bargain flow\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding class-specific promo codes:', error);
    console.error('\nError details:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedClassSpecificPromos()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
