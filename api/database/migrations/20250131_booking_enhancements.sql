-- Migration: Booking Enhancements - PAN, Detailed Amounts, Payment Details, Cancellation Policy
-- Date: 2025-01-31
-- Description: Add PAN to customers and bookings, detailed tax breakdown, payment method details, and full cancellation policy

-- ================================================================
-- 1. Add PAN to customers table (master record)
-- ================================================================
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS pan VARCHAR(10) CHECK (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$' OR pan IS NULL);

CREATE INDEX IF NOT EXISTS idx_customers_pan ON customers(pan) WHERE pan IS NOT NULL;

-- ================================================================
-- 2. Add enhanced fields to bookings table
-- ================================================================

-- PAN snapshot (captured at booking time)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS pan VARCHAR(10) CHECK (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$' OR pan IS NULL);

-- Special requests (already exists in some schemas, add if missing)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Full cancellation policy text (snapshot at booking time)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancellation_policy_full TEXT;

-- Detailed amounts breakdown (JSONB for flexibility)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS amounts JSONB DEFAULT '{
  "room_subtotal": 0,
  "taxes_and_fees": {
    "gst_vat": 0,
    "municipal_tax": 0,
    "service_fee": 0
  },
  "bargain_discount": 0,
  "promo_discount": 0,
  "payment_surcharge": 0,
  "grand_total": 0
}'::jsonb;

-- Payment details (JSONB for card brand, last4, auth code, etc.)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment JSONB DEFAULT '{
  "method": "card",
  "brand": null,
  "last4": null,
  "exp_month": null,
  "exp_year": null,
  "auth_code": null,
  "status": "pending"
}'::jsonb;

-- ================================================================
-- 3. Create indexes for efficient querying
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_bookings_pan ON bookings(pan) WHERE pan IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings((payment->>'status'));
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings((payment->>'method'));

-- ================================================================
-- 4. Add comments for documentation
-- ================================================================
COMMENT ON COLUMN customers.pan IS 'Permanent Account Number (India) - Format: AAAAA9999A - Required for INR bookings';
COMMENT ON COLUMN bookings.pan IS 'PAN captured at booking time (snapshot) - Format: AAAAA9999A';
COMMENT ON COLUMN bookings.special_requests IS 'Customer special requests from preferences step';
COMMENT ON COLUMN bookings.cancellation_policy_full IS 'Complete cancellation policy text captured at booking time';
COMMENT ON COLUMN bookings.amounts IS 'Detailed price breakdown: room_subtotal, taxes_and_fees (gst_vat, municipal_tax, service_fee), bargain_discount, promo_discount, payment_surcharge, grand_total';
COMMENT ON COLUMN bookings.payment IS 'Payment method details: method, brand, last4, exp_month, exp_year, auth_code, status';

-- ================================================================
-- 5. Sample data validation function
-- ================================================================
CREATE OR REPLACE FUNCTION validate_pan(pan_value TEXT) RETURNS BOOLEAN AS $$
BEGIN
  -- PAN format: 5 letters + 4 digits + 1 letter (uppercase)
  RETURN pan_value ~ '^[A-Z]{5}[0-9]{4}[A-Z]$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_pan IS 'Validates PAN card format (India): AAAAA9999A';

-- ================================================================
-- 6. Update existing bookings with default amounts structure
-- ================================================================
UPDATE bookings 
SET amounts = jsonb_build_object(
  'room_subtotal', COALESCE(total_amount, 0),
  'taxes_and_fees', jsonb_build_object(
    'gst_vat', ROUND(COALESCE(total_amount, 0) * 0.12),
    'municipal_tax', ROUND(COALESCE(total_amount, 0) * 0.04),
    'service_fee', ROUND(COALESCE(total_amount, 0) * 0.02)
  ),
  'bargain_discount', 0,
  'promo_discount', 0,
  'payment_surcharge', 0,
  'grand_total', COALESCE(total_amount, 0)
)
WHERE amounts IS NULL OR amounts = '{}'::jsonb;

-- ================================================================
-- 7. Update existing bookings with default payment structure
-- ================================================================
UPDATE bookings 
SET payment = jsonb_build_object(
  'method', COALESCE(payment_method, 'card'),
  'brand', NULL,
  'last4', NULL,
  'exp_month', NULL,
  'exp_year', NULL,
  'auth_code', NULL,
  'status', COALESCE(status, 'pending')
)
WHERE payment IS NULL OR payment = '{}'::jsonb;

-- ================================================================
-- END OF MIGRATION
-- ================================================================
