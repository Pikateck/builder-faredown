# Third-Party API Logging Implementation

## Overview

This document explains the third-party API logging system implemented to track all requests and responses from external suppliers (TBO, Hotelbeds, Amadeus, RateHawk, etc.).

## Database Schema Summary

### Schema Structure

**All tables are created in the `public` schema** (the default PostgreSQL schema). This is confirmed by:

1. **Default Behavior**: When creating tables without specifying a schema, PostgreSQL automatically uses the `public` schema
2. **Explicit Definition**: Our migration files and connection.js explicitly use `CREATE TABLE IF NOT EXISTS public.table_name`
3. **Consistent Pattern**: All application data tables (bookings, users, suppliers, etc.) reside in `public`

### Understanding PostgreSQL Schemas

When you see "3 schemas" in pgAdmin, this typically includes:

1. **`public`** - Your application data (all our tables)
2. **`pg_catalog`** - PostgreSQL system catalog (internal metadata)
3. **`information_schema`** - ANSI-standard views of database metadata

**Only `public` is used for application data.** The other schemas are PostgreSQL internals.

### Master Data vs Transaction Data

Both master data and transaction data are stored in the `public` schema, but are logically separated:

#### Master Data (One-time/Infrequent Updates)

- `suppliers_master` - Supplier configurations
- `countries` - Country reference data
- `regions` - Region definitions
- `airlines` - Airline reference data
- `airports` - Airport reference data

#### Transaction Data (Frequent Updates)

- `bookings` - Hotel/flight bookings
- `hotel_bookings` - Hotel-specific bookings
- `payments` - Payment transactions
- `audit_logs` - User activity logs
- `third_party_api_logs` - **NEW** API request/response logs

---

## Third-Party API Logging System

### 1. Database Table: `third_party_api_logs`

Located in the `public` schema, this table stores all third-party API interactions.

**Location**: `api/database/migrations/20250420_third_party_api_logs.sql`

**Structure**:

```sql
CREATE TABLE public.third_party_api_logs (
    id UUID PRIMARY KEY,
    supplier_name VARCHAR(100),      -- TBO, HOTELBEDS, AMADEUS, RATEHAWK
    endpoint VARCHAR(500),            -- API endpoint URL
    method VARCHAR(10),               -- GET, POST, etc.
    request_payload JSONB,            -- Request body (sanitized)
    request_headers JSONB,            -- Request headers (sanitized)
    response_payload JSONB,           -- Response body (sanitized)
    response_headers JSONB,           -- Response headers
    status_code INTEGER,              -- HTTP status code
    error_message TEXT,               -- Error message if failed
    error_stack TEXT,                 -- Error stack trace
    request_timestamp TIMESTAMPTZ,    -- When request was sent
    response_timestamp TIMESTAMPTZ,   -- When response received
    duration_ms INTEGER,              -- Response time in ms
    trace_id VARCHAR(255),            -- For correlation
    correlation_id VARCHAR(255),      -- Business correlation (booking_ref)
    environment VARCHAR(50),          -- production/staging/dev
    created_at TIMESTAMPTZ
);
```

**Indexes**:

- `idx_third_party_logs_supplier` - Query by supplier and date
- `idx_third_party_logs_timestamp` - Query by date
- `idx_third_party_logs_status` - Query by status code
- `idx_third_party_logs_trace` - Query by trace ID
- `idx_third_party_logs_correlation` - Query by correlation ID
- `idx_third_party_logs_errors` - Query errors efficiently

### 2. Logging Service: `thirdPartyLogger.js`

**Location**: `api/services/thirdPartyLogger.js`

**Features**:

- ✅ Automatic sanitization of sensitive data (passwords, tokens, API keys)
- ✅ Request/response tracking with timestamps
- ✅ Duration calculation
- ✅ Trace ID generation for correlation
- ✅ Configurable log levels (all, errors-only, none)
- ✅ Performance-friendly (non-blocking, async)

**Usage Example**:

```javascript
const thirdPartyLogger = require("../services/thirdPartyLogger");

// Start logging a request
const apiLog = thirdPartyLogger.startRequest({
  supplierName: "TBO",
  endpoint: "https://api.travelboutiqueonline.com/auth",
  method: "POST",
  requestPayload: { ClientId: "xxx", Password: "yyy" },
  requestHeaders: { "Content-Type": "application/json" },
  correlationId: "BOOKING-12345", // Optional
  traceId: "unique-trace-id", // Optional (auto-generated if not provided)
});

try {
  // Make API call
  const response = await axios.post(url, data);

  // Log successful response
  await apiLog.end({
    responsePayload: response.data,
    responseHeaders: response.headers,
    statusCode: response.status,
  });
} catch (error) {
  // Log failed response
  await apiLog.end({
    responsePayload: error.response?.data,
    responseHeaders: error.response?.headers,
    statusCode: error.response?.status || 500,
    errorMessage: error.message,
    errorStack: error.stack,
  });
}
```

### 3. Configuration

**Environment Variables**:

```bash
# Enable/disable API logging (default: true)
ENABLE_API_LOGGING=true

# Log level: all, errors-only, none (default: all)
API_LOG_LEVEL=all
```

### 4. Admin API Endpoints

**Location**: `api/routes/admin-api-logs.js`

All endpoints require admin authentication.

#### Query Logs

```
GET /api/admin/api-logs?supplier=TBO&limit=100&offset=0
```

**Query Parameters**:

- `supplier` - Filter by supplier name (TBO, HOTELBEDS, etc.)
- `status` - Filter by HTTP status code
- `limit` - Results per page (default: 100)
- `offset` - Pagination offset
- `from_date` - Start date filter (ISO 8601)
- `to_date` - End date filter (ISO 8601)
- `trace_id` - Filter by trace ID
- `correlation_id` - Filter by correlation ID
- `errors_only` - Show only errors (true/false)

**Response**:

```json
{
  "success": true,
  "data": [...],
  "total": 1234,
  "limit": 100,
  "offset": 0
}
```

#### Get Log Details

```
GET /api/admin/api-logs/:id
```

Returns full log details including request/response payloads.

#### Get Supplier Statistics

```
GET /api/admin/api-logs/stats/TBO?from_date=2025-01-01
```

**Response**:

```json
{
  "success": true,
  "data": {
    "supplier_name": "TBO",
    "total_requests": 1500,
    "successful_requests": 1450,
    "failed_requests": 50,
    "error_requests": 30,
    "avg_duration_ms": 850,
    "max_duration_ms": 5000,
    "min_duration_ms": 200
  }
}
```

#### Get Recent Errors

```
GET /api/admin/api-logs/errors/recent?supplier=TBO&limit=50
```

Returns recent error logs for debugging.

#### Get Logs by Trace ID

```
GET /api/admin/api-logs/trace/:trace_id
```

Returns all related logs for a specific trace ID (useful for debugging a complete flow).

#### Cleanup Old Logs

```
POST /api/admin/api-logs/cleanup
```

Deletes logs older than 90 days.

### 5. Integration with Adapters

The logging is integrated into the TBO adapter as a reference implementation.

**File**: `api/services/adapters/tboAdapter.js`

**Example** (Authentication method):

```javascript
const thirdPartyLogger = require("../thirdPartyLogger");

async getHotelToken() {
  const apiLog = thirdPartyLogger.startRequest({
    supplierName: "TBO",
    endpoint: this.config.hotelAuthUrl,
    method: "POST",
    requestPayload: authRequest,
    requestHeaders: { ... },
  });

  try {
    const response = await tboRequest(url, { ... });

    await apiLog.end({
      responsePayload: response.data,
      responseHeaders: response.headers,
      statusCode: response.status,
    });

    return response.data.TokenId;
  } catch (error) {
    await apiLog.end({
      responsePayload: error.response?.data,
      statusCode: error.response?.status || 500,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    throw error;
  }
}
```

### 6. Security & Privacy

#### Automatic Sanitization

The logger automatically sanitizes sensitive fields before storing:

- `password`, `Password`
- `api_key`, `apiKey`
- `api_secret`, `apiSecret`
- `token`, `TokenId`
- `authorization`
- `clientId`, `ClientId`

**Example**:

```javascript
// Original: { Password: "secret123" }
// Stored:   { Password: "se***23" }
```

#### Data Retention

- Logs are retained for **90 days** by default
- Use the cleanup endpoint to remove old logs: `POST /api/admin/api-logs/cleanup`
- Can be automated via cron job

### 7. Performance Considerations

1. **Non-blocking**: Logging happens asynchronously and doesn't block API calls
2. **Indexed Queries**: All common queries use database indexes
3. **Configurable Levels**: Use `errors-only` mode in high-traffic scenarios
4. **JSONB Storage**: Efficient storage and querying of JSON payloads

### 8. Deployment Checklist

- [x] Migration file created: `20250420_third_party_api_logs.sql`
- [x] Logger service created: `thirdPartyLogger.js`
- [x] Connection.js updated with `ensureThirdPartyApiLogsTable()`
- [x] TBO adapter updated with logging
- [x] Admin API routes created: `admin-api-logs.js`
- [ ] Register admin routes in `api/server.js`:
  ```javascript
  const adminApiLogsRoutes = require("./routes/admin-api-logs");
  app.use("/api/admin/api-logs", adminKeyMiddleware, adminApiLogsRoutes);
  ```
- [ ] Restart the API server to apply changes
- [ ] Verify table creation by checking database
- [ ] Test logging by making TBO API calls
- [ ] Monitor logs via admin endpoints

### 9. Next Steps

To complete the implementation across all suppliers:

1. **Update Hotelbeds Adapter** (`api/services/adapters/hotelbedsAdapter.js`)
   - Add `const thirdPartyLogger = require("../thirdPartyLogger");`
   - Wrap API calls with `apiLog.startRequest()` and `apiLog.end()`

2. **Update Amadeus Adapter** (`api/services/adapters/amadeusAdapter.js`)
   - Same logging pattern as TBO

3. **Update RateHawk Adapter** (`api/services/adapters/ratehawkAdapter.js`)
   - Same logging pattern as TBO

4. **Update Other Adapters**
   - Apply to any other third-party integrations

### 10. Testing

```bash
# 1. Restart API server
npm run dev

# 2. Make a test API call (triggers logging)
curl -X GET "http://localhost:3000/api/hotels/search?destination=DXB&..."

# 3. Query logs via admin API
curl -X GET "http://localhost:3000/api/admin/api-logs?supplier=TBO&limit=10" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"

# 4. View error logs
curl -X GET "http://localhost:3000/api/admin/api-logs/errors/recent?supplier=TBO" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"

# 5. Get supplier stats
curl -X GET "http://localhost:3000/api/admin/api-logs/stats/TBO" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

---

## Summary of Answers to Your Questions

### 1. Why are there 3 schemas and not 1?

The "3 schemas" you see are:

- **`public`** - Your application data (this is what we use)
- **`pg_catalog`** - PostgreSQL system catalog (internal)
- **`information_schema`** - ANSI-standard metadata views (internal)

**Only `public` is used for application data.** The other two are PostgreSQL internals.

### 2. New tables should be created in public schema only - Confirmed?

**✅ Confirmed.** All new tables are created in the `public` schema. This is:

- The default behavior when no schema is specified
- Explicitly enforced in our migrations (`CREATE TABLE public.table_name`)
- Consistent across all existing tables

### 3. Confirm that new tables are not created in different schemas

**✅ Confirmed.** New tables are always created in the `public` schema. Our codebase does not create tables in other schemas.

### 4. Master Data vs Transaction Data structure

**✅ Correct structure.** Both master data and transaction data are in the `public` schema:

**Master Data** (infrequent updates):

- suppliers_master
- countries
- regions
- airlines
- airports

**Transaction Data** (frequent updates):

- bookings
- hotel_bookings
- payments
- audit_logs
- third_party_api_logs (NEW)

The separation is **logical** (based on usage pattern), not **physical** (separate schemas).

### 5. Third-party supplier request/response logging

**✅ Now Implemented.** The logging system is complete with:

- ✅ Database table: `public.third_party_api_logs`
- ✅ Logging service: `api/services/thirdPartyLogger.js`
- ✅ Admin API routes: `api/routes/admin-api-logs.js`
- ✅ TBO adapter integration (reference implementation)
- ✅ Automatic sanitization of sensitive data
- ✅ Query, stats, and monitoring endpoints

**To complete**:

1. Register admin routes in `api/server.js`
2. Apply logging to other adapters (Hotelbeds, Amadeus, RateHawk)
3. Restart and test

---

## Support

For questions or issues, refer to:

- Database schema: `api/database/schema.sql`
- Migration files: `api/database/migrations/`
- Logger service: `api/services/thirdPartyLogger.js`
- Admin routes: `api/routes/admin-api-logs.js`
