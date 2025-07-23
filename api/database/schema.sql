-- Faredown Hotel Booking System Database Schema
-- PostgreSQL implementation for production-ready booking management

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Suppliers table - tracks which API/supplier each booking came from
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- 'hotelbeds', 'tbo', 'agoda', etc.
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    base_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    markup_percentage DECIMAL(5,2) DEFAULT 0.00, -- Default markup for this supplier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table - for future login functionality
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255), -- For future login system
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hotel bookings table - main booking storage
CREATE TABLE hotel_bookings (
    id SERIAL PRIMARY KEY,
    booking_ref VARCHAR(50) NOT NULL UNIQUE, -- FD12345678 format
    supplier_id INTEGER REFERENCES suppliers(id),
    user_id INTEGER REFERENCES users(id),
    
    -- Hotel details
    hotel_code VARCHAR(100) NOT NULL,
    hotel_name VARCHAR(255) NOT NULL,
    hotel_address TEXT,
    hotel_city VARCHAR(100),
    hotel_country VARCHAR(100),
    hotel_rating DECIMAL(3,2), -- 4.5 stars etc.
    
    -- Room details
    room_type VARCHAR(255),
    room_name VARCHAR(255),
    room_code VARCHAR(100),
    giata_room_type VARCHAR(100), -- Standardized GIATA room category
    max_occupancy INTEGER,
    
    -- Guest details (JSON for flexibility)
    guest_details JSONB NOT NULL, -- {primaryGuest: {}, additionalGuests: [], contactInfo: {}}
    
    -- Booking dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER NOT NULL,
    rooms_count INTEGER DEFAULT 1,
    adults_count INTEGER NOT NULL,
    children_count INTEGER DEFAULT 0,
    children_ages INTEGER[], -- Array of child ages
    
    -- Pricing details
    base_price DECIMAL(10,2) NOT NULL, -- Price from supplier
    markup_amount DECIMAL(10,2) DEFAULT 0.00,
    markup_percentage DECIMAL(5,2) DEFAULT 0.00,
    taxes DECIMAL(10,2) DEFAULT 0.00,
    fees DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL, -- Final amount paid
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Booking status
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed, failed
    supplier_booking_ref VARCHAR(255), -- Reference from Hotelbeds/supplier
    supplier_response JSONB, -- Full response from supplier for audit
    
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
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
    
    -- Payment gateway details
    gateway VARCHAR(50) NOT NULL, -- 'razorpay', 'stripe', etc.
    gateway_payment_id VARCHAR(255) NOT NULL, -- pay_xxxx from Razorpay
    gateway_order_id VARCHAR(255), -- order_xxxx from Razorpay
    
    -- Amount details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Payment method
    payment_method VARCHAR(50), -- 'card', 'upi', 'netbanking', 'wallet'
    payment_details JSONB, -- Card last 4 digits, UPI ID, etc.
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    failure_reason TEXT,
    
    -- Gateway response
    gateway_response JSONB, -- Full response from payment gateway
    gateway_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Refund details
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_date TIMESTAMP WITH TIME ZONE,
    refund_reference VARCHAR(255),
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vouchers table - tracks voucher generation and delivery
CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
    
    -- Voucher details
    voucher_type VARCHAR(50) DEFAULT 'hotel', -- 'hotel', 'gst_invoice'
    voucher_number VARCHAR(100) UNIQUE, -- V-FD12345678-001
    
    -- File storage
    pdf_path VARCHAR(500), -- Path to generated PDF file
    pdf_size_bytes INTEGER,
    
    -- Email delivery tracking
    email_sent BOOLEAN DEFAULT false,
    email_address VARCHAR(255),
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_delivery_status VARCHAR(50), -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
    email_failure_reason TEXT,
    
    -- Download tracking
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Regeneration tracking
    is_latest BOOLEAN DEFAULT true, -- Only one voucher per booking should be latest
    regenerated_from INTEGER REFERENCES vouchers(id),
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Booking audit log - tracks all changes to bookings
CREATE TABLE booking_audit_log (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
    
    -- Change tracking
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'cancelled', 'confirmed'
    field_changed VARCHAR(100), -- Which field was changed
    old_value TEXT, -- Previous value
    new_value TEXT, -- New value
    
    -- User tracking
    changed_by VARCHAR(255), -- User email or 'system'
    change_reason TEXT,
    
    -- Timestamps
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_hotel_bookings_booking_ref ON hotel_bookings(booking_ref);
CREATE INDEX idx_hotel_bookings_status ON hotel_bookings(status);
CREATE INDEX idx_hotel_bookings_booking_date ON hotel_bookings(booking_date);
CREATE INDEX idx_hotel_bookings_check_in_date ON hotel_bookings(check_in_date);
CREATE INDEX idx_hotel_bookings_hotel_city ON hotel_bookings(hotel_city);
CREATE INDEX idx_hotel_bookings_supplier_id ON hotel_bookings(supplier_id);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_completed_at ON payments(completed_at);

CREATE INDEX idx_vouchers_booking_id ON vouchers(booking_id);
CREATE INDEX idx_vouchers_voucher_number ON vouchers(voucher_number);
CREATE INDEX idx_vouchers_is_latest ON vouchers(is_latest);

CREATE INDEX idx_booking_audit_log_booking_id ON booking_audit_log(booking_id);
CREATE INDEX idx_booking_audit_log_changed_at ON booking_audit_log(changed_at);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_bookings_updated_at BEFORE UPDATE ON hotel_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default suppliers
INSERT INTO suppliers (name, is_active, markup_percentage) VALUES
('hotelbeds', true, 15.00),
('tbo', false, 12.00),
('agoda', false, 18.00),
('booking.com', false, 20.00)
ON CONFLICT (name) DO NOTHING;

-- Create views for common queries
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

-- Create view for revenue analytics
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

-- Comments for documentation
COMMENT ON TABLE hotel_bookings IS 'Main table storing all hotel booking details with guest info, pricing, and status';
COMMENT ON TABLE payments IS 'Payment transactions linked to bookings with gateway details and status tracking';
COMMENT ON TABLE vouchers IS 'Generated vouchers and delivery tracking for each booking';
COMMENT ON TABLE suppliers IS 'Hotel API suppliers like Hotelbeds, TBO, Agoda with their configurations';
COMMENT ON TABLE booking_audit_log IS 'Audit trail of all changes made to bookings for compliance and debugging';
