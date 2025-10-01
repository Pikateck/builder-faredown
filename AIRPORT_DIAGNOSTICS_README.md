# Airport Diagnostics Endpoint

## Overview

The diagnostics endpoint provides comprehensive verification data for the airport dropdown implementation. It is **staging-only** and includes security controls.

## Security Requirements

### Authentication

- **Admin JWT required** - Must have valid admin token
- **Role check** - Must have admin privileges
- **Rate limited** - Maximum 10 requests per minute (stricter than main API)

### Environment Gating

```bash
# Staging only - MUST be explicitly enabled
AIRPORTS_DIAGNOSTICS_ENABLED=true

# Production - MUST be disabled (default)
AIRPORTS_DIAGNOSTICS_ENABLED=false
```

**Behavior:**

- When `false` or unset: Returns HTTP 404 "Diagnostics endpoint is disabled"
- When `true`: Returns diagnostic data (admin-only, rate-limited)

### Data Security

- **No credentials exposed** - Database username/password redacted
- **No JWT secrets** - Authentication tokens not included
- **No API keys** - Third-party keys not exposed

## Endpoint Details

**URL:** `/api/admin/airports/diagnostics`

**Method:** `GET`

**Headers:**

```http
Authorization: Bearer <admin-jwt-token>
```

**Rate Limit:** 10 requests per minute per IP

## Response Structure

```json
{
  "success": true,
  "diagnostics": {
    "timestamp": "2025-02-19T12:00:00.000Z",
    "environment": {
      "nodeEnv": "production",
      "useMockAirports": "false",
      "airportsMaxLimit": "200",
      "airportsMinQuery": "2"
    },
    "database": {
      "host": "dpg-d2806mdniese739731t0-a.singapore-postgres.render.com",
      "port": "5432",
      "database": "faredown_booking_db",
      "username": "[REDACTED]",
      "status": "connected",
      "currentTime": "2025-02-19T12:00:00.000Z",
      "airportMasterExists": true,
      "activeAirportsCount": 1234,
      "searchFunctionExists": true
    },
    "performance": {
      "explainAnalyze": [
        "Seq Scan on airport_master  (cost=0.00..123.45 rows=10 width=100) (actual time=0.123..1.234 rows=2 loops=1)",
        "Planning Time: 0.234 ms",
        "Execution Time: 1.567 ms"
      ]
    },
    "sampleData": {
      "dublinSearch": {
        "total": 2,
        "items": [
          {
            "iata": "DXB",
            "name": "Dubai International",
            "city": "Dubai",
            "country": "United Arab Emirates",
            "iso_country": "AE"
          },
          {
            "iata": "DUB",
            "name": "Dublin Airport",
            "city": "Dublin",
            "country": "Ireland",
            "iso_country": "IE"
          }
        ]
      },
      "allAirports": {
        "total": 5,
        "items": [...]
      }
    }
  }
}
```

## Usage

### Staging Verification

```bash
# Call diagnostics endpoint
curl -H "Authorization: Bearer <admin-token>" \
  "https://staging.example.com/api/admin/airports/diagnostics"

# Verify response includes:
# 1. Correct DB host (dpg-d2806mdniese739731t0-a...)
# 2. Environment flags (USE_MOCK_AIRPORTS=false, etc.)
# 3. EXPLAIN ANALYZE plan with performance metrics
# 4. Sample data with country normalization ("United Arab Emirates", "AE")
```

### Error Responses

**404 - Disabled:**

```json
{
  "error": "Not Found",
  "message": "Diagnostics endpoint is disabled"
}
```

**429 - Rate Limited:**

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 diagnostics requests per minute allowed",
  "retryAfter": 45
}
```

**401 - Unauthorized:**

```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

**403 - Forbidden:**

```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

## Deployment Checklist

### Staging Deployment

- [ ] Set `AIRPORTS_DIAGNOSTICS_ENABLED=true`
- [ ] Deploy code
- [ ] Verify endpoint returns diagnostics data
- [ ] Run verification tests
- [ ] Capture evidence for sign-off

### Production Deployment

- [ ] Set `AIRPORTS_DIAGNOSTICS_ENABLED=false` (or leave unset)
- [ ] Deploy code
- [ ] Verify endpoint returns 404
- [ ] Confirm no diagnostic data exposed

### Post Sign-Off Cleanup

- [ ] Set `AIRPORTS_DIAGNOSTICS_ENABLED=false` on staging
- [ ] Keep endpoint code in place (for future debugging)
- [ ] Keep test suite and README

## Security Notes

1. **Never enable in production** - Diagnostics endpoint should only be enabled temporarily in staging
2. **Short-lived tokens** - Use admin tokens with short expiration (60 minutes max)
3. **Monitor access** - Log all diagnostics endpoint requests
4. **Rotate after use** - Change admin credentials after staging verification complete
5. **No secrets** - Endpoint never exposes credentials, tokens, or API keys

## Related Files

- `api/routes/admin-airports-diagnostics.js` - Diagnostics implementation
- `api/routes/admin-airports.js` - Main airport API
- `STAGING_VERIFICATION_CHECKLIST.md` - Manual testing checklist
- `AIRPORT_API_README.md` - Main API documentation
