-- Recent Searches Migration
-- Creates table to store user search history for quick access

CREATE TABLE IF NOT EXISTS public.recent_searches (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            UUID NULL,                 -- nullable for guests
  device_id          TEXT NULL,                 -- cookie/localStorage id for guests
  module             TEXT NOT NULL CHECK (module IN ('flights','hotels','flight_hotel','cars','activities','taxis','sightseeing','transfers')),
  query_hash         TEXT NOT NULL,             -- dedupe key for identical searches
  query              JSONB NOT NULL,            -- normalized payload
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookups
CREATE INDEX IF NOT EXISTS idx_recent_searches_user_id ON public.recent_searches (user_id DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_searches_device_id ON public.recent_searches (device_id DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_searches_module ON public.recent_searches (module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_searches_query_hash ON public.recent_searches (query_hash);

-- Ensure unique searches per user/device
CREATE UNIQUE INDEX IF NOT EXISTS idx_recent_searches_unique_query 
ON public.recent_searches (
  COALESCE(user_id::text, device_id), 
  query_hash
);

-- Add constraint to ensure either user_id or device_id is provided
ALTER TABLE public.recent_searches 
ADD CONSTRAINT chk_recent_searches_identity 
CHECK (user_id IS NOT NULL OR device_id IS NOT NULL);

-- Optional: Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_recent_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_recent_searches_updated_at
    BEFORE UPDATE ON public.recent_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_recent_searches_updated_at();

-- Optional: Create function to clean up old entries (keep only 20 most recent per user/device/module)
CREATE OR REPLACE FUNCTION cleanup_old_recent_searches()
RETURNS void AS $$
BEGIN
    -- Clean up old entries, keeping only 20 most recent per user/device/module combination
    WITH ranked_searches AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY COALESCE(user_id::text, device_id), module 
                   ORDER BY created_at DESC
               ) as rn
        FROM public.recent_searches
    )
    DELETE FROM public.recent_searches 
    WHERE id IN (
        SELECT id FROM ranked_searches WHERE rn > 20
    );
END;
$$ LANGUAGE plpgsql;
