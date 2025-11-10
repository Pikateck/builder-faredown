# Hotel Results Page - API Field Mapping Documentation

## Overview
This document outlines which fields are mapped from which API responses to display the hotel results with cheapest room details.

## Data Sources

### 1. Hotel Name
- **Source**: TBO API Response - Hotel List
- **Field Path**: `hotel.name`
- **Backend**: `api/services/adapters/tboAdapter.js` - searchHotels()
- **Frontend Display**: HotelCard.tsx line 1152 (grid), line 1228 (mobile)
- **Example**: "City Center Inn Dubai Downtown"

### 2. Hotel Location / Address
- **Source**: TBO API Response - Hotel Details
- **Field Paths**: 
  - `hotel.address` (street address)
  - `hotel.city` (city name)
  - `hotel.countryCode` (ISO country code)
- **Backend**: `api/services/adapters/tboAdapter.js` - transformTBOData()
- **Frontend Display**: 
  - HotelCard.tsx line 1157 (as `location`)
  - HotelCard.tsx line 1235 (mobile view - combined as city name with pin icon)
- **Mapping**: 
  ```
  location: "${address}, ${city}, ${country}"
  address: { street, city, country, postalCode }
  ```
- **Example**: "Downtown Dubai, United Arab Emirates"

### 3. Hotel Star Rating
- **Source**: TBO API Response - Hotel Rating
- **Field Paths**:
  - `hotel.rating` (numeric 0-5 or decimal)
  - `hotel.starRating` (integer 1-5)
- **Backend**: `api/services/adapters/tboAdapter.js` - transformTBOData() line 967
- **Frontend Display**: 
  - HotelCard.tsx line 1147 (with star icon badge)
  - Rating badge showing "★ 4 (890)" format
- **Example**: 4.0 or 4 stars

### 4. Review Count
- **Source**: TBO API Response - Review/Rating Details
- **Field Path**: `hotel.reviewCount` or `hotel.reviews`
- **Backend**: `api/services/adapters/tboAdapter.js` line 968
- **Frontend Display**: HotelCard.tsx line 1147 with star rating
- **Example**: 890 reviews

### 5. Hotel Amenities
- **Source**: TBO API Response - Hotel Amenities List
- **Field Path**: `hotel.amenities` (array of strings)
- **Backend**: `api/services/adapters/tboAdapter.js` line 973
- **Frontend Display**: 
  - HotelCard.tsx lines 1163-1172 (grid)
  - HotelCard.tsx lines 1239-1248 (mobile) - shows 3-4 amenities with "+2 more" label
- **Example**: ["WiFi", "Restaurant", "Bar", "Pool", "Spa"]
- **Suppliers Providing This**:
  - ✅ TBO - provides amenity codes/descriptions
  - ✅ Hotelbeds - provides amenities array
  - ✅ Ratehawk - provides amenities

### 6. Cheapest Room Name (Available Room Type)
- **Source**: TBO API Response - Room Types within Hotel
- **Field Path**: `hotel.rooms[0].roomName` (first/cheapest room)
- **Backend**: `api/services/adapters/tboAdapter.js` 
  - Finding cheapest room logic: lines 925-934
  - Mapping to availableRoom.type: line 1004
- **Frontend Display**: 
  - HotelCard.tsx line 967 (grid) - "Economy Room", "Standard Twin Room"
  - HotelCard.tsx line 1221 (mobile) - "1 X Standard Room"
- **Example**: "Economy Room", "Standard Twin Room", "Deluxe Room"
- **Note**: This is from the cheapest priced room, ensuring consistency with what user will book

### 7. Bed Type (of Cheapest Room)
- **Source**: TBO API Response - Room Details
- **Field Path**: `hotel.rooms[0].bedType`
- **Backend**: `api/services/adapters/tboAdapter.js` line 1005
- **Frontend Display**: 
  - HotelCard.tsx line 970 (grid) - "1 Double Bed", "2 Twin Beds"
  - HotelCard.tsx line 1226 (mobile) - shown after room type
- **Example**: "1 King Bed", "2 Twin Beds", "1 Double + Sofa"
- **Note**: Sourced from the cheapest room to ensure consistency

### 8. Breakfast Included Status
- **Source**: TBO API Response - Room Board Type
- **Field Paths**:
  - `hotel.rooms[0].board` - text like "Breakfast Included", "Room Only"
  - `hotel.breakfastIncluded` - boolean derived from board type
- **Backend**: 
  - Detection: `api/services/adapters/tboAdapter.js` lines 918-922
  - Mapping: lines 998-1001
- **Frontend Display**: 
  - HotelCard.tsx lines 874-897 (grid) - green/orange badge with text
  - HotelCard.tsx lines 1238-1247 (mobile) - with fork icon
  - Shows: "✓ Breakfast included" (green) or "Breakfast not included" (gray)
- **Example**: "Breakfast included", "Breakfast not included"
- **Supplier Mapping**:
  - TBO: `room.board` field contains "Breakfast Included", "Half Board", etc.
  - Hotelbeds: `rate.boardCode` (BB=Breakfast, HB=Half Board, FB=Full Board, RO=Room Only)

### 9. Board Type / Meal Plan (Cheapest Room)
- **Source**: TBO API Response - Room Board Type
- **Field Path**: `hotel.rooms[0].board`
- **Backend**: 
  - Added to hotel object at: `api/services/adapters/tboAdapter.js` line 1002
  - Used for filter matching: `api/pages/HotelResults.tsx` line 1687-1705
- **Frontend Display**: 
  - HotelCard.tsx line 971 (grid) - displayed as `availableRoom.rateType`
  - Example: "Room Only", "Breakfast", "Half Board", "Full Board"
- **Filter Logic**: `api/pages/HotelResults.tsx` lines 1687-1705
  - Filters hotels based on selected meal plan preferences
  - Maps filter IDs (RO, BB, HB, FB, DN) to board type text

### 10. Cancellation Policy Summary
- **Source**: TBO API Response - Cancellation Rules
- **Field Paths**:
  - `hotel.rooms[0].cancellation` - array of cancellation rules with dates/charges
  - `hotel.cancellationPolicy` - text summary
  - `hotel.isRefundable` - boolean indicating if free cancellation available
- **Backend**:
  - Refundability detection: `api/services/adapters/tboAdapter.js` lines 907-916
  - Mapping: lines 1009-1011
- **Frontend Display**: 
  - HotelCard.tsx lines 973-1007 (grid) - "Free cancellation until [date]" or "Non-refundable"
  - HotelCard.tsx lines 1259-1272 (mobile) - clickable text with tooltip
  - Shows green badge for refundable, red badge for non-refundable
- **Example**: 
  - "Free cancellation until Nov 30, 2025"
  - "Non-refundable"
  - "Partially-refundable with 50% charge until Nov 30"
- **Tooltip/Modal**: Shows detailed cancellation policy table with:
  - Cancellation date
  - Cancellation charge (₹ amount or % of price)
  - Implemented in HotelCard.tsx lines 987-1007 and 1262-1266

### 11. Payment Terms
- **Source**: TBO API Response - Payment Details
- **Field Path**: `hotel.rooms[0].payType` or similar
- **Backend**: `api/services/adapters/tboAdapter.js` line 1007-1008
- **Frontend Display**: HotelCard.tsx line 975 (grid), line 1225 (mobile)
- **Mapping**: "at_hotel" → "Pay at Hotel", "prepaid" → "Prepaid"
- **Example**: "Pay at Hotel", "Prepaid"

### 12. Hotel Price (Total Stay)
- **Source**: TBO API Response - Pricing
- **Field Paths**:
  - `hotel.minTotal` - minimum/cheapest price for stay
  - `hotel.maxTotal` - maximum price if variations exist
  - `hotel.rooms[0].price.total` - specific room price
- **Backend**: 
  - Calculation: `api/services/adapters/tboAdapter.js` line 969 (currentPrice)
  - Per-night calculation: lines 1156-1161
- **Frontend Display**: 
  - HotelCard.tsx line 1186 (grid) - Total price with per-night breakdown
  - HotelCard.tsx lines 1283-1288 (mobile) - formatted with currency symbol
- **Example**: "₹25 total" or "₹25 per room/night (incl. taxes)"
- **Currency**: From `hotel.currency` or `selectedCurrency.code`

### 13. Hotel Images/Photos
- **Source**: TBO API Response - Hotel Images
- **Field Path**: `hotel.images` - array of image URLs or image objects
- **Backend**: 
  - Processing: `api/services/adapters/tboAdapter.js` lines 1152-1160
  - Fallback to Unsplash placeholder if missing
- **Frontend Display**: HotelCard.tsx lines 1137-1145 (grid), lines 1112-1125 (mobile)
- **Fallback**: If no images available, uses Unsplash hotel placeholder image
- **Example**: Hotel photo showing rooms, lobby, pool, etc.

## Filter Logic Implementation

### Price Range Filter
- **Field Source**: `hotel.minTotal` and `hotel.maxTotal` (total stay price)
- **Filter Application**: `api/pages/HotelResults.tsx` lines 1555-1562
- **Logic**: Shows hotels within selected budget range
- **Example**: Filter "₹20,000 - ₹50,000" shows only hotels with minTotal in that range

### Star Rating Filter
- **Field Source**: `hotel.rating` or `hotel.starRating`
- **Filter Application**: `api/pages/HotelResults.tsx` lines 1623-1631
- **Logic**: Filters to show 3★, 4★, 5★ hotels based on selection
- **Example**: Selecting "4 stars" shows only hotels with rating >= 4.0

### Meal Plan Filter
- **Field Source**: `hotel.boardType` (from cheapest room's board type)
- **Filter Application**: `api/pages/HotelResults.tsx` lines 1687-1705
- **Logic**: 
  - RO: "Room Only" - no meals included
  - BB: "Breakfast" - breakfast included
  - HB: "Half Board" - breakfast + one meal
  - FB: "Full Board" - all meals included
  - DN: "Dinner Only" - dinner included
- **Example**: Selecting "Breakfast Included" shows only hotels where cheapest room has breakfast

### Cancellation Policy Filter
- **Field Source**: `hotel.isRefundable` and `hotel.freeCancellation`
- **Filter Application**: `api/pages/HotelResults.tsx` lines 1668-1686
- **Logic**:
  - FC: "Free Cancellation" - hotel.freeCancellation === true
  - PR: "Partially Refundable" - hotel.isRefundable === true && !freeCancellation
  - NR: "Non-Refundable" - hotel.isRefundable === false
- **Example**: Selecting "Free Cancellation" shows only hotels with free cancellation

### Amenities Filter
- **Field Source**: `hotel.amenities` - array of amenity strings
- **Filter Application**: `api/pages/HotelResults.tsx` lines 1543-1553
- **Logic**: Shows hotels that have ALL selected amenities
- **Example**: Selecting "Pool" and "WiFi" shows only hotels with both amenities

### Property Type Filter
- **Field Source**: `hotel.propertyType` - type of accommodation
- **Filter Application**: `api/pages/HotelResults.tsx` lines 1707-1713
- **Logic**: Filters by hotel type (Hotel, Apartment, Villa, Guesthouse, etc.)
- **Example**: Selecting "Hotel" shows only traditional hotels
- **Limitation**: TBO may not always provide property type; uses "HOTEL" as default

### Brand Filter
- **Field Source**: `hotel.brand` or `hotel.hotelBrand` - hotel brand/chain name
- **Filter Application**: `api/pages/HotelResults.tsx` lines 1715-1730
- **Logic**: Filters to show hotels from selected brands/chains
- **Example**: Selecting "Marriott" shows only Marriott properties
- **Limitation**: TBO data may have limited brand information

### Guest Rating Filter
- **Field Source**: `hotel.rating` - numeric rating from guest reviews
- **Filter Application**: `api/pages/HotelResults.tsx` lines 1732-1742
- **Logic**:
  - EXCELLENT: rating >= 8.0
  - VERY_GOOD: 7.0 <= rating < 8.0
  - GOOD: 6.0 <= rating < 7.0
- **Example**: Selecting "Excellent" shows only highly rated hotels (8+)

### Neighborhood/Location Filter
- **Field Source**: `hotel.location`, `hotel.address.city`, or address string
- **Filter Application**: `api/pages/HotelResults.tsx` lines 1744-1763
- **Logic**: Matches location keywords in hotel address/location
- **Mapping Examples**:
  - "dubai-coastline" matches: beaches, marina, waterfront
  - "near-dubai-mall" matches: downtown, business district
  - "beachfront-jbr" matches: JBR, beach areas
- **Example**: Selecting "Beachfront" shows only coastal hotels
- **Limitation**: Keyword-based matching; accuracy depends on TBO location data

## Supplier-Specific Notes

### TBO (Travel Boutique Online)
- ✅ Provides all required fields for room details
- ✅ Board/meal plan information in `room.board`
- ✅ Cancellation policy details in `room.cancellation` array
- ✅ Amenities provided as array
- ✅ Star rating and reviews available
- ⚠️ Property type and brand information may be limited
- ⚠️ Some hotel codes might not return full image URLs

### Hotelbeds
- ✅ Provides comprehensive room details
- ✅ Uses `rate.boardCode` for meal plans (BB, HB, FB, RO)
- ✅ Detailed cancellation information available
- ✅ Images provided with CDN URLs
- ⚠️ May require additional API calls for full amenities
- ⚠️ Some fields might use different naming conventions

### Ratehawk
- ✅ Provides room details
- ✅ Includes amenities and facilities
- ✅ Pricing information available
- ⚠️ Cancellation policy format differs from TBO
- ⚠️ May have delayed data for some properties

## Data Consistency Notes

1. **Cheapest Room Guarantee**: All room details (name, bed type, breakfast, cancellation) come from the same cheapest room object to ensure consistency
2. **Price Consistency**: Total price, per-night price, and currency all refer to the selected cheapest room
3. **Breakfast State**: If cheapest room has breakfast, it's shown; if not, "Breakfast not included" is shown
4. **Refundability**: Based on cheapest room's cancellation rules
5. **Filter Matching**: All filters match against the cheapest room's attributes to ensure what user sees in results matches what they'll book

## API Response Limitations & Fallbacks

| Field | TBO | Hotelbeds | Ratehawk | Fallback |
|-------|-----|-----------|----------|----------|
| Hotel Name | ✅ | ✅ | ✅ | "Hotel {destination}" |
| Address | ✅ | ✅ | ✅ | "{city}, {country}" |
| Star Rating | ✅ | ✅ | ✅ | 4.0 (default) |
| Room Name | ✅ | ✅ | ✅ | "Standard Room" |
| Bed Type | ✅ | ✅ | ✅ | "1 Double Bed" |
| Breakfast | ✅ | ✅ | ✅ | "Not included" |
| Cancellation | ✅ | ✅ | ✅ | "Non-refundable" |
| Amenities | ✅ | ✅ | ✅ | Empty array |
| Images | ✅ | ✅ | ✅ | Unsplash placeholder |
| Price | ✅ | ✅ | ✅ | 0 (with error log) |

## Implementation Files

- **Backend API Mapping**: `api/services/adapters/tboAdapter.js` (searchHotels, transformTBOData)
- **Backend Routes**: `api/routes/hotels-metadata.js` (GET /api/hotels)
- **Frontend Data Transform**: `client/pages/HotelResults.tsx` (transformTBOData)
- **Frontend Display**: 
  - `client/components/HotelCard.tsx` (grid/mobile/desktop views)
  - `client/pages/HotelDetails.tsx` (details page)
- **Filter Logic**: `client/pages/HotelResults.tsx` (filteredAndSortedHotels)
- **Filter UI**: `client/components/ComprehensiveFilters.tsx` (filter definitions)
