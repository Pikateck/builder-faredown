# TBO Adapter - Local City Mapping Enhancement

## Purpose
Modify `tboAdapter.js` getCityId() function to use pre-synced city mappings from the database before calling TBO's live API. This improves performance and reduces dependency on TBO's static data endpoint.

## Implementation Steps

### Step 1: Add helper method to TBOAdapter class

Add this method anywhere in the TBOAdapter class (suggest after getCityId):

```javascript
/**
 * Look up city mapping from local database (pre-synced via tbo-sync-cities.js)
 * Returns TBO DestinationId if found, null otherwise
 */
async getLocalCityMapping(destination, countryCode) {
  try {
    const normalizedDestination = destination.replace(/,.*$/, "").trim();
    const normalizedCountryCode = (countryCode || "").trim().toUpperCase();

    const result = await pool.query(
      `SELECT cm.tbo_city_id, tc.city_name, cm.match_confidence
       FROM city_mapping cm
       JOIN tbo_cities tc ON cm.tbo_city_id = tc.tbo_city_id
       WHERE LOWER(cm.hotelbeds_city_name) LIKE LOWER($1)
         AND cm.hotelbeds_country_code = $2
         AND cm.is_active = true
       ORDER BY cm.match_confidence DESC, cm.is_verified DESC
       LIMIT 1`,
      [normalizedDestination, normalizedCountryCode],
    );

    if (result.rows.length > 0) {
      const mapping = result.rows[0];
      console.info("[TBO] Local city mapping found", {
        destination: normalizedDestination,
        country: normalizedCountryCode,
        destinationId: mapping.tbo_city_id,
        mappedCity: mapping.city_name,
        confidence: mapping.match_confidence,
      });
      return mapping.tbo_city_id;
    }

    return null;
  } catch (error) {
    console.warn("[TBO] Local mapping lookup error (falling back to API):", error.message);
    return null;
  }
}
```

### Step 2: Modify getCityId() to use local mapping first

In the getCityId() function (around line 307-350), add this logic right after the normalizedCountryCode validation:

```javascript
    if (!normalizedCountryCode) {
      this.logger.error("...");
      return null;
    }

    // TRY LOCAL MAPPING FIRST (faster, no API call needed)
    console.info("[TBO] Attempting to resolve CityId from local mappings...");
    const localCityId = await this.getLocalCityMapping(normalizedDestination, normalizedCountryCode);
    if (localCityId) {
      return localCityId;
    }
    console.info("[TBO] Local mapping not found, falling back to TBO static API...");

    // REST OF GETCITYID FUNCTION CONTINUES AS IS...
    const staticUrl = this.config.hotelStaticDataUrl;
    ...
```

### Step 3: Update logging in getCityId fallback resolution

When the function logs "✅ CityId resolved" (around line 488), add a note that it came from live API:

```javascript
      console.info("[TBO] ✅ CityId resolved (via TBO StaticData API)", {
        requestedCity: requestedCityRaw,
        requestedCountry,
        destinationId: resolvedId,
        matchedCity: match.CityName,
        matchedCountry: match.CountryCode,
      });
```

## Expected Behavior After Change

1. **Fast path (local mapping found)**: Returns DestinationId from database in ~10-50ms
2. **Fallback path (no local mapping)**: Falls back to TBO API (current behavior)
3. **Logging**: Clearly indicates which path was used (local vs API)

## Testing

After applying this patch:

1. Run a hotel search for a city that was synced (e.g., Mumbai, Delhi, Dubai)
2. Check logs for: `[TBO] Local city mapping found` OR `[TBO] Attempting to resolve CityId from local mappings...`
3. Verify the correct DestinationId is used in the search

## Rollback

If you need to rollback, simply remove the `getLocalCityMapping()` method and the local lookup lines added to `getCityId()`.
