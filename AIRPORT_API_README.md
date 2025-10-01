# Airport API Integration

## Overview

The airport API provides a searchable dropdown interface for selecting airports in admin forms. It integrates with the PostgreSQL `airport_master` table and includes proper authentication, rate limiting, and production safeguards.

## Environment Variables

Add these to your `.env` file:

```bash
# Airport API Configuration
USE_MOCK_AIRPORTS=false          # Set to true only in development
AIRPORTS_MAX_LIMIT=200           # Maximum results per request
AIRPORTS_MIN_QUERY=2             # Minimum search query length
```

## API Endpoints

### GET /api/admin/airports

Search and retrieve airport data for admin forms.

**Authentication:** Admin JWT token required

**Parameters:**
- `q` (optional): Search query (minimum 2 characters)
- `limit` (optional): Results limit (default: 50, max: 200) 
- `offset` (optional): Pagination offset (default: 0, must be ≥ 0)

**Example Request:**
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "https://your-domain.com/api/admin/airports?q=dub&limit=20&offset=0"
```

**Example Response:**
```json
{
  "items": [
    {
      "iata": "DXB",
      "name": "Dubai International", 
      "city": "Dubai",
      "country": "UAE"
    }
  ],
  "total": 1,
  "query": "dub",
  "limit": 20,
  "offset": 0
}
```

### GET /api/admin/airports/health

Health check endpoint for the airport service.

**Example Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "mockMode": false,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## Database Integration

The API reads from the `public.airport_master` table with the following requirements:

- **Table:** `airport_master` 
- **Required columns:** `iata`, `name`, `city`, `country`, `is_active`
- **Filtering:** Only returns airports where `is_active = true`
- **Search function:** Attempts to use `search_airports(query, limit, offset)` if available, falls back to direct table queries

**Expected SQL Schema:**
```sql
CREATE TABLE airport_master (
  id SERIAL PRIMARY KEY,
  iata VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL, 
  country VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_airport_master_active ON airport_master(is_active);
CREATE INDEX idx_airport_master_search ON airport_master USING gin(to_tsvector('english', name || ' ' || city || ' ' || country));
```

## Component Integration

### AirportSelect Component

**Location:** `client/components/ui/airport-select.tsx`

**Usage:**
```tsx
import { AirportSelect } from "@/components/ui/airport-select";

<AirportSelect
  value={formData.origin || "ALL"}
  onValueChange={(value) => 
    setFormData({ 
      ...formData, 
      origin: value === "ALL" ? null : value 
    })
  }
  placeholder="Select origin airport"
  includeAll={true}
  allLabel="All Origins"
/>
```

**Props:**
- `value`: Current selected value (IATA code or "ALL")
- `onValueChange`: Callback when selection changes
- `placeholder`: Input placeholder text
- `includeAll`: Whether to show "All" option (default: true)
- `allLabel`: Label for the "All" option
- `disabled`: Whether the component is disabled

### Current Integrations

1. **Markup Management (Air)** - `client/pages/admin/MarkupManagementAir.tsx`
   - Origin and destination airport selection
   - "All" saves as `NULL` in database

2. **Promo Codes** - `client/pages/admin/PromoCodeManager.tsx`
   - Flight-specific promo code targeting
   - Origin and destination airport restrictions

## Security & Performance

### Rate Limiting
- **Limit:** 60 requests per minute per IP address
- **Response:** HTTP 429 with retry-after header when exceeded

### Input Validation
- **Query length:** Minimum 2 characters if provided
- **Limit clamping:** Maximum 200 results per request
- **Offset validation:** Must be non-negative integer

### Caching
- **Headers:** `Cache-Control: private, max-age=60` on successful responses
- **Client-side:** 200ms debounced search queries

### Production Safeguards
- **Mock data:** Disabled in production (`USE_MOCK_AIRPORTS=false`)
- **Database errors:** Returns HTTP 503 instead of silent fallback
- **Authentication:** Admin JWT required for all endpoints

## Testing

Run the integration test suite:

```bash
node test-airport-api.cjs
```

**Test Coverage:**
- Health check endpoint
- Search functionality (Dubai, Mumbai, exact IATA)
- Input validation (minimum query length, limit clamping)
- Error handling (negative offset rejection)
- Response format validation

## File Locations

- **API Route:** `api/routes/admin-airports.js`
- **Component:** `client/components/ui/airport-select.tsx`
- **Tests:** `test-airport-api.cjs`
- **Documentation:** `AIRPORT_API_README.md`

## Deployment Checklist

1. ✅ Environment variables configured
2. ✅ Database schema and indexes in place
3. ✅ Admin authentication middleware active
4. ✅ Rate limiting configured
5. ✅ Mock data disabled in production
6. ✅ Component integrated in target forms
7. ✅ Tests passing

## Troubleshooting

**Common Issues:**

1. **403 Forbidden:** Check admin JWT token in Authorization header
2. **503 Service Unavailable:** Database connection issue, check `airport_master` table
3. **Empty results:** Verify `is_active = true` airports exist in database
4. **Slow responses:** Check trigram indexes are created on search columns

**Debug Mode:**
Set `USE_MOCK_AIRPORTS=true` in development to use fallback data when database is unavailable.
