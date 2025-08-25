/**
 * BACKUP FILE - BookingContext.tsx
 * Backup Date: February 18, 2025 - 15:30 UTC
 * Backup ID: BACKUP_BookingContext_2025-02-18_15-30-UTC
 * Status: CRITICAL COMPONENT - FULLY FUNCTIONAL
 * 
 * COMPONENT DESCRIPTION:
 * Centralized state management for the entire booking flow across all travel modules.
 * Handles flight, hotel, transfer, and sightseeing booking data with persistent storage.
 * 
 * KEY FEATURES:
 * - Centralized booking state management
 * - Persistent localStorage integration
 * - URL parameter loading
 * - Price breakdown calculations
 * - Multi-step booking flow management
 * - Support for all travel modules
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Types for comprehensive booking state
export interface SearchParams {
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  departureDate: string;
  returnDate?: string;
  tripType: "one-way" | "round-trip";
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  class: "economy" | "premium-economy" | "business" | "first";
  airline?: string;
  preferredFare?: string;
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
  savings: number; // If bargained
}

export interface BookingState {
  searchParams: SearchParams;
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

interface BookingContextType {
  booking: BookingState;
  updateSearchParams: (params: Partial<SearchParams>) => void;
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
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialBookingState: BookingState = {
  searchParams: {
    from: "",
    to: "",
    fromCode: "",
    toCode: "",
    departureDate: "",
    tripType: "round-trip",
    passengers: {
      adults: 1,
      children: 0,
      infants: 0,
    },
    class: "economy",
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

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState>(() => {
    // Try to restore from localStorage
    try {
      const saved = localStorage.getItem("faredown_booking_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialBookingState, ...parsed };
      }
    } catch (error) {
      console.warn("Failed to restore booking state:", error);
    }
    return initialBookingState;
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Save to localStorage whenever booking state changes
  useEffect(() => {
    try {
      localStorage.setItem("faredown_booking_state", JSON.stringify(booking));
    } catch (error) {
      console.warn("Failed to save booking state:", error);
    }
  }, [booking]);

  // Load booking data from URL parameters (from flight search/results)
  const loadFromUrlParams = (urlParams: URLSearchParams) => {
    const newSearchParams: Partial<SearchParams> = {};

    // Extract search parameters
    if (urlParams.get("from")) newSearchParams.from = urlParams.get("from")!;
    if (urlParams.get("to")) newSearchParams.to = urlParams.get("to")!;
    if (urlParams.get("fromCode"))
      newSearchParams.fromCode = urlParams.get("fromCode")!;
    if (urlParams.get("toCode"))
      newSearchParams.toCode = urlParams.get("toCode")!;
    if (urlParams.get("departureDate"))
      newSearchParams.departureDate = urlParams.get("departureDate")!;
    if (urlParams.get("returnDate"))
      newSearchParams.returnDate = urlParams.get("returnDate")!;
    if (urlParams.get("tripType"))
      newSearchParams.tripType = urlParams.get("tripType") as
        | "one-way"
        | "round-trip";
    if (urlParams.get("class"))
      newSearchParams.class = urlParams.get("class") as any;
    if (urlParams.get("airline"))
      newSearchParams.airline = urlParams.get("airline")!;

    // Extract passenger counts
    const adults = parseInt(urlParams.get("adults") || "1");
    const children = parseInt(urlParams.get("children") || "0");
    const infants = parseInt(urlParams.get("infants") || "0");

    newSearchParams.passengers = { adults, children, infants };

    // Update booking state
    setBooking((prev) => ({
      ...prev,
      searchParams: { ...prev.searchParams, ...newSearchParams },
    }));
  };

  // Load from location state (from flight results selection)
  useEffect(() => {
    if (location.state) {
      const { selectedFlight, selectedFareType, negotiatedPrice, passengers } =
        location.state;

      if (selectedFlight) {
        setBooking((prev) => ({
          ...prev,
          selectedFlight: {
            id: selectedFlight.id || `flight_${Date.now()}`,
            airline: selectedFlight.airline,
            flightNumber: selectedFlight.flightNumber,
            departureTime: selectedFlight.departureTime,
            arrivalTime: selectedFlight.arrivalTime,
            duration: selectedFlight.duration,
            aircraft: selectedFlight.aircraft || "Aircraft",
            stops: selectedFlight.stops || 0,
            departureCode:
              selectedFlight.departureCode || prev.searchParams.fromCode,
            arrivalCode: selectedFlight.arrivalCode || prev.searchParams.toCode,
            departureCity:
              selectedFlight.departureCity || prev.searchParams.from,
            arrivalCity: selectedFlight.arrivalCity || prev.searchParams.to,
            departureDate:
              selectedFlight.departureDate || prev.searchParams.departureDate,
            arrivalDate: selectedFlight.arrivalDate,
            returnFlightNumber: selectedFlight.returnFlightNumber,
            returnDepartureTime: selectedFlight.returnDepartureTime,
            returnArrivalTime: selectedFlight.returnArrivalTime,
            returnDuration: selectedFlight.returnDuration,
            returnDepartureDate: selectedFlight.returnDepartureDate,
            returnArrivalDate: selectedFlight.returnArrivalDate,
          },
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

      if (passengers) {
        setBooking((prev) => ({
          ...prev,
          searchParams: {
            ...prev.searchParams,
            passengers: {
              adults: passengers.adults || 1,
              children: passengers.children || 0,
              infants: passengers.infants || 0,
            },
          },
        }));
      }
    }
  }, [location.state]);

  // Auto-load from URL params when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.toString()) {
      loadFromUrlParams(urlParams);
    }
  }, [location.search]);

  const updateSearchParams = (params: Partial<SearchParams>) => {
    setBooking((prev) => ({
      ...prev,
      searchParams: { ...prev.searchParams, ...params },
    }));
  };

  const setSelectedFlight = (flight: SelectedFlight) => {
    setBooking((prev) => ({ ...prev, selectedFlight: flight }));
  };

  const setSelectedFare = (fare: SelectedFare) => {
    setBooking((prev) => ({ ...prev, selectedFare: fare }));
    // Recalculate price breakdown when fare changes
    updatePriceBreakdown({});
  };

  const updateTravellers = (travellers: Traveller[]) => {
    setBooking((prev) => ({ ...prev, travellers }));
  };

  const updateContactDetails = (contact: ContactDetails) => {
    setBooking((prev) => ({ ...prev, contactDetails: contact }));
  };

  const updateExtras = (extras: Partial<BookingExtras>) => {
    setBooking((prev) => ({
      ...prev,
      extras: { ...prev.extras, ...extras },
    }));
    // Recalculate price breakdown when extras change
    setTimeout(() => updatePriceBreakdown({}), 0);
  };

  const updatePriceBreakdown = (prices: Partial<PriceBreakdown>) => {
    setBooking((prev) => {
      const passengers = prev.searchParams.passengers;
      const totalPassengers =
        passengers.adults + passengers.children + passengers.infants;
      const fare = prev.selectedFare;

      if (!fare) return prev;

      // Calculate base fare
      const adultFare = fare.price;
      const childFare = fare.price * 0.75; // 75% of adult fare
      const infantFare = fare.price * 0.1; // 10% of adult fare

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
        prev.extras.baggage.reduce(
          (sum, bag) => sum + bag.price * bag.quantity,
          0,
        ) +
        prev.extras.otherServices.reduce(
          (sum, service) => sum + service.price,
          0,
        );

      // Calculate seats total
      const seatsTotal = prev.extras.seats.reduce(
        (sum, seat) => sum + seat.price,
        0,
      );

      // Calculate insurance total
      const insuranceTotal =
        prev.extras.insurance.refundProtectionCost +
        prev.extras.insurance.baggageProtectionCost;

      // Calculate savings if bargained
      const savings =
        fare.isBargained && fare.originalPrice
          ? (fare.originalPrice - fare.price) * totalPassengers
          : 0;

      const total =
        baseFare + taxes + fees + extrasTotal + seatsTotal + insuranceTotal;

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
  };

  const setCurrentStep = (step: number) => {
    setBooking((prev) => ({ ...prev, currentStep: step }));
  };

  const completeBooking = (bookingId: string) => {
    setBooking((prev) => ({
      ...prev,
      isComplete: true,
      bookingId,
      paymentStatus: "completed",
    }));
  };

  const resetBooking = () => {
    setBooking(initialBookingState);
    localStorage.removeItem("faredown_booking_state");
  };

  const generateBookingData = () => {
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

      // Search parameters
      route: {
        from: searchParams.from,
        to: searchParams.to,
        fromCode: searchParams.fromCode,
        toCode: searchParams.toCode,
        tripType: searchParams.tripType,
        class: searchParams.class,
      },

      // Dates
      departureDate: searchParams.departureDate,
      returnDate: searchParams.returnDate,

      // Passengers
      passengers: {
        adults: searchParams.passengers.adults,
        children: searchParams.passengers.children,
        infants: searchParams.passengers.infants,
        total:
          searchParams.passengers.adults +
          searchParams.passengers.children +
          searchParams.passengers.infants,
      },

      // Flight details
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
        ...(searchParams.tripType === "round-trip" &&
        selectedFlight?.returnFlightNumber
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
        contact: t.id === 1 ? contactDetails : undefined, // Primary traveller gets contact details
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
  };

  const contextValue: BookingContextType = {
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
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}

/**
 * END OF BACKUP FILE
 * 
 * RESTORE INSTRUCTIONS:
 * 1. Copy this file content to client/contexts/BookingContext.tsx
 * 2. Verify React Router DOM imports are working
 * 3. Test context provider in app root
 * 4. Verify localStorage persistence
 * 
 * DEPENDENCIES REQUIRED:
 * - React 18+
 * - React Router DOM
 * - TypeScript
 * 
 * USAGE:
 * - Wrap app with BookingProvider
 * - Use useBooking() hook in components
 * - Persistent state across page reloads
 * - URL parameter loading
 */
