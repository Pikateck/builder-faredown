#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabaseIndexes() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking current database indexes and structure...\n');
    
    // Check if required tables exist
    console.log('=== TABLES CHECK ===');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('regions', 'countries', 'cities')
      ORDER BY table_name;
    `;
    const tables = await client.query(tablesQuery);
    console.log('📊 Available tables:', tables.rows.map(r => r.table_name));
    
    // Check indexes on each table
    console.log('\n=== INDEXES CHECK ===');
    const indexQuery = `
      SELECT 
        t.relname as table_name,
        i.relname as index_name,
        am.amname as index_type,
        pg_get_indexdef(i.oid) as index_definition
      FROM 
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_am am
      WHERE 
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND i.relam = am.oid
        AND t.relname IN ('regions', 'countries', 'cities')
      ORDER BY t.relname, i.relname;
    `;
    
    const indexes = await client.query(indexQuery);
    
    if (indexes.rows.length === 0) {
      console.log('⚠️  No indexes found on destination tables!');
    } else {
      indexes.rows.forEach(row => {
        console.log(`📋 ${row.table_name}.${row.index_name} (${row.index_type})`);
        console.log(`   ${row.index_definition}`);
      });
    }
    
    // Check available extensions
    console.log('\n=== EXTENSIONS CHECK ===');
    const extQuery = `SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'uuid-ossp');`;
    const extensions = await client.query(extQuery);
    console.log('🔧 Available extensions:', extensions.rows.map(r => r.extname));
    
    // Check table structures
    console.log('\n=== TABLE STRUCTURES ===');
    for (const tableName of ['regions', 'countries', 'cities']) {
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `;
      
      const structure = await client.query(structureQuery, [tableName]);
      if (structure.rows.length > 0) {
        console.log(`\n📊 ${tableName.toUpperCase()} table structure:`);
        structure.rows.forEach(col => {
          console.log(`   ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
        });
      }
    }
    
    // Check sample data and counts
    console.log('\n=== DATA COUNTS ===');
    for (const tableName of ['regions', 'countries', 'cities']) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName};`;
        const count = await client.query(countQuery);
        console.log(`📊 ${tableName}: ${count.rows[0].count} records`);
      } catch (err) {
        console.log(`❌ ${tableName}: table not found or accessible`);
      }
    }
    
    // Test search performance with EXPLAIN
    console.log('\n=== SEARCH QUERY PERFORMANCE ===');
    try {
      const searchQuery = `
        EXPLAIN ANALYZE
        SELECT name, 'region' as type FROM regions WHERE lower(name) LIKE '%dubai%'
        UNION ALL
        SELECT name, 'country' as type FROM countries WHERE lower(name) LIKE '%dubai%'  
        UNION ALL
        SELECT name, 'city' as type FROM cities WHERE lower(name) LIKE '%dubai%';
      `;
      
      const explain = await client.query(searchQuery);
      console.log('🔍 Search query execution plan:');
      explain.rows.forEach(row => {
        console.log(`   ${row['QUERY PLAN']}`);
      });
    } catch (err) {
      console.log('❌ Could not analyze search query:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabaseIndexes().catch(console.error);
