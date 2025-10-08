/**
 * Evidence Collection Script
 * Collects data from all tables for audit and evidence purposes
 * Saves results to audits/2025-10-08/ folder as CSV files
 */

const db = require('../database/connection.js');
const fs = require('fs').promises;
const path = require('path');

const AUDIT_DIR = path.join(__dirname, '../../audits/2025-10-08');

async function ensureAuditDir() {
  try {
    await fs.mkdir(AUDIT_DIR, { recursive: true });
    console.log(`✅ Audit directory created: ${AUDIT_DIR}`);
  } catch (error) {
    console.error(`❌ Failed to create audit directory: ${error.message}`);
    throw error;
  }
}

async function saveCsv(filename, data) {
  if (!data || data.length === 0) {
    console.log(`⚠️  No data for ${filename}`);
    return;
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );
  const csv = [headers, ...rows].join('\n');

  const filepath = path.join(AUDIT_DIR, filename);
  await fs.writeFile(filepath, csv);
  console.log(`✅ Saved: ${filename} (${data.length} rows)`);
}

async function collectUsersEvidence() {
  console.log('\n📊 Collecting Users Evidence...');
  
  const countResult = await db.query('SELECT COUNT(*) as total FROM users');
  const usersResult = await db.query(`
    SELECT id, email, first_name, last_name, phone, is_active, created_at, updated_at
    FROM users 
    ORDER BY created_at DESC 
    LIMIT 100
  `);
  
  console.log(`   Total users: ${countResult.rows[0].total}`);
  await saveCsv('01_users_last3.csv', usersResult.rows);
  
  // Get schema
  const schemaResult = await db.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);
  await saveCsv('01_users_schema.csv', schemaResult.rows);
}

async function collectBookingsEvidence() {
  console.log('\n📊 Collecting Bookings Evidence...');
  
  const countResult = await db.query('SELECT COUNT(*) as total FROM hotel_bookings');
  const bookingsResult = await db.query(`
    SELECT 
      id, booking_ref, supplier_booking_ref, hotel_name, hotel_city,
      check_in_date, check_out_date, total_amount, currency,
      status, created_at
    FROM hotel_bookings 
    ORDER BY created_at DESC 
    LIMIT 100
  `);
  
  console.log(`   Total bookings: ${countResult.rows[0].total}`);
  await saveCsv('02_bookings_samples.csv', bookingsResult.rows);
}

async function collectPaymentsEvidence() {
  console.log('\n📊 Collecting Payments Evidence...');
  
  const paymentsResult = await db.query(`
    SELECT 
      p.id, p.booking_id, p.gateway_payment_id, p.payment_method,
      p.amount, p.currency, p.status, p.initiated_at, p.completed_at,
      hb.booking_ref
    FROM payments p
    LEFT JOIN hotel_bookings hb ON p.booking_id = hb.id
    ORDER BY p.initiated_at DESC 
    LIMIT 100
  `);
  
  console.log(`   Total payment records: ${paymentsResult.rows.length}`);
  await saveCsv('03_payments_samples.csv', paymentsResult.rows);
}

async function collectInvoicesEvidence() {
  console.log('\n📊 Collecting Invoices/Vouchers Evidence...');
  
  const vouchersResult = await db.query(`
    SELECT 
      v.id, v.booking_id, v.voucher_type, v.voucher_number,
      v.pdf_path, v.email_sent, v.created_at,
      hb.booking_ref
    FROM vouchers v
    LEFT JOIN hotel_bookings hb ON v.booking_id = hb.id
    ORDER BY v.created_at DESC 
    LIMIT 100
  `);
  
  console.log(`   Total voucher records: ${vouchersResult.rows.length}`);
  await saveCsv('04_invoices_samples.csv', vouchersResult.rows);
}

async function collectAdminPanelData() {
  console.log('\n📊 Collecting Admin Panel Data Summary...');
  
  const summaryResult = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM hotel_bookings) as total_bookings,
      (SELECT COUNT(*) FROM payments WHERE status = 'completed') as completed_payments,
      (SELECT COUNT(*) FROM vouchers) as total_vouchers,
      (SELECT SUM(total_amount) FROM hotel_bookings WHERE status = 'confirmed') as total_revenue
  `);
  
  await saveCsv('05_admin_summary.csv', summaryResult.rows);
}

async function runFinalAcceptanceSQL() {
  console.log('\n📊 Running Final Acceptance SQL...');
  
  const acceptanceResult = await db.query(`
    SELECT 
      'Users' as table_name,
      COUNT(*) as record_count,
      MIN(created_at) as earliest_record,
      MAX(created_at) as latest_record
    FROM users
    UNION ALL
    SELECT 
      'Bookings' as table_name,
      COUNT(*) as record_count,
      MIN(created_at) as earliest_record,
      MAX(created_at) as latest_record
    FROM hotel_bookings
    UNION ALL
    SELECT 
      'Payments' as table_name,
      COUNT(*) as record_count,
      MIN(initiated_at) as earliest_record,
      MAX(initiated_at) as latest_record
    FROM payments
    UNION ALL
    SELECT 
      'Vouchers' as table_name,
      COUNT(*) as record_count,
      MIN(created_at) as earliest_record,
      MAX(created_at) as latest_record
    FROM vouchers
    ORDER BY table_name
  `);
  
  await saveCsv('final_acceptance.csv', acceptanceResult.rows);
  
  console.log('\n📋 Final Acceptance Results:');
  console.log('=====================================');
  acceptanceResult.rows.forEach(row => {
    console.log(`${row.table_name}: ${row.record_count} records`);
    console.log(`  Earliest: ${row.earliest_record}`);
    console.log(`  Latest: ${row.latest_record}\n`);
  });
}

async function main() {
  try {
    console.log('🔍 Starting Evidence Collection...\n');
    console.log('=====================================');
    
    await ensureAuditDir();
    await collectUsersEvidence();
    await collectBookingsEvidence();
    await collectPaymentsEvidence();
    await collectInvoicesEvidence();
    await collectAdminPanelData();
    await runFinalAcceptanceSQL();
    
    console.log('\n=====================================');
    console.log('✅ Evidence collection complete!');
    console.log(`📁 Files saved to: ${AUDIT_DIR}`);
    console.log('=====================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error collecting evidence:', error);
    process.exit(1);
  }
}

main();
