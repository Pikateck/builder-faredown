import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  buildTboSearchUrl,
  convertComprehensiveFiltersToTbo,
  deserializeFiltersFromUrl,
} from "@/services/tbo/search";
import { buildTboFilterPayload } from "@/lib/tboFilterMap";
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
import {
  logHotelSearchResponse,
  ApiPerformanceMarker,
} from "@/utils/fdApiLogger";

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

      // Initialize dates from URL params (checkIn/checkOut for hotels)
      const checkInParam = urlSearchParams.get("checkIn");
      const checkOutParam = urlSearchParams.get("checkOut");
      if (checkInParam) {
        try {
          const inDate = new Date(checkInParam);
          if (!isNaN(inDate.getTime())) {
            setDepartureDate(inDate);
          }
        } catch (e) {
          console.warn("Failed to parse checkIn date:", checkInParam);
        }
      }
      if (checkOutParam) {
        try {
          const outDate = new Date(checkOutParam);
          if (!isNaN(outDate.getTime())) {
            setReturnDate(outDate);
          }
        } catch (e) {
          console.warn("Failed to parse checkOut date:", checkOutParam);
        }
      }

      // Also initialize filters from URL if present
      const savedFilters = deserializeFiltersFromUrl(urlSearchParams);
      if (Object.keys(savedFilters).length > 0) {
        // Convert TBO format filters back to ComprehensiveFilters format
        const comprehensiveFilters: Record<string, string[] | string> = {};
        if (savedFilters.stars?.length) {
          comprehensiveFilters["stars"] = savedFilters.stars;
        }
        if (savedFilters.qPropertyName) {
          comprehensiveFilters["qPropertyName"] = savedFilters.qPropertyName;
        }
        if (savedFilters.qAddress) {
          comprehensiveFilters["qAddress"] = savedFilters.qAddress;
        }
        if (savedFilters.qRoomName) {
          comprehensiveFilters["qRoomName"] = savedFilters.qRoomName;
        }
        if (savedFilters.mealPlans?.length) {
          comprehensiveFilters["meal-plans"] = savedFilters.mealPlans;
        }
        if (savedFilters.cancellation?.length) {
          comprehensiveFilters["cancellation"] = savedFilters.cancellation;
        }
        if (savedFilters.amenities?.length) {
          comprehensiveFilters["amenities"] = savedFilters.amenities;
        }
        if (savedFilters.propertyTypes?.length) {
          comprehensiveFilters["property-type"] = savedFilters.propertyTypes;
        }
        if (savedFilters.locations?.length) {
          comprehensiveFilters["neighborhood"] = savedFilters.locations;
        }
        if (savedFilters.guestRating?.length) {
          comprehensiveFilters["guest-rating"] = savedFilters.guestRating;
        }
        if (savedFilters.brands?.length) {
          comprehensiveFilters["brands"] = savedFilters.brands;
        }

        setSelectedFilters(comprehensiveFilters);

        if (
          savedFilters.priceMin !== undefined ||
          savedFilters.priceMax !== undefined
        ) {
          setPriceRange([
            savedFilters.priceMin || 0,
            savedFilters.priceMax || 25000,
          ]);
        }
      }
    }
  }, [urlSearchParams, loadFromUrlParams, setDepartureDate, setReturnDate]);
  const [sortBy, setSortBy] = useState("price-low");
  const [priceRange, setPriceRange] = useState([0, 25000]);
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number }>({
    min: 0,
    max: 25000,
  });
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[] | string | undefined>
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
  const destinationName = urlSearchParams.get("destinationName") || destination;
  const searchType = urlSearchParams.get("searchType") || "";
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
      "��� Loading standardized hotel search object to context:",
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

  // Sync hotel name search from filter to nameQuery state
  useEffect(() => {
    const hotelName = selectedFilters.hotelName as string;
    if (hotelName !== undefined) {
      setNameQuery(hotelName);
    }
  }, [selectedFilters.hotelName]);

  // Helper function to transform hotel images - handle both real URLs and fallbacks
  const transformHotelImages = (
    images: any[],
    hotelName: string = "Hotel",
  ): string[] => {
    // FIRST: Try to use real images from API response
    if (images && Array.isArray(images) && images.length > 0) {
      const processedImages = images
        .map((img: any) => {
          if (typeof img === "string") {
            // If it's already a URL string, use it directly
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
        .filter(Boolean) as string[];

      if (processedImages.length > 0) {
        console.log(
          `✅ Using real images for ${hotelName}: ${processedImages.length} images`,
        );
        return processedImages.slice(0, 6); // Limit to 6 images max
      }
    }

    // FALLBACK ONLY if no real images available
    console.warn(
      `⚠️ No real images found for ${hotelName}, using placeholder gallery`,
    );
    return [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&auto=format",
    ];
  };

  // Fallback function - ONLY used when live TBO API fails completely
  // This ensures identical hotel names and images across Builder preview and Netlify
  const loadMockHotels = async () => {
    console.warn(
      "⚠️ FALLBACK: Loading mock hotels from backend API (live TBO API unavailable)...",
    );
    console.warn(
      "⚠️ Mock prices may differ from live prices - this should only happen during API outages",
    );

    try {
      // Build API URL with proper fallback
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        "https://builder-faredown-pricing.onrender.com/api";
      const cityCode = destination || "DXB";
      const countryCodeMap: Record<string, string> = {
        DXB: "AE",
        DEL: "IN",
        PAR: "FR",
        LDN: "GB",
        NYC: "US",
      };
      const countryCode = countryCodeMap[cityCode] || "AE";

      const apiUrl = `${apiBaseUrl}/hotels?cityId=${cityCode}&countryCode=${countryCode}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`;

      console.log(`🌐 Fetching from backend: ${apiUrl}`);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();

      if (data.hotels && data.hotels.length > 0) {
        console.log(
          `✅ Loaded ${data.hotels.length} hotels from backend mock data`,
        );

        const transformedHotels = transformTBOData(data.hotels);

        setHotels(transformedHotels);
        setTotalResults(transformedHotels.length);
        setIsLiveData(false);
        setHasMore(false);
        setPricingStatus("ready");
        setError(null);
        setLoading(false);

        return transformedHotels;
      } else {
        throw new Error("No hotels returned from backend");
      }
    } catch (err) {
      console.error("❌ Failed to load mock hotels from backend:", err);
      setError(
        "Unable to load hotels. Please check your connection and try again.",
      );
      setHotels([]);
      setTotalResults(0);
      setLoading(false);
      setHasMore(false);
      return [];
    }
  };

  // Load and render hotels (with cache-first pattern)
  const loadHotels = async () => {
    try {
      const startTime = performance.now();
      console.log(`⏱️ [CACHE-FIRST] Starting hotel load at ${new Date().toLocaleTimeString()}`);

      setLoading(true);
      setError(null);

      const destCode = destination || "DXB";
      const adultsCount = parseInt(adults) || 2;
      const childrenCount = parseInt(children) || 0;

      // Fetch hotels
      const hotels = await fetchTBOHotels(destCode);
      const apiTime = performance.now();
      console.log(`⏱️ [CACHE-FIRST] API responded in ${(apiTime - startTime).toFixed(2)}ms`);

      // ✅ CACHE-FIRST: Render immediately
      if (hotels.length > 0) {
        console.log(
          `✅ [CACHE-FIRST] Rendering ${hotels.length} hotels immediately`,
        );
        setHotels(hotels);
        const renderTime = performance.now();
        console.log(`⏱️ [CACHE-FIRST] setHotels called at ${(renderTime - startTime).toFixed(2)}ms`);
        setTotalResults(hotels.length);

        // Calculate price bounds from loaded hotels
        const prices = hotels
          .map((h) => h.currentPrice || 0)
          .filter((p) => p > 0);
        if (prices.length > 0) {
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          setPriceBounds({ min: Math.floor(min), max: Math.ceil(max) });
        }

        setError(null);
      } else {
        setError("No hotels found. Please try a different search.");
      }

      setLoading(false);
      setIsLiveData(false);
    } catch (error) {
      console.error("❌ Error loading hotels:", error);
      setError("Unable to load hotels. Please try again.");
      setHotels([]);
      setLoading(false);
      setIsLiveData(false);
    }
  };

  // Fetch hotel metadata from DB + prices from TBO in parallel (hybrid approach)
  const fetchTBOHotels = async (
    destCode: string,
    selectedFilters?: Record<string, string[]>,
    priceRange?: [number, number],
  ) => {
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

      // Get URL params first
      const urlParams = new URLSearchParams(window.location.search);
      const searchTypeParam = urlParams.get("searchType");

      // CHECK: If searchType=mock, use mock data immediately (explicit override only)
      if (searchTypeParam === "mock") {
        console.log("🎭 Using mock data (searchType=mock)");
        return loadMockHotels();
      }

      // Always use live data to ensure price consistency across all environments
      console.log(
        "✅ Using live TBO data for consistent pricing across all environments",
      );

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

      // Convert ComprehensiveFilters format to TBO filter format
      const tboFilters = selectedFilters
        ? convertComprehensiveFiltersToTbo(selectedFilters, priceRange)
        : undefined;

      // Build API call to cache-backed search endpoint
      const apiUrl = `${apiBaseUrl}/hotels/search`;
      const searchPayload = {
        cityId: destCode,
        destination: destinationName || destCode || "Dubai",
        cityName: destinationName || destCode || "Dubai",
        countryCode: countryCode,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        rooms: "1",
        adults: adultsCount.toString(),
        children: childrenCount.toString(),
        currency: selectedCurrency?.code || "INR",
      };

      console.log(`📡 API Call: ${apiUrl}`, searchPayload);

      // CACHE-FIRST PATTERN: Load from cache instantly, then refresh live in background
      setLoading(true);
      setError(null);

      let metadataResponse;
      try {
        console.log(
          "📡 Attempting cache-backed search (cache-first pattern):",
          {
            url: apiUrl,
            apiBaseUrl,
            currentOrigin:
              typeof window !== "undefined" ? window.location.origin : "N/A",
            envViteUrl: import.meta.env.VITE_API_BASE_URL,
          },
        );

        // Attempt fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (TBO can be slow)

        try {
          metadataResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(searchPayload),
            credentials: "include",
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (fetchError) {
        const errorDetails = {
          url: apiUrl,
          apiBaseUrl,
          message: fetchError?.message || "Unknown error",
          name: fetchError?.name || "UnknownError",
        };
        console.error("❌ Fetch failed:", errorDetails);
        console.log("⚠️ Network error - falling back to mock data");

        // Use mock data as fallback for ANY error (network, CORS, parsing, etc.)
        return loadMockHotels();
      }

      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text();
        let errorBody = null;
        try {
          errorBody = JSON.parse(errorText);
        } catch (e) {
          errorBody = errorText;
        }

        console.error("❌ TBO API returned error:", {
          status: metadataResponse.status,
          statusText: metadataResponse.statusText,
          body: errorBody,
          url: apiUrl,
        });
        console.error(
          "⚠️ PRICE DISCREPANCY WARNING: Falling back to mock data with different prices!",
        );
        console.error(
          "⚠️ This may cause price differences between environments. Fix TBO API connection to resolve.",
        );
        return loadMockHotels();
      }

      let metadataData;
      try {
        metadataData = await metadataResponse.json();
      } catch (jsonError) {
        console.error(
          "❌ Failed to parse metadata response as JSON:",
          jsonError,
        );
        console.log("⚠️ JSON parse error - falling back to mock data");
        return loadMockHotels();
      }

      // Check if API returned success
      if (!metadataData.success) {
        console.warn("⚠️ API returned error status", {
          error: metadataData.error,
          source: metadataData.source,
        });
        console.log("⚠️ API error - falling back to mock data");
        return loadMockHotels();
      }

      // Log cache source for transparency
      console.log(
        `✅ Results from ${metadataData.source === "cache" ? "CACHE (fast)" : "TBO API (fresh)"}`,
      );
      if (metadataData.cacheHit) {
        console.log(
          `📅 Cached at: ${new Date(metadataData.cachedAt).toLocaleTimeString()}`,
        );
        console.log(
          `⏰ Expires at: ${new Date(metadataData.ttlExpiresAt).toLocaleTimeString()}`,
        );
      }

      if (
        !metadataData ||
        !metadataData.hotels ||
        metadataData.hotels.length === 0
      ) {
        console.warn("⚠️ No metadata hotels found from API");
        console.warn("��️ API response:", metadataData);
        console.log("⚠️ No results from API - falling back to mock data");
        // CRITICAL: Load mock hotels immediately
        const mockHotels = loadMockHotels();
        console.log(`📦 Fallback loaded ${mockHotels.length} mock hotels`);
        return mockHotels;
      }

      // CRITICAL: Convert metadata to Hotel format WITH REAL IMAGES
      const metadataHotels: Hotel[] = metadataData.hotels.map(
        (h: any, i: number) => {
          // Get thumbnail or use images array - prefer thumbnail for list view
          const thumbnail = h.thumbnail || (h.images?.[0] ?? null);
          const galleryImages =
            h.images && Array.isArray(h.images) ? h.images : [];
          const allImages = thumbnail
            ? [thumbnail, ...galleryImages]
            : galleryImages;

          // ✅ FIX: Calculate total price for the stay
          const currentPrice = h.minTotal || h.price?.offered || h.currentPrice || h.price || 0;
          const totalPrice = currentPrice * Math.max(1, nights);

          console.log(`📸 Hotel ${h.name}: ${allImages.length} images, price: ${currentPrice} x ${nights} nights = ${totalPrice}`);

          return {
            id: h.hotelId || h.id || `hotel-${i}`,
            name: h.name,
            location: h.location || h.address || destCode,
            locationTags: h.locationTags || [],
            // ✅ FIX: Pass raw images array to HotelCard for proper binding
            images: allImages.length > 0 ? allImages : transformHotelImages([], h.name),
            rating: h.starRating || h.reviewScore || h.stars || h.rating || 4.0,
            reviewScore:
              h.starRating || h.reviewScore || h.stars || h.rating || 4.0,
            reviews: h.reviewCount || 0,
            reviewCount: h.reviewCount || 0,
            // ✅ FIX: Use real prices from API (minTotal/maxTotal for mock data, price.offered for live)
            currentPrice: currentPrice,
            originalPrice:
              h.maxTotal ||
              h.price?.published ||
              h.originalPrice ||
              h.price?.offered ||
              h.price ||
              0,
            // ✅ FIX: Add totalPrice for proper sorting
            totalPrice: totalPrice,
            description: `Discover ${h.name}`,
            amenities: h.amenities || [],
            features: h.features || h.roomFeatures || [],
            roomTypes:
              (h.rates || h.rooms) && (h.rates || h.rooms).length > 0
                ? (h.rates || h.rooms).map((r: any) => ({
                    id: r.id || r.roomId || Math.random().toString(),
                    name: r.roomType || r.roomName || r.description,
                    type: r.roomType || r.roomName || r.description,
                    bedType: r.beds || r.bedType || "",
                    pricePerNight:
                      r.price?.base ||
                      r.pricePerNight ||
                      (r.price?.total || r.price || 0) / Math.max(1, nights),
                    isRefundable:
                      r.isRefundable !== undefined
                        ? r.isRefundable
                        : h.isRefundable,
                    cancellationPolicy: r.isRefundable
                      ? "Free cancellation"
                      : "Non-refundable",
                    board: r.board || "Room Only",
                  }))
                : [],
            roomType: h.roomType || "",
            roomFeatures: h.roomFeatures || [],
            isRefundable: h.isRefundable || false,
            breakfastIncluded: h.breakfastIncluded || false,
            freeCancellation: h.freeCancellation || false,
            payAtProperty: h.payAtProperty || false,
            address: {
              street: "",
              city: destCode,
              country: "Unknown",
              postalCode: "00000",
            },
            starRating:
              h.starRating || h.reviewScore || h.stars || h.rating || 4,
            currency:
              h.price?.currency ||
              h.currency ||
              selectedCurrency?.code ||
              "INR",
            supplier: h.source || h.supplier || "TBO",
            supplierCode: h.supplier?.toLowerCase() || "tbo",
            isLiveData: h.source === "tbo" || h.isLiveData !== false,
            priceRange: {
              min:
                h.minTotal ||
                h.price?.offered ||
                h.currentPrice ||
                h.price ||
                0,
              max:
                h.maxTotal ||
                h.price?.published ||
                h.originalPrice ||
                h.price?.offered ||
                h.price ||
                0,
            },
          };
        },
      );

      console.log("✅ Metadata loaded:", metadataHotels.length, "hotels");

      // Log search response with diagnostic info
      const priceValues = metadataHotels
        .map((h) => h.currentPrice || 0)
        .filter((p) => p > 0);
      const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
      const maxPrice = priceValues.length > 0 ? Math.max(...priceValues) : 0;

      logHotelSearchResponse(
        metadataHotels.length,
        metadataData.meta || { source: metadataData.source },
        {
          min: minPrice,
          max: maxPrice,
        },
      );

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
      console.log("🔄 Falling back to mock hotels on error");
      return loadMockHotels();
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

      console.log("���� Fetching live TBO prices...");

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
        console.log("����� Merging prices into hotels...");
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
      // Support both TBO format (rooms) and mock format (rates)
      const roomsArray = hotel.rooms || hotel.rates || [];

      // Create variety in breakfast and refundable options for demo/testing
      // Alternating pattern: odd index = included/refundable, even = not included/non-refundable
      const hasBreakfast =
        hotel.breakfastIncluded !== undefined
          ? hotel.breakfastIncluded
          : index % 2 === 1; // Alternate between true and false
      const isRefundable =
        hotel.freeCancellation === true ||
        hotel.cancellationPolicy?.toLowerCase().includes("free") ||
        hotel.cancellationPolicy?.toLowerCase().includes("cancel")
          ? true
          : hotel.isRefundable !== undefined
            ? hotel.isRefundable
            : index % 3 !== 0; // 2 out of 3 are refundable

      // Find cheapest room from available rates/rooms
      const cheapestRoom =
        roomsArray && roomsArray.length > 0
          ? roomsArray.reduce((best: any, room: any) => {
              const roomPrice = room.price?.total || room.price || Infinity;
              const bestPrice = best.price?.total || best.price || Infinity;
              return roomPrice < bestPrice ? room : best;
            }, roomsArray[0])
          : {
              roomName: hotel.roomType || "Standard Room",
              roomType: hotel.roomType || "Standard Room",
              beds: hotel.roomFeatures?.[0] || "1 Double Bed",
              bedType: hotel.roomFeatures?.[0] || "1 Double Bed",
              price: hotel.price || hotel.minTotal || 0,
              isRefundable: hotel.isRefundable,
              cancellationPolicy: hotel.cancellationPolicy || "",
              description: "",
              board: "Room Only",
            };

      return {
        id: hotel.supplierHotelId || `tbo-${index}`,
        name: hotel.name || `Hotel ${destination}`,
        location: hotel.address
          ? `${hotel.address}, ${hotel.city || destination}`
          : `${hotel.city || destination}, ${hotel.countryCode || "IN"}`,
        // ✅ FIX: Pass raw images array, not transformed, for HotelCard to bind properly
        images:
          hotel.images && hotel.images.length > 0
            ? hotel.images
            : transformHotelImages([], hotel.name),
        rating: hotel.rating || hotel.reviewScore || hotel.starRating || 4.0,
        reviews: hotel.reviewCount || 0,
        originalPrice:
          hotel.maxTotal || hotel.minTotal || hotel.price
            ? Math.round(
                hotel.maxTotal || (hotel.minTotal || hotel.price) * 1.15,
              )
            : 0,
        currentPrice: hotel.minTotal || hotel.price || 0,
        // ✅ FIX: Add totalPrice for proper sorting
        totalPrice: (hotel.minTotal || hotel.price || 0) * Math.max(1, nights),
        description: hotel.description || `Discover ${hotel.name}`,
        amenities: hotel.amenities || [],
        features: hotel.amenities?.slice(0, 3) || [],
        roomTypes: roomsArray.map((room: any) => ({
          id:
            room.roomId ||
            `room-${hotel.supplierHotelId}-${room.roomName || room.roomType}`,
          name:
            room.roomName ||
            room.roomType ||
            room.description ||
            "Standard Room",
          description: room.roomDescription || room.description || "",
          price:
            room.price?.total ||
            room.price ||
            hotel.minTotal ||
            hotel.price ||
            0,
          pricePerNight:
            room.price?.base ||
            (room.price?.total || room.price || 0) / Math.max(1, nights) ||
            0,
          tax: room.price?.taxes || 0,
          board: room.board || "Room Only",
          bedType: room.bedType || room.beds || "Standard Bed",
          occupants: room.occupants || {
            adults: parseInt(adults) || 2,
            children: parseInt(children) || 0,
          },
          cancellation: room.cancellation || [],
          amenities: room.amenities || [],
          features: [
            room.board || "Room Only",
            room.bedType || room.beds || "",
            ...(room.amenities || []).slice(0, 1),
          ].filter(Boolean),
          rateKey:
            room.rateKey ||
            room.token ||
            `room-${hotel.supplierHotelId}-${room.roomName || room.roomType}`,
          refundable:
            room.isRefundable !== undefined
              ? room.isRefundable
              : room.cancellation && room.cancellation.length > 0,
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
        boardType: cheapestRoom?.board || "Room Only",
        availableRoom: {
          type:
            cheapestRoom.roomName ||
            cheapestRoom.roomType ||
            cheapestRoom.description ||
            "Standard Room",
          bedType: cheapestRoom.bedType || cheapestRoom.beds || "1 Double Bed",
          rateType: cheapestRoom.board || "Room Only",
          paymentTerms:
            cheapestRoom.payType === "at_hotel" || hotel.payAtProperty
              ? "Pay at Hotel"
              : "Prepaid",
          cancellationPolicy:
            cheapestRoom.cancellationPolicy ||
            (isRefundable ? "Free cancellation" : "Non-refundable"),
          description:
            cheapestRoom.roomDescription || cheapestRoom.description || "",
          isRefundable:
            cheapestRoom.isRefundable !== undefined
              ? cheapestRoom.isRefundable
              : isRefundable,
        },
        propertyType: hotel.propertyType || "HOTEL",
        brand: hotel.brand || hotel.hotelBrand || "",
        supplier: "TBO",
        supplierCode: "tbo",
        isLiveData: hotel.isLiveData !== false,
        priceBreakdown: roomsArray?.[0]?.price?.breakdown || null,
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

      // Track performance
      const perfMarker = new ApiPerformanceMarker("hotel-search-page");

      // Fetch ONLY from TBO (no Hotelbeds) with applied filters
      const tboHotels = await fetchTBOHotels(
        destCode,
        selectedFilters,
        priceRange as [number, number],
      );

      console.log(`✅ TBO Results: ${tboHotels.length} hotels found`);
      perfMarker.end({ source: "cache" });

      if (append) {
        setHotels((prev) => {
          const merged = [...prev, ...tboHotels];
          console.log(
            `📦 Merged hotels: ${merged.length} total (${tboHotels.length} added)`,
          );
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
        // CRITICAL: Set hotels immediately for instant cache-first render
        console.log(
          `🎬 Setting ${tboHotels.length} hotels to state for instant render`,
        );
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

      console.log("✅ Hotels ready for render");
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

  // ⚠️ DEPRECATED: Frontend mock hotel data - DO NOT USE
  // This creates inconsistency between Builder preview and Netlify
  // Always fetch from backend API at /api/hotels which has unified mock data
  const getMockHotels = (): Hotel[] => {
    console.warn(
      "⚠️ WARNING: getMockHotels() should not be used. Use backend API instead.",
    );
    return [];
  };

  // Old frontend mock data (kept for reference but not used)
  const _oldMockHotelsReferenceOnly = (): Hotel[] => [
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
      originalPrice: 1250, // ��1250 per night (original price)
      currentPrice: 950, // ₹950 per night (current discounted price)
      description: `Experience luxury in the heart of ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"} with stunning views, world-class amenities, and exceptional service.`,
      amenities: ["WiFi", "Parking", "Restaurant", "Gym", "Pool", "Spa"],
      features: ["City View", "Business Center", "Concierge", "Room Service"],
      roomTypes: [
        {
          name: "Standard Room",
          price: 950, // ₹950 per night (matches currentPrice)
          features: ["King Bed", "City View", "Free WiFi"],
        },
        {
          name: "Deluxe Suite",
          price: 1100, // ���1100 per night (upgrade option)
          features: ["Living Area", "Ocean View", "Mini Bar"],
        },
        {
          name: "Presidential Suite",
          price: 1350, // ₹1350 per night (premium option)
          features: ["2 Bedrooms", "Private Balcony", "Butler Service"],
        },
      ],
      availableRoom: {
        type: "1 X Twin Classic",
        bedType: "Twin bed",
        rateType: "Non Refundable Rate",
        paymentTerms: "No prepayment needed",
        cancellationPolicy: "Non-refundable",
        isRefundable: false,
      },
      isRefundable: false,
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
      originalPrice: 1100, // ₹1100 per night (original price)
      currentPrice: 850, // ₹850 per night (current discounted price)
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
          price: 850, // ₹850 per night (matches currentPrice)
          features: ["Queen Bed", "Ocean View", "Balcony"],
        },
        {
          name: "Beach Villa",
          price: 1200, // ₹1200 per night (upgrade option)
          features: ["Private Beach Access", "Outdoor Shower", "Terrace"],
        },
      ],
      availableRoom: {
        type: "1 X Queen Superior",
        bedType: "Queen bed",
        rateType: "Flexible Rate",
        paymentTerms: "Pay at the property",
        cancellationPolicy: "Free cancellation until 2 days before",
        isRefundable: true,
      },
      isRefundable: true,
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
      originalPrice: 980, // ₹980 per night (original price)
      currentPrice: 750, // ₹750 per night (current discounted price)
      description: `Charming boutique hotel in ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"} with unique character and personalized service.`,
      amenities: ["Ski Access", "Fireplace", "Spa", "Restaurant", "WiFi"],
      features: ["Ski-in/Ski-out", "Mountain Views", "Fireplace", "Hot Tub"],
      roomTypes: [
        {
          name: "Standard Room",
          price: 750, // ₹750 per night (matches currentPrice)
          features: ["Fireplace", "Mountain View", "Cozy Decor"],
        },
        {
          name: "Alpine Suite",
          price: 950, // ₹950 per night (upgrade option)
          features: ["Separate Living Area", "Hot Tub", "Ski Storage"],
        },
      ],
      availableRoom: {
        type: "1 X King Premium",
        bedType: "King bed",
        rateType: "Best Available Rate",
        paymentTerms: "Prepayment required",
        cancellationPolicy: "Non-refundable",
        isRefundable: false,
      },
      isRefundable: false,
      breakfastIncluded: true,
      breakfastType: "American Breakfast",
    },
    {
      id: 4,
      name: `Luxury Resort ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"}`,
      location: `Beach Area, ${urlSearchParams.get("destinationName") || destination || "Dubai, United Arab Emirates"}`,
      images: [
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&q=80&auto=format&fit=crop",
      ],
      rating: 4.7,
      reviews: 2100,
      originalPrice: 1500,
      currentPrice: 1100,
      description: `Premium luxury resort with exceptional amenities and stunning beach views.`,
      amenities: ["Beach", "WiFi", "Spa", "Restaurant", "Bar", "Pool", "Gym"],
      features: [
        "Private Beach",
        "Water Sports",
        "Kids Club",
        "All-Inclusive Options",
      ],
      roomTypes: [
        {
          name: "Deluxe Room",
          price: 1100,
          features: ["Ocean View", "King Bed", "Private Balcony"],
        },
        {
          name: "Beach Villa",
          price: 1500,
          features: ["Direct Beach Access", "2 Bedrooms", "Private Pool"],
        },
      ],
      availableRoom: {
        type: "1 X Deluxe Ocean View",
        bedType: "King bed",
        rateType: "Flexible Rate",
        paymentTerms: "Pay at property",
        cancellationPolicy: "Free cancellation until 1 day before",
        isRefundable: true,
      },
      isRefundable: true,
      breakfastIncluded: true,
      breakfastType: "Full Breakfast Buffet",
    },
    {
      id: 5,
      name: `City Center Inn ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"}`,
      location: `Downtown, ${urlSearchParams.get("destinationName") || destination || "Dubai, United Arab Emirates"}`,
      images: [
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&q=80&auto=format&fit=crop",
      ],
      rating: 4.4,
      reviews: 890,
      originalPrice: 800,
      currentPrice: 650,
      description: `Affordable city center accommodation perfect for budget-conscious travelers.`,
      amenities: ["WiFi", "Parking", "Restaurant", "24h Reception"],
      features: ["Central Location", "Metro Access", "Shopping Nearby"],
      roomTypes: [
        {
          name: "Standard Twin",
          price: 650,
          features: ["Twin Beds", "City View", "Free WiFi"],
        },
        {
          name: "Family Room",
          price: 850,
          features: ["2 Double Beds", "Kitchenette", "Living Area"],
        },
      ],
      availableRoom: {
        type: "1 X Standard Twin",
        bedType: "Twin beds",
        rateType: "Non-refundable Rate",
        paymentTerms: "Prepayment required",
        cancellationPolicy: "Non-refundable",
        isRefundable: false,
      },
      isRefundable: false,
      breakfastIncluded: false,
    },
    {
      id: 6,
      name: `Executive Suites ${urlSearchParams.get("destinationName")?.split(",")[0] || destination || "Dubai"}`,
      location: `Financial District, ${urlSearchParams.get("destinationName") || destination || "Dubai, United Arab Emirates"}`,
      images: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800&h=600&q=80&auto=format&fit=crop",
      ],
      rating: 4.5,
      reviews: 1450,
      originalPrice: 1300,
      currentPrice: 1050,
      description: `Modern executive suites designed for business travelers with premium amenities.`,
      amenities: [
        "WiFi",
        "Gym",
        "Business Center",
        "Meeting Rooms",
        "Restaurant",
        "Bar",
      ],
      features: [
        "Executive Lounge",
        "Airport Shuttle",
        "Conference Facilities",
      ],
      roomTypes: [
        {
          name: "Executive Room",
          price: 1050,
          features: ["Work Desk", "Lounge Access", "Express Checkout"],
        },
        {
          name: "Corner Suite",
          price: 1400,
          features: ["Panoramic Views", "Separate Office", "Meeting Space"],
        },
      ],
      availableRoom: {
        type: "1 X Executive Room",
        bedType: "King bed",
        rateType: "Corporate Rate",
        paymentTerms: "Flexible payment",
        cancellationPolicy: "Free cancellation until 3 days before",
        isRefundable: true,
      },
      isRefundable: true,
      breakfastIncluded: true,
      breakfastType: "Continental Breakfast",
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
        if (categoryId === "stars") {
          const stars = Math.floor(hotel.rating || 0);
          const match = filterIds.some((fid) => parseInt(fid) === stars);
          if (!match) return false;
        }

        if (categoryId === "cancellation") {
          // Handle cancellation policy filters
          const hasMatchingCancellation = filterIds.some((filterId) => {
            const hasFreeCancellation = hotel.freeCancellation === true;
            const isPartiallyRefundable =
              hotel.isRefundable === true && !hotel.freeCancellation;
            const isNonRefundable = hotel.isRefundable === false;

            if (filterId === "FC" && hasFreeCancellation) return true;
            if (filterId === "PR" && isPartiallyRefundable) return true;
            if (filterId === "NR" && isNonRefundable) return true;
            return false;
          });
          if (!hasMatchingCancellation) return false;
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

        if (categoryId === "stars") {
          const hasMatchingStars = filterIds.some((filterId) => {
            const stars = Math.floor(hotel.rating || 0);
            return parseInt(filterId) === stars;
          });
          if (!hasMatchingStars) return false;
        }

        if (categoryId === "cancellation") {
          // Handle cancellation policy filters
          const hasMatchingCancellation = filterIds.some((filterId) => {
            const hasFreeCancellation = hotel.freeCancellation === true;
            const isPartiallyRefundable =
              hotel.isRefundable === true && !hotel.freeCancellation;
            const isNonRefundable = hotel.isRefundable === false;

            if (filterId === "FC" && hasFreeCancellation) return true;
            if (filterId === "PR" && isPartiallyRefundable) return true;
            if (filterId === "NR" && isNonRefundable) return true;
            return false;
          });
          if (!hasMatchingCancellation) return false;
        }

        if (categoryId === "meal-plans") {
          // Handle meal plan filters based on cheapest room's board type
          const boardType = hotel.boardType || "Room Only";
          const hasMatchingMealPlan = filterIds.some((filterId) => {
            const boardMap: Record<string, string> = {
              RO: "Room Only",
              BB: "Breakfast",
              HB: "Half Board",
              FB: "Full Board",
              DN: "Dinner",
            };
            const expectedBoard = boardMap[filterId];
            // Check if the board type matches or contains the expected board
            return (
              boardType?.includes?.(expectedBoard) ||
              boardType === expectedBoard ||
              (filterId === "BB" && hotel.breakfastIncluded) ||
              (filterId === "RO" &&
                !hotel.breakfastIncluded &&
                boardType === "Room Only")
            );
          });
          if (!hasMatchingMealPlan) return false;
        }

        if (categoryId === "property-type") {
          // Handle property type filters
          const hotelPropertyType = hotel.propertyType || "HOTEL";
          const hasMatchingPropertyType = filterIds.some(
            (filterId) => filterId === hotelPropertyType,
          );
          if (!hasMatchingPropertyType) return false;
        }

        if (categoryId === "brands") {
          // Handle hotel brand filters
          const hotelBrand = hotel.brand || hotel.hotelBrand || "";
          const hasMatchingBrand = filterIds.some((filterId) => {
            // Normalize brand names for comparison
            const brandMap: Record<string, string> = {
              "millennium-hotels": "Millennium",
              jumeirah: "Jumeirah",
              "rove-hotels": "ROVE",
              "address-hotels": "The Address",
              "oyo-rooms": "OYO",
              movenpick: "Mövenpick",
              "premier-inn": "Premier Inn",
              "rotana-hotels": "Rotana",
              marriott: "Marriott",
              belvilla: "Belvilla",
            };
            const expectedBrand = brandMap[filterId];
            return (
              hotelBrand?.includes?.(expectedBrand) ||
              hotelBrand === expectedBrand
            );
          });
          if (!hasMatchingBrand) return false;
        }

        if (categoryId === "guest-rating") {
          // Handle guest rating filters
          const hasMatchingGuestRating = filterIds.some((filterId) => {
            const rating = Math.floor(hotel.rating || 0);
            if (filterId === "EXCELLENT" && rating >= 8) return true;
            if (filterId === "VERY_GOOD" && rating >= 7 && rating < 8)
              return true;
            if (filterId === "GOOD" && rating >= 6 && rating < 7) return true;
            return false;
          });
          if (!hasMatchingGuestRating) return false;
        }

        if (categoryId === "neighborhood") {
          // Handle neighborhood/location filters
          const hotelLocation = (
            hotel.location ||
            hotel.address?.city ||
            ""
          ).toLowerCase();
          const hasMatchingNeighborhood = filterIds.some((filterId) => {
            const locationMap: Record<string, string[]> = {
              "dubai-coastline": ["coastline", "beach", "marina"],
              "near-dubai-mall": ["dubai mall", "downtown"],
              "nightlife-areas": ["nightlife", "bar", "club"],
              "beachfront-jbr": ["jbr", "beach", "jumeirah"],
              "traditional-souks": ["souks", "deira", "old dubai"],
              "iconic-landmarks": ["landmarks", "burj", "creek"],
              "metro-stations": ["metro", "station"],
              "family-attractions": ["family", "park", "theme park"],
              "residential-areas": ["residential", "villa"],
            };
            const keywords = locationMap[filterId] || [];
            return keywords.some((keyword) => hotelLocation.includes(keyword));
          });
          if (!hasMatchingNeighborhood) return false;
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

  // Sync filter changes to URL
  useEffect(() => {
    // Build filter params for URL
    const params = new URLSearchParams(urlSearchParams);

    // Clear existing filter params
    Array.from(params.keys()).forEach((key) => {
      if (
        [
          "stars",
          "mealPlans",
          "cancellation",
          "amenities",
          "propertyTypes",
          "locations",
          "guestRating",
          "brands",
          "priceMin",
          "priceMax",
        ].includes(key)
      ) {
        params.delete(key);
      }
    });

    // Convert ComprehensiveFilters back to TBO format and add to URL
    const tboFilters = convertComprehensiveFiltersToTbo(
      selectedFilters,
      priceRange as [number, number],
    );
    const filterPayload = buildTboFilterPayload(tboFilters);

    Object.entries(filterPayload).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          params.append(key, String(item));
        });
      } else if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    // Update URL without navigation
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [selectedFilters, priceRange]);

  const handleClearFilters = () => {
    setSelectedFilters({});
    setSortBy("recommended");
    setPriceRange([priceBounds.min, priceBounds.max]);
    loadHotels();
  };

  return (
    <div
      id="app-root"
      className="min-h-screen bg-gray-50"
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
        <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3">
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
        <div className="bg-white border-b border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 font-medium text-sm"
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
        <div className="bg-white border-b border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
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
        <div className="px-2 sm:px-3 py-2 space-y-2 sm:space-y-3 pb-24">
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
            <div
              className="fixed inset-0 bg-black/40 z-0"
              onClick={() => setShowFilters(false)}
            />
            <div className="relative w-full bg-white rounded-t-3xl shadow-2xl h-[90vh] flex flex-col z-10">
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
        <div className="bg-[#003580] py-2 sm:py-3 lg:py-4">
          <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-4 lg:px-8">
            <HotelSearchForm
              initialDestination={destinationName}
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
          <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-8 py-2">
            <div className="flex items-center text-sm text-gray-600">
              <span>���� Global</span>
              <span className="mx-2">•</span>
              <span>
                {urlSearchParams.get("destinationName") ||
                  destination ||
                  "Dubai"}
              </span>
              <span className="mx-2">��</span>
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-4 lg:px-8 py-4 md:py-6">
          <div className="flex gap-6">
            {/* Desktop Filters */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 sticky top-24">
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
                <div>
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
                    className="border-0"
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

                  {/* View Mode Buttons */}
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
                    <h2 className="text-base sm:text-lg font-medium text-red-600 mb-2">
                      {error}
                    </h2>
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
                  <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    No hotels available for your search
                  </h2>
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
          setIsBargainModalOpen(false);

          // Navigate to booking page with hotel, room, and search data
          if (selectedHotel) {
            // Build return URL to go back to results page with all filters/params preserved
            const returnUrl = `/hotels/results?${urlSearchParams.toString()}`;

            navigate("/hotels/booking", {
              state: {
                selectedHotel: {
                  ...selectedHotel,
                  price: finalPrice,
                  negotiatedPrice: finalPrice,
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
                // Pass return URL so back button knows where to go
                returnUrl,
                negotiatedPrice: finalPrice,
                bargainedPrice: finalPrice,
                originalPrice: selectedHotel?.price,
              },
            });
          }
          setSelectedHotel(null);
        }}
        onHold={(orderRef) => {
          // Bargain on hold - silent handling
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
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
