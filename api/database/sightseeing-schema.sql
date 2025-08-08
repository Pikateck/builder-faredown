-- Sightseeing (Activities) Database Schema for Faredown
-- PostgreSQL implementation matching Hotels module architecture

-- Sightseeing items table - stores activity/attraction data
CREATE TABLE sightseeing_items (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    
    -- Activity details from Hotelbeds API
    activity_code VARCHAR(100) NOT NULL UNIQUE, -- Hotelbeds activity code
    activity_name VARCHAR(255) NOT NULL,
    activity_description TEXT,
    activity_type VARCHAR(100), -- 'tour', 'experience', 'attraction', 'transfer'
    category VARCHAR(100), -- 'museum', 'landmark', 'food', 'adventure', 'culture'
    
    -- Location details
    destination_code VARCHAR(50), -- Dubai, London, etc.
    destination_name VARCHAR(100),
    city VARCHAR(100),
    country VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Activity specifics
    duration_minutes INTEGER, -- Duration in minutes
    duration_text VARCHAR(100), -- "2-3 hours", "Full day"
    minimum_age INTEGER DEFAULT 0,
    maximum_age INTEGER,
    difficulty_level VARCHAR(50), -- 'easy', 'moderate', 'challenging'
    
    -- Pricing information
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    price_per VARCHAR(20) DEFAULT 'person', -- 'person', 'group', 'family'
    
    -- Availability
    available_days VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekdays', 'weekends', 'custom'
    available_times JSONB, -- ["09:00", "11:00", "14:00", "16:30"]
    seasonal_availability JSONB, -- {start: "2025-01-01", end: "2025-12-31"}
    
    -- Images and media
    main_image_url VARCHAR(500),
    gallery_images JSONB, -- Array of image URLs
    video_url VARCHAR(500),
    
    -- Features and inclusions
    highlights JSONB, -- Array of highlight points
    includes JSONB, -- What's included in the price
    excludes JSONB, -- What's not included
    requirements JSONB, -- What customers need to bring/know
    cancellation_policy TEXT,
    
    -- Ratings and reviews
    rating DECIMAL(3,2) DEFAULT 0.00, -- 4.5 stars
    review_count INTEGER DEFAULT 0,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    supplier_data JSONB, -- Full data from Hotelbeds API
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sightseeing bookings table - main booking storage
CREATE TABLE sightseeing_bookings (
    id SERIAL PRIMARY KEY,
    booking_ref VARCHAR(50) NOT NULL UNIQUE, -- SG12345678 format
    supplier_id INTEGER REFERENCES suppliers(id),
    user_id INTEGER REFERENCES users(id),
    activity_id INTEGER REFERENCES sightseeing_items(id),
    
    -- Activity details at booking time
    activity_code VARCHAR(100) NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    destination_name VARCHAR(100),
    
    -- Booking details
    visit_date DATE NOT NULL,
    visit_time TIME, -- Selected time slot
    duration_text VARCHAR(100),
    
    -- Guest details
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER DEFAULT 0,
    children_ages INTEGER[], -- Array of child ages
    guest_details JSONB NOT NULL, -- {primaryGuest: {}, additionalGuests: [], contactInfo: {}}
    
    -- Ticket type selection
    ticket_type VARCHAR(100), -- "Standard", "VIP", "Group", etc.
    ticket_features JSONB, -- What's included in selected ticket type
    
    -- Pricing details
    base_price DECIMAL(10,2) NOT NULL, -- Price per person from supplier
    base_total DECIMAL(10,2) NOT NULL, -- Base price * guests
    markup_amount DECIMAL(10,2) DEFAULT 0.00,
    markup_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00, -- From promo codes
    taxes DECIMAL(10,2) DEFAULT 0.00,
    fees DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL, -- Final amount paid
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Promo code details
    promo_code VARCHAR(50),
    promo_discount_type VARCHAR(20), -- 'percentage', 'fixed'
    promo_discount_value DECIMAL(10,2),
    
    -- Booking status
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed, failed
    supplier_booking_ref VARCHAR(255), -- Reference from Hotelbeds
    supplier_response JSONB, -- Full response from supplier
    
    -- Special requests and preferences
    special_requests TEXT,
    dietary_requirements TEXT,
    mobility_requirements TEXT,
    language_preference VARCHAR(50),
    
    -- Pickup details (for tours with pickup)
    pickup_required BOOLEAN DEFAULT false,
    pickup_location TEXT,
    pickup_time TIME,
    
    -- Internal notes
    internal_notes TEXT,
    
    -- Timestamps
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmation_date TIMESTAMP WITH TIME ZONE,
    cancellation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sightseeing markup rules table
CREATE TABLE sightseeing_markup_rules (
    id SERIAL PRIMARY KEY,
    
    -- Rule identification
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'destination', 'category', 'supplier', 'global'
    
    -- Rule conditions
    destination_code VARCHAR(50), -- Apply to specific destination
    category VARCHAR(100), -- Apply to specific category
    supplier_id INTEGER REFERENCES suppliers(id), -- Apply to specific supplier
    activity_type VARCHAR(100), -- Apply to specific activity type
    
    -- Date range conditions
    valid_from DATE,
    valid_to DATE,
    
    -- Markup configuration
    markup_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
    markup_value DECIMAL(10,2) NOT NULL,
    minimum_margin DECIMAL(10,2) DEFAULT 0.00,
    maximum_markup DECIMAL(10,2),
    
    -- Priority and status
    priority INTEGER DEFAULT 1, -- Higher number = higher priority
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    description TEXT,
    created_by VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sightseeing promo codes table
CREATE TABLE sightseeing_promocodes (
    id SERIAL PRIMARY KEY,
    
    -- Promo code details
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Discount configuration
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    discount_value DECIMAL(10,2) NOT NULL,
    maximum_discount DECIMAL(10,2), -- Cap for percentage discounts
    minimum_booking_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Usage limits
    usage_limit INTEGER, -- Total uses allowed
    usage_count INTEGER DEFAULT 0, -- Current usage count
    usage_limit_per_user INTEGER DEFAULT 1,
    
    -- Validity period
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Conditions
    applicable_destinations JSONB, -- Array of destination codes
    applicable_categories JSONB, -- Array of categories
    minimum_guests INTEGER DEFAULT 1,
    
    -- User restrictions
    first_booking_only BOOLEAN DEFAULT false,
    user_email_domain VARCHAR(100), -- Restrict to specific email domains
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    created_by VARCHAR(255),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sightseeing promo code usage tracking
CREATE TABLE sightseeing_promo_usage (
    id SERIAL PRIMARY KEY,
    promo_id INTEGER REFERENCES sightseeing_promocodes(id),
    booking_id INTEGER REFERENCES sightseeing_bookings(id),
    user_email VARCHAR(255),
    discount_applied DECIMAL(10,2),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_sightseeing_items_activity_code ON sightseeing_items(activity_code);
CREATE INDEX idx_sightseeing_items_destination_code ON sightseeing_items(destination_code);
CREATE INDEX idx_sightseeing_items_category ON sightseeing_items(category);
CREATE INDEX idx_sightseeing_items_is_active ON sightseeing_items(is_active);
CREATE INDEX idx_sightseeing_items_is_featured ON sightseeing_items(is_featured);

CREATE INDEX idx_sightseeing_bookings_booking_ref ON sightseeing_bookings(booking_ref);
CREATE INDEX idx_sightseeing_bookings_status ON sightseeing_bookings(status);
CREATE INDEX idx_sightseeing_bookings_visit_date ON sightseeing_bookings(visit_date);
CREATE INDEX idx_sightseeing_bookings_booking_date ON sightseeing_bookings(booking_date);
CREATE INDEX idx_sightseeing_bookings_activity_id ON sightseeing_bookings(activity_id);

CREATE INDEX idx_sightseeing_markup_rules_destination ON sightseeing_markup_rules(destination_code);
CREATE INDEX idx_sightseeing_markup_rules_category ON sightseeing_markup_rules(category);
CREATE INDEX idx_sightseeing_markup_rules_is_active ON sightseeing_markup_rules(is_active);
CREATE INDEX idx_sightseeing_markup_rules_priority ON sightseeing_markup_rules(priority DESC);

CREATE INDEX idx_sightseeing_promocodes_code ON sightseeing_promocodes(code);
CREATE INDEX idx_sightseeing_promocodes_is_active ON sightseeing_promocodes(is_active);
CREATE INDEX idx_sightseeing_promocodes_valid_period ON sightseeing_promocodes(valid_from, valid_to);

-- Create triggers for updated_at
CREATE TRIGGER update_sightseeing_items_updated_at 
    BEFORE UPDATE ON sightseeing_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sightseeing_bookings_updated_at 
    BEFORE UPDATE ON sightseeing_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sightseeing_markup_rules_updated_at 
    BEFORE UPDATE ON sightseeing_markup_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sightseeing_promocodes_updated_at 
    BEFORE UPDATE ON sightseeing_promocodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default markup rules
INSERT INTO sightseeing_markup_rules (
    rule_name, rule_type, markup_type, markup_value, priority, description, created_by
) VALUES 
('Global Default Markup', 'global', 'percentage', 15.00, 1, 'Default 15% markup for all sightseeing activities', 'system'),
('Dubai Premium Markup', 'destination', 'percentage', 18.00, 2, 'Higher markup for Dubai attractions', 'system'),
('Museum Standard Markup', 'category', 'percentage', 12.00, 3, 'Lower markup for museum entries', 'system'),
('Adventure Premium Markup', 'category', 'percentage', 20.00, 3, 'Higher markup for adventure activities', 'system')
ON CONFLICT DO NOTHING;

-- Insert sample promo codes
INSERT INTO sightseeing_promocodes (
    code, title, description, discount_type, discount_value, maximum_discount,
    minimum_booking_amount, usage_limit, valid_from, valid_to, is_active, created_by
) VALUES 
('SIGHTSEEING10', '10% Off Sightseeing', 'Get 10% discount on all sightseeing bookings', 
 'percentage', 10.00, 500.00, 100.00, 1000, 
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '3 months', true, 'system'),
('DUBAI500', 'Dubai Special ₹500 Off', 'Flat ₹500 off on Dubai attractions', 
 'fixed', 500.00, NULL, 2000.00, 500, 
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 months', true, 'system'),
('FIRSTSIGHT20', 'First Booking 20% Off', '20% off for first-time sightseeing customers', 
 'percentage', 20.00, 1000.00, 500.00, NULL, 
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 months', true, 'system')
ON CONFLICT (code) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW sightseeing_booking_summary AS
SELECT 
    sb.id,
    sb.booking_ref,
    sb.activity_name,
    sb.destination_name,
    sb.category,
    sb.visit_date,
    sb.visit_time,
    sb.adults_count,
    sb.children_count,
    sb.total_amount,
    sb.currency,
    sb.status,
    sb.promo_code,
    s.name as supplier_name,
    sb.booking_date,
    (sb.guest_details->>'primaryGuest'->>'firstName')::text || ' ' || 
    (sb.guest_details->>'primaryGuest'->>'lastName')::text as guest_name,
    sb.guest_details->>'contactInfo'->>'email' as guest_email,
    sb.guest_details->>'contactInfo'->>'phone' as guest_phone
FROM sightseeing_bookings sb
LEFT JOIN suppliers s ON sb.supplier_id = s.id
ORDER BY sb.booking_date DESC;

-- Create view for revenue analytics
CREATE OR REPLACE VIEW sightseeing_revenue_analytics AS
SELECT 
    DATE_TRUNC('month', sb.booking_date) as month,
    sb.destination_name,
    sb.category,
    COUNT(*) as bookings_count,
    SUM(sb.total_amount) as total_revenue,
    AVG(sb.total_amount) as average_booking_value,
    SUM(sb.markup_amount) as total_markup,
    SUM(sb.discount_amount) as total_discounts,
    s.name as supplier_name
FROM sightseeing_bookings sb
LEFT JOIN suppliers s ON sb.supplier_id = s.id
WHERE sb.status IN ('confirmed', 'completed')
GROUP BY DATE_TRUNC('month', sb.booking_date), sb.destination_name, sb.category, s.name
ORDER BY month DESC;

-- Comments for documentation
COMMENT ON TABLE sightseeing_items IS 'Master catalog of all sightseeing activities and attractions with details from Hotelbeds API';
COMMENT ON TABLE sightseeing_bookings IS 'All sightseeing bookings with guest details, pricing, and activity information';
COMMENT ON TABLE sightseeing_markup_rules IS 'Configurable markup rules for different destinations, categories, and suppliers';
COMMENT ON TABLE sightseeing_promocodes IS 'Promotional codes specific to sightseeing bookings with usage tracking';
COMMENT ON TABLE sightseeing_promo_usage IS 'Tracks usage of promotional codes by bookings and users';
