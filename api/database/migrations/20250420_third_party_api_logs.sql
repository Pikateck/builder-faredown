-- =====================================================
-- Third Party API Logging System
-- Created: 2025-04-20
-- Purpose: Store all third-party supplier request/response logs for debugging and audit
-- =====================================================

-- Create third_party_api_logs table in public schema
CREATE TABLE IF NOT EXISTS public.third_party_api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Supplier information
    supplier_name VARCHAR(100) NOT NULL, -- e.g., 'TBO', 'HOTELBEDS', 'AMADEUS', 'RATEHAWK'
    endpoint VARCHAR(500) NOT NULL, -- Full endpoint URL or path
    method VARCHAR(10) DEFAULT 'POST', -- HTTP method (GET, POST, etc.)
    
    -- Request details
    request_payload JSONB, -- Full request body
    request_headers JSONB, -- Request headers (sanitized - no secrets)
    
    -- Response details
    response_payload JSONB, -- Full response body
    response_headers JSONB, -- Response headers
    status_code INTEGER, -- HTTP status code (200, 404, 500, etc.)
    
    -- Error tracking
    error_message TEXT, -- Error message if request failed
    error_stack TEXT, -- Error stack trace if available
    
    -- Timing information
    request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_timestamp TIMESTAMPTZ,
    duration_ms INTEGER, -- Response time in milliseconds
    
    -- Correlation and tracing
    trace_id VARCHAR(255), -- For correlating related requests
    correlation_id VARCHAR(255), -- Business correlation ID (e.g., booking_ref)
    
    -- Metadata
    environment VARCHAR(50) DEFAULT 'production', -- production, staging, development
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_third_party_logs_supplier 
    ON public.third_party_api_logs (supplier_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_third_party_logs_timestamp 
    ON public.third_party_api_logs (request_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_third_party_logs_status 
    ON public.third_party_api_logs (status_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_third_party_logs_trace 
    ON public.third_party_api_logs (trace_id) 
    WHERE trace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_third_party_logs_correlation 
    ON public.third_party_api_logs (correlation_id) 
    WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_third_party_logs_errors 
    ON public.third_party_api_logs (supplier_name, created_at DESC) 
    WHERE error_message IS NOT NULL;

-- Add comment to table
COMMENT ON TABLE public.third_party_api_logs IS 
    'Stores all third-party supplier API request/response logs for debugging, audit, and monitoring';

-- Add comments to important columns
COMMENT ON COLUMN public.third_party_api_logs.supplier_name IS 
    'Name of the third-party supplier (TBO, HOTELBEDS, AMADEUS, RATEHAWK)';
COMMENT ON COLUMN public.third_party_api_logs.request_payload IS 
    'Full request body sent to the supplier API (JSONB format)';
COMMENT ON COLUMN public.third_party_api_logs.response_payload IS 
    'Full response body received from the supplier API (JSONB format)';
COMMENT ON COLUMN public.third_party_api_logs.trace_id IS 
    'Unique identifier for tracing related requests across services';
COMMENT ON COLUMN public.third_party_api_logs.correlation_id IS 
    'Business correlation identifier (e.g., booking reference, search ID)';

-- Retention policy function (optional - can be called via cron job)
-- This will delete logs older than 90 days to manage storage
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.third_party_api_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_api_logs IS 
    'Deletes API logs older than 90 days. Returns count of deleted rows.';
