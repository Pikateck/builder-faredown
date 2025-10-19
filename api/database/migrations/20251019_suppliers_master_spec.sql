-- Final spec DDL: suppliers_master + module_markups and supplier_markups (id FK)
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) suppliers_master (kept separate from legacy supplier_master)
CREATE TABLE IF NOT EXISTS suppliers_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  module TEXT[] NOT NULL DEFAULT '{}',
  base_currency CHAR(3) NOT NULL DEFAULT 'USD',
  hedge_buffer_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  base_markup_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  last_updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_master_status ON suppliers_master(status);

-- Backfill from legacy supplier_master when empty
INSERT INTO suppliers_master (supplier_name, module, base_currency, status)
SELECT COALESCE(name, supplier_code), ARRAY['HOTELS']::TEXT[], 'USD', COALESCE(enabled, TRUE)
FROM supplier_master
WHERE NOT EXISTS (SELECT 1 FROM suppliers_master)
ON CONFLICT DO NOTHING;

-- 2) supplier_markups referencing suppliers_master
CREATE TABLE IF NOT EXISTS supplier_markups_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers_master(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  markup_type TEXT NOT NULL CHECK (markup_type IN ('PERCENT','FIXED')),
  markup_value NUMERIC(12,4) NOT NULL,
  fixed_currency CHAR(3) DEFAULT 'USD',
  status BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_by TEXT, updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) module_markups with scopes and bargain range
CREATE TABLE IF NOT EXISTS module_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers_master(id) ON DELETE SET NULL,
  module TEXT NOT NULL,
  is_domestic BOOLEAN,
  cabin TEXT,
  airline_code TEXT,
  city_code TEXT,
  star_rating INT,
  hotel_chain TEXT,
  hotel_id TEXT,
  room_type TEXT,
  origin_city TEXT,
  dest_city TEXT,
  transfer_type TEXT,
  vehicle_type TEXT,
  experience_type TEXT,
  attraction_id TEXT,
  markup_type TEXT NOT NULL CHECK (markup_type IN ('PERCENT','FIXED')),
  markup_value NUMERIC(12,4) NOT NULL,
  fixed_currency CHAR(3) DEFAULT 'USD',
  bargain_min_pct NUMERIC(5,2),
  bargain_max_pct NUMERIC(5,2),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT, updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- fx_rates tweak to align column name (keep both for compatibility)
ALTER TABLE fx_rates
  ADD COLUMN IF NOT EXISTS hedge_buffer_pct_default NUMERIC(5,2) DEFAULT 0.00;

COMMIT;
