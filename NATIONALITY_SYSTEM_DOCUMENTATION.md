# Nationality System - Technical Documentation

## Overview

This document describes the nationality system implementation for Faredown's hotel search and pricing engine.

**Purpose:** Enable nationality-aware hotel search to comply with supplier restrictions (TBO requires Indian nationality) and support future nationality-based pricing.

**Default Behavior:** System defaults to `IN` (India) when no nationality is specified.

---

## Architecture

### 1. Database Layer

**Table:** `public.nationalities_master`

```sql
CREATE TABLE public.nationalities_master (
  id SERIAL PRIMARY KEY,
  iso_code VARCHAR(2) NOT NULL UNIQUE,     -- ISO 3166-1 alpha-2 (IN, AE, GB, etc.)
  country_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 999,       -- Lower = higher priority in dropdowns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**User Profile Extension:**

```sql
ALTER TABLE public.users 
  ADD COLUMN nationality_iso VARCHAR(2);

ALTER TABLE public.users 
  ADD CONSTRAINT fk_users_nationality 
  FOREIGN KEY (nationality_iso) 
  REFERENCES public.nationalities_master(iso_code);
```

**Helper Function:**

```sql
CREATE FUNCTION get_user_nationality(user_id UUID)
RETURNS VARCHAR(2) AS $$
  -- Returns user's nationality or 'IN' default
$$
```

**Migration File:** `api/database/migrations/20250415_nationalities_system.sql`

**Seeded Data:** 194 countries (top 50 prioritized by `display_order`)

---

### 2. API Layer

#### **Endpoints**

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/meta/nationalities` | GET | Get all active nationalities for dropdowns | No |
| `/api/meta/nationalities/:isoCode` | GET | Get specific nationality details | No |

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

#### **Nationality Resolution Utility**

**File:** `api/utils/nationalityResolver.js`

**Main Function:** `resolveGuestNationality(req, user)`

**Resolution Priority:**
1. **Explicit in request body** (`req.body.guestNationality`)
2. **User's saved nationality** (from profile: `users.nationality_iso`)
3. **Default fallback** (`IN`)

**Usage:**

```javascript
const { resolveGuestNationality } = require('../utils/nationalityResolver');

router.post('/search', async (req, res) => {
  const guestNationality = await resolveGuestNationality(req, req.user);
  
  const searchRequest = {
    ...req.body,
    guestNationality
  };
  
  const results = await adapter.searchHotels(searchRequest);
  // ...
});
```

**Other Functions:**
- `validateNationality(isoCode)` - Validates ISO code exists and is active
- `getNationalityName(isoCode)` - Returns country name
- `updateUserNationality(userId, isoCode)` - Updates user profile
- `logNationalityResolution(...)` - Logs resolution for debugging

---

### 3. Frontend Layer

#### **Service**

**File:** `client/services/nationalitiesService.ts`

**Key Functions:**

```typescript
// Fetch all nationalities (cached)
getNationalities(): Promise<Nationality[]>

// Get nationality by ISO code
getNationalityByCode(isoCode: string): Promise<Nationality | null>

// Get user's saved nationality
getUserNationality(user: any): string | null

// Get default for search (user's saved or IN)
getDefaultNationality(user: any): string
```

**Caching:** Nationalities are cached in memory on first load to minimize API calls.

---

#### **UI Integration**

**Component:** `HotelSearchForm.tsx`

**Required Changes:**

1. **Add State:**
```typescript
const [nationality, setNationality] = useState<string>('IN');
const [nationalities, setNationalities] = useState<Nationality[]>([]);
```

2. **Load Nationalities on Mount:**
```typescript
useEffect(() => {
  const loadNationalities = async () => {
    const user = useAuth().user; // Get from AuthContext
    const data = await getNationalities();
    setNationalities(data);
    
    // Set default based on user profile
    const defaultNat = getDefaultNationality(user);
    setNationality(defaultNat);
  };
  loadNationalities();
}, []);
```

3. **Add Dropdown Field:**
```tsx
<Select value={nationality} onValueChange={setNationality}>
  <SelectTrigger>
    <SelectValue placeholder="Nationality" />
  </SelectTrigger>
  <SelectContent>
    {nationalities.map(n => (
      <SelectItem key={n.isoCode} value={n.isoCode}>
        {n.countryName}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

4. **Include in Search:**
```typescript
const handleSearch = () => {
  const searchData = {
    destination: destinationCode,
    checkIn: format(checkInDate, 'yyyy-MM-dd'),
    checkOut: format(checkOutDate, 'yyyy-MM-dd'),
    adults: guests.adults,
    children: guests.children,
    rooms: guests.rooms,
    guestNationality: nationality, // ← Add this
  };
  
  // Navigate to results...
};
```

---

## Supplier Integration

### TBO (Travel Boutique Online)

**Current Restriction:** Agency `BOMF145` only allows `guestNationality = "IN"`

**Error When Using Non-IN:**
```
"Search is not allowed for other than Indian Nationality."
```

**TBO Search Payload:**

```json
{
  "TokenId": "...",
  "CityId": 187916,
  "CheckInDate": "15/12/2025",
  "NoOfNights": 3,
  "GuestNationality": "IN",
  "RoomGuests": [
    { "NoOfAdults": 2, "NoOfChild": 0 }
  ]
}
```

**Integration File:** `api/routes/tbo-hotels.js`

**Code Update:**

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

**Future:** When TBO lifts restriction, system will automatically support all nationalities.

---

### Hotelbeds

**Status:** Supports all nationalities

**Integration:** Same `guestNationality` field in search request

**Pricing:** May vary by nationality (to be implemented)

---

### RateHawk

**Status:** Supports all nationalities

**Integration:** Same `guestNationality` field in search request

---

## User Profile Integration

### Profile Page

**Update Endpoint:** `PUT /api/profile`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "nationalityIso": "AE"
}
```

**Database Update:**
```sql
UPDATE public.users 
SET nationality_iso = 'AE', updated_at = NOW()
WHERE id = 'user-uuid';
```

**Frontend (My Account Page):**

```tsx
<Select value={profile.nationalityIso} onValueChange={handleNationalityChange}>
  <SelectTrigger>
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
```

---

## Default Behavior

| Scenario | Nationality Used | Source |
|----------|-----------------|--------|
| Anonymous user, no selection | `IN` | System default |
| Anonymous user, selects `AE` | `AE` | Explicit selection |
| Logged-in user, no saved nationality | `IN` | System default |
| Logged-in user, saved `GB` | `GB` | User profile |
| Logged-in user, overrides to `US` | `US` | Explicit selection |

**Priority:** Explicit > Profile > Default (IN)

---

## Testing

### Database Migration

```bash
# On Render or local PostgreSQL
psql $DATABASE_URL -f api/database/migrations/20250415_nationalities_system.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM public.nationalities_master;
-- Should return 194

SELECT iso_code, country_name FROM public.nationalities_master 
ORDER BY display_order LIMIT 10;
-- Should show IN, AE, GB, US, etc.
```

### API Endpoints

**Test Nationalities List:**
```bash
curl https://builder-faredown-pricing.onrender.com/api/meta/nationalities
```

**Expected:**
```json
{
  "success": true,
  "nationalities": [...],
  "count": 194
}
```

**Test Specific Nationality:**
```bash
curl https://builder-faredown-pricing.onrender.com/api/meta/nationalities/AE
```

### Hotel Search with Nationality

**Test TBO Search:**
```bash
curl -X POST https://builder-faredown-pricing.onrender.com/api/tbo-hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Dubai",
    "checkIn": "2025-06-15",
    "checkOut": "2025-06-18",
    "adults": 2,
    "children": 0,
    "rooms": 1,
    "guestNationality": "IN"
  }'
```

**Expected:** Success with hotels

**Test with Non-IN (currently fails with TBO):**
```bash
# Same request but with "guestNationality": "AE"
```

**Expected (current):** `"Search is not allowed for other than Indian Nationality."`

**Expected (after TBO lifts restriction):** Success with hotels

---

## Production Deployment

### Steps

1. **Run migration on production database**
2. **Deploy backend code** (API routes + nationality resolver)
3. **Deploy frontend code** (HotelSearchForm + service)
4. **Verify API endpoint:** `/api/meta/nationalities`
5. **Test hotel search** with different nationalities
6. **Monitor logs** for nationality resolution

### Rollback Plan

If issues occur:

1. **Frontend:** Revert HotelSearchForm changes (system will use default `IN`)
2. **Backend:** Nationality resolver has safe fallback to `IN`
3. **Database:** Table can remain (doesn't break existing functionality)

---

## Future Enhancements

### Multi-Supplier Routing by Nationality

```javascript
function selectSuppliers(guestNationality) {
  if (guestNationality === 'IN') {
    return ['TBO', 'HOTELBEDS', 'RATEHAWK']; // TBO has best Indian rates
  }
  return ['HOTELBEDS', 'RATEHAWK']; // Non-Indian: skip TBO
}
```

### Nationality-Based Pricing

```javascript
function applyNationalityMarkup(price, nationality) {
  const markups = {
    'IN': 1.0,   // No markup
    'AE': 1.05,  // 5% for UAE nationals
    'GB': 1.08,  // 8% for UK nationals
  };
  return price * (markups[nationality] || 1.0);
}
```

### Passport/Visa Integration

- Auto-populate passport nationality from profile
- Validate visa requirements based on nationality + destination
- Display visa warnings in search results

---

## Support & Troubleshooting

### Common Issues

**1. "Nationality dropdown empty"**
- Check `/api/meta/nationalities` endpoint
- Verify database migration ran successfully
- Check browser console for fetch errors

**2. "Still getting nationality error from TBO"**
- Verify `guestNationality` in request payload
- Check nationality resolver logs
- Confirm TBO agency restriction status

**3. "User nationality not saving"**
- Check `/api/profile` endpoint
- Verify `nationality_iso` column exists in `users` table
- Check foreign key constraint

### Debug Commands

**Check nationality in search logs:**
```bash
# On Render shell
grep "nationality" /var/log/app.log
```

**Verify user's saved nationality:**
```sql
SELECT id, email, nationality_iso 
FROM public.users 
WHERE id = 'user-uuid';
```

**Test nationality resolver:**
```javascript
const { resolveGuestNationality } = require('./api/utils/nationalityResolver');
const nationality = await resolveGuestNationality(req, { id: 'user-uuid' });
console.log('Resolved:', nationality);
```

---

## Contact

**Developer:** Builder.io AI Team  
**Date:** 2025-04-15  
**Version:** 1.0.0

**Related Files:**
- `api/database/migrations/20250415_nationalities_system.sql`
- `api/routes/meta-nationalities.js`
- `api/utils/nationalityResolver.js`
- `client/services/nationalitiesService.ts`
- `client/components/HotelSearchForm.tsx`
- `api/routes/tbo-hotels.js`
