# Hotel Cache Service - Price Snapshot Enhancement

## Purpose
Enhance `hotelCacheService.cacheSearchResults()` to populate `price_offered_per_night` and `price_published_per_night` columns in `hotel_search_cache_results` table. Currently only `search_hash`, `tbo_hotel_code`, and `result_rank` are inserted.

## Current Behavior (Limited)
```javascript
// CURRENT (line 180-186):
for (const [rank, hotelId] of hotelIds.entries()) {
  await db.query(
    `INSERT INTO public.hotel_search_cache_results
     (search_hash, tbo_hotel_code, result_rank)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [searchHash, hotelId, rank + 1],
  );
}
```

## Enhanced Behavior (With Prices)

### Option A: If hotel pricing is available in sessionMetadata

Modify the loop to pass price information:

```javascript
// ENHANCED:
for (const [rank, hotelData] of hotelIds.entries()) {
  // hotelData can be either:
  // - string (hotelId) - backward compatible
  // - object with { hotelId, basePrice, publishedPrice }
  
  const hotelId = typeof hotelData === 'string' ? hotelData : hotelData.hotelId;
  const offeredPrice = typeof hotelData === 'object' ? hotelData.basePrice : null;
  const publishedPrice = typeof hotelData === 'object' ? hotelData.publishedPrice : null;

  await db.query(
    `INSERT INTO public.hotel_search_cache_results
     (search_hash, tbo_hotel_code, result_rank, price_offered_per_night, price_published_per_night)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [searchHash, hotelId, rank + 1, offeredPrice, publishedPrice],
  );
}
```

### Option B: Extract prices from supplierResponseFull

If prices are in the `supplierResponseFull` object from TBO response:

```javascript
// Get prices from response if available
let priceMap = {};
if (sessionMetadata.supplierResponseFull && sessionMetadata.supplierResponseFull.Hotels) {
  sessionMetadata.supplierResponseFull.Hotels.forEach(h => {
    if (h.HotelCode) {
      priceMap[h.HotelCode] = {
        offered: h.Price?.OfferedPricePerNight || h.TotalPrice,
        published: h.Price?.PublishedPricePerNight || h.Price?.OfferedPricePerNight,
      };
    }
  });
}

// Now in the insert loop:
for (const [rank, hotelId] of hotelIds.entries()) {
  const prices = priceMap[hotelId] || {};
  
  await db.query(
    `INSERT INTO public.hotel_search_cache_results
     (search_hash, tbo_hotel_code, result_rank, price_offered_per_night, price_published_per_night, available_rooms)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING`,
    [
      searchHash, 
      hotelId, 
      rank + 1, 
      prices.offered || null,
      prices.published || null,
      hotels.length // or get actual room count if available
    ],
  );
}
```

## Implementation Locations

File: `api/services/hotelCacheService.js`

### Location 1: cacheSearchResults() method
- Current: lines ~179-186
- Modify the hotel insertion loop to include price fields
- Add price extraction logic before the loop (lines ~175-178)

### Location 2: Update ON CONFLICT clause
- Ensure ON CONFLICT (search_hash, tbo_hotel_code) DO UPDATE includes price columns if they should be refreshable

## Database Verification

After implementation, verify with:

```sql
SELECT 
  search_hash,
  tbo_hotel_code,
  result_rank,
  price_offered_per_night,
  price_published_per_night
FROM hotel_search_cache_results
WHERE price_offered_per_night IS NOT NULL
LIMIT 10;
```

Should show actual prices instead of all NULLs.

## Schema Already Supports This

The `hotel_search_cache_results` table schema already includes these columns (created in migration 20250205_hotel_cache_layer.sql):

```sql
CREATE TABLE public.hotel_search_cache_results (
  ...
  price_offered_per_night NUMERIC(12, 2),
  price_published_per_night NUMERIC(12, 2),
  available_rooms INTEGER,
  ...
);
```

The feature just needs the code to populate it.

## Testing

1. Run a TBO hotel search
2. Check the response for prices in hotel objects
3. Query hotel_search_cache_results to verify prices are stored
4. Use stored prices for future searches with the same search_hash (avoids re-fetching)

## Notes

- If prices aren't available in the initial response, set to NULL (optional to enhance later)
- Consider adding `available_rooms` count as well for inventory tracking
- The ON CONFLICT clause should handle price updates on re-search
