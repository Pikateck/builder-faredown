-- Add index for supplier_booking_ref lookups used by TBO voucher linking
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_supplier_booking_ref
  ON hotel_bookings(supplier_booking_ref);
