/**
 * Database Performance Diagnostic Script
 * Checks indexes, query performance, and suggests optimizations
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

async function diagnosePerformance() {
  console.log("🔍 Destinations Search Performance Diagnostic");
  console.log("=" .repeat(50));

  try {
    // 1. Check if tables exist
    console.log("\n📋 1. Checking Tables...");
    const tablesQuery = `
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN ('regions', 'countries', 'cities', 'destination_aliases')
      ORDER BY table_name;
    `;
    const tables = await pool.query(tablesQuery);
    tables.rows.forEach(table => {
      console.log(`   ✓ ${table.table_name} (${table.column_count} columns)`);
    });

    // 2. Check row counts
    console.log("\n📊 2. Checking Row Counts...");
    const countQueries = [
      "SELECT 'regions' as table_name, COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM regions",
      "SELECT 'countries' as table_name, COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM countries", 
      "SELECT 'cities' as table_name, COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM cities",
      "SELECT 'destination_aliases' as table_name, COUNT(*) as total, COUNT(*) as active FROM destination_aliases"
    ];
    
    for (const query of countQueries) {
      try {
        const result = await pool.query(query);
        const row = result.rows[0];
        console.log(`   📈 ${row.table_name}: ${row.total} total, ${row.active} active`);
      } catch (error) {
        console.log(`   ❌ ${query.split("'")[1]}: Table not found or query failed`);
      }
    }

    // 3. Check indexes
    console.log("\n🔗 3. Checking Indexes...");
    const indexQuery = `
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes 
      WHERE tablename IN ('regions', 'countries', 'cities', 'destination_aliases')
        AND schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    const indexes = await pool.query(indexQuery);
    
    if (indexes.rows.length === 0) {
      console.log("   ⚠️  NO INDEXES FOUND! This explains the slow performance.");
    } else {
      indexes.rows.forEach(idx => {
        const isGin = idx.indexdef.includes('gin');
        const isTrigram = idx.indexdef.includes('gin_trgm_ops');
        const marker = isTrigram ? '🚀' : isGin ? '⚡' : '📋';
        console.log(`   ${marker} ${idx.tablename}.${idx.indexname}`);
        if (isTrigram) {
          console.log(`      └─ Fast search index: ${idx.indexdef.substring(0, 80)}...`);
        }
      });
    }

    // 4. Check pg_trgm extension
    console.log("\n🔌 4. Checking pg_trgm Extension...");
    try {
      const extQuery = "SELECT * FROM pg_extension WHERE extname = 'pg_trgm'";
      const ext = await pool.query(extQuery);
      if (ext.rows.length > 0) {
        console.log("   ✅ pg_trgm extension is installed");
      } else {
        console.log("   ❌ pg_trgm extension NOT INSTALLED - this will cause slow searches");
      }
    } catch (error) {
      console.log("   ❌ Could not check pg_trgm extension");
    }

    // 5. Test search performance
    console.log("\n⏱️  5. Testing Search Performance...");
    const testQueries = [
      { term: "dubai", expected: "Should find Dubai city" },
      { term: "paris", expected: "Should find Paris city" },
      { term: "europe", expected: "Should find Europe region" },
      { term: "dxb", expected: "Should find Dubai via alias" }
    ];

    for (const test of testQueries) {
      console.log(`\n   Testing: "${test.term}"`);
      const start = Date.now();
      
      try {
        // Use the same query as the API
        const searchQuery = `
          SELECT * FROM (
            (
              SELECT
                'city' as type,
                ci.id,
                ci.name || ', ' || co.name as label,
                r.name as region_name,
                co.name as country_name,
                1 as type_priority,
                CASE 
                  WHEN ci.name ILIKE $2 THEN 1
                  WHEN ci.name ILIKE $1 THEN 2
                  ELSE 3
                END as search_priority
              FROM cities ci
              JOIN countries co ON ci.country_id = co.id
              JOIN regions r ON co.region_id = r.id
              WHERE ci.is_active = TRUE
                AND co.is_active = TRUE
                AND r.is_active = TRUE
                AND (
                  ci.name ILIKE $1
                  OR ($3 = ANY(COALESCE(ci.search_tokens, ARRAY[]::text[])))
                )
              ORDER BY search_priority, ci.name
              LIMIT 3
            )
            UNION ALL
            (
              SELECT
                'country' as type,
                co.id,
                co.name as label,
                r.name as region_name,
                co.name as country_name,
                2 as type_priority,
                CASE 
                  WHEN co.name ILIKE $2 THEN 1
                  WHEN co.name ILIKE $1 THEN 2
                  ELSE 3
                END as search_priority
              FROM countries co
              JOIN regions r ON co.region_id = r.id
              WHERE co.is_active = TRUE
                AND r.is_active = TRUE
                AND (
                  co.name ILIKE $1
                  OR ($3 = ANY(COALESCE(co.search_tokens, ARRAY[]::text[])))
                )
              ORDER BY search_priority, co.name
              LIMIT 2
            )
            UNION ALL
            (
              SELECT
                'region' as type,
                r.id,
                r.name as label,
                r.name as region_name,
                NULL as country_name,
                3 as type_priority,
                CASE 
                  WHEN r.name ILIKE $2 THEN 1
                  WHEN r.name ILIKE $1 THEN 2
                  ELSE 3
                END as search_priority
              FROM regions r
              WHERE r.is_active = TRUE
                AND (
                  r.name ILIKE $1
                  OR ($3 = ANY(COALESCE(r.search_tokens, ARRAY[]::text[])))
                )
              ORDER BY search_priority, r.name
              LIMIT 2
            )
          ) combined_results
          ORDER BY type_priority, search_priority, label
          LIMIT 10
        `;

        const searchPattern = `%${test.term}%`;
        const exactPattern = `${test.term}%`;
        const result = await pool.query(searchQuery, [searchPattern, exactPattern, test.term]);
        
        const duration = Date.now() - start;
        const status = duration < 100 ? '🚀' : duration < 300 ? '⚡' : duration < 1000 ? '⚠️ ' : '🐌';
        
        console.log(`   ${status} ${duration}ms - Found ${result.rows.length} results`);
        
        if (result.rows.length > 0) {
          result.rows.forEach(row => {
            console.log(`      └─ ${row.type}: ${row.label}`);
          });
        } else {
          console.log(`      └─ ❌ No results found`);
        }
        
      } catch (error) {
        const duration = Date.now() - start;
        console.log(`   ❌ ${duration}ms - Query failed: ${error.message}`);
      }
    }

    // 6. Performance recommendations
    console.log("\n💡 6. Performance Recommendations:");
    
    const trigramIndexes = indexes.rows.filter(idx => idx.indexdef.includes('gin_trgm_ops'));
    
    if (trigramIndexes.length === 0) {
      console.log("\n   🚨 CRITICAL: Create trigram indexes for fast search:");
      console.log("   ```sql");
      console.log("   CREATE EXTENSION IF NOT EXISTS pg_trgm;");
      console.log("   CREATE INDEX CONCURRENTLY idx_regions_name_trgm ON regions USING gin (name gin_trgm_ops);");
      console.log("   CREATE INDEX CONCURRENTLY idx_countries_name_trgm ON countries USING gin (name gin_trgm_ops);");
      console.log("   CREATE INDEX CONCURRENTLY idx_cities_name_trgm ON cities USING gin (name gin_trgm_ops);");
      console.log("   ```");
    }

    const tokenIndexes = indexes.rows.filter(idx => idx.indexdef.includes('search_tokens'));
    if (tokenIndexes.length === 0) {
      console.log("\n   ⚡ Add search_tokens GIN indexes for alias support:");
      console.log("   ```sql");
      console.log("   CREATE INDEX CONCURRENTLY idx_cities_tokens ON cities USING gin (search_tokens);");
      console.log("   CREATE INDEX CONCURRENTLY idx_countries_tokens ON countries USING gin (search_tokens);");
      console.log("   CREATE INDEX CONCURRENTLY idx_regions_tokens ON regions USING gin (search_tokens);");
      console.log("   ```");
    }

    console.log("\n   📈 Query optimizations:");
    console.log("   - Use LIMIT in subqueries to reduce UNION overhead");
    console.log("   - Add COALESCE for nullable arrays");
    console.log("   - Consider separating exact vs fuzzy search paths");

  } catch (error) {
    console.error("❌ Diagnostic failed:", error.message);
  } finally {
    await pool.end();
  }
}

// Run diagnostic
diagnosePerformance().catch(console.error);
