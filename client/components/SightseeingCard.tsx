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
  const totalPrice = attraction.currentPrice * adults;
  const pricePerPerson = attraction.currentPrice;

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

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group mb-4",
          className
        )}
        onClick={handleViewDetails}
      >
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Mobile Image */}
          <div className="relative h-36 overflow-hidden">
            <img
              src={attraction.images[currentImageIndex]}
              alt={attraction.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-white text-gray-800 shadow-sm">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {attraction.category.charAt(0).toUpperCase() + attraction.category.slice(1)}
              </Badge>
            </div>

            {/* Wishlist */}
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
          <div className="p-4 min-h-[280px] flex flex-col">
            {/* Content arranged in two columns */}
            <div className="flex gap-4 mb-4">
              {/* Left Column - Main Content */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 mb-2">
                  {attraction.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="truncate">{attraction.location}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
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

              {/* Right Column - Price and Buttons */}
              <div className="w-36 text-right flex-shrink-0">
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {formatPrice(totalPrice)}
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  {formatPrice(pricePerPerson)} per person
                </div>

                {/* Mobile Buttons - Below Price */}
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBargainClick();
                    }}
                    style={{
                      backgroundColor: '#febb02',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 8px',
                      fontWeight: '600',
                      fontSize: '11px',
                      minHeight: '38px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <TrendingDown size={12} />
                    Bargain Now
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails();
                    }}
                    style={{
                      backgroundColor: '#003580',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 8px',
                      fontWeight: '600',
                      fontSize: '11px',
                      minHeight: '38px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Eye size={12} />
                    View Details
                  </button>
                </div>
              </div>
            </div>

            {/* Features and Highlights - Left Side */}
            <div className="mb-4 space-y-2 flex-grow">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="truncate">{attraction.highlights[0]}</span>
              </div>
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
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex h-52">
          {/* Desktop Image */}
          <div className="relative w-64 h-full overflow-hidden flex-shrink-0">
            <img
              src={attraction.images[currentImageIndex]}
              alt={attraction.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-white text-gray-800 shadow-sm">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {attraction.category.charAt(0).toUpperCase() + attraction.category.slice(1)}
              </Badge>
            </div>

            {/* Wishlist */}
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
              <h3 className="font-semibold text-gray-900 text-xl line-clamp-1 mb-2">
                {attraction.name}
              </h3>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{attraction.location}</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
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

              {/* Highlights and Features */}
              <div className="space-y-2 mb-4">
                {attraction.highlights.slice(0, 2).map((highlight, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="truncate">{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Features - Moved to Left Side */}
              <div className="space-y-2">
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

            {/* Right Content - Pricing & Actions */}
            <div className="w-64 border-l border-gray-200 bg-gray-50 p-6 flex flex-col justify-between">
              <div>
                <div className="text-right mb-6">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatPrice(totalPrice)}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {formatPrice(pricePerPerson)} per person
                  </div>
                </div>
              </div>
              
              {/* DESKTOP BUTTONS - GUARANTEED VISIBLE */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBargainClick();
                    }}
                    style={{
                      backgroundColor: '#febb02',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      fontWeight: '600',
                      fontSize: '14px',
                      minHeight: '40px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <TrendingDown size={14} />
                    Bargain Now
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails();
                    }}
                    style={{
                      backgroundColor: '#003580',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      fontWeight: '600',
                      fontSize: '14px',
                      minHeight: '40px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Eye size={14} />
                    View Details
                  </button>
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
          </div>
        </div>
      )}
    </>
  );
}
