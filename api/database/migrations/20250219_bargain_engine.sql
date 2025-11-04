-- ============================================================================
-- BARGAIN ENGINE - Phase A Database Migration
-- Created: 2025-02-19
-- Purpose: Module-specific bargain system with admin controls
-- ============================================================================

-- Create module enum type
DO $$ BEGIN
    CREATE TYPE module_type AS ENUM ('hotels','flights','sightseeing','transfers','packages','addons');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: bargain_settings
-- Purpose: Global settings per module (admin-configurable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bargain_settings (
    id BIGSERIAL PRIMARY KEY,
    module module_type NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    attempts SMALLINT NOT NULL DEFAULT 2,
    r1_timer_sec SMALLINT NOT NULL DEFAULT 30,
    r2_timer_sec SMALLINT NOT NULL DEFAULT 30,
    discount_min_pct SMALLINT NOT NULL DEFAULT 0,
    discount_max_pct SMALLINT NOT NULL DEFAULT 30,
    show_recommended_badge BOOLEAN NOT NULL DEFAULT TRUE,
    recommended_label TEXT NOT NULL DEFAULT 'Recommended',
    show_standard_price_on_expiry BOOLEAN NOT NULL DEFAULT TRUE,
    price_match_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    copy_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    experiment_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT,
    CONSTRAINT valid_attempts CHECK (attempts >= 0 AND attempts <= 2),
    CONSTRAINT valid_timers CHECK (r1_timer_sec > 0 AND r2_timer_sec > 0),
    CONSTRAINT valid_discount CHECK (discount_min_pct >= 0 AND discount_max_pct <= 100 AND discount_min_pct <= discount_max_pct)
);

-- ============================================================================
-- TABLE: bargain_market_rules
-- Purpose: Country/city-specific overrides for bargain settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS bargain_market_rules (
    id BIGSERIAL PRIMARY KEY,
    module module_type NOT NULL,
    country_code TEXT,
    city TEXT,
    attempts SMALLINT,
    r1_timer_sec SMALLINT,
    r2_timer_sec SMALLINT,
    discount_min_pct SMALLINT,
    discount_max_pct SMALLINT,
    copy_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_market_rule UNIQUE (module, COALESCE(country_code,''), COALESCE(city,'')),
    CONSTRAINT valid_market_attempts CHECK (attempts IS NULL OR (attempts >= 0 AND attempts <= 2)),
    CONSTRAINT valid_market_timers CHECK (
        (r1_timer_sec IS NULL OR r1_timer_sec > 0) AND 
        (r2_timer_sec IS NULL OR r2_timer_sec > 0)
    ),
    CONSTRAINT valid_market_discount CHECK (
        (discount_min_pct IS NULL OR discount_min_pct >= 0) AND
        (discount_max_pct IS NULL OR discount_max_pct <= 100) AND
        (discount_min_pct IS NULL OR discount_max_pct IS NULL OR discount_min_pct <= discount_max_pct)
    )
);

-- ============================================================================
-- TABLE: bargain_sessions
-- Purpose: Runtime session tracking for each bargain attempt
-- ============================================================================
CREATE TABLE IF NOT EXISTS bargain_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module module_type NOT NULL,
    product_id TEXT NOT NULL,
    user_id TEXT,
    base_price_cents INT NOT NULL,
    r1_bid_cents INT,
    r1_offer_cents INT,
    r1_action TEXT,  -- 'book'|'try_final'|'skip'|'close'|'timeout'
    r2_bid_cents INT,
    r2_offer_cents INT,
    selected_price_cents INT,
    outcome TEXT,    -- 'booked'|'expired'|'abandoned'
    metadata JSONB,  -- Store device, browser, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_base_price CHECK (base_price_cents > 0),
    CONSTRAINT valid_r1_action CHECK (r1_action IS NULL OR r1_action IN ('book','try_final','skip','close','timeout')),
    CONSTRAINT valid_outcome CHECK (outcome IS NULL OR outcome IN ('booked','expired','abandoned'))
);

-- Create indexes for bargain_sessions
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_module_created ON bargain_sessions(module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_product_id ON bargain_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_user_id ON bargain_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_outcome ON bargain_sessions(outcome) WHERE outcome IS NOT NULL;

-- ============================================================================
-- TABLE: bargain_events_raw
-- Purpose: Raw event log for analytics and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS bargain_events_raw (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    payload JSONB NOT NULL,
    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES bargain_sessions(id) ON DELETE CASCADE
);

-- Create indexes for bargain_events_raw
CREATE INDEX IF NOT EXISTS idx_bargain_events_ts ON bargain_events_raw(ts DESC);
CREATE INDEX IF NOT EXISTS idx_bargain_events_name ON bargain_events_raw(name);
CREATE INDEX IF NOT EXISTS idx_bargain_events_session_id ON bargain_events_raw(session_id);

-- ============================================================================
-- TABLE: price_match_tickets
-- Purpose: Price match requests (Hotels only in Phase A)
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_match_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module module_type NOT NULL,
    session_id UUID,
    user_id TEXT,
    product_context JSONB,
    competitor TEXT,
    competitor_price_cents INT,
    proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('open','approved','rejected','expired')),
    CONSTRAINT valid_competitor_price CHECK (competitor_price_cents IS NULL OR competitor_price_cents > 0),
    CONSTRAINT fk_price_match_session FOREIGN KEY (session_id) REFERENCES bargain_sessions(id) ON DELETE SET NULL
);

-- Create indexes for price_match_tickets
CREATE INDEX IF NOT EXISTS idx_price_match_tickets_status ON price_match_tickets(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_price_match_tickets_module_created ON price_match_tickets(module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_match_tickets_user_id ON price_match_tickets(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- SEED DATA: Default settings for each module
-- ============================================================================

-- Hotels: 2 attempts, 30 seconds each
INSERT INTO bargain_settings (
    module, enabled, attempts, r1_timer_sec, r2_timer_sec, 
    discount_min_pct, discount_max_pct, 
    show_recommended_badge, recommended_label,
    show_standard_price_on_expiry, price_match_enabled,
    copy_json, experiment_flags
) VALUES (
    'hotels', 
    true, 
    2, 
    30, 
    30,
    5,
    30,
    true,
    'Recommended',
    true,
    true,
    jsonb_build_object(
        'r1_primary', 'Book ₹{price}',
        'r1_secondary', 'Try Final Bargain',
        'r2_card_low', 'Book ₹{price} (Best price)',
        'r2_card_high', 'Book ₹{price}',
        'expiry_text', '⌛ Time''s up. This price is no longer available.',
        'expiry_cta', 'Book at Standard Price ₹{base}',
        'recommended_label', 'Recommended'
    ),
    '{}'::jsonb
) ON CONFLICT (module) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    attempts = EXCLUDED.attempts,
    r1_timer_sec = EXCLUDED.r1_timer_sec,
    r2_timer_sec = EXCLUDED.r2_timer_sec,
    discount_min_pct = EXCLUDED.discount_min_pct,
    discount_max_pct = EXCLUDED.discount_max_pct,
    show_recommended_badge = EXCLUDED.show_recommended_badge,
    recommended_label = EXCLUDED.recommended_label,
    show_standard_price_on_expiry = EXCLUDED.show_standard_price_on_expiry,
    price_match_enabled = EXCLUDED.price_match_enabled,
    copy_json = EXCLUDED.copy_json,
    updated_at = now();

-- Flights: 1 attempt, 15 seconds
INSERT INTO bargain_settings (
    module, enabled, attempts, r1_timer_sec, r2_timer_sec,
    discount_min_pct, discount_max_pct,
    show_recommended_badge, recommended_label,
    show_standard_price_on_expiry, price_match_enabled,
    copy_json, experiment_flags
) VALUES (
    'flights',
    true,
    1,
    15,
    0,
    3,
    20,
    true,
    'Best deal',
    true,
    false,
    jsonb_build_object(
        'r1_primary', 'Book ₹{price}',
        'r1_secondary', 'Skip bargain',
        'r2_card_low', '',
        'r2_card_high', '',
        'expiry_text', '⌛ Time''s up. This price is no longer available.',
        'expiry_cta', 'Book at Standard Price ₹{base}',
        'recommended_label', 'Best deal'
    ),
    '{}'::jsonb
) ON CONFLICT (module) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    attempts = EXCLUDED.attempts,
    r1_timer_sec = EXCLUDED.r1_timer_sec,
    discount_min_pct = EXCLUDED.discount_min_pct,
    discount_max_pct = EXCLUDED.discount_max_pct,
    show_recommended_badge = EXCLUDED.show_recommended_badge,
    recommended_label = EXCLUDED.recommended_label,
    show_standard_price_on_expiry = EXCLUDED.show_standard_price_on_expiry,
    copy_json = EXCLUDED.copy_json,
    updated_at = now();

-- Sightseeing: 1 attempt, 20 seconds (default)
INSERT INTO bargain_settings (
    module, enabled, attempts, r1_timer_sec, r2_timer_sec,
    discount_min_pct, discount_max_pct,
    show_recommended_badge, recommended_label,
    show_standard_price_on_expiry, price_match_enabled,
    copy_json, experiment_flags
) VALUES (
    'sightseeing',
    true,
    1,
    20,
    20,
    3,
    25,
    true,
    'Recommended',
    true,
    false,
    jsonb_build_object(
        'r1_primary', 'Book ₹{price}',
        'r1_secondary', 'Try one more time',
        'r2_card_low', 'Book ₹{price}',
        'r2_card_high', 'Book ₹{price}',
        'expiry_text', '⌛ Time''s up. This price is no longer available.',
        'expiry_cta', 'Book at Standard Price ₹{base}',
        'recommended_label', 'Recommended'
    ),
    '{}'::jsonb
) ON CONFLICT (module) DO NOTHING;

-- Transfers: 1 attempt, 20 seconds (default)
INSERT INTO bargain_settings (
    module, enabled, attempts, r1_timer_sec, r2_timer_sec,
    discount_min_pct, discount_max_pct,
    show_recommended_badge, recommended_label,
    show_standard_price_on_expiry, price_match_enabled,
    copy_json, experiment_flags
) VALUES (
    'transfers',
    true,
    1,
    20,
    20,
    3,
    25,
    true,
    'Recommended',
    true,
    false,
    jsonb_build_object(
        'r1_primary', 'Book ₹{price}',
        'r1_secondary', 'Try one more time',
        'r2_card_low', 'Book ₹{price}',
        'r2_card_high', 'Book ₹{price}',
        'expiry_text', '⌛ Time''s up. This price is no longer available.',
        'expiry_cta', 'Book at Standard Price ₹{base}',
        'recommended_label', 'Recommended'
    ),
    '{}'::jsonb
) ON CONFLICT (module) DO NOTHING;

-- Packages: Assisted mode (0 attempts for now)
INSERT INTO bargain_settings (
    module, enabled, attempts, r1_timer_sec, r2_timer_sec,
    discount_min_pct, discount_max_pct,
    show_recommended_badge, recommended_label,
    show_standard_price_on_expiry, price_match_enabled,
    copy_json, experiment_flags
) VALUES (
    'packages',
    false,
    0,
    30,
    0,
    5,
    20,
    false,
    'Best value',
    false,
    false,
    jsonb_build_object(
        'r1_primary', 'Request better price',
        'r1_secondary', 'Book now',
        'r2_card_low', '',
        'r2_card_high', '',
        'expiry_text', 'Your request has been submitted.',
        'expiry_cta', 'View standard package',
        'recommended_label', 'Best value'
    ),
    '{}'::jsonb
) ON CONFLICT (module) DO NOTHING;

-- Add-ons: No bargain (0 attempts)
INSERT INTO bargain_settings (
    module, enabled, attempts, r1_timer_sec, r2_timer_sec,
    discount_min_pct, discount_max_pct,
    show_recommended_badge, recommended_label,
    show_standard_price_on_expiry, price_match_enabled,
    copy_json, experiment_flags
) VALUES (
    'addons',
    false,
    0,
    0,
    0,
    0,
    0,
    false,
    '',
    false,
    false,
    '{}'::jsonb,
    '{}'::jsonb
) ON CONFLICT (module) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for bargain_settings
DROP TRIGGER IF EXISTS update_bargain_settings_updated_at ON bargain_settings;
CREATE TRIGGER update_bargain_settings_updated_at
    BEFORE UPDATE ON bargain_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bargain_market_rules
DROP TRIGGER IF EXISTS update_bargain_market_rules_updated_at ON bargain_market_rules;
CREATE TRIGGER update_bargain_market_rules_updated_at
    BEFORE UPDATE ON bargain_market_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bargain_sessions
DROP TRIGGER IF EXISTS update_bargain_sessions_updated_at ON bargain_sessions;
CREATE TRIGGER update_bargain_sessions_updated_at
    BEFORE UPDATE ON bargain_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for price_match_tickets
DROP TRIGGER IF EXISTS update_price_match_tickets_updated_at ON price_match_tickets;
CREATE TRIGGER update_price_match_tickets_updated_at
    BEFORE UPDATE ON price_match_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify migration success:
-- SELECT * FROM bargain_settings ORDER BY module;
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'bargain%';
-- SELECT COUNT(*) FROM bargain_settings;
