import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  CheckCircle,
  Calendar,
  Building2,
  Mountain,
  Utensils,
  Music,
  Ticket,
  ArrowLeft,
  MessageSquare,
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

export default function SightseeingDetails() {
  const { attractionId } = useParams<{ attractionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const [attraction, setAttraction] = useState<SightseeingAttraction | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showTimeAlert, setShowTimeAlert] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Check if tab parameter is provided in URL
    const tabParam = searchParams.get("tab");
    return tabParam || "overview";
  });

  // Get adults count from search params
  const adults = parseInt(searchParams.get("adults") || "2");

  // Load attraction data
  useEffect(() => {
    const loadAttraction = async () => {
      setLoading(true);
      setError("");

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Sample attraction data (in real app, this would come from API)
        const sampleAttractions: Record<string, SightseeingAttraction> = {
          "burj-khalifa": {
            id: "burj-khalifa",
            name: "Burj Khalifa: Floors 124 and 125",
            location: "Dubai, UAE",
            images: [
              "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F31c1e4a8ae8d4a1ab766aa8a4417f49e?format=webp&width=800",
              "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F31c1e4a8ae8d4a1ab766aa8a4417f49e?format=webp&width=800",
              "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F31c1e4a8ae8d4a1ab766aa8a4417f49e?format=webp&width=800",
            ],
            rating: 4.6,
            reviews: 45879,
            originalPrice: 189,
            currentPrice: 149,
            description:
              "Skip the line and enjoy breathtaking views from the world's tallest building. Experience Dubai from the clouds with stunning 360-degree panoramic views of the city's iconic skyline, desert, and ocean.",
            category: "landmark",
            duration: "1-2 hours",
            highlights: [
              "360-degree views of Dubai",
              "High-speed elevator experience",
              "Outdoor observation deck",
              "Interactive displays",
              "World's tallest building",
              "Skip-the-line access",
              "Professional photography opportunities",
              "Gift shop access",
            ],
            includes: [
              "Skip-the-line access",
              "Access to floors 124 & 125",
              "Outdoor observation deck",
              "Welcome refreshment",
              "High-speed elevator ride",
              "Interactive displays",
              "Professional guide (optional)",
              "Photography assistance",
            ],
            features: [
              "Skip the line",
              "Audio guide",
              "Mobile ticket",
              "Instant confirmation",
            ],
            availableSlots: [
              {
                date: new Date().toISOString(),
                times: [
                  "09:00",
                  "10:30",
                  "12:00",
                  "13:30",
                  "15:00",
                  "16:30",
                  "18:00",
                  "19:30",
                ],
              },
            ],
            ticketTypes: [
              {
                name: "Standard Admission",
                price: 149,
                features: [
                  "Floors 124 & 125",
                  "Skip-the-line access",
                  "Outdoor deck",
                  "Welcome drink",
                ],
              },
              {
                name: "Prime Time",
                price: 199,
                features: [
                  "Floors 124 & 125",
                  "Skip-the-line access",
                  "Prime viewing times",
                  "Premium refreshments",
                  "Priority elevator",
                ],
              },
              {
                name: "VIP Experience",
                price: 299,
                features: [
                  "Floors 124, 125 & 148",
                  "Private elevator",
                  "VIP lounge access",
                  "Premium refreshments",
                  "Personal guide",
                  "Professional photos",
                ],
              },
            ],
          },
          "dubai-aquarium": {
            id: "dubai-aquarium",
            name: "Dubai Aquarium & Underwater Zoo",
            location: "Dubai, UAE",
            images: [
              "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F0e24b4a5623f4ee6ae7ed5c2b64e2e73?format=webp&width=800",
              "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F0e24b4a5623f4ee6ae7ed5c2b64e2e73?format=webp&width=800",
              "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F0e24b4a5623f4ee6ae7ed5c2b64e2e73?format=webp&width=800",
            ],
            rating: 4.4,
            reviews: 23156,
            originalPrice: 120,
            currentPrice: 89,
            description:
              "Explore one of the world's largest suspended aquariums with over 140 species",
            category: "museum",
            duration: "2-3 hours",
            highlights: [
              "48-meter aquarium tunnel",
              "King Crocodile encounter",
              "Underwater zoo experience",
              "Interactive touch tanks",
              "Shark feeding shows",
              "Educational presentations",
            ],
            includes: [
              "Aquarium tunnel access",
              "Underwater zoo entry",
              "King Crocodile viewing",
              "Touch tank experience",
              "Educational talks",
              "Mobile app guide",
            ],
            features: [
              "Mobile ticket",
              "Audio guide",
              "Photo opportunities",
              "Interactive experience",
            ],
            availableSlots: [
              {
                date: new Date().toISOString(),
                times: [
                  "10:00",
                  "11:00",
                  "12:00",
                  "14:00",
                  "15:00",
                  "16:00",
                  "17:00",
                ],
              },
            ],
            ticketTypes: [
              {
                name: "Aquarium + Zoo",
                price: 89,
                features: [
                  "Aquarium access",
                  "Underwater zoo",
                  "Touch tanks",
                  "Educational talks",
                ],
              },
              {
                name: "Explorer Experience",
                price: 129,
                features: [
                  "All standard features",
                  "Behind-the-scenes tour",
                  "Feeding experience",
                  "VIP guide",
                ],
              },
            ],
          },
        };

        const attractionData = sampleAttractions[attractionId || ""];

        if (!attractionData) {
          setError("Attraction not found");
          return;
        }

        setAttraction(attractionData);
      } catch (err) {
        console.error("Error loading attraction:", err);
        setError("Failed to load attraction details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (attractionId) {
      loadAttraction();
    }
  }, [attractionId]);

  // Get category display info
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "landmark":
        return {
          label: "Landmarks & Attractions",
          color: "bg-blue-100 text-blue-800",
          IconComponent: Building2,
        };
      case "museum":
        return {
          label: "Museums & Culture",
          color: "bg-purple-100 text-purple-800",
          IconComponent: Camera,
        };
      case "tour":
        return {
          label: "Tours & Sightseeing",
          color: "bg-green-100 text-green-800",
          IconComponent: Ticket,
        };
      case "adventure":
        return {
          label: "Adventure & Sports",
          color: "bg-yellow-100 text-yellow-800",
          IconComponent: Mountain,
        };
      case "food":
        return {
          label: "Food & Dining",
          color: "bg-red-100 text-red-800",
          IconComponent: Utensils,
        };
      case "culture":
        return {
          label: "Cultural Experiences",
          color: "bg-indigo-100 text-indigo-800",
          IconComponent: Music,
        };
      default:
        return {
          label: "Experience",
          color: "bg-gray-100 text-gray-800",
          IconComponent: Camera,
        };
    }
  };

  // Navigation handlers
  const handleBookNow = () => {
    console.log("🎫 Book Now clicked!", {
      selectedTime,
      selectedTicketType,
      attractionId: attraction?.id,
      adults
    });

    if (!selectedTime) {
      console.log("❌ No time selected");
      alert("Please select a time slot before booking");
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set("attractionId", attraction?.id || "");
    params.set("ticketType", selectedTicketType.toString());
    params.set("selectedTime", selectedTime);

    // Add visitDate - use the current date if not already set
    if (!params.get("visitDate")) {
      params.set("visitDate", new Date().toISOString().split('T')[0]);
    }

    // Ensure adults parameter is set
    params.set("adults", adults.toString());

    const bookingUrl = `/sightseeing/booking?${params.toString()}`;
    console.log("🚀 Navigating to:", bookingUrl);

    try {
      navigate(bookingUrl);
      console.log("✅ Navigation successful");
    } catch (error) {
      console.error("❌ Navigation failed:", error);
      alert("Navigation failed. Please try again.");
    }
  };

  const handleBackToResults = () => {
    const params = new URLSearchParams(searchParams);
    navigate(`/sightseeing/results?${params.toString()}`);
  };

  // Image navigation
  const nextImage = () => {
    if (attraction) {
      setCurrentImageIndex((prev) =>
        prev === attraction.images.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const prevImage = () => {
    if (attraction) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? attraction.images.length - 1 : prev - 1,
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attraction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !attraction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button
            onClick={handleBackToResults}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Button>
          <ErrorBanner
            message={error || "Attraction not found"}
            onClose={() => setError("")}
          />
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(attraction.category);
  const savings = attraction.originalPrice - attraction.currentPrice;
  const selectedTicket = attraction.ticketTypes[selectedTicketType];
  const totalPrice = selectedTicket.price * adults;
  const originalTotalPrice = attraction.originalPrice * adults;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          onClick={handleBackToResults}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Image Gallery */}
          <div className="relative h-96 overflow-hidden">
            <img
              src={attraction.images[currentImageIndex]}
              alt={attraction.name}
              className="w-full h-full object-cover"
            />

            {attraction.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded">
                  {currentImageIndex + 1} / {attraction.images.length}
                </div>
              </>
            )}

            {/* Overlays */}
            <div className="absolute top-4 left-4">
              <Badge className={categoryInfo.color}>
                <categoryInfo.IconComponent className="w-4 h-4 mr-2" />
                {categoryInfo.label}
              </Badge>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm hover:bg-opacity-100 transition-all"
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isWishlisted
                      ? "text-red-500 fill-current"
                      : "text-gray-600",
                  )}
                />
              </button>
              <button className="w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm hover:bg-opacity-100 transition-all">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {attraction.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>{attraction.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>{attraction.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-medium text-gray-900">
                        {attraction.rating}
                      </span>
                      <span className="text-sm">
                        ({attraction.reviews.toLocaleString()} reviews)
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-lg leading-relaxed">
                    {attraction.description}
                  </p>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={cn(
                        "py-2 px-1 border-b-2 font-medium text-sm",
                        activeTab === "overview"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className={cn(
                        "py-2 px-1 border-b-2 font-medium text-sm",
                        activeTab === "reviews"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Reviews ({attraction.reviews.toLocaleString()})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Highlights */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Highlights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {attraction.highlights.map((highlight, index) => (
                          <div
                            key={index}
                            className="flex items-center text-gray-600"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What's Included */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        What's Included
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {attraction.includes.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center text-gray-600"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Features
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {attraction.features.map((feature, index) => (
                          <Badge key={index} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div id="reviews-section" className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900">
                        Visitor Reviews
                      </h2>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg min-h-[44px] active:scale-95 transition-all duration-200 touch-manipulation">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Write Review
                      </Button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {attraction.rating}
                      </div>
                      <div className="text-sm text-gray-600">
                        Based on {attraction.reviews.toLocaleString()} reviews
                      </div>
                      <div className="flex justify-center mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(attraction.rating)
                                ? "text-blue-600 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Recent Reviews */}
                    <div className="space-y-3">
                      {[
                        {
                          name: "Sarah M.",
                          date: "2 days ago",
                          rating: 5,
                          comment:
                            "Incredible experience! The views were breathtaking and the staff was amazing.",
                        },
                        {
                          name: "John D.",
                          date: "1 week ago",
                          rating: 4,
                          comment:
                            "Great attraction, well organized and worth every penny. Highly recommend!",
                        },
                        {
                          name: "Emily R.",
                          date: "2 weeks ago",
                          rating: 5,
                          comment:
                            "Perfect for families. Kids loved it and we got some amazing photos.",
                        },
                        {
                          name: "Michael K.",
                          date: "3 weeks ago",
                          rating: 4,
                          comment:
                            "Skip-the-line tickets were worth it. Saved us hours of waiting.",
                        },
                      ].map((review, idx) => (
                        <div
                          key={idx}
                          className="border-b border-gray-100 pb-3 last:border-b-0"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-gray-900">
                              {review.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {review.date}
                            </span>
                          </div>
                          <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? "text-blue-600 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>

                    {/* Write Another Review Button */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 font-medium py-3 min-h-[48px] active:scale-95 transition-all duration-200 touch-manipulation"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Share Your Experience
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Booking */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6 sticky top-6">
                  {/* Ticket Types */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Choose Ticket Type
                    </h3>
                    <div className="space-y-3">
                      {attraction.ticketTypes.map((ticket, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-4 border rounded-lg cursor-pointer transition-all",
                            selectedTicketType === index
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300",
                          )}
                          onClick={() => setSelectedTicketType(index)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">
                              {ticket.name}
                            </h4>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {formatPrice(ticket.price * adults)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatPrice(ticket.price)} per person
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {ticket.features.map((feature, idx) => (
                              <div
                                key={idx}
                                className="text-sm text-gray-600 flex items-center"
                              >
                                <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Available Times */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Available Today
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {attraction.availableSlots[0]?.times.map(
                        (time, index) => (
                          <Button
                            key={index}
                            variant={
                              selectedTime === time ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => {
                              console.log("⏰ Time selected:", time);
                              setSelectedTime(time);
                            }}
                            className={
                              selectedTime === time
                                ? "bg-[#003580] text-white"
                                : ""
                            }
                          >
                            {time}
                          </Button>
                        ),
                      )}
                    </div>
                    {selectedTime && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        Selected: {selectedTime}
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="mb-6 p-4 bg-white rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">
                        Total for {adults} adult{adults > 1 ? "s" : ""}
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatPrice(selectedTicket.price)} per person
                    </div>
                    {savings > 0 && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        You save {formatPrice(savings * adults)} total
                      </div>
                    )}
                  </div>

                  {/* Book Button */}
                  <Button
                    onClick={handleBookNow}
                    className="w-full py-4 text-lg bg-[#003580] hover:bg-[#002a66] text-white"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
