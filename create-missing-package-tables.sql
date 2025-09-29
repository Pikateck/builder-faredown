-- ================================================
-- CREATE MISSING PACKAGE TABLES
-- ================================================
-- Tables needed for full packages functionality

-- Package tags table for categorizing packages
CREATE TABLE IF NOT EXISTS package_tags (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_id, tag)
);

-- Package media table for images and videos
CREATE TABLE IF NOT EXISTS package_media (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'thumbnail')),
    title VARCHAR(255),
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_hero BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Package itinerary days table for day-by-day breakdown
CREATE TABLE IF NOT EXISTS package_itinerary_days (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cities TEXT[],
    meals_included TEXT[],
    accommodation TEXT,
    activities TEXT[],
    transport TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_id, day_number)
);

-- Package reviews table for customer feedback
CREATE TABLE IF NOT EXISTS package_reviews (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    review_text TEXT,
    reviewer_name VARCHAR(255),
    reviewer_location VARCHAR(255),
    travel_date DATE,
    traveler_type VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Package bookings table for customer bookings
CREATE TABLE IF NOT EXISTS package_bookings (
    id SERIAL PRIMARY KEY,
    booking_ref VARCHAR(50) NOT NULL UNIQUE,
    package_id INTEGER NOT NULL REFERENCES packages(id),
    departure_id INTEGER NOT NULL REFERENCES package_departures(id),
    customer_details JSONB NOT NULL,
    guest_details JSONB NOT NULL,
    contact_info JSONB NOT NULL,
    total_travelers INTEGER NOT NULL,
    adult_count INTEGER NOT NULL DEFAULT 1,
    child_count INTEGER DEFAULT 0,
    infant_count INTEGER DEFAULT 0,
    room_configuration JSONB,
    base_amount DECIMAL(12,2) NOT NULL,
    taxes_amount DECIMAL(12,2) DEFAULT 0,
    markup_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'failed', 'refunded')),
    booking_status VARCHAR(20) DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    special_requests TEXT,
    voucher_generated BOOLEAN DEFAULT FALSE,
    voucher_sent BOOLEAN DEFAULT FALSE,
    supplier_reference VARCHAR(100),
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    travel_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Package supplier sync table for tracking API synchronization
CREATE TABLE IF NOT EXISTS package_supplier_sync (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    supplier_name VARCHAR(100) NOT NULL,
    supplier_package_id VARCHAR(255),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'failed')),
    sync_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_package_tags_package_id ON package_tags(package_id);
CREATE INDEX IF NOT EXISTS idx_package_tags_tag ON package_tags(tag);

CREATE INDEX IF NOT EXISTS idx_package_media_package_id ON package_media(package_id);
CREATE INDEX IF NOT EXISTS idx_package_media_type ON package_media(type);
CREATE INDEX IF NOT EXISTS idx_package_media_hero ON package_media(is_hero) WHERE is_hero = TRUE;

CREATE INDEX IF NOT EXISTS idx_package_itinerary_package_id ON package_itinerary_days(package_id);
CREATE INDEX IF NOT EXISTS idx_package_itinerary_day ON package_itinerary_days(day_number);

CREATE INDEX IF NOT EXISTS idx_package_reviews_package_id ON package_reviews(package_id);
CREATE INDEX IF NOT EXISTS idx_package_reviews_rating ON package_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_package_reviews_published ON package_reviews(is_published) WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_package_bookings_ref ON package_bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_package_bookings_package_id ON package_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_status ON package_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_date ON package_bookings(booking_date);

CREATE INDEX IF NOT EXISTS idx_package_supplier_sync_package_id ON package_supplier_sync(package_id);
CREATE INDEX IF NOT EXISTS idx_package_supplier_sync_supplier ON package_supplier_sync(supplier_name);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_package_reviews_updated_at ON package_reviews;
CREATE TRIGGER trigger_package_reviews_updated_at 
    BEFORE UPDATE ON package_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_package_bookings_updated_at ON package_bookings;
CREATE TRIGGER trigger_package_bookings_updated_at 
    BEFORE UPDATE ON package_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_package_supplier_sync_updated_at ON package_supplier_sync;
CREATE TRIGGER trigger_package_supplier_sync_updated_at 
    BEFORE UPDATE ON package_supplier_sync
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample tags for our packages
INSERT INTO package_tags (package_id, tag) 
SELECT 
    p.id,
    CASE 
        WHEN p.package_category = 'luxury' THEN 'luxury'
        WHEN p.package_category = 'cultural' THEN 'cultural'
        WHEN p.package_category = 'adventure' THEN 'adventure'
        WHEN p.package_category = 'beach' THEN 'beach'
        WHEN p.package_category = 'romantic' THEN 'romantic'
        WHEN p.package_category = 'seasonal' THEN 'seasonal'
        WHEN p.package_category = 'urban' THEN 'urban'
        ELSE 'standard'
    END as tag
FROM packages p
WHERE p.status = 'active'
ON CONFLICT (package_id, tag) DO NOTHING;

-- Add duration-based tags
INSERT INTO package_tags (package_id, tag)
SELECT 
    p.id,
    CASE 
        WHEN p.duration_days <= 3 THEN 'short-break'
        WHEN p.duration_days <= 7 THEN 'week-long'
        WHEN p.duration_days <= 14 THEN 'extended'
        ELSE 'long-stay'
    END as tag
FROM packages p 
WHERE p.status = 'active'
ON CONFLICT (package_id, tag) DO NOTHING;

-- Add price-based tags
INSERT INTO package_tags (package_id, tag)
SELECT 
    p.id,
    CASE 
        WHEN p.base_price_pp < 100000 THEN 'budget-friendly'
        WHEN p.base_price_pp < 200000 THEN 'mid-range'
        WHEN p.base_price_pp < 300000 THEN 'premium'
        ELSE 'luxury-tier'
    END as tag
FROM packages p 
WHERE p.status = 'active'
ON CONFLICT (package_id, tag) DO NOTHING;

-- Show completion summary
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully created all missing package tables!';
    RAISE NOTICE '📋 Tables created: package_tags, package_media, package_itinerary_days, package_reviews, package_bookings, package_supplier_sync';
    RAISE NOTICE '🏷️ Package tags inserted: %', (SELECT COUNT(*) FROM package_tags);
    RAISE NOTICE '📦 Packages ready for full functionality!';
END $$;
