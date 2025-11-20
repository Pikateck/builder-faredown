# TBO URL Configuration Fix

## Official TBO Credentials (Provided by Zubin)

Based on the official TBO production credentials:

### URLs by Function

| Function                                             | Official URL                                                                        | Notes                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------- |
| **Authentication**                                   | `https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc`                     | Method: `Authenticate`      |
| **Static Data** (CountryList, CityList, Hotel Codes) | `https://apiwr.tboholidays.com/HotelAPI/`                                           | Uses UserName/Password auth |
| **Hotel Search, PreBook**                            | `https://affiliate.travelboutiqueonline.com/HotelAPI/`                              | Uses TokenId auth           |
| **Hotel Book, Voucher, GetBookingDetails**           | `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/` | Uses TokenId auth           |

### Credentials

**Dynamic API (Hotel/Flight):**

- ClientId: `tboprod`
- UserId: `BOMF145`
- Password: `@Bo#4M-Api@`

**Static Data (Hotels):**

- UserName: `travelcategory`
- Password: `Tra@59334536`

**Whitelisted IPs (via Fixie):**

- `52.5.155.132`
- `52.87.82.133`

---

## Current Code vs. Official URLs

### Issue: Affiliate URL Method Name

The official credentials specify:

```
https://affiliate.travelboutiqueonline.com/HotelAPI/
```

But this is just the **base URL**. The actual endpoint could be:

1. `https://affiliate.travelboutiqueonline.com/HotelAPI/Search` (SOAP/older style)
2. `https://affiliate.travelboutiqueonline.com/HotelAPI/GetHotelResult` (JSON REST style)
3. `https://affiliate.travelboutiqueonline.com/HotelAPI/HotelService.svc/rest/GetHotelResult` (WCF service style)

### What the Code Currently Does

The adapter currently tries to construct:

```javascript
const searchUrl = this.config.hotelSearchUrl + "GetHotelResult";
// Results in: https://affiliate.travelboutiqueonline.com/HotelAPI/GetHotelResult
```

---

## Recommended Approach

Since we don't have definitive documentation on the affiliate URL structure, we should:

### Option 1: Try Multiple Endpoint Patterns (Fallback Strategy)

Update the adapter to try endpoints in this order:

1. `https://affiliate.travelboutiqueonline.com/HotelAPI/GetHotelResult` (most likely for JSON)
2. `https://affiliate.travelboutiqueonline.com/HotelAPI/Search` (alternate)
3. Fall back to confirmed working URL if both fail

### Option 2: Use Environment Variable Override

Set explicit URL in Render environment:

```
TBO_HOTEL_SEARCH_URL=https://affiliate.travelboutiqueonline.com/HotelAPI/GetHotelResult
```

This allows testing without code changes.

### Option 3: Ask TBO Support

Contact TBO support to confirm the exact endpoint for JSON `GetHotelResult` on the affiliate URL.

---

## Immediate Action

For now, let's use the **proven working endpoint** from environment variable while we sort out the affiliate URL:

**Environment: Render Dashboard**

Add this environment variable:

```
Variable Name: TBO_HOTEL_SEARCH_URL
Value: https://affiliate.travelboutiqueonline.com/HotelAPI/GetHotelResult
```

If that doesn't work, try:

```
Value: https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult
```

---

## Testing Plan

1. **Test Affiliate URL** (new official endpoint)
2. **Test Fallback URL** (previously working)
3. **Check Render Logs** for exact error messages
4. **Adjust based on TBO response**

The logs will show us exactly what TBO returns and we can adjust accordingly.
