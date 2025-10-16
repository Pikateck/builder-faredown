-- Fix RateHawk not found error by adding it to ai.suppliers table

-- Step 1: Check if product_type column exists in ai.suppliers
-- If it doesn't exist, add it
ALTER TABLE ai.suppliers 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'hotels';

-- Step 2: Insert RateHawk into ai.suppliers if it doesn't exist
INSERT INTO ai.suppliers (code, name, active, product_type)
VALUES ('ratehawk', 'RateHawk', true, 'hotels')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  active = true,
  product_type = EXCLUDED.product_type,
  updated_at = NOW();

-- Step 3: Insert Hotelbeds into ai.suppliers for consistency
INSERT INTO ai.suppliers (code, name, active, product_type)
VALUES ('hotelbeds', 'Hotelbeds', true, 'hotels')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  active = true,
  product_type = EXCLUDED.product_type,
  updated_at = NOW();

-- Step 4: Also insert Amadeus and TBO for flights
INSERT INTO ai.suppliers (code, name, active, product_type)
VALUES 
  ('amadeus', 'Amadeus', true, 'flights'),
  ('tbo', 'TBO', true, 'flights')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  active = true,
  product_type = EXCLUDED.product_type,
  updated_at = NOW();

-- Step 5: Verify the suppliers are in ai.suppliers
SELECT 'Suppliers in ai schema after fix:' as status;
SELECT id, code, name, active, product_type FROM ai.suppliers ORDER BY code;

-- Step 6: Also ensure public suppliers table has them
INSERT INTO suppliers (code, name, product_type, is_enabled)
VALUES 
  ('ratehawk', 'RateHawk', 'hotels', true),
  ('hotelbeds', 'Hotelbeds', 'hotels', true),
  ('amadeus', 'Amadeus', 'flights', true),
  ('tbo', 'TBO', 'flights', true)
ON CONFLICT (code) DO UPDATE SET
  is_enabled = true,
  updated_at = NOW();

SELECT 'Suppliers in public schema after fix:' as status;
SELECT code, name, product_type, is_enabled FROM suppliers ORDER BY code;

-- Done
SELECT 'Migration complete! RateHawk should now be available for searches.' as status;
