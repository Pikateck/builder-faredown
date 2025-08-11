-- AI Bargaining Platform Database Schema
-- PostgreSQL implementation for Faredown AI Bargaining System
-- Implements all tables as specified in the build brief

-- Create schema for AI bargaining system
CREATE SCHEMA IF NOT EXISTS ai;

-- Set schema in search path
SET search_path TO ai, public;

-- 1) Suppliers & Policies
CREATE TABLE IF NOT EXISTS ai.suppliers (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,           -- e.g., AMADEUS, HOTELBEDS
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai.policies (
    version TEXT PRIMARY KEY,
    dsl_yaml TEXT NOT NULL,              -- policy DSL text
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Canonical Product Index (flights & hotels)
CREATE TABLE IF NOT EXISTS ai.products (
    canonical_key TEXT PRIMARY KEY,      -- e.g., "FL:AI-BOM-DXB-2025-09-10" or "HT:12345:ROOMA:RATE1"
    product_type TEXT NOT NULL CHECK (product_type IN ('flight','hotel','sightseeing')),
    attrs JSONB NOT NULL,                -- {airline, origin, dest, date, fare_basis} or {hotel_id, room_id, board, cancel_policy}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Supplier rate snapshots (true cost floor calculation)
CREATE TABLE IF NOT EXISTS ai.supplier_rate_snapshots (
    id BIGSERIAL PRIMARY KEY,
    canonical_key TEXT REFERENCES ai.products(canonical_key),
    supplier_id INT REFERENCES ai.suppliers(id),
    currency TEXT NOT NULL,
    net NUMERIC(12,2) NOT NULL,
    taxes NUMERIC(12,2) DEFAULT 0,
    fees NUMERIC(12,2) DEFAULT 0,
    fx_rate NUMERIC(12,6) DEFAULT 1,     -- to USD
    policy_flags JSONB DEFAULT '{}',
    inventory_state TEXT,                 -- e.g., 'AVAILABLE','ON_REQUEST'
    snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Markup rules (existing logic)
CREATE TABLE IF NOT EXISTS ai.markup_rules (
    id BIGSERIAL PRIMARY KEY,
    product_type TEXT NOT NULL,
    supplier_id INT REFERENCES ai.suppliers(id),
    scope JSONB NOT NULL,                -- {airline:'AI', origin:'BOM', dest:'DXB'} or {hotel_id,...}
    min_margin NUMERIC(12,2) NOT NULL,   -- absolute floor margin over true cost
    markup_percent NUMERIC(6,3),
    markup_flat NUMERIC(12,2),
    valid_from DATE,
    valid_to DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Promo codes
CREATE TABLE IF NOT EXISTS ai.promos (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('PERCENT','FLAT')),
    value NUMERIC(8,3) NOT NULL,
    conditions JSONB DEFAULT '{}',       -- supplier/product/tier/date rules
    budget_usd NUMERIC(12,2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai.promo_redemptions (
    id BIGSERIAL PRIMARY KEY,
    promo_id BIGINT REFERENCES ai.promos(id),
    session_id UUID,
    user_id TEXT,
    amount_usd NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) Perks (non-price sweeteners)
CREATE TABLE IF NOT EXISTS ai.perk_catalog (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,                  -- "Free breakfast", "Late checkout", "Seat selection"
    supplier_scope JSONB NOT NULL,       -- {product_type:'hotel', suppliers:[...]}
    eligibility_rules JSONB NOT NULL,    -- policy constraints
    cost_usd NUMERIC(12,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7) Sessions & Events (core learning logs)
CREATE TABLE IF NOT EXISTS ai.bargain_sessions (
    id UUID PRIMARY KEY,
    user_id TEXT,
    canonical_key TEXT REFERENCES ai.products(canonical_key),
    product_type TEXT NOT NULL,
    policy_version TEXT REFERENCES ai.policies(version),
    model_version TEXT NOT NULL,
    supplier_candidates JSONB NOT NULL,  -- top N snapshots we can use
    started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai.bargain_events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES ai.bargain_sessions(id),
    round SMALLINT NOT NULL,
    action TEXT NOT NULL,                -- 'COUNTER_PRICE','OFFER_PERK','HOLD','USER_OFFER'
    user_offer NUMERIC(12,2),
    counter_price NUMERIC(12,2),
    perk_id BIGINT REFERENCES ai.perk_catalog(id),
    supplier_id INT REFERENCES ai.suppliers(id),
    accept_prob NUMERIC(6,3),
    accepted BOOLEAN,
    revenue_usd NUMERIC(12,2),
    true_cost_usd NUMERIC(12,2),
    perk_cost_usd NUMERIC(12,2),
    context JSONB,                       -- features snapshot for this step
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8) Offer Capsules (audit + explainability)
CREATE TABLE IF NOT EXISTS ai.offer_capsules (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES ai.bargain_sessions(id),
    payload JSONB NOT NULL,              -- signed object with floors, policy/model hashes, explanation text, expiry
    signature TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9) Feature store (cold / warm features)
CREATE TABLE IF NOT EXISTS ai.user_profiles (
    user_id TEXT PRIMARY KEY,
    tier TEXT,
    rfm JSONB,                           -- recency/frequency/monetary
    style TEXT,                          -- 'cautious','persistent','generous' (derived)
    ltv_usd NUMERIC(12,2),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai.product_features (
    canonical_key TEXT PRIMARY KEY REFERENCES ai.products(canonical_key),
    demand_score NUMERIC(6,3),
    comp_pressure NUMERIC(6,3),
    avg_accept_depth NUMERIC(6,3),
    seasonality JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10) Model Registry & A/B
CREATE TABLE IF NOT EXISTS ai.model_registry (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                  -- 'propensity_v1', 'bandit_v1'
    version TEXT NOT NULL,
    artifact_uri TEXT NOT NULL,          -- e.g., s3/gs/supabase storage
    active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai.ab_tests (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    variants JSONB NOT NULL,             -- {control:0.5, v1:0.5}
    kpis JSONB NOT NULL,                 -- {profit:">=0", accept:">=0"}
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_snapshots_ckey_time ON ai.supplier_rate_snapshots(canonical_key, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON ai.bargain_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON ai.bargain_events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_action ON ai.bargain_events(action);
CREATE INDEX IF NOT EXISTS idx_sessions_ckey ON ai.bargain_sessions(canonical_key);
CREATE INDEX IF NOT EXISTS idx_products_airline ON ai.products ((attrs->>'airline'));
CREATE INDEX IF NOT EXISTS idx_products_origin ON ai.products ((attrs->>'origin'));
CREATE INDEX IF NOT EXISTS idx_products_dest ON ai.products ((attrs->>'dest'));
CREATE INDEX IF NOT EXISTS idx_products_city ON ai.products ((attrs->>'city'));
CREATE INDEX IF NOT EXISTS idx_products_type ON ai.products(product_type);
CREATE INDEX IF NOT EXISTS idx_markup_rules_type ON ai.markup_rules(product_type);
CREATE INDEX IF NOT EXISTS idx_promos_code ON ai.promos(code);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_session ON ai.promo_redemptions(session_id);

-- 11) Materialized views for reporting (refresh hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.mv_daily_agg AS
SELECT
    date_trunc('day', e.created_at) AS day,
    s.product_type,
    (s.supplier_candidates->0->>'supplier_id')::INT AS primary_supplier_id,
    COUNT(*) FILTER (WHERE e.action='USER_OFFER') AS user_offers,
    COUNT(*) FILTER (WHERE e.accepted IS TRUE) AS accepts,
    SUM(e.revenue_usd - e.true_cost_usd - COALESCE(e.perk_cost_usd,0)) AS profit_usd,
    AVG(e.counter_price) FILTER (WHERE e.counter_price IS NOT NULL) AS avg_counter_price
FROM ai.bargain_events e
JOIN ai.bargain_sessions s ON s.id = e.session_id
GROUP BY 1,2,3;

-- Airline / route lens
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.mv_airline_route_daily AS
SELECT
    date_trunc('day', e.created_at) AS day,
    (p.attrs->>'airline') AS airline,
    (p.attrs->>'origin')  AS origin,
    (p.attrs->>'dest')    AS dest,
    COUNT(*) FILTER (WHERE e.action='USER_OFFER') AS offers,
    COUNT(*) FILTER (WHERE e.accepted IS TRUE) AS accepts,
    AVG((e.counter_price - e.true_cost_usd)/NULLIF(e.true_cost_usd,0)) AS avg_markup_pct,
    SUM(e.revenue_usd - e.true_cost_usd - COALESCE(e.perk_cost_usd,0)) AS profit_usd
FROM ai.bargain_events e
JOIN ai.bargain_sessions s ON s.id = e.session_id
JOIN ai.products p ON p.canonical_key = s.canonical_key
WHERE s.product_type='flight'
GROUP BY 1,2,3,4;

-- Hotel / city lens
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.mv_hotel_city_daily AS
SELECT
    date_trunc('day', e.created_at) AS day,
    (p.attrs->>'city') AS city,
    (p.attrs->>'hotel_id') AS hotel_id,
    COUNT(*) FILTER (WHERE e.action='USER_OFFER') AS offers,
    COUNT(*) FILTER (WHERE e.accepted IS TRUE) AS accepts,
    SUM(e.revenue_usd - e.true_cost_usd - COALESCE(e.perk_cost_usd,0)) AS profit_usd
FROM ai.bargain_events e
JOIN ai.bargain_sessions s ON s.id = e.session_id
JOIN ai.products p ON p.canonical_key = s.canonical_key
WHERE s.product_type='hotel'
GROUP BY 1,2,3;

-- Create update triggers
CREATE OR REPLACE FUNCTION ai.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON ai.suppliers
    FOR EACH ROW EXECUTE FUNCTION ai.update_updated_at_column();

CREATE TRIGGER update_markup_rules_updated_at BEFORE UPDATE ON ai.markup_rules
    FOR EACH ROW EXECUTE FUNCTION ai.update_updated_at_column();

CREATE TRIGGER update_promos_updated_at BEFORE UPDATE ON ai.promos
    FOR EACH ROW EXECUTE FUNCTION ai.update_updated_at_column();

CREATE TRIGGER update_perk_catalog_updated_at BEFORE UPDATE ON ai.perk_catalog
    FOR EACH ROW EXECUTE FUNCTION ai.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON ai.bargain_sessions
    FOR EACH ROW EXECUTE FUNCTION ai.update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ai.ab_tests
    FOR EACH ROW EXECUTE FUNCTION ai.update_updated_at_column();

-- Comments for documentation
COMMENT ON SCHEMA ai IS 'AI Bargaining Platform - Isolated schema for all AI bargaining functionality';
COMMENT ON TABLE ai.suppliers IS 'Supplier registry for Amadeus, Hotelbeds, etc.';
COMMENT ON TABLE ai.products IS 'Canonical product index with standardized keys for flights, hotels, sightseeing';
COMMENT ON TABLE ai.supplier_rate_snapshots IS 'Cached supplier rates for fast decision making';
COMMENT ON TABLE ai.bargain_sessions IS 'User bargaining sessions with context and supplier candidates';
COMMENT ON TABLE ai.bargain_events IS 'All bargaining actions and decisions for learning and audit';
COMMENT ON TABLE ai.offer_capsules IS 'Signed offer capsules for security and audit trail';
COMMENT ON TABLE ai.user_profiles IS 'User behavioral profiles for personalized bargaining';
COMMENT ON TABLE ai.product_features IS 'Product-level features for demand scoring';
