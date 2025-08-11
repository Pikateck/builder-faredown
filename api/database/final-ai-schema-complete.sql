-- =====================================================
-- AI BARGAINING PLATFORM - FINAL COMPLETE SCHEMA
-- All tables, materialized views, indexes, and seed data
-- =====================================================

-- Create AI namespace if not exists
CREATE SCHEMA IF NOT EXISTS ai;

-- =====================================================
-- 1. CORE TABLES (must exist)
-- =====================================================

-- Suppliers table
CREATE TABLE IF NOT EXISTS ai.suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    api_endpoint TEXT,
    auth_config JSONB,
    circuit_breaker_config JSONB DEFAULT '{"failure_threshold": 5, "recovery_timeout": 30}',
    rate_limit_config JSONB DEFAULT '{"requests_per_minute": 1000}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Policies table
CREATE TABLE IF NOT EXISTS ai.policies (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    dsl_yaml TEXT NOT NULL,
    checksum VARCHAR(64) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP
);

-- Products table (canonical product objects)
CREATE TABLE IF NOT EXISTS ai.products (
    id SERIAL PRIMARY KEY,
    canonical_key VARCHAR(200) UNIQUE NOT NULL,
    product_type VARCHAR(50) NOT NULL, -- flight, hotel, sightseeing
    supplier_id INTEGER REFERENCES ai.suppliers(id),
    attrs JSONB NOT NULL, -- airline, origin, dest, city, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Supplier rate snapshots
CREATE TABLE IF NOT EXISTS ai.supplier_rate_snapshots (
    id BIGSERIAL PRIMARY KEY,
    canonical_key VARCHAR(200) NOT NULL,
    supplier_id INTEGER REFERENCES ai.suppliers(id),
    raw_response JSONB NOT NULL,
    parsed_price_usd DECIMAL(10,2) NOT NULL,
    true_cost_usd DECIMAL(10,2) NOT NULL,
    available_inventory INTEGER,
    snapshot_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    INDEX (canonical_key, snapshot_at DESC)
);

-- Markup rules
CREATE TABLE IF NOT EXISTS ai.markup_rules (
    id SERIAL PRIMARY KEY,
    product_type VARCHAR(50) NOT NULL,
    supplier_id INTEGER REFERENCES ai.suppliers(id),
    scope JSONB NOT NULL, -- {"airline": "AI", "route": "DEL-BOM"}
    min_margin DECIMAL(8,2) NOT NULL,
    markup_percent DECIMAL(5,4) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Promo codes
CREATE TABLE IF NOT EXISTS ai.promos (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    promo_type VARCHAR(20) NOT NULL, -- percentage, flat, tier_boost
    discount_value DECIMAL(8,2) NOT NULL,
    max_total_discount_pct DECIMAL(5,4) DEFAULT 0.25,
    eligibility_rules JSONB,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Promo redemptions
CREATE TABLE IF NOT EXISTS ai.promo_redemptions (
    id BIGSERIAL PRIMARY KEY,
    promo_id INTEGER REFERENCES ai.promos(id),
    user_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100),
    discount_amount_usd DECIMAL(8,2) NOT NULL,
    redeemed_at TIMESTAMP DEFAULT NOW()
);

-- Perk catalog
CREATE TABLE IF NOT EXISTS ai.perk_catalog (
    id SERIAL PRIMARY KEY,
    perk_name VARCHAR(100) NOT NULL,
    perk_type VARCHAR(50) NOT NULL, -- upgrade, amenity, service
    product_types VARCHAR[] NOT NULL, -- {flight, hotel}
    cost_usd DECIMAL(8,2) DEFAULT 0,
    supplier_mapping JSONB, -- supplier-specific perk codes
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bargain sessions
CREATE TABLE IF NOT EXISTS ai.bargain_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    user_tier VARCHAR(20) DEFAULT 'standard',
    device_type VARCHAR(20),
    canonical_key VARCHAR(200) NOT NULL,
    displayed_price_usd DECIMAL(10,2) NOT NULL,
    true_cost_usd DECIMAL(10,2) NOT NULL,
    initial_offer_price DECIMAL(10,2) NOT NULL,
    min_floor DECIMAL(10,2) NOT NULL,
    promo_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- active, accepted, rejected, expired
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_synthetic BOOLEAN DEFAULT false
);

-- Bargain events
CREATE TABLE IF NOT EXISTS ai.bargain_events (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(20) NOT NULL, -- offer, counter, accept, reject
    user_offer DECIMAL(10,2),
    counter_price DECIMAL(10,2),
    accepted BOOLEAN DEFAULT false,
    true_cost_usd DECIMAL(10,2) NOT NULL,
    signals_json JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Offer capsules (audit trail)
CREATE TABLE IF NOT EXISTS ai.offer_capsules (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    offer_payload JSONB NOT NULL,
    signature VARCHAR(200) NOT NULL, -- ECDSA signature
    public_key_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User profiles (feature store)
CREATE TABLE IF NOT EXISTS ai.user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    tier VARCHAR(20) DEFAULT 'standard',
    avg_booking_value_usd DECIMAL(10,2),
    booking_frequency INTEGER,
    price_sensitivity DECIMAL(3,2),
    preferred_discount_pct DECIMAL(5,4),
    last_booking_days_ago INTEGER,
    loyalty_score INTEGER DEFAULT 0,
    feature_vector JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product features
CREATE TABLE IF NOT EXISTS ai.product_features (
    id BIGSERIAL PRIMARY KEY,
    canonical_key VARCHAR(200) UNIQUE NOT NULL,
    popularity_score DECIMAL(3,2),
    avg_price_30d DECIMAL(10,2),
    booking_volume_30d INTEGER,
    competition_index DECIMAL(3,2),
    seasonal_factor DECIMAL(3,2),
    price_volatility DECIMAL(3,2),
    feature_vector JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Model registry
CREATE TABLE IF NOT EXISTS ai.model_registry (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- propensity, pricing, clustering
    model_path TEXT,
    model_config JSONB,
    performance_metrics JSONB,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(model_name, model_version)
);

-- A/B tests
CREATE TABLE IF NOT EXISTS ai.ab_tests (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(100) UNIQUE NOT NULL,
    test_config JSONB NOT NULL,
    traffic_allocation DECIMAL(3,2) NOT NULL, -- 0.1 = 10%
    status VARCHAR(20) DEFAULT 'draft', -- draft, running, paused, completed
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    results JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. MATERIALIZED VIEWS (must exist)
-- =====================================================

-- Daily aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.mv_daily_agg AS
SELECT 
    DATE(s.created_at) as date,
    COUNT(DISTINCT s.session_id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.session_id END) as accepted_sessions,
    ROUND(COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.session_id END)::numeric / 
          NULLIF(COUNT(DISTINCT s.session_id), 0) * 100, 2) as acceptance_rate_pct,
    ROUND(AVG(s.displayed_price_usd), 2) as avg_displayed_price,
    ROUND(AVG(CASE WHEN s.status = 'accepted' THEN s.displayed_price_usd END), 2) as avg_accepted_price,
    ROUND(AVG(CASE WHEN s.status = 'accepted' THEN s.displayed_price_usd - s.true_cost_usd END), 2) as avg_profit_usd,
    COUNT(DISTINCT s.user_id) as unique_users
FROM ai.bargain_sessions s
WHERE s.created_at >= CURRENT_DATE - INTERVAL '90 days'
  AND s.is_synthetic = false
GROUP BY DATE(s.created_at)
ORDER BY date DESC;

-- Airline route daily performance
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.mv_airline_route_daily AS
SELECT 
    DATE(s.created_at) as date,
    SPLIT_PART(s.canonical_key, ':', 1) as product_type,
    COALESCE(p.attrs->>'airline', 'Unknown') as airline,
    COALESCE(p.attrs->>'route', COALESCE(p.attrs->>'origin', '') || '-' || COALESCE(p.attrs->>'dest', '')) as route,
    COUNT(DISTINCT s.session_id) as sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.session_id END) as accepted,
    ROUND(AVG(s.displayed_price_usd), 2) as avg_price,
    ROUND(AVG(CASE WHEN s.status = 'accepted' THEN s.displayed_price_usd - s.true_cost_usd END), 2) as avg_profit
FROM ai.bargain_sessions s
LEFT JOIN ai.products p ON s.canonical_key = p.canonical_key
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND s.canonical_key LIKE 'FL:%'
  AND s.is_synthetic = false
GROUP BY DATE(s.created_at), p.attrs->>'airline', p.attrs->>'route', p.attrs->>'origin', p.attrs->>'dest'
ORDER BY date DESC, sessions DESC;

-- Hotel city daily performance
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.mv_hotel_city_daily AS
SELECT 
    DATE(s.created_at) as date,
    COALESCE(p.attrs->>'city', 'Unknown') as city,
    COALESCE(p.attrs->>'hotel_name', 'Unknown') as hotel_name,
    COUNT(DISTINCT s.session_id) as sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.session_id END) as accepted,
    ROUND(AVG(s.displayed_price_usd), 2) as avg_price,
    ROUND(AVG(CASE WHEN s.status = 'accepted' THEN s.displayed_price_usd - s.true_cost_usd END), 2) as avg_profit,
    ROUND(AVG(CASE WHEN s.status = 'accepted' THEN s.displayed_price_usd END), 2) as avg_accepted_price
FROM ai.bargain_sessions s
LEFT JOIN ai.products p ON s.canonical_key = p.canonical_key
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND s.canonical_key LIKE 'HT:%'
  AND s.is_synthetic = false
GROUP BY DATE(s.created_at), p.attrs->>'city', p.attrs->>'hotel_name'
ORDER BY date DESC, sessions DESC;

-- User segments
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.mv_user_segments AS
SELECT 
    up.tier,
    COUNT(DISTINCT up.user_id) as user_count,
    ROUND(AVG(up.avg_booking_value_usd), 2) as avg_booking_value,
    ROUND(AVG(up.price_sensitivity), 2) as avg_price_sensitivity,
    ROUND(AVG(up.loyalty_score), 0) as avg_loyalty_score,
    COUNT(DISTINCT s.session_id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.session_id END) as accepted_sessions
FROM ai.user_profiles up
LEFT JOIN ai.bargain_sessions s ON up.user_id = s.user_id 
  AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND s.is_synthetic = false
GROUP BY up.tier
ORDER BY user_count DESC;

-- Promo effectiveness
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.mv_promo_effectiveness AS
SELECT 
    p.code,
    p.promo_type,
    p.discount_value,
    COUNT(DISTINCT pr.id) as total_redemptions,
    ROUND(AVG(pr.discount_amount_usd), 2) as avg_discount_amount,
    COUNT(DISTINCT s.session_id) as sessions_with_promo,
    COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.session_id END) as accepted_with_promo,
    ROUND(COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.session_id END)::numeric / 
          NULLIF(COUNT(DISTINCT s.session_id), 0) * 100, 2) as acceptance_rate_pct
FROM ai.promos p
LEFT JOIN ai.promo_redemptions pr ON p.id = pr.promo_id
LEFT JOIN ai.bargain_sessions s ON p.code = s.promo_code 
  AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND s.is_synthetic = false
WHERE p.active = true
GROUP BY p.code, p.promo_type, p.discount_value
ORDER BY total_redemptions DESC NULLS LAST;

-- =====================================================
-- 3. PERFORMANCE INDEXES (create if missing)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_snapshots_ckey_time ON ai.supplier_rate_snapshots(canonical_key, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created ON ai.bargain_events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON ai.bargain_events(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_ckey ON ai.bargain_sessions(canonical_key);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON ai.bargain_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON ai.bargain_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON ai.bargain_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_products_airline ON ai.products ((attrs->>'airline'));
CREATE INDEX IF NOT EXISTS idx_products_origin ON ai.products ((attrs->>'origin'));
CREATE INDEX IF NOT EXISTS idx_products_dest ON ai.products ((attrs->>'dest'));
CREATE INDEX IF NOT EXISTS idx_products_city ON ai.products ((attrs->>'city'));
CREATE INDEX IF NOT EXISTS idx_products_type ON ai.products(product_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON ai.user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_capsules_session ON ai.offer_capsules(session_id);
CREATE INDEX IF NOT EXISTS idx_promos_code ON ai.promos(code) WHERE active = true;

-- =====================================================
-- 4. NEVER-LOSS DB FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION ai.assert_never_loss(
    p_session_id VARCHAR(100),
    p_final_price DECIMAL(10,2)
) RETURNS BOOLEAN AS $$
DECLARE
    v_true_cost DECIMAL(10,2);
    v_min_floor DECIMAL(10,2);
BEGIN
    -- Get session cost data
    SELECT true_cost_usd, min_floor
    INTO v_true_cost, v_min_floor
    FROM ai.bargain_sessions
    WHERE session_id = p_session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found: %', p_session_id;
    END IF;
    
    -- Never-loss enforcement: price must be >= true cost
    IF p_final_price < v_true_cost THEN
        RAISE EXCEPTION 'NEVER_LOSS_VIOLATION: Final price % < true cost %', p_final_price, v_true_cost;
    END IF;
    
    -- Floor enforcement: price must be >= min floor
    IF p_final_price < v_min_floor THEN
        RAISE EXCEPTION 'FLOOR_VIOLATION: Final price % < min floor %', p_final_price, v_min_floor;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. SEED DATA (must be present at least once)
-- =====================================================

-- Suppliers
INSERT INTO ai.suppliers(code, name, api_endpoint, active) VALUES
('AMADEUS', 'Amadeus', 'https://api.amadeus.com', true),
('HOTELBEDS', 'Hotelbeds', 'https://api.hotelbeds.com', true)
ON CONFLICT (code) DO NOTHING;

-- Default policy v1
INSERT INTO ai.policies(version, dsl_yaml, checksum, active)
VALUES ('v1', 'version: v1
global: 
  currency_base: USD
  exploration_pct: 0.08
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
    allowed_perks: ["Late checkout", "Free breakfast"]
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
  include_policy: true', 'seed-v1', true)
ON CONFLICT (checksum) DO NOTHING;

-- Markup rules
INSERT INTO ai.markup_rules(product_type, supplier_id, scope, min_margin, markup_percent, active)
SELECT 'flight', id, '{"airline":"*"}', 6.00, 0.08, TRUE 
FROM ai.suppliers WHERE code='AMADEUS'
ON CONFLICT DO NOTHING;

INSERT INTO ai.markup_rules(product_type, supplier_id, scope, min_margin, markup_percent, active)
SELECT 'hotel', id, '{"city":"*"}', 4.00, 0.10, TRUE 
FROM ai.suppliers WHERE code='HOTELBEDS'
ON CONFLICT DO NOTHING;

-- Sample promo codes
INSERT INTO ai.promos(code, promo_type, discount_value, max_total_discount_pct, active) VALUES
('SAVE10', 'percentage', 10.00, 0.25, true),
('SAVE20', 'percentage', 20.00, 0.25, true),
('FLAT50', 'flat', 50.00, 0.25, true),
('GOLD25', 'percentage', 25.00, 0.30, true),
('WELCOME', 'percentage', 15.00, 0.25, true)
ON CONFLICT (code) DO NOTHING;

-- Sample perks
INSERT INTO ai.perk_catalog(perk_name, perk_type, product_types, cost_usd, active) VALUES
('Late checkout', 'amenity', '{hotel}', 0, true),
('Free breakfast', 'amenity', '{hotel}', 0, true),
('Priority boarding', 'service', '{flight}', 0, true),
('Extra legroom', 'upgrade', '{flight}', 25, true),
('Lounge access', 'service', '{flight}', 45, true)
ON CONFLICT DO NOTHING;

-- Sample model registry
INSERT INTO ai.model_registry(model_name, model_version, model_type, model_config, active) VALUES
('propensity_model', 'v2.1.0', 'propensity', '{"features": 17, "accuracy": 0.87}', true),
('pricing_model', 'v1.8.2', 'pricing', '{"features": 12, "mse": 0.043}', true)
ON CONFLICT (model_name, model_version) DO NOTHING;

-- =====================================================
-- 6. REFRESH MATERIALIZED VIEWS
-- =====================================================

REFRESH MATERIALIZED VIEW ai.mv_daily_agg;
REFRESH MATERIALIZED VIEW ai.mv_airline_route_daily;
REFRESH MATERIALIZED VIEW ai.mv_hotel_city_daily;
REFRESH MATERIALIZED VIEW ai.mv_user_segments;
REFRESH MATERIALIZED VIEW ai.mv_promo_effectiveness;

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

-- Check all tables exist
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'ai' 
ORDER BY tablename;

-- Check all materialized views exist
SELECT schemaname, matviewname 
FROM pg_matviews 
WHERE schemaname = 'ai' 
ORDER BY matviewname;

-- Check indexes created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'ai' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check seed data
SELECT 'suppliers' as table_name, COUNT(*) as count FROM ai.suppliers
UNION ALL
SELECT 'policies', COUNT(*) FROM ai.policies
UNION ALL
SELECT 'markup_rules', COUNT(*) FROM ai.markup_rules
UNION ALL
SELECT 'promos', COUNT(*) FROM ai.promos
UNION ALL
SELECT 'perk_catalog', COUNT(*) FROM ai.perk_catalog
UNION ALL
SELECT 'model_registry', COUNT(*) FROM ai.model_registry;

-- Check never-loss function
SELECT ai.assert_never_loss('test_session', 100.00) as never_loss_test;
