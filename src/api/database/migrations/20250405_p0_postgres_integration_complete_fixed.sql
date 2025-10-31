-- P0 Postgres Integration - Fixed Version
-- Compatible with existing hotel_bookings (INTEGER id) schema
-- This migration adds missing P0 tables and enhancements without breaking existing schema

BEGIN;

-- ============================================================================
-- 1. SPECIAL REQUESTS TABLE (no foreign key needed, just booking_id INTEGER)
-- ============================================================================
CREATE TABLE IF NOT EXISTS special_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id INTEGER,
  request_type VARCHAR(100) NOT NULL,
  request_text TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_special_requests_booking_id ON special_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_special_requests_status ON special_requests(status);
CREATE INDEX IF NOT EXISTS idx_special_requests_created_at ON special_requests(created_at);

COMMENT ON TABLE special_requests IS 'Guest special requests for bookings (non-refundable content)';
COMMENT ON COLUMN special_requests.booking_id IS 'Reference to hotel_bookings.id (INTEGER)';
COMMENT ON COLUMN special_requests.request_type IS 'Type: pickup, dryclean, extra_bed, etc.';

-- ============================================================================
-- 2. BOOKING DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS booking_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id INTEGER,
  document_type VARCHAR(50) NOT NULL,
  document_url TEXT,
  document_base64 TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_latest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_documents_booking_id ON booking_documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_documents_type ON booking_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_booking_documents_is_latest ON booking_documents(is_latest);

COMMENT ON TABLE booking_documents IS 'Vouchers, invoices, and other booking documents';
COMMENT ON COLUMN booking_documents.booking_id IS 'Reference to hotel_bookings.id (INTEGER)';
COMMENT ON COLUMN booking_documents.document_type IS 'voucher, invoice, confirmation, etc.';

-- ============================================================================
-- 3. LOYALTY EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS loyalty_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id INTEGER,
  user_id INTEGER,
  event_type VARCHAR(50) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  monetary_value DECIMAL(10,2),
  tier_category VARCHAR(50),
  event_metadata JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_events_booking_id ON loyalty_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_events_user_id ON loyalty_events(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_events_event_type ON loyalty_events(event_type);

COMMENT ON TABLE loyalty_events IS 'Track loyalty points and tier progression per booking';
COMMENT ON COLUMN loyalty_events.booking_id IS 'Reference to hotel_bookings.id (INTEGER) - NULL for non-booking events';

-- ============================================================================
-- 4. AUDIT LOGS TABLE (if doesn't exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(100),
  action VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

COMMENT ON TABLE audit_logs IS 'Audit trail for all changes to bookings and related data';

-- ============================================================================
-- 5. ADD MISSING COLUMNS TO hotel_bookings (if not already present)
-- ============================================================================
ALTER TABLE hotel_bookings
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS bargained_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_redeemed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bargain_round_id UUID,
ADD COLUMN IF NOT EXISTS bargain_accepted_at TIMESTAMP WITHOUT TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_hotel_bookings_original_price ON hotel_bookings(original_price);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_bargained_price ON hotel_bookings(bargained_price);

-- ============================================================================
-- 6. VIEW: BOOKING SUMMARY (Compatible with existing schema)
-- ============================================================================
CREATE OR REPLACE VIEW booking_summary_v2 AS
SELECT 
  hb.id,
  hb.booking_ref,
  hb.hotel_name,
  hb.hotel_city,
  hb.check_in_date,
  hb.check_out_date,
  hb.nights,
  hb.rooms_count,
  hb.adults_count,
  hb.children_count,
  hb.base_price,
  hb.markup_amount,
  hb.taxes,
  hb.fees,
  hb.total_amount,
  hb.original_price,
  hb.bargained_price,
  hb.discount_amount,
  COALESCE(hb.discount_percentage, 0) as discount_percentage,
  hb.status,
  hb.currency,
  COALESCE(hb.points_earned, 0) as points_earned,
  COALESCE(hb.points_redeemed, 0) as points_redeemed,
  hb.bargain_status,
  hb.final_paid_amount,
  (SELECT COUNT(*) FROM booking_documents bd WHERE bd.booking_id = hb.id AND bd.document_type = 'voucher' AND bd.is_latest) as voucher_generated,
  (SELECT COUNT(*) FROM booking_documents bd WHERE bd.booking_id = hb.id AND bd.document_type = 'invoice' AND bd.is_latest) as invoice_generated,
  (SELECT COUNT(*) FROM special_requests sr WHERE sr.booking_id = hb.id AND sr.status != 'cancelled') as special_requests_count,
  hb.booking_date,
  hb.confirmation_date,
  hb.created_at,
  hb.updated_at
FROM hotel_bookings hb;

-- ============================================================================
-- 7. AUDIT TRIGGER (if function doesn't exist)
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, created_at)
  VALUES ('hotel_bookings', NEW.booking_ref::TEXT, TG_OP, row_to_json(OLD), row_to_json(NEW), CURRENT_TIMESTAMP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists, so just ensure the function is up to date
-- No need to recreate the trigger

-- ============================================================================
-- 8. SUMMARY
-- ============================================================================
-- Successfully created/updated:
-- - special_requests table
-- - booking_documents table
-- - loyalty_events table
-- - audit_logs table
-- - Added missing columns to hotel_bookings
-- - booking_summary_v2 view
-- - audit_booking_changes function

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After running this migration, verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('special_requests', 'booking_documents', 'loyalty_events', 'audit_logs');
-- SELECT column_name FROM information_schema.columns WHERE table_name='hotel_bookings' AND column_name IN ('original_price', 'bargained_price', 'discount_amount', 'points_earned');
-- SELECT table_name FROM information_schema.views WHERE table_schema='public' AND table_name='booking_summary_v2';
