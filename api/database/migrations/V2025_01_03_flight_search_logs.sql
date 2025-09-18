-- Flight Search Logs - Temporary debugging table for airport selection validation
-- Created as per developer note for tracking airport dropdown issues

-- Create flight search logs table
CREATE TABLE IF NOT EXISTS flight_search_logs (
  id               BIGSERIAL PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT now(),
  user_id          TEXT,
  session_id       TEXT,
  leg_index        INT,
  from_code        TEXT NOT NULL,
  from_name        TEXT NOT NULL,
  to_code          TEXT NOT NULL,
  to_name          TEXT NOT NULL,
  raw_payload      JSONB,
  
  -- Additional fields for debugging
  search_type      TEXT, -- 'round-trip', 'one-way', 'multi-city'
  module_type      TEXT, -- 'flights', 'hotels', 'transfers', 'sightseeing'
  departure_date   TIMESTAMPTZ,
  return_date      TIMESTAMPTZ,
  travelers        JSONB,
  cabin_class      TEXT,
  
  -- Browser/device info for mobile testing
  user_agent       TEXT,
  is_mobile        BOOLEAN DEFAULT FALSE,
  platform         TEXT -- 'web', 'mobile-web', 'ios-native', 'android-native'
);

-- Create indexes for performance and queries
CREATE INDEX IF NOT EXISTS idx_fsl_created_at ON flight_search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fsl_from_to_codes ON flight_search_logs (from_code, to_code);
CREATE INDEX IF NOT EXISTS idx_fsl_user_session ON flight_search_logs (user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_fsl_search_type ON flight_search_logs (search_type);
CREATE INDEX IF NOT EXISTS idx_fsl_module_type ON flight_search_logs (module_type);
CREATE INDEX IF NOT EXISTS idx_fsl_platform ON flight_search_logs (platform);
CREATE INDEX IF NOT EXISTS idx_fsl_mobile ON flight_search_logs (is_mobile);

-- Create a view for easy debugging queries
CREATE OR REPLACE VIEW flight_search_summary AS
SELECT 
  id,
  created_at,
  user_id,
  leg_index,
  from_code || ' (' || from_name || ')' AS departure,
  to_code || ' (' || to_name || ')' AS destination,
  search_type,
  module_type,
  platform,
  is_mobile,
  departure_date,
  return_date,
  (raw_payload->>'travelers')::jsonb AS travelers_info
FROM flight_search_logs
ORDER BY created_at DESC;

-- Helper function to detect platform from user agent
CREATE OR REPLACE FUNCTION detect_platform(user_agent_string TEXT)
RETURNS TEXT AS $$
BEGIN
  IF user_agent_string IS NULL THEN
    RETURN 'unknown';
  END IF;
  
  -- Check for native mobile apps first
  IF user_agent_string ILIKE '%iOS-Native-App%' OR user_agent_string ILIKE '%CFNetwork%' THEN
    RETURN 'ios-native';
  ELSIF user_agent_string ILIKE '%Android-Native-App%' OR user_agent_string ILIKE '%okhttp%' THEN
    RETURN 'android-native';
  -- Check for mobile web browsers
  ELSIF user_agent_string ILIKE '%Mobile%' OR user_agent_string ILIKE '%Android%' OR user_agent_string ILIKE '%iPhone%' THEN
    RETURN 'mobile-web';
  ELSE
    RETURN 'web';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to check if request is from mobile
CREATE OR REPLACE FUNCTION is_mobile_request(user_agent_string TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_agent_string IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN user_agent_string ILIKE '%Mobile%' 
      OR user_agent_string ILIKE '%Android%' 
      OR user_agent_string ILIKE '%iPhone%'
      OR user_agent_string ILIKE '%iPad%'
      OR user_agent_string ILIKE '%iOS-Native-App%'
      OR user_agent_string ILIKE '%Android-Native-App%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Sample validation queries (for documentation)
/*

-- 1. Last 50 logged search legs
SELECT created_at, user_id, session_id, leg_index, from_code, from_name, to_code, to_name
FROM flight_search_logs
ORDER BY created_at DESC
LIMIT 50;

-- 2. Cross-check against airport master (detect name/code mismatches)
-- Note: Assumes existence of airports table with schema (code TEXT PRIMARY KEY, name TEXT, city TEXT, country TEXT)
SELECT
  l.created_at,
  l.leg_index,
  l.from_code, l.from_name,
  af.name  AS from_name_master,
  l.to_code, l.to_name,
  at.name  AS to_name_master
FROM flight_search_logs l
LEFT JOIN airports af ON af.code = l.from_code
LEFT JOIN airports at ON at.code = l.to_code
WHERE (af.name IS DISTINCT FROM l.from_name)
   OR (at.name IS DISTINCT FROM l.to_name)
ORDER BY l.created_at DESC
LIMIT 100;

-- 3. Spot identical From/To legs that should have been blocked by validation
SELECT *
FROM flight_search_logs
WHERE from_code = to_code
ORDER BY created_at DESC
LIMIT 100;

-- 4. Mobile vs Web search patterns
SELECT 
  platform,
  is_mobile,
  COUNT(*) as search_count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', created_at) as search_date
FROM flight_search_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY platform, is_mobile, DATE_TRUNC('day', created_at)
ORDER BY search_date DESC, search_count DESC;

-- 5. Multi-city search analysis
SELECT 
  session_id,
  COUNT(*) as leg_count,
  STRING_AGG(from_code || '->' || to_code, ' -> ' ORDER BY leg_index) as route,
  created_at
FROM flight_search_logs
WHERE search_type = 'multi-city'
GROUP BY session_id, created_at
ORDER BY created_at DESC;

*/

-- Add a comment for temporary nature
COMMENT ON TABLE flight_search_logs IS 'Temporary debugging table for airport selection validation. Created per developer note to track BOM/DXB display issues.';
COMMENT ON VIEW flight_search_summary IS 'Simplified view for debugging airport selection issues.';
