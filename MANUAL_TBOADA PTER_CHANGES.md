# Manual Changes Required for tboAdapter.js

## File: `api/services/adapters/tboAdapter.js`

The following changes need to be made manually to return session metadata with hotel results.

---

## Change 1: Empty Results Return (Line 588-591)

### Current Code:
```javascript
if (hotels.length === 0) {
  this.logger.info("ℹ️ TBO returned 0 hotels for this search");
  return [];
}
```

### New Code:
```javascript
if (hotels.length === 0) {
  this.logger.info("ℹ️ TBO returned 0 hotels for this search");
  return {
    hotels: [],
    sessionMetadata: {
      traceId: searchResult?.TraceId || null,
      tokenId: tokenId,
      destinationId: cityId,
      supplierResponseFull: searchResult,
    },
  };
}
```

---

## Change 2: Successful Results Return (Line 593-596)

### Current Code:
```javascript
this.logger.info(`✅ TBO Search SUCCESS - ${hotels.length} hotels found`);

// Transform to our format
return this.transformHotelResults(hotels, searchParams);
```

### New Code:
```javascript
this.logger.info(`✅ TBO Search SUCCESS - ${hotels.length} hotels found`, {
  traceId: searchResult?.TraceId,
});

// Transform to our format
const transformedHotels = this.transformHotelResults(hotels, searchParams);

// Return hotels with session metadata
return {
  hotels: transformedHotels,
  sessionMetadata: {
    traceId: searchResult?.TraceId || null,
    tokenId: tokenId,
    destinationId: cityId,
    supplierResponseFull: searchResult,
  },
};
```

---

## Change 3: Error Handler Return (Line 597-606)

### Current Code:
```javascript
} catch (error) {
  this.logger.error("❌ TBO Hotel Search FAILED", {
    message: error.message,
    httpStatus: error.response?.status,
    statusText: error.response?.statusText,
    responseData: error.response?.data,
    url: searchUrl,
  });
  return [];
}
```

### New Code:
```javascript
} catch (error) {
  this.logger.error("❌ TBO Hotel Search FAILED", {
    message: error.message,
    httpStatus: error.response?.status,
    statusText: error.response?.statusText,
    responseData: error.response?.data,
    url: searchUrl,
  });
  return {
    hotels: [],
    sessionMetadata: {
      traceId: null,
      tokenId: tokenId,
      destinationId: cityId,
      supplierResponseFull: null,
    },
  };
}
```

---

## Testing After Changes

After making these changes, test with:

```bash
curl -X POST https://builder-faredown-pricing.onrender.com/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Dubai",
    "countryCode": "AE",
    "checkIn": "2025-07-01",
    "checkOut": "2025-07-05",
    "rooms": "1",
    "adults": "2",
    "currency": "INR",
    "guestNationality": "IN"
  }'
```

Expected response should include:
```json
{
  "success": true,
  "source": "tbo_live",
  "hotels": [...],
  "session": {
    "sessionStartedAt": "...",
    "sessionExpiresAt": "...",
    "sessionStatus": "active",
    ...
  }
}
```
