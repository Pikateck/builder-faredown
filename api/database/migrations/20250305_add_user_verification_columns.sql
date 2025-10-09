-- Adds explicit verification tracking columns for admin status reporting
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Backfill NULL flags for legacy rows
UPDATE public.users
   SET is_verified = COALESCE(is_verified, FALSE)
 WHERE is_verified IS NULL;
