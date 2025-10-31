-- P0 Postgres Integration - Fixed for Existing Schema
-- Tables special_requests, booking_documents, loyalty_events already exist with UUID booking_id
-- This migration completes audit setup and adds missing hotel_bookings columns

BEGIN;

-- ============================================================================
-- AUDIT LOGS TABLE (if doesn't exist)
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

-- ============================================================================
-- ADD MISSING COLUMNS TO hotel_bookings (if not already present)
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
-- AUDIT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, created_at)
  VALUES ('hotel_bookings', NEW.booking_ref::TEXT, TG_OP, row_to_json(OLD), row_to_json(NEW), CURRENT_TIMESTAMP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Completed:
-- ✅ special_requests table (already exists with UUID booking_id)
-- ✅ booking_documents table (already exists with UUID booking_id)
-- ✅ loyalty_events table (already exists with customer_id)
-- ✅ audit_logs table (created now)
-- ✅ Added missing columns to hotel_bookings
-- ✅ audit_booking_changes function

COMMIT;
