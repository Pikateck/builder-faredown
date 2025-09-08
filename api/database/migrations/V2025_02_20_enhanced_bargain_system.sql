-- Enhanced Bargain System Database Migration
-- PostgreSQL schema for comprehensive bargain logic with all modules
-- Version: 2.0.0
-- Created: 2025-02-20

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create modules table first (product types)
CREATE TABLE IF NOT EXISTS modules (
  id            SERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL CHECK (name IN ('flights','hotels','sightseeing','transfers')),
  display_name  TEXT NOT NULL,
  icon          TEXT,
  description   TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bargain sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS bargain_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID,                                    -- nullable for guest users
  module_id      INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  product_ref    TEXT NOT NULL,                          -- external reference (flight ID, hotel ID, etc.)
  attempt_count  INT NOT NULL DEFAULT 0,
  max_attempts   INT NOT NULL DEFAULT 3,
  ai_personality TEXT NOT NULL DEFAULT 'standard',       -- AI behavior type
  emotional_state JSONB DEFAULT '{}'::jsonb,             -- AI emotional context
  user_context   JSONB DEFAULT '{}'::jsonb,              -- user preferences, history
  base_price     NUMERIC(12,2) NOT NULL,                 -- original price
  final_price    NUMERIC(12,2),                          -- negotiated price if successful
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','completed','expired','cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ                             -- session expiration
);

-- Create suppliers table if it doesn't exist
CREATE TABLE IF NOT EXISTS suppliers (
  id            SERIAL PRIMARY KEY,
  module_id     INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,                          -- supplier code (e.g., 'AMADEUS', 'HOTELBEDS')
  name          TEXT NOT NULL,                          -- display name
  active        BOOLEAN DEFAULT TRUE,
  api_config    JSONB DEFAULT '{}'::jsonb,              -- API configuration
  metadata      JSONB DEFAULT '{}'::jsonb,              -- additional supplier data
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, code)
);

-- Drop existing constraints that might conflict
DO $$
BEGIN
    -- Check and drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'modules_name_check'
               AND table_name = 'modules') THEN
        ALTER TABLE modules DROP CONSTRAINT modules_name_check;
    END IF;
END $$;

-- Update modules table to include all travel product types
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_name_check;
ALTER TABLE modules ADD CONSTRAINT modules_name_check
CHECK (name IN ('flights','hotels','sightseeing','transfers'));

-- Insert all required modules if they don't exist
INSERT INTO modules (name, display_name, icon, description, active) VALUES
('flights', 'Flights', 'plane', 'Flight bookings and airfare negotiations', true),
('hotels', 'Hotels', 'bed', 'Hotel reservations and accommodation bargaining', true),
('sightseeing', 'Sightseeing', 'camera', 'Tours, activities and sightseeing experiences', true),
('transfers', 'Transfers', 'car', 'Ground transportation and transfer services', true)
ON CONFLICT (name) DO UPDATE SET
display_name = EXCLUDED.display_name,
icon = EXCLUDED.icon,
description = EXCLUDED.description,
updated_at = NOW();

-- Create enhanced markup rules table for all modules
CREATE TABLE IF NOT EXISTS markup_rules (
  id                    SERIAL PRIMARY KEY,
  rule_name             TEXT NOT NULL,
  rule_type             TEXT NOT NULL CHECK (rule_type IN ('general','supplier','city','star_rating','room_category','route','airline','cabin_class','tour_type','transfer_type')),
  module_id             INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  supplier_id           INT REFERENCES suppliers(id) ON DELETE SET NULL,
  
  -- General markup configuration
  markup_percentage     NUMERIC(6,4) NOT NULL DEFAULT 0.10,  -- 10% default
  min_markup_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.05,  -- 5% minimum
  max_markup_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.25,  -- 25% maximum
  
  -- Fixed amount markup options
  fixed_markup_amount   NUMERIC(12,2) DEFAULT 0,
  min_markup_amount     NUMERIC(12,2) DEFAULT 0,
  max_markup_amount     NUMERIC(12,2),
  
  -- Bargain range configuration (for acceptable discounts)
  bargain_min_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.02, -- 2% minimum margin
  bargain_max_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.15, -- 15% maximum discount
  
  -- Scope filters (JSON for flexibility)
  scope_filters         JSONB DEFAULT '{}'::jsonb,
  
  -- Validity and priority
  priority              INT DEFAULT 1,
  active                BOOLEAN DEFAULT TRUE,
  effective_from        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to          TIMESTAMPTZ,
  
  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            TEXT,
  updated_by            TEXT
);

-- Create enhanced promo codes table with all module support
CREATE TABLE IF NOT EXISTS promo_codes_enhanced (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  description           TEXT,
  
  -- Module applicability (can apply to multiple modules)
  applicable_modules    INT[] NOT NULL,  -- Array of module IDs
  
  -- Discount configuration
  discount_type         TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed','range')),
  discount_value        NUMERIC(12,2) NOT NULL,
  discount_min_value    NUMERIC(12,2),  -- For range discounts
  discount_max_value    NUMERIC(12,2),  -- For range discounts
  
  -- Usage and budget limits
  usage_limit           INT,
  usage_count           INT DEFAULT 0,
  user_usage_limit      INT DEFAULT 1,  -- Per-user limit
  budget_limit          NUMERIC(15,2),
  budget_used           NUMERIC(15,2) DEFAULT 0,
  
  -- Booking constraints
  min_booking_amount    NUMERIC(12,2),
  max_discount_cap      NUMERIC(12,2),
  
  -- Applicability filters (JSON for flexibility)
  filters               JSONB DEFAULT '{}'::jsonb,
  
  -- Validity
  valid_from            TIMESTAMPTZ NOT NULL,
  valid_to              TIMESTAMPTZ NOT NULL,
  travel_date_from      DATE,
  travel_date_to        DATE,
  
  -- Status and priority
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','expired','exhausted')),
  priority              INT DEFAULT 1,
  
  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            TEXT,
  updated_by            TEXT
);

-- Create bargain holds table for 30-second price holds
CREATE TABLE IF NOT EXISTS bargain_holds_enhanced (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            UUID NOT NULL REFERENCES bargain_sessions(id) ON DELETE CASCADE,
  module_id             INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  product_id            TEXT NOT NULL,
  
  -- Hold pricing details
  original_price        NUMERIC(12,2) NOT NULL,
  supplier_net_price    NUMERIC(12,2) NOT NULL,
  markup_amount         NUMERIC(12,2) NOT NULL,
  promo_discount        NUMERIC(12,2) DEFAULT 0,
  total_discount        NUMERIC(12,2) NOT NULL,
  final_hold_price      NUMERIC(12,2) NOT NULL,
  
  -- Hold timing
  hold_duration_seconds INT NOT NULL DEFAULT 30,
  expires_at            TIMESTAMPTZ NOT NULL,
  
  -- Promo code information
  promo_code_id         UUID,
  markup_rule_id        INT,
  
  -- Hold status
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','consumed','cancelled')),
  consumed_at           TIMESTAMPTZ,
  booking_reference     TEXT,
  
  -- Metadata
  metadata              JSONB DEFAULT '{}'::jsonb,
  
  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bargain rounds table for tracking round-specific messaging
CREATE TABLE IF NOT EXISTS bargain_rounds (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            UUID NOT NULL REFERENCES bargain_sessions(id) ON DELETE CASCADE,
  round_number          INT NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  
  -- Round details
  user_target_price     NUMERIC(12,2) NOT NULL,
  ai_counter_price      NUMERIC(12,2),
  round_status          TEXT NOT NULL CHECK (round_status IN ('pending','active','completed','matched','rejected')),
  
  -- Pricing calculations for this round
  supplier_net_price    NUMERIC(12,2) NOT NULL,
  markup_amount         NUMERIC(12,2) NOT NULL,
  promo_discount        NUMERIC(12,2) DEFAULT 0,
  total_discount        NUMERIC(12,2) NOT NULL,
  
  -- Round messaging
  ai_message            TEXT,
  warning_message       TEXT,  -- For rounds 2 & 3 FOMO messages
  round_type            TEXT NOT NULL CHECK (round_type IN ('best_offer','risk_round','final_chance')),
  
  -- Round timing
  round_started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  round_completed_at    TIMESTAMPTZ,
  response_time_ms      INT,
  
  -- Metadata
  decision_factors      JSONB DEFAULT '{}'::jsonb,
  
  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(session_id, round_number)
);

-- Create promo code usage tracking table
CREATE TABLE IF NOT EXISTS promo_usage_log (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id         UUID NOT NULL,
  user_id               UUID,
  session_id            UUID,
  module_id             INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Usage details
  booking_amount        NUMERIC(12,2) NOT NULL,
  discount_applied      NUMERIC(12,2) NOT NULL,
  usage_context         TEXT,  -- 'bargain', 'direct_booking', etc.
  
  -- Booking information
  booking_reference     TEXT,
  product_id            TEXT,
  
  -- Timing
  used_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create general markup rules (default rules for all modules)
INSERT INTO markup_rules (
  rule_name, rule_type, module_id, markup_percentage, min_markup_percentage, max_markup_percentage,
  bargain_min_percentage, bargain_max_percentage, priority, created_by
) 
SELECT 
  'General Markup - ' || m.display_name,
  'general',
  m.id,
  CASE 
    WHEN m.name = 'flights' THEN 0.12      -- 12% for flights
    WHEN m.name = 'hotels' THEN 0.15       -- 15% for hotels  
    WHEN m.name = 'sightseeing' THEN 0.18  -- 18% for sightseeing
    WHEN m.name = 'transfers' THEN 0.10    -- 10% for transfers
  END,
  0.05,  -- 5% minimum
  CASE 
    WHEN m.name = 'flights' THEN 0.25      -- 25% max for flights
    WHEN m.name = 'hotels' THEN 0.30       -- 30% max for hotels
    WHEN m.name = 'sightseeing' THEN 0.35  -- 35% max for sightseeing  
    WHEN m.name = 'transfers' THEN 0.20    -- 20% max for transfers
  END,
  0.02,  -- 2% minimum margin
  CASE
    WHEN m.name = 'flights' THEN 0.15      -- 15% max discount for flights
    WHEN m.name = 'hotels' THEN 0.20       -- 20% max discount for hotels
    WHEN m.name = 'sightseeing' THEN 0.25  -- 25% max discount for sightseeing
    WHEN m.name = 'transfers' THEN 0.15    -- 15% max discount for transfers
  END,
  1,  -- Priority 1 (default)
  'system'
FROM modules m
ON CONFLICT DO NOTHING;

-- Create sample promo codes for all modules
INSERT INTO promo_codes_enhanced (
  code, name, description, applicable_modules, discount_type, discount_value,
  discount_min_value, discount_max_value, budget_limit, min_booking_amount,
  valid_from, valid_to, created_by
) VALUES
-- Universal promo for all modules
(
  'FAREDOWN25',
  'Faredown Universal Discount',
  'Get 10-25% off on all bookings',
  ARRAY(SELECT id FROM modules),
  'range',
  15.0,  -- Base 15%
  10.0,  -- Min 10%
  25.0,  -- Max 25%
  500000.00,  -- ₹5,00,000 budget
  1000.00,    -- Min ₹1,000 booking
  NOW(),
  NOW() + INTERVAL '1 year',
  'system'
),
-- Sightseeing specific promo
(
  'EXPLORE30',
  'Explore More Discount',
  'Special discount for sightseeing and tours',
  ARRAY(SELECT id FROM modules WHERE name = 'sightseeing'),
  'range',
  20.0,  -- Base 20%
  15.0,  -- Min 15%
  30.0,  -- Max 30%
  200000.00,  -- ₹2,00,000 budget
  500.00,     -- Min ₹500 booking
  NOW(),
  NOW() + INTERVAL '6 months',
  'system'
),
-- Transfers specific promo
(
  'RIDEEASY',
  'Easy Ride Discount',
  'Save on all transfer bookings',
  ARRAY(SELECT id FROM modules WHERE name = 'transfers'),
  'range',
  15.0,  -- Base 15%
  10.0,  -- Min 10%
  20.0,  -- Max 20%
  100000.00,  -- ₹1,00,000 budget
  300.00,     -- Min ₹300 booking
  NOW(),
  NOW() + INTERVAL '3 months',
  'system'
),
-- Multi-module promo (Hotels + Sightseeing)
(
  'STAYANDSEE',
  'Stay and See Combo',
  'Discount when booking hotels with sightseeing',
  ARRAY(SELECT id FROM modules WHERE name IN ('hotels', 'sightseeing')),
  'range',
  18.0,  -- Base 18%
  12.0,  -- Min 12%
  25.0,  -- Max 25%
  300000.00,  -- ₹3,00,000 budget
  2000.00,    -- Min ₹2,000 booking
  NOW(),
  NOW() + INTERVAL '4 months',
  'system'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_markup_rules_module_active ON markup_rules(module_id, active);
CREATE INDEX IF NOT EXISTS idx_markup_rules_type_priority ON markup_rules(rule_type, priority);
CREATE INDEX IF NOT EXISTS idx_markup_rules_effective_dates ON markup_rules(effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_promo_codes_enhanced_modules ON promo_codes_enhanced USING gin(applicable_modules);
CREATE INDEX IF NOT EXISTS idx_promo_codes_enhanced_code_status ON promo_codes_enhanced(code, status);
CREATE INDEX IF NOT EXISTS idx_promo_codes_enhanced_validity ON promo_codes_enhanced(valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_bargain_holds_enhanced_expires ON bargain_holds_enhanced(expires_at, status);
CREATE INDEX IF NOT EXISTS idx_bargain_holds_enhanced_session ON bargain_holds_enhanced(session_id, status);

CREATE INDEX IF NOT EXISTS idx_bargain_rounds_session_round ON bargain_rounds(session_id, round_number);
CREATE INDEX IF NOT EXISTS idx_bargain_rounds_status ON bargain_rounds(round_status);

CREATE INDEX IF NOT EXISTS idx_promo_usage_log_promo_user ON promo_usage_log(promo_code_id, user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_log_used_at ON promo_usage_log(used_at);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_markup_rules_updated_at ON markup_rules;
CREATE TRIGGER update_markup_rules_updated_at 
  BEFORE UPDATE ON markup_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promo_codes_enhanced_updated_at ON promo_codes_enhanced;
CREATE TRIGGER update_promo_codes_enhanced_updated_at 
  BEFORE UPDATE ON promo_codes_enhanced 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bargain_holds_enhanced_updated_at ON bargain_holds_enhanced;
CREATE TRIGGER update_bargain_holds_enhanced_updated_at 
  BEFORE UPDATE ON bargain_holds_enhanced 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bargain_rounds_updated_at ON bargain_rounds;
CREATE TRIGGER update_bargain_rounds_updated_at 
  BEFORE UPDATE ON bargain_rounds 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired holds
CREATE OR REPLACE FUNCTION cleanup_expired_bargain_holds()
RETURNS INT AS $$
DECLARE
    expired_count INT;
BEGIN
    UPDATE bargain_holds_enhanced 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate bargain price according to specified formula
CREATE OR REPLACE FUNCTION calculate_bargain_price(
  p_supplier_net_rate NUMERIC,
  p_module_id INT,
  p_supplier_id INT DEFAULT NULL,
  p_scope_filters JSONB DEFAULT '{}',
  p_promo_code TEXT DEFAULT NULL
) RETURNS TABLE (
  final_price NUMERIC,
  markup_amount NUMERIC,
  promo_discount NUMERIC,
  total_discount NUMERIC,
  markup_rule_id INT,
  promo_code_id UUID,
  bargain_range_min NUMERIC,
  bargain_range_max NUMERIC
) AS $$
DECLARE
  v_markup_rule markup_rules%ROWTYPE;
  v_promo_code promo_codes_enhanced%ROWTYPE;
  v_markup_amount NUMERIC := 0;
  v_promo_discount NUMERIC := 0;
  v_total_discount NUMERIC := 0;
  v_final_price NUMERIC;
  v_bargain_min NUMERIC;
  v_bargain_max NUMERIC;
BEGIN
  -- Find best applicable markup rule
  SELECT * INTO v_markup_rule
  FROM markup_rules mr
  WHERE mr.module_id = p_module_id 
    AND mr.active = TRUE
    AND (mr.effective_from <= NOW() AND (mr.effective_to IS NULL OR mr.effective_to >= NOW()))
    AND (p_supplier_id IS NULL OR mr.supplier_id IS NULL OR mr.supplier_id = p_supplier_id)
  ORDER BY mr.priority DESC, mr.markup_percentage DESC
  LIMIT 1;
  
  -- Calculate markup amount
  IF v_markup_rule.id IS NOT NULL THEN
    -- Use fluctuating markup within min/max range
    v_markup_amount := p_supplier_net_rate * (
      v_markup_rule.min_markup_percentage + 
      (v_markup_rule.max_markup_percentage - v_markup_rule.min_markup_percentage) * RANDOM()
    );
    
    -- Apply fixed amount if specified
    v_markup_amount := v_markup_amount + COALESCE(v_markup_rule.fixed_markup_amount, 0);
    
    -- Ensure within bounds
    v_markup_amount := GREATEST(v_markup_amount, COALESCE(v_markup_rule.min_markup_amount, 0));
    IF v_markup_rule.max_markup_amount IS NOT NULL THEN
      v_markup_amount := LEAST(v_markup_amount, v_markup_rule.max_markup_amount);
    END IF;
  END IF;
  
  -- Find applicable promo code
  IF p_promo_code IS NOT NULL THEN
    SELECT * INTO v_promo_code
    FROM promo_codes_enhanced pc
    WHERE pc.code = p_promo_code
      AND pc.status = 'active'
      AND pc.valid_from <= NOW() 
      AND pc.valid_to >= NOW()
      AND p_module_id = ANY(pc.applicable_modules)
      AND (pc.usage_limit IS NULL OR pc.usage_count < pc.usage_limit)
      AND (pc.budget_limit IS NULL OR pc.budget_used < pc.budget_limit);
      
    -- Calculate promo discount
    IF v_promo_code.id IS NOT NULL THEN
      CASE 
        WHEN v_promo_code.discount_type = 'percentage' THEN
          v_promo_discount := (p_supplier_net_rate + v_markup_amount) * v_promo_code.discount_value / 100;
        WHEN v_promo_code.discount_type = 'fixed' THEN
          v_promo_discount := v_promo_code.discount_value;
        WHEN v_promo_code.discount_type = 'range' THEN
          -- Random discount within range
          v_promo_discount := (p_supplier_net_rate + v_markup_amount) * (
            v_promo_code.discount_min_value + 
            (v_promo_code.discount_max_value - v_promo_code.discount_min_value) * RANDOM()
          ) / 100;
      END CASE;
      
      -- Apply discount cap
      IF v_promo_code.max_discount_cap IS NOT NULL THEN
        v_promo_discount := LEAST(v_promo_discount, v_promo_code.max_discount_cap);
      END IF;
    END IF;
  END IF;
  
  -- Calculate totals according to formula: Final bargain price = Supplier Net Rate – (Markup Amount + Promo Code Discount)
  v_total_discount := v_markup_amount + v_promo_discount;
  v_final_price := p_supplier_net_rate - v_total_discount;
  
  -- Ensure minimum margin (never go below supplier net rate + 2%)
  v_final_price := GREATEST(v_final_price, p_supplier_net_rate * 1.02);
  
  -- Calculate bargain range
  IF v_markup_rule.id IS NOT NULL THEN
    v_bargain_min := p_supplier_net_rate * (1 + v_markup_rule.bargain_min_percentage);
    v_bargain_max := p_supplier_net_rate * (1 + v_markup_rule.bargain_max_percentage);
  ELSE
    v_bargain_min := p_supplier_net_rate * 1.02;  -- 2% minimum
    v_bargain_max := p_supplier_net_rate * 1.15;  -- 15% maximum
  END IF;
  
  RETURN QUERY SELECT 
    v_final_price,
    v_markup_amount,
    v_promo_discount,
    v_total_discount,
    v_markup_rule.id,
    v_promo_code.id,
    v_bargain_min,
    v_bargain_max;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user target price is within acceptable range
CREATE OR REPLACE FUNCTION check_price_match(
  p_user_target_price NUMERIC,
  p_total_discount NUMERIC,
  p_supplier_net_rate NUMERIC,
  p_tolerance_percentage NUMERIC DEFAULT 0.01  -- 1% tolerance
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user target price is within the total discount range with tolerance
  RETURN p_user_target_price >= (p_supplier_net_rate - p_total_discount) * (1 - p_tolerance_percentage)
    AND p_user_target_price <= (p_supplier_net_rate - p_total_discount) * (1 + p_tolerance_percentage);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE markup_rules IS 'Enhanced markup rules supporting all travel modules with fluctuating ranges';
COMMENT ON TABLE promo_codes_enhanced IS 'Enhanced promo codes with multi-module support and range discounts';
COMMENT ON TABLE bargain_holds_enhanced IS 'Price holds for 30-second booking windows with detailed pricing breakdown';
COMMENT ON TABLE bargain_rounds IS 'Individual bargain rounds with round-specific messaging and FOMO logic';
COMMENT ON TABLE promo_usage_log IS 'Comprehensive tracking of promo code usage across all modules';

COMMENT ON FUNCTION calculate_bargain_price IS 'Calculates bargain price using formula: Supplier Net Rate – (Markup Amount + Promo Code Discount)';
COMMENT ON FUNCTION check_price_match IS 'Checks if user target price matches the calculated discount range';
COMMENT ON FUNCTION cleanup_expired_bargain_holds IS 'Cleans up expired bargain holds (should be run by cron job)';
