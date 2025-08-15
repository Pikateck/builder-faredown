const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Your Render PostgreSQL connection details
const client = new Client({
  connectionString: 'postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to Render PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Test connection
    const result = await client.query('SELECT NOW()');
    console.log('📅 Current database time:', result.rows[0].now);

    // Check if transfers_markups table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transfers_markups'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('ℹ️  transfers_markups table already exists');
      
      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'transfers_markups' 
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Current table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });

      // Count existing records
      const count = await client.query('SELECT COUNT(*) FROM transfers_markups');
      console.log(`📊 Current records: ${count.rows[0].count}`);

    } else {
      console.log('⚠️  transfers_markups table does not exist - need to run migration');
      
      // Read and execute the schema file
      const schemaPath = path.join(__dirname, 'api', 'database', 'transfers-markup-schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        console.log('📄 Reading schema file...');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('🔨 Creating transfers_markups table...');
        await client.query(schema);
        console.log('✅ Table created successfully!');
        
        // Verify creation
        const verifyCount = await client.query('SELECT COUNT(*) FROM transfers_markups');
        console.log(`📊 Initial records inserted: ${verifyCount.rows[0].count}`);
        
      } else {
        console.error('❌ Schema file not found at:', schemaPath);
      }
    }

    // List all tables in database
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 All tables in database:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

setupDatabase();
