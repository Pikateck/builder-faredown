-- Faredown Pricing Engine Compatibility Migration
-- Created: 2025-09-06
-- Purpose: Add missing tables and ensure compatibility with existing schema

-- Create tax_policies table (missing)
CREATE TABLE IF NOT EXISTS tax_policies (
  id SERIAL PRIMARY KEY,
  module TEXT NOT NULL,                       -- 'air' | 'hotel' | 'sightseeing' | 'transfer'
  type TEXT NOT NULL,                         -- 'percent' | 'fixed'
  value NUMERIC(12,2) NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create price_checkpoints table (missing)
CREATE TABLE IF NOT EXISTS price_checkpoints (
  id BIGSERIAL PRIMARY KEY,
  journey_id TEXT NOT NULL,                   -- same across the whole user flow
  step TEXT NOT NULL,                         -- search_results | view_details | bargain_pre | bargain_post | book | payment | invoice | my_trips
  currency TEXT NOT NULL,
  total_fare NUMERIC(12,2) NOT NULL,
  base_fare NUMERIC(12,2) NULL,
  markup NUMERIC(12,2) NULL,
  discount NUMERIC(12,2) NULL,
  tax NUMERIC(12,2) NULL,
  payload JSONB,                              -- raw response/body for debugging
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_policies_module ON tax_policies(module);
CREATE INDEX IF NOT EXISTS idx_price_checkpoints_journey_id ON price_checkpoints(journey_id);
CREATE INDEX IF NOT EXISTS idx_price_checkpoints_step ON price_checkpoints(step);

-- Materialized view for latest price per step
CREATE MATERIALIZED VIEW IF NOT EXISTS price_latest AS
SELECT DISTINCT ON (journey_id, step)
  journey_id, step, currency, total_fare, base_fare, markup, discount, tax, payload, created_at
FROM price_checkpoints
ORDER BY journey_id, step, created_at DESC;

-- Add compatibility view for markup_rules to work with new pricing engine
CREATE OR REPLACE VIEW pricing_markup_rules AS
SELECT 
  id::text as id,
  module,
  origin,
  destination,
  service_class,
  hotel_category,
  service_type,
  airline_code,
  user_type,
  markup_type,
  m_value as markup_value,  -- Map m_value to markup_value
  priority,
  valid_from,
  valid_to,
  status,
  created_at,
  updated_at
FROM markup_rules
WHERE status = 'active';

-- Add compatibility view for promo_codes
CREATE OR REPLACE VIEW pricing_promo_codes AS
SELECT 
  id::text as id,
  code,
  discount_type as type,  -- Map discount_type to type
  (discount_min + discount_max) / 2 as value,  -- Use average of min/max as single value
  module,
  min_fare_amount as min_fare,
  null as max_discount,  -- Not available in current schema
  null as usage_limit,   -- Not available in current schema
  0 as usage_count,      -- Default to 0
  1 as user_limit,       -- Default to 1
  status,
  null as valid_from,    -- Not available in current schema
  expires_on as valid_to,
  created_at,
  updated_at
FROM promo_codes
WHERE status = 'active';

-- Seed data for tax policies
INSERT INTO tax_policies (module, type, value, priority, status)
VALUES 
  ('air', 'percent', 12.00, 10, 'active'),
  ('hotel', 'percent', 18.00, 10, 'active'),
  ('sightseeing', 'percent', 18.00, 10, 'active'),
  ('transfer', 'percent', 18.00, 10, 'active')
ON CONFLICT DO NOTHING;

-- Create function to refresh the materialized view automatically
CREATE OR REPLACE FUNCTION refresh_price_latest()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY price_latest;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-refresh materialized view
DROP TRIGGER IF EXISTS trigger_refresh_price_latest ON price_checkpoints;
CREATE TRIGGER trigger_refresh_price_latest
  AFTER INSERT OR UPDATE OR DELETE ON price_checkpoints
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_price_latest();
