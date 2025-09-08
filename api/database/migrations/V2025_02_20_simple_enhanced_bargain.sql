-- Simple Enhanced Bargain System Database Migration
-- PostgreSQL schema for comprehensive bargain logic with all modules
-- Version: 2.0.0 Simplified
-- Created: 2025-02-20

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create modules table first (product types)
CREATE TABLE IF NOT EXISTS modules (
  id            SERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  icon          TEXT,
  description   TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add check constraint for module names
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'modules_name_check' 
               AND table_name = 'modules') THEN
        ALTER TABLE modules DROP CONSTRAINT modules_name_check;
    END IF;
    
    -- Add new constraint
    ALTER TABLE modules ADD CONSTRAINT modules_name_check 
    CHECK (name IN ('flights','hotels','sightseeing','transfers'));
END $$;

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

-- Create bargain sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS bargain_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID,
  module_id      INT NOT NULL,
  product_ref    TEXT NOT NULL,
  attempt_count  INT NOT NULL DEFAULT 0,
  max_attempts   INT NOT NULL DEFAULT 3,
  ai_personality TEXT NOT NULL DEFAULT 'standard',
  emotional_state JSONB DEFAULT '{}'::jsonb,
  user_context   JSONB DEFAULT '{}'::jsonb,
  base_price     NUMERIC(12,2) NOT NULL,
  final_price    NUMERIC(12,2),
  status         TEXT DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ
);

-- Create enhanced markup rules table for all modules
CREATE TABLE IF NOT EXISTS markup_rules_enhanced (
  id                    SERIAL PRIMARY KEY,
  rule_name             TEXT NOT NULL,
  rule_type             TEXT NOT NULL,
  module_id             INT NOT NULL,
  supplier_id           INT,
  
  -- General markup configuration
  markup_percentage     NUMERIC(6,4) NOT NULL DEFAULT 0.10,
  min_markup_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.05,
  max_markup_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.25,
  
  -- Fixed amount markup options
  fixed_markup_amount   NUMERIC(12,2) DEFAULT 0,
  min_markup_amount     NUMERIC(12,2) DEFAULT 0,
  max_markup_amount     NUMERIC(12,2),
  
  -- Bargain range configuration
  bargain_min_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.02,
  bargain_max_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.15,
  
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

-- Add check constraint for rule types
ALTER TABLE markup_rules_enhanced ADD CONSTRAINT markup_rules_enhanced_rule_type_check 
CHECK (rule_type IN ('general','supplier','city','star_rating','room_category','route','airline','cabin_class','tour_type','transfer_type'));

-- Add check constraint for status values
ALTER TABLE bargain_sessions ADD CONSTRAINT bargain_sessions_status_check 
CHECK (status IN ('active','completed','expired','cancelled'));

-- Create enhanced promo codes table with all module support
CREATE TABLE IF NOT EXISTS promo_codes_enhanced (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  description           TEXT,
  
  -- Module applicability (stored as comma-separated for simplicity)
  applicable_modules    TEXT NOT NULL DEFAULT 'flights,hotels,sightseeing,transfers',
  
  -- Discount configuration
  discount_type         TEXT NOT NULL,
  discount_value        NUMERIC(12,2) NOT NULL,
  discount_min_value    NUMERIC(12,2),
  discount_max_value    NUMERIC(12,2),
  
  -- Usage and budget limits
  usage_limit           INT,
  usage_count           INT DEFAULT 0,
  user_usage_limit      INT DEFAULT 1,
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
  status                TEXT NOT NULL DEFAULT 'active',
  priority              INT DEFAULT 1,
  
  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            TEXT,
  updated_by            TEXT
);

-- Add check constraints for promo codes
ALTER TABLE promo_codes_enhanced ADD CONSTRAINT promo_codes_enhanced_discount_type_check 
CHECK (discount_type IN ('percentage','fixed','range'));

ALTER TABLE promo_codes_enhanced ADD CONSTRAINT promo_codes_enhanced_status_check 
CHECK (status IN ('active','paused','expired','exhausted'));

-- Create bargain holds table for 30-second price holds
CREATE TABLE IF NOT EXISTS bargain_holds_enhanced (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            UUID NOT NULL,
  module_id             INT NOT NULL,
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
  
  -- Reference IDs (no foreign key constraints for now)
  promo_code_id         UUID,
  markup_rule_id        INT,
  
  -- Hold status
  status                TEXT NOT NULL DEFAULT 'active',
  consumed_at           TIMESTAMPTZ,
  booking_reference     TEXT,
  
  -- Metadata
  metadata              JSONB DEFAULT '{}'::jsonb,
  
  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add check constraint for hold status
ALTER TABLE bargain_holds_enhanced ADD CONSTRAINT bargain_holds_enhanced_status_check 
CHECK (status IN ('active','expired','consumed','cancelled'));

-- Create bargain rounds table for tracking round-specific messaging
CREATE TABLE IF NOT EXISTS bargain_rounds (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            UUID NOT NULL,
  round_number          INT NOT NULL,
  
  -- Round details
  user_target_price     NUMERIC(12,2) NOT NULL,
  ai_counter_price      NUMERIC(12,2),
  round_status          TEXT NOT NULL,
  
  -- Pricing calculations for this round
  supplier_net_price    NUMERIC(12,2) NOT NULL,
  markup_amount         NUMERIC(12,2) NOT NULL,
  promo_discount        NUMERIC(12,2) DEFAULT 0,
  total_discount        NUMERIC(12,2) NOT NULL,
  
  -- Round messaging
  ai_message            TEXT,
  warning_message       TEXT,
  round_type            TEXT NOT NULL,
  
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

-- Add check constraints for bargain rounds
ALTER TABLE bargain_rounds ADD CONSTRAINT bargain_rounds_round_number_check 
CHECK (round_number BETWEEN 1 AND 3);

ALTER TABLE bargain_rounds ADD CONSTRAINT bargain_rounds_round_status_check 
CHECK (round_status IN ('pending','active','completed','matched','rejected'));

ALTER TABLE bargain_rounds ADD CONSTRAINT bargain_rounds_round_type_check 
CHECK (round_type IN ('best_offer','risk_round','final_chance'));

-- Create general markup rules (default rules for all modules)
INSERT INTO markup_rules_enhanced (
  rule_name, rule_type, module_id, markup_percentage, min_markup_percentage, max_markup_percentage,
  bargain_min_percentage, bargain_max_percentage, priority, created_by
) 
SELECT 
  'General Markup - ' || m.display_name,
  'general',
  m.id,
  CASE 
    WHEN m.name = 'flights' THEN 0.12
    WHEN m.name = 'hotels' THEN 0.15
    WHEN m.name = 'sightseeing' THEN 0.18
    WHEN m.name = 'transfers' THEN 0.10
  END,
  0.05,
  CASE 
    WHEN m.name = 'flights' THEN 0.25
    WHEN m.name = 'hotels' THEN 0.30
    WHEN m.name = 'sightseeing' THEN 0.35
    WHEN m.name = 'transfers' THEN 0.20
  END,
  0.02,
  CASE
    WHEN m.name = 'flights' THEN 0.15
    WHEN m.name = 'hotels' THEN 0.20
    WHEN m.name = 'sightseeing' THEN 0.25
    WHEN m.name = 'transfers' THEN 0.15
  END,
  1,
  'system'
FROM modules m
WHERE NOT EXISTS (
  SELECT 1 FROM markup_rules_enhanced mr 
  WHERE mr.module_id = m.id AND mr.rule_type = 'general'
);

-- Create sample promo codes for all modules
INSERT INTO promo_codes_enhanced (
  code, name, description, applicable_modules, discount_type, discount_value,
  discount_min_value, discount_max_value, budget_limit, min_booking_amount,
  valid_from, valid_to, created_by
) VALUES
(
  'FAREDOWN25',
  'Faredown Universal Discount',
  'Get 10-25% off on all bookings',
  'flights,hotels,sightseeing,transfers',
  'range',
  15.0,
  10.0,
  25.0,
  500000.00,
  1000.00,
  NOW(),
  NOW() + INTERVAL '1 year',
  'system'
),
(
  'EXPLORE30',
  'Explore More Discount',
  'Special discount for sightseeing and tours',
  'sightseeing',
  'range',
  20.0,
  15.0,
  30.0,
  200000.00,
  500.00,
  NOW(),
  NOW() + INTERVAL '6 months',
  'system'
),
(
  'RIDEEASY',
  'Easy Ride Discount',
  'Save on all transfer bookings',
  'transfers',
  'range',
  15.0,
  10.0,
  20.0,
  100000.00,
  300.00,
  NOW(),
  NOW() + INTERVAL '3 months',
  'system'
),
(
  'STAYANDSEE',
  'Stay and See Combo',
  'Discount when booking hotels with sightseeing',
  'hotels,sightseeing',
  'range',
  18.0,
  12.0,
  25.0,
  300000.00,
  2000.00,
  NOW(),
  NOW() + INTERVAL '4 months',
  'system'
)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_markup_rules_enhanced_module_active ON markup_rules_enhanced(module_id, active);
CREATE INDEX IF NOT EXISTS idx_markup_rules_enhanced_type_priority ON markup_rules_enhanced(rule_type, priority);

CREATE INDEX IF NOT EXISTS idx_promo_codes_enhanced_code_status ON promo_codes_enhanced(code, status);
CREATE INDEX IF NOT EXISTS idx_promo_codes_enhanced_validity ON promo_codes_enhanced(valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_bargain_holds_enhanced_expires ON bargain_holds_enhanced(expires_at, status);
CREATE INDEX IF NOT EXISTS idx_bargain_holds_enhanced_session ON bargain_holds_enhanced(session_id, status);

CREATE INDEX IF NOT EXISTS idx_bargain_rounds_session_round ON bargain_rounds(session_id, round_number);
CREATE INDEX IF NOT EXISTS idx_bargain_rounds_status ON bargain_rounds(round_status);

CREATE INDEX IF NOT EXISTS idx_bargain_sessions_user_module ON bargain_sessions(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_status ON bargain_sessions(status);

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
CREATE OR REPLACE FUNCTION calculate_enhanced_bargain_price(
  p_supplier_net_rate NUMERIC,
  p_module_name TEXT,
  p_promo_code TEXT DEFAULT NULL
) RETURNS TABLE (
  final_price NUMERIC,
  markup_amount NUMERIC,
  promo_discount NUMERIC,
  total_discount NUMERIC,
  bargain_range_min NUMERIC,
  bargain_range_max NUMERIC
) AS $$
DECLARE
  v_module_id INT;
  v_markup_percentage NUMERIC;
  v_min_markup_percentage NUMERIC;
  v_max_markup_percentage NUMERIC;
  v_bargain_min_percentage NUMERIC;
  v_bargain_max_percentage NUMERIC;
  v_markup_amount NUMERIC := 0;
  v_promo_discount NUMERIC := 0;
  v_total_discount NUMERIC := 0;
  v_final_price NUMERIC;
  v_bargain_min NUMERIC;
  v_bargain_max NUMERIC;
  v_promo_discount_value NUMERIC;
  v_promo_min_value NUMERIC;
  v_promo_max_value NUMERIC;
BEGIN
  -- Get module ID
  SELECT id INTO v_module_id FROM modules WHERE name = p_module_name LIMIT 1;
  
  IF v_module_id IS NULL THEN
    RAISE EXCEPTION 'Module % not found', p_module_name;
  END IF;
  
  -- Get markup rule for this module
  SELECT 
    markup_percentage, min_markup_percentage, max_markup_percentage,
    bargain_min_percentage, bargain_max_percentage
  INTO 
    v_markup_percentage, v_min_markup_percentage, v_max_markup_percentage,
    v_bargain_min_percentage, v_bargain_max_percentage
  FROM markup_rules_enhanced mr
  WHERE mr.module_id = v_module_id 
    AND mr.active = TRUE
    AND mr.rule_type = 'general'
    AND (mr.effective_from <= NOW() AND (mr.effective_to IS NULL OR mr.effective_to >= NOW()))
  ORDER BY mr.priority DESC
  LIMIT 1;
  
  -- Use default values if no rule found
  IF v_markup_percentage IS NULL THEN
    v_markup_percentage := 0.12;
    v_min_markup_percentage := 0.05;
    v_max_markup_percentage := 0.25;
    v_bargain_min_percentage := 0.02;
    v_bargain_max_percentage := 0.15;
  END IF;
  
  -- Calculate fluctuating markup amount within min/max range
  v_markup_amount := p_supplier_net_rate * (
    v_min_markup_percentage + 
    (v_max_markup_percentage - v_min_markup_percentage) * RANDOM()
  );
  
  -- Find applicable promo code
  IF p_promo_code IS NOT NULL THEN
    SELECT discount_value, discount_min_value, discount_max_value
    INTO v_promo_discount_value, v_promo_min_value, v_promo_max_value
    FROM promo_codes_enhanced pc
    WHERE pc.code = p_promo_code
      AND pc.status = 'active'
      AND pc.valid_from <= NOW() 
      AND pc.valid_to >= NOW()
      AND (pc.applicable_modules LIKE '%' || p_module_name || '%')
      AND (pc.usage_limit IS NULL OR pc.usage_count < pc.usage_limit)
      AND (pc.budget_limit IS NULL OR pc.budget_used < pc.budget_limit)
    LIMIT 1;
      
    -- Calculate promo discount
    IF v_promo_discount_value IS NOT NULL THEN
      v_promo_discount := (p_supplier_net_rate + v_markup_amount) * (
        v_promo_min_value + 
        (v_promo_max_value - v_promo_min_value) * RANDOM()
      ) / 100;
    END IF;
  END IF;
  
  -- Calculate totals according to formula: Final bargain price = Supplier Net Rate – (Markup Amount + Promo Code Discount)
  v_total_discount := v_markup_amount + v_promo_discount;
  v_final_price := p_supplier_net_rate - v_total_discount;
  
  -- Ensure minimum margin (never go below supplier net rate + 2%)
  v_final_price := GREATEST(v_final_price, p_supplier_net_rate * 1.02);
  
  -- Calculate bargain range
  v_bargain_min := p_supplier_net_rate * (1 + v_bargain_min_percentage);
  v_bargain_max := p_supplier_net_rate * (1 + v_bargain_max_percentage);
  
  RETURN QUERY SELECT 
    v_final_price,
    v_markup_amount,
    v_promo_discount,
    v_total_discount,
    v_bargain_min,
    v_bargain_max;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user target price is within acceptable range
CREATE OR REPLACE FUNCTION check_enhanced_price_match(
  p_user_target_price NUMERIC,
  p_total_discount NUMERIC,
  p_supplier_net_rate NUMERIC,
  p_tolerance_percentage NUMERIC DEFAULT 0.01
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_user_target_price >= (p_supplier_net_rate - p_total_discount) * (1 - p_tolerance_percentage)
    AND p_user_target_price <= (p_supplier_net_rate - p_total_discount) * (1 + p_tolerance_percentage);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE modules IS 'Travel product modules: flights, hotels, sightseeing, transfers';
COMMENT ON TABLE markup_rules_enhanced IS 'Enhanced markup rules supporting all travel modules with fluctuating ranges';
COMMENT ON TABLE promo_codes_enhanced IS 'Enhanced promo codes with multi-module support and range discounts';
COMMENT ON TABLE bargain_holds_enhanced IS 'Price holds for 30-second booking windows with detailed pricing breakdown';
COMMENT ON TABLE bargain_rounds IS 'Individual bargain rounds with round-specific messaging and FOMO logic';

COMMENT ON FUNCTION calculate_enhanced_bargain_price IS 'Calculates bargain price using formula: Supplier Net Rate – (Markup Amount + Promo Code Discount)';
COMMENT ON FUNCTION check_enhanced_price_match IS 'Checks if user target price matches the calculated discount range';
