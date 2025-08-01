-- Faredown Loyalty Program Database Schema
-- Complete migration for all loyalty-related tables

-- 1. Loyalty Members Table
CREATE TABLE loyalty_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    member_code VARCHAR(20) NOT NULL UNIQUE,
    tier INTEGER NOT NULL DEFAULT 1,
    points_balance INTEGER NOT NULL DEFAULT 0,
    points_locked INTEGER NOT NULL DEFAULT 0,
    points_lifetime INTEGER NOT NULL DEFAULT 0,
    points_12m INTEGER NOT NULL DEFAULT 0,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_calc_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    opted_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Loyalty Ledger (transaction log)
CREATE TABLE loyalty_ledger (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    booking_id VARCHAR(50),
    event_type VARCHAR(20) NOT NULL, -- earn, redeem, adjust, expire, revoke
    points_delta INTEGER NOT NULL,
    rupee_value DECIMAL(10,2),
    fx_rate DECIMAL(8,4) DEFAULT 1.0000,
    description TEXT,
    meta JSONB,
    batch_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES loyalty_members(user_id) ON DELETE CASCADE
);

-- 3. Loyalty Rules (configurable earning/redemption rates)
CREATE TABLE loyalty_rules (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(20) NOT NULL, -- AIR, HOTEL
    earn_per_100 INTEGER NOT NULL, -- points per ₹100
    redeem_value_per_100 INTEGER NOT NULL, -- ₹ value per 100 points
    min_redeem INTEGER NOT NULL, -- minimum points to redeem
    max_cap_pct DECIMAL(4,3) NOT NULL, -- max % of base fare
    active_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tier Rules and Benefits
CREATE TABLE tier_rules (
    id SERIAL PRIMARY KEY,
    tier INTEGER NOT NULL UNIQUE,
    threshold_points_12m INTEGER NOT NULL,
    earn_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    benefits JSONB,
    tier_name VARCHAR(50),
    active_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Referrals
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    referrer_user_id INTEGER NOT NULL,
    referee_user_id INTEGER,
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    referee_email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, invalid
    bonus_points INTEGER DEFAULT 500,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_user_id) REFERENCES loyalty_members(user_id) ON DELETE CASCADE
);

-- 6. Point Expiry Tracking
CREATE TABLE point_expiry (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    earn_batch_id VARCHAR(50) NOT NULL,
    expire_on DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, expired, consumed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES loyalty_members(user_id) ON DELETE CASCADE
);

-- 7. Loyalty Transactions (for cart/checkout integration)
CREATE TABLE loyalty_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    cart_id VARCHAR(50),
    booking_id VARCHAR(50),
    points_applied INTEGER NOT NULL,
    rupee_value DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES loyalty_members(user_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_loyalty_members_user_id ON loyalty_members(user_id);
CREATE INDEX idx_loyalty_members_member_code ON loyalty_members(member_code);
CREATE INDEX idx_loyalty_ledger_user_id ON loyalty_ledger(user_id);
CREATE INDEX idx_loyalty_ledger_booking_id ON loyalty_ledger(booking_id);
CREATE INDEX idx_loyalty_ledger_event_type ON loyalty_ledger(event_type);
CREATE INDEX idx_loyalty_ledger_created_at ON loyalty_ledger(created_at);
CREATE INDEX idx_point_expiry_user_id ON point_expiry(user_id);
CREATE INDEX idx_point_expiry_expire_on ON point_expiry(expire_on);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_cart_id ON loyalty_transactions(cart_id);

-- Insert default loyalty rules
INSERT INTO loyalty_rules (channel, earn_per_100, redeem_value_per_100, min_redeem, max_cap_pct) VALUES
('HOTEL', 5, 10, 200, 0.200),
('AIR', 3, 10, 200, 0.200);

-- Insert default tier rules
INSERT INTO tier_rules (tier, threshold_points_12m, earn_multiplier, benefits, tier_name) VALUES
(1, 0, 1.00, '{"description": "Member hotel prices, account wallet, earn/redeem"}', 'Bronze'),
(2, 1000, 1.10, '{"description": "10% earn boost, priority support, flexible cancellation"}', 'Silver'),
(3, 7000, 1.20, '{"description": "20% earn boost, room upgrades, dedicated support"}', 'Gold');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_loyalty_members_updated_at BEFORE UPDATE ON loyalty_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_rules_updated_at BEFORE UPDATE ON loyalty_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tier_rules_updated_at BEFORE UPDATE ON tier_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_transactions_updated_at BEFORE UPDATE ON loyalty_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique member codes
CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate format: FD + 8 random alphanumeric characters
        new_code := 'FD' || upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM loyalty_members WHERE member_code = new_code) INTO code_exists;
        
        -- Exit loop if code is unique
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;
