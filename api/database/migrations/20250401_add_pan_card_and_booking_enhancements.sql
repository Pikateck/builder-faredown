-- =====================================================
-- Migration: Add PAN Card and Booking Enhancements
-- Created: 2025-04-01
-- =====================================================

-- Add new columns to hotel_bookings table
ALTER TABLE hotel_bookings
ADD COLUMN IF NOT EXISTS pan_card VARCHAR(20),
ADD COLUMN IF NOT EXISTS bargain_summary JSONB,
ADD COLUMN IF NOT EXISTS customer_id UUID,
ADD COLUMN IF NOT EXISTS original_price NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS bargained_price NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS bargain_rounds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS voucher_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMP;

-- Create bargain_ledger table to track bargain history
CREATE TABLE IF NOT EXISTS bargain_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  customer_offer NUMERIC(12, 2),
  seller_counter NUMERIC(12, 2),
  status VARCHAR(50), -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create booking_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS booking_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- created, modified, confirmed, voucher_sent, invoice_sent, etc.
  details JSONB,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_pan_card ON hotel_bookings(pan_card);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_customer_id ON hotel_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_payment_status ON hotel_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bargain_ledger_booking_id ON bargain_ledger(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_activity_log_booking_id ON booking_activity_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_activity_log_action ON booking_activity_log(action);

-- Add comments for documentation
COMMENT ON COLUMN hotel_bookings.pan_card IS 'PAN Card Number (mandatory for Indian customers)';
COMMENT ON COLUMN hotel_bookings.bargain_summary IS 'Summary of bargain negotiations in JSON format';
COMMENT ON COLUMN hotel_bookings.original_price IS 'Original quoted price before bargain';
COMMENT ON COLUMN hotel_bookings.bargained_price IS 'Final price after bargain negotiations';
COMMENT ON COLUMN hotel_bookings.discount_amount IS 'Total discount amount applied';
COMMENT ON COLUMN hotel_bookings.discount_percentage IS 'Discount percentage applied';
COMMENT ON COLUMN hotel_bookings.bargain_rounds IS 'Number of bargain rounds completed';
COMMENT ON COLUMN hotel_bookings.payment_method IS 'Payment method used (credit_card, debit_card, net_banking, wallet, etc.)';
COMMENT ON COLUMN hotel_bookings.payment_status IS 'Payment status (pending, completed, failed, refunded)';

COMMENT ON TABLE bargain_ledger IS 'Detailed tracking of each bargain round';
COMMENT ON TABLE booking_activity_log IS 'Audit trail for all booking activities';
