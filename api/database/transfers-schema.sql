-- Transfers Database Schema for Faredown
-- PostgreSQL implementation matching Hotels and Sightseeing module architecture

-- Transfer suppliers table (extends existing suppliers table for transfers-specific data)
CREATE TABLE transfer_suppliers (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    
    -- Transfers-specific configuration
    supports_airports BOOLEAN DEFAULT true,
    supports_hotels BOOLEAN DEFAULT true,
    supports_addresses BOOLEAN DEFAULT true,
    supports_realtime_tracking BOOLEAN DEFAULT false,
    supports_flight_monitoring BOOLEAN DEFAULT false,
    
    -- Service areas
    service_areas JSONB, -- Array of city/country codes where transfers are available
    vehicle_types JSONB, -- Supported vehicle types: ["sedan", "suv", "minivan", "luxury", "wheelchair"]
    
    -- Pricing configuration
    base_rate_per_km DECIMAL(10,2),
    airport_surcharge DECIMAL(10,2) DEFAULT 0.00,
    night_surcharge_percentage DECIMAL(5,2) DEFAULT 0.00, -- 10% extra for 22:00-06:00
    wait_time_rate_per_minute DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer routes cache - stores common routes and pricing
CREATE TABLE transfer_routes_cache (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    
    -- Route identification
    search_hash VARCHAR(255) NOT NULL, -- MD5 of search parameters
    pickup_location_code VARCHAR(100),
    dropoff_location_code VARCHAR(100),
    pickup_type VARCHAR(50), -- 'airport', 'hotel', 'address', 'landmark'
    dropoff_type VARCHAR(50),
    
    -- Search parameters
    request_params JSONB NOT NULL, -- Full search request parameters
    
    -- Cached response
    raw_response JSONB NOT NULL, -- Full API response from supplier
    normalized_products JSONB, -- Normalized transfer products
    
    -- Cache metadata
    ttl_seconds INTEGER DEFAULT 3600, -- Cache time-to-live
    expires_at TIMESTAMP WITH TIME ZONE,
    hit_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer products table - normalized transfer options from suppliers
CREATE TABLE transfer_products (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    
    -- Product identification
    product_code VARCHAR(100) NOT NULL, -- Supplier's product/vehicle code
    product_name VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(50), -- 'sedan', 'suv', 'minivan', 'luxury', 'wheelchair'
    vehicle_class VARCHAR(50), -- 'economy', 'standard', 'premium', 'luxury'
    
    -- Vehicle specifications
    max_passengers INTEGER NOT NULL,
    max_luggage INTEGER,
    door_count INTEGER,
    transmission VARCHAR(20), -- 'automatic', 'manual'
    fuel_type VARCHAR(20), -- 'petrol', 'diesel', 'electric', 'hybrid'
    air_conditioning BOOLEAN DEFAULT true,
    
    -- Route information
    pickup_location VARCHAR(255) NOT NULL,
    pickup_location_code VARCHAR(100),
    pickup_type VARCHAR(50), -- 'airport', 'hotel', 'address', 'landmark'
    dropoff_location VARCHAR(255) NOT NULL,
    dropoff_location_code VARCHAR(100),
    dropoff_type VARCHAR(50),
    
    -- Distance and duration
    distance_km DECIMAL(8,2),
    estimated_duration_minutes INTEGER,
    route_info JSONB, -- Detailed route information from supplier
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    price_breakdown JSONB, -- {base: 1000, airport_fee: 100, night_surcharge: 50}
    
    -- Service features
    features JSONB, -- ["meet_greet", "flight_monitoring", "free_waiting", "professional_driver"]
    inclusions JSONB, -- What's included in the price
    exclusions JSONB, -- What's not included
    
    -- Cancellation and policies
    cancellation_policy JSONB, -- {free_until: "24h", fee_percentage: 10}
    wait_time_included_minutes INTEGER DEFAULT 60,
    
    -- Provider information
    provider_name VARCHAR(255),
    provider_rating DECIMAL(3,2),
    provider_review_count INTEGER DEFAULT 0,
    
    -- Availability
    available_times JSONB, -- Available pickup times
    blackout_dates JSONB, -- Dates when not available
    
    -- Images and media
    vehicle_image_url VARCHAR(500),
    gallery_images JSONB,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    supplier_data JSONB, -- Full data from supplier API
    search_session_id VARCHAR(255), -- Link to original search
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer bookings table - main booking storage
CREATE TABLE transfer_bookings (
    id SERIAL PRIMARY KEY,
    booking_ref VARCHAR(50) NOT NULL UNIQUE, -- TR12345678 format
    supplier_id INTEGER REFERENCES suppliers(id),
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES transfer_products(id),
    
    -- Transfer details
    transfer_type VARCHAR(20) NOT NULL, -- 'one_way', 'round_trip'
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_class VARCHAR(50),
    product_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    
    -- Route information
    pickup_location VARCHAR(255) NOT NULL,
    pickup_location_code VARCHAR(100),
    pickup_type VARCHAR(50), -- 'airport', 'hotel', 'address', 'landmark'
    pickup_address TEXT,
    pickup_coordinates POINT, -- PostgreSQL Point type for lat/lng
    
    dropoff_location VARCHAR(255) NOT NULL,
    dropoff_location_code VARCHAR(100),
    dropoff_type VARCHAR(50),
    dropoff_address TEXT,
    dropoff_coordinates POINT,
    
    -- Booking dates and times
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    return_date DATE, -- For round trip
    return_time TIME, -- For round trip
    
    -- Return journey details (for round trip)
    return_pickup_location VARCHAR(255),
    return_dropoff_location VARCHAR(255),
    return_product_code VARCHAR(100),
    
    -- Passenger details
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER DEFAULT 0,
    infants_count INTEGER DEFAULT 0,
    children_ages INTEGER[], -- Array of child ages
    total_passengers INTEGER NOT NULL,
    guest_details JSONB NOT NULL, -- {primaryGuest: {}, additionalGuests: [], contactInfo: {}}
    
    -- Flight information (optional for airport transfers)
    flight_number VARCHAR(20),
    flight_arrival_time TIMESTAMP WITH TIME ZONE,
    flight_departure_time TIMESTAMP WITH TIME ZONE,
    airline VARCHAR(100),
    terminal VARCHAR(10),
    
    -- Special requirements
    special_requests TEXT,
    mobility_requirements TEXT,
    child_seats_required INTEGER DEFAULT 0,
    luggage_count INTEGER,
    oversized_luggage BOOLEAN DEFAULT false,
    
    -- Pricing details
    base_price DECIMAL(10,2) NOT NULL, -- Price from supplier
    return_price DECIMAL(10,2) DEFAULT 0.00, -- Return journey price for round trip
    markup_amount DECIMAL(10,2) DEFAULT 0.00,
    markup_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00, -- From promo codes
    taxes DECIMAL(10,2) DEFAULT 0.00,
    fees DECIMAL(10,2) DEFAULT 0.00,
    surcharges DECIMAL(10,2) DEFAULT 0.00, -- Night/airport surcharges
    total_amount DECIMAL(10,2) NOT NULL, -- Final amount paid
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Promo code details
    promo_code VARCHAR(50),
    promo_discount_type VARCHAR(20), -- 'percentage', 'fixed'
    promo_discount_value DECIMAL(10,2),
    
    -- Bargain details
    bargain_session_id VARCHAR(255),
    bargain_original_price DECIMAL(10,2),
    bargain_final_price DECIMAL(10,2),
    bargain_savings DECIMAL(10,2) DEFAULT 0.00,
    
    -- Booking status
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled, failed
    supplier_booking_ref VARCHAR(255), -- Reference from supplier
    supplier_response JSONB, -- Full response from supplier
    
    -- Driver and vehicle assignment
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    driver_photo_url VARCHAR(500),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_color VARCHAR(50),
    vehicle_license_plate VARCHAR(20),
    
    -- Real-time tracking
    tracking_enabled BOOLEAN DEFAULT false,
    tracking_url VARCHAR(500),
    driver_location POINT, -- Current driver location
    estimated_arrival_time TIMESTAMP WITH TIME ZONE,
    
    -- Service execution
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_dropoff_time TIMESTAMP WITH TIME ZONE,
    actual_duration_minutes INTEGER,
    wait_time_minutes INTEGER DEFAULT 0,
    
    -- Payment information
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded, failed
    payment_method VARCHAR(50), -- 'card', 'wallet', 'bank_transfer', 'cash'
    payment_reference VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Invoice and receipts
    invoice_id VARCHAR(100),
    invoice_url VARCHAR(500),
    receipt_url VARCHAR(500),
    
    -- Internal notes and audit
    internal_notes TEXT,
    audit_log JSONB, -- Array of status changes and events
    
    -- Timestamps
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmation_date TIMESTAMP WITH TIME ZONE,
    cancellation_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer pricing rules table
CREATE TABLE transfer_pricing_rules (
    id SERIAL PRIMARY KEY,
    
    -- Rule identification
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'route', 'vehicle_type', 'supplier', 'global', 'time_based'
    priority INTEGER DEFAULT 100, -- Lower number = higher priority
    
    -- Rule conditions
    pickup_location_code VARCHAR(100), -- Apply to specific pickup location
    dropoff_location_code VARCHAR(100), -- Apply to specific dropoff location
    route_pattern VARCHAR(255), -- Regex pattern for route matching
    vehicle_type VARCHAR(50), -- Apply to specific vehicle type
    supplier_id INTEGER REFERENCES suppliers(id), -- Apply to specific supplier
    
    -- Time-based conditions
    start_date DATE,
    end_date DATE,
    days_of_week VARCHAR(20), -- 'weekdays', 'weekends', 'all', or comma-separated: 'mon,tue,wed'
    time_from TIME,
    time_to TIME,
    
    -- Distance and duration conditions
    min_distance_km DECIMAL(8,2),
    max_distance_km DECIMAL(8,2),
    min_duration_minutes INTEGER,
    max_duration_minutes INTEGER,
    
    -- Markup configuration
    markup_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'per_km', 'per_minute'
    markup_value DECIMAL(10,2) NOT NULL,
    minimum_markup DECIMAL(10,2) DEFAULT 0.00,
    maximum_markup DECIMAL(10,2),
    
    -- Never-loss protection
    never_loss_enabled BOOLEAN DEFAULT true,
    minimum_total_amount DECIMAL(10,2), -- Minimum total price regardless of discounts
    
    -- Additional fees
    additional_fees JSONB, -- {airport_fee: 100, night_surcharge: 50}
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer promo codes table
CREATE TABLE transfer_promos (
    id SERIAL PRIMARY KEY,
    
    -- Promo identification
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Promo type and value
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'per_km'
    discount_value DECIMAL(10,2) NOT NULL,
    maximum_discount DECIMAL(10,2), -- Cap for percentage discounts
    minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
    
    -- Usage limits
    usage_limit INTEGER, -- Total usage limit
    usage_limit_per_user INTEGER DEFAULT 1,
    current_usage INTEGER DEFAULT 0,
    
    -- Validity period
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    
    -- Applicability conditions
    applicable_routes JSONB, -- Array of route patterns
    applicable_vehicle_types JSONB, -- Array of vehicle types
    applicable_suppliers JSONB, -- Array of supplier IDs
    minimum_distance_km DECIMAL(8,2),
    maximum_distance_km DECIMAL(8,2),
    
    -- Channel restrictions
    channels JSONB DEFAULT '["web", "mobile", "api"]', -- Where promo can be used
    user_segments JSONB, -- User types who can use: ["new", "returning", "premium"]
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false, -- Hidden promos for specific campaigns
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer promo code usage tracking
CREATE TABLE transfer_promo_usage (
    id SERIAL PRIMARY KEY,
    promo_id INTEGER REFERENCES transfer_promos(id),
    booking_id INTEGER REFERENCES transfer_bookings(id),
    user_id INTEGER REFERENCES users(id),
    
    -- Usage details
    promo_code VARCHAR(50) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    order_value DECIMAL(10,2) NOT NULL,
    
    -- Context
    channel VARCHAR(20), -- 'web', 'mobile', 'api'
    user_agent TEXT,
    ip_address INET,
    
    -- Timestamps
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer audit logs table - for security and compliance
CREATE TABLE transfer_audit_logs (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES transfer_bookings(id),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'booking_created', 'payment_processed', 'status_changed', 'booking_cancelled'
    event_description TEXT,
    
    -- User context
    user_id INTEGER REFERENCES users(id),
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Data changes
    old_values JSONB, -- Previous values before change
    new_values JSONB, -- New values after change
    
    -- Request/response data (encrypted)
    request_payload TEXT, -- Encrypted with pgcrypto
    response_payload TEXT, -- Encrypted with pgcrypto
    
    -- Metadata
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_transfer_suppliers_supplier_id ON transfer_suppliers(supplier_id);
CREATE INDEX idx_transfer_suppliers_is_active ON transfer_suppliers(is_active);

CREATE INDEX idx_transfer_routes_cache_hash ON transfer_routes_cache(search_hash);
CREATE INDEX idx_transfer_routes_cache_supplier ON transfer_routes_cache(supplier_id);
CREATE INDEX idx_transfer_routes_cache_expires ON transfer_routes_cache(expires_at);
CREATE INDEX idx_transfer_routes_cache_pickup ON transfer_routes_cache(pickup_location_code);
CREATE INDEX idx_transfer_routes_cache_dropoff ON transfer_routes_cache(dropoff_location_code);

CREATE INDEX idx_transfer_products_supplier ON transfer_products(supplier_id);
CREATE INDEX idx_transfer_products_vehicle_type ON transfer_products(vehicle_type);
CREATE INDEX idx_transfer_products_pickup_code ON transfer_products(pickup_location_code);
CREATE INDEX idx_transfer_products_dropoff_code ON transfer_products(dropoff_location_code);
CREATE INDEX idx_transfer_products_is_active ON transfer_products(is_active);
CREATE INDEX idx_transfer_products_session ON transfer_products(search_session_id);

CREATE INDEX idx_transfer_bookings_ref ON transfer_bookings(booking_ref);
CREATE INDEX idx_transfer_bookings_supplier ON transfer_bookings(supplier_id);
CREATE INDEX idx_transfer_bookings_user ON transfer_bookings(user_id);
CREATE INDEX idx_transfer_bookings_status ON transfer_bookings(status);
CREATE INDEX idx_transfer_bookings_pickup_date ON transfer_bookings(pickup_date);
CREATE INDEX idx_transfer_bookings_payment_status ON transfer_bookings(payment_status);
CREATE INDEX idx_transfer_bookings_supplier_ref ON transfer_bookings(supplier_booking_ref);
CREATE INDEX idx_transfer_bookings_created_at ON transfer_bookings(created_at);

CREATE INDEX idx_transfer_pricing_rules_type ON transfer_pricing_rules(rule_type);
CREATE INDEX idx_transfer_pricing_rules_supplier ON transfer_pricing_rules(supplier_id);
CREATE INDEX idx_transfer_pricing_rules_priority ON transfer_pricing_rules(priority);
CREATE INDEX idx_transfer_pricing_rules_is_active ON transfer_pricing_rules(is_active);
CREATE INDEX idx_transfer_pricing_rules_vehicle_type ON transfer_pricing_rules(vehicle_type);

CREATE INDEX idx_transfer_promos_code ON transfer_promos(code);
CREATE INDEX idx_transfer_promos_is_active ON transfer_promos(is_active);
CREATE INDEX idx_transfer_promos_valid_from ON transfer_promos(valid_from);
CREATE INDEX idx_transfer_promos_valid_until ON transfer_promos(valid_until);

CREATE INDEX idx_transfer_promo_usage_promo ON transfer_promo_usage(promo_id);
CREATE INDEX idx_transfer_promo_usage_booking ON transfer_promo_usage(booking_id);
CREATE INDEX idx_transfer_promo_usage_user ON transfer_promo_usage(user_id);
CREATE INDEX idx_transfer_promo_usage_used_at ON transfer_promo_usage(used_at);

CREATE INDEX idx_transfer_audit_logs_booking ON transfer_audit_logs(booking_id);
CREATE INDEX idx_transfer_audit_logs_user ON transfer_audit_logs(user_id);
CREATE INDEX idx_transfer_audit_logs_event_type ON transfer_audit_logs(event_type);
CREATE INDEX idx_transfer_audit_logs_created_at ON transfer_audit_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_transfer_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transfer_suppliers_updated_at BEFORE UPDATE ON transfer_suppliers FOR EACH ROW EXECUTE FUNCTION update_transfer_updated_at_column();
CREATE TRIGGER update_transfer_routes_cache_updated_at BEFORE UPDATE ON transfer_routes_cache FOR EACH ROW EXECUTE FUNCTION update_transfer_updated_at_column();
CREATE TRIGGER update_transfer_products_updated_at BEFORE UPDATE ON transfer_products FOR EACH ROW EXECUTE FUNCTION update_transfer_updated_at_column();
CREATE TRIGGER update_transfer_bookings_updated_at BEFORE UPDATE ON transfer_bookings FOR EACH ROW EXECUTE FUNCTION update_transfer_updated_at_column();
CREATE TRIGGER update_transfer_pricing_rules_updated_at BEFORE UPDATE ON transfer_pricing_rules FOR EACH ROW EXECUTE FUNCTION update_transfer_updated_at_column();
CREATE TRIGGER update_transfer_promos_updated_at BEFORE UPDATE ON transfer_promos FOR EACH ROW EXECUTE FUNCTION update_transfer_updated_at_column();

-- Insert default transfer pricing rule
INSERT INTO transfer_pricing_rules (
    rule_name,
    rule_type,
    priority,
    markup_type,
    markup_value,
    minimum_markup,
    never_loss_enabled,
    minimum_total_amount,
    is_active,
    description
) VALUES (
    'Global Transfer Markup',
    'global',
    100,
    'percentage',
    15.00,
    50.00,
    true,
    200.00,
    true,
    'Default 15% markup on all transfers with minimum ₹50 markup and ₹200 minimum total'
);

-- Insert sample transfer promo code
INSERT INTO transfer_promos (
    code,
    name,
    description,
    discount_type,
    discount_value,
    maximum_discount,
    minimum_order_value,
    usage_limit,
    usage_limit_per_user,
    valid_from,
    valid_until,
    applicable_vehicle_types,
    channels,
    is_active
) VALUES (
    'TRANSFER25',
    'New Customer Transfer Discount',
    '25% off your first transfer booking',
    'percentage',
    25.00,
    500.00,
    500.00,
    1000,
    1,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    '["sedan", "suv", "minivan"]',
    '["web", "mobile"]',
    true
);

-- Create view for transfer booking summaries
CREATE VIEW transfer_booking_summary AS
SELECT 
    tb.id,
    tb.booking_ref,
    tb.status,
    tb.pickup_location,
    tb.dropoff_location,
    tb.pickup_date,
    tb.pickup_time,
    tb.vehicle_type,
    tb.total_passengers,
    tb.total_amount,
    tb.currency,
    tb.payment_status,
    s.name as supplier_name,
    u.email as user_email,
    tb.created_at,
    tb.updated_at
FROM transfer_bookings tb
LEFT JOIN suppliers s ON tb.supplier_id = s.id
LEFT JOIN users u ON tb.user_id = u.id;

-- Create view for transfer revenue analytics
CREATE VIEW transfer_revenue_analytics AS
SELECT 
    DATE_TRUNC('day', tb.created_at) as booking_date,
    s.name as supplier_name,
    tb.vehicle_type,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN tb.status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN tb.status = 'cancelled' THEN 1 END) as cancelled_bookings,
    SUM(tb.base_price) as total_base_amount,
    SUM(tb.markup_amount) as total_markup_amount,
    SUM(tb.total_amount) as total_revenue,
    AVG(tb.total_amount) as average_booking_value,
    SUM(CASE WHEN tb.payment_status = 'paid' THEN tb.total_amount ELSE 0 END) as paid_revenue
FROM transfer_bookings tb
LEFT JOIN suppliers s ON tb.supplier_id = s.id
GROUP BY DATE_TRUNC('day', tb.created_at), s.name, tb.vehicle_type
ORDER BY booking_date DESC, total_revenue DESC;

COMMENT ON TABLE transfer_suppliers IS 'Transfer supplier configurations and capabilities';
COMMENT ON TABLE transfer_routes_cache IS 'Cached transfer route searches and pricing from suppliers';
COMMENT ON TABLE transfer_products IS 'Normalized transfer products and vehicle options from suppliers';
COMMENT ON TABLE transfer_bookings IS 'Main transfer booking records with full customer and journey details';
COMMENT ON TABLE transfer_pricing_rules IS 'Markup and pricing rules for transfers based on routes, vehicles, and conditions';
COMMENT ON TABLE transfer_promos IS 'Promotional codes and discounts for transfer bookings';
COMMENT ON TABLE transfer_promo_usage IS 'Tracking of promo code usage in transfer bookings';
COMMENT ON TABLE transfer_audit_logs IS 'Audit trail of all transfer booking operations and changes';
