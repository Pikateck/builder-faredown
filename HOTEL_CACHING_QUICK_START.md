# Hotel Caching Infrastructure - Quick Start Guide

Get the hotel caching system up and running in 5 minutes.

## Prerequisites

✅ Postgres database connection (via `DATABASE_URL`)
✅ Redis service running (via `REDIS_URL`)
✅ Node.js 18+

## Setup

### 1. Verify Environment Variables

Check your `.env` file:

```bash
# Database (must be set)
DATABASE_URL=postgresql://...

# Redis (must be set)
REDIS_URL=redis://:PASSWORD@HOST:PORT

# Admin key for accessing admin endpoints
ADMIN_API_KEY=your-secure-key
```

### 2. Apply Database Migration

```bash
# From project root
node api/database/run-hotel-caching-migration.js
```

**Expected output:**
```
✅ Database connection OK
📝 Executing SQL migration...
✅ Migration completed successfully
✅ Created tables: hotel_supplier_api_logs, hotels_master_inventory
✅ Created indexes: [list of indexes]
🎉 Hotel Caching Infrastructure ready for use!
```

### 3. Start the Server

```bash
npm start
# or if using dev mode
npm run dev
```

The server will automatically initialize the caching services.

## Usage Examples

### Example 1: Check Cache Status

```bash
# Check current caching metrics
curl http://localhost:3000/api/admin/hotels/cache/status \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ongoingRequests": 0,
    "redisConnected": true,
    "timestamp": "2025-02-20T10:30:00.000Z"
  }
}
```

### Example 2: View API Logs

```bash
# Get recent API logs
curl "http://localhost:3000/api/admin/hotels/logs?supplier=TBO&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq

# Filter by errors only
curl "http://localhost:3000/api/admin/hotels/logs?supplier=TBO&errorOnly=true" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq
```

### Example 3: View Performance Metrics

```bash
# Get supplier performance metrics (last 7 days)
curl http://localhost:3000/api/admin/hotels/metrics/TBO \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq
```

**Response:**
```json
{
  "success": true,
  "data": {
    "supplier_code": "TBO",
    "total_requests": 1234,
    "successful_requests": 1200,
    "failed_requests": 34,
    "cache_hits": 890,
    "cache_hit_rate": "72.15",
    "avg_response_time_ms": "245.5",
    "max_response_time_ms": "1200",
    "min_response_time_ms": "45"
  }
}
```

### Example 4: Sync Hotels Master Inventory

```bash
# Trigger full sync (first 2 countries, max 5 cities per country)
curl -X POST http://localhost:3000/api/admin/hotels/sync/full \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "countryLimit": 2,
    "cityLimit": 5
  }' | jq
```

**Response:**
```json
{
  "success": true,
  "message": "Sync job started",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "status": "started",
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-02-20T10:30:00.000Z"
  }
}
```

Sync runs in the background. Check logs for progress:
```bash
tail -f logs/api.log | grep "Sync"
```

### Example 5: Check Sync Status

```bash
# Get inventory sync status
curl http://localhost:3000/api/admin/hotels/sync/status \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_hotels": 5432,
    "synced_hotels": 5400,
    "failed_hotels": 32,
    "last_sync_time": "2025-02-20T10:25:00.000Z",
    "cities": 120
  }
}
```

### Example 6: View Hotel Inventory

```bash
# Browse hotels in Dubai
curl "http://localhost:3000/api/admin/hotels/inventory?cityId=2&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq

# Get all cities with hotel counts
curl "http://localhost:3000/api/admin/hotels/inventory/cities" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq

# Get all countries
curl "http://localhost:3000/api/admin/hotels/inventory/countries" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq
```

## Testing the Complete Flow

### Test 1: Verify Caching is Working

```bash
# Make the same hotel search twice
SEARCH_PARAMS='{"cityId": 2, "checkIn": "2025-03-01", "checkOut": "2025-03-02", "nationality": "IN"}'

# First request (will hit TBO API)
curl -X POST http://localhost:3000/api/hotels/search \
  -H "Content-Type: application/json" \
  -d "$SEARCH_PARAMS" -w "\nTime: %{time_total}s\n"

# Second request (should be cached, much faster)
curl -X POST http://localhost:3000/api/hotels/search \
  -H "Content-Type: application/json" \
  -d "$SEARCH_PARAMS" -w "\nTime: %{time_total}s\n"

# Check logs to verify cache hit
curl "http://localhost:3000/api/admin/hotels/logs?limit=2" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq '.data.logs[] | {cache_hit, response_time_ms}'
```

**Expected results:**
- First request: ~500-1000ms, `cache_hit: false`
- Second request: ~50-100ms, `cache_hit: true`

### Test 2: Verify Request Coalescing

```bash
# Simulate 5 identical simultaneous requests
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/hotels/search \
    -H "Content-Type: application/json" \
    -d '{"cityId": 2, "checkIn": "2025-03-01", "checkOut": "2025-03-02"}' &
done
wait

# Only 1 API call should go to TBO
curl "http://localhost:3000/api/admin/hotels/logs?limit=5" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq '.data.logs | length'

# Should show 1-2 logs (1 actual call + potentially 1 cache write), not 5
```

### Test 3: Verify API Logging

```bash
# Perform a hotel search
curl -X POST http://localhost:3000/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{"cityId": 2, "checkIn": "2025-03-01", "checkOut": "2025-03-02"}'

# Get the log
curl "http://localhost:3000/api/admin/hotels/logs?limit=1" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq '.data.logs[0] | keys'

# Should include: request_payload, response_payload, response_time_ms, cache_hit, trace_id, search_hash
```

## Common Issues & Solutions

### Issue: Migration fails with "relation already exists"

**Solution**: Tables already exist (this is fine). Skip to usage examples.

### Issue: "Redis connection failed"

**Solution**: Check Redis is running and REDIS_URL is correct
```bash
redis-cli ping
# Should return: PONG
```

### Issue: "Admin API key invalid"

**Solution**: Ensure you're passing the correct ADMIN_API_KEY
```bash
export ADMIN_API_KEY="your-key"
curl http://localhost:3000/api/admin/hotels/cache/status \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

### Issue: No data in hotel_supplier_api_logs

**Solution**: Run a hotel search first, then check logs
```bash
curl -X POST http://localhost:3000/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{}'

# Then check
curl "http://localhost:3000/api/admin/hotels/logs" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY"
```

## Next Steps

1. **Enable Caching in TBO Adapter**
   - Edit `api/services/adapters/supplierAdapterManager.js`
   - Apply caching wrapper to TBO adapter (see [documentation](./HOTEL_CACHING_INFRASTRUCTURE.md#example-1-wrapping-tbo-adapter))

2. **Monitor Performance**
   - Set up dashboard for cache hit rates
   - Track API response times
   - Monitor supplier cost savings

3. **Extend to Other Suppliers**
   - Apply same caching to Hotelbeds
   - Apply to RateHawk
   - Apply to WebBeds

4. **Production Optimization**
   - Adjust TTL values based on demand patterns
   - Set up automated cache warming
   - Configure alerting for cache misses

## Useful Commands

```bash
# View migration logs
tail -f api/database/migrations.log

# Check database tables
psql $DATABASE_URL -c "\dt+ hotel_supplier_api_logs"

# Count logs
curl "http://localhost:3000/api/admin/hotels/logs/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq

# Clear coalescing requests (if stuck)
curl http://localhost:3000/api/admin/hotels/cache/clear-coalescing \
  -H "Authorization: Bearer YOUR_ADMIN_KEY"

# Export logs for analysis
curl "http://localhost:3000/api/admin/hotels/logs?limit=1000" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" > hotel_logs.json
```

## API Endpoints Reference

### Monitoring
- `GET /api/admin/hotels/cache/status` - Current cache state
- `GET /api/admin/hotels/metrics/:supplier` - Performance metrics
- `GET /api/admin/hotels/logs` - API call logs (paginated)
- `GET /api/admin/hotels/logs/stats` - Aggregated statistics
- `GET /api/admin/hotels/logs/errors` - Error logs only
- `GET /api/admin/hotels/logs/trace/:traceId` - Logs for specific trace

### Inventory
- `GET /api/admin/hotels/inventory` - Browse hotels
- `GET /api/admin/hotels/inventory/cities` - Cities with counts
- `GET /api/admin/hotels/inventory/countries` - Countries with counts
- `GET /api/admin/hotels/inventory/:hotelCode` - Specific hotel

### Sync Operations
- `POST /api/admin/hotels/sync/full` - Full sync (async)
- `POST /api/admin/hotels/sync/cities` - Sync specific cities (async)
- `GET /api/admin/hotels/sync/status` - Sync status

### Utilities
- `GET /api/admin/hotels/cache/clear-coalescing` - Clear pending requests

## Getting Help

1. Check logs: `tail -f logs/*.log | grep HOTEL_CACHE`
2. Read full documentation: [HOTEL_CACHING_INFRASTRUCTURE.md](./HOTEL_CACHING_INFRASTRUCTURE.md)
3. Check database: `SELECT COUNT(*) FROM hotel_supplier_api_logs;`
4. Review code: `api/services/hotelApiCachingService.js`

---

**Status**: ✅ Ready to use
**Last Updated**: February 2025
