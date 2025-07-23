# 🏨 Hotelbeds API - Working Destinations Guide

## 🎯 **Best Destinations for Testing**

Based on Hotelbeds API availability, these destinations typically have the most hotel inventory:

### 🇪🇸 **Spain (Best Results)**

- **Madrid** - Capital city, excellent availability
- **Barcelona** - Major tourist destination
- **Palma** (Mallorca) - Popular island destination
- **Valencia** - Coastal city with good inventory
- **Seville** - Historic city

### 🇮🇹 **Italy**

- **Rome** - Capital, extensive hotel options
- **Milan** - Business hub
- **Florence** - Tourist hotspot
- **Venice** - Unique destination

### 🇫🇷 **France**

- **Paris** - Major global destination
- **Nice** - French Riviera
- **Lyon** - Secondary city

### 🇬🇧 **United Kingdom**

- **London** - Major inventory
- **Edinburgh** - Good availability

### 🇳🇱 **Netherlands**

- **Amsterdam** - Consistent results

### 🇦🇹 **Austria**

- **Vienna** - Central European hub

### 🇵🇹 **Portugal**

- **Lisbon** - Growing inventory

---

## 🔧 **How to Test Live Data**

### Method 1: Admin Testing Dashboard

1. Go to `/admin/testing`
2. Use the "Live Hotelbeds API Data" section
3. Select a destination from the dropdown
4. Click "Search Live Data"

### Method 2: Direct API Calls

```bash
# Test destinations
GET /api/hotels-live/destinations/search?q=Madrid

# Test hotel search
GET /api/hotels-live/search?destination=Madrid&checkIn=2025-02-01&checkOut=2025-02-03&rooms=1&adults=2&children=0
```

---

## 📊 **Expected Results**

### Working Destinations Should Return:

- ✅ **Destination Code** (e.g., MAD for Madrid)
- ✅ **Hotel List** (10-100+ hotels)
- ✅ **Live Pricing** in EUR/USD/INR
- ✅ **Hotel Details** (name, rating, address)
- ✅ **Real Images** and amenities

### Example Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "123456",
      "name": "Hotel Real Madrid",
      "currentPrice": 4500,
      "currency": "INR",
      "rating": 4,
      "isLiveData": true,
      "supplier": "hotelbeds"
    }
  ],
  "totalResults": 45,
  "source": "Hotelbeds API"
}
```

---

## ⚠️ **Troubleshooting**

### No Results for a Destination?

1. **Try Spanish cities first** (Madrid, Barcelona, Palma)
2. **Check date range** (avoid past dates, weekends, holidays)
3. **Use flexible dates** (7+ days in future)
4. **Try different destination formats**:
   - "Madrid" ✅
   - "Madrid, Spain" ✅
   - "MAD" (airport code) ⚠️

### API Errors?

1. **Check Hotelbeds credentials** in `.env`
2. **Verify API limits** (test account restrictions)
3. **Check dates format** (YYYY-MM-DD)

---

## 🎯 **Recommended Test Flow**

1. **Start with Madrid** (most reliable)
2. **Use dates 7-14 days in future**
3. **Standard search**: 1 room, 2 adults, 0 children
4. **Verify live data flag**: `isLiveData: true`
5. **Check pricing currency**: Should show INR conversion

---

## 🔴 **Current Live API Endpoints**

- **Live Destinations**: `/api/hotels-live/destinations/search`
- **Live Hotels**: `/api/hotels-live/search`
- **Regular (Fallback)**: `/api/hotels/search` (production mode)

**The live endpoints bypass production fallback mode to show real Hotelbeds data.**
