import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  MapPin,
  Star,
  Clock,
  Users,
  Camera,
  Heart,
  Share2,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  X,
  Ticket,
  CheckCircle,
  Info,
  Building2,
  Mountain,
  Utensils,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SightseeingAttraction {
  id: string;
  name: string;
  location: string;
  images: string[];
  rating: number;
  reviews: number;
  originalPrice: number;
  currentPrice: number;
  description: string;
  category: "museum" | "landmark" | "tour" | "activity" | "food" | "culture" | "adventure";
  duration: string;
  highlights: string[];
  includes: string[];
  availableSlots: {
    date: string;
    times: string[];
  }[];
  features: string[];
  ticketTypes: {
    name: string;
    price: number;
    features: string[];
  }[];
}

interface SightseeingCardProps {
  attraction: SightseeingAttraction;
  onBargainClick: () => void;
  searchParams: URLSearchParams;
  className?: string;
}

export function SightseeingCard({
  attraction,
  onBargainClick,
  searchParams,
  className,
}: SightseeingCardProps) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Get adults count from search params
  const adults = parseInt(searchParams.get("adults") || "2");
  const totalPrice = attraction.currentPrice * adults;
  const originalTotalPrice = attraction.originalPrice * adults;

  // Calculate savings
  const savings = attraction.originalPrice - attraction.currentPrice;
  const savingsPercentage = Math.round((savings / attraction.originalPrice) * 100);

  // Handle star/reviews click to navigate to details with reviews tab
  const handleReviewsClick = () => {
    navigate(`/sightseeing/${attraction.id}?tab=reviews`);
  };

  // Get category display info - matches filter icons exactly
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "landmark":
        return {
          label: "Landmarks & Attractions",
          color: "bg-blue-100 text-blue-800",
          IconComponent: Building2
        };
      case "museum":
        return {
          label: "Museums & Culture",
          color: "bg-purple-100 text-purple-800",
          IconComponent: Camera
        };
      case "tour":
        return {
          label: "Tours & Sightseeing",
          color: "bg-green-100 text-green-800",
          IconComponent: Ticket
        };
      case "adventure":
        return {
          label: "Adventure & Sports",
          color: "bg-yellow-100 text-yellow-800",
          IconComponent: Mountain
        };
      case "food":
        return {
          label: "Food & Dining",
          color: "bg-red-100 text-red-800",
          IconComponent: Utensils
        };
      case "culture":
        return {
          label: "Cultural Experiences",
          color: "bg-indigo-100 text-indigo-800",
          IconComponent: Music
        };
      default:
        return {
          label: "Experience",
          color: "bg-gray-100 text-gray-800",
          IconComponent: Camera
        };
    }
  };

  const categoryInfo = getCategoryInfo(attraction.category);

  // Navigation handlers
  const handleViewDetails = () => {
    const params = new URLSearchParams(searchParams);
    navigate(`/sightseeing/${attraction.id}?${params.toString()}`);
  };

  const handleBookNow = () => {
    const params = new URLSearchParams(searchParams);
    params.set("attractionId", attraction.id);
    navigate(`/sightseeing/booking?${params.toString()}`);
  };

  // Image navigation
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === attraction.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? attraction.images.length - 1 : prev - 1
    );
  };

  // Wishlist toggle
  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  // Share functionality
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: attraction.name,
        text: attraction.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group",
          className
        )}
      >
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Image Section */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={attraction.images[currentImageIndex]}
              alt={attraction.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Image navigation */}
            {attraction.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Image indicators */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {attraction.images.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentImageIndex
                          ? "bg-white"
                          : "bg-white bg-opacity-50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Overlays */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <Badge className={categoryInfo.color}>
                <categoryInfo.IconComponent className="w-3 h-3 mr-1 inline-block" />
                {categoryInfo.label}
              </Badge>
              {savings > 0 && (
                <Badge className="bg-red-500 text-white">
                  Save {savingsPercentage}%
                </Badge>
              )}
            </div>

            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                onClick={toggleWishlist}
                className="w-9 h-9 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm hover:bg-opacity-100 transition-all"
              >
                <Heart 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isWishlisted ? "text-red-500 fill-current" : "text-gray-600"
                  )} 
                />
              </button>
              <button
                onClick={handleShare}
                className="w-9 h-9 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm hover:bg-opacity-100 transition-all"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4">
            {/* Header */}
            <div className="mb-3">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 pr-2">
                  {attraction.name}
                </h3>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{attraction.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{attraction.duration}</span>
                </div>
              </div>

              <div
                className="flex items-center gap-1 mt-1 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleReviewsClick}
                title="Click to view reviews"
              >
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium text-gray-900">{attraction.rating}</span>
                <span className="text-sm text-gray-500">
                  ({attraction.reviews.toLocaleString()} reviews)
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {attraction.description}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-1 mb-4">
              {attraction.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {attraction.features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{attraction.features.length - 3} more
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={onBargainClick}
                className="flex-1 py-3 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] rounded-xl shadow-sm active:scale-95 touch-manipulation transition-all duration-200"
              >
                <TrendingDown className="w-4 h-4" />
                Bargain Now
              </Button>
              <Button
                onClick={handleViewDetails}
                variant="outline"
                className="flex-1 py-3 text-[#003580] border-[#003580] hover:bg-[#003580] hover:text-white font-semibold text-sm min-h-[48px] rounded-xl touch-manipulation transition-all duration-200"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex">
          {/* Image Section */}
          <div className="relative w-80 h-64 overflow-hidden flex-shrink-0">
            <img
              src={attraction.images[currentImageIndex]}
              alt={attraction.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
              onClick={() => setShowImageGallery(true)}
            />
            
            {/* Image navigation */}
            {attraction.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Image count indicator */}
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1} / {attraction.images.length}
                </div>
              </>
            )}

            {/* Overlays */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <Badge className={categoryInfo.color}>
                <categoryInfo.IconComponent className="w-3 h-3 mr-1 inline-block" />
                {categoryInfo.label}
              </Badge>
              {savings > 0 && (
                <Badge className="bg-red-500 text-white">
                  Save {savingsPercentage}%
                </Badge>
              )}
            </div>

            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={toggleWishlist}
                className="w-9 h-9 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm hover:bg-opacity-100 transition-all"
              >
                <Heart 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isWishlisted ? "text-red-500 fill-current" : "text-gray-600"
                  )} 
                />
              </button>
              <button
                onClick={handleShare}
                className="w-9 h-9 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm hover:bg-opacity-100 transition-all"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6">
            <div className="flex justify-between h-full">
              {/* Left Content */}
              <div className="flex-1 pr-6">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {attraction.name}
                  </h3>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{attraction.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{attraction.duration}</span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleReviewsClick}
                    title="Click to view reviews"
                  >
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium text-gray-900">{attraction.rating}</span>
                    <span className="text-sm text-gray-500">
                      ({attraction.reviews.toLocaleString()} reviews)
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {attraction.description}
                </p>

                {/* Highlights */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Highlights:</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {attraction.highlights.slice(0, 4).map((highlight, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        <span className="truncate">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {attraction.features.slice(0, 4).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {attraction.features.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{attraction.features.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Right Content - Pricing & Actions */}
              <div className="w-64 flex flex-col justify-between">
                {/* Pricing */}
                <div className="text-right mb-4">
                  {/* Original price removed per user request */}
                  {/* Price display and savings removed per user request */}
                </div>

                {/* Available Times */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Available times today:</div>
                  <div className="flex flex-wrap gap-1">
                    {attraction.availableSlots[0]?.times.slice(0, 3).map((time, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {time}
                      </Badge>
                    )) || (
                      <span className="text-xs text-gray-500">Check availability</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={onBargainClick}
                    className="w-full py-3 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold flex items-center justify-center gap-2 rounded-xl shadow-sm transition-all duration-200"
                  >
                    <TrendingDown className="w-4 h-4" />
                    Bargain Now
                  </Button>
                  <Button
                    onClick={handleViewDetails}
                    variant="outline"
                    className="w-full py-3 text-[#003580] border-[#003580] hover:bg-[#003580] hover:text-white font-semibold rounded-xl transition-all duration-200"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageGallery(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={attraction.images[currentImageIndex]}
              alt={attraction.name}
              className="max-w-full max-h-full object-contain"
            />
            
            {attraction.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => prev === 0 ? attraction.images.length - 1 : prev - 1);
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => prev === attraction.images.length - 1 ? 0 : prev + 1);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                  {currentImageIndex + 1} / {attraction.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
