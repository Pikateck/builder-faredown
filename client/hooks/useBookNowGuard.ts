import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthGuard, type Offer } from "@/utils/authGuards";

export interface BookNowContext {
  module: "flights" | "hotels" | "sightseeing" | "transfers";
  offerId: string;
  price: {
    currency: string;
    amount: number;
  };
  supplier?: string;
  // Module-specific context
  itemName?: string;
  productRef?: string;
  searchParams?: Record<string, any>;
  bookingData?: Record<string, any>;
}

export const useBookNowGuard = () => {
  const { requireAuthForCheckout, isAuthenticated } = useAuthGuard();
  const navigate = useNavigate();

  const handleBookNow = useCallback((
    context: BookNowContext,
    onSuccess?: () => void,
    onAuthRequired?: () => void
  ) => {
    // Create offer object for authentication guard
    const offer: Offer = {
      offerId: context.offerId,
      module: context.module,
      supplier: context.supplier || "default",
      price: context.price,
      ...context.bookingData
    };

    // Check authentication
    if (!requireAuthForCheckout(offer)) {
      // User was redirected to login
      onAuthRequired?.();
      return false;
    }

    // User is authenticated, proceed with booking
    onSuccess?.();
    return true;
  }, [requireAuthForCheckout]);

  const createBookNowHandler = useCallback((context: BookNowContext) => {
    return () => {
      const success = handleBookNow(context, () => {
        // Default booking flow - navigate to booking page
        const bookingParams = new URLSearchParams({
          module: context.module,
          offerId: context.offerId,
          price: context.price.amount.toString(),
          currency: context.price.currency,
          ...(context.searchParams || {})
        });

        navigate(`/booking?${bookingParams.toString()}`);
      });

      if (!success) {
        console.log('User redirected to login for booking');
      }
    };
  }, [handleBookNow, navigate]);

  return {
    handleBookNow,
    createBookNowHandler,
    isAuthenticated
  };
};

// Helper function to extract booking context from different module types
export const createBookingContext = {
  flight: (flight: any, searchParams?: any): BookNowContext => ({
    module: "flights" as const,
    offerId: flight.id || `flight_${Date.now()}`,
    price: {
      currency: flight.currency || "INR",
      amount: flight.price || 0
    },
    supplier: flight.airline || flight.supplier,
    itemName: `${flight.from} → ${flight.to}`,
    productRef: flight.flightNumber,
    searchParams,
    bookingData: {
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      from: flight.from,
      to: flight.to,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      cabin: flight.cabin || "economy"
    }
  }),

  hotel: (hotel: any, searchParams?: any): BookNowContext => ({
    module: "hotels" as const,
    offerId: hotel.id || `hotel_${Date.now()}`,
    price: {
      currency: hotel.currency || "INR",
      amount: hotel.price || 0
    },
    supplier: hotel.supplier || hotel.provider,
    itemName: hotel.name,
    productRef: hotel.id,
    searchParams,
    bookingData: {
      name: hotel.name,
      location: hotel.location,
      checkIn: hotel.checkIn,
      checkOut: hotel.checkOut,
      rating: hotel.rating,
      roomType: hotel.roomType
    }
  }),

  sightseeing: (attraction: any, ticketType?: any, searchParams?: any): BookNowContext => ({
    module: "sightseeing" as const,
    offerId: attraction.id || `sightseeing_${Date.now()}`,
    price: {
      currency: ticketType?.currency || attraction.currency || "INR",
      amount: ticketType?.price || attraction.price || 0
    },
    supplier: attraction.supplier || attraction.provider,
    itemName: attraction.name,
    productRef: attraction.id,
    searchParams,
    bookingData: {
      name: attraction.name,
      location: attraction.location,
      date: attraction.date,
      duration: attraction.duration,
      ticketType: ticketType?.name,
      description: attraction.description
    }
  }),

  transfer: (transfer: any, searchParams?: any): BookNowContext => ({
    module: "transfers" as const,
    offerId: transfer.id || `transfer_${Date.now()}`,
    price: {
      currency: transfer.currency || "INR",
      amount: transfer.price || 0
    },
    supplier: transfer.supplier || transfer.provider,
    itemName: `${transfer.pickup} → ${transfer.dropoff}`,
    productRef: transfer.id,
    searchParams,
    bookingData: {
      pickup: transfer.pickup,
      dropoff: transfer.dropoff,
      date: transfer.date,
      time: transfer.time,
      vehicleType: transfer.vehicleType,
      passengers: transfer.passengers
    }
  })
};
