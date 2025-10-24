# TBO Live Hotels - Complete JSON Data Structure

## 🔄 Data Flow

```
Frontend (HotelResults.tsx)
    ↓
GET /api/hotels?cityId=DXB&checkIn=2025-10-31&checkOut=2025-11-03&adults=2&children=0&countryCode=AE
    ↓
Backend (api/routes/hotels-metadata.js)
    ↓
TBO Adapter (api/services/adapters/tboAdapter.js)
    ↓
TBO Live API
    ↓
Response JSON (below)
```

---

## 📋 API Response JSON Structure

### GET /api/hotels
**Endpoint:** `https://builder-faredown-pricing.onrender.com/api/hotels`

**Response (TBO Live Only):**

```json
{
  "success": true,
  "hotels": [
    {
      "id": "DXBHOTEL001",
      "name": "Luxury Hotel Dubai",
      "stars": 5,
      "image": "https://images.tbo.com/hotel1.jpg",
      "currentPrice": 15000,
      "originalPrice": 17500,
      "currency": "INR",
      "supplier": "TBO",
      "isLiveData": true,
      "rates": [
        {
          "rateKey": "rate_001",
          "roomType": "Deluxe Room",
          "roomDescription": "A spacious double room with city view",
          "board": "Room Only",
          "originalPrice": 15000,
          "price": 15000,
          "markedUpPrice": 15000,
          "currency": "INR",
          "tax": 2500,
          "cancellationPolicy": [
            {
              "FromDate": "2025-10-25",
              "ToDate": "2025-10-29",
              "Charge": 0,
              "ChargeType": "Percentage",
              "BaseCurrency": "INR",
              "CancellationPolicy": "Free cancellation"
            },
            {
              "FromDate": "2025-10-29",
              "ToDate": "2025-10-31",
              "Charge": 50,
              "ChargeType": "Percentage",
              "BaseCurrency": "INR",
              "CancellationPolicy": "50% cancellation charge"
            }
          ],
          "isRefundable": true,
          "inclusions": ["WiFi", "Breakfast", "Gym"]
        },
        {
          "rateKey": "rate_002",
          "roomType": "Suite",
          "roomDescription": "Premium suite with separate living area",
          "board": "Bed & Breakfast",
          "originalPrice": 22000,
          "price": 22000,
          "markedUpPrice": 22000,
          "currency": "INR",
          "tax": 3500,
          "cancellationPolicy": [],
          "isRefundable": false,
          "inclusions": ["WiFi", "Breakfast", "Gym", "Concierge"]
        }
      ],
      "amenities": ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Bar"]
    },
    {
      "id": "DXBHOTEL002",
      "name": "Budget Hotel Dubai",
      "stars": 3,
      "image": "https://images.tbo.com/hotel2.jpg",
      "currentPrice": 5000,
      "originalPrice": 6000,
      "currency": "INR",
      "supplier": "TBO",
      "isLiveData": true,
      "rates": [
        {
          "rateKey": "rate_003",
          "roomType": "Standard Room",
          "roomDescription": "Basic room with essential amenities",
          "board": "Room Only",
          "originalPrice": 5000,
          "price": 5000,
          "markedUpPrice": 5000,
          "currency": "INR",
          "tax": 850,
          "cancellationPolicy": [
            {
              "FromDate": "2025-10-25",
              "ToDate": "2025-10-31",
              "Charge": 100,
              "ChargeType": "Percentage",
              "BaseCurrency": "INR",
              "CancellationPolicy": "Non-refundable"
            }
          ],
          "isRefundable": false,
          "inclusions": []
        }
      ],
      "amenities": ["WiFi", "AC", "TV"]
    }
  ],
  "totalResults": 2,
  "source": "tbo_live",
  "pricing_status": "ready"
}
```

---

## 📊 Individual Hotel Object Structure

Each hotel in the `hotels` array has this structure:

```typescript
{
  // Hotel Identification
  id: string;                    // Hotel code from TBO (e.g., "DXBHOTEL001")
  name: string;                  // Hotel name (e.g., "Luxury Hotel Dubai")
  stars: number;                 // Star rating (0-5)
  
  // Images & Media
  image: string | null;          // Primary image URL
  
  // Pricing
  currentPrice: number;          // Minimum price from all rates (in base currency)
  originalPrice: number;         // Maximum price from all rates
  currency: string;              // Currency code (default: "INR")
  
  // Metadata
  supplier: "TBO";               // Always "TBO" for these results
  isLiveData: true;              // Always true (live pricing from TBO)
  
  // Room & Rate Details
  rates: Rate[];                 // Array of room types with pricing
  
  // Amenities
  amenities: string[];           // List of hotel amenities (WiFi, Pool, etc.)
}
```

---

## 🛏️ Rate Object Structure (Room Types with Pricing)

```typescript
{
  // Rate Identification
  rateKey: string;               // Unique identifier for this rate
  
  // Room Details
  roomType: string;              // Room type name (e.g., "Deluxe Room", "Suite")
  roomDescription: string;       // Description of the room
  board: string;                 // Meal plan (e.g., "Room Only", "Bed & Breakfast")
  
  // Pricing
  originalPrice: number;         // Published/base price
  price: number;                 // Offered/current price
  markedUpPrice: number;         // Price with markup (same as price in this case)
  currency: string;              // Currency code
  tax: number;                   // Tax amount
  
  // Cancellation Policy
  cancellationPolicy: CancellationPolicy[];  // Array of cancellation rules
  isRefundable: boolean;         // Whether any refundable rate exists
  
  // Inclusions
  inclusions: string[];          // What's included (WiFi, Breakfast, etc.)
}
```

---

## 📋 Cancellation Policy Object

```typescript
{
  FromDate: string;              // Start date of policy (yyyy-mm-dd)
  ToDate: string;                // End date of policy
  Charge: number;                // Cancellation charge (value)
  ChargeType: string;            // "Percentage" or "Amount"
  BaseCurrency: string;          // Currency of charge
  CancellationPolicy: string;    // Human-readable policy description
}
```

---

## 🔗 Query Parameters for /api/hotels

| Parameter | Required | Type | Example | Notes |
|-----------|----------|------|---------|-------|
| `cityId` | ✅ Yes | string | `DXB` | TBO destination code |
| `countryCode` | ✅ Yes | string | `AE` | ISO country code (required for city resolution) |
| `checkIn` | ✅ Yes | string | `2025-10-31` | Format: yyyy-mm-dd |
| `checkOut` | ✅ Yes | string | `2025-11-03` | Format: yyyy-mm-dd |
| `adults` | ✅ Yes | number | `2` | Number of adults |
| `children` | ✅ Yes | number | `0` | Number of children |

---

## 🔍 How Data is Used in Frontend

### HotelResults.tsx - Rendering Hotels

```typescript
// Line 155-189: Transform TBO data to display format
hotels.map((h) => {
  return {
    id: h.hotelId,
    name: h.name,
    stars: h.starRating,
    image: h.images?.[0],
    currentPrice: minPrice,         // Minimum price from rates
    originalPrice: maxPrice,        // Maximum price from rates
    currency: h.currency,
    supplier: "TBO",
    isLiveData: true,
    rates: h.rates,                 // All room types with pricing
    amenities: h.amenities,         // Hotel amenities
  };
});
```

### HotelCard.tsx - Display

```typescript
// Display in HotelCard component
<HotelCard
  hotel={{
    id: "DXBHOTEL001",
    name: "Luxury Hotel Dubai",
    stars: 5,
    image: "https://...",
    currentPrice: 15000,
    originalPrice: 17500,
    currency: "INR",
    supplier: "TBO",
    isLiveData: true,
    rates: [...],
    amenities: ["WiFi", "Pool", "Gym"],
  }}
/>
```

---

## 🎯 Key Fields for Design Display

### Hotel Card (Main Display)
- **Hotel Name:** `name` (e.g., "Luxury Hotel Dubai")
- **Star Rating:** `stars` (0-5)
- **Price:** `currentPrice` (e.g., "₹15,000")
- **Image:** `image` URL
- **Amenities:** `amenities` array (top 3-5)
- **Supplier Badge:** "TBO" (always for these results)

### Room Selection / Details
- **Room Types:** `rates[].roomType` (e.g., ["Deluxe Room", "Suite"])
- **Room Price:** `rates[].price` (e.g., 15000)
- **Meal Plan:** `rates[].board` (e.g., "Room Only", "Bed & Breakfast")
- **Cancellation:** `rates[].cancellationPolicy` (display free/paid cancellation)
- **Room Description:** `rates[].roomDescription`

### Pricing Breakdown
- **Nightly Price:** `rates[].price`
- **Tax:** `rates[].tax`
- **Total for Stay:** (price + tax) × number of nights
- **Currency:** `currency` (e.g., "INR")

---

## 🧪 Example Complete Response

```json
{
  "success": true,
  "hotels": [
    {
      "id": "DXBHOTEL001",
      "name": "Burj Khalifa View Hotel",
      "stars": 5,
      "image": "https://images.tbo.com/burj_khalifa.jpg",
      "currentPrice": 18000,
      "originalPrice": 22000,
      "currency": "INR",
      "supplier": "TBO",
      "isLiveData": true,
      "rates": [
        {
          "rateKey": "DXB_BURJ_DELUXE",
          "roomType": "Deluxe Room",
          "roomDescription": "Room with Burj Khalifa view",
          "board": "Room Only",
          "originalPrice": 18000,
          "price": 18000,
          "markedUpPrice": 18000,
          "currency": "INR",
          "tax": 3000,
          "cancellationPolicy": [
            {
              "FromDate": "2025-10-25",
              "ToDate": "2025-10-30",
              "Charge": 0,
              "ChargeType": "Percentage",
              "BaseCurrency": "INR",
              "CancellationPolicy": "Free cancellation until 2025-10-30"
            }
          ],
          "isRefundable": true,
          "inclusions": ["WiFi", "Breakfast", "Gym"]
        }
      ],
      "amenities": ["WiFi", "Pool", "Gym", "Restaurant", "Concierge"]
    }
  ],
  "totalResults": 1,
  "source": "tbo_live",
  "pricing_status": "ready"
}
```

---

## ⚠️ Error Response

If TBO search fails:

```json
{
  "success": false,
  "error": "Failed to fetch hotels",
  "message": "Unable to resolve city code DXB for country AE",
  "hotels": [],
  "source": "error",
  "statusCode": 500
}
```

---

## 🔧 Backend Processing (api/routes/hotels-metadata.js)

1. **Extract parameters** from query string (cityId, checkIn, checkOut, adults, children, countryCode)
2. **Get TBO adapter** from supplierAdapterManager
3. **Call adapter.searchHotels()** with search parameters
4. **Transform results** - map TBO response to Hotel format
5. **Return JSON** with hotels array

---

## 📍 Live Data Characteristics

**For TBO Hotels:**
- ✅ `supplier`: Always "TBO"
- ✅ `isLiveData`: Always `true`
- ✅ `source`: Always "tbo_live"
- ✅ Pricing: Real-time from TBO API
- ✅ Availability: Current availability from TBO
- ✅ Rates: Multiple room types with individual pricing

---

**This is the ONLY data structure your design should work with - TBO live hotels only!**
