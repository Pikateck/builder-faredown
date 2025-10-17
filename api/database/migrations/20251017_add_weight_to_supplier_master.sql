-- Ensure supplier_master has a weight column for ranking and admin controls
-- Compatible with both variants of supplier_master (code or supplier_code key)

-- Add weight column if missing
ALTER TABLE IF EXISTS supplier_master
  ADD COLUMN IF NOT EXISTS weight INTEGER NOT NULL DEFAULT 100;

-- Add enabled column if missing (safety)
ALTER TABLE IF EXISTS supplier_master
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Helpful composite index for queries ordering by enabled DESC, weight DESC
CREATE INDEX IF NOT EXISTS idx_supplier_master_enabled_weight
  ON supplier_master(enabled, weight DESC);

-- Seed sensible weights for known suppliers when absent
-- Note: WHERE clause ensures we only update when weight is still default 100
UPDATE supplier_master SET weight = 110
WHERE (code = 'HOTELBEDS' OR supplier_code = 'HOTELBEDS') AND weight = 100;

UPDATE supplier_master SET weight = 120
WHERE (code = 'RATEHAWK' OR supplier_code = 'RATEHAWK') AND weight = 100;

UPDATE supplier_master SET weight = 125
WHERE (code = 'TBO' OR supplier_code = 'TBO') AND weight = 100;
