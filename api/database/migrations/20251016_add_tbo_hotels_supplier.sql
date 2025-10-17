-- Enable TBO as a hotel supplier in public.suppliers and ai.suppliers

-- public.suppliers
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'hotels';
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE;

INSERT INTO suppliers (code, name, product_type, is_enabled)
VALUES ('tbo', 'TBO', 'hotels', TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  product_type = EXCLUDED.product_type,
  is_enabled = TRUE,
  updated_at = NOW();

-- ai.suppliers
CREATE SCHEMA IF NOT EXISTS ai;
CREATE TABLE IF NOT EXISTS ai.suppliers (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  product_type TEXT DEFAULT 'hotels',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ai.suppliers (code, name, active, product_type)
VALUES ('TBO', 'TBO', TRUE, 'hotels')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  active = TRUE,
  product_type = EXCLUDED.product_type,
  updated_at = NOW();
