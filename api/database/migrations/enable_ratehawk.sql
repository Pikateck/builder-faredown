-- Enable RateHawk in suppliers table
-- This ensures RateHawk is available for multi-supplier hotel searches

-- First, check if the suppliers table has the expected structure
-- If it doesn't have is_enabled column, create it
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE;

-- Ensure code column exists (for multi-supplier queries)
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Ensure product_type column exists
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'hotels';

-- Insert or update RateHawk supplier record
INSERT INTO suppliers (code, name, product_type, is_enabled)
VALUES ('ratehawk', 'RateHawk', 'hotels', TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  product_type = EXCLUDED.product_type,
  is_enabled = TRUE,
  updated_at = NOW();

-- Ensure Hotelbeds is also enabled
INSERT INTO suppliers (code, name, product_type, is_enabled)
VALUES ('hotelbeds', 'Hotelbeds', 'hotels', TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  product_type = EXCLUDED.product_type,
  is_enabled = TRUE,
  updated_at = NOW();

-- Verify the suppliers are enabled
SELECT 'Suppliers Status:' as status;
SELECT code, name, product_type, is_enabled FROM suppliers WHERE product_type = 'hotels' ORDER BY code;
