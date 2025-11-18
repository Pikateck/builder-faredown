# TBO Hotel Frontend Integration Guide

**Current Status:** Backend APIs ✅ Complete | Frontend 🔄 In Progress

This guide shows how to connect the frontend components to the new TBO hotel APIs.

---

## 🎯 Integration Points

### **1. Hotel Search Form Integration**

**File:** `client/components/HotelSearchForm.tsx`

**Current Flow:**

1. User fills search form (destination, dates, rooms)
2. Submit handler calls some hotel search function
3. Results displayed in HotelResults

**Required Changes:**

Add TBO search logic to the form submission:

```typescript
// In the search submit handler
const handleHotelSearch = async (formData) => {
  try {
    // Map form data to API format
    const payload = {
      destination: formData.destination,
      countryCode: formData.countryCode || "AE",
      checkIn: formatDate(formData.checkIn), // YYYY-MM-DD
      checkOut: formatDate(formData.checkOut), // YYYY-MM-DD
      rooms: formData.rooms, // [{ adults: 2, children: 0, childAges: [] }]
      currency: formData.currency || "USD",
      guestNationality: formData.guestNationality || "AE",
    };

    // Call TBO search API
    const response = await fetch("/api/tbo/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      // Store search context
      setSearchContext({
        traceId: data.traceId,
        cityId: data.cityId,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        currency: data.currency,
        noOfRooms: data.noOfRooms,
      });

      // Pass to results page
      navigate("/hotel-results", {
        state: {
          hotels: data.hotels,
          search: data,
        },
      });
    } else {
      setError(data.error);
    }
  } catch (error) {
    setError("Search failed: " + error.message);
  }
};
```

---

### **2. Hotel Results Page Integration**

**File:** `client/pages/HotelResults.tsx`

**Required Changes:**

Update the results to work with TBO data:

```typescript
// Add this to load TBO results
const loadTBOHotels = async (searchData) => {
  try {
    const response = await fetch("/api/tbo/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchData),
    });

    const data = await response.json();
    if (data.success) {
      setHotels(data.hotels);
      setSearchContext(data);
      setLoading(false);
    }
  } catch (error) {
    console.error("Error loading TBO hotels:", error);
    setLoading(false);
  }
};

// In render, show TBO hotels
const displayedHotels = hotels.filter(
  (h) => h.supplier === "TBO" || !h.supplier,
);
```

---

### **3. Hotel Details Page Integration**

**File:** `client/pages/HotelDetails.tsx`

**Required Changes:**

When user selects a hotel, get room details and prepare for booking:

```typescript
// After user selects a hotel from results
const handleSelectHotel = async (hotel) => {
  try {
    setSelectedHotel(hotel);

    // Get room details from TBO
    const response = await fetch("/api/tbo/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traceId: searchContext.traceId,
        resultIndex: hotel.resultIndex,
        hotelCode: hotel.hotelCode,
        hotelName: hotel.hotelName,
        checkInDate: searchContext.checkInDate,
        checkOutDate: searchContext.checkOutDate,
        noOfRooms: searchContext.noOfRooms,
      }),
    });

    const data = await response.json();
    if (data.success) {
      setRoomDetails(data.hotelRoomDetails);
    }
  } catch (error) {
    console.error("Error loading room details:", error);
  }
};
```

---

### **4. Hotel Booking Page Integration**

**File:** `client/pages/HotelBooking.tsx`

**This is where the BLOCK → BOOK flow happens**

#### **Step 1: Block Room**

```typescript
const handleBlockRoom = async (selectedRooms) => {
  try {
    setLoading(true);

    const blockPayload = {
      traceId: searchContext.traceId,
      resultIndex: selectedHotel.resultIndex,
      hotelCode: selectedHotel.hotelCode,
      hotelName: selectedHotel.hotelName,
      guestNationality: guestInfo.nationality || "AE",
      noOfRooms: selectedRooms.length,
      isVoucherBooking: true,
      hotelRoomDetails: selectedRooms,
    };

    const response = await fetch("/api/tbo/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockPayload),
    });

    const data = await response.json();

    if (data.success) {
      // ✅ TBO booking created in database!
      const bookingId = data.bookingId;

      // Check if price changed
      if (data.isPriceChanged) {
        // Show price change warning to user
        showPriceChangeWarning(data.hotelRoomDetails);
      }

      // Store for next step
      setBlockResponse({
        bookingId,
        hotelRoomDetails: data.hotelRoomDetails,
        isPriceChanged: data.isPriceChanged,
      });

      // Move to passenger details step
      setStep("passenger-details");
    } else {
      setError("Failed to block room: " + data.error);
    }
  } catch (error) {
    setError("Block room error: " + error.message);
  } finally {
    setLoading(false);
  }
};
```

#### **Step 2: Collect Passenger Details**

```typescript
const handlePassengerSubmit = async (passengers) => {
  try {
    setLoading(true);

    const bookPayload = {
      traceId: searchContext.traceId,
      resultIndex: selectedHotel.resultIndex,
      hotelCode: selectedHotel.hotelCode,
      hotelName: selectedHotel.hotelName,
      bookingId: blockResponse.bookingId, // From block step
      guestNationality: guestInfo.nationality || "AE",
      noOfRooms: blockResponse.hotelRoomDetails.length,
      isVoucherBooking: true,
      hotelRoomDetails: blockResponse.hotelRoomDetails,
      hotelPassenger: passengers.map((p) => ({
        Title: p.title,
        FirstName: p.firstName,
        LastName: p.lastName,
        PaxType: p.paxType || 1, // 1=Adult, 2=Child
        Age: p.age,
        PassportNo: p.passportNo,
        Email: p.email,
        Phoneno: p.phone,
        Nationality: p.nationality,
        // ... other fields
      })),
    };

    const response = await fetch("/api/tbo/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookPayload),
    });

    const data = await response.json();

    if (data.success) {
      // ✅ Booking confirmed! Database updated!
      setBookingResult({
        bookingId: data.bookingId,
        confirmationNo: data.confirmationNo,
        bookingRefNo: data.bookingRefNo,
        status: data.status,
      });

      // Move to voucher/confirmation
      setStep("confirmation");
    } else {
      setError("Booking failed: " + data.error);
    }
  } catch (error) {
    setError("Book error: " + error.message);
  } finally {
    setLoading(false);
  }
};
```

---

### **5. Booking Confirmation Page Integration**

**File:** `client/pages/BookingVoucher.tsx`

**Display booking confirmation and voucher:**

```typescript
const loadBookingDetails = async (bookingId) => {
  try {
    // Get booking details from database
    const response = await fetch(`/api/tbo/bookings/${bookingId}`);
    const data = await response.json();

    if (data.success) {
      setBooking(data.data);

      // Get rate history (price changes)
      const historyResponse = await fetch(
        `/api/tbo/bookings/${bookingId}/rate-history`
      );
      const historyData = await historyResponse.json();
      setPriceHistory(historyData.data);

      // Generate voucher if needed
      if (data.data.voucher_id) {
        const voucherResponse = await fetch(
          `/api/tbo/voucher/${data.data.voucher_id}`
        );
        const voucherData = await voucherResponse.json();
        setVoucher(voucherData.data);
      }
    }
  } catch (error) {
    console.error("Error loading booking:", error);
  }
};

// In render
<div className="booking-details">
  <h2>Booking Confirmed!</h2>
  <p>Booking ID: {booking.confirmation_id}</p>
  <p>Hotel: {booking.hotel_name}</p>
  <p>Check-in: {booking.check_in_date}</p>
  <p>Price: {booking.book_price} {booking.book_currency}</p>

  {booking.price_changed_in_block && (
    <Alert type="warning">
      Price changed by {/* calculate % */} during room blocking
    </Alert>
  )}

  {priceHistory.length > 0 && (
    <PriceHistoryTimeline history={priceHistory} />
  )}

  {voucher && <VoucherDisplay voucher={voucher} />}
</div>
```

---

## 📋 Implementation Checklist

### **Phase 1: Search Form**

- [ ] Update HotelSearchForm.tsx to call `/api/tbo/search`
- [ ] Store search context (traceId, cityId, etc.)
- [ ] Pass to HotelResults page
- [ ] Test: Search hotels and see results

### **Phase 2: Results & Details**

- [ ] Update HotelResults.tsx to display TBO results
- [ ] Add hotel selection handler
- [ ] Update HotelDetails.tsx to call `/api/tbo/room`
- [ ] Display room details
- [ ] Test: Select hotel and see rooms

### **Phase 3: Booking Flow**

- [ ] Create/Update HotelBooking.tsx
- [ ] Implement Block step → Call `/api/tbo/block`
- [ ] Show price change warnings
- [ ] Implement Passenger step → Collect details
- [ ] Implement Book step → Call `/api/tbo/book`
- [ ] Test: Complete booking flow

### **Phase 4: Confirmation**

- [ ] Update BookingVoucher.tsx
- [ ] Call `/api/tbo/bookings/:id` to get details
- [ ] Display booking confirmation
- [ ] Show price history
- [ ] Display voucher
- [ ] Test: View booking confirmation

### **Phase 5: Testing**

- [ ] Manual testing of complete flow
- [ ] Run `api/tests/tbo-cert-runner.js`
- [ ] Fix any certification test failures
- [ ] Load testing

---

## 🔗 API Reference for Frontend

### **Search Hotels**

```
POST /api/tbo/search
Body: { destination, countryCode, checkIn, checkOut, rooms, currency, guestNationality }
Returns: { traceId, hotels, ... }
```

### **Get Room Details**

```
POST /api/tbo/room
Body: { traceId, resultIndex, hotelCode, ... }
Returns: { hotelRoomDetails: [...] }
```

### **Block Room**

```
POST /api/tbo/block
Body: { traceId, resultIndex, hotelCode, hotelRoomDetails, ... }
Returns: { bookingId, isPriceChanged, hotelRoomDetails, ... }
⚡ Creates database record in tbo_hotel_bookings
```

### **Book Hotel**

```
POST /api/tbo/book
Body: { traceId, resultIndex, hotelCode, hotelRoomDetails, hotelPassenger, ... }
Returns: { bookingId, confirmationNo, bookingRefNo, ... }
⚡ Updates database record in tbo_hotel_bookings
```

### **Get Booking Details**

```
GET /api/tbo/bookings/:id
Returns: { data: { ...booking }, rateHistory: [...] }
```

### **Get Voucher**

```
GET /api/tbo/voucher/:id
Returns: { data: { ...voucher } }
```

---

## 💡 Best Practices

1. **Always Store traceId** - It's needed for block and book calls
2. **Handle Price Changes** - Show warnings when prices change
3. **Capture bookingId from Block** - Pass to Book call
4. **Error Handling** - Show user-friendly error messages
5. **Loading States** - Disable buttons during API calls
6. **Session Management** - Store search/block context in state

---

## ✅ What's Ready Now

✅ All backend APIs are implemented
✅ Database integration complete
✅ Rate tracking in place
✅ Analytics endpoints ready

**Just need to:**
🔄 Connect frontend components
🔄 Test end-to-end flow
🔄 Deploy to production
