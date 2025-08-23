-- Conversational Bargain Feature Database Migration
-- PostgreSQL schema for AI-powered price negotiation system
-- Version: 1.0.0
-- Created: 2025

-- Enable UUID extension for session IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create modules table (product types)
CREATE TABLE IF NOT EXISTS modules (
  id            SERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL CHECK (name IN ('flights','hotels','sightseeing','transfers')),
  display_name  TEXT NOT NULL,
  icon          TEXT,
  description   TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bargain sessions table (one per user×itinerary with AI state)
CREATE TABLE IF NOT EXISTS bargain_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID,                                    -- nullable for guest users
  module_id      INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  product_ref    TEXT NOT NULL,                          -- external reference (flight ID, hotel ID, etc.)
  attempt_count  INT NOT NULL DEFAULT 0,
  max_attempts   INT NOT NULL DEFAULT 3,
  ai_personality TEXT NOT NULL DEFAULT 'standard',       -- AI behavior type
  emotional_state JSONB DEFAULT '{}'::jsonb,             -- AI emotional context
  user_context   JSONB DEFAULT '{}'::jsonb,              -- user preferences, history
  base_price     NUMERIC(12,2) NOT NULL,                 -- original price
  final_price    NUMERIC(12,2),                          -- negotiated price if successful
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','completed','expired','cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ                             -- session expiration
);

-- Create event log with emotional decision tracking
CREATE TABLE IF NOT EXISTS bargain_events (
  id             BIGSERIAL PRIMARY KEY,
  session_id     UUID NOT NULL REFERENCES bargain_sessions(id) ON DELETE CASCADE,
  attempt_no     INT NOT NULL,                           -- round number (1, 2, 3)
  user_offer     NUMERIC(12,2) NOT NULL,                 -- price offered by user
  base_price     NUMERIC(12,2) NOT NULL,                 -- original price
  result_price   NUMERIC(12,2),                          -- AI counter-offer or accepted price
  status         TEXT NOT NULL CHECK (status IN ('accepted','counter','reprice_needed','expired','error')),
  acceptance_chance NUMERIC(5,4),                        -- calculated probability (0-1)
  discount_pct   NUMERIC(6,4),                          -- discount percentage requested
  counter_factor NUMERIC(6,4),                          -- factor used for counter-offer
  latency_ms     INT,                                    -- response time in milliseconds
  decision_path  JSONB DEFAULT '[]'::jsonb,              -- AI decision steps for debugging
  ai_emotion     TEXT,                                   -- AI emotional state
  user_behavior  JSONB DEFAULT '{}'::jsonb,              -- user interaction patterns
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create hold sessions table (30s soft holds after acceptance)
CREATE TABLE IF NOT EXISTS bargain_holds (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     UUID NOT NULL REFERENCES bargain_sessions(id) ON DELETE CASCADE,
  final_price    NUMERIC(12,2) NOT NULL,                 -- agreed price
  hold_seconds   INT NOT NULL DEFAULT 30,                -- hold duration
  order_ref      TEXT,                                   -- booking reference when converted
  status         TEXT NOT NULL DEFAULT 'holding' CHECK (status IN ('holding','expired','booked','cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ NOT NULL,                   -- when hold expires
  booked_at      TIMESTAMPTZ,                           -- when converted to booking
  metadata       JSONB DEFAULT '{}'::jsonb               -- additional hold data
);

-- Create suppliers table for supplier-specific configuration
CREATE TABLE IF NOT EXISTS suppliers (
  id            SERIAL PRIMARY KEY,
  module_id     INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,                          -- supplier code (e.g., 'AMADEUS', 'HOTELBEDS')
  name          TEXT NOT NULL,                          -- display name
  active        BOOLEAN DEFAULT TRUE,
  api_config    JSONB DEFAULT '{}'::jsonb,              -- API configuration
  metadata      JSONB DEFAULT '{}'::jsonb,              -- additional supplier data
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, code)
);

-- Create markups table for dynamic pricing and guardrails
CREATE TABLE IF NOT EXISTS markups (
  id                 SERIAL PRIMARY KEY,
  module_id          INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  supplier_id        INT REFERENCES suppliers(id) ON DELETE SET NULL,
  markup_pct         NUMERIC(6,4) NOT NULL DEFAULT 0.08,    -- 8% default markup
  min_margin_pct     NUMERIC(6,4) NOT NULL DEFAULT 0.040,   -- 4% minimum margin
  max_concession_pct NUMERIC(6,4) NOT NULL DEFAULT 0.050,   -- 5% maximum concession
  active             BOOLEAN DEFAULT TRUE,
  effective_from     TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create copy packs table for messaging system
CREATE TABLE IF NOT EXISTS copy_packs (
  id             SERIAL PRIMARY KEY,
  module_id      INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  message_type   TEXT NOT NULL,                          -- 'agent_offer', 'supplier_check', etc.
  context        TEXT NOT NULL DEFAULT 'any',            -- 'accepted', 'counter', etc.
  locale         TEXT NOT NULL DEFAULT 'en-IN',
  template       TEXT NOT NULL,                          -- message template with variables
  weight         INT DEFAULT 1,                          -- for random selection
  active         BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, message_type, context, locale, template)
);

-- Create analytics aggregation table for performance
CREATE TABLE IF NOT EXISTS bargain_analytics (
  id                  BIGSERIAL PRIMARY KEY,
  module_id           INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  date_bucket         DATE NOT NULL,                      -- daily aggregation
  total_sessions      INT DEFAULT 0,
  total_attempts      INT DEFAULT 0,
  accepted_offers     INT DEFAULT 0,
  counter_offers      INT DEFAULT 0,
  expired_sessions    INT DEFAULT 0,
  avg_discount_pct    NUMERIC(6,4),
  avg_response_time   INT,                                -- milliseconds
  success_rate_pct    NUMERIC(6,4),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, date_bucket)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_user_module ON bargain_sessions(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_product_ref ON bargain_sessions(product_ref);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_status ON bargain_sessions(status);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_created_at ON bargain_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_bargain_events_session_id ON bargain_events(session_id);
CREATE INDEX IF NOT EXISTS idx_bargain_events_status ON bargain_events(status);
CREATE INDEX IF NOT EXISTS idx_bargain_events_created_at ON bargain_events(created_at);
CREATE INDEX IF NOT EXISTS idx_bargain_events_attempt_no ON bargain_events(attempt_no);

CREATE INDEX IF NOT EXISTS idx_bargain_holds_session_id ON bargain_holds(session_id);
CREATE INDEX IF NOT EXISTS idx_bargain_holds_status ON bargain_holds(status);
CREATE INDEX IF NOT EXISTS idx_bargain_holds_expires_at ON bargain_holds(expires_at);

CREATE INDEX IF NOT EXISTS idx_suppliers_module_active ON suppliers(module_id, active);
CREATE INDEX IF NOT EXISTS idx_markups_module_active ON markups(module_id, active);
CREATE INDEX IF NOT EXISTS idx_copy_packs_lookup ON copy_packs(module_id, message_type, context, locale, active);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_bargain_sessions_updated_at BEFORE UPDATE ON bargain_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_markups_updated_at BEFORE UPDATE ON markups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_copy_packs_updated_at BEFORE UPDATE ON copy_packs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bargain_analytics_updated_at BEFORE UPDATE ON bargain_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired holds (to be called by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS INT AS $$
DECLARE
    expired_count INT;
BEGIN
    UPDATE bargain_holds 
    SET status = 'expired' 
    WHERE status = 'holding' AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO bargain_analytics (
        module_id, date_bucket, total_sessions, total_attempts, 
        accepted_offers, counter_offers, expired_sessions,
        avg_discount_pct, avg_response_time, success_rate_pct
    )
    SELECT 
        bs.module_id,
        target_date,
        COUNT(DISTINCT bs.id) as total_sessions,
        COUNT(be.id) as total_attempts,
        COUNT(CASE WHEN be.status = 'accepted' THEN 1 END) as accepted_offers,
        COUNT(CASE WHEN be.status = 'counter' THEN 1 END) as counter_offers,
        COUNT(CASE WHEN bs.status = 'expired' THEN 1 END) as expired_sessions,
        AVG(be.discount_pct) as avg_discount_pct,
        AVG(be.latency_ms) as avg_response_time,
        CASE 
            WHEN COUNT(be.id) > 0 THEN 
                COUNT(CASE WHEN be.status = 'accepted' THEN 1 END) * 100.0 / COUNT(be.id)
            ELSE 0 
        END as success_rate_pct
    FROM bargain_sessions bs
    LEFT JOIN bargain_events be ON bs.id = be.session_id
    WHERE DATE(bs.created_at) = target_date
    GROUP BY bs.module_id
    ON CONFLICT (module_id, date_bucket) 
    DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        total_attempts = EXCLUDED.total_attempts,
        accepted_offers = EXCLUDED.accepted_offers,
        counter_offers = EXCLUDED.counter_offers,
        expired_sessions = EXCLUDED.expired_sessions,
        avg_discount_pct = EXCLUDED.avg_discount_pct,
        avg_response_time = EXCLUDED.avg_response_time,
        success_rate_pct = EXCLUDED.success_rate_pct,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE modules IS 'Product types: flights, hotels, sightseeing, transfers';
COMMENT ON TABLE bargain_sessions IS 'Individual bargaining sessions with AI state tracking';
COMMENT ON TABLE bargain_events IS 'Event log of all bargaining attempts with decision tracking';
COMMENT ON TABLE bargain_holds IS 'Temporary holds on negotiated prices (30-second windows)';
COMMENT ON TABLE suppliers IS 'Supplier configuration and metadata';
COMMENT ON TABLE markups IS 'Dynamic pricing rules and guardrails for AI negotiations';
COMMENT ON TABLE copy_packs IS 'Message templates for conversational AI responses';
COMMENT ON TABLE bargain_analytics IS 'Daily aggregated analytics for performance monitoring';

COMMENT ON COLUMN bargain_events.decision_path IS 'JSON array of AI decision steps for debugging and optimization';
COMMENT ON COLUMN bargain_events.ai_emotion IS 'AI emotional state: agreeable, negotiating, firm, etc.';
COMMENT ON COLUMN bargain_events.user_behavior IS 'User interaction patterns and preferences';
COMMENT ON COLUMN bargain_holds.hold_seconds IS 'Duration of price hold in seconds (default 30)';
COMMENT ON COLUMN markups.max_concession_pct IS 'Maximum discount AI can offer from base price';

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO bargain_service;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO bargain_service;
