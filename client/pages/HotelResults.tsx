import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDateContext } from "@/contexts/DateContext";
import { Header } from "@/components/Header";
import { HotelCard } from "@/components/HotelCard";
import { BookingSearchForm } from "@/components/BookingSearchForm";
import { FlightStyleBargainModal } from "@/components/FlightStyleBargainModal";
import { EnhancedFilters } from "@/components/EnhancedFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hotelsService } from "@/services/hotelsService";
import type { Hotel as HotelType } from "@/services/hotelsService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MapPin,
  CalendarIcon,
  Users,
  Star,
  Filter,
  TrendingDown,
  Grid,
  List,
  ChevronLeft,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPriceWithSymbol, calculateNights } from "@/lib/pricing";
import {
  MobileCityDropdown,
  MobileDatePicker,
  MobileTravelers,
} from "@/components/MobileDropdowns";
import { MobileNavBar } from "@/components/mobile/MobileNavBar";

// Use the Hotel type from hotelsService for consistency
interface Hotel extends HotelType {
  originalPrice?: number;
  currentPrice?: number;
}

export default function HotelResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();
  const {
    departureDate,
    returnDate,
    setDepartureDate,
    setReturnDate,
    formatDisplayDate,
    loadDatesFromParams,
  } = useDateContext();
  const [sortBy, setSortBy] = useState("recommended");
  const [priceRange, setPriceRange] = useState([0, 25000]); // Appropriate range for INR (₹0 - ₹25,000)
  const [selectedRating, setSelectedRating] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [isLiveData, setIsLiveData] = useState(false);
  const [showSearchEdit, setShowSearchEdit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Edit modal states
  const [editDestination, setEditDestination] = useState("Dubai");
  const [editTravelers, setEditTravelers] = useState({
    adults: 2,
    children: 0,
  });
  const [editRooms, setEditRooms] = useState(1);
  const [showEditDestination, setShowEditDestination] = useState(false);
  const [showEditDates, setShowEditDates] = useState(false);
  const [showEditGuests, setShowEditGuests] = useState(false);

  // Get search parameters
  const destination = searchParams.get("destination") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "2";
  const children = searchParams.get("children") || "0";
  const rooms = searchParams.get("rooms") || "1";

  // City data for hotel destinations
  const cityData = {
    Mumbai: {
      code: "BOM",
      name: "Mumbai",
      airport: "Mumbai, Maharashtra, India",
      fullName: "Mumbai, Maharashtra, India",
    },
    Delhi: {
      code: "DEL",
      name: "Delhi",
      airport: "New Delhi, Delhi, India",
      fullName: "New Delhi, Delhi, India",
    },
    Dubai: {
      code: "DXB",
      name: "Dubai",
      airport: "Dubai, United Arab Emirates",
      fullName: "Dubai, United Arab Emirates",
    },
    "Abu Dhabi": {
      code: "AUH",
      name: "Abu Dhabi",
      airport: "Abu Dhabi, United Arab Emirates",
      fullName: "Abu Dhabi, United Arab Emirates",
    },
    Singapore: {
      code: "SIN",
      name: "Singapore",
      airport: "Singapore, Singapore",
      fullName: "Singapore, Singapore",
    },
  };

  // Initialize edit states from current search params
  React.useEffect(() => {
    setEditDestination(
      searchParams.get("destinationName") || destination || "Dubai",
    );
    setEditTravelers({
      adults: parseInt(adults) || 2,
      children: parseInt(children) || 0,
    });
    setEditRooms(parseInt(rooms) || 1);
  }, [searchParams, destination, adults, children, rooms]);

  // Load hotels from live Hotelbeds API and dates from URL params
  useEffect(() => {
    loadDatesFromParams(searchParams);
    loadHotels();
  }, [searchParams, selectedCurrency, loadDatesFromParams]);

  // Helper function to transform Hotelbeds images to usable URLs
  const transformHotelImages = (images: any[]): string[] => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      // Fallback to high-quality hotel images
      return [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&auto=format",
      ];
    }

    // Transform Hotelbeds image URLs
    const processedImages = images
      .map((img: any) => {
        if (typeof img === "string") {
          // If it's already a URL string
          return img.includes("http")
            ? img
            : `https://photos.hotelbeds.com/giata/original/${img}`;
        } else if (img && img.path) {
          // Hotelbeds image object with path
          return `https://photos.hotelbeds.com/giata/original/${img.path}`;
        } else if (img && img.url) {
          // Image object with URL
          return img.url;
        }
        return null;
      })
      .filter(Boolean);

    // Ensure we have at least 2 images, add fallbacks if needed
    if (processedImages.length === 0) {
      return [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&auto=format",
      ];
    } else if (processedImages.length === 1) {
      processedImages.push(
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&auto=format",
      );
    }

    return processedImages.slice(0, 6); // Limit to 6 images max
  };

  const loadHotels = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchRequest = {
        destination: destination || "DXB", // Use destination code
        checkIn: departureDate
          ? departureDate.toISOString()
          : checkIn || new Date().toISOString(),
        checkOut: returnDate
          ? returnDate.toISOString()
          : checkOut ||
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        rooms: parseInt(rooms) || 1,
        adults: parseInt(adults) || 2,
        children: parseInt(children) || 0,
        currencyCode: selectedCurrency?.code || "INR",
      };

      console.log(
        "🔴 Searching live Hotelbeds API with params:",
        searchRequest,
      );

      // Try live Hotelbeds API first
      const liveResults = await hotelsService.searchHotelsLive(searchRequest);

      if (liveResults.length > 0) {
        console.log(
          "✅ Using LIVE Hotelbeds data:",
          liveResults.length,
          "hotels",
        );
        setHotels(transformHotelbedsData(liveResults));
        setTotalResults(liveResults.length);
        setIsLiveData(true);
      } else {
        console.log("⚠️ No live data available, using enhanced mock data");
        // Try fallback API first
        const mockResults =
          await hotelsService.searchHotelsFallback(searchRequest);

        if (mockResults.length > 0) {
          setHotels(transformHotelbedsData(mockResults));
          setTotalResults(mockResults.length);
          setIsLiveData(false);
          console.log(
            "✅ Using fallback API data:",
            mockResults.length,
            "hotels",
          );
        } else {
          // If no fallback data, use static mock data
          console.log("🔄 Using static mock data");
          setHotels(getMockHotels());
          setTotalResults(getMockHotels().length);
          setIsLiveData(false);
        }
      }
    } catch (err) {
      console.error("Live Hotelbeds search failed:", err);
      setError("Failed to load hotels. Please try again.");

      // Emergency fallback to static mock data
      console.log("🔄 Using emergency fallback data");
      setHotels(getMockHotels());
      setTotalResults(getMockHotels().length);
      setIsLiveData(false);
    } finally {
      setLoading(false);
    }
  };

  // Transform Hotelbeds API data to frontend format
  const transformHotelbedsData = (hotelbedsData: any[]): Hotel[] => {
    return hotelbedsData.map((hotel, index) => ({
      id: hotel.id || hotel.code || `hotel-${index}`,
      name: hotel.name || `Hotel ${destination}`,
      location: hotel.address?.street
        ? `${hotel.address.street}, ${hotel.address.city || destination}, ${hotel.address.country || "United Arab Emirates"}`
        : `${hotel.address?.city || destination}, ${hotel.address?.country || "United Arab Emirates"}`,
      images: transformHotelImages(hotel.images),
      rating: hotel.rating || hotel.reviewScore || 4.0,
      reviews: hotel.reviewCount || 150,
      originalPrice:
        hotel.originalPrice || Math.round((hotel.currentPrice || 120) * 1.3), // 30% higher original price
      currentPrice: hotel.currentPrice || 120,
      description: hotel.description || `Experience luxury at ${hotel.name}`,
      amenities: hotel.amenities || ["WiFi", "Pool", "Restaurant"],
      features: hotel.features || ["City View", "Business Center"],
      roomTypes: hotel.rooms
        ? hotel.rooms.map((room: any) => ({
            name: room.name || "Standard Room",
            price: room.price || hotel.currentPrice || 120,
            features: room.features || ["Double Bed", "City View"],
          }))
        : [
            {
              name: "Standard Room",
              price: hotel.currentPrice || 120,
              features: ["Double Bed", "City View"],
            },
          ],
      // Additional fields for compatibility
      address: hotel.address || {
        street: `Near ${destination} City Center`,
        city: destination || "Dubai",
        country: "United Arab Emirates",
        postalCode: "00000",
      },
      starRating: hotel.rating || 4,
      reviewCount: hotel.reviewCount || 150,
      contact: {
        phone: "+1234567890",
        email: "info@hotel.com",
      },
      priceRange: {
        min: hotel.currentPrice || 120,
        max:
          hotel.originalPrice || Math.round((hotel.currentPrice || 120) * 1.25),
        currency: hotel.currency || selectedCurrency?.code || "INR",
      },
      policies: {
        checkIn: "15:00",
        checkOut: "11:00",
        cancellation: "Free cancellation until 24 hours",
        children: "Children welcome",
        pets: "Pets not allowed",
        smoking: "Non-smoking",
      },
      // Add breakfast information
      breakfastIncluded: hotel.breakfastIncluded || Math.random() > 0.5, // Random for demo
      breakfastType:
        hotel.breakfastType ||
        (Math.random() > 0.5 ? "Continental Buffet" : "American Breakfast"),
      // Add room information for live data
      availableRoom: hotel.availableRoom || {
        type: "1 X Standard Room",
        bedType: "Double bed",
        rateType: "Flexible Rate",
        paymentTerms: "No prepayment needed",
        cancellationPolicy: "Free cancellation",
      },
    }));
  };

  // Handle search function
  const handleSearch = () => {
    loadHotels();
  };

  // Mock hotel data (fallback if API fails)
  const getMockHotels = (): Hotel[] => [
    {
      id: 1,
      name: `Grand Hotel ${searchParams.get("destinationName")?.split(',')[0] || destination || "Dubai"}`,
      location: `City Center, ${searchParams.get("destinationName") || destination || "Dubai, United Arab Emirates"}`,
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600",
      ],
      rating: 4.8,
      reviews: 1234,
      originalPrice: 8500, // ₹8,500 per night
      currentPrice: 6750, // ₹6,750 per night
      description:
        "Experience luxury in the heart of the city with stunning views, world-class amenities, and exceptional service.",
      amenities: ["WiFi", "Parking", "Restaurant", "Gym", "Pool", "Spa"],
      features: ["City View", "Business Center", "Concierge", "Room Service"],
      roomTypes: [
        {
          name: "Standard Room",
          price: 6750, // ₹6,750 per night
          features: ["King Bed", "City View", "Free WiFi"],
        },
        {
          name: "Deluxe Suite",
          price: 9500, // ₹9,500 per night
          features: ["Living Area", "Ocean View", "Mini Bar"],
        },
        {
          name: "Presidential Suite",
          price: 15000, // ₹15,000 per night
          features: ["2 Bedrooms", "Private Balcony", "Butler Service"],
        },
      ],
      availableRoom: {
        type: "1 X Twin Classic",
        bedType: "Twin bed",
        rateType: "Non Refundable Rate",
        paymentTerms: "No prepayment needed",
        cancellationPolicy: "Free cancellation",
      },
      breakfastIncluded: true,
      breakfastType: "Continental Buffet",
    },
    {
      id: 2,
      name: `Business Hotel ${searchParams.get("destinationName")?.split(',')[0] || destination || "Dubai"}`,
      location: `Business District, ${searchParams.get("destinationName") || destination || "Dubai, United Arab Emirates"}`,
      images: [
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
      ],
      rating: 4.6,
      reviews: 856,
      originalPrice: 12000, // ₹12,000 per night
      currentPrice: 9500, // ₹9,500 per night
      description:
        "Beachfront paradise with pristine white sand beaches, crystal clear waters, and tropical luxury.",
      amenities: ["Beach Access", "Spa", "Restaurant", "Bar", "WiFi", "Pool"],
      features: [
        "Beachfront",
        "All-Inclusive Available",
        "Water Sports",
        "Sunset Views",
      ],
      roomTypes: [
        {
          name: "Ocean View Room",
          price: 9500, // ₹9,500 per night
          features: ["Queen Bed", "Ocean View", "Balcony"],
        },
        {
          name: "Beach Villa",
          price: 18000, // ₹18,000 per night
          features: ["Private Beach Access", "Outdoor Shower", "Terrace"],
        },
      ],
      availableRoom: {
        type: "1 X Queen Superior",
        bedType: "Queen bed",
        rateType: "Flexible Rate",
        paymentTerms: "Pay at the property",
        cancellationPolicy: "Free cancellation until 2 days before",
      },
      breakfastIncluded: false,
    },
    {
      id: 3,
      name: "Mountain Lodge",
      location: "Al Habtoor City, Business Bay, Dubai, United Arab Emirates",
      images: [
        "https://images.unsplash.com/photo-1549294413-26f195200c16?w=600",
        "https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?w=600",
      ],
      rating: 4.9,
      reviews: 567,
      originalPrice: 7500, // ₹7,500 per night
      currentPrice: 5800, // ���5,800 per night
      description:
        "Cozy mountain retreat with fireplace, ski-in/ski-out access, and breathtaking alpine views.",
      amenities: ["Ski Access", "Fireplace", "Spa", "Restaurant", "WiFi"],
      features: ["Ski-in/Ski-out", "Mountain Views", "Fireplace", "Hot Tub"],
      roomTypes: [
        {
          name: "Standard Room",
          price: 5800, // ₹5,800 per night
          features: ["Fireplace", "Mountain View", "Cozy Decor"],
        },
        {
          name: "Alpine Suite",
          price: 7500, // ₹7,500 per night
          features: ["Separate Living Area", "Hot Tub", "Ski Storage"],
        },
      ],
      availableRoom: {
        type: "1 X King Premium",
        bedType: "King bed",
        rateType: "Best Available Rate",
        paymentTerms: "Prepayment required",
        cancellationPolicy: "Free cancellation",
      },
      breakfastIncluded: true,
      breakfastType: "American Breakfast",
    },
  ];

  // Filter and sort hotels
  const filteredAndSortedHotels = React.useMemo(() => {
    let filtered = hotels.filter((hotel) => {
      // Price range filter - use currentPrice which is available in mock data
      const price =
        hotel.currentPrice ||
        hotel.priceRange?.min ||
        hotel.roomTypes?.[0]?.pricePerNight ||
        0;
      if (price < priceRange[0] || price > priceRange[1]) return false;

      // Rating filter
      if (
        selectedRating.length > 0 &&
        !selectedRating.includes(Math.floor(hotel.rating))
      )
        return false;

      // Amenities filter - handle both string arrays and object arrays
      if (selectedAmenities.length > 0) {
        const hotelAmenities =
          hotel.amenities?.map((a) => (typeof a === "string" ? a : a.name)) ||
          [];
        if (
          !selectedAmenities.some((amenity) => hotelAmenities.includes(amenity))
        )
          return false;
      }

      return true;
    });

    // Sort hotels
    switch (sortBy) {
      case "price-low":
        filtered.sort(
          (a, b) =>
            (a.currentPrice || a.priceRange?.min || 0) -
            (b.currentPrice || b.priceRange?.min || 0),
        );
        break;
      case "price-high":
        filtered.sort(
          (a, b) =>
            (b.currentPrice || b.priceRange?.min || 0) -
            (a.currentPrice || a.priceRange?.min || 0),
        );
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "recommended":
      default:
        filtered.sort(
          (a, b) =>
            b.rating * (b.reviewCount || b.reviews || 1) -
            a.rating * (a.reviewCount || a.reviews || 1),
        );
        break;
    }

    return filtered;
  }, [hotels, priceRange, selectedRating, selectedAmenities, sortBy]);

  const handleBargainClick = (
    hotel: Hotel,
    currentSearchParams?: URLSearchParams,
  ) => {
    setSelectedHotel(hotel);
    setIsBargainModalOpen(true);
  };

  const handleClearFilters = () => {
    setPriceRange([0, 25000]); // Appropriate range for INR (₹0 - ₹25,000)
    setSelectedRating([]);
    setSelectedAmenities([]);
    setSortBy("recommended");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Layout */}
      <div className="md:hidden">
        <MobileNavBar
          title={searchParams.get("destinationName") || destination || "Dubai"}
          subtitle={`${filteredAndSortedHotels.length} hotels found`}
          onBack={() => navigate("/hotels")}
          rightActions={
            isLiveData && (
              <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
            )
          }
        />

        {/* Hotel Search Summary Bar with Edit Button */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="font-medium text-gray-900 truncate">
                    {searchParams.get("destinationName") ||
                      destination ||
                      "Dubai"}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                <div className="flex items-center">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  <span>
                    {departureDate
                      ? formatDisplayDate(departureDate)
                      : checkIn || "Today"}{" "}
                    -{" "}
                    {returnDate
                      ? formatDisplayDate(returnDate)
                      : checkOut || "Tomorrow"}{" "}
                    (
                    {(() => {
                      const checkInDate =
                        departureDate ||
                        (checkIn ? new Date(checkIn) : new Date());
                      const checkOutDate =
                        returnDate ||
                        (checkOut
                          ? new Date(checkOut)
                          : new Date(Date.now() + 24 * 60 * 60 * 1000));
                      const nights = calculateNights(checkInDate, checkOutDate);
                      return `${nights} night${nights > 1 ? "s" : ""}`;
                    })()}
                    )
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  <span>
                    {adults} adult{parseInt(adults) > 1 ? "s" : ""}
                    {parseInt(children) > 0
                      ? `, ${children} child${parseInt(children) > 1 ? "ren" : ""}`
                      : ""}
                    , {rooms} room{parseInt(rooms) > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 font-medium px-3 py-1 h-auto ml-2"
              onClick={() => setShowSearchEdit(true)}
            >
              Edit
            </Button>
          </div>
        </div>

        {/* Mobile Filter Bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 py-3 rounded-xl flex items-center justify-center gap-2 font-medium"
            onClick={() => setShowFilters(true)}
          >
            <Filter className="w-4 h-4" />
            Filter Hotels
          </Button>
        </div>

        {/* Mobile Sort Bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-700 mr-2">
              Sort by:
            </span>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full h-12 px-4 py-3 border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <SelectValue placeholder="Sort hotels..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  Top picks
                </div>
              </SelectItem>
              <SelectItem value="price-low">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                      />
                    </svg>
                  </div>
                  Price: Low to High
                </div>
              </SelectItem>
              <SelectItem value="price-high">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gradient-to-br from-red-400 to-red-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 13l-5 5m0 0l-5-5m5 5V6"
                      />
                    </svg>
                  </div>
                  Price: High to Low
                </div>
              </SelectItem>
              <SelectItem value="rating">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  Best rated
                </div>
              </SelectItem>
              <SelectItem value="stars-high">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  Star rating
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Hotel List */}
        <div className="px-3 py-2 space-y-3 pb-24">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003580] mx-auto"></div>
              <p className="text-gray-600 text-sm mt-4">Searching hotels...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hotels found
              </h3>
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
          ) : filteredAndSortedHotels.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hotels found
              </h3>
              <p className="text-gray-600 text-sm">
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : (
            filteredAndSortedHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onBargainClick={handleBargainClick}
                viewMode="list"
              />
            ))
          )}
        </div>

        {/* Mobile Edit Search Modal */}
        {showSearchEdit && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowSearchEdit(false)}
            />
            <div className="fixed inset-0 z-50 flex items-start">
              <div className="w-full bg-white rounded-b-3xl shadow-2xl max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-[#003580] text-white p-4 relative rounded-b-xl">
                  <button
                    onClick={() => setShowSearchEdit(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <h2 className="text-xl font-bold">Edit Hotel Search</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Modify your search criteria
                  </p>
                </div>

                {/* Interactive Search Form */}
                <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)]">
                  {/* Destination */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <button
                      onClick={() => setShowEditDestination(true)}
                      className="w-full text-left"
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        Destination
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-[#003580]" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {editDestination}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cityData[editDestination]?.fullName || "City"}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Check-in / Check-out */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <button
                      onClick={() => setShowEditDates(true)}
                      className="w-full text-left"
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        Check-in / Check-out
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-5 h-5 text-[#003580]" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {departureDate && returnDate
                              ? `${formatDisplayDate(departureDate)} - ${formatDisplayDate(returnDate)}`
                              : "Select dates"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Choose check-in & check-out
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Guests */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <button
                      onClick={() => setShowEditGuests(true)}
                      className="w-full text-left"
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        Guests & Rooms
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-[#003580]" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {editTravelers.adults + editTravelers.children}{" "}
                            guests, {editRooms} room{editRooms > 1 ? "s" : ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            {editTravelers.adults} adult
                            {editTravelers.adults > 1 ? "s" : ""}
                            {editTravelers.children > 0 &&
                              `, ${editTravelers.children} child${editTravelers.children > 1 ? "ren" : ""}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      className="flex-1 py-3 text-base rounded-xl"
                      onClick={() => setShowSearchEdit(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-[#febb02] hover:bg-[#d19900] text-[#003580] font-bold py-3 text-base rounded-xl"
                      onClick={() => {
                        // Create new search params with edited values
                        const newSearchParams = new URLSearchParams({
                          destination: cityData[editDestination]?.code || "DXB",
                          destinationName: editDestination,
                          checkIn: departureDate
                            ? departureDate.toISOString().split("T")[0]
                            : new Date().toISOString().split("T")[0],
                          checkOut: returnDate
                            ? returnDate.toISOString().split("T")[0]
                            : new Date(Date.now() + 24 * 60 * 60 * 1000)
                                .toISOString()
                                .split("T")[0],
                          adults: editTravelers.adults.toString(),
                          children: editTravelers.children.toString(),
                          rooms: editRooms.toString(),
                        });

                        // Navigate to results with new parameters
                        navigate(
                          `/hotels/results?${newSearchParams.toString()}`,
                        );
                        setShowSearchEdit(false);
                      }}
                    >
                      Search Hotels
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Filter Modal */}
        {showFilters && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowFilters(false)}
            />
            <div className="fixed inset-0 z-50 flex items-end">
              <div className="w-full bg-white rounded-t-3xl shadow-2xl h-[85vh] flex flex-col">
                {/* Filter Header */}
                <div className="bg-[#003580] text-white p-4 rounded-t-3xl flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Filter className="w-5 h-5 mr-2" />
                      <h2 className="text-lg font-bold">Filter Hotels</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-normal opacity-80">
                        {filteredAndSortedHotels.length} hotels
                      </div>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter Content - Scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="p-4">
                    <EnhancedFilters
                      priceRange={priceRange}
                      setPriceRange={setPriceRange}
                      selectedAmenities={selectedAmenities}
                      setSelectedAmenities={setSelectedAmenities}
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                      onClearFilters={handleClearFilters}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <Header />

        {/* Hotel Search Bar - Booking.com style */}
        <div className="bg-[#003580] py-2 sm:py-4">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
            <BookingSearchForm />
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2">
            <div className="flex items-center text-sm text-gray-600">
              <span>🌍 Global</span>
              <span className="mx-2">›</span>
              <span>
                {searchParams.get("destinationName") || destination || "Dubai"}
              </span>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">
                {isLiveData ? "Live Results" : "Search Results"}
              </span>
              {isLiveData && (
                <span className="ml-2 text-red-600 text-xs font-medium">
                  🔴 LIVE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Filter Styling */}
      <style>
        {`
          input[type="checkbox"], input[type="radio"] {
            accent-color: #2563eb;
            width: 14px;
            height: 14px;
          }

          @media (min-width: 1024px) {
            input[type="checkbox"], input[type="radio"] {
              width: 16px;
              height: 16px;
            }
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Desktop Filters */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 sticky top-24">
              <div className="text-lg font-semibold mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-[#003580]" />
                Filter by
              </div>
              <EnhancedFilters
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedAmenities={selectedAmenities}
                setSelectedAmenities={setSelectedAmenities}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header with View Toggle and Sort */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {searchParams.get("destinationName") ||
                        destination ||
                        "Dubai"}
                      : {filteredAndSortedHotels.length} properties found
                    </h1>
                    {isLiveData && (
                      <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        🔴 LIVE HOTELBEDS
                      </div>
                    )}
                    {!isLiveData && filteredAndSortedHotels.length > 0 && (
                      <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        🔧 ENHANCED MOCK
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    {isLiveData
                      ? "Real-time hotel data from Hotelbeds API with live pricing"
                      : "Enhanced mock data with realistic hotel information"}
                  </p>
                </div>

                {/* View Mode Toggle - Hidden on mobile, shown on tablet+ */}
                <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="p-2 touch-manipulation"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="p-2 touch-manipulation"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Sort Dropdown for Mobile/Tablet */}
              <div className="lg:hidden mb-3 sm:mb-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full h-12 px-4 py-3 text-sm sm:text-base touch-manipulation">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="recommended"
                      className="text-sm sm:text-base"
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        Our top picks
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="price-low"
                      className="text-sm sm:text-base"
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 11l5-5m0 0l5 5m-5-5v12"
                            />
                          </svg>
                        </div>
                        Price (lowest first)
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="price-high"
                      className="text-sm sm:text-base"
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-br from-red-400 to-red-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 13l-5 5m0 0l-5-5m5 5V6"
                            />
                          </svg>
                        </div>
                        Price (highest first)
                      </div>
                    </SelectItem>
                    <SelectItem value="rating" className="text-sm sm:text-base">
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        Best reviewed & lowest price
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="stars-high"
                      className="text-sm sm:text-base"
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        Property rating (high to low)
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="distance"
                      className="text-sm sm:text-base"
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-md flex items-center justify-center mr-2 shadow-sm">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        Distance from downtown
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
              }
            >
              {loading ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003580] mx-auto"></div>
                  <p className="text-gray-600 text-sm sm:text-base mt-4">
                    🔍 Searching live Hotelbeds API for hotels...
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Getting real-time availability and pricing
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="text-red-600 mb-4">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-red-600 mb-2">
                    {error}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Unable to connect to Hotelbeds API. Please check your
                    connection.
                  </p>
                  <Button onClick={loadHotels} className="mt-4">
                    🔄 Retry Search
                  </Button>
                </div>
              ) : (
                filteredAndSortedHotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    onBargainClick={handleBargainClick}
                    viewMode={viewMode}
                  />
                ))
              )}
            </div>

            {!loading && !error && filteredAndSortedHotels.length === 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  No hotels available for your search
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-4">
                  {isLiveData
                    ? "No hotels found in Hotelbeds API for this destination and dates"
                    : "Try adjusting your filters or search different dates"}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={loadHotels} variant="outline">
                    🔄 Search Again
                  </Button>
                  <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                  >
                    ← Modify Search
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FlightStyleBargainModal
        roomType={
          selectedHotel
            ? {
                id: "standard",
                name: "Standard Room",
                description: "Comfortable standard room",
                image: selectedHotel.images[0],
                marketPrice: selectedHotel.originalPrice,
                totalPrice: selectedHotel.currentPrice,
                features: selectedHotel.features || [],
                maxOccupancy: 2,
                bedType: "1 double bed",
                size: "6.7 km from downtown",
                cancellation: "Free cancellation",
              }
            : null
        }
        hotel={
          selectedHotel
            ? {
                id: selectedHotel.id,
                name: selectedHotel.name,
                location: selectedHotel.location,
                checkIn:
                  searchParams.get("checkIn") || new Date().toISOString(),
                checkOut:
                  searchParams.get("checkOut") ||
                  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              }
            : null
        }
        isOpen={isBargainModalOpen}
        onClose={() => {
          setIsBargainModalOpen(false);
          setSelectedHotel(null);
        }}
        checkInDate={
          searchParams.get("checkIn")
            ? new Date(searchParams.get("checkIn")!)
            : new Date()
        }
        checkOutDate={
          searchParams.get("checkOut")
            ? new Date(searchParams.get("checkOut")!)
            : new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
        roomsCount={parseInt(searchParams.get("rooms") || "1")}
      />

      {/* Mobile Dropdown Components for Edit Search */}
      <MobileCityDropdown
        isOpen={showEditDestination}
        onClose={() => setShowEditDestination(false)}
        title="Edit destination"
        cities={cityData}
        selectedCity={editDestination}
        onSelectCity={setEditDestination}
      />

      <MobileDatePicker
        isOpen={showEditDates}
        onClose={() => setShowEditDates(false)}
        tripType="round-trip"
        setTripType={() => {}} // Hotels always use round-trip (check-in/check-out)
        selectedDepartureDate={departureDate}
        selectedReturnDate={returnDate}
        setSelectedDepartureDate={setDepartureDate}
        setSelectedReturnDate={setReturnDate}
        selectingDeparture={true}
        setSelectingDeparture={() => {}}
      />

      <MobileTravelers
        isOpen={showEditGuests}
        onClose={() => setShowEditGuests(false)}
        travelers={editTravelers}
        setTravelers={setEditTravelers}
        showRooms={true}
        rooms={editRooms}
        setRooms={setEditRooms}
      />
    </div>
  );
}
