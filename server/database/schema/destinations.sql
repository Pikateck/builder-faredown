-- Database schema for Hotelbeds destinations master data
-- This schema supports the integration with Hotelbeds API for live hotel searches

-- Countries master table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE, -- ISO 3166-1 alpha-2 country code (e.g., 'AE', 'US')
    name VARCHAR(255) NOT NULL,
    iso3_code VARCHAR(3), -- ISO 3166-1 alpha-3 country code (e.g., 'ARE', 'USA')
    continent VARCHAR(50),
    currency_code VARCHAR(3), -- Default currency for the country (e.g., 'AED', 'USD')
    phone_prefix VARCHAR(10),
    flag_emoji VARCHAR(10), -- Country flag emoji
    popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destinations master table (cities, regions, landmarks)
CREATE TABLE IF NOT EXISTS destinations (
    id SERIAL PRIMARY KEY,
    hotelbeds_code VARCHAR(10) NOT NULL UNIQUE, -- Hotelbeds destination code (e.g., 'DXB', 'LON')
    name VARCHAR(255) NOT NULL,
    alternative_names TEXT[], -- Alternative names and translations
    type VARCHAR(20) NOT NULL CHECK (type IN ('city', 'region', 'island', 'district', 'landmark')),
    country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
    country_code VARCHAR(3) NOT NULL, -- Denormalized for performance
    country_name VARCHAR(255) NOT NULL, -- Denormalized for performance
    state_province VARCHAR(255), -- State or province name
    zone_code VARCHAR(10), -- Hotelbeds zone code if applicable
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    popular BOOLEAN DEFAULT FALSE,
    hotel_count INTEGER DEFAULT 0, -- Cached count of available hotels
    airport_codes TEXT[], -- Associated airport codes (e.g., ['DXB', 'DWC'])
    description TEXT,
    image_url VARCHAR(500),
    search_priority INTEGER DEFAULT 100, -- Lower number = higher priority in search results
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destination search index for performance
CREATE INDEX IF NOT EXISTS idx_destinations_search ON destinations 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(array_to_string(alternative_names, ' '), '')));

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_destinations_country ON destinations(country_code);
CREATE INDEX IF NOT EXISTS idx_destinations_type ON destinations(type);
CREATE INDEX IF NOT EXISTS idx_destinations_popular ON destinations(popular) WHERE popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_destinations_hotelbeds_code ON destinations(hotelbeds_code);
CREATE INDEX IF NOT EXISTS idx_destinations_location ON destinations(latitude, longitude);

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
    amenities TEXT[], -- Array of amenity names
    facilities JSONB, -- Structured facilities data
    images TEXT[], -- Array of image URLs
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    currency_code VARCHAR(3),
    cancellation_policy TEXT,
    check_in_time VARCHAR(10),
    check_out_time VARCHAR(10),
    distance_to_center DECIMAL(5,2), -- Distance to city center in km
    supplier VARCHAR(50) DEFAULT 'hotelbeds',
    active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cache_expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Indexes for hotels cache
CREATE INDEX IF NOT EXISTS idx_hotels_cache_destination ON hotels_cache(destination_code);
CREATE INDEX IF NOT EXISTS idx_hotels_cache_hotelbeds_id ON hotels_cache(hotelbeds_hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotels_cache_active ON hotels_cache(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_hotels_cache_expires ON hotels_cache(cache_expires_at);

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

-- Insert sample data for development and testing
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

-- Insert destination data based on MASTER_DESTINATIONS
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

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for quick destination search with country info
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

-- Create stored procedure for destination search
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

-- Grant permissions (adjust as needed for your user setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_api_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_api_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_api_user;
