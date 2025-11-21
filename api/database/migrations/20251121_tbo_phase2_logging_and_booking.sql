/**
 * TBO Phase 2: Logging Infrastructure + Booking Chain
 * Date: 2025-11-21
 * Purpose: Add comprehensive logging for TBO requests/responses and booking persistence
 */

-- =============================================================================
-- 1. CREATE TBO_TRACE_LOGS TABLE
-- =============================================================================
-- Captures every TBO API request/response for certification debugging and auditing

CREATE TABLE IF NOT EXISTS public.tbo_trace_logs (
  id BIGSERIAL PRIMARY KEY,
  trace_id UUID NOT NULL,
  session_id UUID,
  request_type VARCHAR(50) NOT NULL, -- 'search', 'room', 'prebook', 'block', 'book', 'voucher'
  endpoint_name VARCHAR(100) NOT NULL,
  
  -- Request details
  request_payload JSONB,
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Response details
  response_payload JSONB,
  response_timestamp TIMESTAMPTZ,
  response_time_ms INTEGER,
  
  -- Status tracking
  http_status_code INTEGER,
  tbo_response_status INTEGER, -- From TBO: 1=success, 0=failure
  error_message TEXT,
  error_code VARCHAR(50),
  
  -- Context
  hotel_code VARCHAR(50),
  search_hash VARCHAR(32),
  booking_id VARCHAR(50),
  user_id UUID,
  
  -- Metadata
  supplier VARCHAR(20) DEFAULT 'TBO',
  environment VARCHAR(20), -- 'production', 'staging', 'test'
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_tbo_trace_trace_id ON public.tbo_trace_logs(trace_id);
CREATE INDEX idx_tbo_trace_session_id ON public.tbo_trace_logs(session_id);
CREATE INDEX idx_tbo_trace_request_type ON public.tbo_trace_logs(request_type);
CREATE INDEX idx_tbo_trace_hotel_code ON public.tbo_trace_logs(hotel_code);
CREATE INDEX idx_tbo_trace_search_hash ON public.tbo_trace_logs(search_hash);
CREATE INDEX idx_tbo_trace_created_at ON public.tbo_trace_logs(created_at DESC);

-- =============================================================================
-- 2. EXTEND HOTEL_SEARCH_CACHE FOR PREBOOK SESSION TRACKING
-- =============================================================================
-- Ensure we have all fields needed for session reuse through booking chain

ALTER TABLE public.hotel_search_cache
ADD COLUMN IF NOT EXISTS prebook_session_id UUID,
ADD COLUMN IF NOT EXISTS prebook_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS block_session_id UUID,
ADD COLUMN IF NOT EXISTS block_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_session_locked BOOLEAN DEFAULT FALSE;

-- Index for session locking
CREATE INDEX IF NOT EXISTS idx_hsc_is_session_locked ON public.hotel_search_cache(is_session_locked);

-- =============================================================================
-- 3. CREATE TBO_BOOKING_SESSIONS TABLE
-- =============================================================================
-- Track booking session lifecycle: Search → Room → PreBook → Block → Book → Voucher

CREATE TABLE IF NOT EXISTS public.tbo_booking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session identification
  search_hash VARCHAR(32) NOT NULL UNIQUE,
  trace_id UUID NOT NULL,
  token_id VARCHAR(36),
  
  -- Session lifecycle
  search_completed_at TIMESTAMPTZ,
  room_details_fetched_at TIMESTAMPTZ,
  prebook_completed_at TIMESTAMPTZ,
  block_completed_at TIMESTAMPTZ,
  book_completed_at TIMESTAMPTZ,
  voucher_generated_at TIMESTAMPTZ,
  
  -- Session validation
  session_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_expires_at TIMESTAMPTZ,
  session_ttl_seconds INTEGER DEFAULT 86400, -- 24 hours
  is_expired BOOLEAN DEFAULT FALSE,
  
  -- Booking details
  hotel_code VARCHAR(50),
  booking_reference VARCHAR(100),
  
  -- Session status
  current_step VARCHAR(50), -- 'search', 'room', 'prebook', 'block', 'book', 'voucher', 'completed'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'expired'
  
  -- Error tracking
  last_error_message TEXT,
  last_error_code VARCHAR(50),
  error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tbs_search_hash ON public.tbo_booking_sessions(search_hash);
CREATE INDEX idx_tbs_trace_id ON public.tbo_booking_sessions(trace_id);
CREATE INDEX idx_tbs_current_step ON public.tbo_booking_sessions(current_step);
CREATE INDEX idx_tbs_status ON public.tbo_booking_sessions(status);
CREATE INDEX idx_tbs_session_expires_at ON public.tbo_booking_sessions(session_expires_at);

-- =============================================================================
-- 4. EXTEND BOOKINGS TABLE FOR TBO DETAILS
-- =============================================================================
-- Ensure full TBO response persistence

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS tbo_trace_id UUID,
ADD COLUMN IF NOT EXISTS tbo_booking_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS tbo_hotel_confirmation_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS tbo_full_response JSONB,
ADD COLUMN IF NOT EXISTS tbo_session_id UUID,
ADD COLUMN IF NOT EXISTS prebook_response JSONB,
ADD COLUMN IF NOT EXISTS block_response JSONB,
ADD COLUMN IF NOT EXISTS book_response JSONB,
ADD COLUMN IF NOT EXISTS voucher_response JSONB,
ADD COLUMN IF NOT EXISTS price_at_search NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS price_at_block NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS price_at_book NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS is_price_changed_at_block BOOLEAN,
ADD COLUMN IF NOT EXISTS is_policy_changed_at_block BOOLEAN;

-- Index for TBO bookings
CREATE INDEX IF NOT EXISTS idx_bookings_tbo_trace_id ON public.bookings(tbo_trace_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tbo_booking_ref ON public.bookings(tbo_booking_reference);

-- =============================================================================
-- 5. GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.tbo_trace_logs TO public;
GRANT SELECT, INSERT, UPDATE ON public.tbo_booking_sessions TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO public;

-- =============================================================================
-- MIGRATION VERIFICATION
-- =============================================================================
-- Run these queries to verify:
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tbo_trace_logs';
-- SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'hotel_search_cache' AND column_name = 'prebook_session_id';
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tbo_booking_sessions';
