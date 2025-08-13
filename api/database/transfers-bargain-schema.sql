-- Transfers Bargain Database Schema
-- Tables for AI-powered transfer price negotiation

-- Create AI schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS ai;

-- Transfers Bargain Sessions Table
CREATE TABLE IF NOT EXISTS ai.transfers_bargain_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    transfer_id VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    vehicle_class VARCHAR(50),
    vehicle_name VARCHAR(200),
    pickup_location TEXT,
    dropoff_location TEXT,
    pickup_date DATE,
    displayed_price DECIMAL(10,2) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    min_selling_price DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2),
    user_tier VARCHAR(20) DEFAULT 'standard',
    status VARCHAR(20) DEFAULT 'active',
    booking_reference VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfers Bargain Rounds Table
CREATE TABLE IF NOT EXISTS ai.transfers_bargain_rounds (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    round_number INTEGER NOT NULL,
    user_offer DECIMAL(10,2) NOT NULL,
    user_message TEXT,
    ai_decision VARCHAR(20) NOT NULL, -- 'accept', 'reject', 'counter'
    ai_counter_price DECIMAL(10,2),
    ai_message TEXT,
    savings_amount DECIMAL(10,2) DEFAULT 0,
    acceptance_probability DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES ai.transfers_bargain_sessions(session_id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfers_bargain_sessions_session_id ON ai.transfers_bargain_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_transfers_bargain_sessions_status ON ai.transfers_bargain_sessions(status);
CREATE INDEX IF NOT EXISTS idx_transfers_bargain_sessions_created_at ON ai.transfers_bargain_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_bargain_rounds_session_id ON ai.transfers_bargain_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_transfers_bargain_rounds_round_number ON ai.transfers_bargain_rounds(session_id, round_number);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to sessions table
DROP TRIGGER IF EXISTS update_transfers_bargain_sessions_updated_at ON ai.transfers_bargain_sessions;
CREATE TRIGGER update_transfers_bargain_sessions_updated_at
    BEFORE UPDATE ON ai.transfers_bargain_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for bargain analytics
CREATE OR REPLACE VIEW ai.transfers_bargain_analytics AS
SELECT 
    DATE(s.created_at) as bargain_date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN s.status = 'accepted' THEN 1 END) as accepted_sessions,
    COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected_sessions,
    AVG(s.displayed_price) as avg_displayed_price,
    AVG(s.final_price) as avg_final_price,
    AVG(s.displayed_price - s.final_price) as avg_savings,
    AVG(CASE WHEN s.status = 'accepted' THEN 
        (s.displayed_price - s.final_price) / s.displayed_price * 100 
    END) as avg_discount_percent,
    s.vehicle_type,
    s.vehicle_class
FROM ai.transfers_bargain_sessions s
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(s.created_at), s.vehicle_type, s.vehicle_class
ORDER BY bargain_date DESC;

-- Sample data for testing (optional)
INSERT INTO ai.transfers_bargain_sessions 
(session_id, transfer_id, vehicle_type, vehicle_class, vehicle_name, 
 pickup_location, dropoff_location, pickup_date, displayed_price, 
 base_price, cost_price, min_selling_price, status)
VALUES 
('sample_session_1', 'hotelbeds_1', 'sedan', 'economy', 'Sedan - Economy',
 'Mumbai Airport (BOM)', 'Hotel Taj Mahal Palace', CURRENT_DATE + 1,
 1380.00, 1200.00, 840.00, 936.00, 'active'),
('sample_session_2', 'hotelbeds_2', 'suv', 'premium', 'SUV - Premium',
 'Mumbai Airport (BOM)', 'Hotel Taj Mahal Palace', CURRENT_DATE + 1,
 2530.00, 2200.00, 1540.00, 1716.00, 'active'),
('sample_session_3', 'hotelbeds_3', 'luxury', 'luxury', 'Mercedes E-Class',
 'Mumbai Airport (BOM)', 'Hotel Taj Mahal Palace', CURRENT_DATE + 1,
 4370.00, 3800.00, 2660.00, 2964.00, 'active')
ON CONFLICT (session_id) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ai TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ai TO your_app_user;
