-- Migration: Add TBO Supplier Integration
-- Date: 2025-03-15
-- Description: Adds TBO as second flight supplier with supplier-aware markup and promo

-- ============================================================================
-- 1. TBO Token Cache Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tbo_token_cache (
  id SERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  agency_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tbo_token_expires 
  ON tbo_token_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_tbo_token_agency 
  ON tbo_token_cache(agency_id, expires_at DESC);

-- ============================================================================
-- 2. Add Supplier Tagging to Existing Tables
-- ============================================================================

-- Search logs: track which supplier returned each result
ALTER TABLE search_logs 
  ADD COLUMN IF NOT EXISTS supplier TEXT 
  CHECK (supplier IN ('amadeus', 'tbo', 'hotelbeds'));

-- Flight results: tag each result with its supplier
ALTER TABLE flight_results 
  ADD COLUMN IF NOT EXISTS supplier TEXT 
  CHECK (supplier IN ('amadeus', 'tbo'));

-- Bookings: track supplier and supplier-specific PNR
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS supplier TEXT 
  CHECK (supplier IN ('amadeus', 'tbo', 'hotelbeds'));

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS supplier_pnr TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_supplier 
  ON bookings(supplier);

CREATE INDEX IF NOT EXISTS idx_bookings_supplier_pnr 
  ON bookings(supplier_pnr);

-- ============================================================================
-- 3. Supplier Master Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS supplier_master (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,             -- 'amadeus' | 'tbo' | 'hotelbeds'
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  weight INTEGER NOT NULL DEFAULT 100,   -- for ranking/priority
  supports_gds BOOLEAN DEFAULT TRUE,
  supports_lcc BOOLEAN DEFAULT FALSE,
  supports_ndc BOOLEAN DEFAULT FALSE,
  online_cancel BOOLEAN DEFAULT FALSE,
  balance DECIMAL(12, 2),
  balance_currency TEXT DEFAULT 'USD',
  last_balance_check TIMESTAMPTZ,
  last_health_check TIMESTAMPTZ,
  health_status JSONB DEFAULT '{}'::JSONB,
  credentials_config JSONB DEFAULT '{}'::JSONB,  -- masked credentials metadata
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_master_enabled 
  ON supplier_master(enabled, weight DESC);

-- Insert default supplier records
INSERT INTO supplier_master (code, name, enabled, weight, supports_gds, supports_lcc, supports_ndc, online_cancel)
VALUES 
  ('amadeus', 'Amadeus', TRUE, 100, TRUE, FALSE, FALSE, FALSE),
  ('tbo', 'TBO (Travel Boutique Online)', TRUE, 90, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  supports_gds = EXCLUDED.supports_gds,
  supports_lcc = EXCLUDED.supports_lcc,
  supports_ndc = EXCLUDED.supports_ndc,
  online_cancel = EXCLUDED.online_cancel;

-- ============================================================================
-- 4. Supplier-Aware Markup Rules
-- ============================================================================

-- Add supplier scope to markup rules
ALTER TABLE markup_rules 
  ADD COLUMN IF NOT EXISTS supplier_scope TEXT 
  CHECK (supplier_scope IN ('all', 'amadeus', 'tbo')) 
  DEFAULT 'all';

CREATE INDEX IF NOT EXISTS idx_markup_rules_supplier 
  ON markup_rules(supplier_scope, active);

-- Update existing markup rules to 'all' if NULL
UPDATE markup_rules 
SET supplier_scope = 'all' 
WHERE supplier_scope IS NULL;

-- ============================================================================
-- 5. Supplier-Aware Promo Codes
-- ============================================================================

-- Add supplier scope to promo codes
ALTER TABLE promo_codes 
  ADD COLUMN IF NOT EXISTS supplier_scope TEXT 
  CHECK (supplier_scope IN ('all', 'amadeus', 'tbo')) 
  DEFAULT 'all';

CREATE INDEX IF NOT EXISTS idx_promo_codes_supplier 
  ON promo_codes(supplier_scope, active);

-- Update existing promo codes to 'all' if NULL
UPDATE promo_codes 
SET supplier_scope = 'all' 
WHERE supplier_scope IS NULL;

-- ============================================================================
-- 6. Supplier Analytics Views
-- ============================================================================

-- Supplier performance view
CREATE OR REPLACE VIEW supplier_performance AS
SELECT 
  s.code AS supplier_code,
  s.name AS supplier_name,
  s.enabled,
  COUNT(DISTINCT b.id) AS total_bookings,
  SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
  SUM(b.total_amount) AS total_revenue,
  AVG(b.total_amount) AS avg_booking_value,
  MAX(b.created_at) AS last_booking_date
FROM supplier_master s
LEFT JOIN bookings b ON LOWER(b.supplier) = LOWER(s.code)
WHERE b.created_at >= NOW() - INTERVAL '30 days'
GROUP BY s.code, s.name, s.enabled;

-- Supplier search performance view
CREATE OR REPLACE VIEW supplier_search_stats AS
SELECT 
  supplier,
  DATE(created_at) AS search_date,
  COUNT(*) AS total_searches,
  COUNT(DISTINCT session_id) AS unique_sessions,
  AVG(response_time_ms) AS avg_response_time,
  COUNT(CASE WHEN result_count > 0 THEN 1 END) AS successful_searches,
  ROUND(
    100.0 * COUNT(CASE WHEN result_count > 0 THEN 1 END) / COUNT(*),
    2
  ) AS success_rate
FROM search_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND supplier IS NOT NULL
GROUP BY supplier, DATE(created_at)
ORDER BY search_date DESC, supplier;

-- ============================================================================
-- 7. Applied Markups and Promos Audit
-- ============================================================================

-- Create table to track applied markups per booking
CREATE TABLE IF NOT EXISTS applied_markups (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  markup_rule_id INTEGER,
  supplier TEXT,
  markup_type TEXT, -- 'percentage' | 'flat'
  markup_value DECIMAL(10, 2),
  applied_amount DECIMAL(10, 2),
  base_fare DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applied_markups_booking 
  ON applied_markups(booking_id);

CREATE INDEX IF NOT EXISTS idx_applied_markups_supplier 
  ON applied_markups(supplier);

-- Create table to track applied promos per booking
CREATE TABLE IF NOT EXISTS applied_promos (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  promo_code_id INTEGER,
  promo_code TEXT,
  supplier TEXT,
  discount_type TEXT, -- 'percentage' | 'flat'
  discount_value DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  pre_discount_total DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applied_promos_booking 
  ON applied_promos(booking_id);

CREATE INDEX IF NOT EXISTS idx_applied_promos_supplier 
  ON applied_promos(supplier);

-- ============================================================================
-- 8. Supplier Health Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_health_logs (
  id SERIAL PRIMARY KEY,
  supplier_code TEXT NOT NULL,
  endpoint TEXT NOT NULL,  -- 'search' | 'book' | 'ticket' | 'cancel' | 'balance'
  status TEXT NOT NULL,    -- 'success' | 'failure' | 'timeout'
  response_time_ms INTEGER,
  error_message TEXT,
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_health_supplier 
  ON supplier_health_logs(supplier_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_health_endpoint 
  ON supplier_health_logs(supplier_code, endpoint, created_at DESC);

-- ============================================================================
-- 9. Comments and Documentation
-- ============================================================================

COMMENT ON TABLE tbo_token_cache IS 'Caches TBO authentication tokens to avoid repeated auth calls';
COMMENT ON TABLE supplier_master IS 'Master configuration table for all travel suppliers (Amadeus, TBO, Hotelbeds, etc.)';
COMMENT ON TABLE applied_markups IS 'Audit trail of markups applied to bookings, supplier-aware';
COMMENT ON TABLE applied_promos IS 'Audit trail of promo codes applied to bookings, supplier-aware';
COMMENT ON TABLE supplier_health_logs IS 'Health check and API call logs for supplier monitoring';

COMMENT ON COLUMN markup_rules.supplier_scope IS 'Restricts markup rule to specific supplier: all, amadeus, or tbo';
COMMENT ON COLUMN promo_codes.supplier_scope IS 'Restricts promo code to specific supplier: all, amadeus, or tbo';
COMMENT ON COLUMN bookings.supplier IS 'Which supplier was used for this booking';
COMMENT ON COLUMN bookings.supplier_pnr IS 'Supplier-specific PNR/booking reference';

-- ============================================================================
-- 10. Grant Permissions
-- ============================================================================

-- Grant permissions to application user (adjust role name as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO faredown_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO faredown_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO faredown_readonly;
