-- Database schema for flights management
-- This schema supports flight search, booking, and management with Amadeus API integration

-- Airlines master table
CREATE TABLE IF NOT EXISTS airlines (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(3) UNIQUE NOT NULL, -- IATA airline code (e.g., 'EK', 'AI', '6E')
    icao_code VARCHAR(4) UNIQUE, -- ICAO airline code (e.g., 'UAE', 'AIC', 'IGO')
    name VARCHAR(255) NOT NULL, -- Airline name (e.g., 'Emirates', 'Air India')
    country_code VARCHAR(3) NOT NULL, -- ISO country code
    country_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500), -- Airline logo URL
    website_url VARCHAR(500),
    hub_airports TEXT[], -- Primary hub airport codes
    fleet_size INTEGER DEFAULT 0,
    founded_year INTEGER,
    alliance VARCHAR(50), -- Star Alliance, OneWorld, SkyTeam, etc.
    is_low_cost BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Airports master table
CREATE TABLE IF NOT EXISTS airports (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(3) UNIQUE NOT NULL, -- IATA airport code (e.g., 'BOM', 'DXB')
    icao_code VARCHAR(4) UNIQUE, -- ICAO airport code (e.g., 'VABB', 'OMDB')
    name VARCHAR(255) NOT NULL, -- Airport name
    city VARCHAR(255) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    country_name VARCHAR(255) NOT NULL,
    state_province VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    elevation_ft INTEGER, -- Elevation in feet
    timezone VARCHAR(50), -- Timezone identifier
    utc_offset VARCHAR(10), -- UTC offset (e.g., '+04:00')
    terminals INTEGER DEFAULT 1,
    runways INTEGER DEFAULT 1,
    is_international BOOLEAN DEFAULT TRUE,
    is_hub BOOLEAN DEFAULT FALSE, -- Major hub airport
    passenger_volume BIGINT DEFAULT 0, -- Annual passenger volume
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aircraft types table
CREATE TABLE IF NOT EXISTS aircraft_types (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(3) UNIQUE, -- IATA aircraft type code (e.g., '77W', '320')
    icao_code VARCHAR(4) UNIQUE NOT NULL, -- ICAO aircraft type code (e.g., 'B77W', 'A320')
    manufacturer VARCHAR(100) NOT NULL, -- Boeing, Airbus, etc.
    model VARCHAR(100) NOT NULL, -- 777-300ER, A320-200, etc.
    variant VARCHAR(50), -- Specific variant
    typical_seating INTEGER, -- Typical passenger capacity
    max_seating INTEGER, -- Maximum passenger capacity
    cargo_capacity INTEGER, -- Cargo capacity in kg
    range_km INTEGER, -- Range in kilometers
    cruise_speed INTEGER, -- Cruise speed in km/h
    engine_type VARCHAR(100),
    wing_span DECIMAL(5,2), -- Wing span in meters
    length DECIMAL(5,2), -- Length in meters
    height DECIMAL(5,2), -- Height in meters
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flight schedules table (for scheduled flights)
CREATE TABLE IF NOT EXISTS flight_schedules (
    id SERIAL PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL, -- Flight number (e.g., 'EK500')
    airline_id INTEGER REFERENCES airlines(id) ON DELETE CASCADE,
    origin_airport_id INTEGER REFERENCES airports(id),
    destination_airport_id INTEGER REFERENCES airports(id),
    aircraft_type_id INTEGER REFERENCES aircraft_types(id),
    departure_time TIME NOT NULL, -- Scheduled departure time
    arrival_time TIME NOT NULL, -- Scheduled arrival time
    duration_minutes INTEGER NOT NULL,
    frequency VARCHAR(10) NOT NULL, -- Daily frequency pattern (e.g., '1234567' for all days)
    effective_from DATE NOT NULL, -- Schedule effective from date
    effective_until DATE, -- Schedule effective until date
    operating_airline_id INTEGER REFERENCES airlines(id), -- Code-share operating airline
    cabin_classes JSONB, -- Available cabin classes and configuration
    meal_service BOOLEAN DEFAULT FALSE,
    wifi_available BOOLEAN DEFAULT FALSE,
    entertainment BOOLEAN DEFAULT FALSE,
    baggage_allowance JSONB, -- Baggage allowance by cabin class
    distance_km INTEGER, -- Flight distance in kilometers
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(flight_number, airline_id, departure_time)
);

-- Flight instances table (actual flights with specific dates)
CREATE TABLE IF NOT EXISTS flights (
    id SERIAL PRIMARY KEY,
    flight_schedule_id INTEGER REFERENCES flight_schedules(id),
    flight_number VARCHAR(10) NOT NULL,
    airline_id INTEGER REFERENCES airlines(id) ON DELETE CASCADE,
    origin_airport_id INTEGER REFERENCES airports(id),
    destination_airport_id INTEGER REFERENCES airports(id),
    aircraft_type_id INTEGER REFERENCES aircraft_types(id),
    departure_datetime TIMESTAMP NOT NULL,
    arrival_datetime TIMESTAMP NOT NULL,
    actual_departure TIMESTAMP, -- Actual departure time
    actual_arrival TIMESTAMP, -- Actual arrival time
    duration_minutes INTEGER NOT NULL,
    distance_km INTEGER,
    registration VARCHAR(20), -- Aircraft registration (e.g., 'A6-EVA')
    gate VARCHAR(10), -- Departure gate
    terminal VARCHAR(10), -- Departure terminal
    arrival_gate VARCHAR(10),
    arrival_terminal VARCHAR(10),
    status VARCHAR(20) DEFAULT 'Scheduled', -- Scheduled, Delayed, Cancelled, Departed, Arrived
    delay_minutes INTEGER DEFAULT 0,
    cancellation_reason TEXT,
    seats_total INTEGER NOT NULL,
    seats_available INTEGER NOT NULL,
    seats_economy INTEGER DEFAULT 0,
    seats_premium_economy INTEGER DEFAULT 0,
    seats_business INTEGER DEFAULT 0,
    seats_first INTEGER DEFAULT 0,
    base_price_economy DECIMAL(10,2),
    base_price_premium_economy DECIMAL(10,2),
    base_price_business DECIMAL(10,2),
    base_price_first DECIMAL(10,2),
    fuel_surcharge DECIMAL(10,2) DEFAULT 0.00,
    airport_taxes DECIMAL(10,2) DEFAULT 0.00,
    currency_code VARCHAR(3) DEFAULT 'INR',
    is_codeshare BOOLEAN DEFAULT FALSE,
    operating_airline_id INTEGER REFERENCES airlines(id),
    amadeus_flight_id VARCHAR(100), -- Amadeus API flight ID for booking
    amadeus_offer_data JSONB, -- Store Amadeus offer data for booking
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    UNIQUE(flight_number, airline_id, departure_datetime)
);

-- Flight search cache table (for caching Amadeus API responses)
CREATE TABLE IF NOT EXISTS flight_searches_cache (
    id SERIAL PRIMARY KEY,
    search_hash VARCHAR(64) UNIQUE NOT NULL, -- MD5 hash of search parameters
    origin_airport_code VARCHAR(3) NOT NULL,
    destination_airport_code VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER DEFAULT 0,
    infants INTEGER DEFAULT 0,
    cabin_class VARCHAR(20) NOT NULL,
    trip_type VARCHAR(20) NOT NULL, -- one_way, round_trip, multi_city
    currency_code VARCHAR(3) DEFAULT 'INR',
    search_results JSONB NOT NULL, -- Cached search results
    result_count INTEGER DEFAULT 0,
    amadeus_response JSONB, -- Raw Amadeus API response
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 hours'),
    hit_count INTEGER DEFAULT 1, -- Number of times this cache was used
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flight bookings table
CREATE TABLE IF NOT EXISTS flight_bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(10) UNIQUE NOT NULL, -- PNR/Booking reference
    amadeus_booking_id VARCHAR(100), -- Amadeus booking ID
    user_id INTEGER, -- Reference to users table if exists
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    booking_status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled, pending, completed
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded, failed
    total_amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'INR',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    travel_date DATE NOT NULL,
    passenger_count INTEGER NOT NULL,
    is_round_trip BOOLEAN DEFAULT FALSE,
    special_requests TEXT,
    booking_source VARCHAR(50) DEFAULT 'website', -- website, mobile_app, agent
    amadeus_data JSONB, -- Store complete Amadeus booking data
    confirmation_sent BOOLEAN DEFAULT FALSE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    checkin_available_from TIMESTAMP,
    is_checked_in BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    refund_amount DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flight booking segments table (for multi-segment bookings)
CREATE TABLE IF NOT EXISTS flight_booking_segments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES flight_bookings(id) ON DELETE CASCADE,
    flight_id INTEGER REFERENCES flights(id),
    segment_number INTEGER NOT NULL, -- 1 for outbound, 2 for return, etc.
    departure_airport_code VARCHAR(3) NOT NULL,
    arrival_airport_code VARCHAR(3) NOT NULL,
    departure_datetime TIMESTAMP NOT NULL,
    arrival_datetime TIMESTAMP NOT NULL,
    flight_number VARCHAR(10) NOT NULL,
    airline_code VARCHAR(3) NOT NULL,
    cabin_class VARCHAR(20) NOT NULL,
    seat_assignments JSONB, -- Seat assignments for passengers
    baggage_allowance JSONB,
    meal_preferences JSONB,
    segment_status VARCHAR(20) DEFAULT 'confirmed',
    amadeus_segment_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flight passengers table
CREATE TABLE IF NOT EXISTS flight_passengers (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES flight_bookings(id) ON DELETE CASCADE,
    passenger_type VARCHAR(10) NOT NULL, -- adult, child, infant
    title VARCHAR(10), -- Mr, Ms, Mrs, Dr, etc.
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(1), -- M, F
    nationality VARCHAR(3), -- ISO country code
    passport_number VARCHAR(50),
    passport_expiry DATE,
    passport_country VARCHAR(3),
    frequent_flyer_number VARCHAR(50),
    frequent_flyer_airline VARCHAR(3),
    seat_preference VARCHAR(50), -- window, aisle, middle
    meal_preference VARCHAR(50),
    special_assistance TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    ticket_number VARCHAR(50), -- e-ticket number
    ticket_issued BOOLEAN DEFAULT FALSE,
    boarding_passes JSONB, -- Boarding pass information for each segment
    checked_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flight routes table (for route analytics and popular routes)
CREATE TABLE IF NOT EXISTS flight_routes (
    id SERIAL PRIMARY KEY,
    origin_airport_code VARCHAR(3) NOT NULL,
    destination_airport_code VARCHAR(3) NOT NULL,
    route_name VARCHAR(100) NOT NULL, -- e.g., 'Mumbai - Dubai'
    distance_km INTEGER,
    popular_route BOOLEAN DEFAULT FALSE,
    average_duration_minutes INTEGER,
    airlines_serving TEXT[], -- Array of airline codes serving this route
    average_price DECIMAL(10,2),
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    currency_code VARCHAR(3) DEFAULT 'INR',
    search_count INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    last_searched TIMESTAMP,
    last_booked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(origin_airport_code, destination_airport_code)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_airlines_iata_code ON airlines(iata_code);
CREATE INDEX IF NOT EXISTS idx_airlines_country ON airlines(country_code);
CREATE INDEX IF NOT EXISTS idx_airlines_active ON airlines(active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_airports_iata_code ON airports(iata_code);
CREATE INDEX IF NOT EXISTS idx_airports_country ON airports(country_code);
CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
CREATE INDEX IF NOT EXISTS idx_airports_active ON airports(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_airports_international ON airports(is_international) WHERE is_international = TRUE;

CREATE INDEX IF NOT EXISTS idx_flights_departure_date ON flights(DATE(departure_datetime));
CREATE INDEX IF NOT EXISTS idx_flights_route ON flights(origin_airport_id, destination_airport_id);
CREATE INDEX IF NOT EXISTS idx_flights_airline ON flights(airline_id);
CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status);
CREATE INDEX IF NOT EXISTS idx_flights_active ON flights(active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_flight_searches_cache_hash ON flight_searches_cache(search_hash);
CREATE INDEX IF NOT EXISTS idx_flight_searches_cache_route_date ON flight_searches_cache(origin_airport_code, destination_airport_code, departure_date);
CREATE INDEX IF NOT EXISTS idx_flight_searches_cache_expires ON flight_searches_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_flight_bookings_reference ON flight_bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_email ON flight_bookings(contact_email);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_date ON flight_bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_status ON flight_bookings(booking_status);

CREATE INDEX IF NOT EXISTS idx_flight_passengers_booking ON flight_passengers(booking_id);
CREATE INDEX IF NOT EXISTS idx_flight_passengers_passport ON flight_passengers(passport_number);

CREATE INDEX IF NOT EXISTS idx_flight_routes_popular ON flight_routes(popular_route) WHERE popular_route = TRUE;
CREATE INDEX IF NOT EXISTS idx_flight_routes_search_count ON flight_routes(search_count DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_flight_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_airlines_updated_at BEFORE UPDATE ON airlines
    FOR EACH ROW EXECUTE FUNCTION update_flight_updated_at_column();

CREATE TRIGGER update_airports_updated_at BEFORE UPDATE ON airports
    FOR EACH ROW EXECUTE FUNCTION update_flight_updated_at_column();

CREATE TRIGGER update_flight_schedules_updated_at BEFORE UPDATE ON flight_schedules
    FOR EACH ROW EXECUTE FUNCTION update_flight_updated_at_column();

CREATE TRIGGER update_flight_bookings_updated_at BEFORE UPDATE ON flight_bookings
    FOR EACH ROW EXECUTE FUNCTION update_flight_updated_at_column();

CREATE TRIGGER update_flight_passengers_updated_at BEFORE UPDATE ON flight_passengers
    FOR EACH ROW EXECUTE FUNCTION update_flight_updated_at_column();

CREATE TRIGGER update_flight_routes_updated_at BEFORE UPDATE ON flight_routes
    FOR EACH ROW EXECUTE FUNCTION update_flight_updated_at_column();

-- Seed basic airline data
INSERT INTO airlines (iata_code, icao_code, name, country_code, country_name, logo_url, is_low_cost, alliance) VALUES
('EK', 'UAE', 'Emirates', 'AE', 'United Arab Emirates', 'https://pics.avs.io/120/120/EK.png', FALSE, NULL),
('AI', 'AIC', 'Air India', 'IN', 'India', 'https://pics.avs.io/120/120/AI.png', FALSE, 'Star Alliance'),
('6E', 'IGO', 'IndiGo', 'IN', 'India', 'https://pics.avs.io/120/120/6E.png', TRUE, NULL),
('SG', 'SEJ', 'SpiceJet', 'IN', 'India', 'https://pics.avs.io/120/120/SG.png', TRUE, NULL),
('UK', 'VTI', 'Vistara', 'IN', 'India', 'https://pics.avs.io/120/120/UK.png', FALSE, NULL),
('QR', 'QTR', 'Qatar Airways', 'QA', 'Qatar', 'https://pics.avs.io/120/120/QR.png', FALSE, 'OneWorld'),
('EY', 'ETD', 'Etihad Airways', 'AE', 'United Arab Emirates', 'https://pics.avs.io/120/120/EY.png', FALSE, NULL),
('FZ', 'FDB', 'flydubai', 'AE', 'United Arab Emirates', 'https://pics.avs.io/120/120/FZ.png', TRUE, NULL),
('BA', 'BAW', 'British Airways', 'GB', 'United Kingdom', 'https://pics.avs.io/120/120/BA.png', FALSE, 'OneWorld'),
('LH', 'DLH', 'Lufthansa', 'DE', 'Germany', 'https://pics.avs.io/120/120/LH.png', FALSE, 'Star Alliance'),
('AF', 'AFR', 'Air France', 'FR', 'France', 'https://pics.avs.io/120/120/AF.png', FALSE, 'SkyTeam'),
('KL', 'KLM', 'KLM Royal Dutch Airlines', 'NL', 'Netherlands', 'https://pics.avs.io/120/120/KL.png', FALSE, 'SkyTeam'),
('TK', 'THY', 'Turkish Airlines', 'TR', 'Turkey', 'https://pics.avs.io/120/120/TK.png', FALSE, 'Star Alliance'),
('SQ', 'SIA', 'Singapore Airlines', 'SG', 'Singapore', 'https://pics.avs.io/120/120/SQ.png', FALSE, 'Star Alliance'),
('CX', 'CPA', 'Cathay Pacific', 'HK', 'Hong Kong', 'https://pics.avs.io/120/120/CX.png', FALSE, 'OneWorld')
ON CONFLICT (iata_code) DO NOTHING;

-- Seed basic airport data
INSERT INTO airports (iata_code, icao_code, name, city, country_code, country_name, latitude, longitude, timezone, is_international, is_hub) VALUES
('BOM', 'VABB', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'IN', 'India', 19.0896, 72.8656, 'Asia/Kolkata', TRUE, TRUE),
('DEL', 'VIDP', 'Indira Gandhi International Airport', 'New Delhi', 'IN', 'India', 28.5562, 77.1000, 'Asia/Kolkata', TRUE, TRUE),
('BLR', 'VOBL', 'Kempegowda International Airport', 'Bangalore', 'IN', 'India', 13.1979, 77.7063, 'Asia/Kolkata', TRUE, FALSE),
('MAA', 'VOMM', 'Chennai International Airport', 'Chennai', 'IN', 'India', 12.9941, 80.1709, 'Asia/Kolkata', TRUE, FALSE),
('HYD', 'VOHS', 'Rajiv Gandhi International Airport', 'Hyderabad', 'IN', 'India', 17.2313, 78.4298, 'Asia/Kolkata', TRUE, FALSE),
('CCU', 'VECC', 'Netaji Subhash Chandra Bose International Airport', 'Kolkata', 'IN', 'India', 22.6547, 88.4467, 'Asia/Kolkata', TRUE, FALSE),
('DXB', 'OMDB', 'Dubai International Airport', 'Dubai', 'AE', 'United Arab Emirates', 25.2532, 55.3657, 'Asia/Dubai', TRUE, TRUE),
('AUH', 'OMAA', 'Abu Dhabi International Airport', 'Abu Dhabi', 'AE', 'United Arab Emirates', 24.4330, 54.6511, 'Asia/Dubai', TRUE, TRUE),
('DOH', 'OTHH', 'Hamad International Airport', 'Doha', 'QA', 'Qatar', 25.2731, 51.6080, 'Asia/Qatar', TRUE, TRUE),
('LHR', 'EGLL', 'Heathrow Airport', 'London', 'GB', 'United Kingdom', 51.4700, -0.4543, 'Europe/London', TRUE, TRUE),
('CDG', 'LFPG', 'Charles de Gaulle Airport', 'Paris', 'FR', 'France', 49.0097, 2.5479, 'Europe/Paris', TRUE, TRUE),
('FRA', 'EDDF', 'Frankfurt Airport', 'Frankfurt', 'DE', 'Germany', 50.0379, 8.5622, 'Europe/Berlin', TRUE, TRUE),
('AMS', 'EHAM', 'Amsterdam Airport Schiphol', 'Amsterdam', 'NL', 'Netherlands', 52.3105, 4.7683, 'Europe/Amsterdam', TRUE, TRUE),
('IST', 'LTFM', 'Istanbul Airport', 'Istanbul', 'TR', 'Turkey', 41.2753, 28.7519, 'Europe/Istanbul', TRUE, TRUE),
('SIN', 'WSSS', 'Singapore Changi Airport', 'Singapore', 'SG', 'Singapore', 1.3644, 103.9915, 'Asia/Singapore', TRUE, TRUE),
('HKG', 'VHHH', 'Hong Kong International Airport', 'Hong Kong', 'HK', 'Hong Kong', 22.3080, 113.9185, 'Asia/Hong_Kong', TRUE, TRUE),
('NRT', 'RJAA', 'Narita International Airport', 'Tokyo', 'JP', 'Japan', 35.7653, 140.3855, 'Asia/Tokyo', TRUE, TRUE),
('ICN', 'RKSI', 'Incheon International Airport', 'Seoul', 'KR', 'South Korea', 37.4602, 126.4407, 'Asia/Seoul', TRUE, TRUE),
('SYD', 'YSSY', 'Sydney Kingsford Smith Airport', 'Sydney', 'AU', 'Australia', -33.9399, 151.1753, 'Australia/Sydney', TRUE, TRUE),
('JFK', 'KJFK', 'John F. Kennedy International Airport', 'New York', 'US', 'United States', 40.6413, -73.7781, 'America/New_York', TRUE, TRUE)
ON CONFLICT (iata_code) DO NOTHING;

-- Seed popular flight routes
INSERT INTO flight_routes (origin_airport_code, destination_airport_code, route_name, distance_km, popular_route, average_duration_minutes) VALUES
('BOM', 'DXB', 'Mumbai - Dubai', 1925, TRUE, 210),
('DEL', 'DXB', 'Delhi - Dubai', 2202, TRUE, 230),
('BLR', 'DXB', 'Bangalore - Dubai', 2690, TRUE, 285),
('BOM', 'DOH', 'Mumbai - Doha', 1854, TRUE, 200),
('DEL', 'DOH', 'Delhi - Doha', 2131, TRUE, 220),
('BOM', 'LHR', 'Mumbai - London', 7208, TRUE, 540),
('DEL', 'LHR', 'Delhi - London', 6735, TRUE, 520),
('BOM', 'SIN', 'Mumbai - Singapore', 5151, TRUE, 375),
('DEL', 'SIN', 'Delhi - Singapore', 4648, TRUE, 355),
('BOM', 'FRA', 'Mumbai - Frankfurt', 6116, TRUE, 480),
('DXB', 'BOM', 'Dubai - Mumbai', 1925, TRUE, 185),
('DXB', 'DEL', 'Dubai - Delhi', 2202, TRUE, 200),
('DOH', 'BOM', 'Doha - Mumbai', 1854, TRUE, 180),
('LHR', 'BOM', 'London - Mumbai', 7208, TRUE, 520),
('SIN', 'BOM', 'Singapore - Mumbai', 5151, TRUE, 355)
ON CONFLICT (origin_airport_code, destination_airport_code) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW flight_search_view AS
SELECT 
    f.id,
    f.flight_number,
    a.iata_code as airline_code,
    a.name as airline_name,
    orig.iata_code as origin_code,
    orig.name as origin_airport,
    orig.city as origin_city,
    dest.iata_code as destination_code,
    dest.name as destination_airport,
    dest.city as destination_city,
    f.departure_datetime,
    f.arrival_datetime,
    f.duration_minutes,
    f.seats_available,
    f.base_price_economy,
    f.base_price_business,
    f.status,
    f.aircraft_type_id,
    at.model as aircraft_model
FROM flights f
JOIN airlines a ON f.airline_id = a.id
JOIN airports orig ON f.origin_airport_id = orig.id
JOIN airports dest ON f.destination_airport_id = dest.id
LEFT JOIN aircraft_types at ON f.aircraft_type_id = at.id
WHERE f.active = TRUE AND a.active = TRUE;

-- Grant permissions (adjust as needed for your user setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_api_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_api_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_api_user;
