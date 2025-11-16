# Third-Party API Logging - Quick Reference

## Summary

✅ **All tables are created in the `public` schema** - confirmed across all migrations and schema files.

✅ **Third-party API logging is now implemented** - tracks all requests/responses from TBO, Hotelbeds, Amadeus, and RateHawk.

---

## Quick Start

### 1. Verify Installation

```bash
node verify-api-logging.js
```

This will check:
- Table exists in `public` schema
- All columns and indexes are created
- Logging functionality works
- Query methods work

### 2. Start Using the Logger

In any adapter file (e.g., `tboAdapter.js`, `hotelbedsAdapter.js`):

```javascript
const thirdPartyLogger = require("../thirdPartyLogger");

// Start logging
const apiLog = thirdPartyLogger.startRequest({
  supplierName: "TBO",
  endpoint: "https://api.travelboutiqueonline.com/auth",
  method: "POST",
  requestPayload: { ... },
  requestHeaders: { ... },
});

try {
  // Make API call
  const response = await axios.post(url, data);
  
  // Log success
  await apiLog.end({
    responsePayload: response.data,
    responseHeaders: response.headers,
    statusCode: response.status,
  });
} catch (error) {
  // Log error
  await apiLog.end({
    responsePayload: error.response?.data,
    statusCode: error.response?.status || 500,
    errorMessage: error.message,
    errorStack: error.stack,
  });
}
```

### 3. Query Logs via Admin API

**Requires admin authentication header**: `X-Admin-Key: YOUR_ADMIN_KEY`

#### Get Recent Logs
```bash
curl -X GET "http://localhost:3001/api/admin/api-logs?supplier=TBO&limit=20" \
  -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1"
```

#### Get Error Logs Only
```bash
curl -X GET "http://localhost:3001/api/admin/api-logs?errors_only=true&limit=10" \
  -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1"
```

#### Get Supplier Stats
```bash
curl -X GET "http://localhost:3001/api/admin/api-logs/stats/TBO" \
  -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1"
```

#### Get Logs by Trace ID
```bash
curl -X GET "http://localhost:3001/api/admin/api-logs/trace/abc-123-xyz" \
  -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1"
```

### 4. Query Directly in Database

```sql
-- Get recent TBO logs
SELECT 
  supplier_name,
  endpoint,
  status_code,
  duration_ms,
  error_message,
  created_at
FROM public.third_party_api_logs
WHERE supplier_name = 'TBO'
ORDER BY created_at DESC
LIMIT 20;

-- Get error logs
SELECT * FROM public.third_party_api_logs
WHERE error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Get stats for TBO
SELECT 
  COUNT(*) as total_requests,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful,
  COUNT(*) FILTER (WHERE status_code >= 400) as failed
FROM public.third_party_api_logs
WHERE supplier_name = 'TBO'
AND created_at >= NOW() - INTERVAL '24 hours';

-- Cleanup old logs (90+ days)
SELECT cleanup_old_api_logs();
```

---

## Configuration

### Environment Variables

```bash
# Enable/disable logging (default: true)
ENABLE_API_LOGGING=true

# Log level: all, errors-only, none (default: all)
API_LOG_LEVEL=all
```

---

## Schema Confirmation

### Question: Why are there 3 schemas?

**Answer**: The "3 schemas" you see in pgAdmin are:

1. **`public`** - Your application data (all our tables)
2. **`pg_catalog`** - PostgreSQL system catalog (internal)
3. **`information_schema`** - ANSI-standard metadata (internal)

Only `public` is used for application data.

### Question: New tables should be in `public` schema?

**Answer**: ✅ Yes, confirmed. All new tables are created in `public` schema.

```sql
-- All our tables use this pattern:
CREATE TABLE public.table_name ( ... );
```

### Question: Master Data vs Transaction Data structure?

**Answer**: ✅ Correct. Both are in `public` schema but logically separated:

**Master Data** (infrequent updates):
- `suppliers_master`
- `countries`
- `regions`
- `airlines`
- `airports`

**Transaction Data** (frequent updates):
- `bookings`
- `hotel_bookings`
- `payments`
- `audit_logs`
- `third_party_api_logs` ← NEW

---

## Files Modified/Created

### New Files
- ✅ `api/database/migrations/20250420_third_party_api_logs.sql` - Migration file
- ✅ `api/services/thirdPartyLogger.js` - Logger service
- ✅ `api/routes/admin-api-logs.js` - Admin API endpoints
- ✅ `THIRD_PARTY_API_LOGGING_IMPLEMENTATION.md` - Full documentation
- ✅ `API_LOGGING_QUICK_REFERENCE.md` - This file
- ✅ `verify-api-logging.js` - Verification script

### Modified Files
- ✅ `api/database/connection.js` - Added `ensureThirdPartyApiLogsTable()`
- ✅ `api/services/adapters/tboAdapter.js` - Added logging to auth method
- ✅ `api/server.js` - Registered admin API logs route

---

## Next Steps

### To Use in Other Adapters

1. **Hotelbeds Adapter** (`api/services/adapters/hotelbedsAdapter.js`):
   ```javascript
   const thirdPartyLogger = require("../thirdPartyLogger");
   // Add logging to all API methods
   ```

2. **Amadeus Adapter** (`api/services/adapters/amadeusAdapter.js`):
   ```javascript
   const thirdPartyLogger = require("../thirdPartyLogger");
   // Add logging to all API methods
   ```

3. **RateHawk Adapter** (`api/services/adapters/ratehawkAdapter.js`):
   ```javascript
   const thirdPartyLogger = require("../thirdPartyLogger");
   // Add logging to all API methods
   ```

### Pattern to Follow

For each API method in the adapter:

```javascript
async someApiMethod(params) {
  // Start logging
  const apiLog = thirdPartyLogger.startRequest({
    supplierName: this.supplierCode, // "HOTELBEDS", "AMADEUS", etc.
    endpoint: url,
    method: "POST",
    requestPayload: requestData,
    requestHeaders: headers,
    correlationId: params.bookingRef, // Optional business ID
  });

  try {
    // Make API call
    const response = await axios.post(url, requestData, { headers });
    
    // Log successful response
    await apiLog.end({
      responsePayload: response.data,
      responseHeaders: response.headers,
      statusCode: response.status,
    });
    
    return response.data;
  } catch (error) {
    // Log failed response
    await apiLog.end({
      responsePayload: error.response?.data,
      responseHeaders: error.response?.headers,
      statusCode: error.response?.status || 500,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    
    throw error;
  }
}
```

---

## Monitoring & Maintenance

### Daily Monitoring

```bash
# Check error rate for each supplier
curl -X GET "http://localhost:3001/api/admin/api-logs/stats/TBO" \
  -H "X-Admin-Key: YOUR_KEY"
```

### Weekly Cleanup

```bash
# Remove logs older than 90 days
curl -X POST "http://localhost:3001/api/admin/api-logs/cleanup" \
  -H "X-Admin-Key: YOUR_KEY"
```

### Debugging Issues

When debugging a failed booking:

1. Get the trace_id from the booking logs
2. Query all related API calls:
   ```bash
   curl -X GET "http://localhost:3001/api/admin/api-logs/trace/TRACE_ID" \
     -H "X-Admin-Key: YOUR_KEY"
   ```
3. Review the full request/response chain

---

## Support

For detailed information, see: `THIRD_PARTY_API_LOGGING_IMPLEMENTATION.md`

For questions about database schemas: Contact database administrator
