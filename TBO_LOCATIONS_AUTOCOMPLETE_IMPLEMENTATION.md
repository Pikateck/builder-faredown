# TBO Locations Autocomplete Implementation

## Overview

This implementation provides a **live, database-backed autocomplete system** for hotel search, powered by TBO's location master data (countries, cities, hotels).

### What was built:

1. **TBO Content API Client** (`api/services/tboClient.js`)
   - Fetches data from TBO content endpoints
   - Paginated data retrieval with rate limiting
   - Handles authentication via TBO_API_KEY and TBO_API_SECRET

2. **Sync Job** (`api/jobs/tboSyncLocations.js`)
   - Fetches all countries, cities, and hotels from TBO
   - Upserts into `tbo_countries`, `tbo_cities`, `tbo_hotels` tables
   - Maintains `normalized_name` for fuzzy search
   - Tracks `popularity` for ranking results

3. **Autocomplete API** (`api/routes/locations.js`)
   - `GET /api/locations/search?q=paris&type=all&limit=10`
   - Searches across cities, hotels, and countries
   - Ranking: exact prefix match > contains > fuzzy
   - Returns type badges (city, hotel, country)

4. **Admin Sync Endpoint** (`api/routes/admin-tbo.js`)
   - `POST /api/admin/tbo/sync` — Manually trigger sync
   - `GET /api/admin/tbo/stats` — View record counts
   - `GET /api/admin/tbo/sync-status` — Check last 5 syncs
   - `POST /api/admin/tbo/clear` — Clear all data (admin only)

5. **Updated Frontend** (`client/components/HotelSearchForm.tsx`)
   - Now calls `/api/locations/search` instead of `/api/tbo-hotels/cities`
   - Displays results with type badges (city, hotel, country)
   - Falls back to local search if API fails

## API Endpoints

### 1. Autocomplete Search

```bash
GET /api/locations/search?q=paris&type=all&limit=10
```

**Query Parameters:**
- `q` (required): Search text (min 2 chars)
- `type` (optional): `all` | `city` | `hotel` | `country` (default: `all`)
- `limit` (optional): Results per type (default: 10, max: 25)

**Response:**
```json
{
  "items": [
    {
      "kind": "city",
      "id": "75056",
      "name": "Paris",
      "country_id": "250"
    },
    {
      "kind": "hotel",
      "id": "12345",
      "name": "Hotel Pullman Paris Tour Eiffel",
      "city_id": "75056"
    }
  ],
  "count": 2,
  "query": "paris",
  "types": ["city", "hotel"]
}
```

### 2. Statistics

```bash
GET /api/locations/stats
```

**Response:**
```json
{
  "cities": 5000,
  "countries": 250,
  "hotels": 500000
}
```

### 3. Admin Sync (Protected)

```bash
POST /api/admin/tbo/sync
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "elapsed_ms": 45000,
  "countries": 250,
  "cities": 5000,
  "hotels": 500000,
  "timestamp": "2025-01-23T10:30:45.123Z"
}
```

### 4. Admin Stats (Protected)

```bash
GET /api/admin/tbo/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "countries": {
    "count": 250,
    "last_updated": "2025-01-23T10:30:45.123Z"
  },
  "cities": {
    "count": 5000,
    "last_updated": "2025-01-23T10:30:45.123Z"
  },
  "hotels": {
    "count": 500000,
    "last_updated": "2025-01-23T10:30:45.123Z"
  }
}
```

## Database Schema

### tbo_countries
```sql
CREATE TABLE tbo_countries (
  id SERIAL PRIMARY KEY,
  supplier_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  iso2 VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### tbo_cities
```sql
CREATE TABLE tbo_cities (
  id SERIAL PRIMARY KEY,
  supplier_id VARCHAR(50) UNIQUE NOT NULL,
  country_supplier_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  lat FLOAT,
  lng FLOAT,
  popularity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### tbo_hotels
```sql
CREATE TABLE tbo_hotels (
  id SERIAL PRIMARY KEY,
  supplier_id VARCHAR(50) UNIQUE NOT NULL,
  city_supplier_id VARCHAR(50) NOT NULL,
  country_supplier_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  address TEXT,
  lat FLOAT,
  lng FLOAT,
  stars INT,
  popularity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Setup & Testing

### Step 1: Verify Environment Variables (Render)

```bash
# Check that these are set in Render dashboard:
TBO_CONTENT_BASE_URL=https://api.test.hotelbeds.com/hotel-content-api/1.0/
TBO_API_KEY=91d2368789abdb5beec101ce95a9d185
TBO_API_SECRET=a9ffaaecce
```

### Step 2: Trigger Initial Sync

```bash
# Using curl with admin token:
curl -X POST https://builder-faredown-pricing.onrender.com/api/admin/tbo/sync \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json"

# Or from your backend:
const { syncTboLocations } = require('./api/jobs/tboSyncLocations.js');
await syncTboLocations();
```

### Step 3: Verify Sync Results

```bash
# Check stats:
curl https://builder-faredown-pricing.onrender.com/api/admin/tbo/stats \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>"

# Public stats endpoint:
curl https://builder-faredown-pricing.onrender.com/api/locations/stats
```

### Step 4: Test Search Functionality

```bash
# Search for cities:
curl "https://builder-faredown-pricing.onrender.com/api/locations/search?q=paris&type=city"

# Search for hotels:
curl "https://builder-faredown-pricing.onrender.com/api/locations/search?q=paris&type=hotel"

# Search for everything:
curl "https://builder-faredown-pricing.onrender.com/api/locations/search?q=paris&type=all&limit=20"

# Search for Dubai:
curl "https://builder-faredown-pricing.onrender.com/api/locations/search?q=dubai"

# Search for Prague:
curl "https://builder-faredown-pricing.onrender.com/api/locations/search?q=prague"
```

## Frontend Integration

### HotelSearchForm Component

The search box now calls `/api/locations/search`:

```typescript
// Types returned
{
  kind: "city" | "hotel" | "country",
  id: string,
  name: string,
  country_id?: string,  // For cities
  city_id?: string      // For hotels
}
```

### Usage in Hotel Search

When a user selects a city or hotel from autocomplete:

1. **City selected**: Navigate to `/hotels?cityId=<city_supplier_id>`
2. **Hotel selected**: Navigate to `/hotels?hotelId=<hotel_supplier_id>`
3. **Country selected**: Show cities in that country

## Monitoring & Debugging

### Check Sync Logs

```bash
# View last 5 syncs:
curl https://builder-faredown-pricing.onrender.com/api/admin/tbo/sync-status \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>"
```

### Enable Debug Logging

In your backend logs, you'll see:
```
🌍 Syncing TBO countries...
✅ Synced 250 countries
🏙️  Syncing TBO cities...
✅ Synced 5000 cities
🏨 Syncing TBO hotels...
✅ Synced 500000 hotels
✅ Sync completed successfully!
⏱️  Total time: 120.50s
```

### Common Issues

**Issue: "No results found" on autocomplete**
- Check if sync has completed: `GET /api/locations/stats`
- Verify TBO API credentials in Render env vars
- Check browser console for fetch errors

**Issue: Slow autocomplete**
- Ensure database indexes exist on `normalized_name` columns
- Check for missing `limit` parameter (defaults to 10)

**Issue: Duplicate results**
- Run clear and resync: `POST /api/admin/tbo/clear` then `POST /api/admin/tbo/sync`

## Deployment Checklist

- [x] Create `api/services/tboClient.js`
- [x] Create `api/jobs/tboSyncLocations.js`
- [x] Create `api/routes/locations.js`
- [x] Create `api/routes/admin-tbo.js`
- [x] Update `api/server.js` with route mounts
- [x] Update frontend `HotelSearchForm.tsx` to use new endpoint
- [ ] Deploy to Render (git push)
- [ ] Verify environment variables on Render
- [ ] Run initial sync: `POST /api/admin/tbo/sync`
- [ ] Test search: `GET /api/locations/search?q=paris`
- [ ] Verify frontend displays results correctly

## Next Steps

1. **Deploy to Render** — Push code changes
2. **Verify Credentials** — Confirm TBO env vars are set
3. **Run Initial Sync** — Populate database
4. **Test Search** — Try "Paris", "Dubai", "Prague"
5. **Monitor Performance** — Check response times

## Support

For issues, check:
1. Render logs: `builder-faredown-pricing` service
2. Database: `faredown_booking_db` tbo_* tables
3. Frontend console: Network tab for API calls
