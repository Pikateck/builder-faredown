-- Safe TBO Migration: Creates missing tables if needed
-- Date: 2025-03-15

-- ============================================================================
-- 1. Create Core Tables If Missing
-- ============================================================================

-- Search logs table
CREATE TABLE IF NOT EXISTS search_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  session_id TEXT,
  search_type TEXT,
  origin TEXT,
  destination TEXT,
  departure_date DATE,
  return_date DATE,
  adults INTEGER,
  children INTEGER,
  cabin_class TEXT,
  result_count INTEGER,
  response_time_ms INTEGER,
  supplier TEXT CHECK (supplier IN ('amadeus', 'tbo', 'hotelbeds')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flight results table
CREATE TABLE IF NOT EXISTS flight_results (
  id SERIAL PRIMARY KEY,
  search_log_id INTEGER REFERENCES search_logs(id),
  airline_code TEXT,
  flight_number TEXT,
  origin TEXT,
  destination TEXT,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  duration INTEGER,
  stops INTEGER,
  price DECIMAL(10,2),
  currency TEXT,
  supplier TEXT CHECK (supplier IN ('amadeus', 'tbo')),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  booking_reference TEXT UNIQUE,
  pnr TEXT,
  supplier TEXT CHECK (supplier IN ('amadeus', 'tbo', 'hotelbeds')),
  supplier_pnr TEXT,
  status TEXT,
  total_amount DECIMAL(12,2),
  currency TEXT DEFAULT 'INR',
  booking_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markup rules table
CREATE TABLE IF NOT EXISTS markup_rules (
  id SERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  description TEXT,
  module TEXT, -- 'air', 'hotel', 'transfer'
  airline_code TEXT,
  route_from TEXT,
  route_to TEXT,
  booking_class TEXT,
  m_type TEXT, -- 'percentage' | 'flat'
  m_value DECIMAL(10,2),
  current_min_pct DECIMAL(5,2),
  current_max_pct DECIMAL(5,2),
  bargain_min_pct DECIMAL(5,2),
  bargain_max_pct DECIMAL(5,2),
  valid_from DATE,
  valid_to DATE,
  priority INTEGER DEFAULT 1,
  user_type TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  supplier_scope TEXT CHECK (supplier_scope IN ('all', 'amadeus', 'tbo')) DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT, -- 'percentage' | 'flat'
  discount_value DECIMAL(10,2),
  min_booking_amount DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  supplier_scope TEXT CHECK (supplier_scope IN ('all', 'amadeus', 'tbo')) DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TBO Token Cache Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tbo_token_cache (
  id SERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  agency_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tbo_token_expires ON tbo_token_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_tbo_token_agency ON tbo_token_cache(agency_id, expires_at DESC);

-- ============================================================================
-- 3. Add Missing Columns to Existing Tables
-- ============================================================================

-- Only add columns if tables exist
DO $$ 
BEGIN
  -- Add supplier to search_logs if not exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_logs') THEN
    ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS supplier TEXT CHECK (supplier IN ('amadeus', 'tbo', 'hotelbeds'));
  END IF;

  -- Add supplier to flight_results if not exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flight_results') THEN
    ALTER TABLE flight_results ADD COLUMN IF NOT EXISTS supplier TEXT CHECK (supplier IN ('amadeus', 'tbo'));
  END IF;

  -- Add supplier columns to bookings if not exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS supplier TEXT CHECK (supplier IN ('amadeus', 'tbo', 'hotelbeds'));
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS supplier_pnr TEXT;
  END IF;

  -- Add supplier_scope to markup_rules if not exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'markup_rules') THEN
    ALTER TABLE markup_rules ADD COLUMN IF NOT EXISTS supplier_scope TEXT CHECK (supplier_scope IN ('all', 'amadeus', 'tbo')) DEFAULT 'all';
  END IF;

  -- Add supplier_scope to promo_codes if not exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promo_codes') THEN
    ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS supplier_scope TEXT CHECK (supplier_scope IN ('all', 'amadeus', 'tbo')) DEFAULT 'all';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_supplier ON bookings(supplier);
CREATE INDEX IF NOT EXISTS idx_bookings_supplier_pnr ON bookings(supplier_pnr);
CREATE INDEX IF NOT EXISTS idx_markup_rules_supplier ON markup_rules(supplier_scope);
CREATE INDEX IF NOT EXISTS idx_promo_codes_supplier ON promo_codes(supplier_scope);

-- ============================================================================
-- 4. Supplier Master Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS supplier_master (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  weight INTEGER NOT NULL DEFAULT 100,
  supports_gds BOOLEAN DEFAULT TRUE,
  supports_lcc BOOLEAN DEFAULT FALSE,
  supports_ndc BOOLEAN DEFAULT FALSE,
  online_cancel BOOLEAN DEFAULT FALSE,
  balance DECIMAL(12, 2),
  balance_currency TEXT DEFAULT 'USD',
  last_balance_check TIMESTAMPTZ,
  last_health_check TIMESTAMPTZ,
  health_status JSONB DEFAULT '{}'::JSONB,
  credentials_config JSONB DEFAULT '{}'::JSONB,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_master_enabled ON supplier_master(enabled, weight DESC);

-- Insert supplier records
INSERT INTO supplier_master (code, name, enabled, weight, supports_gds, supports_lcc, supports_ndc, online_cancel)
VALUES 
  ('amadeus', 'Amadeus', TRUE, 100, TRUE, FALSE, FALSE, FALSE),
  ('tbo', 'TBO (Travel Boutique Online)', TRUE, 90, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  supports_gds = EXCLUDED.supports_gds,
  supports_lcc = EXCLUDED.supports_lcc;

-- ============================================================================
-- 5. Applied Markups and Promos Audit Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS applied_markups (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER,
  markup_rule_id INTEGER,
  supplier TEXT,
  markup_type TEXT,
  markup_value DECIMAL(10, 2),
  applied_amount DECIMAL(10, 2),
  base_fare DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applied_markups_booking ON applied_markups(booking_id);
CREATE INDEX IF NOT EXISTS idx_applied_markups_supplier ON applied_markups(supplier);

CREATE TABLE IF NOT EXISTS applied_promos (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER,
  promo_code_id INTEGER,
  promo_code TEXT,
  supplier TEXT,
  discount_type TEXT,
  discount_value DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  pre_discount_total DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applied_promos_booking ON applied_promos(booking_id);
CREATE INDEX IF NOT EXISTS idx_applied_promos_supplier ON applied_promos(supplier);

-- ============================================================================
-- 6. Supplier Health Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_health_logs (
  id SERIAL PRIMARY KEY,
  supplier_code TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_health_supplier ON supplier_health_logs(supplier_code, created_at DESC);

-- ============================================================================
-- 7. Update Existing Data
-- ============================================================================

-- Update existing markup rules to 'all' if NULL
UPDATE markup_rules SET supplier_scope = 'all' WHERE supplier_scope IS NULL;

-- Update existing promo codes to 'all' if NULL
UPDATE promo_codes SET supplier_scope = 'all' WHERE supplier_scope IS NULL;

-- ============================================================================
-- 8. Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO faredown_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO faredown_user;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'TBO supplier integration migration completed successfully!';
END $$;
