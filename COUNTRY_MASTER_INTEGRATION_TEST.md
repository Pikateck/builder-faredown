# Country Master Integration Test Guide

This document provides a comprehensive testing checklist for the Country Master implementation in Faredown.

## 🎯 Implementation Summary

The Country Master system has been implemented with:

1. **Database**: Full SQL seed with 249 countries (`api/database/seed_countries.sql`)
2. **API**: RESTful endpoints at `/api/countries` with caching and search
3. **Frontend**: React hook `useCountries` and reusable `CountrySelect` component
4. **Integration**: Updated Profile.tsx to use dynamic country loading

## 📋 Testing Checklist

### 1. Database Setup ✅

**Prerequisites:**

- Ensure PostgreSQL database is running
- Have database admin access

**Steps:**

```bash
# Run the seed file
psql -h [your_host] -U [your_user] -d [your_db] -f api/database/seed_countries.sql

# Verify the data
psql -h [your_host] -U [your_user] -d [your_db] -c "SELECT COUNT(*) FROM public.countries;"
# Expected: 249 rows

# Check popular countries
psql -h [your_host] -U [your_user] -d [your_db] -c "SELECT code, name FROM public.countries WHERE popular = true ORDER BY name;"
# Expected: IN, AE, US, GB, SG, SA, TH
```

### 2. API Endpoints Testing ✅

**Test the Countries API:**

```bash
# Test main endpoint
curl -X GET "http://localhost:3001/api/countries" \
  -H "Accept: application/json"

# Expected Response:
# {
#   "success": true,
#   "count": 249,
#   "countries": [
#     {
#       "iso2": "IN",
#       "display_name": "India",
#       "iso3_code": "IND",
#       "continent": "Asia",
#       "currency_code": "INR",
#       "phone_prefix": "+91",
#       "flag_emoji": "🇮🇳",
#       "popular": true
#     },
#     ...
#   ]
# }

# Test popular countries
curl -X GET "http://localhost:3001/api/countries/popular" \
  -H "Accept: application/json"

# Test search
curl -X GET "http://localhost:3001/api/countries/search?q=india" \
  -H "Accept: application/json"

# Test specific country
curl -X GET "http://localhost:3001/api/countries/IN" \
  -H "Accept: application/json"
```

**Expected Status Codes:**

- ✅ 200 for successful requests
- ✅ 404 for non-existent country codes
- ✅ 400 for invalid search queries
- ✅ 500 for server errors (with graceful fallback)

### 3. Frontend Hook Testing ✅

**Test useCountries Hook:**

Create a test component to verify the hook:

```tsx
// Test component (temporary)
import { useCountries } from "@/hooks/useCountries";

function CountriesTest() {
  const { countries, loading, error, popularCountries } = useCountries();

  console.log("Countries loaded:", countries.length);
  console.log("Popular countries:", popularCountries.length);
  console.log("Loading:", loading);
  console.log("Error:", error);

  return (
    <div>
      <p>Total Countries: {countries.length}</p>
      <p>Popular Countries: {popularCountries.length}</p>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

**Expected Results:**

- ✅ Hook loads 249 countries from API
- ✅ Popular countries filter works (7 countries)
- ✅ Loading states managed properly
- ✅ Error handling with fallback data
- ✅ Caching works (no repeated API calls)

### 4. CountrySelect Component Testing ✅

**Test CountrySelect Component:**

```tsx
// Test component for CountrySelect
import { CountrySelect } from "@/components/ui/country-select";

function CountrySelectTest() {
  const [selectedCountry, setSelectedCountry] = useState("");

  return (
    <div className="p-4 space-y-4">
      {/* Basic usage */}
      <CountrySelect
        value={selectedCountry}
        onValueChange={setSelectedCountry}
        placeholder="Select country"
      />

      {/* Popular only */}
      <CountrySelect
        value={selectedCountry}
        onValueChange={setSelectedCountry}
        placeholder="Popular countries"
        popularOnly={true}
      />

      {/* With flags and search */}
      <CountrySelect
        value={selectedCountry}
        onValueChange={setSelectedCountry}
        placeholder="Search countries"
        showFlags={true}
        searchable={true}
      />

      <p>Selected: {selectedCountry}</p>
    </div>
  );
}
```

**Expected Behavior:**

- ✅ Dropdown renders with all countries
- ✅ Search functionality works
- ✅ Popular countries appear first
- ✅ Flag emojis display correctly
- ✅ Selection updates state properly
- ✅ Loading states show during API fetch
- ✅ Error states handled gracefully

### 5. Profile Page Integration Testing ✅

**Test Profile Page Country Selectors:**

1. **Navigate to Profile Page:**

   ```
   http://localhost:3000/profile (or your dev URL)
   ```

2. **Personal Details Tab:**
   - ✅ Nationality dropdown loads all countries
   - ✅ Popular countries (IN, AE, US, GB, SG, SA, TH) appear first
   - ✅ Address country dropdown works independently
   - ✅ Search functionality works in both dropdowns
   - ✅ Flag emojis display correctly
   - ✅ Selection saves properly

3. **Travelers Tab:**
   - ✅ "Add New Traveler" modal nationality dropdown works
   - ✅ All countries load dynamically (no hardcoded list)
   - ✅ Search and selection work properly

4. **Passport Management:**
   - ✅ "Add Passport" modal issuing country dropdown works
   - ✅ Countries load from API (not hardcoded)

### 6. Performance Testing ✅

**Cache Performance:**

- ✅ First API call loads countries (check Network tab)
- ✅ Subsequent component mounts use cache (no new API calls)
- ✅ Cache expires after 30 minutes
- ✅ Manual refresh works

**Search Performance:**

- ✅ Client-side search responds instantly
- ✅ Server-side search API responds < 500ms
- ✅ Search results highlight properly

### 7. Error Handling Testing ✅

**Test Error Scenarios:**

1. **API Offline:**
   - Stop API server
   - Reload profile page
   - ✅ Fallback countries load (7 popular countries)
   - ✅ User can still select from fallback list

2. **Network Issues:**
   - Throttle network in DevTools
   - ✅ Loading states show appropriately
   - ✅ Timeout handling works

3. **Invalid Data:**
   - ✅ Invalid country codes handled gracefully
   - ✅ API validation works properly

## 🚀 Deployment Verification

### Production Environment

1. **Database Migration:**

   ```bash
   # Run on production database
   psql $DATABASE_URL -f api/database/seed_countries.sql
   ```

2. **API Health Check:**

   ```bash
   curl -X GET "https://yourapp.com/api/countries/popular"
   ```

3. **Frontend Verification:**
   - Visit profile page in production
   - Test all country dropdowns
   - Verify API responses

## 📊 Success Criteria

- ✅ All 249 countries load from database
- ✅ API endpoints respond correctly
- ✅ Frontend components work smoothly
- ✅ Profile page integration complete
- ✅ Performance metrics met
- ✅ Error handling robust
- ✅ No hardcoded country lists remain

## 🐛 Troubleshooting

### Common Issues:

1. **API 500 Error:**
   - Check database connection
   - Verify countries table exists
   - Check server logs

2. **Frontend Loading Forever:**
   - Check API endpoint availability
   - Verify CORS settings
   - Check browser console for errors

3. **Countries Not Showing:**
   - Check API response format
   - Verify hook is fetching data
   - Check component props

4. **Search Not Working:**
   - Verify API search endpoint
   - Check client-side filtering
   - Test with simple queries

## 📝 Final Notes

This Country Master implementation provides:

- **Scalability**: Easy to add/modify countries via database
- **Performance**: Efficient caching and optimized queries
- **UX**: Smooth search, popular countries prioritized
- **Maintainability**: Centralized country data, reusable components
- **Reliability**: Fallback data, error handling, graceful degradation

The system is production-ready and will eliminate hardcoded country lists across the entire Faredown platform.
