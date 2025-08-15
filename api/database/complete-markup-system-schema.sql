-- ===== Complete Markup & Pricing System Schema =====
-- This creates a unified system for markups, promos, bargaining, and bookings
-- across Air, Hotel, Sightseeing, and Transfer modules

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== MARKUP RULES TABLE =====
CREATE TABLE IF NOT EXISTS markup_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL CHECK (module IN ('air','hotel','sightseeing','transfer')),
  rule_name text NOT NULL,
  description text,
  origin text NULL,
  destination text NULL,
  airline_code text NULL,
  hotel_category text NULL,
  service_class text NULL,
  service_type text NULL,
  markup_type text NOT NULL CHECK (markup_type IN ('percent','fixed')) DEFAULT 'percent',
  markup_value numeric(8,2) NOT NULL,
  current_min_pct numeric(5,2) NOT NULL,
  current_max_pct numeric(5,2) NOT NULL,
  bargain_min_pct numeric(5,2) NOT NULL,
  bargain_max_pct numeric(5,2) NOT NULL,
  valid_from date NULL,
  valid_to date NULL,
  blackout_ranges daterange[] NULL,
  priority int NOT NULL DEFAULT 1,
  user_type text NOT NULL DEFAULT 'all',
  status text NOT NULL CHECK (status IN ('active','inactive')) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== PROMO CODES TABLE =====
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  module text NOT NULL CHECK (module IN ('air','hotel','sightseeing','transfer')),
  description text,
  origin text NULL,
  destination text NULL,
  airline_code text NULL,
  hotel_category text NULL,
  service_class text NULL,
  service_type text NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')) DEFAULT 'percent',
  discount_min numeric(8,2) NOT NULL,
  discount_max numeric(8,2) NOT NULL,
  min_fare_amount numeric(12,2) NOT NULL DEFAULT 0,
  marketing_budget numeric(12,2) NOT NULL DEFAULT 0,
  budget_spent numeric(12,2) NOT NULL DEFAULT 0,
  expires_on date NULL,
  show_on_home boolean NOT NULL DEFAULT false,
  status text NOT NULL CHECK (status IN ('active','pending','inactive')) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== BOOKINGS TABLE =====
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL CHECK (module IN ('air','hotel','sightseeing','transfer')),
  supplier text,
  base_net_amount numeric(12,2) NOT NULL,
  applied_markup_rule_id uuid NULL REFERENCES markup_rules(id),
  applied_markup_value numeric(12,2) NOT NULL,
  applied_markup_pct numeric(5,2),
  promo_code_id uuid NULL REFERENCES promo_codes(id),
  promo_discount_value numeric(12,2) NOT NULL DEFAULT 0,
  bargain_discount_value numeric(12,2) NOT NULL DEFAULT 0,
  gross_before_bargain numeric(12,2) NOT NULL,
  gross_after_bargain numeric(12,2) NOT NULL,
  final_payable numeric(12,2) NOT NULL,
  never_loss_pass boolean NOT NULL DEFAULT true,
  user_id uuid,
  class text NULL,
  hotel_category text NULL,
  service_type text NULL,
  origin text NULL,
  destination text NULL,
  booking_reference text UNIQUE,
  payment_reference text,
  booking_status text DEFAULT 'confirmed' CHECK (booking_status IN ('pending','confirmed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== BARGAIN EVENTS TABLE =====
CREATE TABLE IF NOT EXISTS bargain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  user_id uuid,
  offered_price numeric(12,2),
  engine_counter_offer numeric(12,2),
  accepted boolean,
  metadata jsonb,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== PRICING QUOTES TABLE (for temporary quotes) =====
CREATE TABLE IF NOT EXISTS pricing_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  temp_id text UNIQUE NOT NULL,
  module text NOT NULL,
  base_net_amount numeric(12,2) NOT NULL,
  markup_rule_id uuid REFERENCES markup_rules(id),
  markup_value numeric(12,2) NOT NULL,
  promo_code_id uuid NULL REFERENCES promo_codes(id),
  promo_discount numeric(12,2) DEFAULT 0,
  gross_before_bargain numeric(12,2) NOT NULL,
  quote_details jsonb,
  expires_at timestamptz DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz DEFAULT now()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_markup_rules_module ON markup_rules(module);
CREATE INDEX IF NOT EXISTS idx_markup_rules_status ON markup_rules(status);
CREATE INDEX IF NOT EXISTS idx_markup_rules_class ON markup_rules(service_class);
CREATE INDEX IF NOT EXISTS idx_markup_rules_hcat ON markup_rules(hotel_category);
CREATE INDEX IF NOT EXISTS idx_markup_rules_type ON markup_rules(service_type);
CREATE INDEX IF NOT EXISTS idx_markup_rules_priority ON markup_rules(module, priority, status);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_module ON promo_codes(module);
CREATE INDEX IF NOT EXISTS idx_promo_codes_status ON promo_codes(status);

CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_module ON bookings(module);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);

CREATE INDEX IF NOT EXISTS idx_bargain_events_booking ON bargain_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_pricing_quotes_temp ON pricing_quotes(temp_id);
CREATE INDEX IF NOT EXISTS idx_pricing_quotes_expires ON pricing_quotes(expires_at);

-- ===== TRIGGERS =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_markup_rules_updated_at 
    BEFORE UPDATE ON markup_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at 
    BEFORE UPDATE ON promo_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== UPSERT FUNCTION FOR MARKUP RULES =====
CREATE OR REPLACE FUNCTION upsert_markup(
  p_module text, p_rule_name text, p_desc text,
  p_markup_type text, p_markup_value numeric,
  p_cur_min numeric, p_cur_max numeric,
  p_barg_min numeric, p_barg_max numeric,
  p_priority int,
  p_service_class text DEFAULT NULL,
  p_hotel_category text DEFAULT NULL,
  p_service_type text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE rid uuid;
BEGIN
  INSERT INTO markup_rules(
    module, rule_name, description, markup_type, markup_value,
    current_min_pct, current_max_pct, bargain_min_pct, bargain_max_pct,
    priority, service_class, hotel_category, service_type, status
  )
  VALUES (
    p_module, p_rule_name, p_desc, p_markup_type, p_markup_value,
    p_cur_min, p_cur_max, p_barg_min, p_barg_max,
    p_priority, p_service_class, p_hotel_category, p_service_type, 'active'
  )
  ON CONFLICT (module, rule_name) DO UPDATE
  SET description = EXCLUDED.description,
      markup_type = EXCLUDED.markup_type,
      markup_value = EXCLUDED.markup_value,
      current_min_pct = EXCLUDED.current_min_pct,
      current_max_pct = EXCLUDED.current_max_pct,
      bargain_min_pct = EXCLUDED.bargain_min_pct,
      bargain_max_pct = EXCLUDED.bargain_max_pct,
      priority = EXCLUDED.priority,
      service_class = EXCLUDED.service_class,
      hotel_category = EXCLUDED.hotel_category,
      service_type = EXCLUDED.service_type,
      updated_at = now()
  RETURNING id INTO rid;
  RETURN rid;
END; $$ LANGUAGE plpgsql;

-- Unique constraint for the upsert to work
CREATE UNIQUE INDEX IF NOT EXISTS uniq_markup_module_rule ON markup_rules(module, rule_name);

-- ===== SEED DATA =====

-- Global "All" rules for every module
SELECT upsert_markup('air','Global All','Default for all flights','percent',5,10,15,5,15,1,NULL,NULL,NULL);
SELECT upsert_markup('hotel','Global All','Default for all hotels','percent',5,10,15,5,15,1,NULL,NULL,NULL);
SELECT upsert_markup('sightseeing','Global All','Default for all sightseeing','percent',5,10,15,5,15,1,NULL,NULL,NULL);
SELECT upsert_markup('transfer','Global All','Default for all transfers','percent',5,10,15,5,15,1,NULL,NULL,NULL);

-- Premium flight classes
SELECT upsert_markup('air','Business Class','Business class premium','percent',8,12,18,6,12,2,'Business',NULL,NULL);
SELECT upsert_markup('air','First Class','First class premium','percent',10,15,20,8,14,3,'First',NULL,NULL);

-- 5-star hotels
SELECT upsert_markup('hotel','5-Star Hotels','Premium hotels','percent',12,15,22,8,14,2,NULL,'5-star',NULL);

-- Luxury services (transfers/sightseeing)
SELECT upsert_markup('transfer','Luxury Services','Premium transfers','percent',10,14,20,7,12,2,NULL,NULL,'Luxury');
SELECT upsert_markup('sightseeing','Luxury Services','Premium experiences','percent',10,14,20,7,12,2,NULL,NULL,'Luxury');

-- ===== PROMO CODES =====
INSERT INTO promo_codes(code,module,description,discount_type,discount_min,discount_max,
                        min_fare_amount,marketing_budget,expires_on,show_on_home,status,
                        service_class,hotel_category,service_type)
VALUES
  ('BUSINESSDEAL','air','Business Class promo','percent',5,12,5000,20000,NULL,true,'active','Business',NULL,NULL),
  ('FIRSTLUXE','air','First Class promo','percent',7,15,8000,25000,NULL,true,'active','First',NULL,NULL),
  ('FIVESTARSTAY','hotel','5-Star Hotels promo','percent',8,20,4000,30000,NULL,true,'active',NULL,'5-star',NULL),
  ('LUXURYTREAT','transfer','Luxury transfers promo','percent',6,15,3000,15000,NULL,false,'active',NULL,NULL,'Luxury'),
  ('SIGHTSEE20','sightseeing','Sightseeing discount','percent',10,20,2000,25000,NULL,true,'active',NULL,NULL,NULL),
  ('WELCOME10','air','Welcome discount for flights','percent',5,10,1000,50000,NULL,true,'active',NULL,NULL,NULL),
  ('HOTELSTAY15','hotel','Hotel stay discount','percent',10,15,2500,40000,NULL,true,'active',NULL,NULL,NULL)
ON CONFLICT (code) DO UPDATE SET
  module = EXCLUDED.module,
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_min = EXCLUDED.discount_min,
  discount_max = EXCLUDED.discount_max,
  min_fare_amount = EXCLUDED.min_fare_amount,
  marketing_budget = EXCLUDED.marketing_budget,
  show_on_home = EXCLUDED.show_on_home,
  status = EXCLUDED.status,
  service_class = EXCLUDED.service_class,
  hotel_category = EXCLUDED.hotel_category,
  service_type = EXCLUDED.service_type,
  updated_at = now();

-- ===== ADMIN REPORT VIEW =====
CREATE OR REPLACE VIEW v_bookings_report AS
SELECT
  b.id AS booking_id,
  b.created_at,
  b.module,
  b.supplier,
  b.user_id,
  b.origin, b.destination,
  b.class, b.hotel_category, b.service_type,
  b.base_net_amount,
  b.applied_markup_value,
  b.applied_markup_pct,
  b.promo_discount_value,
  b.bargain_discount_value,
  b.gross_before_bargain,
  b.gross_after_bargain,
  b.final_payable,
  b.never_loss_pass,
  b.booking_reference,
  b.payment_reference,
  b.booking_status,
  mr.rule_name AS markup_rule_name,
  pc.code       AS promo_code
FROM bookings b
LEFT JOIN markup_rules mr ON mr.id = b.applied_markup_rule_id
LEFT JOIN promo_codes pc  ON pc.id = b.promo_code_id;

-- ===== ADMIN ANALYTICS VIEWS =====
CREATE OR REPLACE VIEW v_markup_analytics AS
SELECT 
    module,
    COUNT(*) as total_rules,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_rules,
    AVG(markup_value) as avg_markup_value,
    MIN(markup_value) as min_markup_value,
    MAX(markup_value) as max_markup_value
FROM markup_rules
GROUP BY module;

CREATE OR REPLACE VIEW v_promo_analytics AS
SELECT 
    module,
    COUNT(*) as total_promos,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promos,
    SUM(marketing_budget) as total_budget,
    SUM(budget_spent) as total_spent,
    AVG(discount_min) as avg_min_discount,
    AVG(discount_max) as avg_max_discount
FROM promo_codes
GROUP BY module;

-- ===== CLEANUP FUNCTION FOR EXPIRED QUOTES =====
CREATE OR REPLACE FUNCTION cleanup_expired_quotes()
RETURNS void AS $$
BEGIN
    DELETE FROM pricing_quotes WHERE expires_at < CURRENT_TIMESTAMP;
    RAISE NOTICE 'Expired quotes cleanup completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Complete Markup & Pricing System schema created successfully!' as status,
       'Tables: markup_rules, promo_codes, bookings, bargain_events, pricing_quotes' as tables_created,
       'Views: v_bookings_report, v_markup_analytics, v_promo_analytics' as views_created;
