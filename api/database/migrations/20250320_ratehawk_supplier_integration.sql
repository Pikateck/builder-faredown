-- RateHawk Supplier Integration Migration
-- This migration adds multi-supplier support for hotels with RateHawk alongside Hotelbeds

-- ==========================================
-- 1. Suppliers Master Table
-- ==========================================
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,                    -- 'hotelbeds', 'ratehawk', 'amadeus', 'tbo'
  name TEXT NOT NULL,                           -- 'Hotelbeds', 'RateHawk', 'Amadeus', 'TBO'
  product_type TEXT NOT NULL,                   -- 'hotels', 'flights', 'sightseeing'
  is_enabled BOOLEAN DEFAULT TRUE,
  environment TEXT CHECK (environment IN ('sandbox','production')) DEFAULT 'sandbox',
  last_sync_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_msg TEXT,
  total_calls_24h INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default suppliers
INSERT INTO suppliers (code, name, product_type, environment) VALUES 
  ('hotelbeds', 'Hotelbeds', 'hotels', 'sandbox'),
  ('ratehawk', 'RateHawk', 'hotels', 'sandbox'),
  ('amadeus', 'Amadeus', 'flights', 'production'),
  ('tbo', 'TBO', 'flights', 'production')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  product_type = EXCLUDED.product_type;

-- ==========================================
-- 2. Supplier Credentials (Optional - prefer env vars)
-- ==========================================
CREATE TABLE IF NOT EXISTS supplier_credentials (
  id SERIAL PRIMARY KEY,
  supplier_code TEXT NOT NULL REFERENCES suppliers(code),
  key_id TEXT,
  key_uuid TEXT,
  base_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. Supplier-Scoped Markups
-- ==========================================
CREATE TABLE IF NOT EXISTS supplier_markups (
  id SERIAL PRIMARY KEY,
  supplier_code TEXT NOT NULL REFERENCES suppliers(code),
  product_type TEXT NOT NULL,                   -- 'hotels', 'flights'
  market TEXT DEFAULT 'ALL',                    -- 'IN', 'US', 'ALL'
  currency TEXT DEFAULT 'ALL',                  -- 'INR', 'USD', 'ALL'
  hotel_id TEXT DEFAULT 'ALL',                  -- specific hotel or 'ALL'
  destination TEXT DEFAULT 'ALL',               -- city/region code or 'ALL'
  channel TEXT DEFAULT 'ALL',                   -- 'web', 'mobile', 'ALL'
  value_type TEXT CHECK (value_type IN ('PERCENT','FLAT')) NOT NULL,
  value NUMERIC NOT NULL,
  priority INT DEFAULT 100,                     -- lower = higher priority
  is_active BOOLEAN DEFAULT TRUE,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_markups_lookup 
  ON supplier_markups(supplier_code, product_type, is_active, priority);

-- ==========================================
-- 4. Update Bookings Table for Supplier Tracking
-- ==========================================
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS supplier_code TEXT REFERENCES suppliers(code),
  ADD COLUMN IF NOT EXISTS supplier_order_id TEXT,
  ADD COLUMN IF NOT EXISTS supplier_status TEXT,
  ADD COLUMN IF NOT EXISTS supplier_booking_ref TEXT,
  ADD COLUMN IF NOT EXISTS supplier_rate_key TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_supplier 
  ON bookings(supplier_code, supplier_order_id);

-- ==========================================
-- 5. Supplier Order Documents (Vouchers/Invoices)
-- ==========================================
CREATE TABLE IF NOT EXISTS supplier_order_documents (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id),
  supplier_code TEXT NOT NULL REFERENCES suppliers(code),
  supplier_order_id TEXT NOT NULL,
  document_type TEXT NOT NULL,                  -- 'voucher', 'invoice', 'ticket'
  document_url TEXT,
  document_data BYTEA,                          -- binary storage
  file_name TEXT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_docs_lookup 
  ON supplier_order_documents(booking_id, supplier_code, document_type);

-- ==========================================
-- 6. Supplier Rate Limiter State (In-Memory Alternative)
-- ==========================================
CREATE TABLE IF NOT EXISTS supplier_rate_limits (
  id SERIAL PRIMARY KEY,
  supplier_code TEXT NOT NULL REFERENCES suppliers(code),
  endpoint TEXT NOT NULL,                       -- 'search_serp_hotels', 'search_geo', etc.
  max_requests INT NOT NULL,
  time_window_seconds INT NOT NULL,
  current_count INT DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_code, endpoint)
);

-- Insert RateHawk rate limits
INSERT INTO supplier_rate_limits (supplier_code, endpoint, max_requests, time_window_seconds) VALUES
  ('ratehawk', 'search_serp_hotels', 150, 60),
  ('ratehawk', 'search_serp_region', 10, 60),
  ('ratehawk', 'search_serp_geo', 10, 60),
  ('ratehawk', 'hotel_static_dump', 100, 86400),
  ('ratehawk', 'hotel_info_dump', 100, 86400),
  ('ratehawk', 'hotel_reviews_dump', 100, 86400)
ON CONFLICT (supplier_code, endpoint) DO NOTHING;

-- ==========================================
-- 7. Supplier Sync Jobs Tracking
-- ==========================================
CREATE TABLE IF NOT EXISTS supplier_sync_jobs (
  id SERIAL PRIMARY KEY,
  supplier_code TEXT NOT NULL REFERENCES suppliers(code),
  job_type TEXT NOT NULL,                       -- 'static', 'regions', 'reviews', 'incremental'
  status TEXT NOT NULL,                         -- 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  records_processed INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_status 
  ON supplier_sync_jobs(supplier_code, status, started_at);

-- ==========================================
-- 8. Add Supplier to Search Logs
-- ==========================================
ALTER TABLE flight_search_logs 
  ADD COLUMN IF NOT EXISTS supplier TEXT;

ALTER TABLE hotel_search_logs 
  ADD COLUMN IF NOT EXISTS supplier TEXT;

-- ==========================================
-- 9. Supplier Health Metrics
-- ==========================================
CREATE TABLE IF NOT EXISTS supplier_health_metrics (
  id SERIAL PRIMARY KEY,
  supplier_code TEXT NOT NULL REFERENCES suppliers(code),
  metric_type TEXT NOT NULL,                    -- 'search', 'booking', 'document'
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  avg_response_ms INT,
  last_error TEXT,
  metric_hour TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_code, metric_type, metric_hour)
);

-- Index for quick health lookups
CREATE INDEX IF NOT EXISTS idx_supplier_health_recent 
  ON supplier_health_metrics(supplier_code, metric_hour DESC);

-- ==========================================
-- 10. Functions for Markup Evaluation
-- ==========================================

-- Function to get effective markup for a hotel booking
CREATE OR REPLACE FUNCTION get_effective_supplier_markup(
  p_supplier_code TEXT,
  p_product_type TEXT,
  p_market TEXT DEFAULT 'ALL',
  p_currency TEXT DEFAULT 'ALL',
  p_hotel_id TEXT DEFAULT 'ALL',
  p_destination TEXT DEFAULT 'ALL',
  p_channel TEXT DEFAULT 'ALL'
) RETURNS TABLE (
  value_type TEXT,
  value NUMERIC,
  priority INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT sm.value_type, sm.value, sm.priority
  FROM supplier_markups sm
  WHERE sm.supplier_code = p_supplier_code
    AND sm.product_type = p_product_type
    AND sm.is_active = TRUE
    AND (sm.valid_from IS NULL OR sm.valid_from <= CURRENT_DATE)
    AND (sm.valid_to IS NULL OR sm.valid_to >= CURRENT_DATE)
    AND (sm.market = p_market OR sm.market = 'ALL')
    AND (sm.currency = p_currency OR sm.currency = 'ALL')
    AND (sm.hotel_id = p_hotel_id OR sm.hotel_id = 'ALL')
    AND (sm.destination = p_destination OR sm.destination = 'ALL')
    AND (sm.channel = p_channel OR sm.channel = 'ALL')
  ORDER BY 
    -- Most specific matches first
    CASE WHEN sm.hotel_id != 'ALL' THEN 1 ELSE 0 END DESC,
    CASE WHEN sm.destination != 'ALL' THEN 1 ELSE 0 END DESC,
    CASE WHEN sm.market != 'ALL' THEN 1 ELSE 0 END DESC,
    CASE WHEN sm.currency != 'ALL' THEN 1 ELSE 0 END DESC,
    CASE WHEN sm.channel != 'ALL' THEN 1 ELSE 0 END DESC,
    sm.priority ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 11. Sample Supplier Markups
-- ==========================================

-- Global RateHawk markup (default)
INSERT INTO supplier_markups (supplier_code, product_type, market, value_type, value, priority) VALUES
  ('ratehawk', 'hotels', 'ALL', 'PERCENT', 18.0, 100),
  ('hotelbeds', 'hotels', 'ALL', 'PERCENT', 20.0, 100)
ON CONFLICT DO NOTHING;

-- Market-specific markups
INSERT INTO supplier_markups (supplier_code, product_type, market, value_type, value, priority) VALUES
  ('ratehawk', 'hotels', 'IN', 'PERCENT', 15.0, 90),
  ('hotelbeds', 'hotels', 'IN', 'PERCENT', 18.0, 90)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 12. Grants (if needed)
-- ==========================================

-- Grant permissions for application user
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO faredown_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO faredown_user;

-- Migration complete
SELECT 'RateHawk supplier integration migration completed successfully' AS status;
