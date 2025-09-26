import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useBookingAuthGuard, type Offer } from "@/utils/enhancedAuthGuards";
import { type Offer as OriginalOffer } from "@/utils/authGuards";

export interface BookNowContext {
  module: "flights" | "hotels" | "sightseeing" | "transfers" | "packages";
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
  const { requireBookingAuth, isAuthenticated, showInlineAuth } = useBookingAuthGuard();
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

    // Check authentication (using inline auth banner)
    if (!requireBookingAuth(offer, {
      onAuthRequired: () => {
        console.log('Authentication required for booking');
        onAuthRequired?.();
      }
    })) {
      // User will see inline auth banner
      return false;
    }

    // User is authenticated, proceed with booking
    onSuccess?.();
    return true;
  }, [requireBookingAuth]);

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
    isAuthenticated,
    showInlineAuth
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
  }),

  package: (packageData: any, departure: any, travelers: any, searchParams?: any): BookNowContext => ({
    module: "packages" as const,
    offerId: `package_${packageData.id}_departure_${departure.id}`,
    price: {
      currency: departure.currency || "INR",
      amount: departure.price_per_person * travelers.adults +
              (departure.child_price || departure.price_per_person * 0.75) * travelers.children
    },
    supplier: "Travel Provider",
    itemName: packageData.title,
    productRef: `package_${packageData.id}_departure_${departure.id}`,
    searchParams,
    bookingData: {
      packageId: packageData.id,
      packageTitle: packageData.title,
      departureId: departure.id,
      departureDate: departure.departure_date,
      departureCity: departure.departure_city_name,
      returnDate: departure.return_date,
      duration: `${packageData.duration_days}D/${packageData.duration_nights}N`,
      adults: travelers.adults,
      children: travelers.children,
      pricePerPerson: departure.price_per_person,
      childPrice: departure.child_price,
      availableSeats: departure.available_seats,
      totalSeats: departure.total_seats
    }
  })
};
