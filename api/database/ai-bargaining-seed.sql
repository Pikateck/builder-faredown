-- AI Bargaining Platform Seed Data
-- Initial data for suppliers, policies, and demo configuration

-- Set schema
SET search_path TO ai, public;

-- 1) Insert suppliers
INSERT INTO ai.suppliers(code, name) VALUES
('AMADEUS', 'Amadeus'),
('HOTELBEDS', 'Hotelbeds'),
('TBO', 'TBO Holidays'),
('AGODA', 'Agoda')
ON CONFLICT (code) DO NOTHING;

-- 2) Insert initial policy v1 with the YAML from the spec
INSERT INTO ai.policies(version, dsl_yaml, checksum)
VALUES ('v1', '# AI Bargaining Platform Policy v1
version: v1
global:
  currency_base: USD
  exploration_pct: 0.08          # bandit exploration
  max_rounds: 3
  response_budget_ms: 300
  never_loss: true
price_rules:
  flight:
    min_margin_usd: 6.0
    max_discount_pct: 0.15
    hold_minutes: 10
    allow_perks: false
  hotel:
    min_margin_usd: 4.0
    max_discount_pct: 0.20
    hold_minutes: 15
    allow_perks: true
    allowed_perks: [ "Late checkout", "Free breakfast" ]
  sightseeing:
    min_margin_usd: 3.0
    max_discount_pct: 0.25
    hold_minutes: 5
    allow_perks: true
    allowed_perks: [ "Skip the line", "Free guide" ]
supplier_overrides:
  AMADEUS:
    max_discount_pct: 0.12
  HOTELBEDS:
    allow_perks: true
promo_rules:
  stacking:
    max_total_discount_pct: 0.25
  eligibility:
    loyalty_tier_boost:
      GOLD: 1.05
      PLATINUM: 1.08
guardrails:
  abort_if_inventory_stale_minutes: 5
  abort_if_latency_ms_over: 280
explanations:
  include_floor: true
  include_policy: true', 'seed-v1')
ON CONFLICT (version) DO NOTHING;

-- 3) Insert demo markup rules
INSERT INTO ai.markup_rules(product_type, supplier_id, scope, min_margin, markup_percent, active)
SELECT 'flight', id, '{"airline":"*"}', 6.00, 0.08, TRUE 
FROM ai.suppliers WHERE code='AMADEUS';

INSERT INTO ai.markup_rules(product_type, supplier_id, scope, min_margin, markup_percent, active)
SELECT 'hotel', id, '{"city":"*"}', 4.00, 0.10, TRUE 
FROM ai.suppliers WHERE code='HOTELBEDS';

INSERT INTO ai.markup_rules(product_type, supplier_id, scope, min_margin, markup_percent, active)
SELECT 'sightseeing', id, '{"location":"*"}', 3.00, 0.12, TRUE 
FROM ai.suppliers WHERE code='HOTELBEDS';

-- 4) Insert demo perks
INSERT INTO ai.perk_catalog(name, supplier_scope, eligibility_rules, cost_usd, active) VALUES
('Free breakfast', '{"product_type":"hotel", "suppliers":["HOTELBEDS"]}', '{"min_nights":2, "room_category":["deluxe","premium"]}', 15.00, TRUE),
('Late checkout', '{"product_type":"hotel", "suppliers":["HOTELBEDS","TBO"]}', '{"any_booking":true}', 8.00, TRUE),
('Skip the line', '{"product_type":"sightseeing", "suppliers":["HOTELBEDS"]}', '{"activity_category":["cultural","museum"]}', 5.00, TRUE),
('Free guide', '{"product_type":"sightseeing", "suppliers":["HOTELBEDS"]}', '{"duration_hours":{"min":4}}', 12.00, TRUE),
('Priority boarding', '{"product_type":"flight", "suppliers":["AMADEUS"]}', '{"class":["economy"],"route_type":"domestic"}', 10.00, FALSE);

-- 5) Insert demo promo codes
INSERT INTO ai.promos(code, kind, value, conditions, budget_usd, active) VALUES
('SAVE10', 'PERCENT', 10.0, '{"product_types":["flight","hotel"],"min_amount":100}', 5000.00, TRUE),
('WELCOME20', 'FLAT', 20.0, '{"product_types":["flight","hotel"],"new_user":true}', 2000.00, TRUE),
('HOTEL15', 'PERCENT', 15.0, '{"product_types":["hotel"],"city":"*"}', 3000.00, TRUE),
('SIGHT25', 'PERCENT', 25.0, '{"product_types":["sightseeing"],"location":"*"}', 1000.00, TRUE);

-- 6) Insert initial model registry
INSERT INTO ai.model_registry(name, version, artifact_uri, active) VALUES
('propensity_baseline', 'v1.0', '/models/propensity_baseline_v1.pkl', TRUE),
('bandit_epsilon_greedy', 'v1.0', '/models/bandit_epsilon_v1.pkl', FALSE);

-- 7) Insert demo A/B test
INSERT INTO ai.ab_tests(name, variants, kpis, active) VALUES
('bargain_aggressiveness', '{"conservative":0.4, "moderate":0.4, "aggressive":0.2}', '{"profit_per_session":{"target":">= 15.0"}, "acceptance_rate":{"target":">= 0.35"}}', TRUE);

-- 8) Insert demo user profiles
INSERT INTO ai.user_profiles(user_id, tier, rfm, style, ltv_usd) VALUES
('demo_user_1', 'GOLD', '{"recency_days":15, "frequency_bookings":8, "monetary_total":2400}', 'persistent', 800.00),
('demo_user_2', 'SILVER', '{"recency_days":45, "frequency_bookings":3, "monetary_total":950}', 'cautious', 320.00),
('demo_user_3', 'PLATINUM', '{"recency_days":7, "frequency_bookings":15, "monetary_total":5200}', 'generous', 1200.00);

-- 9) Insert demo products
INSERT INTO ai.products(canonical_key, product_type, attrs) VALUES
('FL:AI-BOM-DXB-2025-10-01-Y', 'flight', '{"airline":"AI", "origin":"BOM", "dest":"DXB", "dep_date":"2025-10-01", "fare_basis":"Y"}'),
('FL:6E-DEL-BLR-2025-10-15-Y', 'flight', '{"airline":"6E", "origin":"DEL", "dest":"BLR", "dep_date":"2025-10-15", "fare_basis":"Y"}'),
('HT:12345:DLX:BRD-BB:CXL-FLEX', 'hotel', '{"hotel_id":"12345", "city":"DXB", "room_code":"DLX", "board":"BB", "cancel_policy":"FLEX"}'),
('HT:67890:STD:BRD-HB:CXL-STRICT', 'hotel', '{"hotel_id":"67890", "city":"GOA", "room_code":"STD", "board":"HB", "cancel_policy":"STRICT"}'),
('ST:DUBAI-BURJKHALIFA:SKIP:4H', 'sightseeing', '{"location":"DUBAI", "activity":"BURJKHALIFA", "category":"cultural", "duration":"4H"}');

-- 10) Insert demo supplier rate snapshots
INSERT INTO ai.supplier_rate_snapshots(canonical_key, supplier_id, currency, net, taxes, fees, inventory_state)
SELECT 'FL:AI-BOM-DXB-2025-10-01-Y', id, 'USD', 285.00, 45.50, 12.00, 'AVAILABLE'
FROM ai.suppliers WHERE code='AMADEUS';

INSERT INTO ai.supplier_rate_snapshots(canonical_key, supplier_id, currency, net, taxes, fees, inventory_state)
SELECT 'FL:6E-DEL-BLR-2025-10-15-Y', id, 'USD', 125.00, 22.50, 8.00, 'AVAILABLE'
FROM ai.suppliers WHERE code='AMADEUS';

INSERT INTO ai.supplier_rate_snapshots(canonical_key, supplier_id, currency, net, taxes, fees, inventory_state)
SELECT 'HT:12345:DLX:BRD-BB:CXL-FLEX', id, 'USD', 120.00, 18.00, 5.00, 'AVAILABLE'
FROM ai.suppliers WHERE code='HOTELBEDS';

INSERT INTO ai.supplier_rate_snapshots(canonical_key, supplier_id, currency, net, taxes, fees, inventory_state)
SELECT 'HT:67890:STD:BRD-HB:CXL-STRICT', id, 'USD', 85.00, 12.75, 3.50, 'AVAILABLE'
FROM ai.suppliers WHERE code='HOTELBEDS';

INSERT INTO ai.supplier_rate_snapshots(canonical_key, supplier_id, currency, net, taxes, fees, inventory_state)
SELECT 'ST:DUBAI-BURJKHALIFA:SKIP:4H', id, 'USD', 45.00, 6.75, 2.25, 'AVAILABLE'
FROM ai.suppliers WHERE code='HOTELBEDS';

-- 11) Insert demo product features
INSERT INTO ai.product_features(canonical_key, demand_score, comp_pressure, avg_accept_depth, seasonality) VALUES
('FL:AI-BOM-DXB-2025-10-01-Y', 0.75, 0.65, 0.45, '{"peak_season":["oct","nov","dec"],"demand_multiplier":1.2}'),
('FL:6E-DEL-BLR-2025-10-15-Y', 0.85, 0.70, 0.55, '{"peak_season":["oct","nov","feb","mar"],"demand_multiplier":1.15}'),
('HT:12345:DLX:BRD-BB:CXL-FLEX', 0.70, 0.60, 0.40, '{"peak_season":["nov","dec","jan","feb"],"demand_multiplier":1.3}'),
('HT:67890:STD:BRD-HB:CXL-STRICT', 0.80, 0.55, 0.50, '{"peak_season":["dec","jan","feb"],"demand_multiplier":1.25}'),
('ST:DUBAI-BURJKHALIFA:SKIP:4H', 0.90, 0.45, 0.65, '{"peak_season":["nov","dec","jan","feb","mar"],"demand_multiplier":1.4}');

-- Log seed completion
DO $$
BEGIN
    RAISE NOTICE 'AI Bargaining Platform seed data inserted successfully';
    RAISE NOTICE 'Suppliers: %, Policies: %, Products: %, Snapshots: %', 
        (SELECT COUNT(*) FROM ai.suppliers),
        (SELECT COUNT(*) FROM ai.policies), 
        (SELECT COUNT(*) FROM ai.products),
        (SELECT COUNT(*) FROM ai.supplier_rate_snapshots);
END $$;
