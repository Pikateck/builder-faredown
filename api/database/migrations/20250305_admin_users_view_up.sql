-- Creates an admin-facing view with derived status field
CREATE OR REPLACE VIEW public.admin_users_v AS
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.phone,
    u.nationality_iso2,
    u.role,
    u.is_active,
    u.is_verified,
    u.verified_at,
    CASE
        WHEN u.is_active = FALSE THEN 'inactive'
        WHEN u.is_verified = TRUE THEN 'active'
        ELSE 'pending'
    END AS status,
    u.created_at,
    u.updated_at
FROM public.users u;

-- Helpful indexes to keep lookups fast (idempotent, optional if already present)
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON public.users (is_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users (is_active);
