-- =====================================================
-- AI BARGAINING PLATFORM - COMPLETE RENDER MIGRATION
-- Run this entire script in Render PostgreSQL console
-- Database: faredown_booking_db
-- =====================================================

-- Create AI namespace if not exists
CREATE SCHEMA IF NOT EXISTS ai;

-- =====================================================
-- 1. CORE TABLES (must exist for validation)
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
    policy_dsl TEXT NOT NULL,
    conditions JSONB,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP
);

-- Model registry table
CREATE TABLE IF NOT EXISTS ai.model_registry (
    id SERIAL PRIMARY KEY,
    model_type VARCHAR(50) NOT NULL, -- 'pricing', 'offerability', 'recommendation'
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_config JSONB,
    endpoint_url TEXT,
    is_active BOOLEAN DEFAULT false,
    performance_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP
);

-- Supplier rates (live rate snapshots)
CREATE TABLE IF NOT EXISTS ai.supplier_rates (
    id SERIAL PRIMARY KEY,
    supplier_id VARCHAR(50) NOT NULL,
    canonical_key VARCHAR(500) NOT NULL, -- CPO canonical key
    product_type VARCHAR(50) NOT NULL, -- 'flight', 'hotel', 'sightseeing'
    rate_data JSONB NOT NULL,
    true_cost_usd DECIMAL(10,2) NOT NULL,
    markup_pct DECIMAL(5,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    snapshot_metadata JSONB
);

-- Bargain sessions
CREATE TABLE IF NOT EXISTS ai.bargain_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    product_cpo JSONB NOT NULL, -- Complete Product Object
    displayed_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    true_cost_usd DECIMAL(10,2) NOT NULL,
    supplier_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'expired', 'cancelled'
    final_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Bargain events (offer/counter-offer history)
CREATE TABLE IF NOT EXISTS ai.bargain_events (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES ai.bargain_sessions(session_id),
    event_type VARCHAR(20) NOT NULL, -- 'offer', 'counter', 'accept', 'reject'
    user_offer DECIMAL(10,2),
    counter_price DECIMAL(10,2),
    model_confidence DECIMAL(5,4),
    true_cost_usd DECIMAL(10,2) NOT NULL,
    reasoning TEXT,
    model_version VARCHAR(50),
    accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP
);

-- Offerability cache
CREATE TABLE IF NOT EXISTS ai.offerability_cache (
    id SERIAL PRIMARY KEY,
    canonical_key VARCHAR(500) NOT NULL,
    user_context JSONB,
    is_offerable BOOLEAN NOT NULL,
    reason TEXT,
    policy_evaluations JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Policy evaluations log
CREATE TABLE IF NOT EXISTS ai.policy_evaluations (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES ai.bargain_sessions(session_id),
    policy_id INTEGER REFERENCES ai.policies(id),
    evaluation_result BOOLEAN NOT NULL,
    evaluation_context JSONB,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit trail
CREATE TABLE IF NOT EXISTS ai.audit_trail (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'session', 'policy', 'model', 'rate'
    entity_id VARCHAR(100) NOT NULL,
    changes JSONB,
    user_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Feature flags
CREATE TABLE IF NOT EXISTS ai.feature_flags (
    id SERIAL PRIMARY KEY,
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    flag_value JSONB NOT NULL,
    environment VARCHAR(50) DEFAULT 'production',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Rate snapshots (for supplier fabric worker)
CREATE TABLE IF NOT EXISTS ai.rate_snapshots (
    id SERIAL PRIMARY KEY,
    supplier_id VARCHAR(50) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    snapshot_data JSONB NOT NULL,
    snapshot_at TIMESTAMP DEFAULT NOW(),
    records_count INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'completed' -- 'processing', 'completed', 'failed'
);

-- User preferences for bargaining
CREATE TABLE IF NOT EXISTS ai.user_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    bargain_style VARCHAR(20) DEFAULT 'balanced', -- 'aggressive', 'balanced', 'conservative'
    max_rounds INTEGER DEFAULT 3,
    auto_accept_threshold_pct DECIMAL(5,2) DEFAULT 15.0,
    preferred_currencies VARCHAR(50) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Rollback events
CREATE TABLE IF NOT EXISTS ai.rollback_events (
    id SERIAL PRIMARY KEY,
    triggered_at TIMESTAMP DEFAULT NOW(),
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED', 'VERIFICATION_FAILED'
    ai_traffic_before DECIMAL(3,2),
    ai_traffic_after DECIMAL(3,2),
    metadata JSONB
);

-- Worker logs
CREATE TABLE IF NOT EXISTS ai.worker_logs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'running'
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB
);

-- =====================================================
-- 2. MATERIALIZED VIEWS (for performance)
-- =====================================================

-- Supplier rates materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.supplier_rates_mv AS
SELECT 
    supplier_id,
    product_type,
    COUNT(*) as rate_count,
    AVG(true_cost_usd) as avg_cost,
    MIN(updated_at) as oldest_rate,
    MAX(updated_at) as newest_rate,
    COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 hour') as fresh_rates
FROM ai.supplier_rates 
WHERE valid_until IS NULL OR valid_until > NOW()
GROUP BY supplier_id, product_type;

-- Session analytics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.session_analytics_mv AS
SELECT 
    DATE(created_at) as session_date,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
    AVG(final_price) FILTER (WHERE status = 'completed') as avg_final_price,
    AVG(displayed_price) as avg_displayed_price,
    COUNT(DISTINCT user_id) as unique_users
FROM ai.bargain_sessions 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);

-- Profit margins materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS ai.profit_margins_mv AS
SELECT 
    DATE(bs.created_at) as date,
    bs.supplier_id,
    COUNT(*) as transactions,
    AVG(bs.final_price - bs.true_cost_usd) as avg_profit_usd,
    AVG((bs.final_price - bs.true_cost_usd) / bs.final_price * 100) as avg_margin_pct,
    SUM(bs.final_price - bs.true_cost_usd) as total_profit_usd
FROM ai.bargain_sessions bs
WHERE bs.status = 'completed' 
  AND bs.final_price IS NOT NULL
  AND bs.created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(bs.created_at), bs.supplier_id;

-- =====================================================
-- 3. INDEXES (for performance)
-- =====================================================

-- Critical performance indexes
CREATE INDEX IF NOT EXISTS idx_supplier_rates_canonical_key ON ai.supplier_rates(canonical_key);
CREATE INDEX IF NOT EXISTS idx_supplier_rates_updated_at ON ai.supplier_rates(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_rates_supplier_type ON ai.supplier_rates(supplier_id, product_type);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_user_id ON ai.bargain_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_created_at ON ai.bargain_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bargain_events_session_id ON ai.bargain_events(session_id);
CREATE INDEX IF NOT EXISTS idx_bargain_events_created_at ON ai.bargain_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offerability_cache_canonical_key ON ai.offerability_cache(canonical_key);
CREATE INDEX IF NOT EXISTS idx_offerability_cache_expires_at ON ai.offerability_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON ai.audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON ai.audit_trail(created_at DESC);

-- =====================================================
-- 4. NEVER-LOSS ENFORCEMENT FUNCTION (Critical)
-- =====================================================

CREATE OR REPLACE FUNCTION ai.assert_never_loss(
    p_session_id UUID,
    p_final_price DECIMAL(10,2)
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_true_cost DECIMAL(10,2);
    v_min_acceptable DECIMAL(10,2);
BEGIN
    -- Get true cost for session
    SELECT true_cost_usd INTO v_true_cost
    FROM ai.bargain_sessions
    WHERE session_id = p_session_id;
    
    IF v_true_cost IS NULL THEN
        RAISE EXCEPTION 'Session not found: %', p_session_id;
    END IF;
    
    -- Calculate minimum acceptable price (cost + 2% margin)
    v_min_acceptable := v_true_cost * 1.02;
    
    -- Enforce never-loss rule
    IF p_final_price < v_min_acceptable THEN
        RAISE EXCEPTION 'NEVER_LOSS_VIOLATION: Final price %.2f below minimum %.2f (cost: %.2f)', 
            p_final_price, v_min_acceptable, v_true_cost;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- =====================================================
-- 5. SEED DATA (Essential for validation)
-- =====================================================

-- Insert suppliers
INSERT INTO ai.suppliers (code, name, api_endpoint, active) VALUES
('amadeus', 'Amadeus GDS', 'https://api.amadeus.com/v2', true),
('hotelbeds', 'Hotelbeds API', 'https://api.test.hotelbeds.com/activity-content-api', true),
('sabre', 'Sabre GDS', 'https://api.sabre.com/v2', true)
ON CONFLICT (code) DO NOTHING;

-- Insert policies
INSERT INTO ai.policies (version, policy_dsl, conditions, is_active, activated_at) VALUES
('v1.0', 'user_tier in ["GOLD", "PLATINUM"] and displayed_price > 100', 
 '{"min_price": 100, "allowed_tiers": ["GOLD", "PLATINUM"]}', true, NOW()),
('v1.1', 'product_type == "flight" and currency == "USD"', 
 '{"product_types": ["flight"], "currencies": ["USD"]}', true, NOW()),
('v1.2', 'user_tier != "BRONZE" or displayed_price < 500', 
 '{"max_price_bronze": 500}', true, NOW())
ON CONFLICT (version) DO NOTHING;

-- Insert model registry
INSERT INTO ai.model_registry (model_type, model_name, version, is_active, activated_at, model_config) VALUES
('pricing', 'faredown-pricing-v1', '1.0.0', true, NOW(), 
 '{"algorithm": "gradient_boost", "features": ["user_tier", "price", "demand"], "accuracy": 0.87}'),
('offerability', 'faredown-eligibility-v1', '1.0.0', true, NOW(),
 '{"algorithm": "rule_engine", "policies": 3, "cache_ttl": 300}')
ON CONFLICT (model_type, model_name) DO NOTHING;

-- Insert feature flags
INSERT INTO ai.feature_flags (flag_name, flag_value, description, is_active) VALUES
('AI_TRAFFIC', '0.0', 'Percentage of traffic to AI bargaining engine', true),
('AI_SHADOW', 'true', 'Enable shadow mode for AI predictions', true),
('PROFIT_GUARD_ENABLED', 'true', 'Enable profit margin protection', true),
('AI_AUTO_SCALE', 'false', 'Enable auto-scaling for AI components', true)
ON CONFLICT (flag_name) DO NOTHING;

-- Insert sample supplier rates (for validation)
INSERT INTO ai.supplier_rates (supplier_id, canonical_key, product_type, rate_data, true_cost_usd, updated_at) VALUES
('amadeus', 'FL:AI-BOM-DXB-2025-10-01-Y', 'flight', 
 '{"departure": "BOM", "arrival": "DXB", "date": "2025-10-01", "class": "Y", "price": 312}', 
 280.50, NOW()),
('hotelbeds', 'HT:12345:DLX:BRD-BB:CXL-FLEX', 'hotel',
 '{"hotel_id": 12345, "room_type": "DLX", "board": "BB", "cancellation": "FLEX", "price": 142}',
 127.80, NOW()),
('hotelbeds', 'SS:DUBAI-TOUR-PREMIUM', 'sightseeing',
 '{"activity_id": "DUBAI-TOUR", "type": "PREMIUM", "duration": "4h", "price": 89}',
 75.65, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample bargain session (for validation)
INSERT INTO ai.bargain_sessions (session_id, user_id, product_cpo, displayed_price, true_cost_usd, supplier_id, status) VALUES
(gen_random_uuid(), 'validation-user-1', 
 '{"type": "hotel", "canonical_key": "HT:12345:DLX:BRD-BB:CXL-FLEX", "displayed_price": 142}',
 142.00, 127.80, 'hotelbeds', 'active')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. REFRESH MATERIALIZED VIEWS
-- =====================================================

REFRESH MATERIALIZED VIEW ai.supplier_rates_mv;
REFRESH MATERIALIZED VIEW ai.session_analytics_mv;
REFRESH MATERIALIZED VIEW ai.profit_margins_mv;

-- =====================================================
-- 7. VALIDATION QUERIES (run these to verify)
-- =====================================================

-- Count tables created
SELECT COUNT(*) as ai_tables_count 
FROM information_schema.tables 
WHERE table_schema = 'ai';

-- Count materialized views
SELECT COUNT(*) as ai_mv_count 
FROM pg_matviews 
WHERE schemaname = 'ai';

-- Check never-loss function exists
SELECT EXISTS(
  SELECT 1 FROM pg_proc p 
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'ai' AND p.proname = 'assert_never_loss'
) as never_loss_function_exists;

-- Check sample data
SELECT 
  (SELECT COUNT(*) FROM ai.suppliers) as suppliers_count,
  (SELECT COUNT(*) FROM ai.policies WHERE is_active = true) as active_policies,
  (SELECT COUNT(*) FROM ai.model_registry WHERE is_active = true) as active_models,
  (SELECT COUNT(*) FROM ai.supplier_rates) as sample_rates;

-- =====================================================
-- MIGRATION COMPLETE
-- Expected results:
-- - ai_tables_count: 15+ tables
-- - ai_mv_count: 3+ materialized views  
-- - never_loss_function_exists: true
-- - suppliers_count: 3+, active_policies: 3+, active_models: 2+, sample_rates: 3+
-- =====================================================
