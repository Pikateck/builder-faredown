-- Faredown Pricing Engine Database Schema
-- Created: 2025-09-06
-- Purpose: Centralized pricing logic for all modules (air, hotel, sightseeing, transfer)

-- markup_rules table
CREATE TABLE IF NOT EXISTS markup_rules (
  id SERIAL PRIMARY KEY,
  module TEXT NOT NULL,                        -- 'air' | 'hotel' | 'sightseeing' | 'transfer'
  origin TEXT NULL,
  destination TEXT NULL,
  service_class TEXT NULL,                     -- Y/J/F for air, room category for hotel
  hotel_category TEXT NULL,                    -- 3/4/5-star
  service_type TEXT NULL,                      -- private/shared for transfers
  airline_code TEXT NULL,                      -- EK, AI, etc.
  user_type TEXT NOT NULL DEFAULT 'all',      -- 'all' | 'b2c' | 'b2b'
  markup_type TEXT NOT NULL,                  -- 'percent' | 'fixed'
  markup_value NUMERIC(12,2) NOT NULL,
  priority INT NOT NULL DEFAULT 0,            -- higher priority rules take precedence
  valid_from DATE NULL,
  valid_to DATE NULL,
  status TEXT NOT NULL DEFAULT 'active',      -- 'active' | 'inactive'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,                         -- 'percent' | 'fixed'
  value NUMERIC(12,2) NOT NULL,
  module TEXT NULL,                           -- NULL for all modules, or specific module
  min_fare NUMERIC(12,2) NULL,               -- minimum fare required
  max_discount NUMERIC(12,2) NULL,           -- maximum discount amount
  usage_limit INT NULL,                      -- total usage limit
  usage_count INT DEFAULT 0,                 -- current usage count
  user_limit INT DEFAULT 1,                  -- per-user usage limit
  status TEXT NOT NULL DEFAULT 'active',
  valid_from DATE NULL,
  valid_to DATE NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tax_policies table
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

-- price_checkpoints table for price echo tracking
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
CREATE INDEX IF NOT EXISTS idx_markup_rules_module ON markup_rules(module);
CREATE INDEX IF NOT EXISTS idx_markup_rules_status ON markup_rules(status);
CREATE INDEX IF NOT EXISTS idx_markup_rules_priority ON markup_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_status ON promo_codes(status);
CREATE INDEX IF NOT EXISTS idx_tax_policies_module ON tax_policies(module);
CREATE INDEX IF NOT EXISTS idx_price_checkpoints_journey_id ON price_checkpoints(journey_id);
CREATE INDEX IF NOT EXISTS idx_price_checkpoints_step ON price_checkpoints(step);

-- Materialized view for latest price per step
CREATE MATERIALIZED VIEW IF NOT EXISTS price_latest AS
SELECT DISTINCT ON (journey_id, step)
  journey_id, step, currency, total_fare, base_fare, markup, discount, tax, payload, created_at
FROM price_checkpoints
ORDER BY journey_id, step, created_at DESC;

-- Seed data for basic configuration
INSERT INTO markup_rules (module, markup_type, markup_value, priority, status)
VALUES 
  ('air', 'percent', 5.00, 1, 'active'),
  ('hotel', 'percent', 8.00, 1, 'active'),
  ('sightseeing', 'percent', 10.00, 1, 'active'),
  ('transfer', 'percent', 12.00, 1, 'active')
ON CONFLICT DO NOTHING;

-- Route-specific markup examples
INSERT INTO markup_rules (module, origin, destination, service_class, user_type, markup_type, markup_value, priority, status)
VALUES 
  ('air', 'BOM', 'JFK', 'Y', 'b2c', 'percent', 8.00, 10, 'active'),
  ('air', 'DXB', 'LHR', 'J', 'b2c', 'percent', 6.00, 10, 'active'),
  ('hotel', NULL, 'DXB', '5', 'b2c', 'percent', 12.00, 8, 'active')
ON CONFLICT DO NOTHING;

-- Sample promo codes
INSERT INTO promo_codes (code, type, value, status, valid_from, valid_to)
VALUES 
  ('WELCOME10', 'percent', 10.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
  ('FIRST50', 'fixed', 50.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
  ('SAVE100', 'fixed', 100.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;

-- Tax policies
INSERT INTO tax_policies (module, type, value, priority, status)
VALUES 
  ('air', 'percent', 12.00, 10, 'active'),
  ('hotel', 'percent', 18.00, 10, 'active'),
  ('sightseeing', 'percent', 18.00, 10, 'active'),
  ('transfer', 'percent', 18.00, 10, 'active')
ON CONFLICT DO NOTHING;
