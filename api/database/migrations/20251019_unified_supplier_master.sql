-- Unified Supplier Management upgrade
-- Adds columns to supplier_master and creates fx_rates + markup_audit_log tables

BEGIN;

-- Ensure uuid generation available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add missing columns to supplier_master
ALTER TABLE supplier_master
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS module TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS base_currency CHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS hedge_buffer NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS base_markup NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_updated_by TEXT;

-- Backfill modules for existing known suppliers when empty
UPDATE supplier_master SET module = ARRAY['hotels']::TEXT[] WHERE module = '{}'::TEXT[];

-- fx_rates table (normalized around USD)
CREATE TABLE IF NOT EXISTS fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency CHAR(3) NOT NULL DEFAULT 'USD',
  target_currency CHAR(3) NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  source TEXT DEFAULT 'MANUAL',
  hedge_buffer NUMERIC(5,2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- seed a few common currencies if empty
INSERT INTO fx_rates (base_currency, target_currency, rate, source, hedge_buffer)
SELECT * FROM (
  VALUES
    ('USD','INR',83.000000,'SEED',1.00),
    ('USD','AED',3.672500,'SEED',0.25),
    ('USD','EUR',0.920000,'SEED',0.75)
) v(base_currency, target_currency, rate, source, hedge_buffer)
WHERE NOT EXISTS (SELECT 1 FROM fx_rates);

-- markup_audit_log table
CREATE TABLE IF NOT EXISTS markup_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,               -- 'supplier' | 'module'
  entity_id TEXT NOT NULL,                 -- supplier_code or rule id
  before_json JSONB,
  after_json JSONB,
  action TEXT NOT NULL,                    -- 'create' | 'update' | 'delete'
  acted_by TEXT,
  acted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_markup_audit_entity ON markup_audit_log(entity_type, entity_id, acted_at DESC);

COMMIT;
