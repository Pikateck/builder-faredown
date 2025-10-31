-- =====================================================
-- P0 MIGRATION: Complete Frontend + Admin to Postgres Integration
-- Version: 1.0.0
-- Date: 2025-04-05
-- Purpose: Wire all frontend/admin actions to PostgreSQL as single source of truth
-- =====================================================

-- =====================================================
-- 1. CUSTOMERS TABLE (Proper customer management)
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(50) NOT NULL UNIQUE, -- Faredown customer ID
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  nationality VARCHAR(100),
  passport_number VARCHAR(50),
  passport_expiry DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Loyalty integration
  loyalty_tier VARCHAR(50) DEFAULT 'Silver', -- Silver, Gold, Platinum
  loyalty_points_balance INT DEFAULT 0,
  loyalty_points_lifetime INT DEFAULT 0,
  
  -- KYC status
  kyc_verified BOOLEAN DEFAULT false,
  kyc_verified_at TIMESTAMP WITH TIME ZONE,
  kyc_documents JSONB, -- {aadhar: {url, verified}, pan: {url, verified}, driving_license: {...}}
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_customers_kyc_verified ON customers(kyc_verified);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);

COMMENT ON TABLE customers IS 'Master customer information with KYC and loyalty tracking';

-- =====================================================
-- 2. PAN IDENTIFIERS TABLE (Secure PAN card storage)
-- =====================================================
CREATE TABLE IF NOT EXISTS pan_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID, -- NULL if PAN not yet linked to a booking
  
  -- PAN Details
  pan_number VARCHAR(20) NOT NULL, -- Alphanumeric, max 20 chars
  pan_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash for searching without exposing
  pan_last4 VARCHAR(4), -- Last 4 chars for display
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_method VARCHAR(100), -- 'manual', 'aadhaar_link', 'nsdl_api'
  
  -- Usage
  is_primary BOOLEAN DEFAULT false, -- Only one PAN per customer can be primary
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_pan_customer_id ON pan_identifiers(customer_id);
CREATE INDEX IF NOT EXISTS idx_pan_is_primary ON pan_identifiers(is_primary);
CREATE INDEX IF NOT EXISTS idx_pan_is_verified ON pan_identifiers(is_verified);
CREATE INDEX IF NOT EXISTS idx_pan_hash ON pan_identifiers(pan_hash);

COMMENT ON TABLE pan_identifiers IS 'PAN card storage with hashed values for security';
COMMENT ON COLUMN pan_identifiers.pan_hash IS 'SHA256 hash of PAN for secure searching';
COMMENT ON COLUMN pan_identifiers.pan_last4 IS 'Last 4 characters of PAN for display purposes';

-- =====================================================
-- 3. SPECIAL REQUESTS TABLE (Detailed special requests)
-- =====================================================
CREATE TABLE IF NOT EXISTS special_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID, -- Will add FK after bookings migration
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Request Details
  request_type VARCHAR(100) NOT NULL, -- 'room_preference', 'dietary', 'accessibility', 'other'
  request_text TEXT NOT NULL,
  request_priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  -- Status Tracking
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'acknowledged', 'fulfilled', 'not_fulfilled', 'cancelled'
  status_updated_at TIMESTAMP WITH TIME ZONE,
  status_notes TEXT,
  
  -- Acknowledgment
  acknowledged_by VARCHAR(255), -- Hotel name or contact
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- Fulfillment
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfillment_proof JSONB, -- {photo_url: '', notes: '', timestamp: ''}
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_special_requests_booking_id ON special_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_special_requests_customer_id ON special_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_special_requests_status ON special_requests(status);
CREATE INDEX IF NOT EXISTS idx_special_requests_type ON special_requests(request_type);

COMMENT ON TABLE special_requests IS 'Guest special requests for hotels (dietary, accessibility, etc.)';

-- =====================================================
-- 4. BOOKING DOCUMENTS TABLE (Invoice & Voucher tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID, -- Will add FK after bookings migration
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Document Details
  document_type VARCHAR(50) NOT NULL, -- 'voucher', 'invoice', 'receipt', 'itinerary', 'ticket'
  document_name VARCHAR(255) NOT NULL,
  document_number VARCHAR(100) UNIQUE,
  
  -- File Storage
  file_path VARCHAR(500), -- S3 path or local path
  file_url VARCHAR(1000), -- Publicly accessible URL
  file_size_bytes INT,
  file_mime_type VARCHAR(100),
  
  -- Document Content
  document_content JSONB, -- {title, logo, address, details, items[], totals}
  
  -- Generation
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  generated_by VARCHAR(255), -- System or user email
  
  -- Delivery
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_delivery_status VARCHAR(50), -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  email_recipient VARCHAR(255),
  email_failure_reason TEXT,
  
  -- Download tracking
  download_count INT DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  last_downloaded_ip VARCHAR(50),
  
  -- Versioning
  is_latest BOOLEAN DEFAULT true,
  version INT DEFAULT 1,
  replaced_by UUID REFERENCES booking_documents(id),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_documents_booking_id ON booking_documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_documents_customer_id ON booking_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_documents_type ON booking_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_booking_documents_is_latest ON booking_documents(is_latest);
CREATE INDEX IF NOT EXISTS idx_booking_documents_email_sent ON booking_documents(email_sent);
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_documents_number ON booking_documents(document_number);

COMMENT ON TABLE booking_documents IS 'Invoices, vouchers, and other booking-related documents with delivery tracking';

-- =====================================================
-- 5. BARGAIN ROUNDS TABLE (Detailed bargain tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS bargain_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID, -- Will add FK after bookings migration
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Round Details
  round_number INT NOT NULL,
  total_rounds INT NOT NULL,
  
  -- Prices
  base_price DECIMAL(12, 2) NOT NULL,
  customer_offer DECIMAL(12, 2),
  seller_counter DECIMAL(12, 2),
  accepted_price DECIMAL(12, 2),
  discount_amount DECIMAL(12, 2),
  discount_percentage DECIMAL(5, 2),
  
  -- Timing
  offer_sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  offer_deadline TIMESTAMP WITH TIME ZONE,
  counter_received_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(50) NOT NULL, -- 'active', 'accepted', 'rejected', 'expired', 'withdrawn'
  status_reason TEXT,
  
  -- Metadata
  customer_message TEXT,
  seller_message TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_bargain_rounds_booking_id ON bargain_rounds(booking_id);
CREATE INDEX IF NOT EXISTS idx_bargain_rounds_customer_id ON bargain_rounds(customer_id);
CREATE INDEX IF NOT EXISTS idx_bargain_rounds_status ON bargain_rounds(status);
CREATE INDEX IF NOT EXISTS idx_bargain_rounds_round_number ON bargain_rounds(round_number);

COMMENT ON TABLE bargain_rounds IS 'Detailed tracking of each bargain negotiation round with offers and counters';

-- =====================================================
-- 6. LOYALTY EVENTS TABLE (Recent activity)
-- =====================================================
CREATE TABLE IF NOT EXISTS loyalty_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID, -- NULL for non-booking events
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- 'booking_created', 'bargain_won', 'payment_completed', 'points_earned', 'points_redeemed', 'tier_upgraded', 'reward_redeemed'
  event_description TEXT,
  
  -- Points
  points_change INT, -- Can be positive or negative
  points_balance_before INT,
  points_balance_after INT,
  
  -- Tier
  tier_before VARCHAR(50),
  tier_after VARCHAR(50),
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional context specific to event type
  
  -- Timestamp
  event_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_events_customer_id ON loyalty_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_events_booking_id ON loyalty_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_events_type ON loyalty_events(event_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_events_date ON loyalty_events(event_date);

COMMENT ON TABLE loyalty_events IS 'Recent loyalty activity (bookings, points, tier changes)';

-- =====================================================
-- 7. AUDIT LOGS TABLE (Comprehensive audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Entity References
  entity_type VARCHAR(100) NOT NULL, -- 'booking', 'payment', 'customer', 'document', etc.
  entity_id UUID,
  entity_name VARCHAR(255),
  
  -- Action
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'confirm', 'cancel', 'email_sent', etc.
  
  -- Changes
  old_values JSONB, -- Previous values
  new_values JSONB, -- New values
  changed_fields TEXT[], -- Array of field names that changed
  
  -- Context
  performed_by VARCHAR(255), -- User email or system
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system changes';

-- =====================================================
-- 8. BOOKING SUMMARY VIEW
-- =====================================================
CREATE OR REPLACE VIEW booking_summary_v2 AS
SELECT 
  hb.id,
  hb.booking_reference,
  c.customer_id,
  c.email,
  c.first_name,
  hb.hotel_name,
  hb.check_in_date,
  hb.check_out_date,
  hb.total_price,
  hb.status,
  COUNT(DISTINCT sr.id) as special_requests_count,
  COUNT(DISTINCT bd.id) as documents_count,
  COUNT(DISTINCT br.id) as bargain_rounds_count,
  hb.created_at
FROM hotel_bookings hb
LEFT JOIN customers c ON hb.customer_id = c.id
LEFT JOIN special_requests sr ON hb.id = sr.booking_id
LEFT JOIN booking_documents bd ON hb.id = bd.booking_id
LEFT JOIN bargain_rounds br ON hb.id = br.booking_id
GROUP BY hb.id, c.id;

-- =====================================================
-- 9. CUSTOMER LOYALTY SUMMARY VIEW
-- =====================================================
CREATE OR REPLACE VIEW customer_loyalty_summary AS
SELECT 
  c.id,
  c.customer_id,
  c.email,
  c.first_name,
  c.loyalty_tier,
  c.loyalty_points_balance,
  c.loyalty_points_lifetime,
  COUNT(DISTINCT hb.id) as total_bookings,
  SUM(hb.total_price) as lifetime_spending,
  MAX(le.event_date) as last_activity
FROM customers c
LEFT JOIN hotel_bookings hb ON c.id = hb.customer_id
LEFT JOIN loyalty_events le ON c.id = le.customer_id
GROUP BY c.id;

-- =====================================================
-- 10. TRIGGER: Auto-update timestamp on customers
-- =====================================================
CREATE OR REPLACE FUNCTION update_customers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customers_timestamp ON customers;
CREATE TRIGGER trigger_update_customers_timestamp
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customers_timestamp();

-- =====================================================
-- 11. TRIGGER: Auto-log changes to audit_logs
-- =====================================================
CREATE OR REPLACE FUNCTION log_changes_to_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    CURRENT_TIMESTAMP
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_customers ON customers;
CREATE TRIGGER trigger_audit_customers
AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW
EXECUTE FUNCTION log_changes_to_audit();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
