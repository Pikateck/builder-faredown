-- Supplier markup registry enhancements
-- Adds missing supplier_master entries for hotel suppliers
-- Exposes view + resolver wrapper expected by pricing service consumers

BEGIN;

INSERT INTO supplier_master (
  code,
  name,
  enabled,
  weight,
  supports_gds,
  supports_lcc,
  supports_ndc,
  online_cancel
)
VALUES
  ('ratehawk', 'RateHawk', TRUE, 95, FALSE, FALSE, FALSE, FALSE),
  ('hotelbeds', 'Hotelbeds', TRUE, 90, FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  enabled = EXCLUDED.enabled,
  weight = EXCLUDED.weight,
  updated_at = NOW();

CREATE OR REPLACE VIEW v_effective_supplier_markups AS
SELECT
  sm.id,
  sm.supplier_code,
  sm.product_type,
  sm.market,
  sm.currency,
  sm.hotel_id,
  sm.destination,
  sm.channel,
  sm.value_type,
  sm.value,
  sm.priority,
  sm.is_active,
  sm.valid_from,
  sm.valid_to,
  sm.created_at,
  sm.updated_at
FROM supplier_markups sm
WHERE sm.is_active = TRUE;

CREATE OR REPLACE FUNCTION pick_markup_rule(
  p_supplier_code TEXT,
  p_product_type TEXT,
  p_market TEXT DEFAULT 'ALL',
  p_currency TEXT DEFAULT 'ALL',
  p_channel TEXT DEFAULT 'ALL',
  p_hotel_id TEXT DEFAULT 'ALL',
  p_destination TEXT DEFAULT 'ALL'
) RETURNS TABLE (
  value_type TEXT,
  value NUMERIC,
  priority INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT result.value_type, result.value, result.priority
  FROM get_effective_supplier_markup(
    p_supplier_code,
    p_product_type,
    p_market,
    p_currency,
    p_hotel_id,
    p_destination,
    p_channel
  ) AS result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
