-- ============================================================
-- Add Session Tracking Columns to hotel_search_cache
-- Purpose: Support TBO session management and tracing
-- ============================================================

BEGIN;

-- Add missing columns to hotel_search_cache table
ALTER TABLE IF EXISTS public.hotel_search_cache
ADD COLUMN IF NOT EXISTS tbo_trace_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS tbo_token_id VARCHAR(500),
ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS supplier VARCHAR(50),
ADD COLUMN IF NOT EXISTS supplier_metadata JSONB;

-- Add index for tracing
CREATE INDEX IF NOT EXISTS idx_search_cache_trace_id ON public.hotel_search_cache(tbo_trace_id);
CREATE INDEX IF NOT EXISTS idx_search_cache_supplier ON public.hotel_search_cache(supplier);

COMMIT;
