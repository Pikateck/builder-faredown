-- Additional Admin CMS Tables Migration
-- Execute this to create tables for all admin modules

-- =============================================================================
-- STEP 1: Admin Audit Log Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    before_data JSONB,
    after_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 2: Markup Management Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS air_markup_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scope VARCHAR(50) NOT NULL CHECK (scope IN ('global', 'route', 'airline', 'cabin', 'supplier')),
    criteria JSONB NOT NULL,
    markup_type VARCHAR(20) NOT NULL CHECK (markup_type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    min_amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    priority INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS hotel_markup_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scope VARCHAR(50) NOT NULL CHECK (scope IN ('global', 'destination', 'hotel', 'supplier', 'rating')),
    criteria JSONB NOT NULL,
    markup_type VARCHAR(20) NOT NULL CHECK (markup_type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    min_amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    priority INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- =============================================================================
-- STEP 3: VAT Management Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS vat_rules (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(3) NOT NULL,
    country_name VARCHAR(255) NOT NULL,
    hsn_sac_code VARCHAR(20),
    description VARCHAR(500),
    tax_percentage DECIMAL(5,2) NOT NULL,
    tax_type VARCHAR(50) DEFAULT 'VAT',
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- =============================================================================
-- STEP 4: Promo Codes Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS promos (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
    value DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    min_order_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    user_limit INTEGER DEFAULT 1,
    applicable_to VARCHAR(20) DEFAULT 'all' CHECK (applicable_to IN ('all', 'hotels', 'flights', 'packages')),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- =============================================================================
-- STEP 5: Currency Exchange Rates Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS fx_rates (
    id SERIAL PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL,
    quote_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15,8) NOT NULL,
    source VARCHAR(50) NOT NULL,
    as_of TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(base_currency, quote_currency, as_of)
);

-- =============================================================================
-- STEP 6: Bargain Engine Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS bargain_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    context JSONB NOT NULL,
    initial_offer DECIMAL(10,2),
    final_offer DECIMAL(10,2),
    supplier_id INTEGER REFERENCES suppliers(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'expired')),
    success BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bargain_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES bargain_sessions(id) ON DELETE CASCADE,
    actor VARCHAR(20) NOT NULL CHECK (actor IN ('user', 'system', 'ai')),
    message TEXT NOT NULL,
    offer_amount DECIMAL(10,2),
    message_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 7: API Testing Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_test_runs (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    test_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(500),
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
    response_time_ms INTEGER,
    error_message TEXT,
    triggered_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 8: Inventory/Content Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS hotel_content (
    id SERIAL PRIMARY KEY,
    hotelbeds_hotel_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    star_rating INTEGER,
    amenities TEXT[],
    check_in_time VARCHAR(10),
    check_out_time VARCHAR(10),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_content (
    id SERIAL PRIMARY KEY,
    hotel_content_id INTEGER REFERENCES hotel_content(id) ON DELETE CASCADE,
    room_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_occupancy INTEGER,
    amenities TEXT[],
    size_sqm INTEGER,
    bed_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    caption VARCHAR(500),
    rank INTEGER DEFAULT 1,
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 9: Loyalty/Rewards Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    points_balance INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    tier_qualifying_points INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    loyalty_account_id INTEGER REFERENCES loyalty_accounts(id),
    booking_id INTEGER REFERENCES hotel_bookings(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust')),
    points INTEGER NOT NULL,
    description VARCHAR(500),
    reference_id VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 10: Voucher Templates Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS voucher_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('hotel', 'flight', 'package')),
    html_content TEXT NOT NULL,
    css_styles TEXT,
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- =============================================================================
-- STEP 11: System Settings Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    UNIQUE(category, key)
);

CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- =============================================================================
-- STEP 12: Create Indexes
-- =============================================================================

-- Admin audit log indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_module ON admin_audit_log(module);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);

-- Markup rules indexes
CREATE INDEX IF NOT EXISTS idx_air_markup_rules_scope ON air_markup_rules(scope);
CREATE INDEX IF NOT EXISTS idx_air_markup_rules_status ON air_markup_rules(status);
CREATE INDEX IF NOT EXISTS idx_air_markup_rules_valid_dates ON air_markup_rules(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_hotel_markup_rules_scope ON hotel_markup_rules(scope);
CREATE INDEX IF NOT EXISTS idx_hotel_markup_rules_status ON hotel_markup_rules(status);
CREATE INDEX IF NOT EXISTS idx_hotel_markup_rules_valid_dates ON hotel_markup_rules(valid_from, valid_to);

-- VAT rules indexes
CREATE INDEX IF NOT EXISTS idx_vat_rules_country ON vat_rules(country_code);
CREATE INDEX IF NOT EXISTS idx_vat_rules_status ON vat_rules(status);
CREATE INDEX IF NOT EXISTS idx_vat_rules_valid_dates ON vat_rules(valid_from, valid_to);

-- Promo codes indexes
CREATE INDEX IF NOT EXISTS idx_promos_code ON promos(code);
CREATE INDEX IF NOT EXISTS idx_promos_status ON promos(status);
CREATE INDEX IF NOT EXISTS idx_promos_valid_dates ON promos(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_promos_applicable_to ON promos(applicable_to);

-- FX rates indexes
CREATE INDEX IF NOT EXISTS idx_fx_rates_currencies ON fx_rates(base_currency, quote_currency);
CREATE INDEX IF NOT EXISTS idx_fx_rates_as_of ON fx_rates(as_of);

-- Bargain sessions indexes
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_user_id ON bargain_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_status ON bargain_sessions(status);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_created_at ON bargain_sessions(created_at);

-- API test runs indexes
CREATE INDEX IF NOT EXISTS idx_api_test_runs_supplier_id ON api_test_runs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_api_test_runs_created_at ON api_test_runs(created_at);

-- Hotel content indexes
CREATE INDEX IF NOT EXISTS idx_hotel_content_hotelbeds_id ON hotel_content(hotelbeds_hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_content_city ON hotel_content(city);
CREATE INDEX IF NOT EXISTS idx_hotel_content_country ON hotel_content(country);

-- Loyalty indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user_id ON loyalty_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_account_id ON loyalty_transactions(loyalty_account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public) WHERE is_public = true;

-- =============================================================================
-- STEP 13: Create Triggers
-- =============================================================================

-- Update timestamps for tables with updated_at
CREATE TRIGGER update_air_markup_rules_updated_at BEFORE UPDATE ON air_markup_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_markup_rules_updated_at BEFORE UPDATE ON hotel_markup_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vat_rules_updated_at BEFORE UPDATE ON vat_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promos_updated_at BEFORE UPDATE ON promos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bargain_sessions_updated_at BEFORE UPDATE ON bargain_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_accounts_updated_at BEFORE UPDATE ON loyalty_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voucher_templates_updated_at BEFORE UPDATE ON voucher_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 14: Insert Initial Data
-- =============================================================================

-- Insert default VAT rules
INSERT INTO vat_rules (country_code, country_name, hsn_sac_code, description, tax_percentage, valid_from, created_by) VALUES
('IN', 'India', '996411', 'Hotel Accommodation Services', 12.00, '2021-01-01', 'system_seed'),
('IN', 'India', '996511', 'Air Transport Services', 5.00, '2021-01-01', 'system_seed'),
('AE', 'United Arab Emirates', 'VAT001', 'Tourism Services', 5.00, '2018-01-01', 'system_seed'),
('GB', 'United Kingdom', 'VAT001', 'Tourism Services', 20.00, '2021-01-01', 'system_seed'),
('US', 'United States', 'TAX001', 'State Sales Tax (Average)', 8.50, '2021-01-01', 'system_seed')
ON CONFLICT DO NOTHING;

-- Insert default FX rates (base rates from INR)
INSERT INTO fx_rates (base_currency, quote_currency, rate, source, as_of) VALUES
('INR', 'USD', 0.012, 'system_seed', NOW()),
('INR', 'EUR', 0.011, 'system_seed', NOW()),
('INR', 'GBP', 0.0095, 'system_seed', NOW()),
('INR', 'AED', 0.044, 'system_seed', NOW()),
('INR', 'SGD', 0.016, 'system_seed', NOW()),
('USD', 'INR', 83.33, 'system_seed', NOW()),
('EUR', 'INR', 91.67, 'system_seed', NOW()),
('GBP', 'INR', 105.26, 'system_seed', NOW()),
('AED', 'INR', 22.73, 'system_seed', NOW()),
('SGD', 'INR', 62.5, 'system_seed', NOW())
ON CONFLICT (base_currency, quote_currency, as_of) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (category, key, value, data_type, description, is_public, created_by) VALUES
('general', 'site_name', 'Faredown', 'string', 'Website name', true, 'system_seed'),
('general', 'site_url', 'https://faredown.com', 'string', 'Website URL', true, 'system_seed'),
('general', 'contact_email', 'support@faredown.com', 'string', 'Contact email', true, 'system_seed'),
('general', 'default_currency', 'INR', 'string', 'Default currency', true, 'system_seed'),
('booking', 'booking_hold_time', '900', 'number', 'Booking hold time in seconds', false, 'system_seed'),
('booking', 'max_passengers', '9', 'number', 'Maximum passengers per booking', true, 'system_seed'),
('payment', 'supported_gateways', '["razorpay","stripe","paypal"]', 'json', 'Supported payment gateways', false, 'system_seed'),
('email', 'smtp_enabled', 'true', 'boolean', 'Enable SMTP email sending', false, 'system_seed')
ON CONFLICT (category, key) DO NOTHING;

-- Insert default voucher template
INSERT INTO voucher_templates (name, template_type, html_content, is_default, created_by) VALUES
('Default Hotel Voucher', 'hotel', '<!DOCTYPE html><html><head><title>Hotel Voucher</title></head><body><h1>Hotel Booking Voucher</h1><p>{{booking_ref}}</p><p>{{hotel_name}}</p><p>{{guest_name}}</p></body></html>', true, 'system_seed')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Add comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Tracks all admin actions for security and compliance';
COMMENT ON TABLE air_markup_rules IS 'Dynamic markup rules for flight bookings';
COMMENT ON TABLE hotel_markup_rules IS 'Dynamic markup rules for hotel bookings';
COMMENT ON TABLE vat_rules IS 'VAT/tax rules by country and service type';
COMMENT ON TABLE promos IS 'Promotional codes and discount management';
COMMENT ON TABLE fx_rates IS 'Currency exchange rates with historical data';
COMMENT ON TABLE bargain_sessions IS 'AI-powered bargaining sessions with customers';
COMMENT ON TABLE api_test_runs IS 'API connectivity and performance test results';
COMMENT ON TABLE loyalty_accounts IS 'Customer loyalty program accounts and tiers';
COMMENT ON TABLE system_settings IS 'Application configuration settings';
