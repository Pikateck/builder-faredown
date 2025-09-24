-- Package Bargain System Schema
-- Extends existing bargain system for packages or creates new tables if needed

-- Create bargain_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS bargain_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Package specific fields
    package_id INTEGER REFERENCES packages(id),
    departure_id INTEGER REFERENCES package_departures(id),
    
    -- Passenger details
    adults_count INTEGER DEFAULT 1,
    children_count INTEGER DEFAULT 0, 
    infants_count INTEGER DEFAULT 0,
    
    -- Pricing
    base_total DECIMAL(12,2) NOT NULL,
    floor_price DECIMAL(12,2) NOT NULL,
    last_user_offer DECIMAL(12,2),
    last_system_offer DECIMAL(12,2),
    final_price DECIMAL(12,2),
    
    -- Session management
    current_round INTEGER DEFAULT 0,
    max_rounds INTEGER DEFAULT 3,
    session_status VARCHAR(50) DEFAULT 'active', -- active, accepted, completed, expired
    
    -- User tracking
    user_ip VARCHAR(45),
    user_agent TEXT,
    
    -- Timing
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bargain_rounds table if it doesn't exist
CREATE TABLE IF NOT EXISTS bargain_rounds (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES bargain_sessions(session_id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    user_offer DECIMAL(12,2) NOT NULL,
    system_offer DECIMAL(12,2) NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE,
    round_status VARCHAR(50) DEFAULT 'completed', -- completed, accepted, rejected
    round_duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_package_id ON bargain_sessions(package_id);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_departure_id ON bargain_sessions(departure_id);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_status ON bargain_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_expires_at ON bargain_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_bargain_sessions_created_at ON bargain_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_bargain_rounds_session_id ON bargain_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_bargain_rounds_round_number ON bargain_rounds(session_id, round_number);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_bargain_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bargain_sessions_updated_at ON bargain_sessions;
CREATE TRIGGER trigger_bargain_sessions_updated_at 
    BEFORE UPDATE ON bargain_sessions
    FOR EACH ROW EXECUTE FUNCTION update_bargain_sessions_updated_at();

-- Add package booking reference to bargain sessions if not exists
ALTER TABLE bargain_sessions 
ADD COLUMN IF NOT EXISTS booking_id INTEGER REFERENCES package_bookings(id);

-- Create view for bargain analytics
CREATE OR REPLACE VIEW v_package_bargain_analytics AS
SELECT 
    DATE_TRUNC('day', bs.created_at) as bargain_date,
    p.title as package_title,
    p.category as package_category,
    pd.departure_city_name,
    pd.departure_date,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE bs.session_status = 'accepted') as accepted_sessions,
    COUNT(*) FILTER (WHERE bs.session_status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE bs.session_status = 'expired') as expired_sessions,
    ROUND(AVG(bs.base_total), 0) as avg_base_total,
    ROUND(AVG(bs.final_price), 0) as avg_final_price,
    ROUND(AVG(bs.current_round), 1) as avg_rounds,
    ROUND(AVG(bs.base_total - COALESCE(bs.final_price, bs.base_total)), 0) as avg_discount,
    ROUND(
        (COUNT(*) FILTER (WHERE bs.session_status = 'accepted')::DECIMAL / 
         COUNT(*)::DECIMAL) * 100, 
        1
    ) as acceptance_rate
FROM bargain_sessions bs
JOIN packages p ON p.id = bs.package_id
JOIN package_departures pd ON pd.id = bs.departure_id
GROUP BY 
    DATE_TRUNC('day', bs.created_at),
    p.title,
    p.category,
    pd.departure_city_name,
    pd.departure_date
ORDER BY bargain_date DESC;

-- Comments for documentation
COMMENT ON TABLE bargain_sessions IS 'Bargain sessions for package bookings with pricing negotiation';
COMMENT ON TABLE bargain_rounds IS 'Individual rounds within bargain sessions tracking offers and counters';
COMMENT ON VIEW v_package_bargain_analytics IS 'Analytics view for package bargain performance and metrics';

-- Insert sample bargain configuration
INSERT INTO bargain_sessions (
    session_id, package_id, departure_id, adults_count, children_count,
    base_total, floor_price, session_status, max_rounds, expires_at,
    user_ip, user_agent
) VALUES (
    'SAMPLE_SESSION_001',
    (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days' LIMIT 1),
    (SELECT id FROM package_departures WHERE package_id = (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days' LIMIT 1) LIMIT 1),
    2, 0, 630000, 594200, 'expired', 3,
    NOW() - INTERVAL '1 hour',
    '127.0.0.1', 'Sample User Agent'
) ON CONFLICT (session_id) DO NOTHING;

-- End of bargain schema
