-- =====================================================
-- FIX MISSING AI TABLES - Render PostgreSQL
-- Creates only the missing tables (bargain_sessions and bargain_events already exist)
-- =====================================================

-- Create missing core tables (in dependency order)

-- 1. Suppliers table (no dependencies)
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

-- 2. Policies table (no dependencies)
CREATE TABLE IF NOT EXISTS ai.policies (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    policy_dsl TEXT NOT NULL,
    conditions JSONB,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP
);

-- 3. Model registry table (no dependencies)
CREATE TABLE IF NOT EXISTS ai.model_registry (
    id SERIAL PRIMARY KEY,
    model_type VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_config JSONB,
    endpoint_url TEXT,
    is_active BOOLEAN DEFAULT false,
    performance_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP
);

-- 4. Supplier rates table (depends on suppliers - but we'll make it flexible)
CREATE TABLE IF NOT EXISTS ai.supplier_rates (
    id SERIAL PRIMARY KEY,
    supplier_id VARCHAR(50) NOT NULL,
    canonical_key VARCHAR(500) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    rate_data JSONB NOT NULL,
    true_cost_usd DECIMAL(10,2) NOT NULL,
    markup_pct DECIMAL(5,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    snapshot_metadata JSONB
);

-- 5. Offerability cache table (no dependencies)
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

-- 6. Policy evaluations log (depends on policies and bargain_sessions)
CREATE TABLE IF NOT EXISTS ai.policy_evaluations (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES ai.bargain_sessions(session_id),
    policy_id INTEGER REFERENCES ai.policies(id),
    evaluation_result BOOLEAN NOT NULL,
    evaluation_context JSONB,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Audit trail table (no dependencies)
CREATE TABLE IF NOT EXISTS ai.audit_trail (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    changes JSONB,
    user_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Feature flags table (no dependencies)
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

-- 9. Rate snapshots table (no dependencies)
CREATE TABLE IF NOT EXISTS ai.rate_snapshots (
    id SERIAL PRIMARY KEY,
    supplier_id VARCHAR(50) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    snapshot_data JSONB NOT NULL,
    snapshot_at TIMESTAMP DEFAULT NOW(),
    records_count INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'completed'
);

-- 10. User preferences table (no dependencies)
CREATE TABLE IF NOT EXISTS ai.user_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    bargain_style VARCHAR(20) DEFAULT 'balanced',
    max_rounds INTEGER DEFAULT 3,
    auto_accept_threshold_pct DECIMAL(5,2) DEFAULT 15.0,
    preferred_currencies VARCHAR(50) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. Rollback events table (no dependencies)
CREATE TABLE IF NOT EXISTS ai.rollback_events (
    id SERIAL PRIMARY KEY,
    triggered_at TIMESTAMP DEFAULT NOW(),
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    ai_traffic_before DECIMAL(3,2),
    ai_traffic_after DECIMAL(3,2),
    metadata JSONB
);

-- 12. Worker logs table (no dependencies)
CREATE TABLE IF NOT EXISTS ai.worker_logs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB
);

-- =====================================================
-- CREATE MATERIALIZED VIEWS
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
-- CREATE INDEXES
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
-- CREATE NEVER-LOSS FUNCTION
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
-- INSERT SEED DATA
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

-- Insert sample supplier rates
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

-- =====================================================
-- REFRESH MATERIALIZED VIEWS
-- =====================================================

REFRESH MATERIALIZED VIEW ai.supplier_rates_mv;
REFRESH MATERIALIZED VIEW ai.session_analytics_mv;
REFRESH MATERIALIZED VIEW ai.profit_margins_mv;

-- =====================================================
-- FINAL VALIDATION
-- =====================================================

-- Count total tables (should be 14+ now)
SELECT 'Total AI tables created:' as description, COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'ai';

-- Count materialized views (should be 3)
SELECT 'Total AI materialized views:' as description, COUNT(*) as count
FROM pg_matviews 
WHERE schemaname = 'ai';

-- Check seed data counts
SELECT 
  'Seed data loaded:' as description,
  (SELECT COUNT(*) FROM ai.suppliers) as suppliers,
  (SELECT COUNT(*) FROM ai.policies WHERE is_active = true) as active_policies,
  (SELECT COUNT(*) FROM ai.model_registry WHERE is_active = true) as active_models,
  (SELECT COUNT(*) FROM ai.supplier_rates) as sample_rates;
