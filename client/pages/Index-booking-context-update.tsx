// This file shows how to update Index.tsx to use booking context
// We'll need to add these changes to ensure search parameters flow through properly

import { useBooking } from "@/contexts/BookingContext";

// Add this to the Index component:
const { updateSearchParams } = useBooking();

// Update the search/navigation handlers to save to booking context:
const handleFlightSearch = () => {
  // Update booking context with search parameters
  updateSearchParams({
    from: fromCity,
    to: toCity,
    fromCode: fromCityCode,
    toCode: toCityCode,
    departureDate: departureDate,
    returnDate: returnDate,
    tripType: tripType,
    passengers: {
      adults: travelers.adults,
      children: travelers.children,
      infants: travelers.infants || 0,
    },
    class: flightClass,
    airline: selectedAirline,
  });

  // Navigate with URL params for backwards compatibility
  navigate(`/flight-results?${searchParams.toString()}`);
};

// Similar updates needed for hotel, sightseeing, and transfer searches
