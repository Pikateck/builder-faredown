/**
 * useBargainPhase1 Hook
 * Easy integration hook for Phase 1 Bargain Engine
 * Handles modal state and booking flow integration
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface BargainItem {
  type: "flight" | "hotel" | "sightseeing";
  itemId: string;
  title: string;
  basePrice: number;
  userType?: "b2c" | "b2b";
  // Flight specific
  airline?: string;
  route?: { from: string; to: string };
  class?: string;
  // Hotel specific
  city?: string;
  hotelName?: string;
  starRating?: string;
  roomCategory?: string;
  // Sightseeing specific
  location?: string;
  category?: string;
  duration?: string;
  activityName?: string;
}

interface UseBargainPhase1Options {
  onBookingConfirmed?: (item: BargainItem, finalPrice: number) => void;
  redirectToBooking?: boolean;
  promoCode?: string;
  userLocation?: string;
  deviceType?: "mobile" | "desktop";
}

export function useBargainPhase1(options: UseBargainPhase1Options = {}) {
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);
  const [currentBargainItem, setCurrentBargainItem] =
    useState<BargainItem | null>(null);
  const navigate = useNavigate();

  const startBargain = useCallback((item: BargainItem) => {
    setCurrentBargainItem(item);
    setIsBargainModalOpen(true);
  }, []);

  const closeBargainModal = useCallback(() => {
    setIsBargainModalOpen(false);
    setCurrentBargainItem(null);
  }, []);

  const handleBookingConfirmed = useCallback(
    (finalPrice: number) => {
      if (!currentBargainItem) return;

      // Call custom handler if provided
      if (options.onBookingConfirmed) {
        options.onBookingConfirmed(currentBargainItem, finalPrice);
      }

      // Default behavior: redirect to booking flow
      if (options.redirectToBooking !== false) {
        const bookingParams = new URLSearchParams({
          type: currentBargainItem.type,
          itemId: currentBargainItem.itemId,
          finalPrice: finalPrice.toString(),
          bargainApplied: "true",
          promoCode: options.promoCode || "",
        });

        if (currentBargainItem.type === "flight") {
          navigate(`/booking/flight?${bookingParams.toString()}`);
        } else if (currentBargainItem.type === "hotel") {
          navigate(`/booking/hotel?${bookingParams.toString()}`);
        } else if (currentBargainItem.type === "sightseeing") {
          navigate(`/booking/sightseeing?${bookingParams.toString()}`);
        }
      }

      closeBargainModal();
    },
    [currentBargainItem, options, navigate, closeBargainModal],
  );

  return {
    // State
    isBargainModalOpen,
    currentBargainItem,

    // Actions
    startBargain,
    closeBargainModal,
    handleBookingConfirmed,

    // Modal props helper
    getBargainModalProps: () => ({
      isOpen: isBargainModalOpen,
      onClose: closeBargainModal,
      onBookingConfirmed: handleBookingConfirmed,
      itemDetails: currentBargainItem || {
        type: "flight" as const,
        itemId: "",
        title: "",
        basePrice: 0,
      },
      promoCode: options.promoCode,
      userLocation: options.userLocation,
      deviceType: options.deviceType,
    }),
  };
}

// Helper function to extract bargain item from flight data
export function createFlightBargainItem(flight: {
  id: string;
  airline: string;
  route: { from: string; to: string };
  class: string;
  price: number;
  [key: string]: any;
}): BargainItem {
  return {
    type: "flight",
    itemId: flight.id,
    title: `${flight.airline} • ${flight.route.from} → ${flight.route.to}`,
    basePrice: flight.price,
    airline: flight.airline,
    route: flight.route,
    class: flight.class,
    userType: "b2c", // Default, can be overridden
  };
}

// Helper function to extract bargain item from hotel data
export function createHotelBargainItem(hotel: {
  id: string;
  name: string;
  city: string;
  starRating?: string | number;
  roomCategory?: string;
  price: number;
  [key: string]: any;
}): BargainItem {
  return {
    type: "hotel",
    itemId: hotel.id,
    title: `${hotel.name} • ${hotel.city}`,
    basePrice: hotel.price,
    city: hotel.city,
    hotelName: hotel.name,
    starRating: hotel.starRating?.toString(),
    roomCategory: hotel.roomCategory,
    userType: "b2c", // Default, can be overridden
  };
}

export default useBargainPhase1;
