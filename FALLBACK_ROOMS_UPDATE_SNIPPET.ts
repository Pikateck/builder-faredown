// CODE SNIPPET FOR UPDATING FALLBACK MOCK ROOMS
// File: client/pages/HotelDetails.tsx
// Lines: 1205-1269
//
// Replace the entire return statement section with this code:

// Fallback mock room types - use consistent pricing from Results page
const basePrice = (() => {
  // Use Results page pricing if available for consistency
  if (preselectRate && preselectRate.perNightPrice) {
    console.log("[FALLBACK ROOMS USING RESULTS PRICE]", {
      basePrice: preselectRate.perNightPrice,
      source: "Results page preselect",
    });
    return preselectRate.perNightPrice;
  }

  // Otherwise use hotel data price
  const hotelPrice = tempHotelData?.currentPrice || 167;
  console.log("[FALLBACK ROOMS USING HOTEL PRICE]", {
    basePrice: hotelPrice,
    source: "Hotel data or fallback",
  });
  return hotelPrice;
})();

// Create fallback rooms with diverse variations
const fallbackRooms = [
  {
    id: "standard-double",
    name: "Standard Double Room",
    type: "1 X Standard Double",
    details: "Comfortable double room with free WiFi",
    pricePerNight: basePrice,
    status: "Cheapest Room",
    statusColor: "green",
    nonRefundable: true,
    isRefundable: false,
    cancellationPolicy: "Non-refundable rate",
    breakfastIncluded: false,
    smokingAllowed: false,
    smokingPreference: "non_smoking",
    paymentType: "pay_now",
    beds: "1 Double Bed",
    roomSize: "24 sqm",
    view: "City View",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&q=80&auto=format&fit=crop",
    features: ["1 Double Bed", "City View", "Free WiFi"],
    // Mark as price consistent if using Results page data
    priceConsistent: !!(preselectRate && preselectRate.perNightPrice),
    exactResultsTotal: preselectRate?.totalPrice,
  },
  {
    id: "twin-skyline",
    name: "Standard Twin",
    type: "1 X Standard Twin",
    details: "Twin room with breakfast included",
    pricePerNight: basePrice + 100,
    status: "Upgrade for +₹100",
    statusColor: "yellow",
    nonRefundable: false,
    isRefundable: true,
    cancellationPolicy: "Free cancellation until 24 hours before check-in",
    breakfastIncluded: true,
    smokingAllowed: true,
    smokingPreference: "smoking",
    paymentType: "pay_now",
    beds: "2 Twin Beds",
    roomSize: "22 sqm",
    view: "City View",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&q=80&auto=format&fit=crop",
    features: ["2 Twin Beds", "City View", "Free WiFi", "Breakfast Included"],
  },
  {
    id: "king-skyline",
    name: "Premium Room",
    type: "1 X Premium Room",
    details: "Premium room with breakfast and ocean view",
    pricePerNight: basePrice + 179,
    status: "Upgrade for +₹179",
    statusColor: "blue",
    nonRefundable: false,
    isRefundable: true,
    cancellationPolicy: "Free cancellation until 3 days before check-in",
    breakfastIncluded: true,
    smokingAllowed: false,
    smokingPreference: "non_smoking",
    paymentType: "pay_at_hotel",
    beds: "1 King Bed",
    roomSize: "30 sqm",
    view: "Ocean View",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&q=80&auto=format&fit=crop",
    features: [
      "1 King Bed",
      "Ocean View",
      "Free WiFi",
      "Breakfast Included",
      "Premium amenities",
    ],
  },
  {
    id: "deluxe-suite",
    name: "Deluxe Double",
    type: "1 X Deluxe Double",
    details: "Deluxe double room with garden view, pay at hotel",
    pricePerNight: basePrice + 50,
    status: "Upgrade for +₹50",
    statusColor: "blue",
    nonRefundable: true,
    isRefundable: false,
    cancellationPolicy: "Non-refundable - Strict cancellation",
    breakfastIncluded: false,
    smokingAllowed: false,
    smokingPreference: "non_smoking",
    paymentType: "pay_at_hotel",
    beds: "1 Double Bed",
    roomSize: "26 sqm",
    view: "Garden View",
    image:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&q=80&auto=format&fit=crop",
    features: ["1 Double Bed", "Garden View", "Free WiFi"],
  },
];

// Apply comprehensive sorting with tie-breakers
return fallbackRooms.sort((a, b) => {
  // 1. Primary sort: price (ascending)
  const priceDiff = a.pricePerNight - b.pricePerNight;
  if (Math.abs(priceDiff) > 0.01) return priceDiff;

  // 2. Tie-breaker 1: refundable > partial > non-refundable
  const refundScore = (room: any) => {
    if (room.isRefundable && !room.nonRefundable) return 3; // Fully refundable
    if (room.isRefundable || !room.nonRefundable) return 2; // Partial
    return 1; // Non-refundable
  };
  const refundDiff = refundScore(b) - refundScore(a);
  if (refundDiff !== 0) return refundDiff;

  // 3. Tie-breaker 2: breakfast included > not included
  const breakfastDiff =
    (b.breakfastIncluded ? 1 : 0) - (a.breakfastIncluded ? 1 : 0);
  if (breakfastDiff !== 0) return breakfastDiff;

  // 4. Tie-breaker 3: pay-at-hotel > prepaid
  const paymentDiff =
    (b.paymentType === "pay_at_hotel" ? 1 : 0) -
    (a.paymentType === "pay_at_hotel" ? 1 : 0);
  if (paymentDiff !== 0) return paymentDiff;

  // 5. Final tie-breaker: maintain original order
  return 0;
});
