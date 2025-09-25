/**
 * Fix alias search functionality to properly resolve aliases
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

async function fixAliasSearch() {
  console.log("🔧 Fixing alias search functionality...");
  
  try {
    // First, let's check what aliases we have
    console.log("\n📋 Current aliases:");
    const aliasesResult = await pool.query(`
      SELECT da.alias, da.dest_type, 
             CASE da.dest_type
               WHEN 'city' THEN c.name
               WHEN 'country' THEN co.name  
               WHEN 'region' THEN r.name
             END as dest_name
      FROM destination_aliases da
      LEFT JOIN cities c ON da.dest_type = 'city' AND da.dest_id = c.id
      LEFT JOIN countries co ON da.dest_type = 'country' AND da.dest_id = co.id
      LEFT JOIN regions r ON da.dest_type = 'region' AND da.dest_id = r.id
      WHERE da.is_active = true
    `);
    
    aliasesResult.rows.forEach(row => {
      console.log(`   ${row.alias} → ${row.dest_name} (${row.dest_type})`);
    });

    // Update the search function to properly handle aliases
    console.log("\n🔄 Updating search function for better alias resolution...");
    
    await pool.query(`DROP FUNCTION IF EXISTS search_destinations(text, int, text[], boolean)`);
    
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
        alias_results TEXT[];
      BEGIN
        -- Normalize query
        normalized_query := LOWER(TRIM(unaccent(query_text)));
        
        -- Step 1: Check for exact alias matches first
        SELECT ARRAY_AGG(DISTINCT mv_inner.type || '|' || mv_inner.entity_id || '|' || mv_inner.label)
        INTO alias_results
        FROM destination_aliases da
        JOIN destinations_search_mv mv_inner ON (
          (da.dest_type = 'city' AND mv_inner.type = 'city' AND da.dest_id = mv_inner.entity_id) OR
          (da.dest_type = 'country' AND mv_inner.type = 'country' AND da.dest_id = mv_inner.entity_id) OR
          (da.dest_type = 'region' AND mv_inner.type = 'region' AND da.dest_id = mv_inner.entity_id)
        )
        WHERE LOWER(unaccent(da.alias)) = normalized_query
          AND da.is_active = true
          AND mv_inner.is_active = true;
        
        -- Step 2: Return results, prioritizing aliases
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
            -- Boost exact alias matches to top
            WHEN alias_results IS NOT NULL AND 
                 (mv.type || '|' || mv.entity_id || '|' || mv.label) = ANY(alias_results) THEN 10.0
            -- Exact match
            WHEN LOWER(unaccent(mv.label)) = normalized_query THEN 9.0
            -- Prefix match
            WHEN LOWER(unaccent(mv.label)) LIKE normalized_query || '%' THEN 8.0
            -- Contains match
            WHEN LOWER(unaccent(mv.label)) LIKE '%' || normalized_query || '%' THEN 7.0
            -- Label with country match
            WHEN LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))) LIKE '%' || normalized_query || '%' THEN 6.0
            -- Code match
            WHEN LOWER(unaccent(mv.code)) LIKE '%' || normalized_query || '%' THEN 5.0
            -- Fuzzy match
            ELSE GREATEST(
              similarity(LOWER(unaccent(mv.label)), normalized_query) * 4.0,
              similarity(LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))), normalized_query) * 3.0
            )
          END AS score,
          CASE
            WHEN alias_results IS NOT NULL AND 
                 (mv.type || '|' || mv.entity_id || '|' || mv.label) = ANY(alias_results) THEN 'alias'
            ELSE 'direct'
          END AS source
        FROM destinations_search_mv mv
        WHERE 
          (NOT only_active OR mv.is_active = true)
          AND mv.type = ANY(types_filter)
          AND (
            -- Alias match (exact)
            (alias_results IS NOT NULL AND 
             (mv.type || '|' || mv.entity_id || '|' || mv.label) = ANY(alias_results))
            -- Direct text match
            OR LOWER(unaccent(mv.label)) LIKE '%' || normalized_query || '%'
            OR LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))) LIKE '%' || normalized_query || '%'
            OR LOWER(unaccent(mv.code)) LIKE '%' || normalized_query || '%'
            -- Fuzzy match
            OR similarity(LOWER(unaccent(mv.label)), normalized_query) > 0.3
            OR similarity(LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))), normalized_query) > 0.3
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
    
    console.log("✅ Search function updated with improved alias resolution");

    // Test alias searches
    console.log("\n🧪 Testing alias searches:");
    const testAliases = ['dxb', 'bombay', 'uae', 'uk', 'par', 'lon'];
    
    for (const alias of testAliases) {
      try {
        const searchResult = await pool.query(`
          SELECT type, label, score, source 
          FROM search_destinations($1, 3)
          ORDER BY score DESC
        `, [alias]);
        
        console.log(`   "${alias}": ${searchResult.rows.length} results`);
        searchResult.rows.forEach(row => {
          console.log(`      ${row.type}: ${row.label} (score: ${parseFloat(row.score).toFixed(2)}, source: ${row.source})`);
        });
      } catch (error) {
        console.log(`   "${alias}": Error - ${error.message}`);
      }
    }

    console.log("\n🎉 Alias search functionality updated!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixAliasSearch().catch(console.error);
