-- Enhanced Suppliers Management Migration
-- Execute this on your PostgreSQL database to upgrade the suppliers table

-- =============================================================================
-- STEP 1: Enhanced Suppliers Table
-- =============================================================================

-- Drop existing suppliers table if it exists and create enhanced version
DROP TABLE IF EXISTS suppliers CASCADE;

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE, -- HOTELBEDS, AMADEUS, etc.
    type VARCHAR(20) NOT NULL CHECK (type IN ('hotel', 'flight', 'car', 'package')),
    status VARCHAR(20) DEFAULT 'testing' CHECK (status IN ('active', 'testing', 'disabled')),
    
    -- Environment configuration
    environment VARCHAR(20) DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    
    -- API Configuration (do NOT store secrets here)
    api_endpoint VARCHAR(500),
    content_api_endpoint VARCHAR(500),
    booking_api_endpoint VARCHAR(500),
    
    -- Credential profile reference (environment variables)
    credential_profile VARCHAR(100), -- References which env vars to use
    
    -- Performance metrics
    last_sync TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    booking_count INTEGER DEFAULT 0,
    average_response_time INTEGER DEFAULT 0, -- milliseconds
    
    -- Configuration
    timeout_ms INTEGER DEFAULT 30000,
    retry_attempts INTEGER DEFAULT 3,
    cache_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency VARCHAR(20) DEFAULT 'daily',
    
    -- Markup settings
    markup_percentage DECIMAL(5,2) DEFAULT 0.00,
    min_markup DECIMAL(5,2) DEFAULT 0.00,
    max_markup DECIMAL(5,2) DEFAULT 0.00,
    
    -- Supported features
    supported_currencies TEXT[] DEFAULT ARRAY['USD', 'EUR', 'INR'],
    supported_destinations TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- Status tracking
    is_active BOOLEAN DEFAULT true,
    last_health_check TIMESTAMP WITH TIME ZONE,
    health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown'))
);

-- =============================================================================
-- STEP 2: Supplier Sync Logs Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS supplier_sync_logs (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'content', 'availability', 'booking', 'test'
    
    -- Request details
    endpoint VARCHAR(500),
    request_id VARCHAR(100),
    destination_codes TEXT[],
    
    -- Response details  
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'partial', 'timeout')),
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Performance
    duration_ms INTEGER,
    response_time_ms INTEGER,
    
    -- Error handling
    error_code VARCHAR(50),
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    sync_triggered_by VARCHAR(100), -- 'manual', 'scheduled', 'webhook'
    sync_parameters JSONB,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 3: Supplier Analytics View
-- =============================================================================

CREATE OR REPLACE VIEW supplier_analytics AS
SELECT 
    s.id,
    s.name,
    s.code,
    s.type,
    s.status,
    s.environment,
    s.success_rate,
    s.booking_count,
    s.average_response_time,
    s.last_sync,
    s.health_status,
    
    -- Recent sync stats (last 30 days)
    COUNT(ssl.id) FILTER (WHERE ssl.created_at >= CURRENT_DATE - INTERVAL '30 days') as syncs_last_30_days,
    COUNT(ssl.id) FILTER (WHERE ssl.status = 'success' AND ssl.created_at >= CURRENT_DATE - INTERVAL '30 days') as successful_syncs_30_days,
    COUNT(ssl.id) FILTER (WHERE ssl.status = 'failed' AND ssl.created_at >= CURRENT_DATE - INTERVAL '30 days') as failed_syncs_30_days,
    
    -- Average performance (last 30 days)
    AVG(ssl.duration_ms) FILTER (WHERE ssl.created_at >= CURRENT_DATE - INTERVAL '30 days') as avg_sync_duration_ms,
    AVG(ssl.response_time_ms) FILTER (WHERE ssl.created_at >= CURRENT_DATE - INTERVAL '30 days') as avg_response_time_ms,
    
    -- Last sync details
    MAX(ssl.created_at) as last_sync_attempt,
    (SELECT status FROM supplier_sync_logs WHERE supplier_id = s.id ORDER BY created_at DESC LIMIT 1) as last_sync_status

FROM suppliers s
LEFT JOIN supplier_sync_logs ssl ON s.id = ssl.supplier_id
GROUP BY s.id, s.name, s.code, s.type, s.status, s.environment, s.success_rate, 
         s.booking_count, s.average_response_time, s.last_sync, s.health_status;

-- =============================================================================
-- STEP 4: Create Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(type);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_environment ON suppliers(environment);
CREATE INDEX IF NOT EXISTS idx_suppliers_last_sync ON suppliers(last_sync);

CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_supplier_id ON supplier_sync_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_status ON supplier_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_created_at ON supplier_sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_supplier_sync_logs_sync_type ON supplier_sync_logs(sync_type);

-- =============================================================================
-- STEP 5: Create Triggers
-- =============================================================================

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: Seed Initial Suppliers
-- =============================================================================

INSERT INTO suppliers (
    name, 
    code, 
    type, 
    status, 
    environment,
    api_endpoint,
    content_api_endpoint,
    booking_api_endpoint,
    credential_profile,
    markup_percentage,
    min_markup,
    max_markup,
    supported_currencies,
    supported_destinations,
    timeout_ms,
    retry_attempts,
    created_by
) VALUES 
(
    'Hotelbeds',
    'HOTELBEDS',
    'hotel',
    'testing',
    'sandbox',
    'https://api.test.hotelbeds.com',
    'https://api.test.hotelbeds.com/hotel-content-api/1.0',
    'https://api.test.hotelbeds.com/hotel-api/1.0',
    'hotelbeds_sandbox', -- References HOTELBEDS_API_KEY, HOTELBEDS_API_SECRET env vars
    15.00,
    8.00,
    25.00,
    ARRAY['EUR', 'USD', 'GBP', 'INR'],
    ARRAY['DXB', 'BOM', 'DEL', 'BCN', 'LON', 'PAR', 'SYD'],
    30000,
    3,
    'system_seed'
),
(
    'Amadeus',
    'AMADEUS', 
    'flight',
    'testing',
    'sandbox',
    'https://test.api.amadeus.com',
    NULL,
    'https://test.api.amadeus.com/v2/shopping/flight-offers',
    'amadeus_sandbox', -- References AMADEUS_API_KEY, AMADEUS_API_SECRET env vars
    8.00,
    5.00,
    15.00,
    ARRAY['USD', 'EUR', 'INR', 'GBP'],
    ARRAY['BOM', 'DXB', 'DEL', 'LON', 'NYC', 'LAX', 'SIN'],
    45000,
    2,
    'system_seed'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    environment = EXCLUDED.environment,
    api_endpoint = EXCLUDED.api_endpoint,
    content_api_endpoint = EXCLUDED.content_api_endpoint,
    booking_api_endpoint = EXCLUDED.booking_api_endpoint,
    credential_profile = EXCLUDED.credential_profile,
    markup_percentage = EXCLUDED.markup_percentage,
    min_markup = EXCLUDED.min_markup,
    max_markup = EXCLUDED.max_markup,
    supported_currencies = EXCLUDED.supported_currencies,
    supported_destinations = EXCLUDED.supported_destinations,
    timeout_ms = EXCLUDED.timeout_ms,
    retry_attempts = EXCLUDED.retry_attempts,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'system_seed';

-- =============================================================================
-- STEP 7: Insert Sample Sync Logs for Testing
-- =============================================================================

INSERT INTO supplier_sync_logs (
    supplier_id,
    sync_type,
    endpoint,
    request_id,
    destination_codes,
    status,
    records_processed,
    records_updated,
    duration_ms,
    response_time_ms,
    sync_triggered_by
) VALUES 
(
    (SELECT id FROM suppliers WHERE code = 'HOTELBEDS'),
    'content',
    '/hotel-content-api/1.0/hotels',
    'test-' || extract(epoch from now())::text,
    ARRAY['DXB', 'BOM'],
    'success',
    1247,
    1190,
    45000,
    850,
    'scheduled'
),
(
    (SELECT id FROM suppliers WHERE code = 'AMADEUS'),
    'test',
    '/v2/shopping/flight-offers',
    'test-' || extract(epoch from now())::text,
    ARRAY['BOM', 'DXB'],
    'success',
    15,
    15,
    2500,
    1200,
    'manual'
),
(
    (SELECT id FROM suppliers WHERE code = 'HOTELBEDS'),
    'availability',
    '/hotel-api/1.0/hotels',
    'test-' || extract(epoch from now())::text,
    ARRAY['BCN'],
    'partial',
    980,
    965,
    38000,
    950,
    'scheduled'
);

-- =============================================================================
-- STEP 8: Create Functions for Supplier Management
-- =============================================================================

-- Function to update supplier performance metrics
CREATE OR REPLACE FUNCTION update_supplier_performance(
    p_supplier_id INTEGER,
    p_success BOOLEAN,
    p_response_time_ms INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    current_success_rate DECIMAL(5,2);
    current_booking_count INTEGER;
    current_avg_response_time INTEGER;
BEGIN
    -- Get current metrics
    SELECT success_rate, booking_count, average_response_time 
    INTO current_success_rate, current_booking_count, current_avg_response_time
    FROM suppliers WHERE id = p_supplier_id;
    
    -- Update booking count
    current_booking_count := COALESCE(current_booking_count, 0) + 1;
    
    -- Calculate new success rate (simple moving average for last 100 bookings)
    IF p_success THEN
        current_success_rate := LEAST(100.0, COALESCE(current_success_rate, 0) + (100.0 / LEAST(current_booking_count, 100)));
    ELSE
        current_success_rate := GREATEST(0.0, COALESCE(current_success_rate, 0) - (100.0 / LEAST(current_booking_count, 100)));
    END IF;
    
    -- Update average response time if provided
    IF p_response_time_ms IS NOT NULL THEN
        current_avg_response_time := (COALESCE(current_avg_response_time, 0) + p_response_time_ms) / 2;
    END IF;
    
    -- Update supplier record
    UPDATE suppliers 
    SET 
        success_rate = current_success_rate,
        booking_count = current_booking_count,
        average_response_time = COALESCE(current_avg_response_time, average_response_time),
        last_sync = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_supplier_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get supplier health status
CREATE OR REPLACE FUNCTION get_supplier_health_summary()
RETURNS TABLE (
    total_suppliers INTEGER,
    active_suppliers INTEGER,
    testing_suppliers INTEGER,
    disabled_suppliers INTEGER,
    healthy_suppliers INTEGER,
    degraded_suppliers INTEGER,
    down_suppliers INTEGER,
    avg_success_rate DECIMAL(5,2),
    avg_response_time INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_suppliers,
        COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_suppliers,
        COUNT(*) FILTER (WHERE status = 'testing')::INTEGER as testing_suppliers,
        COUNT(*) FILTER (WHERE status = 'disabled')::INTEGER as disabled_suppliers,
        COUNT(*) FILTER (WHERE health_status = 'healthy')::INTEGER as healthy_suppliers,
        COUNT(*) FILTER (WHERE health_status = 'degraded')::INTEGER as degraded_suppliers,
        COUNT(*) FILTER (WHERE health_status = 'down')::INTEGER as down_suppliers,
        AVG(success_rate) as avg_success_rate,
        AVG(average_response_time)::INTEGER as avg_response_time
    FROM suppliers 
    WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DATABASE MIGRATION COMPLETE
-- =============================================================================

-- Add comments
COMMENT ON TABLE suppliers IS 'Enhanced supplier management with performance tracking and secure credential handling';
COMMENT ON TABLE supplier_sync_logs IS 'Detailed logging of all supplier API calls and sync operations';
COMMENT ON VIEW supplier_analytics IS 'Analytics view combining supplier data with performance metrics';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON suppliers TO faredown_admin;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON supplier_sync_logs TO faredown_admin;
-- GRANT SELECT ON supplier_analytics TO faredown_admin;
