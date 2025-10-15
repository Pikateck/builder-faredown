-- Canonical pick_markup_rule resolver returning JSONB
-- Drops any legacy overloads and recreates the resolver with a 5-argument signature

BEGIN;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'pick_markup_rule'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s);', rec.schema_name, rec.function_name, rec.arguments);
  END LOOP;
END $$;

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
  p_channel TEXT DEFAULT 'ALL',
  p_currency TEXT DEFAULT 'ALL'
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_markup RECORD;
BEGIN
  SELECT
    sm.value_type,
    sm.value,
    sm.priority,
    sm.updated_at
  INTO v_markup
  FROM v_effective_supplier_markups sm
  WHERE sm.supplier_code = p_supplier_code
    AND sm.product_type = p_product_type
    AND (sm.market = p_market OR sm.market = 'ALL')
    AND (sm.channel = p_channel OR sm.channel = 'ALL')
    AND (sm.currency = p_currency OR sm.currency = 'ALL')
  ORDER BY
    CASE WHEN sm.market <> 'ALL' THEN 1 ELSE 0 END DESC,
    CASE WHEN sm.channel <> 'ALL' THEN 1 ELSE 0 END DESC,
    CASE WHEN sm.currency <> 'ALL' THEN 1 ELSE 0 END DESC,
    sm.priority ASC,
    sm.updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'type', lower(v_markup.value_type),
    'value', v_markup.value,
    'priority', v_markup.priority
  );
END;
$$;

COMMIT;
