-- =====================================================
-- TRANSFER MARKUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transfer_markups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    origin_city VARCHAR(100) NOT NULL, -- e.g., 'Dubai Airport'
    destination_city VARCHAR(100) NOT NULL, -- e.g., 'Dubai Marina'
    transfer_type VARCHAR(50) DEFAULT 'ALL', -- 'Private', 'Shared', 'Luxury', 'Economy', 'ALL'
    vehicle_type VARCHAR(50) DEFAULT 'ALL', -- 'Sedan', 'SUV', 'Van', 'Bus', 'ALL'
    markup_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
    markup_value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Current Fare Range (for dynamic pricing display)
    current_fare_min DECIMAL(5,2) DEFAULT 0, -- Min markup percentage for user-visible rates
    current_fare_max DECIMAL(5,2) DEFAULT 0, -- Max markup percentage for user-visible rates
    
    -- Bargain Fare Range (for user-entered price validation)
    bargain_fare_min DECIMAL(5,2) DEFAULT 0, -- Min acceptable bargain percentage
    bargain_fare_max DECIMAL(5,2) DEFAULT 0, -- Max acceptable bargain percentage
    
    -- Validity
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 year',
    
    -- Status and Priority
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'expired'
    priority INTEGER DEFAULT 1,
    user_type VARCHAR(20) DEFAULT 'all', -- 'all', 'b2c', 'b2b'
    
    -- Special conditions
    special_conditions TEXT,
    
    -- Audit fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER -- Admin user ID
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_transfer_markups_active ON transfer_markups(origin_city, destination_city, transfer_type, is_active);
CREATE INDEX IF NOT EXISTS idx_transfer_markups_status ON transfer_markups(status, valid_from, valid_to);

-- Insert default transfer markups
INSERT INTO transfer_markups (
    name, description, origin_city, destination_city, transfer_type, 
    vehicle_type, markup_value, current_fare_min, current_fare_max, 
    bargain_fare_min, bargain_fare_max
) VALUES
('Dubai Airport to Marina', 'Airport transfers to Dubai Marina area', 'Dubai Airport', 'Dubai Marina', 'ALL', 'ALL', 20.0, 15.0, 25.0, 10.0, 20.0),
('Dubai Airport to Downtown', 'Airport transfers to Downtown Dubai', 'Dubai Airport', 'Downtown Dubai', 'ALL', 'ALL', 18.0, 12.0, 22.0, 8.0, 18.0),
('Dubai Airport to JBR', 'Airport transfers to Jumeirah Beach Residence', 'Dubai Airport', 'JBR', 'ALL', 'ALL', 22.0, 18.0, 28.0, 12.0, 22.0),
('Mumbai Airport to Bandra', 'Airport transfers to Bandra area', 'Mumbai Airport', 'Bandra', 'ALL', 'ALL', 25.0, 20.0, 30.0, 15.0, 25.0),
('Mumbai Airport to Andheri', 'Airport transfers to Andheri area', 'Mumbai Airport', 'Andheri', 'ALL', 'ALL', 20.0, 15.0, 25.0, 10.0, 20.0),
('Default Transfer Rule', 'Default markup for all other transfers', 'ALL', 'ALL', 'ALL', 'ALL', 20.0, 15.0, 25.0, 10.0, 20.0)
ON CONFLICT DO NOTHING;

-- Create trigger for updating updated_at
CREATE TRIGGER update_transfer_markups_updated_at 
    BEFORE UPDATE ON transfer_markups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRANSFER SEARCHES CACHE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transfer_searches_cache (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME,
    passengers INTEGER DEFAULT 1,
    transfer_type VARCHAR(50),
    vehicle_type VARCHAR(50),
    search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results_count INTEGER DEFAULT 0,
    cached_results JSONB, -- Store the actual transfer results
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '2 hours'
);

-- Index for performance and cleanup
CREATE INDEX IF NOT EXISTS idx_transfer_cache_search ON transfer_searches_cache(origin, destination, pickup_date);
CREATE INDEX IF NOT EXISTS idx_transfer_cache_expiry ON transfer_searches_cache(expires_at);

-- Update the cleanup function to include transfer cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM flight_searches_cache WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM hotel_searches_cache WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM sightseeing_searches_cache WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM transfer_searches_cache WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Log cleanup
    RAISE NOTICE 'Cache cleanup completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Update the search analytics view to include transfers
CREATE OR REPLACE VIEW search_analytics AS
SELECT 
    'flights' as search_type,
    COUNT(*) as total_searches,
    AVG(results_count) as avg_results_per_search,
    COUNT(DISTINCT origin || '-' || destination) as unique_routes,
    DATE_TRUNC('day', search_date) as search_day
FROM flight_searches_cache
GROUP BY DATE_TRUNC('day', search_date)

UNION ALL

SELECT 
    'hotels' as search_type,
    COUNT(*) as total_searches,
    AVG(results_count) as avg_results_per_search,
    COUNT(DISTINCT destination) as unique_routes,
    DATE_TRUNC('day', search_date) as search_day
FROM hotel_searches_cache
GROUP BY DATE_TRUNC('day', search_date)

UNION ALL

SELECT 
    'sightseeing' as search_type,
    COUNT(*) as total_searches,
    AVG(results_count) as avg_results_per_search,
    COUNT(DISTINCT destination) as unique_routes,
    DATE_TRUNC('day', search_date) as search_day
FROM sightseeing_searches_cache
GROUP BY DATE_TRUNC('day', search_date)

UNION ALL

SELECT 
    'transfers' as search_type,
    COUNT(*) as total_searches,
    AVG(results_count) as avg_results_per_search,
    COUNT(DISTINCT origin || '-' || destination) as unique_routes,
    DATE_TRUNC('day', search_date) as search_day
FROM transfer_searches_cache
GROUP BY DATE_TRUNC('day', search_date)

ORDER BY search_day DESC, search_type;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Transfer Markup Management schema created successfully!' as status;
