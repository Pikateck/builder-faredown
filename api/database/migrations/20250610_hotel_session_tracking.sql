-- Migration: Hotel Session Tracking
-- Adds TBO session metadata tracking for search results
-- Enables session expiry monitoring and price hold tracking

BEGIN;

-- ============================================================
-- Add session tracking columns to hotel_search_cache
-- ============================================================
ALTER TABLE public.hotel_search_cache ADD COLUMN IF NOT EXISTS tbo_trace_id VARCHAR(100);
ALTER TABLE public.hotel_search_cache ADD COLUMN IF NOT EXISTS tbo_token_id VARCHAR(100);
ALTER TABLE public.hotel_search_cache ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ;
ALTER TABLE public.hotel_search_cache ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ;
ALTER TABLE public.hotel_search_cache ADD COLUMN IF NOT EXISTS supplier VARCHAR(20) DEFAULT 'TBO';

-- Add supplier metadata JSONB column for full TBO response
ALTER TABLE public.hotel_search_cache ADD COLUMN IF NOT EXISTS supplier_metadata JSONB;

-- ============================================================
-- Add session tracking columns to hotel_search_cache_results
-- ============================================================
ALTER TABLE public.hotel_search_cache_results ADD COLUMN IF NOT EXISTS result_index INTEGER;
ALTER TABLE public.hotel_search_cache_results ADD COLUMN IF NOT EXISTS hotel_code VARCHAR(100);
ALTER TABLE public.hotel_search_cache_results ADD COLUMN IF NOT EXISTS category_id VARCHAR(100);
ALTER TABLE public.hotel_search_cache_results ADD COLUMN IF NOT EXISTS is_tbo_mapped BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hotel_search_cache_results ADD COLUMN IF NOT EXISTS room_type_code VARCHAR(100);
ALTER TABLE public.hotel_search_cache_results ADD COLUMN IF NOT EXISTS supplier_room_metadata JSONB;

-- ============================================================
-- Update indexes for session tracking
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_hotel_cache_session_expires 
  ON public.hotel_search_cache(session_expires_at) 
  WHERE session_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hotel_cache_trace_id 
  ON public.hotel_search_cache(tbo_trace_id) 
  WHERE tbo_trace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hotel_cache_supplier 
  ON public.hotel_search_cache(supplier, cached_at DESC);

-- ============================================================
-- Add comment documentation
-- ============================================================
COMMENT ON COLUMN public.hotel_search_cache.tbo_trace_id IS 'TBO TraceId from GetHotelResult (required for BlockRoom/Book)';
COMMENT ON COLUMN public.hotel_search_cache.tbo_token_id IS 'TBO TokenId used for this search (valid 24h)';
COMMENT ON COLUMN public.hotel_search_cache.session_started_at IS 'When the search was performed (TBO session start)';
COMMENT ON COLUMN public.hotel_search_cache.session_expires_at IS 'When the session expires (for price hold validity)';
COMMENT ON COLUMN public.hotel_search_cache.supplier_metadata IS 'Full supplier response metadata (TBO/Hotelbeds/etc)';

COMMENT ON COLUMN public.hotel_search_cache_results.result_index IS 'TBO ResultIndex (0-based index from search response)';
COMMENT ON COLUMN public.hotel_search_cache_results.hotel_code IS 'TBO HotelCode (required for GetHotelRoom)';
COMMENT ON COLUMN public.hotel_search_cache_results.category_id IS 'TBO CategoryId (required for de-dupe hotels in BlockRoom/Book)';
COMMENT ON COLUMN public.hotel_search_cache_results.is_tbo_mapped IS 'Whether this is a de-dupe hotel (IsTBOMapped flag)';
COMMENT ON COLUMN public.hotel_search_cache_results.supplier_room_metadata IS 'Full room metadata from supplier for bargain/booking';

COMMIT;
