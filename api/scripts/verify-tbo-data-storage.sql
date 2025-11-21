-- ============================================================
-- TBO Data Storage Verification Script
-- Run this to verify that city data, mappings, and cache are
-- properly populated according to the sync plan
-- ============================================================

-- ============================================================
-- 1) Verify TBO Countries (should have IN, AE, GB, US, FR, AT, TH, SG)
-- ============================================================
SELECT 'TBO COUNTRIES' AS check_name;
SELECT 
  country_code, 
  country_name, 
  is_active, 
  COUNT(*) as city_count
FROM tbo_countries tc
LEFT JOIN tbo_cities t ON t.country_code = tc.country_code
GROUP BY tc.id, tc.country_code, tc.country_name, tc.is_active
ORDER BY tc.country_code;

-- ============================================================
-- 2) Verify TBO Cities count per country
-- ============================================================
SELECT 'TBO CITIES PER COUNTRY' AS check_name;
SELECT 
  country_code, 
  COUNT(*) as city_count,
  MIN(created_at) as oldest_sync,
  MAX(updated_at) as latest_sync
FROM tbo_cities
GROUP BY country_code
ORDER BY country_code;

-- Expected counts from sync log:
-- IN: 1058, AE: 31, GB: 2459, US: 7124, FR: 5169, AT: 1375, TH: 322, SG: 1

-- ============================================================
-- 3) Sample TBO cities for India
-- ============================================================
SELECT 'SAMPLE TBO CITIES (India)' AS check_name;
SELECT 
  tbo_city_id,
  city_name,
  country_code,
  region_name
FROM tbo_cities
WHERE country_code = 'IN'
ORDER BY city_name
LIMIT 10;

-- ============================================================
-- 4) Verify City Mappings exist for key cities
-- ============================================================
SELECT 'CITY MAPPINGS CHECK' AS check_name;
SELECT 
  hotelbeds_city_code,
  hotelbeds_city_name,
  tbo_city_id,
  tbo_city_name,
  match_confidence,
  match_method
FROM city_mapping
WHERE hotelbeds_city_name IN ('Mumbai', 'New Delhi', 'Dubai')
ORDER BY hotelbeds_city_name;

-- ============================================================
-- 5) Check mapping coverage - how many Hotelbeds cities are mapped
-- ============================================================
SELECT 'MAPPING COVERAGE' AS check_name;
SELECT 
  COUNT(*) as total_mappings,
  COUNT(*) FILTER (WHERE is_verified) as verified_mappings,
  COUNT(*) FILTER (WHERE match_confidence >= 80) as high_confidence,
  COUNT(*) FILTER (WHERE match_confidence < 80) as low_confidence
FROM city_mapping;

-- ============================================================
-- 6) Identify unmapped cities
-- ============================================================
SELECT 'UNMAPPED CITIES' AS check_name;
SELECT 
  hotelbeds_city_code,
  hotelbeds_city_name,
  hotelbeds_country_code
FROM city_mapping
WHERE tbo_city_id IS NULL OR tbo_city_id = ''
LIMIT 20;

-- ============================================================
-- 7) Verify Hotel Cache infrastructure (schema exists)
-- ============================================================
SELECT 'HOTEL CACHE TABLES' AS check_name;
SELECT 
  tablename,
  (SELECT COUNT(*) FROM hotel_search_cache) as cache_entries,
  (SELECT COUNT(*) FROM hotel_search_cache_results) as result_entries
FROM pg_tables
WHERE tablename IN ('hotel_search_cache', 'hotel_search_cache_results', 'tbo_hotels_normalized')
  AND schemaname = 'public';

-- ============================================================
-- 8) Check if any TBO searches have been cached
-- ============================================================
SELECT 'CACHED SEARCHES (if any)' AS check_name;
SELECT 
  supplier,
  COUNT(*) as search_count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM hotel_search_cache
GROUP BY supplier;

-- ============================================================
-- 9) Verify TBO hotel normalization tables
-- ============================================================
SELECT 'TBO HOTEL NORMALIZED DATA' AS check_name;
SELECT 
  COUNT(*) as total_hotels,
  COUNT(DISTINCT city_id) as cities_with_hotels,
  MIN(created_at) as oldest_entry,
  MAX(last_synced_at) as latest_sync
FROM tbo_hotels_normalized;

-- ============================================================
-- 10) Check tbo_cities to cities cross-reference (for local mapping optimization)
-- ============================================================
SELECT 'SAMPLE TBO CITY WITH POTENTIAL HOTELBEDS MATCH' AS check_name;
SELECT DISTINCT
  tc.tbo_city_id,
  tc.city_name,
  tc.city_name_normalized,
  tc.country_code,
  cm.hotelbeds_city_code,
  cm.hotelbeds_city_name,
  cm.match_confidence
FROM tbo_cities tc
LEFT JOIN city_mapping cm ON cm.tbo_city_id = tc.tbo_city_id
WHERE tc.country_code = 'IN'
ORDER BY tc.city_name
LIMIT 10;
