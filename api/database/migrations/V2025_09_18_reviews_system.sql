-- =====================================================
-- REVIEWS SYSTEM MIGRATION
-- Create comprehensive review tables for hotel reviews
-- =====================================================

-- Create database extensions if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id BIGINT NOT NULL, -- Reference to hotel/property ID
    user_id UUID, -- Reference to users table, nullable for guest reviews
    
    -- Rating categories (1-5 scale)
    overall_rating SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    staff_rating SMALLINT CHECK (staff_rating BETWEEN 1 AND 5),
    cleanliness_rating SMALLINT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    value_rating SMALLINT CHECK (value_rating BETWEEN 1 AND 5),
    facilities_rating SMALLINT CHECK (facilities_rating BETWEEN 1 AND 5),
    comfort_rating SMALLINT CHECK (comfort_rating BETWEEN 1 AND 5),
    location_rating SMALLINT CHECK (location_rating BETWEEN 1 AND 5),
    wifi_rating SMALLINT CHECK (wifi_rating BETWEEN 1 AND 5),
    
    -- Review content
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Trip and stay details
    trip_type TEXT NOT NULL CHECK (trip_type IN ('Leisure','Business','Family','Couple','Solo')),
    room_type TEXT,
    country_code CHAR(2) NOT NULL,
    stay_start DATE NOT NULL,
    stay_end DATE NOT NULL,
    
    -- Review metadata
    verified_stay BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    helpful_count INT NOT NULL DEFAULT 0,
    reported_count INT NOT NULL DEFAULT 0,
    
    -- User info (for display, cached from user profile)
    reviewer_name TEXT,
    reviewer_country_name TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- =====================================================
-- REVIEW RESPONSES TABLE (for admin/property responses)
-- =====================================================
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL, -- Reference to admin user
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- REVIEW PHOTOS TABLE (future ready)
-- =====================================================
CREATE TABLE IF NOT EXISTS review_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_caption TEXT,
    display_order INT DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- REVIEW VOTES TABLE (for helpful/report tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- User who voted
    vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'report')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one vote per user per review per type
    UNIQUE(review_id, user_id, vote_type)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_reviews_property_status ON reviews(property_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating DESC);

-- Search index for title and body
CREATE INDEX IF NOT EXISTS idx_reviews_search ON reviews 
USING GIN (to_tsvector('simple', COALESCE(title,'') || ' ' || COALESCE(body,'')));

-- Filtering indexes
CREATE INDEX IF NOT EXISTS idx_reviews_trip_type ON reviews(trip_type);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified_stay);
CREATE INDEX IF NOT EXISTS idx_reviews_stay_dates ON reviews(stay_start, stay_end);

-- Response indexes
CREATE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses(review_id);

-- Vote indexes
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user ON review_votes(user_id);

-- =====================================================
-- MATERIALIZED VIEW FOR PROPERTY REVIEW SUMMARIES
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS vw_property_review_summary AS
SELECT
    property_id,
    COUNT(*) FILTER (WHERE status='approved') AS total_approved,
    COUNT(*) FILTER (WHERE status='approved' AND verified_stay=true) AS total_verified,
    
    -- Overall ratings
    AVG(overall_rating)::NUMERIC(4,2) FILTER (WHERE status='approved') AS avg_overall,
    COUNT(*) FILTER (WHERE status='approved' AND overall_rating >= 4) AS positive_reviews,
    
    -- Category averages
    AVG(staff_rating)::NUMERIC(4,2) FILTER (WHERE status='approved' AND staff_rating IS NOT NULL) AS avg_staff,
    AVG(cleanliness_rating)::NUMERIC(4,2) FILTER (WHERE status='approved' AND cleanliness_rating IS NOT NULL) AS avg_cleanliness,
    AVG(value_rating)::NUMERIC(4,2) FILTER (WHERE status='approved' AND value_rating IS NOT NULL) AS avg_value,
    AVG(facilities_rating)::NUMERIC(4,2) FILTER (WHERE status='approved' AND facilities_rating IS NOT NULL) AS avg_facilities,
    AVG(comfort_rating)::NUMERIC(4,2) FILTER (WHERE status='approved' AND comfort_rating IS NOT NULL) AS avg_comfort,
    AVG(location_rating)::NUMERIC(4,2) FILTER (WHERE status='approved' AND location_rating IS NOT NULL) AS avg_location,
    AVG(wifi_rating)::NUMERIC(4,2) FILTER (WHERE status='approved' AND wifi_rating IS NOT NULL) AS avg_wifi,
    
    -- Trip type breakdown
    COUNT(*) FILTER (WHERE status='approved' AND trip_type='Leisure') AS leisure_count,
    COUNT(*) FILTER (WHERE status='approved' AND trip_type='Business') AS business_count,
    COUNT(*) FILTER (WHERE status='approved' AND trip_type='Family') AS family_count,
    COUNT(*) FILTER (WHERE status='approved' AND trip_type='Couple') AS couple_count,
    COUNT(*) FILTER (WHERE status='approved' AND trip_type='Solo') AS solo_count,
    
    -- Recent activity
    MAX(created_at) FILTER (WHERE status='approved') AS last_review_at,
    COUNT(*) FILTER (WHERE status='approved' AND created_at >= NOW() - INTERVAL '30 days') AS recent_reviews,
    
    -- Engagement
    SUM(helpful_count) FILTER (WHERE status='approved') AS total_helpful_votes,
    AVG(helpful_count)::NUMERIC(4,2) FILTER (WHERE status='approved') AS avg_helpful_per_review
FROM reviews
GROUP BY property_id;

-- Index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_property_review_summary_property 
ON vw_property_review_summary(property_id);

-- =====================================================
-- VIEW FOR REVIEW LISTINGS WITH RESPONSES
-- =====================================================
CREATE VIEW vw_reviews_with_responses AS
SELECT 
    r.*,
    rr.body AS response_body,
    rr.created_at AS response_date,
    rr.admin_id AS response_admin_id,
    (SELECT COUNT(*) FROM review_photos rp WHERE rp.review_id = r.id) AS photo_count
FROM reviews r
LEFT JOIN review_responses rr ON r.id = rr.review_id
ORDER BY r.created_at DESC;

-- =====================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to refresh review summary materialized view
CREATE OR REPLACE FUNCTION refresh_review_summary(property_id_param BIGINT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    IF property_id_param IS NULL THEN
        REFRESH MATERIALIZED VIEW vw_property_review_summary;
    ELSE
        -- For specific property, we'll need to handle this differently
        -- since PostgreSQL doesn't support partial refresh of materialized views
        REFRESH MATERIALIZED VIEW vw_property_review_summary;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.vote_type = 'helpful' THEN
        UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' AND OLD.vote_type = 'helpful' THEN
        UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
    
    IF TG_OP = 'INSERT' AND NEW.vote_type = 'report' THEN
        UPDATE reviews SET reported_count = reported_count + 1 WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' AND OLD.vote_type = 'report' THEN
        UPDATE reviews SET reported_count = reported_count - 1 WHERE id = OLD.review_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update helpful/report counts
CREATE TRIGGER trigger_update_review_helpful_count
    AFTER INSERT OR DELETE ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

-- Function to automatically refresh summary when reviews change
CREATE OR REPLACE FUNCTION trigger_refresh_review_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh the materialized view when reviews are added/updated/deleted
    PERFORM refresh_review_summary();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh summary on review changes
CREATE TRIGGER trigger_reviews_refresh_summary
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_review_summary();

-- =====================================================
-- INITIAL DATA / CONSTRAINTS
-- =====================================================

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to reviews table
CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE reviews IS 'Hotel reviews with comprehensive rating categories and moderation';
COMMENT ON TABLE review_responses IS 'Official responses from property management or admins';
COMMENT ON TABLE review_photos IS 'Photos uploaded with reviews (future feature)';
COMMENT ON TABLE review_votes IS 'Tracks helpful and report votes on reviews';
COMMENT ON MATERIALIZED VIEW vw_property_review_summary IS 'Aggregated review statistics per property for fast display';

COMMENT ON COLUMN reviews.verified_stay IS 'True if user has completed booking for this property';
COMMENT ON COLUMN reviews.status IS 'Moderation status: pending, approved, rejected';
COMMENT ON COLUMN reviews.helpful_count IS 'Number of users who found this review helpful';
COMMENT ON COLUMN reviews.reported_count IS 'Number of users who reported this review';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================

-- Insert migration record (if you have a migrations tracking table)
-- INSERT INTO schema_migrations (version, applied_at) VALUES ('V2025_09_18_reviews_system', NOW())
-- ON CONFLICT (version) DO NOTHING;

-- Refresh the materialized view initially
SELECT refresh_review_summary();
