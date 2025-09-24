-- Fixed Packages Database Schema for Faredown
-- PostgreSQL implementation with destinations master and packages system
-- Integrates with existing bargain system and follows existing patterns

-- ====================
-- EXTENSIONS & TRIGGERS
-- ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================
-- DESTINATIONS MASTER
-- ====================

-- Regions table - hierarchical structure for organizing destinations
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    sort_order INTEGER DEFAULT 0,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    iso_code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    calling_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10), -- IATA or custom code
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_id, name)
);

-- ====================
-- PACKAGES CORE TABLES
-- ====================

-- Main packages table
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    
    -- Destination linkage
    region_id INTEGER REFERENCES regions(id),
    country_id INTEGER REFERENCES countries(id),
    city_id INTEGER REFERENCES cities(id),
    
    -- Package details
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    duration_nights INTEGER NOT NULL CHECK (duration_nights >= 0),
    overview TEXT,
    description TEXT,
    highlights JSONB, -- Array of key highlights
    
    -- Pricing
    base_price_pp DECIMAL(12,2) NOT NULL CHECK (base_price_pp >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    
    -- Images and media
    hero_image_url TEXT,
    gallery_images JSONB, -- Array of image URLs
    video_url TEXT,
    
    -- Package type and categorization
    package_type VARCHAR(50) DEFAULT 'fixed', -- fixed, customizable
    category VARCHAR(100), -- honeymoon, family, adventure, cultural, etc.
    themes JSONB, -- Array of themes: ["heritage", "nature", "shopping"]
    
    -- Supplier information
    supplier_source VARCHAR(20) NOT NULL DEFAULT 'manual', -- manual, api
    supplier_id INTEGER REFERENCES suppliers(id),
    supplier_ref VARCHAR(120),
    supplier_data JSONB, -- Full supplier API response
    
    -- SEO and metadata
    seo_meta_title VARCHAR(255),
    seo_meta_description VARCHAR(320),
    seo_keywords TEXT,
    
    -- Features and inclusions/exclusions
    inclusions JSONB, -- Array of included items
    exclusions JSONB, -- Array of excluded items
    terms_conditions TEXT,
    cancellation_policy TEXT,
    
    -- Status and ratings
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, archived
    is_featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Special flags
    visa_required BOOLEAN DEFAULT FALSE,
    passport_required BOOLEAN DEFAULT TRUE,
    minimum_age INTEGER DEFAULT 0,
    maximum_group_size INTEGER DEFAULT 50,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Package media table for multiple images/videos
CREATE TABLE IF NOT EXISTS package_media (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- image, video, pdf
    title VARCHAR(255),
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Package itinerary - day by day breakdown
CREATE TABLE IF NOT EXISTS package_itinerary_days (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number > 0),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cities VARCHAR(255), -- Cities visited on this day
    meals_included VARCHAR(100), -- Breakfast, Lunch, Dinner
    accommodation TEXT,
    activities JSONB, -- Array of activities for the day
    transport VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_id, day_number)
);

-- Package departures - specific dates and pricing
CREATE TABLE IF NOT EXISTS package_departures (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    
    -- Departure details
    departure_city_code VARCHAR(10) NOT NULL,
    departure_city_name VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    
    -- Availability
    total_seats INTEGER NOT NULL CHECK (total_seats >= 0),
    booked_seats INTEGER NOT NULL DEFAULT 0 CHECK (booked_seats >= 0),
    available_seats INTEGER GENERATED ALWAYS AS (total_seats - booked_seats) STORED,
    
    -- Pricing per person (twin sharing basis)
    price_per_person DECIMAL(12,2) NOT NULL CHECK (price_per_person >= 0),
    single_supplement DECIMAL(12,2) DEFAULT 0,
    child_price DECIMAL(12,2), -- Price for children (if different)
    infant_price DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    
    -- Special pricing
    early_bird_discount DECIMAL(5,2) DEFAULT 0, -- Percentage discount
    early_bird_deadline DATE,
    last_minute_discount DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_guaranteed BOOLEAN DEFAULT FALSE, -- Guaranteed departure
    
    -- Notes
    special_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(package_id, departure_city_code, departure_date)
);

-- Package tags for filtering and search
CREATE TABLE IF NOT EXISTS package_tags (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_id, tag)
);

-- Package pricing tiers (optional - for group size based pricing)
CREATE TABLE IF NOT EXISTS package_pricing_tiers (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    departure_id INTEGER REFERENCES package_departures(id) ON DELETE CASCADE,
    min_passengers INTEGER NOT NULL CHECK (min_passengers > 0),
    max_passengers INTEGER NOT NULL CHECK (max_passengers >= min_passengers),
    price_per_person DECIMAL(12,2) NOT NULL CHECK (price_per_person >= 0),
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================
-- BOOKINGS INTEGRATION
-- ====================

-- Package bookings table
CREATE TABLE IF NOT EXISTS package_bookings (
    id SERIAL PRIMARY KEY,
    booking_ref VARCHAR(50) NOT NULL UNIQUE, -- PKG12345678 format
    
    -- Package and departure details
    package_id INTEGER NOT NULL REFERENCES packages(id),
    departure_id INTEGER NOT NULL REFERENCES package_departures(id),
    
    -- User and guest details
    user_id INTEGER REFERENCES users(id),
    primary_guest_name VARCHAR(255) NOT NULL,
    primary_guest_email VARCHAR(255) NOT NULL,
    primary_guest_phone VARCHAR(20),
    guest_details JSONB NOT NULL, -- Detailed guest information
    
    -- Booking details
    adults_count INTEGER NOT NULL DEFAULT 1 CHECK (adults_count > 0),
    children_count INTEGER DEFAULT 0 CHECK (children_count >= 0),
    infants_count INTEGER DEFAULT 0 CHECK (infants_count >= 0),
    room_configuration VARCHAR(100), -- "2 Twin Rooms", "1 Double Room", etc.
    
    -- Pricing breakdown
    base_price_per_adult DECIMAL(12,2) NOT NULL,
    base_price_per_child DECIMAL(12,2) DEFAULT 0,
    base_price_per_infant DECIMAL(12,2) DEFAULT 0,
    base_total DECIMAL(12,2) NOT NULL,
    
    -- Bargain integration
    bargain_session_id VARCHAR(255),
    original_total DECIMAL(12,2) NOT NULL,
    bargain_discount DECIMAL(12,2) DEFAULT 0,
    agreed_total DECIMAL(12,2) NOT NULL,
    
    -- Additional charges and discounts
    single_supplement_charges DECIMAL(12,2) DEFAULT 0,
    markup_amount DECIMAL(12,2) DEFAULT 0,
    promo_code VARCHAR(50),
    promo_discount DECIMAL(12,2) DEFAULT 0,
    taxes_and_fees DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    
    -- Payment details
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Booking status
    booking_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, completed
    confirmation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancellation_date TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Special requirements
    special_requests TEXT,
    dietary_requirements TEXT,
    mobility_requirements TEXT,
    passport_details JSONB, -- For international packages
    
    -- Supplier integration
    supplier_booking_ref VARCHAR(255),
    supplier_confirmation_number VARCHAR(255),
    supplier_status VARCHAR(50),
    supplier_response JSONB,
    
    -- Internal notes and tracking
    internal_notes TEXT,
    agent_id INTEGER, -- If booked by agent
    commission_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Package reviews and ratings
CREATE TABLE IF NOT EXISTS package_reviews (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES package_bookings(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id),
    
    -- Review details
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    review_text TEXT,
    
    -- Experience ratings
    value_for_money INTEGER CHECK (value_for_money BETWEEN 1 AND 5),
    itinerary_rating INTEGER CHECK (itinerary_rating BETWEEN 1 AND 5),
    accommodation_rating INTEGER CHECK (accommodation_rating BETWEEN 1 AND 5),
    transport_rating INTEGER CHECK (transport_rating BETWEEN 1 AND 5),
    guide_rating INTEGER CHECK (guide_rating BETWEEN 1 AND 5),
    
    -- Reviewer details
    reviewer_name VARCHAR(255),
    reviewer_email VARCHAR(255),
    reviewer_location VARCHAR(100),
    travel_date DATE,
    traveler_type VARCHAR(50), -- family, couple, solo, friends, business
    
    -- Moderation
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================
-- SUPPLIER SYNC TRACKING
-- ====================

-- Track supplier API synchronization
CREATE TABLE IF NOT EXISTS package_supplier_sync (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
    supplier_name VARCHAR(100) NOT NULL,
    sync_type VARCHAR(50) NOT NULL, -- full_sync, price_update, availability_update
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) NOT NULL, -- success, failed, partial
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    sync_log JSONB, -- Detailed sync information
    next_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================
-- INDEXES FOR PERFORMANCE
-- ====================

-- Regions indexes
CREATE INDEX IF NOT EXISTS idx_regions_parent_id ON regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_level ON regions(level);
CREATE INDEX IF NOT EXISTS idx_regions_slug ON regions(slug);
CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(is_active);

-- Countries indexes  
CREATE INDEX IF NOT EXISTS idx_countries_region_id ON countries(region_id);
CREATE INDEX IF NOT EXISTS idx_countries_iso_code ON countries(iso_code);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);

-- Cities indexes
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_region_id ON cities(region_id);
CREATE INDEX IF NOT EXISTS idx_cities_code ON cities(code);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active);

-- Packages indexes
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_region_id ON packages(region_id);
CREATE INDEX IF NOT EXISTS idx_packages_country_id ON packages(country_id);
CREATE INDEX IF NOT EXISTS idx_packages_city_id ON packages(city_id);
CREATE INDEX IF NOT EXISTS idx_packages_category ON packages(category);
CREATE INDEX IF NOT EXISTS idx_packages_featured ON packages(is_featured);
CREATE INDEX IF NOT EXISTS idx_packages_duration ON packages(duration_days);
CREATE INDEX IF NOT EXISTS idx_packages_price ON packages(base_price_pp);
CREATE INDEX IF NOT EXISTS idx_packages_title_search ON packages USING GIN (title gin_trgm_ops);

-- Package departures indexes
CREATE INDEX IF NOT EXISTS idx_departures_package_id ON package_departures(package_id);
CREATE INDEX IF NOT EXISTS idx_departures_date ON package_departures(departure_date);
CREATE INDEX IF NOT EXISTS idx_departures_city ON package_departures(departure_city_code);
CREATE INDEX IF NOT EXISTS idx_departures_active ON package_departures(is_active);
CREATE INDEX IF NOT EXISTS idx_departures_available ON package_departures(total_seats, booked_seats);

-- Package bookings indexes
CREATE INDEX IF NOT EXISTS idx_package_bookings_ref ON package_bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_package_bookings_package_id ON package_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_departure_id ON package_bookings(departure_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_user_id ON package_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_status ON package_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_payment_status ON package_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_date ON package_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_package_bookings_email ON package_bookings(primary_guest_email);

-- Package tags indexes
CREATE INDEX IF NOT EXISTS idx_package_tags_package_id ON package_tags(package_id);
CREATE INDEX IF NOT EXISTS idx_package_tags_tag ON package_tags(tag);

-- ====================
-- TRIGGERS FOR updated_at
-- ====================

CREATE TRIGGER trigger_regions_updated_at BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_cities_updated_at BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_package_itinerary_updated_at BEFORE UPDATE ON package_itinerary_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_package_departures_updated_at BEFORE UPDATE ON package_departures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_package_pricing_tiers_updated_at BEFORE UPDATE ON package_pricing_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_package_bookings_updated_at BEFORE UPDATE ON package_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_package_reviews_updated_at BEFORE UPDATE ON package_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================
-- VIEWS FOR API EFFICIENCY
-- ====================

-- View for package listing with next departure info
CREATE OR REPLACE VIEW v_packages_listing AS
SELECT 
    p.*,
    r.name as region_name,
    c.name as country_name,
    ci.name as city_name,
    (
        SELECT pd.departure_date 
        FROM package_departures pd 
        WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.departure_date >= CURRENT_DATE 
          AND pd.available_seats > 0
        ORDER BY pd.departure_date ASC 
        LIMIT 1
    ) as next_departure_date,
    (
        SELECT pd.price_per_person 
        FROM package_departures pd 
        WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.departure_date >= CURRENT_DATE 
          AND pd.available_seats > 0
        ORDER BY pd.price_per_person ASC 
        LIMIT 1
    ) as from_price,
    (
        SELECT COUNT(*) 
        FROM package_departures pd 
        WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.departure_date >= CURRENT_DATE 
          AND pd.available_seats > 0
    ) as available_departures_count
FROM packages p
LEFT JOIN regions r ON p.region_id = r.id
LEFT JOIN countries c ON p.country_id = c.id
LEFT JOIN cities ci ON p.city_id = ci.id
WHERE p.status = 'active';

-- View for destination hierarchy (for menus)
CREATE OR REPLACE VIEW v_destination_hierarchy AS
WITH RECURSIVE region_tree AS (
    -- Base case: root regions (level 1)
    SELECT 
        id, name, parent_id, level, sort_order,
        ARRAY[id] as path,
        name as full_path
    FROM regions 
    WHERE parent_id IS NULL AND is_active = TRUE
    
    UNION ALL
    
    -- Recursive case: child regions
    SELECT 
        r.id, r.name, r.parent_id, r.level, r.sort_order,
        rt.path || r.id,
        rt.full_path || ' > ' || r.name
    FROM regions r
    INNER JOIN region_tree rt ON r.parent_id = rt.id
    WHERE r.is_active = TRUE
)
SELECT 
    rt.*,
    (
        SELECT json_agg(
            json_build_object(
                'id', c.id,
                'name', c.name,
                'iso_code', c.iso_code,
                'currency', c.currency,
                'cities', (
                    SELECT json_agg(
                        json_build_object(
                            'id', ci.id,
                            'name', ci.name,
                            'code', ci.code
                        )
                        ORDER BY ci.name
                    )
                    FROM cities ci 
                    WHERE ci.country_id = c.id AND ci.is_active = TRUE
                )
            )
            ORDER BY c.name
        )
        FROM countries c 
        WHERE c.region_id = rt.id AND c.is_active = TRUE
    ) as countries
FROM region_tree rt
ORDER BY rt.level, rt.sort_order, rt.name;

-- View for package details with all related information
CREATE OR REPLACE VIEW v_package_details AS
SELECT 
    p.*,
    r.name as region_name,
    c.name as country_name,
    ci.name as city_name,
    (
        SELECT json_agg(
            json_build_object(
                'day_number', pid.day_number,
                'title', pid.title,
                'description', pid.description,
                'cities', pid.cities,
                'meals_included', pid.meals_included,
                'accommodation', pid.accommodation,
                'activities', pid.activities,
                'transport', pid.transport
            )
            ORDER BY pid.day_number
        )
        FROM package_itinerary_days pid 
        WHERE pid.package_id = p.id
    ) as itinerary,
    (
        SELECT json_agg(
            json_build_object(
                'id', pd.id,
                'departure_city_code', pd.departure_city_code,
                'departure_city_name', pd.departure_city_name,
                'departure_date', pd.departure_date,
                'return_date', pd.return_date,
                'price_per_person', pd.price_per_person,
                'single_supplement', pd.single_supplement,
                'child_price', pd.child_price,
                'currency', pd.currency,
                'available_seats', pd.available_seats,
                'is_guaranteed', pd.is_guaranteed
            )
            ORDER BY pd.departure_date
        )
        FROM package_departures pd 
        WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.departure_date >= CURRENT_DATE
    ) as departures,
    (
        SELECT json_agg(pt.tag)
        FROM package_tags pt 
        WHERE pt.package_id = p.id
    ) as tags,
    (
        SELECT json_agg(
            json_build_object(
                'url', pm.url,
                'type', pm.type,
                'title', pm.title,
                'alt_text', pm.alt_text
            )
            ORDER BY pm.sort_order
        )
        FROM package_media pm 
        WHERE pm.package_id = p.id
    ) as media
FROM packages p
LEFT JOIN regions r ON p.region_id = r.id
LEFT JOIN countries c ON p.country_id = c.id
LEFT JOIN cities ci ON p.city_id = ci.id;

-- ====================
-- COMMENTS FOR DOCUMENTATION
-- ====================

COMMENT ON TABLE regions IS 'Hierarchical master table for organizing destinations (continents, countries, states, cities)';
COMMENT ON TABLE countries IS 'Master table of countries with their regions and currency information';
COMMENT ON TABLE cities IS 'Master table of cities linked to countries and regions';
COMMENT ON TABLE packages IS 'Main packages catalog with destination linkage and detailed information';
COMMENT ON TABLE package_departures IS 'Specific departure dates and pricing for each package';
COMMENT ON TABLE package_bookings IS 'Customer bookings for packages with pricing and guest details';
COMMENT ON TABLE package_itinerary_days IS 'Day-by-day itinerary breakdown for packages';
COMMENT ON TABLE package_reviews IS 'Customer reviews and ratings for packages';
COMMENT ON TABLE package_supplier_sync IS 'Tracking table for supplier API synchronization';

-- End of schema
