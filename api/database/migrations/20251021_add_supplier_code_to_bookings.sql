BEGIN;

-- Add supplier_code to bookings (used for routing/analytics)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS supplier_code TEXT;

-- Optional backfill could be run manually if needed
-- UPDATE public.bookings SET supplier_code = LOWER(supplier) WHERE supplier_code IS NULL AND supplier IS NOT NULL;

-- Make lookups fast: supplier_code + status
CREATE INDEX IF NOT EXISTS idx_bookings_supplier_enabled
  ON public.bookings (supplier_code, status);

-- Helpful for search log queries already used
CREATE INDEX IF NOT EXISTS idx_search_logs_created
  ON public.search_logs (created_at DESC);

-- Mirror the field on hotel_bookings for supplier-scoped filters
ALTER TABLE public.hotel_bookings
  ADD COLUMN IF NOT EXISTS supplier_code TEXT;

COMMIT;
