/**
 * Fix the search function to work with the current schema
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

async function fixSearchFunction() {
  console.log("🔧 Fixing search function to work with current schema...");
  
  try {
    // Drop the existing function
    await pool.query(`DROP FUNCTION IF EXISTS search_destinations(text, int, text[], boolean)`);
    
    // Create a simplified search function that works with the materialized view
    await pool.query(`
      CREATE OR REPLACE FUNCTION search_destinations(
        query_text TEXT,
        result_limit INT DEFAULT 20,
        types_filter TEXT[] DEFAULT ARRAY['city', 'country', 'region'],
        only_active BOOLEAN DEFAULT true
      )
      RETURNS TABLE (
        type TEXT,
        entity_id UUID,
        label TEXT,
        label_with_country TEXT,
        country TEXT,
        region TEXT,
        code TEXT,
        score FLOAT,
        source TEXT
      ) 
      LANGUAGE plpgsql AS $$
      DECLARE
        normalized_query TEXT;
        alias_matches TEXT[];
      BEGIN
        -- Normalize query
        normalized_query := LOWER(TRIM(unaccent(query_text)));
        
        -- Step 1: Find matching aliases
        SELECT ARRAY_AGG(DISTINCT LOWER(alias))
        INTO alias_matches
        FROM destination_aliases da
        WHERE LOWER(unaccent(da.alias)) LIKE '%' || normalized_query || '%'
          AND da.is_active = true;
        
        -- Step 2: Return results from materialized view
        RETURN QUERY
        SELECT 
          mv.type,
          mv.entity_id,
          mv.label,
          mv.label_with_country,
          mv.country,
          mv.region,
          mv.code,
          CASE
            -- Exact match
            WHEN LOWER(unaccent(mv.label)) = normalized_query THEN 1.0
            -- Prefix match
            WHEN LOWER(unaccent(mv.label)) LIKE normalized_query || '%' THEN 0.9
            -- Contains match
            WHEN LOWER(unaccent(mv.label)) LIKE '%' || normalized_query || '%' THEN 0.7
            -- Label with country match
            WHEN LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))) LIKE '%' || normalized_query || '%' THEN 0.6
            -- Code match
            WHEN LOWER(unaccent(mv.code)) LIKE '%' || normalized_query || '%' THEN 0.8
            -- Fuzzy match
            ELSE GREATEST(
              similarity(LOWER(unaccent(mv.label)), normalized_query) * 0.6,
              similarity(LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))), normalized_query) * 0.4
            )
          END AS score,
          CASE
            WHEN alias_matches IS NOT NULL AND ARRAY_LENGTH(alias_matches, 1) > 0 THEN 'alias'
            ELSE 'direct'
          END AS source
        FROM destinations_search_mv mv
        WHERE 
          (NOT only_active OR mv.is_active = true)
          AND mv.type = ANY(types_filter)
          AND (
            -- Direct text match
            LOWER(unaccent(mv.label)) LIKE '%' || normalized_query || '%'
            OR LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))) LIKE '%' || normalized_query || '%'
            OR LOWER(unaccent(mv.code)) LIKE '%' || normalized_query || '%'
            -- Fuzzy match
            OR similarity(LOWER(unaccent(mv.label)), normalized_query) > 0.25
            OR similarity(LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))), normalized_query) > 0.25
          )
        ORDER BY 
          score DESC,
          CASE mv.type 
            WHEN 'city' THEN 1 
            WHEN 'country' THEN 2 
            WHEN 'region' THEN 3 
          END,
          mv.sort_order ASC,
          mv.label ASC
        LIMIT result_limit;
      END $$;
    `);
    
    console.log("✅ Search function updated successfully");
    
    // Test the function
    console.log("\n🧪 Testing search function...");
    const testQueries = ['dubai', 'paris', 'europe', 'dxb'];
    
    for (const testQuery of testQueries) {
      try {
        const result = await pool.query(`
          SELECT type, label, score, source 
          FROM search_destinations($1, 5) 
        `, [testQuery]);
        
        console.log(`   "${testQuery}": ${result.rows.length} results`);
        result.rows.forEach(row => {
          console.log(`      ${row.type}: ${row.label} (score: ${row.score})`);
        });
      } catch (error) {
        console.log(`   "${testQuery}": Error - ${error.message}`);
      }
    }
    
    console.log("\n🎉 Search function fixed and tested!");
    
  } catch (error) {
    console.error("❌ Failed to fix search function:", error.message);
  } finally {
    await pool.end();
  }
}

fixSearchFunction().catch(console.error);
