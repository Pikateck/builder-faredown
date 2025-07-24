-- Complete Database Setup for Faredown Booking System
-- Execute this on your Render PostgreSQL database

-- =============================================================================
-- STEP 1: Create Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- STEP 2: Main Booking System Tables
-- =============================================================================

-- Suppliers table - tracks which API/supplier each booking came from
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    base_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    markup_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table - for future login functionality
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hotel bookings table - main booking storage
CREATE TABLE IF NOT EXISTS hotel_bookings (
    id SERIAL PRIMARY KEY,
    booking_ref VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(id),
    user_id INTEGER REFERENCES users(id),
    
    -- Hotel details
    hotel_code VARCHAR(100) NOT NULL,
    hotel_name VARCHAR(255) NOT NULL,
    hotel_address TEXT,
    hotel_city VARCHAR(100),
    hotel_country VARCHAR(100),
    hotel_rating DECIMAL(3,2),
    
    -- Room details
    room_type VARCHAR(255),
    room_name VARCHAR(255),
    room_code VARCHAR(100),
    giata_room_type VARCHAR(100),
    max_occupancy INTEGER,
    
    -- Guest details (JSON for flexibility)
    guest_details JSONB NOT NULL,
    
    -- Booking dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER NOT NULL,
    rooms_count INTEGER DEFAULT 1,
    adults_count INTEGER NOT NULL,
    children_count INTEGER DEFAULT 0,
    children_ages INTEGER[],
    
    -- Pricing details
    base_price DECIMAL(10,2) NOT NULL,
    markup_amount DECIMAL(10,2) DEFAULT 0.00,
    markup_percentage DECIMAL(5,2) DEFAULT 0.00,
    taxes DECIMAL(10,2) DEFAULT 0.00,
    fees DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Booking status
    status VARCHAR(50) DEFAULT 'pending',
    supplier_booking_ref VARCHAR(255),
    supplier_response JSONB,
    
    -- Special requests and notes
    special_requests TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmation_date TIMESTAMP WITH TIME ZONE,
    cancellation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table - tracks all payment transactions
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
    
    gateway VARCHAR(50) NOT NULL,
    gateway_payment_id VARCHAR(255) NOT NULL,
    gateway_order_id VARCHAR(255),
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    payment_method VARCHAR(50),
    payment_details JSONB,
    
    status VARCHAR(50) DEFAULT 'pending',
    failure_reason TEXT,
    
    gateway_response JSONB,
    gateway_fee DECIMAL(10,2) DEFAULT 0.00,
    
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_date TIMESTAMP WITH TIME ZONE,
    refund_reference VARCHAR(255),
    
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vouchers table - tracks voucher generation and delivery
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
    
    voucher_type VARCHAR(50) DEFAULT 'hotel',
    voucher_number VARCHAR(100) UNIQUE,
    
    pdf_path VARCHAR(500),
    pdf_size_bytes INTEGER,
    
    email_sent BOOLEAN DEFAULT false,
    email_address VARCHAR(255),
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_delivery_status VARCHAR(50),
    email_failure_reason TEXT,
    
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    
    is_latest BOOLEAN DEFAULT true,
    regenerated_from INTEGER REFERENCES vouchers(id),
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Booking audit log - tracks all changes to bookings
CREATE TABLE IF NOT EXISTS booking_audit_log (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
    
    action VARCHAR(50) NOT NULL,
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    
    changed_by VARCHAR(255),
    change_reason TEXT,
    
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 3: Destinations and Hotels Cache Tables
-- =============================================================================

-- Countries master table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    iso3_code VARCHAR(3),
    continent VARCHAR(50),
    currency_code VARCHAR(3),
    phone_prefix VARCHAR(10),
    flag_emoji VARCHAR(10),
    popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destinations master table (cities, regions, landmarks)
CREATE TABLE IF NOT EXISTS destinations (
    id SERIAL PRIMARY KEY,
    hotelbeds_code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    alternative_names TEXT[],
    type VARCHAR(20) NOT NULL CHECK (type IN ('city', 'region', 'island', 'district', 'landmark')),
    country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
    country_code VARCHAR(3) NOT NULL,
    country_name VARCHAR(255) NOT NULL,
    state_province VARCHAR(255),
    zone_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    popular BOOLEAN DEFAULT FALSE,
    hotel_count INTEGER DEFAULT 0,
    airport_codes TEXT[],
    description TEXT,
    image_url VARCHAR(500),
    search_priority INTEGER DEFAULT 100,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotels cache table (for caching Hotelbeds API responses)
CREATE TABLE IF NOT EXISTS hotels_cache (
    id SERIAL PRIMARY KEY,
    hotelbeds_hotel_id VARCHAR(50) NOT NULL,
    destination_id INTEGER REFERENCES destinations(id) ON DELETE CASCADE,
    destination_code VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
    review_score DECIMAL(3,1),
    review_count INTEGER DEFAULT 0,
    address_street VARCHAR(255),
    address_city VARCHAR(255),
    address_country VARCHAR(255),
    address_postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    amenities TEXT[],
    facilities JSONB,
    images TEXT[],
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    currency_code VARCHAR(3),
    cancellation_policy TEXT,
    check_in_time VARCHAR(10),
    check_out_time VARCHAR(10),
    distance_to_center DECIMAL(5,2),
    supplier VARCHAR(50) DEFAULT 'hotelbeds',
    active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cache_expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Hotel rooms cache (for room availability and pricing)
CREATE TABLE IF NOT EXISTS hotel_rooms_cache (
    id SERIAL PRIMARY KEY,
    hotel_cache_id INTEGER REFERENCES hotels_cache(id) ON DELETE CASCADE,
    hotelbeds_room_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    size_sqm INTEGER,
    bed_type VARCHAR(100),
    max_occupancy INTEGER,
    price_per_night DECIMAL(10,2),
    currency_code VARCHAR(3),
    amenities TEXT[],
    features TEXT[],
    images TEXT[],
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destination popularity tracking
CREATE TABLE IF NOT EXISTS destination_searches (
    id SERIAL PRIMARY KEY,
    destination_id INTEGER REFERENCES destinations(id) ON DELETE CASCADE,
    destination_code VARCHAR(10) NOT NULL,
    search_date DATE DEFAULT CURRENT_DATE,
    search_count INTEGER DEFAULT 1,
    booking_count INTEGER DEFAULT 0,
    UNIQUE(destination_id, search_date)
);

-- =============================================================================
-- STEP 4: Create Indexes for Performance
-- =============================================================================

-- Booking system indexes
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_booking_ref ON hotel_bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_status ON hotel_bookings(status);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_booking_date ON hotel_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_check_in_date ON hotel_bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_hotel_city ON hotel_bookings(hotel_city);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_supplier_id ON hotel_bookings(supplier_id);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_completed_at ON payments(completed_at);

CREATE INDEX IF NOT EXISTS idx_vouchers_booking_id ON vouchers(booking_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_number ON vouchers(voucher_number);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_latest ON vouchers(is_latest);

CREATE INDEX IF NOT EXISTS idx_booking_audit_log_booking_id ON booking_audit_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_changed_at ON booking_audit_log(changed_at);

-- Destinations indexes
CREATE INDEX IF NOT EXISTS idx_destinations_search ON destinations 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(array_to_string(alternative_names, ' '), '')));

CREATE INDEX IF NOT EXISTS idx_destinations_country ON destinations(country_code);
CREATE INDEX IF NOT EXISTS idx_destinations_type ON destinations(type);
CREATE INDEX IF NOT EXISTS idx_destinations_popular ON destinations(popular) WHERE popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_destinations_hotelbeds_code ON destinations(hotelbeds_code);
CREATE INDEX IF NOT EXISTS idx_destinations_location ON destinations(latitude, longitude);

-- Hotels cache indexes
CREATE INDEX IF NOT EXISTS idx_hotels_cache_destination ON hotels_cache(destination_code);
CREATE INDEX IF NOT EXISTS idx_hotels_cache_hotelbeds_id ON hotels_cache(hotelbeds_hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotels_cache_active ON hotels_cache(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_hotels_cache_expires ON hotels_cache(cache_expires_at);

-- =============================================================================
-- STEP 5: Create Functions and Triggers
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for booking system tables
CREATE TRIGGER IF NOT EXISTS update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_hotel_bookings_updated_at BEFORE UPDATE ON hotel_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_vouchers_updated_at BEFORE UPDATE ON vouchers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for destinations tables
CREATE TRIGGER IF NOT EXISTS update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_destinations_updated_at BEFORE UPDATE ON destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: Insert Initial Data
-- =============================================================================

-- Insert default suppliers
INSERT INTO suppliers (name, is_active, markup_percentage) VALUES
('hotelbeds', true, 15.00),
('tbo', false, 12.00),
('agoda', false, 18.00),
('booking.com', false, 20.00)
ON CONFLICT (name) DO NOTHING;

-- Insert countries data
INSERT INTO countries (code, name, iso3_code, continent, currency_code, phone_prefix, flag_emoji, popular) VALUES
('AE', 'United Arab Emirates', 'ARE', 'Asia', 'AED', '+971', '🇦🇪', TRUE),
('US', 'United States', 'USA', 'North America', 'USD', '+1', '🇺🇸', TRUE),
('GB', 'United Kingdom', 'GBR', 'Europe', 'GBP', '+44', '🇬🇧', TRUE),
('FR', 'France', 'FRA', 'Europe', 'EUR', '+33', '🇫🇷', TRUE),
('ES', 'Spain', 'ESP', 'Europe', 'EUR', '+34', '🇪🇸', TRUE),
('IT', 'Italy', 'ITA', 'Europe', 'EUR', '+39', '🇮🇹', TRUE),
('DE', 'Germany', 'DEU', 'Europe', 'EUR', '+49', '🇩🇪', TRUE),
('IN', 'India', 'IND', 'Asia', 'INR', '+91', '🇮🇳', TRUE),
('TH', 'Thailand', 'THA', 'Asia', 'THB', '+66', '🇹🇭', TRUE),
('SG', 'Singapore', 'SGP', 'Asia', 'SGD', '+65', '🇸🇬', TRUE),
('JP', 'Japan', 'JPN', 'Asia', 'JPY', '+81', '🇯🇵', TRUE),
('AU', 'Australia', 'AUS', 'Oceania', 'AUD', '+61', '🇦🇺', TRUE),
('GR', 'Greece', 'GRC', 'Europe', 'EUR', '+30', '🇬🇷', TRUE),
('TR', 'Turkey', 'TUR', 'Asia', 'TRY', '+90', '🇹🇷', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert destination data
INSERT INTO destinations (hotelbeds_code, name, type, country_code, country_name, popular, search_priority, airport_codes) VALUES
-- UAE
('DXB', 'Dubai', 'city', 'AE', 'United Arab Emirates', TRUE, 10, ARRAY['DXB', 'DWC']),
('AUH', 'Abu Dhabi', 'city', 'AE', 'United Arab Emirates', TRUE, 20, ARRAY['AUH']),
('SHJ', 'Sharjah', 'city', 'AE', 'United Arab Emirates', FALSE, 80, ARRAY['SHJ']),

-- Spain
('BCN', 'Barcelona', 'city', 'ES', 'Spain', TRUE, 15, ARRAY['BCN']),
('MAD', 'Madrid', 'city', 'ES', 'Spain', TRUE, 25, ARRAY['MAD']),
('PMI', 'Palma', 'island', 'ES', 'Spain', TRUE, 35, ARRAY['PMI']),
('SVQ', 'Seville', 'city', 'ES', 'Spain', TRUE, 45, ARRAY['SVQ']),
('AGP', 'Malaga', 'city', 'ES', 'Spain', TRUE, 40, ARRAY['AGP']),
('VLC', 'Valencia', 'city', 'ES', 'Spain', TRUE, 50, ARRAY['VLC']),
('IBZ', 'Ibiza', 'island', 'ES', 'Spain', TRUE, 30, ARRAY['IBZ']),

-- UK
('LON', 'London', 'city', 'GB', 'United Kingdom', TRUE, 12, ARRAY['LHR', 'LGW', 'STN', 'LTN']),
('EDI', 'Edinburgh', 'city', 'GB', 'United Kingdom', TRUE, 55, ARRAY['EDI']),
('MAN', 'Manchester', 'city', 'GB', 'United Kingdom', FALSE, 70, ARRAY['MAN']),

-- France
('PAR', 'Paris', 'city', 'FR', 'France', TRUE, 18, ARRAY['CDG', 'ORY']),
('NCE', 'Nice', 'city', 'FR', 'France', TRUE, 60, ARRAY['NCE']),
('LYS', 'Lyon', 'city', 'FR', 'France', FALSE, 75, ARRAY['LYS']),

-- Italy
('ROM', 'Rome', 'city', 'IT', 'Italy', TRUE, 22, ARRAY['FCO', 'CIA']),
('MIL', 'Milan', 'city', 'IT', 'Italy', TRUE, 65, ARRAY['MXP', 'LIN']),
('VEN', 'Venice', 'city', 'IT', 'Italy', TRUE, 70, ARRAY['VCE']),
('FLR', 'Florence', 'city', 'IT', 'Italy', TRUE, 75, ARRAY['FLR']),

-- Germany
('BER', 'Berlin', 'city', 'DE', 'Germany', TRUE, 50, ARRAY['BER']),
('MUC', 'Munich', 'city', 'DE', 'Germany', TRUE, 55, ARRAY['MUC']),
('FRA', 'Frankfurt', 'city', 'DE', 'Germany', FALSE, 85, ARRAY['FRA']),

-- USA
('NYC', 'New York', 'city', 'US', 'United States', TRUE, 8, ARRAY['JFK', 'LGA', 'EWR']),
('LAX', 'Los Angeles', 'city', 'US', 'United States', TRUE, 28, ARRAY['LAX']),
('MIA', 'Miami', 'city', 'US', 'United States', TRUE, 32, ARRAY['MIA']),
('LAS', 'Las Vegas', 'city', 'US', 'United States', TRUE, 38, ARRAY['LAS']),

-- India
('BOM', 'Mumbai', 'city', 'IN', 'India', TRUE, 42, ARRAY['BOM']),
('DEL', 'Delhi', 'city', 'IN', 'India', TRUE, 48, ARRAY['DEL']),
('BLR', 'Bangalore', 'city', 'IN', 'India', TRUE, 58, ARRAY['BLR']),
('GOI', 'Goa', 'region', 'IN', 'India', TRUE, 52, ARRAY['GOI']),

-- Thailand
('BKK', 'Bangkok', 'city', 'TH', 'Thailand', TRUE, 35, ARRAY['BKK', 'DMK']),
('HKT', 'Phuket', 'island', 'TH', 'Thailand', TRUE, 45, ARRAY['HKT']),
('CNX', 'Chiang Mai', 'city', 'TH', 'Thailand', TRUE, 62, ARRAY['CNX']),

-- Singapore
('SIN', 'Singapore', 'city', 'SG', 'Singapore', TRUE, 25, ARRAY['SIN']),

-- Japan
('TYO', 'Tokyo', 'city', 'JP', 'Japan', TRUE, 15, ARRAY['NRT', 'HND']),
('OSA', 'Osaka', 'city', 'JP', 'Japan', TRUE, 65, ARRAY['KIX', 'ITM']),
('KYO', 'Kyoto', 'city', 'JP', 'Japan', TRUE, 68, ARRAY['KIX']),

-- Australia
('SYD', 'Sydney', 'city', 'AU', 'Australia', TRUE, 30, ARRAY['SYD']),
('MEL', 'Melbourne', 'city', 'AU', 'Australia', TRUE, 72, ARRAY['MEL']),

-- Greece
('ATH', 'Athens', 'city', 'GR', 'Greece', TRUE, 55, ARRAY['ATH']),
('JMK', 'Mykonos', 'island', 'GR', 'Greece', TRUE, 78, ARRAY['JMK']),
('JTR', 'Santorini', 'island', 'GR', 'Greece', TRUE, 80, ARRAY['JTR']),

-- Turkey
('IST', 'Istanbul', 'city', 'TR', 'Turkey', TRUE, 40, ARRAY['IST', 'SAW']),
('AYT', 'Antalya', 'city', 'TR', 'Turkey', TRUE, 65, ARRAY['AYT'])

ON CONFLICT (hotelbeds_code) DO NOTHING;

-- =============================================================================
-- STEP 7: Create Views for Common Queries
-- =============================================================================

-- View for quick destination search with country info
CREATE OR REPLACE VIEW destinations_search_view AS
SELECT 
    d.id,
    d.hotelbeds_code,
    d.name,
    d.alternative_names,
    d.type,
    d.country_code,
    d.country_name,
    c.flag_emoji,
    c.currency_code,
    d.popular,
    d.hotel_count,
    d.airport_codes,
    d.search_priority,
    d.latitude,
    d.longitude
FROM destinations d
JOIN countries c ON d.country_code = c.code
WHERE d.active = TRUE;

-- Booking summary view
CREATE OR REPLACE VIEW booking_summary AS
SELECT 
    hb.id,
    hb.booking_ref,
    hb.hotel_name,
    hb.hotel_city,
    hb.check_in_date,
    hb.check_out_date,
    hb.nights,
    hb.total_amount,
    hb.currency,
    hb.status,
    s.name as supplier_name,
    p.status as payment_status,
    p.gateway_payment_id,
    p.payment_method,
    v.email_sent as voucher_sent,
    hb.booking_date,
    (hb.guest_details->>'primaryGuest'->>'firstName')::text || ' ' || 
    (hb.guest_details->>'primaryGuest'->>'lastName')::text as guest_name,
    hb.guest_details->>'contactInfo'->>'email' as guest_email
FROM hotel_bookings hb
LEFT JOIN suppliers s ON hb.supplier_id = s.id
LEFT JOIN payments p ON hb.id = p.booking_id AND p.status = 'completed'
LEFT JOIN vouchers v ON hb.id = v.booking_id AND v.is_latest = true
ORDER BY hb.booking_date DESC;

-- Revenue analytics view
CREATE OR REPLACE VIEW revenue_analytics AS
SELECT 
    DATE_TRUNC('month', hb.booking_date) as month,
    COUNT(*) as bookings_count,
    SUM(hb.total_amount) as total_revenue,
    AVG(hb.total_amount) as average_booking_value,
    SUM(hb.markup_amount) as total_markup,
    s.name as supplier_name,
    hb.hotel_city
FROM hotel_bookings hb
LEFT JOIN suppliers s ON hb.supplier_id = s.id
WHERE hb.status IN ('confirmed', 'completed')
GROUP BY DATE_TRUNC('month', hb.booking_date), s.name, hb.hotel_city
ORDER BY month DESC;

-- =============================================================================
-- STEP 8: Create Search Function
-- =============================================================================

-- Stored procedure for destination search
CREATE OR REPLACE FUNCTION search_destinations(
    search_query TEXT DEFAULT '',
    limit_results INTEGER DEFAULT 20,
    popular_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id INTEGER,
    hotelbeds_code VARCHAR(10),
    name VARCHAR(255),
    type VARCHAR(20),
    country_code VARCHAR(3),
    country_name VARCHAR(255),
    flag_emoji VARCHAR(10),
    popular BOOLEAN,
    search_priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dsv.id,
        dsv.hotelbeds_code,
        dsv.name,
        dsv.type,
        dsv.country_code,
        dsv.country_name,
        dsv.flag_emoji,
        dsv.popular,
        dsv.search_priority
    FROM destinations_search_view dsv
    WHERE 
        (search_query = '' OR 
         dsv.name ILIKE '%' || search_query || '%' OR
         dsv.country_name ILIKE '%' || search_query || '%' OR
         dsv.hotelbeds_code ILIKE '%' || search_query || '%' OR
         EXISTS (
             SELECT 1 FROM unnest(dsv.alternative_names) AS alt_name 
             WHERE alt_name ILIKE '%' || search_query || '%'
         ))
        AND (NOT popular_only OR dsv.popular = TRUE)
    ORDER BY 
        CASE WHEN dsv.popular THEN 0 ELSE 1 END,
        dsv.search_priority ASC,
        dsv.name ASC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DATABASE SETUP COMPLETE
-- =============================================================================

-- Add comments for documentation
COMMENT ON TABLE hotel_bookings IS 'Main table storing all hotel booking details with guest info, pricing, and status';
COMMENT ON TABLE payments IS 'Payment transactions linked to bookings with gateway details and status tracking';
COMMENT ON TABLE vouchers IS 'Generated vouchers and delivery tracking for each booking';
COMMENT ON TABLE suppliers IS 'Hotel API suppliers like Hotelbeds, TBO, Agoda with their configurations';
COMMENT ON TABLE destinations IS 'Master data for cities, regions, and landmarks with Hotelbeds integration';
COMMENT ON TABLE countries IS 'Master data for countries with currency and locale information';
