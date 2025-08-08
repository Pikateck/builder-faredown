-- =====================================================
-- MARKUP MANAGEMENT AND PROMO CODE SYSTEM SCHEMA
-- Integrated with Flight, Hotel, and Sightseeing APIs
-- =====================================================

-- =====================================================
-- AIRLINE MARKUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS airline_markups (
    id SERIAL PRIMARY KEY,
    airline_code VARCHAR(3) NOT NULL,
    airline_name VARCHAR(255),
    route VARCHAR(100) DEFAULT 'ALL', -- e.g., 'BOM-DXB' or 'ALL'
    cabin_class VARCHAR(20) DEFAULT 'ECONOMY', -- ECONOMY, BUSINESS, FIRST, PREMIUM_ECONOMY
    markup_percentage DECIMAL(5,2) DEFAULT 15.0,
    markup_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
    base_markup DECIMAL(10,2) DEFAULT 0, -- Fixed amount if markup_type is 'fixed'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- Admin user ID
    
    UNIQUE(airline_code, route, cabin_class)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_airline_markups_active ON airline_markups(airline_code, route, cabin_class, is_active);

-- =====================================================
-- HOTEL MARKUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS hotel_markups (
    id SERIAL PRIMARY KEY,
    destination_code VARCHAR(10) NOT NULL, -- e.g., 'DXB', 'BOM' or 'ALL'
    destination_name VARCHAR(255),
    star_rating INTEGER DEFAULT 0, -- 0 = ALL, 1-5 = specific star rating
    markup_percentage DECIMAL(5,2) DEFAULT 20.0,
    markup_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
    base_markup DECIMAL(10,2) DEFAULT 0, -- Fixed amount if markup_type is 'fixed'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- Admin user ID
    
    UNIQUE(destination_code, star_rating)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_hotel_markups_active ON hotel_markups(destination_code, star_rating, is_active);

-- =====================================================
-- SIGHTSEEING MARKUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sightseeing_markups (
    id SERIAL PRIMARY KEY,
    destination_code VARCHAR(10) NOT NULL, -- e.g., 'DXB', 'BOM' or 'ALL'
    destination_name VARCHAR(255),
    category VARCHAR(50) DEFAULT 'ALL', -- TOURS, MUSEUMS, ATTRACTIONS, etc.
    markup_percentage DECIMAL(5,2) DEFAULT 25.0,
    markup_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
    base_markup DECIMAL(10,2) DEFAULT 0, -- Fixed amount if markup_type is 'fixed'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- Admin user ID
    
    UNIQUE(destination_code, category)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sightseeing_markups_active ON sightseeing_markups(destination_code, category, is_active);

-- =====================================================
-- PROMO CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount DECIMAL(10,2), -- Maximum discount amount for percentage discounts
    min_order_value DECIMAL(10,2), -- Minimum order value to apply discount
    applicable_to VARCHAR(20) DEFAULT 'all', -- 'flights', 'hotels', 'sightseeing', 'all'
    usage_limit INTEGER, -- NULL = unlimited
    usage_count INTEGER DEFAULT 0,
    user_specific BOOLEAN DEFAULT false, -- If true, only specific users can use this
    allowed_users TEXT[], -- Array of user IDs if user_specific is true
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP,
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER -- Admin user ID
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(code, is_active, expiry_date);
CREATE INDEX IF NOT EXISTS idx_promo_codes_applicable ON promo_codes(applicable_to, is_active);

-- =====================================================
-- PROMO CODE USAGE TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id SERIAL PRIMARY KEY,
    promo_code_id INTEGER REFERENCES promo_codes(id),
    user_id INTEGER, -- User who used the promo code
    booking_id VARCHAR(255), -- Related booking ID
    booking_type VARCHAR(20), -- 'flight', 'hotel', 'sightseeing'
    original_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    final_amount DECIMAL(10,2),
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON promo_code_usage(user_id);

-- =====================================================
-- FLIGHT SEARCHES CACHE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS flight_searches_cache (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    adults INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    cabin_class VARCHAR(20) DEFAULT 'ECONOMY',
    trip_type VARCHAR(20) DEFAULT 'one_way',
    search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results_count INTEGER DEFAULT 0,
    cached_results JSONB, -- Store the actual flight results
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours'
);

-- Index for performance and cleanup
CREATE INDEX IF NOT EXISTS idx_flight_cache_search ON flight_searches_cache(origin, destination, departure_date, return_date);
CREATE INDEX IF NOT EXISTS idx_flight_cache_expiry ON flight_searches_cache(expires_at);

-- =====================================================
-- HOTEL SEARCHES CACHE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS hotel_searches_cache (
    id SERIAL PRIMARY KEY,
    destination VARCHAR(255) NOT NULL,
    checkin_date DATE NOT NULL,
    checkout_date DATE NOT NULL,
    adults INTEGER DEFAULT 2,
    children INTEGER DEFAULT 0,
    rooms INTEGER DEFAULT 1,
    search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results_count INTEGER DEFAULT 0,
    cached_results JSONB, -- Store the actual hotel results
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '6 hours'
);

-- Index for performance and cleanup
CREATE INDEX IF NOT EXISTS idx_hotel_cache_search ON hotel_searches_cache(destination, checkin_date, checkout_date);
CREATE INDEX IF NOT EXISTS idx_hotel_cache_expiry ON hotel_searches_cache(expires_at);

-- =====================================================
-- SIGHTSEEING SEARCHES CACHE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sightseeing_searches_cache (
    id SERIAL PRIMARY KEY,
    destination VARCHAR(255) NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE,
    adults INTEGER DEFAULT 2,
    children INTEGER DEFAULT 0,
    search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results_count INTEGER DEFAULT 0,
    cached_results JSONB, -- Store the actual sightseeing results
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '12 hours'
);

-- Index for performance and cleanup
CREATE INDEX IF NOT EXISTS idx_sightseeing_cache_search ON sightseeing_searches_cache(destination, date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_sightseeing_cache_expiry ON sightseeing_searches_cache(expires_at);

-- =====================================================
-- BOOKING TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    booking_type VARCHAR(20) NOT NULL, -- 'flight', 'hotel', 'sightseeing'
    user_id INTEGER,
    search_id INTEGER, -- Reference to search cache table
    supplier VARCHAR(50) NOT NULL, -- 'amadeus', 'hotelbeds'
    supplier_booking_id VARCHAR(255), -- Booking ID from supplier
    
    -- Booking details
    passenger_details JSONB, -- Passenger/guest information
    travel_details JSONB, -- Flight/hotel/activity details
    
    -- Pricing information
    original_price DECIMAL(10,2),
    markup_applied DECIMAL(10,2),
    promo_discount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Promo code information
    promo_code_used VARCHAR(50),
    promo_code_id INTEGER REFERENCES promo_codes(id),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_reference VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Additional metadata
    booking_source VARCHAR(50) DEFAULT 'web', -- web, mobile, api
    ip_address INET,
    user_agent TEXT
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_type_status ON bookings(booking_type, status);
CREATE INDEX IF NOT EXISTS idx_bookings_promo ON bookings(promo_code_id);

-- =====================================================
-- DEFAULT MARKUP DATA
-- =====================================================

-- Insert default airline markups
INSERT INTO airline_markups (airline_code, airline_name, route, cabin_class, markup_percentage) VALUES
('EK', 'Emirates', 'ALL', 'ECONOMY', 12.0),
('EK', 'Emirates', 'ALL', 'BUSINESS', 8.0),
('QR', 'Qatar Airways', 'ALL', 'ECONOMY', 15.0),
('QR', 'Qatar Airways', 'ALL', 'BUSINESS', 10.0),
('AI', 'Air India', 'ALL', 'ECONOMY', 18.0),
('6E', 'IndiGo', 'ALL', 'ECONOMY', 20.0),
('UK', 'Vistara', 'ALL', 'ECONOMY', 16.0)
ON CONFLICT (airline_code, route, cabin_class) DO NOTHING;

-- Insert default hotel markups
INSERT INTO hotel_markups (destination_code, destination_name, star_rating, markup_percentage) VALUES
('DXB', 'Dubai', 5, 15.0),
('DXB', 'Dubai', 4, 18.0),
('DXB', 'Dubai', 3, 22.0),
('BOM', 'Mumbai', 5, 20.0),
('BOM', 'Mumbai', 4, 25.0),
('ALL', 'All Destinations', 0, 20.0)
ON CONFLICT (destination_code, star_rating) DO NOTHING;

-- Insert default sightseeing markups
INSERT INTO sightseeing_markups (destination_code, destination_name, category, markup_percentage) VALUES
('DXB', 'Dubai', 'TOURS', 25.0),
('DXB', 'Dubai', 'ATTRACTIONS', 30.0),
('DXB', 'Dubai', 'MUSEUMS', 20.0),
('BOM', 'Mumbai', 'TOURS', 28.0),
('ALL', 'All Destinations', 'ALL', 25.0)
ON CONFLICT (destination_code, category) DO NOTHING;

-- Insert sample promo codes
INSERT INTO promo_codes (code, name, description, discount_type, discount_value, max_discount, min_order_value, applicable_to, usage_limit, expiry_date) VALUES
('WELCOME10', 'Welcome Discount', '10% off on first booking', 'percentage', 10.0, 5000.0, 1000.0, 'all', 1000, CURRENT_TIMESTAMP + INTERVAL '30 days'),
('FLIGHT15', 'Flight Special', '15% off on flight bookings', 'percentage', 15.0, 10000.0, 5000.0, 'flights', 500, CURRENT_TIMESTAMP + INTERVAL '60 days'),
('HOTEL20', 'Hotel Deal', '20% off on hotel bookings', 'percentage', 20.0, 15000.0, 8000.0, 'hotels', 300, CURRENT_TIMESTAMP + INTERVAL '45 days'),
('SAVE2000', 'Fixed Discount', 'Flat ₹2000 off', 'fixed', 2000.0, NULL, 10000.0, 'all', 200, CURRENT_TIMESTAMP + INTERVAL '90 days'),
('SIGHTSEEING25', 'Activity Special', '25% off on sightseeing', 'percentage', 25.0, 8000.0, 3000.0, 'sightseeing', 100, CURRENT_TIMESTAMP + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating updated_at
CREATE TRIGGER update_airline_markups_updated_at BEFORE UPDATE ON airline_markups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotel_markups_updated_at BEFORE UPDATE ON hotel_markups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sightseeing_markups_updated_at BEFORE UPDATE ON sightseeing_markups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM flight_searches_cache WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM hotel_searches_cache WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM sightseeing_searches_cache WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Log cleanup
    RAISE NOTICE 'Cache cleanup completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View for markup revenue tracking
CREATE OR REPLACE VIEW markup_revenue_summary AS
SELECT 
    b.booking_type,
    DATE_TRUNC('month', b.created_at) as month,
    COUNT(*) as total_bookings,
    SUM(b.original_price) as total_original_amount,
    SUM(b.markup_applied) as total_markup_revenue,
    SUM(b.promo_discount) as total_promo_discounts,
    SUM(b.final_price) as total_final_amount,
    AVG(b.markup_applied / NULLIF(b.original_price, 0) * 100) as avg_markup_percentage
FROM bookings b
WHERE b.status = 'confirmed'
GROUP BY b.booking_type, DATE_TRUNC('month', b.created_at)
ORDER BY month DESC, booking_type;

-- View for promo code performance
CREATE OR REPLACE VIEW promo_code_performance AS
SELECT 
    pc.code,
    pc.name,
    pc.applicable_to,
    pc.usage_count,
    pc.usage_limit,
    COUNT(pcu.id) as actual_usage,
    SUM(pcu.discount_amount) as total_discount_given,
    AVG(pcu.discount_amount) as avg_discount_per_use,
    pc.expiry_date
FROM promo_codes pc
LEFT JOIN promo_code_usage pcu ON pc.id = pcu.promo_code_id
GROUP BY pc.id, pc.code, pc.name, pc.applicable_to, pc.usage_count, pc.usage_limit, pc.expiry_date
ORDER BY pc.usage_count DESC;

-- =====================================================
-- SEARCH ANALYTICS VIEW
-- =====================================================
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

ORDER BY search_day DESC, search_type;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Markup Management and Promo Code System schema created successfully!' as status;
