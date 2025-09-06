/**
 * Test pricing engine directly
 */

const { Pool } = require('pg');
const PricingEngine = require('./services/pricing/PricingEngine');

async function testPricingDirect() {
  console.log('🧪 Testing Pricing Engine directly...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Initialize pricing engine
    const pricingEngine = new PricingEngine(pool);
    
    // Test 1: Get applicable markup rule
    console.log('1️⃣ Testing getApplicableMarkupRule...');
    const rule = await pricingEngine.getApplicableMarkupRule({
      module: 'air',
      origin: 'BOM',
      destination: 'JFK',
      serviceClass: 'Y',
      airlineCode: 'AI',
      userType: 'b2c'
    });
    console.log('✅ Markup rule found:', rule ? 'Yes' : 'No');
    if (rule) {
      console.log('   Rule details:', {
        id: rule.id,
        markup_type: rule.markup_type,
        markup_value: rule.markup_value,
        priority: rule.priority
      });
    }

    // Test 2: Calculate quote
    console.log('\n2️⃣ Testing quote calculation...');
    const quote = await pricingEngine.quote({
      module: 'air',
      origin: 'BOM',
      destination: 'JFK',
      serviceClass: 'Y',
      airlineCode: 'AI',
      currency: 'USD',
      baseFare: 512.35,
      userType: 'b2c',
      debug: true,
      extras: { promoCode: 'WELCOME10', pax: 1 }
    });
    
    console.log('✅ Quote calculation successful!');
    console.log(JSON.stringify(quote, null, 2));

    // Test 3: Get tax policy
    console.log('\n3️⃣ Testing getTaxPolicy...');
    const taxPolicy = await pricingEngine.getTaxPolicy({ module: 'air' });
    console.log('✅ Tax policy found:', taxPolicy ? 'Yes' : 'No');
    if (taxPolicy) {
      console.log('   Tax policy:', {
        type: taxPolicy.type,
        value: taxPolicy.value,
        priority: taxPolicy.priority
      });
    }

    console.log('\n🎉 All direct tests passed successfully!');

  } catch (error) {
    console.error('❌ Direct test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testPricingDirect();
