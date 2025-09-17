import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

// Standardized search object structure that matches the user's requirements for all modules
export interface StandardizedSearchParams {
  // Common for all modules
  module: "flights" | "hotels" | "sightseeing" | "transfers";
  currency: string;
  searchId?: string;
  searchTimestamp?: string;

  // Flight-specific fields
  tripType?: "one-way" | "roundtrip" | "multi-city";
  from?: string;
  to?: string;
  fromCode?: string;
  toCode?: string;
  departDate?: string; // For flights: departure date
  returnDate?: string; // For flights: return date
  cabin?: "Economy" | "Premium Economy" | "Business" | "First";

  // Hotel-specific fields
  destination?: string;
  destinationCode?: string;
  destinationName?: string;
  checkIn?: string; // For hotels: check-in date (should match user's exact format: "2025-10-01")
  checkOut?: string; // For hotels: check-out date (should match user's exact format: "2025-10-10")
  rooms?: number;
  nights?: number;

  // Common passenger/guest fields
  pax?: {
    adults: number;
    children: number;
    infants: number;
  };
  guests?: {
    adults: number;
    children: number;
  };

  // Transfer-specific fields
  transferType?: "airport-hotel" | "hotel-airport" | "city-transfer";
  pickupLocation?: string;
  dropoffLocation?: string;

  // Sightseeing-specific fields
  category?: string;
  duration?: string;
}

export interface SelectedFlight {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft: string;
  stops: number;
  departureCode: string;
  arrivalCode: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  arrivalDate: string;
  returnFlightNumber?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  returnDuration?: string;
  returnDepartureDate?: string;
  returnArrivalDate?: string;
}

export interface SelectedFare {
  id: string;
  name: string;
  type: "economy" | "premium-economy" | "business" | "first";
  price: number;
  originalPrice?: number;
  isRefundable: boolean;
  isBargained: boolean;
  includedBaggage: string;
  includedMeals: boolean;
  seatSelection: boolean;
  changes: {
    allowed: boolean;
    fee?: number;
  };
  cancellation: {
    allowed: boolean;
    fee?: number;
  };
}

export interface Traveller {
  id: number;
  type: "Adult" | "Child" | "Infant";
  title: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  age?: number;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  panCardNumber?: string;
  nationality: string;
  address?: string;
  pincode?: string;
  mealPreference: string;
}

export interface ContactDetails {
  email: string;
  phone: string;
  countryCode: string;
  alternatePhone?: string;
}

export interface BookingExtras {
  meals: Array<{
    id: string;
    name: string;
    price: number;
    travellerId: number;
    flight: string;
  }>;
  baggage: Array<{
    type: string;
    weight: string;
    price: number;
    flight: string;
    quantity: number;
  }>;
  seats: Array<{
    travellerId: number;
    seatId: string;
    price: number;
    flight: string;
  }>;
  insurance: {
    refundProtection: boolean;
    refundProtectionCost: number;
    baggageProtection: "none" | "bronze" | "gold";
    baggageProtectionCost: number;
  };
  otherServices: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export interface PriceBreakdown {
  baseFare: number;
  taxes: number;
  fees: number;
  extras: number;
  seats: number;
  insurance: number;
  total: number;
  savings: number;
}

export interface EnhancedBookingState {
  // This is the exact search object structure the user specified
  searchParams: StandardizedSearchParams;
  selectedFlight: SelectedFlight | null;
  selectedFare: SelectedFare | null;
  travellers: Traveller[];
  contactDetails: ContactDetails;
  extras: BookingExtras;
  priceBreakdown: PriceBreakdown;
  currentStep: number;
  isComplete: boolean;
  bookingId?: string;
  paymentStatus?: "pending" | "processing" | "completed" | "failed";
}

interface EnhancedBookingContextType {
  booking: EnhancedBookingState;
  updateSearchParams: (params: Partial<StandardizedSearchParams>) => void;
  setSelectedFlight: (flight: SelectedFlight) => void;
  setSelectedFare: (fare: SelectedFare) => void;
  updateTravellers: (travellers: Traveller[]) => void;
  updateContactDetails: (contact: ContactDetails) => void;
  updateExtras: (extras: Partial<BookingExtras>) => void;
  updatePriceBreakdown: (prices: Partial<PriceBreakdown>) => void;
  setCurrentStep: (step: number) => void;
  completeBooking: (bookingId: string) => void;
  resetBooking: () => void;
  loadFromUrlParams: (searchParams: URLSearchParams) => void;
  generateBookingData: () => any;
  // New method to load complete search object
  loadCompleteSearchObject: (searchObj: Partial<StandardizedSearchParams>) => void;
}

const EnhancedBookingContext = createContext<EnhancedBookingContextType | undefined>(undefined);

const initialBookingState: EnhancedBookingState = {
  searchParams: {
    tripType: "roundtrip",
    from: "",
    to: "",
    fromCode: "",
    toCode: "",
    departDate: "",
    returnDate: "",
    cabin: "Economy",
    pax: {
      adults: 1,
      children: 0,
      infants: 0,
    },
    currency: "INR",
    searchTimestamp: new Date().toISOString(),
  },
  selectedFlight: null,
  selectedFare: null,
  travellers: [],
  contactDetails: {
    email: "",
    phone: "",
    countryCode: "+91",
  },
  extras: {
    meals: [],
    baggage: [],
    seats: [],
    insurance: {
      refundProtection: false,
      refundProtectionCost: 0,
      baggageProtection: "none",
      baggageProtectionCost: 0,
    },
    otherServices: [],
  },
  priceBreakdown: {
    baseFare: 0,
    taxes: 0,
    fees: 0,
    extras: 0,
    seats: 0,
    insurance: 0,
    total: 0,
    savings: 0,
  },
  currentStep: 1,
  isComplete: false,
};

export function EnhancedBookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<EnhancedBookingState>(() => {
    // Try to restore from localStorage
    try {
      const saved = localStorage.getItem("enhanced_booking_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure the structure matches the current state
        return {
          ...initialBookingState,
          ...parsed,
          searchParams: {
            ...initialBookingState.searchParams,
            ...(parsed.searchParams || {}),
          },
        };
      }
    } catch (error) {
      console.warn("Failed to restore enhanced booking state:", error);
    }
    return initialBookingState;
  });

  const location = useLocation();
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();

  // Save to localStorage whenever booking state changes
  useEffect(() => {
    try {
      localStorage.setItem("enhanced_booking_state", JSON.stringify(booking));
    } catch (error) {
      console.warn("Failed to save enhanced booking state:", error);
    }
  }, [booking]);

  // Memoize functions to prevent infinite re-renders
  const updateSearchParams = useCallback((params: Partial<StandardizedSearchParams>) => {
    setBooking((prev) => ({
      ...prev,
      searchParams: { ...prev.searchParams, ...params },
    }));
  }, []);

  const loadCompleteSearchObject = useCallback((searchObj: Partial<StandardizedSearchParams>) => {
    setBooking((prev) => ({
      ...prev,
      searchParams: { ...prev.searchParams, ...searchObj },
    }));
  }, []);

  // Load from URL parameters with standardized structure
  const loadFromUrlParams = useCallback((urlParams: URLSearchParams) => {
    const newSearchParams: Partial<StandardizedSearchParams> = {};

    // Extract search parameters using both naming conventions
    if (urlParams.get("from")) newSearchParams.from = urlParams.get("from")!;
    if (urlParams.get("to")) newSearchParams.to = urlParams.get("to")!;
    if (urlParams.get("fromCode")) newSearchParams.fromCode = urlParams.get("fromCode")!;
    if (urlParams.get("toCode")) newSearchParams.toCode = urlParams.get("toCode")!;

    // Handle dates - support both departDate and departureDate for compatibility
    if (urlParams.get("departDate")) newSearchParams.departDate = urlParams.get("departDate")!;
    if (urlParams.get("departureDate")) newSearchParams.departDate = urlParams.get("departureDate")!;
    if (urlParams.get("returnDate")) newSearchParams.returnDate = urlParams.get("returnDate")!;

    // Trip type
    if (urlParams.get("tripType")) {
      const tripType = urlParams.get("tripType")!;
      newSearchParams.tripType = tripType === "round-trip" ? "roundtrip" : tripType as any;
    }

    // Cabin class
    if (urlParams.get("class")) {
      const classValue = urlParams.get("class")!;
      newSearchParams.cabin = (classValue.charAt(0).toUpperCase() + classValue.slice(1)) as any;
    }
    if (urlParams.get("cabin")) newSearchParams.cabin = urlParams.get("cabin") as any;

    // Currency
    if (urlParams.get("currency")) newSearchParams.currency = urlParams.get("currency")!;

    // Passengers
    const adults = parseInt(urlParams.get("adults") || "1");
    const children = parseInt(urlParams.get("children") || "0");
    const infants = parseInt(urlParams.get("infants") || "0");

    newSearchParams.pax = { adults, children, infants };

    // Update booking state
    updateSearchParams(newSearchParams);
  }, [updateSearchParams]);

  const setSelectedFlight = useCallback((flight: SelectedFlight) => {
    setBooking((prev) => ({ ...prev, selectedFlight: flight }));
  }, []);

  const setSelectedFare = useCallback((fare: SelectedFare) => {
    setBooking((prev) => ({ ...prev, selectedFare: fare }));
    // Recalculate price breakdown when fare changes
    setTimeout(() => updatePriceBreakdown({}), 0);
  }, []);

  const updateTravellers = useCallback((travellers: Traveller[]) => {
    setBooking((prev) => ({ ...prev, travellers }));
  }, []);

  const updateContactDetails = useCallback((contact: ContactDetails) => {
    setBooking((prev) => ({ ...prev, contactDetails: contact }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setBooking((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const completeBooking = useCallback((bookingId: string) => {
    setBooking((prev) => ({
      ...prev,
      isComplete: true,
      bookingId,
      paymentStatus: "completed",
    }));
  }, []);

  const resetBooking = useCallback(() => {
    setBooking(initialBookingState);
    localStorage.removeItem("enhanced_booking_state");
  }, []);

  // Load from location state (from flight results selection)
  useEffect(() => {
    if (location.state) {
      const { selectedFlight, selectedFareType, negotiatedPrice, searchParams: stateSearchParams } = location.state;

      // First, load search parameters if provided
      if (stateSearchParams) {
        loadCompleteSearchObject(stateSearchParams);
      }

      if (selectedFlight) {
        setBooking((prev) => ({
          ...prev,
          selectedFlight: {
            id: selectedFlight.id?.toString() || `flight_${Date.now()}`,
            airline: selectedFlight.airline,
            flightNumber: selectedFlight.flightNumber,
            departureTime: selectedFlight.departureTime,
            arrivalTime: selectedFlight.arrivalTime,
            duration: selectedFlight.duration,
            aircraft: selectedFlight.aircraft || "Aircraft",
            stops: selectedFlight.stops || 0,
            departureCode: selectedFlight.departureCode || prev.searchParams.fromCode,
            arrivalCode: selectedFlight.arrivalCode || prev.searchParams.toCode,
            departureCity: selectedFlight.departureCity || prev.searchParams.from,
            arrivalCity: selectedFlight.arrivalCity || prev.searchParams.to,
            departureDate: selectedFlight.departureDate || prev.searchParams.departDate,
            arrivalDate: selectedFlight.arrivalDate || prev.searchParams.departDate,
            returnFlightNumber: selectedFlight.returnFlightNumber,
            returnDepartureTime: selectedFlight.returnDepartureTime,
            returnArrivalTime: selectedFlight.returnArrivalTime,
            returnDuration: selectedFlight.returnDuration,
            returnDepartureDate: selectedFlight.returnDepartureDate || prev.searchParams.returnDate,
            returnArrivalDate: selectedFlight.returnArrivalDate || prev.searchParams.returnDate,
          },
          currentStep: 1,
        }));
      }

      if (selectedFareType) {
        setBooking((prev) => ({
          ...prev,
          selectedFare: {
            id: selectedFareType.id || `fare_${Date.now()}`,
            name: selectedFareType.name,
            type: selectedFareType.type || "economy",
            price: negotiatedPrice || selectedFareType.price,
            originalPrice: negotiatedPrice ? selectedFareType.price : undefined,
            isRefundable: selectedFareType.isRefundable || false,
            isBargained: !!negotiatedPrice,
            includedBaggage: selectedFareType.includedBaggage || "23kg",
            includedMeals: selectedFareType.includedMeals || false,
            seatSelection: selectedFareType.seatSelection || false,
            changes: selectedFareType.changes || { allowed: false },
            cancellation: selectedFareType.cancellation || { allowed: false },
          },
        }));
      }
    }
  }, [location.state]);

  // Auto-load from URL params when component mounts
  useEffect(() => {
    if (urlParams.toString()) {
      loadFromUrlParams(urlParams);
    }
  }, [location.search]);


  const updateExtras = useCallback((extras: Partial<BookingExtras>) => {
    setBooking((prev) => ({
      ...prev,
      extras: { ...prev.extras, ...extras },
    }));
    // Recalculate price breakdown when extras change
    setTimeout(() => updatePriceBreakdown({}), 0);
  }, []);

  const updatePriceBreakdown = useCallback((prices: Partial<PriceBreakdown>) => {
    setBooking((prev) => {
      const passengers = prev.searchParams.pax;
      const totalPassengers = passengers.adults + passengers.children + passengers.infants;
      const fare = prev.selectedFare;

      if (!fare) return prev;

      // Calculate base fare
      const adultFare = fare.price;
      const childFare = fare.price * 0.75;
      const infantFare = fare.price * 0.1;

      const baseFare =
        passengers.adults * adultFare +
        passengers.children * childFare +
        passengers.infants * infantFare;

      // Calculate taxes (18% of base fare)
      const taxes = baseFare * 0.18;

      // Calculate fees (airport charges, fuel surcharge, etc.)
      const fees = baseFare * 0.05;

      // Calculate extras total
      const extrasTotal =
        prev.extras.meals.reduce((sum, meal) => sum + meal.price, 0) +
        prev.extras.baggage.reduce((sum, bag) => sum + bag.price * bag.quantity, 0) +
        prev.extras.otherServices.reduce((sum, service) => sum + service.price, 0);

      // Calculate seats total
      const seatsTotal = prev.extras.seats.reduce((sum, seat) => sum + seat.price, 0);

      // Calculate insurance total
      const insuranceTotal =
        prev.extras.insurance.refundProtectionCost +
        prev.extras.insurance.baggageProtectionCost;

      // Calculate savings if bargained
      const savings =
        fare.isBargained && fare.originalPrice
          ? (fare.originalPrice - fare.price) * totalPassengers
          : 0;

      const total = baseFare + taxes + fees + extrasTotal + seatsTotal + insuranceTotal;

      const newPriceBreakdown: PriceBreakdown = {
        baseFare,
        taxes,
        fees,
        extras: extrasTotal,
        seats: seatsTotal,
        insurance: insuranceTotal,
        total,
        savings,
        ...prices,
      };

      return {
        ...prev,
        priceBreakdown: newPriceBreakdown,
      };
    });
  }, []);


  const generateBookingData = useCallback(() => {
    const {
      searchParams,
      selectedFlight,
      selectedFare,
      travellers,
      contactDetails,
      extras,
      priceBreakdown,
    } = booking;

    return {
      id: booking.bookingId || `FD${Date.now().toString().slice(-8)}`,
      type: "flight",
      bookingDate: new Date().toISOString(),

      // Keep the exact search object structure as specified by the user
      searchParams: {
        tripType: searchParams.tripType,
        from: searchParams.from,
        to: searchParams.to,
        fromCode: searchParams.fromCode,
        toCode: searchParams.toCode,
        departDate: searchParams.departDate,
        returnDate: searchParams.returnDate,
        cabin: searchParams.cabin,
        pax: searchParams.pax,
        currency: searchParams.currency,
      },

      // Flight details with both legs
      flights: [
        {
          type: "outbound",
          airline: selectedFlight?.airline,
          flightNumber: selectedFlight?.flightNumber,
          aircraft: selectedFlight?.aircraft,
          departure: {
            city: selectedFlight?.departureCity,
            code: selectedFlight?.departureCode,
            time: selectedFlight?.departureTime,
            date: selectedFlight?.departureDate,
          },
          arrival: {
            city: selectedFlight?.arrivalCity,
            code: selectedFlight?.arrivalCode,
            time: selectedFlight?.arrivalTime,
            date: selectedFlight?.arrivalDate,
          },
          duration: selectedFlight?.duration,
          stops: selectedFlight?.stops,
        },
        ...(searchParams.tripType === "roundtrip" && selectedFlight?.returnFlightNumber
          ? [
              {
                type: "return",
                airline: selectedFlight.airline,
                flightNumber: selectedFlight.returnFlightNumber,
                aircraft: selectedFlight.aircraft,
                departure: {
                  city: selectedFlight.arrivalCity,
                  code: selectedFlight.arrivalCode,
                  time: selectedFlight.returnDepartureTime,
                  date: selectedFlight.returnDepartureDate,
                },
                arrival: {
                  city: selectedFlight.departureCity,
                  code: selectedFlight.departureCode,
                  time: selectedFlight.returnArrivalTime,
                  date: selectedFlight.returnArrivalDate,
                },
                duration: selectedFlight.returnDuration,
                stops: selectedFlight.stops,
              },
            ]
          : []),
      ],

      // Fare details
      fare: {
        type: selectedFare?.type,
        name: selectedFare?.name,
        isRefundable: selectedFare?.isRefundable,
        isBargained: selectedFare?.isBargained,
        originalPrice: selectedFare?.originalPrice,
        finalPrice: selectedFare?.price,
      },

      // Traveller details
      travellers: travellers.map((t) => ({
        id: t.id,
        type: t.type,
        name: {
          title: t.title,
          first: t.firstName,
          middle: t.middleName,
          last: t.lastName,
        },
        gender: t.gender,
        dateOfBirth: t.dateOfBirth,
        age: t.age,
        nationality: t.nationality,
        documents: {
          passport: t.passportNumber,
          passportIssue: t.passportIssueDate,
          passportExpiry: t.passportExpiryDate,
          pan: t.panCardNumber,
        },
        preferences: {
          meal: t.mealPreference,
        },
        contact: t.id === 1 ? contactDetails : undefined,
      })),

      // Contact details
      contactDetails,

      // Extras
      extras,

      // Price breakdown
      pricing: priceBreakdown,

      // Booking status
      status: "confirmed",
      paymentStatus: booking.paymentStatus || "completed",

      // Additional metadata
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        source: "faredown_web",
      },
    };
  }, [booking]);

  const contextValue: EnhancedBookingContextType = {
    booking,
    updateSearchParams,
    setSelectedFlight,
    setSelectedFare,
    updateTravellers,
    updateContactDetails,
    updateExtras,
    updatePriceBreakdown,
    setCurrentStep,
    completeBooking,
    resetBooking,
    loadFromUrlParams,
    generateBookingData,
    loadCompleteSearchObject,
  };

  return (
    <EnhancedBookingContext.Provider value={contextValue}>
      {children}
    </EnhancedBookingContext.Provider>
  );
}

export function useEnhancedBooking() {
  const context = useContext(EnhancedBookingContext);
  if (context === undefined) {
    throw new Error("useEnhancedBooking must be used within an EnhancedBookingProvider");
  }
  return context;
}
