import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  calculateTotalPrice,
  formatPriceWithSymbol,
  formatLocalPrice,
  calculateNights,
} from "@/lib/pricing";

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
}

interface HotelCardProps {
  hotel: Hotel;
  onBargainClick: (hotel: Hotel, searchParams?: URLSearchParams) => void;
  viewMode?: "grid" | "list";
}

const getAmenityIcon = (amenity: string) => {
  const iconClass = "w-5 h-5 text-blue-600 drop-shadow-sm";
  const icons: Record<string, React.ReactNode> = {
    wifi: <Wifi className={iconClass} />,
    parking: <Car className={iconClass} />,
    restaurant: <Coffee className={iconClass} />,
    gym: <Dumbbell className={iconClass} />,
    pool: <Waves className={iconClass} />,
    spa: <Sparkles className={iconClass} />,
    "air conditioning": <Wind className={iconClass} />,
    "room service": <Building2 className={iconClass} />,
  };

  return icons[amenity.toLowerCase()] || <Coffee className={iconClass} />;
};

export function HotelCard({
  hotel,
  onBargainClick,
  viewMode = "list",
}: HotelCardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedCurrency, formatPrice } = useCurrency();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Helper functions to extract data from the hotel object
  const getHotelImages = (): string[] => {
    if (hotel.images && hotel.images.length > 0) {
      return hotel.images.map((img) =>
        typeof img === "string" ? img : img.url || img,
      );
    }
    return [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
    ];
  };

  const getHotelLocation = (): string => {
    if (hotel.location) return hotel.location;
    if (hotel.address?.city) return hotel.address.city;
    if (hotel.location?.city) return hotel.location.city;
    return "Location not specified";
  };

  const getHotelPrice = (): number => {
    if (hotel.currentPrice) return hotel.currentPrice;
    if (hotel.roomTypes && hotel.roomTypes.length > 0) {
      return hotel.roomTypes[0].pricePerNight || hotel.roomTypes[0].price || 0;
    }
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

      // Extract destination code from URL params
      const destinationCode = searchParams.get("destination") || "DXB";
      const destinationName =
        searchParams.get("destinationName") || hotelLocation || "Unknown";

      // Navigate to booking page with hotel and search details
      const bookingParams = new URLSearchParams({
        hotelId: String(hotel.id),
        destinationCode,
        destinationName,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        rooms: roomsCount.toString(),
        adults: searchParams.get("adults") || "2",
        children: searchParams.get("children") || "0",
        currency: selectedCurrency?.code || "INR",
        totalPrice: priceCalculation.total.toString(),
        hotelName: hotel.name,
        hotelLocation: hotelLocation,
        hotelRating: hotel.rating.toString(),
      });

      navigate(`/booking/hotel?${bookingParams.toString()}`);
    } catch (error) {
      console.error("Quick booking error:", error);
    } finally {
      setIsBooking(false);
    }
  };

  // Handle view details action
  const handleViewDetails = () => {
    // Navigate to hotel details page with search context
    const detailParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      detailParams.set(key, value);
    });

    navigate(`/hotels/${hotel.id}?${detailParams.toString()}`);
  };

  if (viewMode === "grid") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-gray-200 bg-white rounded-lg group">
        {/* Grid View - Vertical Layout */}
        <div className="flex flex-col h-full">
          {/* Image Gallery */}
          <div className="relative w-full h-48 flex-shrink-0">
            <img
              src={images[currentImageIndex]}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 w-8 h-8 p-0 touch-manipulation"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 w-8 h-8 p-0 touch-manipulation"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Image Dots */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors touch-manipulation ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-3 right-3 w-8 h-8 p-0 touch-manipulation ${
                isLiked
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white/80 hover:bg-white text-gray-700"
              }`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </Button>
          </div>

          {/* Hotel Details */}
          <CardContent className="p-4 flex-1 flex flex-col space-y-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#003580] transition-colors line-clamp-2">
                {hotel.name}
              </h3>

              {/* Address and Reviews directly below hotel name */}
              <div className="flex items-center text-gray-600 mb-1">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="text-xs truncate">{hotelLocation}</span>
              </div>

              <div className="flex items-center mb-3">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="text-xs font-medium mr-1">{hotel.rating}</span>
                <span className="text-xs text-gray-500">
                  ({hotel.reviewCount || hotel.reviews || 0} reviews)
                </span>
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
                      className="flex items-center space-x-1 text-gray-600 flex-shrink-0"
                      title={amenity}
                    >
                      {getAmenityIcon(amenity)}
                      <span className="text-xs whitespace-nowrap">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing and Actions */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(totalPriceInclusiveTaxes)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Total Price (All Inclusive)
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPrice(perNightInclusiveTaxes)} per room per night
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1 py-3 text-sm font-semibold border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={handleViewDetails}
                >
                  View
                </Button>
                <Button
                  onClick={() => onBargainClick(hotel, searchParams)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
                >
                  Bargain
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
          {/* Hotel Image - Full Width */}
          <div className="relative w-full h-48 flex-shrink-0">
            <img
              src={images[currentImageIndex]}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />

            {/* Image Navigation for Mobile */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 p-0 backdrop-blur-sm"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 p-0 backdrop-blur-sm"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Image Dots */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-3 right-3 w-8 h-8 p-0 backdrop-blur-sm ${
                isLiked
                  ? "bg-red-500 text-white hover:bg-red-600"
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
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                  {hotel.name}
                </h3>
                <div className="flex items-center text-gray-600 mb-1">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="text-sm truncate">{hotelLocation}</span>
                </div>
              </div>
              <div className="flex items-center ml-2">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="text-sm font-medium">{hotel.rating}</span>
              </div>
            </div>

            {/* Features - Mobile */}
            {hotel.features && hotel.features.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {hotel.features.slice(0, 3).map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs px-2 py-1">
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

            {/* Pricing and Actions - Mobile */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">
                  {formatPrice(perNightInclusiveTaxes)} per night • {totalNights} nights
                </div>
                <div className="text-xs text-gray-400">incl. taxes & fees</div>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-4 py-2 text-xs font-semibold border-blue-600 text-blue-600"
                  onClick={handleViewDetails}
                >
                  View
                </Button>
                <Button
                  onClick={() => onBargainClick(hotel, searchParams)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs"
                >
                  Bargain
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </div>

      {/* Desktop/Tablet Layout */}
      <div className="hidden sm:flex flex-col sm:flex-row">
        {/* Image Gallery */}
        <div className="relative sm:w-64 md:w-80 h-48 sm:h-64 md:h-80 flex-shrink-0">
          <img
            src={images[currentImageIndex]}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />

          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 w-7 h-7 sm:w-8 sm:h-8 p-0 touch-manipulation"
                onClick={prevImage}
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 w-7 h-7 sm:w-8 sm:h-8 p-0 touch-manipulation"
                onClick={nextImage}
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>

              {/* Image Dots */}
              <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {hotel.images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors touch-manipulation ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </>
          )}

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
        <CardContent className="flex-1 p-4 md:p-6 flex flex-col space-y-4">
          <div className="mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 group-hover:text-[#003580] transition-colors line-clamp-2">
              {hotel.name}
            </h3>

            {/* Address and Reviews directly below hotel name */}
            <div className="flex items-center text-gray-600 mb-1">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                {hotelLocation}
              </span>
            </div>

            <div className="flex items-center mb-2">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="text-xs sm:text-sm font-medium mr-1">
                {hotel.rating}
              </span>
              <span className="text-xs sm:text-sm text-gray-500">
                ({hotel.reviewCount || hotel.reviews || 0} reviews)
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
            {hotel.description}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
            {hotel.features.slice(0, 3).map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {hotel.features.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{hotel.features.length - 3} more
              </Badge>
            )}
          </div>

          {/* Amenities */}
          <div className="flex items-center space-x-2 sm:space-x-4 mb-4 sm:mb-6 overflow-x-auto">
            {hotel.amenities.slice(0, 4).map((amenity) => (
              <div
                key={amenity}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-full border border-blue-100 hover:border-blue-200 transition-all duration-200 flex-shrink-0 shadow-sm"
                title={amenity}
              >
                {getAmenityIcon(amenity)}
                <span className="text-xs hidden sm:inline whitespace-nowrap text-gray-700 font-medium">
                  {amenity}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xl sm:text-3xl font-bold text-[#003580]">
                  {formatPrice(totalPriceInclusiveTaxes)}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Total Price (All Inclusive)
              </div>
              <div className="text-xs text-gray-500">
                {formatPrice(perNightInclusiveTaxes)} per room per night
              </div>
            </div>

            <div className="flex space-x-2 flex-shrink-0">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none py-2 px-4 font-semibold border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={handleViewDetails}
              >
                View
              </Button>

              <Button
                onClick={() => onBargainClick(hotel, searchParams)}
                className="flex-1 sm:flex-none py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Bargain
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
