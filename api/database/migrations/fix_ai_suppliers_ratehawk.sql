-- Fix RateHawk in ai.suppliers table
-- The adapter is looking for suppliers in the ai schema, not public schema

-- First, check if ai.suppliers table exists and add RateHawk if needed
INSERT INTO ai.suppliers (code, name, product_type)
VALUES ('ratehawk', 'RateHawk', 'hotels')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  product_type = EXCLUDED.product_type;

-- Also ensure Hotelbeds is in ai.suppliers
INSERT INTO ai.suppliers (code, name, product_type)
VALUES ('hotelbeds', 'Hotelbeds', 'hotels')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  product_type = EXCLUDED.product_type;

-- Verify the suppliers exist
SELECT 'Suppliers in ai schema:' as status;
SELECT id, code, name, product_type FROM ai.suppliers WHERE product_type = 'hotels' ORDER BY code;

-- Also add to public suppliers table for backup
INSERT INTO suppliers (code, name, product_type, is_enabled)
VALUES ('ratehawk', 'RateHawk', 'hotels', TRUE),
       ('hotelbeds', 'Hotelbeds', 'hotels', TRUE)
ON CONFLICT (code) DO UPDATE SET
  is_enabled = TRUE,
  updated_at = NOW();

SELECT 'Suppliers in public schema:' as status;
SELECT code, name, product_type, is_enabled FROM suppliers WHERE product_type = 'hotels' ORDER BY code;
