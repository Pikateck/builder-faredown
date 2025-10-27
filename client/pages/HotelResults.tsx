import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useDateContext } from "@/contexts/DateContext";
import { Header } from "@/components/layout/Header";
import { HotelCard } from "@/components/HotelCard";
import { HotelSearchForm } from "@/components/HotelSearchForm";
import { ConversationalBargainModal } from "@/components/ConversationalBargainModal";
import { ComprehensiveFilters } from "@/components/ComprehensiveFilters";
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
  X,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  formatPriceWithSymbol,
  calculateNights,
  calculateTotalPrice,
} from "@/lib/pricing";
import { useAuth } from "@/contexts/AuthContext";
import { useSearch } from "@/contexts/SearchContext";
import { useEnhancedBooking } from "@/contexts/EnhancedBookingContext";
import { authService } from "@/services/authService";
import {
  MobileCityDropdown,
  MobileDatePicker,
  MobileTravelers,
} from "@/components/MobileDropdowns";
import { MobileNavBar } from "@/components/mobile/MobileNavBar";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { HotelCardSkeleton } from "@/components/HotelCardSkeleton";

// Use the Hotel type from hotelsService for consistency
interface Hotel extends HotelType {
  originalPrice?: number;
  currentPrice?: number;
}

function HotelResultsContent() {
  useScrollToTop();
  const [urlSearchParams] = useSearchParams();
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
  const { loadFromUrlParams, getDisplayData, searchParams } = useSearch();
  const { loadCompleteSearchObject } = useEnhancedBooking();

  // Load search params from URL if available
  useEffect(() => {
    if (urlSearchParams.toString()) {
      loadFromUrlParams(urlSearchParams);
    }
  }, [urlSearchParams, loadFromUrlParams]);
  const [sortBy, setSortBy] = useState("price-low");
  const [priceRange, setPriceRange] = useState([0, 25000]);
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number }>({
    min: 0,
    max: 25000,
  });
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});
  // Hotel bargain modal state
  const [selectedHotel, setSelectedHotel] = useState<HotelType | null>(null);
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [isLiveData, setIsLiveData] = useState(false);
  const [pricingStatus, setPricingStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [showSearchEdit, setShowSearchEdit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  useScrollLock(showFilters);
  const [nameQuery, setNameQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSizeRef = React.useRef(20);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

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
  const destination = urlSearchParams.get("destination") || "";
  const checkIn = urlSearchParams.get("checkIn") || "";
  const checkOut = urlSearchParams.get("checkOut") || "";
  const adults = urlSearchParams.get("adults") || "2";
  const children = urlSearchParams.get("children") || "0";
  const rooms = urlSearchParams.get("rooms") || "1";

  // Helpers for consistent bargain pricing (moved here to use initialized vars)
  const getCheapestPerNight = (hotel: HotelType | null | undefined): number => {
    const result = getCheapestRoomData(hotel);
    return result.price;
  };

  // Enhanced function that returns both price and room details for navigation
  const getCheapestRoomData = (
    hotel: HotelType | null | undefined,
  ): {
    price: number;
    room: any | null;
    roomId: string | null;
    roomType: string | null;
  } => {
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
  };

  const checkInDate = checkIn ? new Date(checkIn) : new Date();
  const checkOutDate = checkOut
    ? new Date(checkOut)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const nights = calculateNights(checkInDate, checkOutDate);
  const roomsCount = parseInt(rooms || "1");

  // Get authenticated user's first name
  const { user } = useAuth();
  const storedUser = authService.getStoredUser();
  const userFirstName =
    user?.name && user.name.trim()
      ? user.name.split(" ")[0]
      : storedUser?.firstName || "Guest";

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

  // Helper functions to dynamically determine active suppliers
  const getActiveSuppliers = (): string => {
    if (hotels.length === 0) return "CHECKING...";

    const suppliers = new Set(
      hotels.map((hotel) =>
        (hotel.supplierCode || hotel.supplier || "HOTELBEDS").toUpperCase(),
      ),
    );

    const suppliersArray = Array.from(suppliers).sort();
    return suppliersArray.join(" + ");
  };

  const getSupplierDescription = (): string => {
    if (hotels.length === 0) return `${hotels.length} hotels found`;
    return `${hotels.length} hotels found`;
  };

  // Initialize edit states from current search params
  React.useEffect(() => {
    setEditDestination(
      urlSearchParams.get("destinationName") || destination || "Dubai",
    );
    setEditTravelers({
      adults: parseInt(adults) || 2,
      children: parseInt(children) || 0,
    });
    setEditRooms(parseInt(rooms) || 1);
  }, [searchParams, destination, adults, children, rooms]);

  // Sync contexts from URL only when query string changes
  const searchKey = urlSearchParams.toString();
  useEffect(() => {
    loadDatesFromParams(urlSearchParams);
    loadFromUrlParams(urlSearchParams);

    // Create and load standardized hotel search object for state persistence
    const standardizedHotelSearchParams = {
      module: "hotels" as const,
      destination: urlSearchParams.get("destination") || destination || "Dubai",
      destinationCode: urlSearchParams.get("destinationCode") || "DXB",
      destinationName:
        urlSearchParams.get("destinationName") ||
        destination ||
        "Dubai, United Arab Emirates",
      // Use exact date format as specified by user: "2025-10-01"
      checkIn:
        urlSearchParams.get("checkIn") ||
        checkIn ||
        new Date().toISOString().split("T")[0],
      checkOut:
        urlSearchParams.get("checkOut") ||
        checkOut ||
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      rooms: parseInt(urlSearchParams.get("rooms") || rooms || "1"),
      nights: calculateNights(
        new Date(
          urlSearchParams.get("checkIn") || checkIn || new Date().toISOString(),
        ),
        new Date(
          urlSearchParams.get("checkOut") ||
            checkOut ||
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ),
      ),
      guests: {
        adults: parseInt(urlSearchParams.get("adults") || adults || "2"),
        children: parseInt(urlSearchParams.get("children") || children || "0"),
      },
      pax: {
        adults: parseInt(urlSearchParams.get("adults") || adults || "2"),
        children: parseInt(urlSearchParams.get("children") || children || "0"),
        infants: 0,
      },
      currency: selectedCurrency?.code || "INR",
      searchId: `hotel_results_${Date.now()}`,
      searchTimestamp: new Date().toISOString(),
    };

    console.log(
      "🏨 Loading standardized hotel search object to context:",
      standardizedHotelSearchParams,
    );
    loadCompleteSearchObject(standardizedHotelSearchParams);
  }, [
    searchKey,
    loadDatesFromParams,
    loadFromUrlParams,
    destination,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    selectedCurrency,
  ]);

  // Fetch hotels when search or currency code changes (avoid object identity churn)
  useEffect(() => {
    loadHotels();
  }, [searchKey, selectedCurrency?.code]);

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

  // Fetch hotel metadata from DB + prices from TBO in parallel (hybrid approach)
  const fetchTBOHotels = async (destCode: string) => {
    try {
      console.log("🏨 Fetching hotel metadata for:", destCode);

      // Determine API base URL - use relative URL when possible to avoid CORS issues
      const apiBaseUrl = (() => {
        if (typeof window === "undefined") return "/api";

        // Get VITE_API_BASE_URL from environment
        const envUrl = import.meta.env.VITE_API_BASE_URL;

        // If environment specifies a specific backend URL, use it
        if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
          const cleanUrl = envUrl.replace(/\/$/, "");
          console.log("✅ Using configured API URL:", cleanUrl);
          return cleanUrl;
        }

        // FALLBACK: Use Render API directly
        // This is the production API endpoint
        const renderApi = "https://builder-faredown-pricing.onrender.com/api";
        console.log(
          "⚠️ VITE_API_BASE_URL not configured, using Render directly:",
          renderApi,
        );
        return renderApi;
      })();

      // STEP 1: Fetch metadata instantly from TBO
      setPricingStatus("loading");
      const checkInStr = checkInDate.toISOString().split("T")[0];
      const checkOutStr = checkOutDate.toISOString().split("T")[0];
      const adultsCount = parseInt(adults) || 2;
      const childrenCount = parseInt(children) || 0;

      // Determine country code from destination
      // Common mappings: DXB=AE, DEL=IN, PAR=FR, LDN=GB, NYC=US, TYO=JP
      const countryCodeMap: { [key: string]: string } = {
        DXB: "AE",
        AUH: "AE",
        RAK: "AE", // UAE
        DEL: "IN",
        BLR: "IN",
        BOM: "IN",
        CCU: "IN",
        HYD: "IN",
        COK: "IN", // India
        PAR: "FR",
        CDG: "FR", // France
        LDN: "GB",
        LGW: "GB",
        STN: "GB", // UK
        NYC: "US",
        LAX: "US",
        SFO: "US",
        MIA: "US", // US
        TYO: "JP",
        KIX: "JP", // Japan
        SYD: "AU", // Australia
        SGP: "SG", // Singapore
        BKK: "TH", // Thailand
        HKG: "HK", // Hong Kong
      };

      const countryCode = countryCodeMap[destCode] || "IN"; // Default to India if not found

      console.log(`🌍 Destination: ${destCode}, Country Code: ${countryCode}`);

      const apiUrl = `${apiBaseUrl}/hotels?cityId=${destCode}&checkIn=${checkInStr}&checkOut=${checkOutStr}&adults=${adultsCount}&children=${childrenCount}&countryCode=${countryCode}`;
      console.log(`📡 API Call: ${apiUrl}`);

      let metadataResponse;
      try {
        console.log("📡 Attempting fetch with config:", {
          url: apiUrl,
          apiBaseUrl,
          currentOrigin:
            typeof window !== "undefined" ? window.location.origin : "N/A",
          envViteUrl: import.meta.env.VITE_API_BASE_URL,
        });

        metadataResponse = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for same-origin requests
        });
      } catch (fetchError) {
        const errorDetails = {
          url: apiUrl,
          apiBaseUrl,
          message: fetchError?.message || "Unknown error",
          name: fetchError?.name || "UnknownError",
          cause: fetchError?.cause || null,
          stack: fetchError?.stack?.slice(0, 200) || null,
        };
        console.error("❌ Fetch failed:", errorDetails);
        setError(
          `Network error: ${fetchError?.message || "Failed to reach hotel service"}`,
        );
        return [];
      }

      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text();
        console.error("❌ API returned error:", {
          status: metadataResponse.status,
          statusText: metadataResponse.statusText,
          body: errorText.slice(0, 500),
        });
        // Provide user-friendly error message for supplier issues
        const userMessage =
          metadataResponse.status >= 500
            ? "Live rates temporarily unavailable from supplier. Please retry or try different dates."
            : `Hotel service error: ${metadataResponse.status}. Please try again.`;
        setError(userMessage);
        return [];
      }

      let metadataData;
      try {
        const contentType = metadataResponse.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error(
            `Invalid response type: ${contentType}. Expected JSON but got ${contentType || "unknown"}`,
          );
        }
        metadataData = await metadataResponse.json();
      } catch (jsonError) {
        console.error(
          "❌ Failed to parse metadata response as JSON:",
          jsonError,
        );
        setError("Invalid response from hotel service. Please try again.");
        return [];
      }

      // Check if TBO returned an error status
      if (metadataData.tboStatus?.Code && metadataData.tboStatus.Code !== 1) {
        console.warn("⚠️ TBO API returned error status", {
          statusCode: metadataData.tboStatus.Code,
          description: metadataData.tboStatus.Description,
        });
        setError(
          "Live rates temporarily unavailable from supplier. Please retry or try different dates.",
        );
        return [];
      }

      if (!metadataData.hotels || metadataData.hotels.length === 0) {
        console.warn("⚠️ No metadata hotels found from API");
        setError("No hotels available for your search criteria");
        return [];
      }

      // Convert metadata to Hotel format
      const metadataHotels: Hotel[] = metadataData.hotels.map(
        (h: any, i: number) => ({
          id: h.id || `hotel-${i}`,
          name: h.name,
          location: h.address || destCode,
          images: h.image ? [h.image] : [],
          rating: h.stars || 4.0,
          reviews: 0,
          currentPrice: h.currentPrice || 0,
          originalPrice: h.originalPrice || h.currentPrice || 0,
          description: `Discover ${h.name}`,
          amenities: h.amenities || [],
          features: [],
          roomTypes: [],
          address: {
            street: "",
            city: destCode,
            country: "Unknown",
            postalCode: "00000",
          },
          starRating: h.stars || 4,
          reviewCount: 0,
          currency: h.currency || selectedCurrency?.code || "INR",
          supplier: "TBO",
          supplierCode: "tbo",
          isLiveData: true,
          priceRange: {
            min: h.currentPrice || 0,
            max: h.originalPrice || h.currentPrice || 0,
          },
        }),
      );

      console.log("✅ Metadata loaded:", metadataHotels.length, "hotels");

      // STEP 2: Fetch live prices in parallel (non-blocking)
      fetchLivePrices(destCode, metadataHotels)
        .then(() => {
          console.log("✅ Prices merged");
          setPricingStatus("ready");
        })
        .catch((e) => {
          console.warn("Price fetch error:", e.message);
          setPricingStatus("ready");
        });

      return metadataHotels;
    } catch (error) {
      console.warn("⚠️ Failed to fetch hotel metadata:", error);
      setPricingStatus("ready");
      return [];
    }
  };

  // Fetch live prices from TBO in background
  const fetchLivePrices = async (destCode: string, hotels: Hotel[]) => {
    try {
      const apiBaseUrl = (() => {
        if (typeof window !== "undefined") {
          const envUrl = import.meta.env.VITE_API_BASE_URL;
          if (envUrl) return envUrl.replace(/\/$/, "");
          return window.location.origin + "/api";
        }
        return "/api";
      })();

      console.log("💰 Fetching live TBO prices...");

      const pricesResponse = await fetch(
        `${apiBaseUrl}/hotels/prices?cityId=${destCode}`,
      );

      if (!pricesResponse.ok) {
        console.warn("⚠️ Prices API returned error:", pricesResponse.status);
        return; // Skip price update if API fails
      }

      let pricesData;
      try {
        const contentType = pricesResponse.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          console.warn("⚠️ Prices response is not JSON, skipping price update");
          return;
        }
        pricesData = await pricesResponse.json();
      } catch (jsonError) {
        console.warn("⚠️ Failed to parse prices response as JSON:", jsonError);
        return; // Skip price update if JSON parsing fails
      }

      if (pricesData.prices && Object.keys(pricesData.prices).length > 0) {
        console.log("���� Merging prices into hotels...");
        setHotels((prev) =>
          prev.map((h) => {
            const supplierId = h.supplier_id || h.id;
            const price = pricesData.prices[supplierId];
            return {
              ...h,
              currentPrice: price?.minTotal || 0,
              originalPrice: price?.maxTotal || 0,
              priceRange: {
                min: price?.minTotal || 0,
                max: price?.maxTotal || 0,
              },
            };
          }),
        );
      }
    } catch (e) {
      console.warn("Failed to fetch prices:", e);
    }
  };

  // Transform TBO UnifiedHotel data to frontend format
  const transformTBOData = (tboHotels: any[]): Hotel[] => {
    return tboHotels.map((hotel, index) => {
      // Create variety in breakfast and refundable options for demo/testing
      // Alternating pattern: odd index = included/refundable, even = not included/non-refundable
      const hasBreakfast =
        hotel.breakfastIncluded !== undefined
          ? hotel.breakfastIncluded
          : index % 2 === 1; // Alternate between true and false
      const isRefundable =
        hotel.cancellationPolicy?.toLowerCase().includes("free") ||
        hotel.cancellationPolicy?.toLowerCase().includes("cancel")
          ? true
          : index % 3 !== 0; // 2 out of 3 are refundable

      const cheapestRoom = (hotel.rooms || []).reduce(
        (best: any, room: any) => {
          const roomPrice = room.price?.total || room.price || Infinity;
          const bestPrice = best.price?.total || best.price || Infinity;
          return roomPrice < bestPrice ? room : best;
        },
        hotel.rooms?.[0] || {},
      );

      return {
        id: hotel.supplierHotelId || `tbo-${index}`,
        name: hotel.name || `Hotel ${destination}`,
        location: hotel.address
          ? `${hotel.address}, ${hotel.city || destination}`
          : `${hotel.city || destination}, ${hotel.countryCode || "IN"}`,
        images:
          hotel.images && hotel.images.length > 0
            ? hotel.images
            : transformHotelImages([]),
        rating: hotel.rating || 4.0,
        reviews: hotel.reviewCount || 0,
        originalPrice: hotel.minTotal ? Math.round(hotel.minTotal * 1.15) : 0,
        currentPrice: hotel.minTotal || 0,
        description: hotel.description || `Discover ${hotel.name}`,
        amenities: hotel.amenities || [],
        features: hotel.amenities?.slice(0, 3) || [],
        roomTypes: (hotel.rooms || []).map((room: any) => ({
          id: room.roomId || `room-${hotel.supplierHotelId}-${room.roomName}`,
          name: room.roomName || "Standard Room",
          description: room.roomDescription || "",
          price: room.price?.total || room.price || hotel.minTotal || 0,
          pricePerNight:
            room.price?.base || (room.price?.total || 0) / nights || 0,
          tax: room.price?.taxes || 0,
          board: room.board || "Room Only",
          occupants: room.occupants || {
            adults: parseInt(adults) || 2,
            children: parseInt(children) || 0,
          },
          cancellation: room.cancellation || [],
          amenities: room.amenities || [],
          features: [
            room.board || "Room Only",
            ...(room.amenities || []).slice(0, 2),
          ],
          rateKey:
            room.rateKey ||
            room.token ||
            `room-${hotel.supplierHotelId}-${room.roomName}`,
          refundable: room.cancellation && room.cancellation.length > 0,
        })),
        address: {
          street: hotel.address || "",
          city: hotel.city || destination || "Unknown",
          country: hotel.countryCode || "IN",
          postalCode: hotel.zipCode || "00000",
        },
        starRating: hotel.rating || 4,
        reviewCount: hotel.reviewCount || 0,
        contact: {
          phone: hotel.phone || "+1234567890",
          email: hotel.email || "info@hotel.com",
        },
        priceRange: {
          min: hotel.minTotal || 0,
          max:
            hotel.maxTotal ||
            (hotel.minTotal ? Math.round(hotel.minTotal * 1.5) : 0),
        },
        currency: hotel.currency || selectedCurrency?.code || "INR",
        policies: {
          checkIn: hotel.checkInTime || "14:00",
          checkOut: hotel.checkOutTime || "11:00",
          cancellation: hotel.cancellationPolicy || "Check hotel policy",
          children: "Children welcome",
          pets: "Check hotel policy",
          smoking: "Non-smoking",
        },
        breakfastIncluded: hasBreakfast,
        breakfastType: hasBreakfast
          ? hotel.breakfastType || "Continental breakfast"
          : "Not included",
        availableRoom: {
          type: cheapestRoom.roomName || "Standard Room",
          bedType: cheapestRoom.bedType || "1 Double Bed",
          rateType: cheapestRoom.board || "Room Only",
          paymentTerms:
            cheapestRoom.payType === "at_hotel" ? "Pay at Hotel" : "Prepaid",
          cancellationPolicy: isRefundable
            ? "Free cancellation"
            : "Non-refundable",
          description: cheapestRoom.roomDescription || "",
        },
        supplier: "TBO",
        supplierCode: "tbo",
        isLiveData: true,
        priceBreakdown: hotel.rooms?.[0]?.price?.breakdown || null,
      };
    });
  };

  const fetchHotelsPage = async (pageToLoad: number, append: boolean) => {
    try {
      if (append) setLoadingMore(true);
      if (!append) setLoading(true);
      setError(null);

      const destCode =
        urlSearchParams.get("destinationCode") ||
        urlSearchParams.get("destination") ||
        "DXB";

      console.log("🏨 Fetching TBO hotels only for:", destCode);

      // Fetch ONLY from TBO (no Hotelbeds)
      const tboHotels = await fetchTBOHotels(destCode);

      console.log(`✅ TBO Results: ${tboHotels.length} hotels found`);

      if (append) {
        setHotels((prev) => {
          const merged = [...prev, ...tboHotels];
          // Update bounds with data
          const extract = (h: any) =>
            h.currentPrice || h.priceRange?.min || h.roomTypes?.[0]?.price || 0;
          const maxPrice = Math.max(
            50000,
            ...merged
              .map(extract)
              .filter((n: any) => typeof n === "number" && isFinite(n)),
          );
          const roundedMax = Math.ceil(maxPrice / 100) * 100;
          setPriceBounds({ min: 0, max: roundedMax });
          return merged;
        });
        setPage(pageToLoad);
      } else {
        setHotels(tboHotels);
        setPage(pageToLoad);
        // Dynamic price bounds from TBO dataset
        const extract = (h: any) =>
          h.currentPrice || h.priceRange?.min || h.roomTypes?.[0]?.price || 0;
        const maxPrice = Math.max(
          50000,
          ...tboHotels
            .map(extract)
            .filter((n: any) => typeof n === "number" && isFinite(n)),
        );
        const roundedMax = Math.ceil(maxPrice / 100) * 100;
        setPriceBounds({ min: 0, max: roundedMax });
        setPriceRange([0, roundedMax]);
      }

      setTotalResults((prev) =>
        append ? prev + tboHotels.length : tboHotels.length,
      );

      const hasMoreNow = tboHotels.length === pageSizeRef.current;
      setHasMore(hasMoreNow);

      const hasLive = (append ? hotels : tboHotels).some(
        (h: any) => (h as any)?.isLiveData === true,
      );
      setIsLiveData(hasLive);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          console.log("⏰ Hotel search was aborted");
          setError("Search was cancelled");
        } else if (
          err.message.includes("Failed to fetch") ||
          err.name === "TypeError"
        ) {
          console.log("🌐 Network connectivity issue - using mock data");
          setError(null);
        } else {
          console.error("Hotel search error:", err.message);
          setError("Unable to search hotels at the moment");
        }
      } else {
        console.error("Unknown hotel search error:", err);
        setError("An unexpected error occurred");
      }

      if (!append) {
        console.log("🔄 Using emergency fallback data");
        const fallback = getMockHotels();
        setHotels(fallback);
        setTotalResults(fallback.length);
        setIsLiveData(false);
        setHasMore(false);
      }
    } finally {
      if (append) setLoadingMore(false);
      if (!append) setLoading(false);
    }
  };

  const loadHotels = async () => {
    setHasMore(true);
    await fetchHotelsPage(1, false);
  };

  // Transform Hotelbeds API data to frontend format
  const transformHotelbedsData = (hotelbedsData: any[]): Hotel[] => {
    return hotelbedsData.map((hotel, index) => {
      const supplierCode = (hotel.supplierCode || hotel.supplier || "hotelbeds")
        .toString()
        .toLowerCase();

      return {
        id: hotel.id || hotel.code || `hotel-${index}`,
        name: hotel.name || `Hotel ${destination}`,
        location: hotel.address?.street
          ? `${hotel.address.street}, ${hotel.address.city || destination}, ${hotel.address.country || "United Arab Emirates"}`
          : `${hotel.address?.city || destination}, ${hotel.address?.country || "United Arab Emirates"}`,
        images: transformHotelImages(hotel.images),
        rating: hotel.rating || hotel.reviewScore || 4.0,
        reviews: hotel.reviewCount || 150,
        originalPrice:
          hotel.originalPrice || Math.round((hotel.currentPrice || 120) * 1.3),
        currentPrice: hotel.currentPrice || 120,
        description: hotel.description || `Experience luxury at ${hotel.name}`,
        amenities: hotel.amenities || ["WiFi", "Pool", "Restaurant"],
        features: hotel.features || ["City View", "Business Center"],
        roomTypes:
          Array.isArray(hotel.roomTypes) && hotel.roomTypes.length > 0
            ? hotel.roomTypes
            : hotel.rooms
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
            hotel.originalPrice ||
            Math.round((hotel.currentPrice || 120) * 1.25),
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
        breakfastIncluded: hotel.breakfastIncluded || Math.random() > 0.5,
        breakfastType:
          hotel.breakfastType ||
          (Math.random() > 0.5 ? "Continental Buffet" : "American Breakfast"),
        availableRoom: hotel.availableRoom || {
          type: "1 X Standard Room",
          bedType: "Double bed",
          rateType: "Flexible Rate",
          paymentTerms: "No prepayment needed",
          cancellationPolicy: "Free cancellation",
        },
        supplier: supplierCode.toUpperCase(),
        supplierCode,
        isLiveData: hotel.isLiveData ?? false,
        priceBreakdown: hotel.priceBreakdown || hotel.price?.breakdown || null,
        markupApplied: hotel.markupApplied,
        promoApplied: hotel.promoApplied,
      };
    });
  };

  // Handle search function
  const handleSearch = () => {
    loadHotels();
  };

  // Mock hotel data (fallback if API fails)
  const getMockHotels = (): Hotel[] => [
    {
      id: 1,
      name: `Grand Hotel ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"}`,
      location: `City Center, ${urlSearchParams.get("destinationName") || destination || "Dubai, United Arab Emirates"}`,
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&q=80&auto=format&fit=crop",
      ],
      rating: 4.8,
      reviews: 1234,
      originalPrice: 160, // ₹160 per night (original price)
      currentPrice: 138, // ₹138 per night (current discounted price)
      description: `Experience luxury in the heart of ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"} with stunning views, world-class amenities, and exceptional service.`,
      amenities: ["WiFi", "Parking", "Restaurant", "Gym", "Pool", "Spa"],
      features: ["City View", "Business Center", "Concierge", "Room Service"],
      roomTypes: [
        {
          name: "Standard Room",
          price: 138, // ₹138 per night (matches currentPrice)
          features: ["King Bed", "City View", "Free WiFi"],
        },
        {
          name: "Deluxe Suite",
          price: 155, // ₹155 per night (upgrade option)
          features: ["Living Area", "Ocean View", "Mini Bar"],
        },
        {
          name: "Presidential Suite",
          price: 180, // ₹180 per night (premium option)
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
      name: `Business Hotel ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"}`,
      location: `Business District, ${urlSearchParams.get("destinationName") || destination || "Dubai, United Arab Emirates"}`,
      images: [
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&q=80&auto=format&fit=crop",
      ],
      rating: 4.6,
      reviews: 856,
      originalPrice: 175, // ₹175 per night (original price)
      currentPrice: 152, // ₹152 per night (current discounted price)
      description: `Modern business hotel in ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"} with excellent facilities for corporate travelers and leisure guests.`,
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
          price: 152, // ₹152 per night (matches currentPrice)
          features: ["Queen Bed", "Ocean View", "Balcony"],
        },
        {
          name: "Beach Villa",
          price: 195, // ₹195 per night (upgrade option)
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
      name: `Boutique Hotel ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"}`,
      location: `Historic District, ${urlSearchParams.get("destinationName") || destination || "Dubai, United Arab Emirates"}`,
      images: [
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&h=600&q=80&auto=format&fit=crop",
      ],
      rating: 4.9,
      reviews: 567,
      originalPrice: 140, // ₹140 per night (original price)
      currentPrice: 120, // ₹120 per night (current discounted price)
      description: `Charming boutique hotel in ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"} with unique character and personalized service.`,
      amenities: ["Ski Access", "Fireplace", "Spa", "Restaurant", "WiFi"],
      features: ["Ski-in/Ski-out", "Mountain Views", "Fireplace", "Hot Tub"],
      roomTypes: [
        {
          name: "Standard Room",
          price: 120, // ₹120 per night (matches currentPrice)
          features: ["Fireplace", "Mountain View", "Cozy Decor"],
        },
        {
          name: "Alpine Suite",
          price: 140, // ₹140 per night (upgrade option)
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

  // Infinite scroll: observe sentinel and fetch next page
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        if (!loading && !loadingMore && hasMore) {
          fetchHotelsPage(page + 1, true);
        }
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMoreRef, loading, loadingMore, hasMore, page]);

  // Compute supplier counts for filter display (dynamic, respects current filters except supplier)
  const supplierCounts = React.useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    const filteredForCounts = hotels.filter((hotel) => {
      if (q && !hotel.name.toLowerCase().includes(q)) return false;
      const price =
        hotel.currentPrice ||
        hotel.priceRange?.min ||
        hotel.roomTypes?.[0]?.pricePerNight ||
        0;
      if (price < priceRange[0] || price > priceRange[1]) return false;

      for (const [categoryId, filterIds] of Object.entries(selectedFilters)) {
        if (categoryId === "suppliers" || filterIds.length === 0) continue;
        if (categoryId === "review-score") {
          const rating = Math.floor(hotel.rating);
          const match = filterIds.some(
            (fid) =>
              (fid === "wonderful-9" && rating >= 9) ||
              (fid === "very-good-8" && rating >= 8) ||
              (fid === "good-7" && rating >= 7) ||
              (fid === "pleasant-6" && rating >= 6),
          );
          if (!match) return false;
        }
        if (categoryId === "facilities" || categoryId === "popular") {
          const hotelAmenities =
            hotel.amenities?.map((a) => (typeof a === "string" ? a : a.name)) ||
            [];
          const amenityMap: Record<string, string> = {
            "swimming-pool": "Pool",
            "free-wifi": "WiFi",
            parking: "Parking",
            restaurant: "Restaurant",
            "fitness-center": "Gym",
            spa: "Spa",
            bar: "Bar",
          };
          const hasAmenity = filterIds.some((fid) =>
            hotelAmenities.includes(amenityMap[fid] || fid),
          );
          if (!hasAmenity) return false;
        }
        if (categoryId === "property-rating") {
          const stars = Math.floor(hotel.rating);
          const match = filterIds.some(
            (fid) =>
              (fid === "5-stars" && stars === 5) ||
              (fid === "4-stars" && stars === 4) ||
              (fid === "3-stars" && stars === 3),
          );
          if (!match) return false;
        }
      }
      return true;
    });

    const counts: Record<string, number> = {};
    filteredForCounts.forEach((h) => {
      const key = (h.supplier || h.supplierCode || "HOTELBEDS")
        .toString()
        .toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [hotels, nameQuery, priceRange, selectedFilters]);

  // Filter and sort hotels
  const filteredAndSortedHotels = React.useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    let filtered = hotels.filter((hotel) => {
      // Name filter
      if (q && !hotel.name.toLowerCase().includes(q)) return false;

      // Price range filter - use currentPrice which is available in mock data
      const price =
        hotel.currentPrice ||
        hotel.priceRange?.min ||
        hotel.roomTypes?.[0]?.pricePerNight ||
        0;
      if (price < priceRange[0] || price > priceRange[1]) return false;

      // Apply comprehensive filters
      for (const [categoryId, filterIds] of Object.entries(selectedFilters)) {
        if (filterIds.length === 0) continue;

        if (categoryId === "suppliers") {
          const hotelSupplier = (
            hotel.supplier ||
            hotel.supplierCode ||
            "HOTELBEDS"
          )
            .toString()
            .toUpperCase();
          const supplierMatch = filterIds.some(
            (id) => id.toUpperCase() === hotelSupplier,
          );
          if (!supplierMatch) return false;
        }

        if (categoryId === "review-score") {
          const hasMatchingRating = filterIds.some((filterId) => {
            const rating = Math.floor(hotel.rating);
            if (filterId === "wonderful-9" && rating >= 9) return true;
            if (filterId === "very-good-8" && rating >= 8) return true;
            if (filterId === "good-7" && rating >= 7) return true;
            if (filterId === "pleasant-6" && rating >= 6) return true;
            return false;
          });
          if (!hasMatchingRating) return false;
        }

        if (categoryId === "facilities" || categoryId === "popular") {
          const hotelAmenities =
            hotel.amenities?.map((a) => (typeof a === "string" ? a : a.name)) ||
            [];
          const hasMatchingAmenity = filterIds.some((filterId) => {
            const amenityMap: Record<string, string> = {
              "swimming-pool": "Pool",
              "free-wifi": "WiFi",
              parking: "Parking",
              restaurant: "Restaurant",
              "fitness-center": "Gym",
              spa: "Spa",
              bar: "Bar",
            };
            return hotelAmenities.includes(amenityMap[filterId] || filterId);
          });
          if (!hasMatchingAmenity) return false;
        }

        if (categoryId === "property-rating") {
          const hasMatchingStars = filterIds.some((filterId) => {
            const stars = Math.floor(hotel.rating);
            if (filterId === "5-stars" && stars === 5) return true;
            if (filterId === "4-stars" && stars === 4) return true;
            if (filterId === "3-stars" && stars === 3) return true;
            return false;
          });
          if (!hasMatchingStars) return false;
        }
      }

      return true;
    });

    // Sort hotels
    switch (sortBy) {
      case "price-low":
        filtered.sort(
          (a, b) =>
            (a.totalPrice ||
              (a.currentPrice || a.priceRange?.min || 0) *
                Math.max(1, nights)) -
            (b.totalPrice ||
              (b.currentPrice || b.priceRange?.min || 0) * Math.max(1, nights)),
        );
        break;
      case "price-high":
        filtered.sort(
          (a, b) =>
            (b.totalPrice ||
              (b.currentPrice || b.priceRange?.min || 0) *
                Math.max(1, nights)) -
            (a.totalPrice ||
              (a.currentPrice || a.priceRange?.min || 0) * Math.max(1, nights)),
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
  }, [hotels, priceRange, selectedFilters, sortBy]);

  const handleBargainClick = (
    hotel: Hotel,
    currentSearchParams?: URLSearchParams,
  ) => {
    setSelectedHotel(hotel);
    setIsBargainModalOpen(true);
  };

  const handleClearFilters = () => {
    setSelectedFilters({});
    setSortBy("recommended");
    setPriceRange([priceBounds.min, priceBounds.max]);
    loadHotels();
  };

  return (
    <div
      id="app-root"
      className={`min-h-screen bg-gray-50 ${showFilters ? "pointer-events-none" : ""}`}
      aria-hidden={showFilters}
    >
      {/* Mobile-First Layout */}
      <div className="md:hidden">
        <MobileNavBar
          title={
            urlSearchParams.get("destinationName") || destination || "Dubai"
          }
          subtitle={`${filteredAndSortedHotels.length} hotels found`}
          onBack={() => navigate("/hotels")}
          showLogo={true}
          rightActions={(() => {
            const showLive = import.meta.env.VITE_SHOW_LIVE_BADGE === "true";
            return showLive && isLiveData ? (
              <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
            ) : null;
          })()}
        />

        {/* Hotel Search Summary Bar with Edit Button */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="font-medium text-gray-900 truncate">
                    {urlSearchParams.get("destinationName") ||
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
            onClick={() => {
              try {
                setShowFilters(true);
              } catch (e) {
                console.error("Failed to open filters", e);
                alert("Could not open filters. Please try again.");
              }
            }}
          >
            <Filter className="w-4 h-4" />
            Filter Hotels
          </Button>
          <div className="mt-2 text-center">
            <button
              onClick={handleClearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Clear filters
            </button>
          </div>
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
            <>
              {filteredAndSortedHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onBargainClick={handleBargainClick}
                  viewMode="list"
                />
              ))}
              <div ref={loadMoreRef} className="h-10" />
            </>
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

        {/* Mobile Filter Modal - Simplified to fix rendering */}
        {showFilters && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="fixed inset-0 bg-black/40 z-0" onClick={() => setShowFilters(false)} />
            <div className="relative w-full bg-white rounded-t-3xl shadow-2xl h-[90vh] flex flex-col z-10">
              <DialogTitle className="sr-only">Filter Hotels</DialogTitle>

              {/* Filter Header */}
              <div className="bg-[#003580] text-white p-4 rounded-t-3xl flex-shrink-0 border-b border-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-[#febb02]" />
                    <h2 className="text-lg font-bold">Filter Hotels</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleClearFilters}
                      className="text-xs underline hover:text-yellow-200"
                      title="Clear all filters"
                    >
                      Clear
                    </button>
                    <div className="text-sm font-normal opacity-90 bg-white/10 px-2 py-1 rounded-lg">
                      {filteredAndSortedHotels.length} found
                    </div>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Content - Scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]">
                {/* Current search summary (mobile) */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="text-xs text-gray-600">Current search</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {urlSearchParams.get("destinationName") ||
                      destination ||
                      "Dubai"}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {(() => {
                      const inD =
                        departureDate || (checkIn ? new Date(checkIn) : null);
                      const outD =
                        returnDate || (checkOut ? new Date(checkOut) : null);
                      if (inD && outD)
                        return `${formatDisplayDate(inD)} - ${formatDisplayDate(outD)}`;
                      return "Select dates";
                    })()}
                    {` • ${adults} adult${parseInt(adults) > 1 ? "s" : ""}`}
                    {parseInt(children) > 0
                      ? `, ${children} child${parseInt(children) > 1 ? "ren" : ""}`
                      : ""}
                    {`, ${rooms} room${parseInt(rooms) > 1 ? "s" : ""}`}
                  </div>
                </div>

                <ComprehensiveFilters
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  selectedFilters={selectedFilters}
                  setSelectedFilters={setSelectedFilters}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  onClearFilters={handleClearFilters}
                  className="h-full border-0"
                  priceMax={priceBounds.max}
                  supplierCounts={supplierCounts}
                />
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0 p-4 bg-gray-50 border-t border-gray-200">
                <Button
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-[#003580] hover:bg-[#0071c2] text-white font-semibold py-3 rounded-xl"
                >
                  Show {filteredAndSortedHotels.length} Hotel
                  {filteredAndSortedHotels.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <Header />

        {/* Hotel Search Bar - Booking.com style */}
        <div className="bg-[#003580] py-2 sm:py-4">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
            <HotelSearchForm
              initialDestination={destination}
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialGuests={{
                adults: parseInt(adults),
                children: parseInt(children),
                rooms: parseInt(rooms),
              }}
            />
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2">
            <div className="flex items-center text-sm text-gray-600">
              <span>🌍 Global</span>
              <span className="mx-2">•</span>
              <span>
                {urlSearchParams.get("destinationName") ||
                  destination ||
                  "Dubai"}
              </span>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">Search Results</span>
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

      {/* Desktop Results Layout */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Desktop Filters */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 sticky top-24 overflow-hidden">
                <div className="bg-gradient-to-r from-[#003580] to-[#0071c2] text-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Filter className="w-5 h-5 mr-2 text-[#febb02]" />
                      <h2 className="text-lg font-semibold">Filter Hotels</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleClearFilters}
                        className="text-xs underline hover:text-yellow-200"
                        title="Clear all filters"
                      >
                        Clear
                      </button>
                      <div className="text-sm bg-white/20 px-2 py-1 rounded-lg">
                        {filteredAndSortedHotels.length}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100vh-200px)]">
                  {/* Current search summary */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-600">Current search</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {urlSearchParams.get("destinationName") ||
                        destination ||
                        "Dubai"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {(() => {
                        const inD =
                          departureDate || (checkIn ? new Date(checkIn) : null);
                        const outD =
                          returnDate || (checkOut ? new Date(checkOut) : null);
                        if (inD && outD)
                          return `${formatDisplayDate(inD)} - ${formatDisplayDate(outD)}`;
                        return "Select dates";
                      })()}
                      {` • ${adults} adult${parseInt(adults) > 1 ? "s" : ""}`}
                      {parseInt(children) > 0
                        ? `, ${children} child${parseInt(children) > 1 ? "ren" : ""}`
                        : ""}
                      {`, ${rooms} room${parseInt(rooms) > 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <ComprehensiveFilters
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    selectedFilters={selectedFilters}
                    setSelectedFilters={setSelectedFilters}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    onClearFilters={handleClearFilters}
                    className="h-full border-0"
                    priceMax={priceBounds.max}
                    supplierCounts={supplierCounts}
                  />
                </div>
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
                        {urlSearchParams.get("destinationName") ||
                          destination ||
                          "Dubai"}
                        : {filteredAndSortedHotels.length} properties found
                      </h1>
                    </div>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      {filteredAndSortedHotels.length} hotels available for your
                      dates
                    </p>
                    {Object.values(selectedFilters).some(
                      (arr) => arr.length > 0,
                    ) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(selectedFilters).flatMap(
                          ([cat, items]) =>
                            items.map((id) => (
                              <span
                                key={`${cat}-${id}`}
                                className="inline-flex items-center text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-1"
                              >
                                {id}
                              </span>
                            )),
                        )}
                        <button
                          onClick={handleClearFilters}
                          className="text-xs underline text-blue-600"
                          title="Clear filters"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Name filter */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto md:max-w-xs">
                    <input
                      type="text"
                      value={nameQuery}
                      onChange={(e) => {
                        setNameQuery(e.target.value);
                      }}
                      placeholder="Search hotel name"
                      className="w-full md:w-64 h-10 px-3 border border-gray-300 rounded"
                    />
                    <div className="hidden md:flex items-center space-x-2">
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
                      <SelectItem
                        value="rating"
                        className="text-sm sm:text-base"
                      >
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
                  <>
                    {[...Array(6)].map((_, i) => (
                      <HotelCardSkeleton key={`skeleton-${i}`} />
                    ))}
                  </>
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
                      ����� Retry Search
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
      </div>

      {/* Hotel Conversational Bargain Modal */}
      <ConversationalBargainModal
        hotel={
          selectedHotel
            ? {
                id: selectedHotel.id,
                name: selectedHotel.name,
                location: selectedHotel.location,
                checkIn:
                  urlSearchParams.get("checkIn") ||
                  new Date().toISOString().split("T")[0],
                checkOut:
                  urlSearchParams.get("checkOut") ||
                  new Date(Date.now() + 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                price: (() => {
                  const perNight = getCheapestPerNight(selectedHotel);
                  const breakdown = calculateTotalPrice(
                    perNight,
                    nights,
                    roomsCount,
                  );
                  return breakdown.total;
                })(),
                rating: selectedHotel.rating,
              }
            : null
        }
        isOpen={isBargainModalOpen}
        onClose={() => {
          setIsBargainModalOpen(false);
          setSelectedHotel(null);
        }}
        onAccept={(finalPrice, orderRef) => {
          console.log(
            "Hotel bargain booking success with price:",
            finalPrice,
            "Order ref:",
            orderRef,
          );
          setIsBargainModalOpen(false);

          // Navigate to booking page with hotel, room, and search data
          if (selectedHotel) {
            navigate("/hotels/booking", {
              state: {
                selectedHotel: {
                  ...selectedHotel,
                  price: finalPrice,
                  bargainApplied: true,
                  orderRef,
                },
                searchParams: {
                  destination: destination,
                  destinationName: urlSearchParams.get("destinationName"),
                  checkIn: urlSearchParams.get("checkIn"),
                  checkOut: urlSearchParams.get("checkOut"),
                  guests: {
                    adults: parseInt(urlSearchParams.get("adults") || "2"),
                    children: parseInt(urlSearchParams.get("children") || "0"),
                    rooms: parseInt(urlSearchParams.get("rooms") || "1"),
                  },
                  nights,
                },
              },
            });
          }
          setSelectedHotel(null);
        }}
        onHold={(orderRef) => {
          console.log("Hotel bargain offer on hold with order ref:", orderRef);
        }}
        userName={userFirstName}
        module="hotels"
        basePrice={(() => {
          const perNight = getCheapestPerNight(selectedHotel);
          const breakdown = calculateTotalPrice(perNight, nights, roomsCount);
          return breakdown.total;
        })()}
        productRef={selectedHotel?.id || ""}
      />

      {/* Mobile Dropdown Components for Edit Search */}
      <MobileCityDropdown
        isOpen={showEditDestination}
        onClose={() => setShowEditDestination(false)}
        title="Edit destination"
        cities={cityData}
        selectedCity={editDestination}
        onSelectCity={setEditDestination}
        context="hotels"
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
        bookingType="hotels"
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

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}

// Wrap component in ErrorBoundary to prevent blank screen on errors
export default function HotelResults() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We encountered an error loading the hotels. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <HotelResultsContent />
    </ErrorBoundary>
  );
}
