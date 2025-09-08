/**
 * Unified Price Utilities
 * Single source of truth for all price calculations and formatting
 * Ensures consistency across Results → Details → Bargain → Booking flow
 */

export interface PriceBreakdown {
  basePrice: number;
  taxes: number;
  fees: number;
  total: number;
}

export interface RateData {
  hotelId: string | number;
  roomTypeId: string | null;
  roomId: string | null;
  ratePlanId: string | null;
  rateKey: string | null;
  roomName: string | null;
  roomType: string | null;
  board: string;
  occupancy: {
    adults: number;
    children: number;
    rooms: number;
  };
  nights: number;
  currency: string;
  taxesIncluded: boolean;
  totalPrice: number;
  perNightPrice: number;
  priceBreakdown: PriceBreakdown;
  checkIn: string;
  checkOut: string;
  supplierData: {
    supplier: string;
    isLiveData: boolean;
  };
}

/**
 * Calculate total price with taxes and fees
 * Used consistently across all components
 */
export function calculateTotalPrice(
  basePricePerNight: number,
  nights: number,
  rooms: number = 1,
  extraFees: number = 0,
): PriceBreakdown {
  // Ensure all inputs are valid numbers
  const safeBasePrice = isNaN(basePricePerNight) ? 129 : basePricePerNight;
  const safeNights = isNaN(nights) || nights < 1 ? 1 : nights;
  const safeRooms = isNaN(rooms) || rooms < 1 ? 1 : rooms;
  const safeExtraFees = isNaN(extraFees) ? 0 : extraFees;

  const basePrice = Math.round(safeBasePrice * safeNights * safeRooms);
  const taxes = Math.round(basePrice * 0.12); // 12% tax rate
  const fees = Math.round(25 * safeRooms + safeExtraFees); // ₹25 booking fee per room + extra fees
  const total = Math.round(basePrice + taxes + fees);

  return {
    basePrice,
    taxes,
    fees,
    total,
  };
}

/**
 * Format price with currency symbol
 * Consistent formatting across all components
 */
export function formatPrice(
  price: number,
  currency: string = "INR",
  includeSymbol: boolean = true,
): string {
  if (isNaN(price) || !isFinite(price)) {
    return includeSymbol ? "₹0" : "0";
  }

  const formatter = new Intl.NumberFormat("en-IN", {
    style: includeSymbol ? "currency" : "decimal",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(Math.round(price));
}

/**
 * Create comprehensive rate data object
 * Single source of truth for rate information
 */
export function createRateData(
  hotel: any,
  room: any,
  searchParams: URLSearchParams,
  selectedCurrency: any,
  checkInDate: Date,
  checkOutDate: Date,
  totalNights: number,
  roomsCount: number,
): RateData {
  const roomPrice =
    room?.pricePerNight || room?.price || hotel?.currentPrice || 0;
  const totalPriceData = calculateTotalPrice(
    roomPrice,
    totalNights,
    roomsCount,
  );

  return {
    hotelId: hotel.id,
    roomTypeId: room?.id || null,
    roomId: room?.id || null,
    ratePlanId: room?.rateKey || room?.id || null,
    rateKey: room?.rateKey || room?.id || null,
    roomName: room?.name || room?.type || null,
    roomType: room?.type || room?.name || null,
    board: room?.board || "Room Only",
    occupancy: {
      adults: parseInt(searchParams.get("adults") || "2"),
      children: parseInt(searchParams.get("children") || "0"),
      rooms: roomsCount,
    },
    nights: totalNights,
    currency: selectedCurrency?.code || "INR",
    taxesIncluded: true,
    totalPrice: totalPriceData.total,
    perNightPrice: roomPrice,
    priceBreakdown: totalPriceData,
    checkIn: checkInDate.toISOString(),
    checkOut: checkOutDate.toISOString(),
    supplierData: {
      supplier: hotel?.supplier || "hotelbeds",
      isLiveData: hotel?.isLiveData || false,
    },
  };
}

/**
 * Find cheapest room from hotel data
 * Returns comprehensive room data for navigation
 */
export function findCheapestRoom(hotel: any): {
  price: number;
  room: any | null;
  roomId: string | null;
  roomType: string | null;
} {
  if (!hotel) return { price: 0, room: null, roomId: null, roomType: null };

  const roomsArr: any[] = (hotel as any).roomTypes || [];
  if (Array.isArray(roomsArr) && roomsArr.length > 0) {
    // Find the cheapest room with all its details
    let cheapestRoom: any = null;
    let cheapestPrice = Infinity;

    roomsArr.forEach((room: any, index: number) => {
      const price = room ? room.pricePerNight || room.price || 0 : 0;
      if (
        typeof price === "number" &&
        isFinite(price) &&
        price > 0 &&
        price < cheapestPrice
      ) {
        cheapestPrice = price;
        cheapestRoom = room;
      }
    });

    if (cheapestRoom) {
      return {
        price: cheapestPrice,
        room: cheapestRoom,
        roomId: cheapestRoom.id || `room-${roomsArr.indexOf(cheapestRoom)}`,
        roomType: cheapestRoom.name || cheapestRoom.type || "Standard Room",
      };
    }
  }

  // Fallback to hotel-level pricing
  const fallbackPrice =
    (hotel as any).currentPrice ||
    (hotel as any).pricePerNight ||
    (hotel as any).priceRange?.min ||
    0;

  return {
    price: fallbackPrice,
    room: null,
    roomId: null,
    roomType: null,
  };
}

/**
 * Log navigation debug information
 */
export function logNavigationDebug(
  action: string,
  data: {
    hotelId?: string | number;
    rateKey?: string | null;
    totalPrice?: number;
    perNightPrice?: number;
    roomName?: string | null;
    [key: string]: any;
  },
) {
  console.log(`[${action.toUpperCase()}]`, data);
}

/**
 * Validate rate data consistency
 */
export function validateRateConsistency(
  resultsRate: RateData,
  detailsRate: RateData,
  tolerance: number = 5,
): {
  isConsistent: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (resultsRate.hotelId !== detailsRate.hotelId) {
    issues.push("Hotel ID mismatch");
  }

  if (Math.abs(resultsRate.totalPrice - detailsRate.totalPrice) > tolerance) {
    issues.push(
      `Total price mismatch: ${resultsRate.totalPrice} vs ${detailsRate.totalPrice}`,
    );
  }

  if (
    Math.abs(resultsRate.perNightPrice - detailsRate.perNightPrice) > tolerance
  ) {
    issues.push(
      `Per night price mismatch: ${resultsRate.perNightPrice} vs ${detailsRate.perNightPrice}`,
    );
  }

  if (resultsRate.roomName !== detailsRate.roomName) {
    issues.push(
      `Room name mismatch: "${resultsRate.roomName}" vs "${detailsRate.roomName}"`,
    );
  }

  return {
    isConsistent: issues.length === 0,
    issues,
  };
}
