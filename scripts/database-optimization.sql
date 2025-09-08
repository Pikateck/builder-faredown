-- Database Performance Optimization Script
-- Run this to improve query performance across all modules

-- =================
-- Index Optimization
-- =================

-- Hotels module indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hotels_destination ON hotels(destination_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hotels_price ON hotels(price_per_night);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hotels_rating ON hotels(rating);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hotels_availability ON hotels(check_in_date, check_out_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hotels_search ON hotels(destination_code, check_in_date, check_out_date, guests);

-- Flights module indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_route ON flights(origin_code, destination_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_date ON flights(departure_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_price ON flights(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_airline ON flights(airline_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_search ON flights(origin_code, destination_code, departure_date, return_date);

-- Sightseeing module indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sightseeing_location ON sightseeing_attractions(city_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sightseeing_category ON sightseeing_attractions(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sightseeing_price ON sightseeing_attractions(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sightseeing_rating ON sightseeing_attractions(rating);

-- Transfers module indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_route ON transfers(pickup_location, dropoff_location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_date ON transfers(pickup_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_price ON transfers(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_vehicle ON transfers(vehicle_type);

-- Bookings and transactions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_date ON bookings(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_type ON bookings(booking_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);

-- Bargain system indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bargains_session ON ai_bargain_sessions(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bargains_user ON ai_bargain_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bargains_module ON ai_bargain_sessions(module_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bargains_status ON ai_bargain_sessions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bargains_created ON ai_bargain_sessions(created_at);

-- User activity indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created ON users(created_at);

-- =================
-- Query Optimization
-- =================

-- Update table statistics for better query planning
ANALYZE hotels;
ANALYZE flights;
ANALYZE sightseeing_attractions;
ANALYZE transfers;
ANALYZE bookings;
ANALYZE ai_bargain_sessions;
ANALYZE users;

-- =================
-- Materialized Views for Common Queries
-- =================

-- Popular destinations materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_destinations AS
SELECT 
    destination_code,
    destination_name,
    COUNT(*) as search_count,
    AVG(price_per_night) as avg_price
FROM hotels 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY destination_code, destination_name
ORDER BY search_count DESC
LIMIT 50;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_popular_destinations_code ON popular_destinations(destination_code);

-- Refresh materialized view (run periodically)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY popular_destinations;

-- =================
-- Partitioning for Large Tables
-- =================

-- Partition booking logs by date (if applicable)
-- CREATE TABLE booking_logs_2024_q1 PARTITION OF booking_logs 
-- FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- =================
-- Performance Settings (PostgreSQL)
-- =================

-- Optimize for read-heavy workload
-- SET shared_buffers = '256MB';
-- SET effective_cache_size = '1GB';
-- SET work_mem = '4MB';
-- SET maintenance_work_mem = '64MB';
-- SET random_page_cost = 1.1;
-- SET seq_page_cost = 1.0;

-- =================
-- Cleanup and Maintenance
-- =================

-- Archive old log entries (older than 90 days)
-- DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Clean up expired bargain sessions
-- DELETE FROM ai_bargain_sessions WHERE status = 'expired' AND created_at < NOW() - INTERVAL '7 days';

-- Vacuum and reindex periodically
-- VACUUM ANALYZE;
-- REINDEX DATABASE faredown_booking_db;

-- =================
-- Monitoring Queries
-- =================

-- Find slow queries
-- SELECT query, mean_exec_time, calls, total_exec_time
-- FROM pg_stat_statements 
-- WHERE mean_exec_time > 1000
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- Check index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
-- ORDER BY schemaname, tablename;

-- Check table sizes
-- SELECT schemaname, tablename, 
--        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
--        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY size_bytes DESC;

COMMIT;
