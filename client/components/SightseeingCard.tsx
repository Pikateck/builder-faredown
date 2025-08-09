import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  MapPin,
  Star,
  Clock,
  Heart,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Building2,
  Mountain,
  Utensils,
  Music,
  Camera,
  Ticket,
  Calendar,
  Shield,
  Users2,
  Eye,
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
  category:
    | "museum"
    | "landmark"
    | "tour"
    | "activity"
    | "food"
    | "culture"
    | "adventure";
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

  // Handle star/reviews click to navigate to details with reviews tab
  const handleReviewsClick = () => {
    navigate(`/sightseeing/${attraction.id}?tab=reviews`);
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "landmark":
        return Building2;
      case "museum":
        return Camera;
      case "tour":
        return Ticket;
      case "adventure":
        return Mountain;
      case "food":
        return Utensils;
      case "culture":
        return Music;
      default:
        return Camera;
    }
  };

  const CategoryIcon = getCategoryIcon(attraction.category);

  // Navigation handlers
  const handleViewDetails = () => {
    const params = new URLSearchParams(searchParams);
    navigate(`/sightseeing/${attraction.id}?${params.toString()}`);
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

  const totalPrice = attraction.currentPrice * adults;
  const pricePerPerson = attraction.currentPrice;

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group",
          className
        )}
        onClick={handleViewDetails}
      >
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Mobile Image */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={attraction.images[currentImageIndex]}
              alt={attraction.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Mobile Image Navigation */}
            {attraction.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {attraction.images.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        index === currentImageIndex ? "bg-white" : "bg-white bg-opacity-50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Mobile Category Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-white text-gray-800 shadow-sm">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {attraction.category.charAt(0).toUpperCase() + attraction.category.slice(1)}
              </Badge>
            </div>

            {/* Mobile Wishlist */}
            <button
              onClick={toggleWishlist}
              className="absolute top-3 right-3 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm"
            >
              <Heart 
                className={cn(
                  "w-4 h-4",
                  isWishlisted ? "text-red-500 fill-current" : "text-gray-600"
                )} 
              />
            </button>
          </div>

          {/* Mobile Content */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 mb-1">
                  {attraction.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="truncate">{attraction.location}</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewsClick();
                    }}
                    title="Click to view reviews"
                  >
                    <div className="flex items-center bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {attraction.rating}
                    </div>
                    <span className="text-sm text-blue-600 ml-2 font-medium underline decoration-1 underline-offset-2">
                      {attraction.reviews.toLocaleString()} reviews
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {attraction.duration}
                  </div>
                </div>
              </div>
              <div className="text-right ml-3">
                <div className="text-xl font-bold text-gray-900">
                  {formatPrice(totalPrice)}
                </div>
                <div className="text-xs text-gray-600">
                  {formatPrice(pricePerPerson)} per person
                </div>
              </div>
            </div>

            {/* Mobile Features */}
            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Free cancellation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="truncate">{attraction.highlights[0]}</span>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
              <Button
                onClick={(e) => {
                  console.log("🔥 Bargain button clicked!");
                  e.stopPropagation();
                  onBargainClick();
                }}
                size="sm"
                className="flex-1 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold text-sm px-3 py-2 h-auto min-h-[40px] rounded-lg border-0 shadow-sm"
                style={{ backgroundColor: '#febb02', color: 'black' }}
              >
                <TrendingDown className="w-4 h-4 mr-1" />
                Bargain Now
              </Button>
              <Button
                onClick={(e) => {
                  console.log("🔥 View Details button clicked!");
                  e.stopPropagation();
                  handleViewDetails();
                }}
                variant="outline"
                size="sm"
                className="flex-1 border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white font-semibold text-sm px-3 py-2 h-auto min-h-[40px] rounded-lg"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex h-36">
          {/* Desktop Image */}
          <div className="relative w-64 h-full overflow-hidden flex-shrink-0">
            <img
              src={attraction.images[currentImageIndex]}
              alt={attraction.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Desktop Image Navigation */}
            {attraction.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1}/{attraction.images.length}
                </div>
              </>
            )}

            {/* Desktop Category Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-white text-gray-800 shadow-sm">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {attraction.category.charAt(0).toUpperCase() + attraction.category.slice(1)}
              </Badge>
            </div>

            {/* Desktop Wishlist */}
            <button
              onClick={toggleWishlist}
              className="absolute top-3 right-3 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm"
            >
              <Heart 
                className={cn(
                  "w-4 h-4",
                  isWishlisted ? "text-red-500 fill-current" : "text-gray-600"
                )} 
              />
            </button>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 flex">
            {/* Left Content */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 text-xl line-clamp-1 flex-1 pr-4">
                  {attraction.name}
                </h3>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{attraction.location}</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div
                  className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReviewsClick();
                  }}
                  title="Click to view reviews"
                >
                  <div className="flex items-center bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {attraction.rating}
                  </div>
                  <span className="text-sm text-blue-600 ml-2 font-medium underline decoration-1 underline-offset-2">
                    {attraction.reviews.toLocaleString()} reviews
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {attraction.duration}
                </div>
              </div>

              {/* Desktop Key Highlights */}
              <div className="space-y-1">
                {attraction.highlights.slice(0, 2).map((highlight, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="truncate">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Pricing & Actions */}
            <div className="w-48 p-4 border-l border-gray-100 flex flex-col justify-between">
              <div>
                <div className="text-right mb-3">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatPrice(totalPrice)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatPrice(pricePerPerson)} per person
                  </div>
                </div>

                {/* Booking Features */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Free cancellation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>Reserve now, pay later</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBargainClick();
                  }}
                  className="w-full bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold h-9 rounded-md transition-all duration-200 shadow-sm"
                >
                  <TrendingDown className="w-4 h-4 mr-1" />
                  Bargain
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails();
                  }}
                  variant="outline"
                  className="w-full border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white font-semibold h-9 rounded-md transition-all duration-200"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
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
