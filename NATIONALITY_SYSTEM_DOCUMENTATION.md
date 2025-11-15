# Nationality System - Technical Documentation

## Overview

Complete nationality system for Faredown's hotel search and user profiles, enabling nationality-aware pricing and supplier compliance.

**Purpose:** Support nationality-based hotel search (required by TBO and future suppliers) with user profile integration.

**Default Behavior:** System defaults to `IN` (India) when no nationality is specified.

---

## Architecture

### 1. Database Layer

**Migration File:** `api/database/migrations/20250415_nationalities_system.sql`

**Tables:**

```sql
-- Master table of all nationalities (194 countries)
CREATE TABLE public.nationalities_master (
  id SERIAL PRIMARY KEY,
  iso_code VARCHAR(2) NOT NULL UNIQUE,     -- ISO 3166-1 alpha-2
  country_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 999,       -- Lower = higher priority
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profile extension
ALTER TABLE public.users 
  ADD COLUMN nationality_iso VARCHAR(2) REFERENCES nationalities_master(iso_code);
```

**Seeded Data:**
- 194 countries (ISO 3166-1 alpha-2)
- Top 50 prioritized by `display_order` (1-50)
- Remaining alphabetical (display_order = 999)

**Helper Function:**

```sql
CREATE FUNCTION get_user_nationality(user_id UUID) RETURNS VARCHAR(2)
-- Returns user's nationality or 'IN' default
```

---

### 2. API Layer

#### **Endpoints**

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/meta/nationalities` | GET | Get all active nationalities | No |
| `/api/meta/nationalities/:isoCode` | GET | Get specific nationality details | No |

**File:** `api/routes/meta-nationalities.js`

**Example Response:**

```json
{
  "success": true,
  "nationalities": [
    { "isoCode": "IN", "countryName": "India" },
    { "isoCode": "AE", "countryName": "United Arab Emirates" },
    { "isoCode": "GB", "countryName": "United Kingdom" }
  ],
  "count": 194
}
```

#### **Nationality Resolver Utility**

**File:** `api/utils/nationalityResolver.js`

**Main Function:** `resolveGuestNationality(req, user)`

**Resolution Priority:**
1. **Explicit in request** (`req.body.guestNationality`)
2. **User's saved nationality** (`users.nationality_iso`)
3. **Default fallback** (`IN`)

**Usage in TBO Search:**

```javascript
const { resolveGuestNationality } = require('../utils/nationalityResolver');

router.post('/search', async (req, res) => {
  const guestNationality = await resolveGuestNationality(req, req.user);
  
  const searchRequest = {
    ...req.body,
    guestNationality: req.body.guestNationality || guestNationality
  };
  
  const results = await adapter.searchHotels(searchRequest);
  // ...
});
```

**Additional Functions:**
- `validateNationality(isoCode)` - Check if valid and active
- `getNationalityName(isoCode)` - Get country name
- `updateUserNationality(userId, isoCode)` - Update user profile

---

### 3. Frontend Layer

#### **Service**

**File:** `client/services/nationalitiesService.ts`

**Functions:**

```typescript
// Fetch all nationalities (cached)
getNationalities(): Promise<Nationality[]>

// Get by ISO code
getNationalityByCode(isoCode: string): Promise<Nationality | null>

// Get user's saved nationality
getUserNationality(user: any): string | null

// Get default for search
getDefaultNationality(user: any): string
```

**Caching:** In-memory cache after first load to minimize API calls.

**Fallback:** Returns top 20 countries if API fails.

---

#### **UI Integration**

**Component:** `client/components/HotelSearchForm.tsx`

**Implementation:**

1. **State Management:**
```typescript
const { user } = useAuth() || { user: null };
const [nationality, setNationality] = useState<string>('IN');
const [nationalities, setNationalities] = useState<Nationality[]>([]);
```

2. **Load on Mount:**
```typescript
useEffect(() => {
  const loadNationalities = async () => {
    const data = await getNationalities();
    setNationalities(data);
    setNationality(getDefaultNationality(user));
  };
  loadNationalities();
}, [user]);
```

3. **UI Field:**
```tsx
<div className="relative">
  <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
    Guest Nationality
  </label>
  <Select value={nationality} onValueChange={setNationality}>
    <SelectTrigger>
      <Globe className="mr-2 h-4 w-4" />
      <SelectValue placeholder="Select nationality" />
    </SelectTrigger>
    <SelectContent>
      {nationalities.map(n => (
        <SelectItem key={n.isoCode} value={n.isoCode}>
          {n.countryName}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

4. **Include in Search:**
```typescript
const searchParams = {
  destination,
  checkIn,
  checkOut,
  adults,
  children,
  rooms,
  guestNationality: nationality, // ← Add this
};
```

---

## Supplier Integration

### TBO (Travel Boutique Online)

**Current Status:** Agency `BOMF145` restricted to Indian nationality only.

**Integration:** `api/routes/tbo-hotels.js` (lines 249-258)

```javascript
const { resolveGuestNationality } = require('../utils/nationalityResolver');

// In search route:
const guestNationality = await resolveGuestNationality(req, req.user);
const searchRequest = {
  ...req.body,
  guestNationality: req.body.guestNationality || guestNationality
};
```

**TBO Payload:**

```json
{
  "TokenId": "...",
  "CityId": 187916,
  "CheckInDate": "15/12/2025",
  "NoOfNights": 3,
  "GuestNationality": "IN",
  "RoomGuests": [...]
}
```

**Error When Using Non-IN:**
```
"Search is not allowed for other than Indian Nationality."
```

**Future:** When TBO lifts restriction, all nationalities will work automatically.

---

### Hotelbeds & RateHawk

**Status:** Both support all nationalities.

**Implementation:** Same `guestNationality` parameter in search requests.

---

## Default Behavior Matrix

| Scenario | Nationality | Source |
|----------|-------------|--------|
| Anonymous, no selection | `IN` | System default |
| Anonymous, selects `AE` | `AE` | Explicit selection |
| Logged-in, no saved nationality | `IN` | System default |
| Logged-in, saved `GB` | `GB` | User profile |
| Logged-in, overrides to `US` | `US` | Explicit selection |

**Priority:** Explicit > Profile > Default (IN)

---

## Deployment

### Steps

1. **Run Migration:**
```bash
psql $DATABASE_URL -f api/database/migrations/20250415_nationalities_system.sql
```

2. **Verify:**
```sql
SELECT COUNT(*) FROM public.nationalities_master;
-- Should return 194

SELECT iso_code, country_name 
FROM public.nationalities_master 
ORDER BY display_order 
LIMIT 10;
-- Should show: IN, AE, GB, US, SG, AU, CA, SA, QA, KW
```

3. **Test API:**
```bash
curl https://builder-faredown-pricing.onrender.com/api/meta/nationalities
```

4. **Test Frontend:**
- Verify dropdown appears in hotel search
- Check nationality is included in search URL
- Test with different nationalities

---

## Testing

### Database

```sql
-- Verify table
SELECT COUNT(*) as total FROM public.nationalities_master;

-- Check priorities
SELECT iso_code, country_name, display_order 
FROM public.nationalities_master 
WHERE display_order < 100 
ORDER BY display_order;

-- Test helper function
SELECT get_user_nationality('00000000-0000-0000-0000-000000000000'::UUID);
-- Should return: IN
```

### API

```bash
# List all nationalities
curl https://builder-faredown-pricing.onrender.com/api/meta/nationalities

# Get specific nationality
curl https://builder-faredown-pricing.onrender.com/api/meta/nationalities/AE
```

### Hotel Search

```bash
# Test with IN (should work with TBO)
curl -X POST https://builder-faredown-pricing.onrender.com/api/tbo-hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Dubai",
    "checkIn": "2025-06-15",
    "checkOut": "2025-06-18",
    "adults": 2,
    "guestNationality": "IN"
  }'

# Test with non-IN (currently fails with TBO)
# Same request with "guestNationality": "AE"
```

---

## Troubleshooting

**Issue:** Dropdown is empty
- Check `/api/meta/nationalities` endpoint
- Verify migration ran successfully
- Check browser console for errors

**Issue:** Default nationality not working
- Verify user has `nationality_iso` in database
- Check AuthContext provides user object
- Review service fallback logic

**Issue:** TBO nationality error
- Confirm nationality is `IN`
- Check resolver logs
- Verify TBO agency restriction status

---

## Files

### Backend
- `api/database/migrations/20250415_nationalities_system.sql`
- `api/routes/meta-nationalities.js`
- `api/utils/nationalityResolver.js`
- `api/routes/tbo-hotels.js` (integration)

### Frontend
- `client/services/nationalitiesService.ts`
- `client/components/HotelSearchForm.tsx` (UI)

### Documentation
- `NATIONALITY_SYSTEM_DOCUMENTATION.md` (this file)
- `HOTEL_SEARCH_FORM_NATIONALITY_UPDATE.md` (UI guide)

---

## Migration File Path

**For Render Execution:**
```
api/database/migrations/20250415_nationalities_system.sql
```

**Command:**
```bash
psql $DATABASE_URL -f api/database/migrations/20250415_nationalities_system.sql
```

---

**Version:** 1.0.0  
**Date:** 2025-04-15  
**Status:** Production Ready
