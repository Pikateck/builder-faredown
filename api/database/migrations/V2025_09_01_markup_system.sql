-- ENUMS
DO $$ BEGIN
  CREATE TYPE markup_module AS ENUM ('air','hotel','sightseeing','transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE markup_type AS ENUM ('percentage','flat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- MARKUP RULES
CREATE TABLE IF NOT EXISTS markup_rules (
  id               BIGSERIAL PRIMARY KEY,
  module           markup_module NOT NULL,
  rule_name        TEXT NOT NULL,
  description      TEXT,

  airline_code     TEXT,
  booking_class    TEXT,
  route_from       TEXT,
  route_to         TEXT,
  hotel_city       TEXT,
  hotel_star_min   INT,
  hotel_star_max   INT,
  supplier_id      TEXT,
  product_code     TEXT,
  vehicle_type     TEXT,
  transfer_kind    TEXT,

  m_type           markup_type NOT NULL DEFAULT 'percentage',
  m_value          NUMERIC(12,4) NOT NULL,

  current_min_pct  NUMERIC(8,4),
  current_max_pct  NUMERIC(8,4),
  bargain_min_pct  NUMERIC(8,4),
  bargain_max_pct  NUMERIC(8,4),

  valid_from       DATE,
  valid_to         DATE,
  priority         INT DEFAULT 1,
  user_type        TEXT DEFAULT 'all',
  is_active        BOOLEAN DEFAULT TRUE,

  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_markup_rules_module_active ON markup_rules(module, is_active);
CREATE INDEX IF NOT EXISTS idx_markup_rules_air ON markup_rules(module, airline_code, route_from, route_to, booking_class);
CREATE INDEX IF NOT EXISTS idx_markup_rules_hotel ON markup_rules(module, hotel_city, supplier_id);
CREATE INDEX IF NOT EXISTS idx_markup_rules_transfer ON markup_rules(module, transfer_kind, vehicle_type, route_from, route_to);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_updated_at ON markup_rules;
CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON markup_rules FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- PRICING SNAPSHOTS
CREATE TABLE IF NOT EXISTS pricing_quotes (
  id               BIGSERIAL PRIMARY KEY,
  module           markup_module NOT NULL,
  rule_id          BIGINT REFERENCES markup_rules(id) ON DELETE SET NULL,
  request_ref      TEXT,
  supplier_id      TEXT,
  product_code     TEXT,
  route_from       TEXT,
  route_to         TEXT,
  airline_code     TEXT,
  booking_class    TEXT,
  hotel_city       TEXT,
  vehicle_type     TEXT,
  transfer_kind    TEXT,

  base_amount      NUMERIC(14,4) NOT NULL,
  currency         TEXT NOT NULL,
  markup_type      markup_type NOT NULL,
  markup_value     NUMERIC(12,4) NOT NULL,
  final_amount     NUMERIC(14,4) NOT NULL,

  breakdown        JSONB,
  user_id          TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_quotes_module_created ON pricing_quotes(module, created_at DESC);

-- VIEW
CREATE OR REPLACE VIEW vw_active_markup_rules AS
SELECT *
FROM markup_rules
WHERE is_active
  AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
  AND (valid_to   IS NULL OR valid_to   >= CURRENT_DATE);

-- SEED EXAMPLES (optional)
-- Air: EK BOM→DXB Economy +5%
INSERT INTO markup_rules
(module, rule_name, airline_code, route_from, route_to, booking_class,
 m_type, m_value, current_min_pct, current_max_pct, bargain_min_pct, bargain_max_pct,
 valid_from, valid_to, priority, user_type, is_active)
VALUES
('air','BOM→DXB | EK | Y', 'EK','BOM','DXB','Y',
 'percentage', 5, 10, 15, 5, 15,
 CURRENT_DATE, CURRENT_DATE + INTERVAL '120 days', 1, 'all', true)
ON CONFLICT DO NOTHING;

-- Hotel: GOA 3–5★ +7%
INSERT INTO markup_rules
(module, rule_name, hotel_city, hotel_star_min, hotel_star_max, m_type, m_value, priority)
VALUES
('hotel','Goa 3–5★','GOA',3,5,'percentage',7,1)
ON CONFLICT DO NOTHING;

-- Transfer: Airport Taxi Sedan BOM→NAVI +₹150
INSERT INTO markup_rules
(module, rule_name, transfer_kind, vehicle_type, route_from, route_to, m_type, m_value, priority)
VALUES
('transfer','Airport Taxi Sedan BOM→NAVI','airport_taxi','sedan','BOM','NAVI','flat',150,1)
ON CONFLICT DO NOTHING;
