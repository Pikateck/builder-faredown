-- =====================================================
-- Rewards System Schema
-- Industry standard: 1 point per ₹100, tier multipliers (Silver 1x, Gold 1.25x, Platinum 1.5x)
-- =====================================================

-- Create user_rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID,
  module VARCHAR(50) NOT NULL, -- hotels, flights, transfers, sightseeing, packages
  points_earned INT DEFAULT 0,
  points_redeemed INT DEFAULT 0,
  monetary_value DECIMAL(10,2) DEFAULT 0,
  tier_category VARCHAR(50) DEFAULT 'Silver', -- Silver, Gold, Platinum
  status VARCHAR(50) DEFAULT 'earned', -- earned, redeemed, pending, expired
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '3 years',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by VARCHAR(100) DEFAULT 'system',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_booking_id ON user_rewards(booking_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_user_rewards_expires_at ON user_rewards(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_rewards_tier ON user_rewards(tier_category);

-- Update hotel_bookings table to track bargain and rewards
ALTER TABLE IF EXISTS hotel_bookings
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS bargained_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_redeemed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bargain_round_id UUID,
  ADD COLUMN IF NOT EXISTS bargain_accepted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_hotel_bookings_original_price ON hotel_bookings(original_price);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_bargained_price ON hotel_bookings(bargained_price);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_points_earned ON hotel_bookings(points_earned);

-- Update flight_bookings table to track bargain and rewards
ALTER TABLE IF EXISTS flight_bookings
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS bargained_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_redeemed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bargain_round_id UUID,
  ADD COLUMN IF NOT EXISTS bargain_accepted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_flight_bookings_original_price ON flight_bookings(original_price);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_bargained_price ON flight_bookings(bargained_price);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_points_earned ON flight_bookings(points_earned);

-- Update transfers_bookings table to track bargain and rewards
ALTER TABLE IF EXISTS transfers_bookings
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS bargained_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_redeemed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bargain_round_id UUID,
  ADD COLUMN IF NOT EXISTS bargain_accepted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_transfers_bookings_original_price ON transfers_bookings(original_price);
CREATE INDEX IF NOT EXISTS idx_transfers_bookings_bargained_price ON transfers_bookings(bargained_price);
CREATE INDEX IF NOT EXISTS idx_transfers_bookings_points_earned ON transfers_bookings(points_earned);

-- Create user_tier_history table to track tier progression
CREATE TABLE IF NOT EXISTS user_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_tier VARCHAR(50),
  new_tier VARCHAR(50),
  total_points_at_change INT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_tier_history_user_id ON user_tier_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tier_history_changed_at ON user_tier_history(changed_at);

-- Function to calculate user tier based on total points
CREATE OR REPLACE FUNCTION get_user_tier(points INT)
RETURNS VARCHAR(50) AS $$
BEGIN
  IF points >= 15001 THEN
    RETURN 'Platinum';
  ELSIF points >= 5001 THEN
    RETURN 'Gold';
  ELSE
    RETURN 'Silver';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate rewards for a booking
CREATE OR REPLACE FUNCTION calculate_booking_rewards(
  final_price DECIMAL,
  tier_category VARCHAR,
  module VARCHAR
)
RETURNS TABLE (
  points_earned INT,
  monetary_value DECIMAL,
  tier_multiplier DECIMAL
) AS $$
BEGIN
  DECLARE
    base_points INT;
    multiplier DECIMAL;
  BEGIN
    -- 1 point per ₹100
    base_points := FLOOR(final_price / 100)::INT;
    
    -- Tier multipliers
    multiplier := CASE tier_category
      WHEN 'Platinum' THEN 1.5
      WHEN 'Gold' THEN 1.25
      ELSE 1.0
    END;
    
    RETURN QUERY SELECT
      FLOOR(base_points * multiplier)::INT,
      FLOOR(base_points * multiplier)::DECIMAL,
      multiplier;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comments
COMMENT ON TABLE user_rewards IS 'Track user reward points earned and redeemed across all modules';
COMMENT ON COLUMN user_rewards.tier_category IS 'User tier at time of earning: Silver, Gold, Platinum';
COMMENT ON COLUMN user_rewards.status IS 'State: earned (pending display), redeemed, pending (validation), expired (after 3 years)';
COMMENT ON COLUMN user_rewards.metadata IS 'Additional data: source_booking_ref, discount_percentage, bargain_round, etc.';
COMMENT ON TABLE user_tier_history IS 'Audit trail of tier progression for analytics and user communication';
COMMENT ON FUNCTION calculate_booking_rewards IS 'Industry standard: 1 point per ₹100, Platinum 1.5x multiplier';
