import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEnhancedBooking } from "@/contexts/EnhancedBookingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BargainButton } from "@/components/ui/BargainButton";
import type { Hotel as HotelType } from "@/services/hotelsService";
import {
  Star,
  MapPin,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Heart,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Calendar,
  Users,
  CreditCard,
  ArrowRight,
  Waves,
  Sparkles,
  Wind,
  Building2,
  Coffee as CoffeeIcon,
  Utensils,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  calculateTotalPrice,
  formatPriceWithSymbol,
  formatLocalPrice,
  calculateNights,
} from "@/lib/pricing";
import {
  createRateData,
  findCheapestRoom,
  logNavigationDebug,
  formatPrice as utilFormatPrice,
} from "@/utils/priceUtils";

// Extend HotelType with additional props for backward compatibility
interface Hotel extends Partial<HotelType> {
  id?: number | string;
  name: string;
  location?: string;
  images?: string[] | any[];
  rating: number;
  reviews?: number;
  originalPrice?: number;
  currentPrice?: number;
  description?: string;
  amenities?: string[] | any[];
  features?: string[];
  roomTypes?: {
    name: string;
    price?: number;
    pricePerNight?: number;
    features: string[];
  }[];
  availableRoom?: {
    type: string;
    bedType: string;
    rateType: string;
    cancellationPolicy: string;
    paymentTerms: string;
  };
  breakfastIncluded?: boolean;
  breakfastType?: string;
}

interface HotelCardProps {
  hotel: Hotel;
  onBargainClick: (hotel: Hotel, searchParams?: URLSearchParams) => void;
  viewMode?: "grid" | "list";
}

const getAmenityIcon = (amenity: string) => {
  const iconClass = "w-3 h-3 text-white";
  const containerClass =
    "w-6 h-6 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-lg flex items-center justify-center shadow-sm";
  const icons: Record<string, React.ReactNode> = {
    wifi: (
      <div className={containerClass}>
        <Wifi className={iconClass} />
      </div>
    ),
    parking: (
      <div className={containerClass}>
        <Car className={iconClass} />
      </div>
    ),
    restaurant: (
      <div className={containerClass}>
        <Coffee className={iconClass} />
      </div>
    ),
    gym: (
      <div className={containerClass}>
        <Dumbbell className={iconClass} />
      </div>
    ),
    pool: (
      <div className={containerClass}>
        <Waves className={iconClass} />
      </div>
    ),
    spa: (
      <div className={containerClass}>
        <Sparkles className={iconClass} />
      </div>
    ),
    "air conditioning": (
      <div className={containerClass}>
        <Wind className={iconClass} />
      </div>
    ),
    "room service": (
      <div className={containerClass}>
        <Building2 className={iconClass} />
      </div>
    ),
  };

  return (
    icons[amenity.toLowerCase()] || (
      <div className={containerClass}>
        <Coffee className={iconClass} />
      </div>
    )
  );
};

export function HotelCard({
  hotel,
  onBargainClick,
  viewMode = "list",
}: HotelCardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedCurrency, formatPrice } = useCurrency();
  const { loadCompleteSearchObject } = useEnhancedBooking();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Helper functions to extract data from the hotel object
  const getHotelImages = (): string[] => {
    if (hotel.images && hotel.images.length > 0) {
      const processedImages = hotel.images
        .map((img) => {
          if (typeof img === "string") {
            return img;
          } else if (img && typeof img === "object") {
            // Handle different image object structures
            return img.urlStandard || img.url || img.path || img.src || null;
          }
          return null;
        })
        .filter(Boolean) as string[];

      if (processedImages.length > 0) {
        console.log(
          `📸 Hotel ${hotel.name} has ${processedImages.length} images`,
        );
        return processedImages;
      }
    }

    // Enhanced fallback with hotel-specific images based on name/type
    console.log(`📸 Using fallback images for hotel: ${hotel.name}`);
    const fallbackImages = [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop&auto=format",
    ];

    // Return at least one image, but if we have hotel-specific fallbacks, use those
    if (hotel.name?.toLowerCase().includes("grand")) {
      return [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format",
      ];
    } else if (hotel.name?.toLowerCase().includes("business")) {
      return [
        "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&h=600&fit=crop&auto=format",
      ];
    } else if (hotel.name?.toLowerCase().includes("boutique")) {
      return [
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&auto=format",
      ];
    }

    return [fallbackImages[0]];
  };

  const getHotelLocation = (): string => {
    if (hotel.location) return hotel.location;
    if (hotel.address?.city) return hotel.address.city;
    if (hotel.location?.city) return hotel.location.city;
    return "Location not specified";
  };

  const getHotelPrice = (): number => {
    // Prefer the cheapest available room type if present
    if (hotel.roomTypes && hotel.roomTypes.length > 0) {
      const minRoomPrice = Math.min(
        ...hotel.roomTypes
          .map((r: any) =>
            typeof r === "object" ? r.pricePerNight || r.price || 0 : 0,
          )
          .filter((p: number) => typeof p === "number" && isFinite(p)),
      );
      if (isFinite(minRoomPrice) && minRoomPrice > 0) return minRoomPrice;
    }
    if (hotel.currentPrice) return hotel.currentPrice;
    if (hotel.priceRange?.min) return hotel.priceRange.min;
    return 0;
  };

  const getHotelAmenities = (): string[] => {
    if (!hotel.amenities) return [];
    return hotel.amenities
      .map((amenity) =>
        typeof amenity === "string" ? amenity : amenity.name || amenity,
      )
      .slice(0, 6);
  };

  const images = getHotelImages();
  const hotelLocation = getHotelLocation();
  const currentPrice = getHotelPrice();
  const hotelAmenities = getHotelAmenities();
  const supplierDisplayName = (
    hotel.supplier ||
    hotel.supplierCode ||
    "hotelbeds"
  )
    .toString()
    .toUpperCase();

  // Debug logging for price calculations
  console.log(`[HOTEL CARD ${hotel.id}] Price Calculation:`, {
    hotelId: hotel.id,
    hotelName: hotel.name,
    currentPrice,
    hotelCurrentPrice: hotel.currentPrice,
    roomTypes: hotel.roomTypes,
    priceRange: hotel.priceRange,
  });

  // Get search parameters for price calculation
  const checkInDate = searchParams.get("checkIn")
    ? new Date(searchParams.get("checkIn")!)
    : new Date();
  const checkOutDate = searchParams.get("checkOut")
    ? new Date(searchParams.get("checkOut")!)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const roomsCount = parseInt(searchParams.get("rooms") || "1");
  const totalNights = calculateNights(checkInDate, checkOutDate);

  // Calculate comprehensive pricing with taxes
  const priceCalculation = calculateTotalPrice(
    currentPrice,
    totalNights,
    roomsCount,
  );

  // Calculate per night price inclusive of taxes for display
  const perNightInclusiveTaxes = Math.round(
    priceCalculation.total / totalNights,
  );
  const totalPriceInclusiveTaxes = priceCalculation.total;

  // Debug logging for total price calculation
  console.log(`[HOTEL CARD ${hotel.id}] Total Price Calculation:`, {
    currentPrice,
    totalNights,
    roomsCount,
    priceCalculation,
    totalPriceInclusiveTaxes,
    perNightInclusiveTaxes,
  });

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Handle quick booking action
  const handleQuickBooking = async () => {
    try {
      setIsBooking(true);
      console.log("🚀 Starting quick booking for hotel:", hotel.name);

      // Create standardized search object for hotel booking
      const standardizedHotelSearchParams = {
        module: "hotels" as const,
        destination: searchParams.get("destination") || hotelLocation,
        destinationCode: searchParams.get("destinationCode") || "DXB",
        destinationName: searchParams.get("destinationName") || hotelLocation,
        checkIn:
          searchParams.get("checkIn") ||
          checkInDate.toISOString().split("T")[0],
        checkOut:
          searchParams.get("checkOut") ||
          checkOutDate.toISOString().split("T")[0],
        rooms: roomsCount,
        nights: totalNights,
        guests: {
          adults: parseInt(searchParams.get("adults") || "2"),
          children: parseInt(searchParams.get("children") || "0"),
        },
        pax: {
          adults: parseInt(searchParams.get("adults") || "2"),
          children: parseInt(searchParams.get("children") || "0"),
          infants: 0,
        },
        currency: selectedCurrency?.code || "INR",
        searchId: `hotel_booking_${Date.now()}`,
        searchTimestamp: new Date().toISOString(),
      };

      // Load standardized search object to enhanced booking context
      loadCompleteSearchObject(standardizedHotelSearchParams);

      // Navigate to booking page with standardized search data
      const bookingParams = new URLSearchParams({
        hotelId: String(hotel.id),
        destination: standardizedHotelSearchParams.destination,
        destinationCode: standardizedHotelSearchParams.destinationCode,
        destinationName: standardizedHotelSearchParams.destinationName,
        checkIn: standardizedHotelSearchParams.checkIn,
        checkOut: standardizedHotelSearchParams.checkOut,
        rooms: standardizedHotelSearchParams.rooms.toString(),
        adults: standardizedHotelSearchParams.guests.adults.toString(),
        children: standardizedHotelSearchParams.guests.children.toString(),
        currency: standardizedHotelSearchParams.currency,
        totalPrice: priceCalculation.total.toString(),
        hotelName: hotel.name,
        hotelLocation: hotelLocation,
        hotelRating: hotel.rating.toString(),
      });

      navigate(`/booking/hotel?${bookingParams.toString()}`, {
        state: {
          searchParams: standardizedHotelSearchParams,
          hotelData: hotel,
          priceData: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Quick booking error:", error);
    } finally {
      setIsBooking(false);
    }
  };

  // Helper function to get cheapest room data for navigation (must match Results page logic)
  const getCheapestRoomFromHotel = (
    hotel: Hotel,
  ): {
    price: number;
    room: any | null;
    roomId: string | null;
    roomType: string | null;
    displayPrice: number; // Add displayed price for consistency
  } => {
    if (!hotel)
      return {
        price: 0,
        room: null,
        roomId: null,
        roomType: null,
        displayPrice: 0,
      };

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
        // Use the exact same price calculation as displayed on Results page
        const displayedTotal = calculateTotalPrice(
          cheapestPrice,
          totalNights,
          roomsCount,
        ).total;

        return {
          price: cheapestPrice,
          room: cheapestRoom,
          roomId: cheapestRoom.id || `room-${roomsArr.indexOf(cheapestRoom)}`,
          roomType: cheapestRoom.name || cheapestRoom.type || "Standard Room",
          displayPrice: displayedTotal, // This is the price shown on Results page
        };
      }
    }

    // Fallback to hotel-level pricing
    const fallbackPrice =
      (hotel as any).currentPrice ||
      (hotel as any).pricePerNight ||
      (hotel as any).priceRange?.min ||
      0;

    const fallbackDisplayPrice = calculateTotalPrice(
      fallbackPrice,
      totalNights,
      roomsCount,
    ).total;

    return {
      price: fallbackPrice,
      room: null,
      roomId: null,
      roomType: null,
      displayPrice: fallbackDisplayPrice,
    };
  };

  // Handle view details action
  const handleViewDetails = () => {
    // Create standardized search object for hotels following the user's requirements
    const standardizedHotelSearchParams = {
      module: "hotels" as const,
      destination: searchParams.get("destination") || hotelLocation,
      destinationCode: searchParams.get("destinationCode") || "DXB",
      destinationName: searchParams.get("destinationName") || hotelLocation,
      // Use exact date format as specified by user: "2025-10-01"
      checkIn:
        searchParams.get("checkIn") || checkInDate.toISOString().split("T")[0],
      checkOut:
        searchParams.get("checkOut") ||
        checkOutDate.toISOString().split("T")[0],
      rooms: roomsCount,
      nights: totalNights,
      guests: {
        adults: parseInt(searchParams.get("adults") || "2"),
        children: parseInt(searchParams.get("children") || "0"),
      },
      pax: {
        adults: parseInt(searchParams.get("adults") || "2"),
        children: parseInt(searchParams.get("children") || "0"),
        infants: 0, // Hotels typically don't track infants separately
      },
      currency: selectedCurrency?.code || "INR",
      searchId: `hotel_search_${Date.now()}`,
      searchTimestamp: new Date().toISOString(),
    };

    console.log(
      "🏨 Standardized Hotel Search Object being passed:",
      standardizedHotelSearchParams,
    );

    // Get the exact same room and price data shown on this Results card
    const cheapestRoomData = getCheapestRoomFromHotel(hotel);

    // Create rate data using the exact displayed total price from Results page
    const preselectRate = {
      hotelId: hotel.id,
      roomTypeId: cheapestRoomData.roomId,
      roomId: cheapestRoomData.roomId,
      ratePlanId: cheapestRoomData.roomId,
      rateKey: cheapestRoomData.roomId,
      roomName: cheapestRoomData.roomType,
      roomType: cheapestRoomData.roomType,
      board: "Room Only",
      occupancy: {
        adults: standardizedHotelSearchParams.guests.adults,
        children: standardizedHotelSearchParams.guests.children,
        rooms: standardizedHotelSearchParams.rooms,
      },
      nights: standardizedHotelSearchParams.nights,
      currency: standardizedHotelSearchParams.currency,
      taxesIncluded: true,
      totalPrice: cheapestRoomData.displayPrice, // Use exact displayed price from Results
      perNightPrice: cheapestRoomData.price, // Original per-night price
      priceBreakdown: calculateTotalPrice(
        cheapestRoomData.price,
        totalNights,
        roomsCount,
      ),
      checkIn: standardizedHotelSearchParams.checkIn,
      checkOut: standardizedHotelSearchParams.checkOut,
      supplierData: {
        supplier: supplierDisplayName,
        supplierCode: (hotel?.supplier || hotel?.supplierCode || "hotelbeds")
          .toString()
          .toLowerCase(),
        isLiveData: hotel?.isLiveData || false,
      },
      // Add displayed formatting for debugging
      displayedTotalPrice: totalPriceInclusiveTaxes, // What user sees on Results
      displayedPerNightPrice: currentPrice, // What user sees per night on Results
    };

    // Debug trace for navigation using unified logger
    logNavigationDebug("NAVIGATE", {
      hotelId: hotel.id,
      rateKey: preselectRate.rateKey,
      totalPrice: preselectRate.totalPrice,
      perNightPrice: preselectRate.perNightPrice,
      roomName: preselectRate.roomName,
      displayedOnResults: totalPriceInclusiveTaxes,
      exactMatch: preselectRate.totalPrice === totalPriceInclusiveTaxes,
    });

    // Load standardized search object to enhanced booking context
    loadCompleteSearchObject(standardizedHotelSearchParams);

    // Create URL params from standardized search object
    const detailParams = new URLSearchParams();
    detailParams.set("destination", standardizedHotelSearchParams.destination);
    detailParams.set(
      "destinationCode",
      standardizedHotelSearchParams.destinationCode,
    );
    detailParams.set(
      "destinationName",
      standardizedHotelSearchParams.destinationName,
    );
    detailParams.set("checkIn", standardizedHotelSearchParams.checkIn);
    detailParams.set("checkOut", standardizedHotelSearchParams.checkOut);
    detailParams.set(
      "adults",
      standardizedHotelSearchParams.guests.adults.toString(),
    );
    detailParams.set(
      "children",
      standardizedHotelSearchParams.guests.children.toString(),
    );
    detailParams.set("rooms", standardizedHotelSearchParams.rooms.toString());
    detailParams.set("currency", standardizedHotelSearchParams.currency);

    // Include supplier in query for supplier-aware backend details
    const supplierCodeLower = (
      hotel?.supplier ||
      hotel?.supplierCode ||
      "hotelbeds"
    )
      .toString()
      .toLowerCase();
    detailParams.set("supplier", supplierCodeLower);

    // Navigate with complete state for immediate availability and URL persistence
    navigate(`/hotels/${hotel.id}?${detailParams.toString()}`, {
      state: {
        preselectRate,
        searchParams: standardizedHotelSearchParams,
        roomsSnapshot: hotel?.roomTypes || [],
      },
    });
  };

  // Handle image gallery click
  const handleImageClick = () => {
    // Use unified utilities for consistent rate data creation
    const cheapestRoomData = findCheapestRoom(hotel);
    const preselectRate = createRateData(
      hotel,
      cheapestRoomData.room,
      searchParams,
      selectedCurrency,
      checkInDate,
      checkOutDate,
      totalNights,
      roomsCount,
    );

    const detailParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      detailParams.set(key, value);
    });
    detailParams.set("tab", "gallery");

    navigate(`/hotels/${hotel.id}?${detailParams.toString()}`, {
      state: { preselectRate },
    });
  };

  if (viewMode === "grid") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-gray-200 bg-white rounded-lg group">
        {/* Grid View - Vertical Layout */}
        <div className="flex flex-col h-full">
          {/* Image Gallery - Clickable */}
          <div
            className="relative w-full h-44 flex-shrink-0 cursor-pointer"
            onClick={handleImageClick}
          >
            <img
              src={images[currentImageIndex]}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />

            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-3 right-3 w-8 h-8 p-0 touch-manipulation ${
                isLiked
                  ? "bg-gradient-to-br from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-lg"
                  : "bg-white/90 hover:bg-white text-gray-700 shadow-sm"
              } rounded-full backdrop-blur-sm`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </Button>
          </div>

          {/* Hotel Details */}
          <CardContent className="p-4 flex-1 flex flex-col space-y-3">
            <div className="flex-1">
              <div className="mb-2">
                <h3 className="text-lg font-bold text-gray-900 mb-0.5 group-hover:text-[#003580] transition-colors line-clamp-1">
                  {hotel.name}
                </h3>
                {/* Address in one line directly after hotel name */}
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600 line-clamp-2 leading-tight">
                    {hotelLocation}
                  </span>
                </div>
              </div>

              <div className="flex items-center mb-3">
                <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full mr-2">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
                  <span className="text-xs font-medium text-yellow-700">
                    {hotel.rating}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/hotels/${hotel.id}?tab=reviews`)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  ({hotel.reviewCount || hotel.reviews || 0} reviews)
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {hotel.description}
              </p>

              {/* Features */}
              {hotel.features && hotel.features.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {hotel.features.slice(0, 2).map((feature) => (
                    <Badge
                      key={feature}
                      variant="secondary"
                      className="text-xs"
                    >
                      {feature}
                    </Badge>
                  ))}
                  {hotel.features.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{hotel.features.length - 2} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Amenities */}
              {hotelAmenities.length > 0 && (
                <div className="flex items-center space-x-3 mb-4 overflow-x-auto">
                  {hotelAmenities.slice(0, 3).map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center space-x-1 bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-1.5 rounded-full border border-blue-100 flex-shrink-0 shadow-sm"
                      title={amenity}
                    >
                      {getAmenityIcon(amenity)}
                      <span className="text-xs whitespace-nowrap text-gray-700 font-medium">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Location Line */}
              {hotel.location && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{hotel.location}</span>
                </div>
              )}

              {/* Policy Chips */}
              {(hotel.freeCancellation || hotel.payAtProperty) && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {hotel.freeCancellation && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Free cancellation</span>
                  )}
                  {hotel.payAtProperty && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Pay at property</span>
                  )}
                </div>
              )}

              {/* Room Type Information - Compact */}
              {hotel.availableRoom && (
                <div className="mb-3 pb-2 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {hotel.availableRoom.type}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {hotel.availableRoom.bedType} •{" "}
                    {hotel.availableRoom.rateType}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      ✓ {hotel.availableRoom.paymentTerms}
                    </span>
                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      ✓ {hotel.availableRoom.cancellationPolicy}
                    </span>
                  </div>
                </div>
              )}

              {/* Breakfast Information */}
              <div className="flex items-center gap-1 mb-3">
                <Utensils className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-bold">
                  {hotel.breakfastIncluded ? (
                    <span className="text-green-600">
                      ✓ Breakfast included
                      {hotel.breakfastType ? ` (${hotel.breakfastType})` : ""}
                    </span>
                  ) : (
                    <span className="text-gray-600">
                      Breakfast not included
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Pricing Section - Booking.com Style */}
            <div className="mt-auto bg-gray-50 rounded-lg p-3 border border-gray-100">
              {/* Price Display */}
              <div className="text-right mb-3">
                <div className="text-xl font-bold text-[#003580] mb-1">
                  Total Price
                </div>
                <div className="text-2xl font-bold text-[#003580] mb-1">
                  {formatPrice(totalPriceInclusiveTaxes)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatPrice(currentPrice)} per room/night (incl. taxes)
                </div>
              </div>

              {/* Action Buttons - Native App Optimized */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 py-4 text-sm font-semibold border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white transition-all duration-200 min-h-[48px] rounded-xl active:scale-95 touch-manipulation"
                  onClick={handleViewDetails}
                >
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Mobile-First List View - Optimized for app-like experience
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-gray-200 bg-white rounded-lg group mb-4">
      {/* Mobile-First Design */}
      <div className="block sm:hidden">
        {/* Mobile Layout - Stacked */}
        <div className="flex flex-col">
          {/* Hotel Image - Extended and Clickable */}
          <div
            className="relative w-full h-48 flex-shrink-0 cursor-pointer"
            onClick={handleImageClick}
          >
            <img
              src={images[currentImageIndex]}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />

            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-3 right-3 w-8 h-8 p-0 backdrop-blur-sm rounded-full shadow-lg ${
                isLiked
                  ? "bg-gradient-to-br from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700"
                  : "bg-black/40 hover:bg-black/60 text-white"
              }`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </Button>

            {/* Price Badge */}
            <div className="absolute bottom-3 right-3 bg-white rounded-lg px-2 py-1 shadow-lg">
              <div className="text-sm font-bold text-[#003580]">
                {formatPrice(totalPriceInclusiveTaxes)}
              </div>
            </div>
          </div>

          {/* Hotel Details - Mobile */}
          <CardContent className="p-4 space-y-3">
            <div className="mb-2">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-0.5 line-clamp-1">
                    {hotel.name}
                  </h3>
                  <div className="flex items-start text-gray-600">
                    <MapPin className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 line-clamp-2 leading-tight">
                      {hotelLocation}
                    </span>
                  </div>
                </div>
                <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full ml-2">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-yellow-700">
                    {hotel.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Features - Mobile */}
            {hotel.features && hotel.features.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {hotel.features.slice(0, 3).map((feature) => (
                  <Badge
                    key={feature}
                    variant="secondary"
                    className="text-xs px-2 py-1"
                  >
                    {feature}
                  </Badge>
                ))}
                {hotel.features.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    +{hotel.features.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Breakfast Information - Mobile */}
            <div className="flex items-center gap-1 mb-3">
              <Utensils className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-bold">
                {hotel.breakfastIncluded ? (
                  <span className="text-green-600">
                    ✓ Breakfast included
                    {hotel.breakfastType ? ` (${hotel.breakfastType})` : ""}
                  </span>
                ) : (
                  <span className="text-gray-600">Breakfast not included</span>
                )}
              </span>
            </div>

            {/* Policy Chips - Mobile */}
            {(hotel.freeCancellation || hotel.payAtProperty) && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {hotel.freeCancellation && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Free cancellation</span>
                )}
                {hotel.payAtProperty && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Pay at property</span>
                )}
              </div>
            )}

            {/* Pricing and Actions - Mobile Booking.com Style */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mt-3">
              {/* Price Display */}
              <div className="text-right mb-3">
                <div className="text-sm font-bold text-[#003580] mb-1">
                  Total Price
                </div>
                <div className="text-lg font-bold text-[#003580] mb-1">
                  {formatPrice(totalPriceInclusiveTaxes)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatPrice(currentPrice)} per room/night (incl. taxes)
                </div>
              </div>

              {/* Action Buttons - Native App Optimized */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 py-4 text-sm font-semibold border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white transition-all duration-200 min-h-[48px] rounded-xl active:scale-95 touch-manipulation"
                  onClick={handleViewDetails}
                >
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </div>

      {/* Desktop/Tablet Layout */}
      <div className="hidden sm:flex flex-col sm:flex-row">
        {/* Image Gallery - Extended height and clickable */}
        <div
          className="relative sm:w-48 md:w-56 h-48 sm:h-52 md:h-56 flex-shrink-0 cursor-pointer"
          onClick={handleImageClick}
        >
          <img
            src={images[currentImageIndex]}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />

          {/* Like Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-2 sm:top-4 right-2 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 p-0 touch-manipulation ${
              isLiked
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white/80 hover:bg-white text-gray-700"
            }`}
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart
              className={`w-3 h-3 sm:w-4 sm:h-4 ${isLiked ? "fill-current" : ""}`}
            />
          </Button>
        </div>

        {/* Hotel Details */}
        <CardContent className="flex-1 p-3 flex flex-col">
          {/* Header Section - Compact */}
          <div className="mb-2">
            <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
              {hotel.name}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <MapPin className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                <span className="text-xs text-gray-600 truncate">
                  {hotelLocation}
                </span>
              </div>
              <div className="flex items-center ml-2 gap-2">
                <div className="flex items-center">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-yellow-700 mr-1">
                    {hotel.rating}
                  </span>
                  <button
                    onClick={() => navigate(`/hotels/${hotel.id}?tab=reviews`)}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    ({hotel.reviewCount || hotel.reviews || 0})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features - Single Line */}
          <div className="flex flex-wrap gap-1 mb-2">
            {hotel.features.slice(0, 4).map((feature) => (
              <span
                key={feature}
                className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Room Type - Inline */}
          {hotel.availableRoom && (
            <div className="mb-2 text-xs">
              <span className="font-medium text-gray-900">
                {hotel.availableRoom.type}
              </span>
              <span className="text-gray-600 mx-1">•</span>
              <span className="text-gray-600">
                {hotel.availableRoom.bedType}
              </span>
              <div className="flex gap-1 mt-1">
                <span className="text-green-600 bg-green-50 px-1 py-0.5 rounded text-xs">
                  ✓ {hotel.availableRoom.cancellationPolicy}
                </span>
              </div>
            </div>
          )}

          {/* Breakfast Information - Desktop */}
          <div className="flex items-center gap-1 mb-2">
            <Utensils className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-bold">
              {hotel.breakfastIncluded ? (
                <span className="text-green-600">
                  ✓ Breakfast included
                  {hotel.breakfastType ? ` (${hotel.breakfastType})` : ""}
                </span>
              ) : (
                <span className="text-gray-600">Breakfast not included</span>
              )}
            </span>
          </div>

          {/* Price and Actions - Booking.com Style */}
          <div className="flex items-end justify-between mt-auto pt-2 border-t border-gray-100">
            <div className="flex-1">
              <div className="text-sm font-bold text-[#003580] mb-1">
                Total Price
              </div>
              <div className="text-lg font-bold text-[#003580]">
                {formatPrice(totalPriceInclusiveTaxes)}
              </div>
              <div className="text-xs text-gray-500">
                {formatPrice(currentPrice)} per room/night (incl. taxes)
              </div>
            </div>
            <div className="flex gap-3 ml-3">
              <Button
                variant="outline"
                className="text-sm px-5 py-3 border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white transition-all duration-200 font-semibold min-h-[44px] rounded-xl active:scale-95 touch-manipulation"
                onClick={handleViewDetails}
              >
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
