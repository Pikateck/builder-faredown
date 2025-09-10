-- Bargain Price Holds Table
-- Stores temporary price holds for negotiated bargain prices

CREATE TABLE IF NOT EXISTS bargain_price_holds (
    id SERIAL PRIMARY KEY,
    hold_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    module VARCHAR(50) NOT NULL,
    product_ref VARCHAR(255) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    negotiated_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    order_ref VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    user_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    consumed_at TIMESTAMP NULL,
    released_at TIMESTAMP NULL,
    booking_ref VARCHAR(255) NULL,
    release_reason VARCHAR(100) NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bargain_holds_hold_id ON bargain_price_holds(hold_id);
CREATE INDEX IF NOT EXISTS idx_bargain_holds_session_id ON bargain_price_holds(session_id);
CREATE INDEX IF NOT EXISTS idx_bargain_holds_status_expires ON bargain_price_holds(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_bargain_holds_order_ref ON bargain_price_holds(order_ref);

-- Add comments
COMMENT ON TABLE bargain_price_holds IS 'Temporary price holds for negotiated bargain prices';
COMMENT ON COLUMN bargain_price_holds.hold_id IS 'Unique identifier for the price hold';
COMMENT ON COLUMN bargain_price_holds.session_id IS 'Bargain session ID that created this hold';
COMMENT ON COLUMN bargain_price_holds.module IS 'Service module (flights, hotels, sightseeing, transfers)';
COMMENT ON COLUMN bargain_price_holds.product_ref IS 'Reference to the product being bargained';
COMMENT ON COLUMN bargain_price_holds.original_price IS 'Original price before bargaining';
COMMENT ON COLUMN bargain_price_holds.negotiated_price IS 'Final negotiated price';
COMMENT ON COLUMN bargain_price_holds.expires_at IS 'When this price hold expires';
COMMENT ON COLUMN bargain_price_holds.status IS 'Hold status: active, consumed, expired, released';
COMMENT ON COLUMN bargain_price_holds.user_data IS 'Additional user data (userName, round, etc.)';
COMMENT ON COLUMN bargain_price_holds.booking_ref IS 'Final booking reference when consumed';
