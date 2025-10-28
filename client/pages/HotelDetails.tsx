import React, { useState, useEffect, useRef, useMemo } from "react";

// Custom slider styles
const sliderStyles = `
  .slider {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .slider::-webkit-slider-track {
    background: #e5e7eb;
    height: 8px;
    border-radius: 4px;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    background: #2563eb;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    cursor: pointer;
  }

  .slider::-moz-range-track {
    background: #e5e7eb;
    height: 8px;
    border-radius: 4px;
  }

  .slider::-moz-range-thumb {
    background: #2563eb;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BargainButton } from "@/components/ui/BargainButton";
import { ComprehensiveFilters } from "@/components/ComprehensiveFilters";
import { calculateTotalPrice as calculatePriceBreakdown } from "@/lib/pricing";
import {
  convertComprehensiveFiltersToTbo,
  deserializeFiltersFromUrl,
} from "@/services/tbo/search";
import {
  Star,
  MapPin,
  Share2,
  ChevronDown,
  Bookmark,
  Search,
  Filter,
  Car,
  Utensils,
  Waves,
  Dumbbell,
  Building2,
  Sparkles,
  Baby,
  Shirt,
  Briefcase,
  Shield,
  Info,
  MessageSquare,
  Cigarette,
  Coffee,
  ChefHat,
  Wifi,
  Home,
  Accessibility,
  CreditCard,
  Key,
  Camera,
  Bell,
  Languages,
  Flame,
  Lock,
  ArrowUpDown,
  CheckCircle,
  X,
  ChevronLeft,
  TrendingDown,
} from "lucide-react";
import { MobileNavBar } from "@/components/mobile/MobileNavBar";
import { MobileBottomBar } from "@/components/mobile/MobileBottomBar";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { hotelsService } from "@/services/hotelsService";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { HotelSearchForm } from "@/components/HotelSearchForm";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { useDateContext } from "@/contexts/DateContext";
import { useSearch } from "@/contexts/SearchContext";
import ReviewModal from "@/components/ReviewModal";
import ReviewsSection from "@/components/ReviewsSection";
import CollapsedSearchSummary from "@/components/CollapsedSearchSummary";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { format } from "date-fns";

export default function HotelDetails() {
  useScrollToTop();
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();
  const { loadDatesFromParams } = useDateContext();
  const { loadFromUrlParams, getDisplayData } = useSearch();
  const [activeTab, setActiveTab] = useState(() => {
    // Check if tab parameter is provided in URL
    const tabParam = searchParams.get("tab");
    return tabParam || "overview";
  });
  const [selectedRoomType, setSelectedRoomType] = useState<any>(null);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isWriteReviewModalOpen, setIsWriteReviewModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);

  // Pre-selected rate data from Results page (single source of truth)
  const preselectRate = (location.state as any)?.preselectRate;

  // Debug trace for details mount
  console.log("[DETAILS PRESELECT]", {
    receivedRateKey: preselectRate?.rateKey,
    receivedTotalPrice: preselectRate?.totalPrice,
    receivedRoomName: preselectRate?.roomName,
    hasPreselectData: !!preselectRate,
  });
  const saveDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        saveDropdownRef.current &&
        !saveDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSaveDropdown(false);
      }
    };

    if (showSaveDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSaveDropdown]);
  const [bargainingRoomId, setBargainingRoomId] = useState<string | null>(null);
  const [bargainedRooms, setBargainedRooms] = useState<Set<string>>(new Set());

  // Get authenticated user's first name
  const authContext = useAuth() || {};
  const { user } = authContext;
  const storedUser = authService.getStoredUser();
  const userFirstName =
    user?.name && user.name.trim()
      ? user.name.split(" ")[0]
      : storedUser?.firstName || "Guest";

  // Hotel bargain modal state
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState(100);
  const [selectedRating, setSelectedRating] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [hotelData, setHotelData] = useState<any>(null);
  const [isLoadingHotel, setIsLoadingHotel] = useState(true);
  const [apiStatus, setApiStatus] = useState<{
    isOffline: boolean;
    message: string;
    type: "error" | "warning" | "info" | null;
  }>({
    isOffline: false,
    message: "",
    type: null,
  });
  const [selectedFilters, setSelectedFilters] = useState({
    popularFilters: new Set<string>(),
    propertyTypes: new Set<string>(),
    facilities: new Set<string>(),
    mealOptions: new Set<string>(),
    starRatings: new Set<string>(),
  });

  // TBO filter state (mirrors HotelResults)
  const [tboSelectedFilters, setTboSelectedFilters] = useState<
    Record<string, string[] | string>
  >({});
  const [filterPriceRange, setFilterPriceRange] = useState<[number, number]>([
    0, 25000,
  ]);
  const [sortBy, setSortBy] = useState("relevance");

  // Initialize TBO filters from URL (same as HotelResults)
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const savedFilters = deserializeFiltersFromUrl(urlSearchParams);

    if (Object.keys(savedFilters).length > 0) {
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

      setTboSelectedFilters(comprehensiveFilters);

      if (
        savedFilters.priceMin !== undefined ||
        savedFilters.priceMax !== undefined
      ) {
        setFilterPriceRange([
          savedFilters.priceMin || 0,
          savedFilters.priceMax || 25000,
        ]);
      }
    }
  }, []);

  // Sync filters to URL when they change (optional - filters can stay local)
  // Skipping URL sync for now as filters are already managed in local state
  // The HotelDetails page doesn't need to persist filters to URL since they're view-local

  // Format date to DD-MMM-YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate().toString().padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  // Get booking parameters from URL or use defaults
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const roomsParam = searchParams.get("rooms");
  const adultsParam = searchParams.get("adults");
  const childrenParam = searchParams.get("children");

  // Calculate dates and nights dynamically
  const checkInDate = checkInParam
    ? new Date(checkInParam)
    : new Date("2025-07-16");
  const checkOutDate = checkOutParam
    ? new Date(checkOutParam)
    : new Date("2025-07-19");
  const totalNights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Format labels for collapsed search summary
  const destination = searchParams.get("destination") || "";
  const destinationCode =
    searchParams.get("destinationCode") || destination.split("-")[1] || "";
  const destinationName =
    searchParams.get("destinationName") ||
    searchParams.get("countryName") ||
    "";

  const cityFull = destinationName || destination;

  const datesLabel = `${format(checkInDate, "EEE, d MMM")} → ${format(checkOutDate, "EEE, d MMM")}`;

  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");

  const paxLabel = `${adults} adult${adults > 1 ? "s" : ""} • ${rooms} room${rooms > 1 ? "s" : ""}${children ? ` • ${children} child${children > 1 ? "ren" : ""}` : ""}`;

  // Load context data from URL parameters
  useEffect(() => {
    loadDatesFromParams(searchParams);
    loadFromUrlParams(searchParams); // Load search parameters into SearchContext
  }, [searchParams, loadDatesFromParams, loadFromUrlParams]);

  // Fetch live hotel data from Hotelbeds API
  useEffect(() => {
    const fetchHotelData = async () => {
      if (!hotelId) return;

      setIsLoadingHotel(true);

      // Helper function to fetch with timeout and retry
      const fetchWithTimeout = async (
        url: string,
        options: RequestInit = {},
        timeout = 10000, // Increased timeout for better stability
      ): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      // Retry logic with graceful fallback
      const attemptFetch = async (retryCount = 0): Promise<any> => {
        try {
          console.log(
            `🏨 Attempt ${retryCount + 1}: Fetching TBO hotel details for: ${hotelId}`,
          );

          // Get supplier code from URL or location state
          const supplier =
            (location.state as any)?.preselectRate?.supplierData
              ?.supplierCode ||
            new URLSearchParams(window.location.search).get("supplier") ||
            "tbo";

          // Check if this is a TBO hotel
          if (supplier === "tbo" || supplier === "TBO") {
            console.log("🏨 Fetching TBO hotel details:", hotelId);

            // Fetch from TBO endpoint with absolute URL
            const searchId =
              new URLSearchParams(window.location.search).get("searchId") || "";
            const apiBaseUrl =
              import.meta.env.VITE_API_BASE_URL ||
              "https://builder-faredown-pricing.onrender.com/api";
            const tboUrl = `${apiBaseUrl}/tbo-hotels/hotel/${hotelId}${searchId ? `?searchId=${searchId}` : ""}`;

            const response = await fetchWithTimeout(tboUrl);

            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (!contentType?.includes("application/json")) {
                throw new Error(
                  `Invalid response type: ${contentType}. Expected JSON but got HTML/other content.`,
                );
              }
              const data = await response.json();
              console.log("✅ TBO Hotel data received:", data);
              if (data.success && data.data) {
                return data.data; // Return TBO UnifiedHotel format
              }
            } else {
              const errorText = await response.text();

              // 404 means hotel not in TBO database - don't retry, use fallback immediately
              if (response.status === 404) {
                console.log(
                  "⚠️ Hotel not in TBO database, will use fallback data from location.state",
                );
                throw new Error(`TBO_HOTEL_NOT_FOUND_404`);
              }

              console.error(`TBO API returned ${response.status}:`, errorText);
              throw new Error(`TBO API returned ${response.status}`);
            }
          } else {
            // Fallback to Hotelbeds service for other suppliers
            const searchParams = {
              checkIn: checkInParam,
              checkOut: checkOutParam,
              rooms: parseInt(roomsParam || "1"),
              adults: parseInt(adultsParam || "2"),
              children: parseInt(childrenParam || "0"),
              supplier: supplier,
            };

            console.log(
              "🔍 Using hotelsService.getHotelDetails:",
              hotelId,
              searchParams,
            );
            const hotel = await hotelsService.getHotelDetails(
              hotelId,
              searchParams,
            );
            console.log("✅ Hotel data received via service:", hotel);
            return hotel;
          }
        } catch (error) {
          console.warn(`⚠️ Attempt ${retryCount + 1} failed:`, error);

          // Don't retry 404 errors (hotel not found in database) - use fallback immediately
          if (error.message === "TBO_HOTEL_NOT_FOUND_404") {
            console.log("Hotel not found in TBO database, skipping retry");
            throw error;
          }

          // Retry up to 1 time with a short delay for network/temporary errors
          const isRetryableError =
            error instanceof TypeError || // Network errors
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError") ||
            error.message.includes("fetch") ||
            error.message.includes("HTTP 503") || // Server unavailable
            error.message.includes("HTTP 502") || // Bad gateway
            error.message.includes("HTTP 504") || // Gateway timeout
            error.message.includes("HTTP 500") || // Internal server error
            error.message.includes("timeout") ||
            error.name === "AbortError";

          if (retryCount < 1 && isRetryableError) {
            const delay = 1500; // 1.5 second delay
            console.log(`Retrying in ${delay}ms... (Error: ${error.message})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return attemptFetch(retryCount + 1);
          }

          throw error;
        }
      };

      try {
        const hotelData = await attemptFetch();
        setHotelData(hotelData);
      } catch (error) {
        // Try to use hotel data from location.state first (passed from HotelResults)
        const passedHotelData = (location.state as any)?.hotel;
        if (passedHotelData) {
          console.log(
            "✅ TBO API unavailable, using hotel data from location.state",
          );
          setHotelData(passedHotelData);
        } else {
          // Fallback to generic mock data if no data was passed
          console.log(
            "📦 No hotel data from location.state, using generic mock data",
          );
          const fallbackData = getMockHotelData();
          setHotelData(fallbackData);
        }

        // Set friendly API status message - don't alarm users
        console.info("ℹ️ Using available hotel data from cache");
        setApiStatus({
          isOffline: false, // Don't show as offline to avoid alarming users
          message: "Showing available hotel information.",
          type: null, // No warning needed for normal fallback
        });
      } finally {
        setIsLoadingHotel(false);
      }
    };

    fetchHotelData();
  }, [hotelId, checkInParam, checkOutParam]);

  // Fallback mock data function
  const getMockHotelData = () => {
    // Extract hotel info from URL or use defaults
    const hotelCode = hotelId || "1";
    const isBusinessHotel = hotelCode.toLowerCase().includes("business");
    const isLuxuryHotel =
      hotelCode.toLowerCase().includes("grand") ||
      hotelCode.toLowerCase().includes("luxury");
    const isBoutiqueHotel = hotelCode.toLowerCase().includes("boutique");

    // Generate realistic hotel names based on actual hotel IDs from search results
    const hotelNames = {
      // Map actual hotel IDs from search results
      "hotel-1": "Grand Hotel Dubai",
      "hotel-2": "Business Hotel Dubai",
      "hotel-3": "Boutique Hotel Dubai",
      "1": "Grand Hotel Dubai",
      "2": "Business Hotel Dubai",
      "3": "Boutique Hotel Dubai",
      // Additional common patterns
      "htl-1": "Grand Hotel Dubai",
      "htl-2": "Business Hotel Dubai",
      "htl-3": "Boutique Hotel Dubai",
      // Legacy codes for backward compatibility
      "htl-DXB-001": "Grand Hyatt Dubai",
      "htl-DXB-002": "Business Hotel Dubai Marina",
      "htl-DXB-003": "Boutique Hotel Downtown Dubai",
      "htl-DXB-004": "Premium Hotel Dubai Creek",
      "htl-DXB-005": "City Hotel Dubai Mall",
      "htl-DXB-006": "Express Hotel Dubai Airport",
    };

    // First try exact match, then try with different case combinations
    const getHotelName = () => {
      if (hotelNames[hotelCode]) return hotelNames[hotelCode];
      if (hotelNames[hotelCode.toLowerCase()])
        return hotelNames[hotelCode.toLowerCase()];
      if (hotelNames[hotelCode.toUpperCase()])
        return hotelNames[hotelCode.toUpperCase()];

      // Fallback based on hotel type
      if (isBusinessHotel) return `Business Hotel Dubai`;
      if (isLuxuryHotel) return `Grand Luxury Hotel Dubai`;
      if (isBoutiqueHotel) return `Boutique Hotel Dubai`;
      return `Premium Hotel Dubai`;
    };

    const defaultName = getHotelName();

    // Hotel-specific locations
    const hotelLocations = {
      // Map actual hotel IDs from search results
      "hotel-1": "Sheikh Zayed Road, Dubai, United Arab Emirates",
      "hotel-2": "Dubai Marina, Dubai, United Arab Emirates",
      "hotel-3": "Downtown Dubai, Dubai, United Arab Emirates",
      "1": "Sheikh Zayed Road, Dubai, United Arab Emirates",
      "2": "Dubai Marina, Dubai, United Arab Emirates",
      "3": "Downtown Dubai, Dubai, United Arab Emirates",
      // Additional common patterns
      "htl-1": "Sheikh Zayed Road, Dubai, United Arab Emirates",
      "htl-2": "Dubai Marina, Dubai, United Arab Emirates",
      "htl-3": "Downtown Dubai, Dubai, United Arab Emirates",
      // Legacy codes for backward compatibility
      "htl-DXB-001": "Sheikh Zayed Road, Dubai, United Arab Emirates",
      "htl-DXB-002": "Dubai Marina, Dubai, United Arab Emirates",
      "htl-DXB-003": "Downtown Dubai, Dubai, United Arab Emirates",
      "htl-DXB-004": "Dubai Creek, Dubai, United Arab Emirates",
      "htl-DXB-005": "Near Dubai Mall, Dubai, United Arab Emirates",
      "htl-DXB-006": "Dubai International Airport, Dubai, United Arab Emirates",
    };

    return {
      id: parseInt(hotelCode.replace(/\D/g, "")) || 1,
      code: hotelCode,
      name: defaultName,
      location: hotelLocations[hotelCode] || "Dubai, United Arab Emirates",
      images: (() => {
        // Hotel-specific images based on hotel code and type
        const imageCollections = {
          // Map actual hotel IDs from search results
          "hotel-1": [
            // Grand Hotel Dubai
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          "hotel-2": [
            // Business Hotel Dubai
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          "hotel-3": [
            // Boutique Hotel Dubai
            "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fb6e5d29525ed45bca0c16b169e94ceb9?format=webp&width=800",
            "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F9669661aee854b14a48bb7396266976b?format=webp&width=800",
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          "1": [
            // Grand Hotel Dubai (numeric ID)
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          "2": [
            // Business Hotel Dubai (numeric ID)
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          "3": [
            // Boutique Hotel Dubai (numeric ID)
            "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fb6e5d29525ed45bca0c16b169e94ceb9?format=webp&width=800",
            "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F9669661aee854b14a48bb7396266976b?format=webp&width=800",
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          // Legacy codes for backward compatibility
          "htl-DXB-001": [
            // Grand Hyatt Dubai
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          "htl-DXB-002": [
            // Business Hotel Dubai Marina
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          "htl-DXB-003": [
            // Boutique Hotel Downtown Dubai
            "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fb6e5d29525ed45bca0c16b169e94ceb9?format=webp&width=800",
            "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F9669661aee854b14a48bb7396266976b?format=webp&width=800",
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          "htl-DXB-004": [
            // Premium Hotel Dubai Creek
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&q=80&auto=format&fit=crop",
          ],
        };
        return imageCollections[hotelCode] || imageCollections["hotel-1"]; // Default to Grand Hotel Dubai
      })(),
      rating: isLuxuryHotel ? 4.8 : isBoutiqueHotel ? 4.3 : 4.2,
      reviews: Math.floor(Math.random() * 800) + 400,
      reviewCount: Math.floor(Math.random() * 800) + 400,
      description: `Experience exceptional hospitality at ${defaultName}. Located in the heart of Dubai with modern amenities and world-class service.`,
      amenities: [
        "Free WiFi",
        "Swimming Pool",
        "Fitness Center",
        "Restaurant",
        "Room Service",
        "Business Center",
        "Concierge",
        "Valet Parking",
        ...(isLuxuryHotel ? ["Spa & Wellness", "Premium Dining"] : []),
        ...(isBusinessHotel ? ["Meeting Rooms", "Executive Lounge"] : []),
      ],
      features: [
        "City View",
        "Modern Design",
        "24/7 Service",
        ...(isLuxuryHotel ? ["Luxury Amenities", "Premium Location"] : []),
        ...(isBoutiqueHotel ? ["Unique Design", "Personalized Service"] : []),
      ],
      currentPrice: isLuxuryHotel ? 250 : isBoutiqueHotel ? 180 : 167,
      totalPrice:
        (isLuxuryHotel ? 250 : isBoutiqueHotel ? 180 : 167) * totalNights,
      currency: "USD",
      available: true,
      supplier: "offline-mode",
      isLiveData: false,
      fallback: true,
      checkIn: checkInDate.toISOString().split("T")[0],
      checkOut: checkOutDate.toISOString().split("T")[0],
      address: {
        street: "Dubai Marina District",
        city: "Dubai",
        country: "United Arab Emirates",
      },
    };
  };

  // Temporary hotel data for roomTypes calculation
  const tempHotelData = hotelData
    ? {
        id: parseInt(hotelId || "1"),
        name: (() => {
          const hotelNames = {
            // Map actual hotel IDs from search results
            "hotel-1": "Grand Hotel Dubai",
            "hotel-2": "Business Hotel Dubai",
            "hotel-3": "Boutique Hotel Dubai",
            "1": "Grand Hotel Dubai",
            "2": "Business Hotel Dubai",
            "3": "Boutique Hotel Dubai",
            // Legacy codes for backward compatibility
            "htl-DXB-001": "Grand Hyatt Dubai",
            "htl-DXB-002": "Business Hotel Dubai Marina",
            "htl-DXB-003": "Boutique Hotel Downtown Dubai",
            "htl-DXB-004": "Premium Hotel Dubai Creek",
            "htl-DXB-005": "City Hotel Dubai Mall",
            "htl-DXB-006": "Express Hotel Dubai Airport",
          };
          // Prioritize API name, but ensure we never show placeholder "hotel1" type names
          if (
            hotelData.name &&
            !hotelData.name.toLowerCase().includes("hotel1") &&
            !hotelData.name.toLowerCase().includes("hotel 1")
          ) {
            return hotelData.name;
          }
          // Use mapped names as fallback
          return (
            hotelNames[hotelId] ||
            hotelNames[hotelId?.toLowerCase()] ||
            "Premium Hotel Dubai"
          );
        })(),
        location: (() => {
          const hotelLocations = {
            // Map actual hotel IDs from search results
            "hotel-1": "Sheikh Zayed Road, Dubai, United Arab Emirates",
            "hotel-2": "Dubai Marina, Dubai, United Arab Emirates",
            "hotel-3": "Downtown Dubai, Dubai, United Arab Emirates",
            "1": "Sheikh Zayed Road, Dubai, United Arab Emirates",
            "2": "Dubai Marina, Dubai, United Arab Emirates",
            "3": "Downtown Dubai, Dubai, United Arab Emirates",
            // Legacy codes for backward compatibility
            "htl-DXB-001": "Sheikh Zayed Road, Dubai, United Arab Emirates",
            "htl-DXB-002": "Dubai Marina, Dubai, United Arab Emirates",
            "htl-DXB-003": "Downtown Dubai, Dubai, United Arab Emirates",
            "htl-DXB-004": "Dubai Creek, Dubai, United Arab Emirates",
            "htl-DXB-005": "Near Dubai Mall, Dubai, United Arab Emirates",
            "htl-DXB-006":
              "Dubai International Airport, Dubai, United Arab Emirates",
          };
          // Prioritize API location data, fallback to mapped locations if API data is missing
          return (
            (typeof hotelData.location === "string"
              ? hotelData.location
              : hotelData.location?.address?.street ||
                hotelData.address?.street ||
                hotelData.location?.city ||
                hotelData.address?.city) ||
            hotelLocations[hotelId] ||
            "Dubai, United Arab Emirates"
          );
        })(),
        image:
          Array.isArray(hotelData?.images) && hotelData!.images.length > 0
            ? typeof hotelData!.images[0] === "string"
              ? (hotelData!.images[0] as string)
              : (hotelData!.images[0] as any).url
            : // Hotel-specific fallback images
              (() => {
                const hotelCode = hotelId || "htl-DXB-003";
                const fallbackImages = {
                  "htl-DXB-001":
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80&auto=format&fit=crop",
                  "htl-DXB-002":
                    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&q=80&auto=format&fit=crop",
                  "htl-DXB-003":
                    "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fb6e5d29525ed45bca0c16b169e94ceb9?format=webp&width=800",
                  "htl-DXB-004":
                    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&q=80&auto=format&fit=crop",
                };
                return (
                  fallbackImages[hotelCode] || fallbackImages["htl-DXB-003"]
                );
              })(),
        images: hotelData?.images || [],
        rating: hotelData.rating || 4.5,
        reviews: hotelData.reviews || hotelData.reviewCount || 1247,
        checkIn: checkInDate.toISOString().split("T")[0],
        checkOut: checkOutDate.toISOString().split("T")[0],
        totalNights: totalNights,
        rooms: parseInt(roomsParam || "1"),
        adults: parseInt(adultsParam || "2"),
        description:
          hotelData.description ||
          "Experience luxury accommodations with exceptional service.",
        amenities: hotelData.amenities || ["WiFi", "Pool", "Restaurant"],
        features: hotelData.features || ["City View"],
        currentPrice: (() => {
          // Use preselected rate price if available for consistency
          if (preselectRate && preselectRate.perNightPrice) {
            console.log("[USING RESULTS PAGE PRICE]", {
              resultsPrice: preselectRate.perNightPrice,
              hotelDataPrice: hotelData.currentPrice,
              fallbackPrice: 167,
            });
            return preselectRate.perNightPrice;
          }
          return hotelData.currentPrice || 167;
        })(),
        totalPrice: (() => {
          // Use preselected total price if available for consistency
          if (preselectRate && preselectRate.totalPrice) {
            return preselectRate.totalPrice;
          }
          return (
            hotelData.totalPrice ||
            (hotelData.currentPrice || 167) * totalNights
          );
        })(),
        currency: hotelData.currency || "USD",
        available: hotelData.available !== false,
        supplier: hotelData.supplier || "hotelbeds",
        isLiveData: hotelData.supplier === "hotelbeds",
      }
    : null;

  const calculateTotalPrice = (roomPricePerNight: number, room?: any) => {
    // Use exact Results page price if available to ensure consistency
    if (room && room.exactResultsTotal && room.priceConsistent) {
      console.log("[USING EXACT RESULTS PRICE]", {
        exactTotal: room.exactResultsTotal,
        roomId: room.id,
        reason: "Price consistency from Results page",
      });
      return room.exactResultsTotal;
    }

    // Fallback to calculation
    const rooms = parseInt(roomsParam || "1");
    const breakdown = calculatePriceBreakdown(
      roomPricePerNight,
      totalNights,
      rooms,
    );
    return breakdown.total;
  };

  // Generate room types from live data, snapshot from navigation, or fallback
  const roomsSnapshot: any[] = (location.state as any)?.roomsSnapshot || [];
  const roomTypes = useMemo(() => {
    const sourceRooms =
      Array.isArray(roomsSnapshot) && roomsSnapshot.length > 0
        ? roomsSnapshot
        : hotelData && hotelData.roomTypes && hotelData.roomTypes.length > 0
          ? hotelData.roomTypes
          : null;

    if (sourceRooms) {
      const mapped = sourceRooms.map((room: any, index: number) => ({
        id: room.rateKey || room.id || `live-room-${index}`,
        name: room.name || `Room Type ${index + 1}`,
        type: room.name || `1 X ${room.name || "Standard"}`,
        details:
          room.features || room.inclusions
            ? (room.features || room.inclusions)
                .map((f: any) =>
                  typeof f === "string" ? f : f?.name || "Feature",
                )
                .join(", ")
            : "Standard accommodations",
        pricePerNight:
          room.pricePerNight || room.price || hotelData?.currentPrice || 167,
        status: index === 0 ? "Best Value - Start Here!" : `Available`,
        statusColor: index === 0 ? "green" : "blue",
        nonRefundable: true,
        image:
          room.image ||
          (Array.isArray(hotelData?.images) && hotelData!.images.length > 1
            ? typeof hotelData!.images[1] === "string"
              ? (hotelData!.images[1] as string)
              : (hotelData!.images[1] as any).url
            : "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300"),
        features: Array.isArray(room.features)
          ? room.features.map((f) =>
              typeof f === "string" ? f : f?.name || "Feature",
            )
          : [
              "Standard room",
              "Free WiFi",
              "Air conditioning",
              "Private bathroom",
            ],
        isLiveData: true,
      }));

      // If too few options returned, synthesize sensible upgrades so users can choose
      if (mapped.length < 3) {
        const base = Math.min(...mapped.map((r) => r.pricePerNight || 167));
        const existingNames = new Set(mapped.map((room) => room.name));

        const potentialExtras = [
          {
            id: `gen-premium-${mapped.length}`,
            name: "Premium Room with City View",
            type: "1 X Premium Room",
            details: "Premium accommodations with city view",
            pricePerNight: base + 25,
            status: "Upgrade for +₹25",
            statusColor: "yellow",
            nonRefundable: true,
            image:
              "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&q=80&auto=format&fit=crop",
            features: ["Premium Room", "City views", "Enhanced amenities"],
            isLiveData: false,
          },
          {
            id: `gen-executive-${mapped.length + 1}`,
            name: "Executive Suite with Business Lounge",
            type: "1 X Executive Suite",
            details: "Executive suite with business lounge access",
            pricePerNight: base + 65,
            status: "Upgrade for +₹65",
            statusColor: "blue",
            nonRefundable: false,
            image:
              "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&q=80&auto=format&fit=crop",
            features: [
              "Executive Suite",
              "Business Lounge",
              "Premium amenities",
            ],
            isLiveData: false,
          },
          {
            id: `gen-junior-${mapped.length + 2}`,
            name: "Junior Suite with Balcony",
            type: "1 X Junior Suite",
            details: "Junior suite with private balcony",
            pricePerNight: base + 40,
            status: "Upgrade for +₹40",
            statusColor: "blue",
            nonRefundable: true,
            image:
              "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=400&h=300&q=80&auto=format&fit=crop",
            features: ["Junior Suite", "Private balcony", "Enhanced space"],
            isLiveData: false,
          },
        ];

        // Only add extras that don't duplicate existing room names
        const extras = potentialExtras.filter(
          (extra) => !existingNames.has(extra.name),
        );

        return [...mapped, ...extras]
          .slice(0, 3)
          .sort((a, b) => a.pricePerNight - b.pricePerNight);
      }

      return mapped.sort((a, b) => a.pricePerNight - b.pricePerNight);
    }

    // Fallback mock room types - use consistent pricing from Results page
    const basePrice = (() => {
      // Use Results page pricing if available for consistency
      if (preselectRate && preselectRate.perNightPrice) {
        console.log("[FALLBACK ROOMS USING RESULTS PRICE]", {
          basePrice: preselectRate.perNightPrice,
          source: "Results page preselect",
        });
        return preselectRate.perNightPrice;
      }

      // Otherwise use hotel data price
      const hotelPrice = tempHotelData?.currentPrice || 167;
      console.log("[FALLBACK ROOMS USING HOTEL PRICE]", {
        basePrice: hotelPrice,
        source: "Hotel data or fallback",
      });
      return hotelPrice;
    })();

    return [
      {
        id: "standard-double",
        name: "Standard Double Room",
        type: "1 X Standard Double",
        details: "Comfortable double room",
        pricePerNight: basePrice,
        status: "Cheapest Room",
        statusColor: "green",
        nonRefundable: true,
        image:
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&q=80&auto=format&fit=crop",
        features: ["Standard Room", "Best value option", "Free WiFi"],
        // Mark as price consistent if using Results page data
        priceConsistent: !!(preselectRate && preselectRate.perNightPrice),
        exactResultsTotal: preselectRate?.totalPrice,
      },
      {
        id: "twin-skyline",
        name: "Twin Room with Skyline View",
        type: "1 X Twin Classic",
        details: "Twin bed",
        pricePerNight: basePrice + 15,
        status: "Upgrade for +₹15",
        statusColor: "yellow",
        nonRefundable: true,
        image:
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&q=80&auto=format&fit=crop",
        features: ["Upgrade for +₹15", "Twin Classic", "City View"],
      },
      {
        id: "king-skyline",
        name: "King Room with Skyline View",
        type: "1 X King Classic",
        details: "1 king bed",
        pricePerNight: basePrice + 33,
        status: "Upgrade for +₹33",
        statusColor: "yellow",
        image:
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&q=80&auto=format&fit=crop",
        features: ["Upgrade for +₹33", "King Room", "Better city views"],
      },
      {
        id: "deluxe-suite",
        name: "Deluxe Suite with Ocean View",
        type: "1 X Deluxe Suite",
        details: "Suite with separate living area",
        pricePerNight: basePrice + 55,
        status: "Upgrade for +₹55",
        statusColor: "blue",
        nonRefundable: false,
        image:
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&q=80&auto=format&fit=crop",
        features: ["Upgrade for +₹55", "Ocean View Suite", "Premium amenities"],
      },
    ].sort((a, b) => a.pricePerNight - b.pricePerNight);
  }, [roomsSnapshot, hotelData, preselectRate, tempHotelData?.currentPrice]);

  // Auto-select room based on Results page selection or default to first room
  useEffect(() => {
    if (roomTypes.length > 0) {
      let roomToSelect = null;
      let matchType = "default";

      // First priority: Pre-selected room from Results page navigation state
      if (preselectRate) {
        // Try to match by rateKey/roomId first
        roomToSelect = roomTypes.find(
          (room) =>
            room.id === preselectRate.rateKey ||
            room.id === preselectRate.roomId ||
            room.id === preselectRate.roomTypeId,
        );

        if (roomToSelect) {
          matchType = "rateKey";
        } else {
          // Try to match by room name/type
          roomToSelect = roomTypes.find(
            (room) =>
              room.name === preselectRate.roomName ||
              room.name === preselectRate.roomType ||
              room.type === preselectRate.roomType,
          );

          if (roomToSelect) {
            matchType = "roomName";
          } else {
            // Match by closest price if exact room not found
            const expectedPerNight = preselectRate.perNightPrice;
            roomToSelect = roomTypes.reduce((closest, room) => {
              const currentDiff = Math.abs(
                (room.pricePerNight || 0) - expectedPerNight,
              );
              const closestDiff = Math.abs(
                (closest?.pricePerNight || 0) - expectedPerNight,
              );
              return currentDiff < closestDiff ? room : closest;
            }, roomTypes[0]);
            matchType = "priceMatch";
          }
        }

        // CRITICAL: Override the room's displayed price with the exact price from Results page
        if (roomToSelect && preselectRate.totalPrice) {
          // Create a modified room object with the exact displayed total price from Results
          roomToSelect = {
            ...roomToSelect,
            // Keep original per-night price for calculations
            originalPricePerNight: roomToSelect.pricePerNight,
            // Override with Results page price to ensure consistency
            pricePerNight: preselectRate.perNightPrice,
            // Store the exact total price from Results page
            exactResultsTotal: preselectRate.totalPrice,
            // Mark this as price-consistent
            priceConsistent: true,
          };

          console.log("[PRICE CONSISTENCY OVERRIDE]", {
            originalRoomPrice: roomToSelect.originalPricePerNight,
            overriddenPerNight: preselectRate.perNightPrice,
            exactResultsTotal: preselectRate.totalPrice,
            preselectData: preselectRate,
          });
        }

        // Debug trace for room matching
        console.log("[ROOM MATCHING]", {
          preselectRateKey: preselectRate.rateKey,
          preselectRoomName: preselectRate.roomName,
          preselectPrice: preselectRate.perNightPrice,
          preselectTotal: preselectRate.totalPrice,
          matchedRoomId: roomToSelect?.id,
          matchedRoomName: roomToSelect?.name,
          matchedPrice: roomToSelect?.pricePerNight,
          matchType,
        });
      }

      // Fallback: Select first room if no pre-selection or no match found
      if (!roomToSelect) {
        roomToSelect = roomTypes[0];
        matchType = "fallback";

        // If using fallback and we have Results page data, ensure price consistency
        if (preselectRate && roomToSelect) {
          roomToSelect = {
            ...roomToSelect,
            priceConsistent: true,
            exactResultsTotal: preselectRate.totalPrice,
            originalPricePerNight: roomToSelect.pricePerNight,
            // Use Results page price for consistency
            pricePerNight: preselectRate.perNightPrice,
          };
          console.log("[FALLBACK ROOM PRICE OVERRIDE]", {
            roomId: roomToSelect.id,
            originalPrice: roomToSelect.originalPricePerNight,
            resultsPrice: preselectRate.perNightPrice,
            exactTotal: preselectRate.totalPrice,
          });
        }
      }

      // Only update if different from current selection
      if (!selectedRoomType || selectedRoomType.id !== roomToSelect.id) {
        setSelectedRoomType(roomToSelect);

        // Debug trace for final selection
        console.log("[DETAILS ROOM SELECTED]", {
          selectedRoomId: roomToSelect.id,
          selectedRoomName: roomToSelect.name,
          selectedPrice: roomToSelect.pricePerNight,
          exactTotal: roomToSelect.exactResultsTotal,
          matchType,
          calculatedTotal: calculateTotalPrice(
            roomToSelect.pricePerNight,
            roomToSelect,
          ),
          isPriceConsistent: roomToSelect.priceConsistent,
          hasResultsData: !!preselectRate,
        });
      }
    }
  }, [roomTypes.length, preselectRate]);

  // Expand first room by default when room types are available
  useEffect(() => {
    if (roomTypes.length > 0) {
      setExpandedRooms(new Set([roomTypes[0].id]));
    }
  }, [roomTypes.length]);

  // Create final hotel object with calculated roomTypes
  // Ensure no duplicate room types by name with comprehensive deduplication
  const deduplicatedRoomTypes = (() => {
    const seen = new Set();
    const uniqueRooms = [];

    console.log("🔍 Before deduplication - Total rooms:", roomTypes.length);
    roomTypes.forEach((room) => {
      console.log("��� Room:", room.name, "ID:", room.id);
    });

    for (const room of roomTypes) {
      // Create a key based on room name (case-insensitive)
      const key = room.name.toLowerCase().trim();

      if (!seen.has(key)) {
        seen.add(key);
        uniqueRooms.push(room);
        console.log("✅ Added unique room:", room.name);
      } else {
        console.log("❌ Skipped duplicate room:", room.name);
      }
    }

    console.log("🎯 After deduplication - Unique rooms:", uniqueRooms.length);
    return uniqueRooms.sort((a, b) => a.pricePerNight - b.pricePerNight);
  })();

  const hotel = tempHotelData
    ? {
        ...tempHotelData,
        roomTypes: deduplicatedRoomTypes,
      }
    : (() => {
        // Emergency fallback - use proper mapped names instead of placeholder
        const fallbackData = getMockHotelData();
        return {
          ...fallbackData,
          roomTypes:
            deduplicatedRoomTypes.length > 0
              ? deduplicatedRoomTypes
              : [
                  {
                    id: "standard-room",
                    name: "Standard Double Room",
                    type: "1 X Standard Double",
                    details: "Comfortable double room",
                    pricePerNight: fallbackData.currentPrice || 167,
                    status: "Available",
                    statusColor: "green",
                    nonRefundable: true,
                    image:
                      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&q=80&auto=format&fit=crop",
                    features: [
                      "Standard Room",
                      "Free WiFi",
                      "Air conditioning",
                    ],
                    isLiveData: false,
                  },
                ],
        };
      })();

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "gallery", label: "Gallery" },
    { id: "amenities", label: "Amenities" },
    { id: "reviews", label: "Reviews" },
    { id: "street-view", label: "Street View" },
    { id: "location", label: "Location" },
  ];

  // Calculate the lowest price from available room types
  const lowestPrice =
    roomTypes.length > 0
      ? Math.min(...roomTypes.map((room) => room.pricePerNight))
      : 167; // fallback price

  // Offset accounts for: Header (56px) + Search (88px) + Tabs (48px) = 192px
  const SCROLL_OFFSET = 192;

  const scrollToTab = (tabId: string) => {
    setActiveTab(tabId);
    const sectionId = `${tabId}-section-mobile`;
    const element = document.getElementById(sectionId);
    if (element) {
      const y =
        element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
      8;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const ids = [
      "overview",
      "gallery",
      "amenities",
      "reviews",
      "street-view",
      "location",
    ];
    const observerOptions = {
      root: null,
      rootMargin: `-${SCROLL_OFFSET}px 0px -60% 0px`,
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      const visibleSections = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visibleSections.length > 0) {
        const topSection = visibleSections[0];
        const sectionId = topSection.target.id.replace("-section-mobile", "");
        setActiveTab(sectionId);
      }
    }, observerOptions);

    ids.forEach((id) => {
      const element = document.getElementById(`${id}-section-mobile`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const handleBargainClick = (roomType: any) => {
    console.log("Bargain clicked for room:", roomType.id);
    setSelectedRoomType(roomType);
    setBargainingRoomId(roomType.id);
    setIsBargainModalOpen(true);
  };

  const handleStarClick = () => {
    console.log("⭐ Star clicked - navigating to reviews");
    setActiveTab("reviews");
    // Scroll to reviews section smoothly - try both mobile and desktop versions
    setTimeout(() => {
      const reviewsSectionMobile = document.getElementById("reviews-section");
      const reviewsSectionDesktop = document.getElementById(
        "reviews-section-desktop",
      );
      const targetSection = reviewsSectionMobile || reviewsSectionDesktop;
      if (targetSection) {
        console.log("📍 Scrolling to reviews section:", targetSection.id);
        targetSection.scrollIntoView({ behavior: "smooth" });
      } else {
        console.log("❌ Reviews section not found");
      }
    }, 100);
  };

  const handleFilterChange = (category: string, filterName: string) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev };
      const categoryFilters = new Set(
        newFilters[category as keyof typeof newFilters],
      );

      if (categoryFilters.has(filterName)) {
        categoryFilters.delete(filterName);
      } else {
        categoryFilters.add(filterName);
      }

      newFilters[category as keyof typeof newFilters] = categoryFilters;
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setPriceRange(100);
    setSelectedFilters({
      popularFilters: new Set(),
      propertyTypes: new Set(),
      facilities: new Set(),
      mealOptions: new Set(),
      starRatings: new Set(),
    });
  };

  const filterRooms = (rooms: any[]) => {
    return rooms.filter((room) => {
      // Search by name
      if (
        searchTerm &&
        !room.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Price range filter (only apply if price range is not at maximum)
      if (priceRange < 90) {
        const maxPrice = (priceRange / 100) * 15000; // Assuming max price of 15000
        if (room.pricePerNight > maxPrice) {
          return false;
        }
      }

      // Popular filters (only apply if filters are selected)
      if (selectedFilters.popularFilters.size > 0) {
        const roomFeatures = room.features || [];
        const hasSelectedFeature = Array.from(
          selectedFilters.popularFilters,
        ).some((filter) =>
          roomFeatures.some((feature: any) => {
            const featureName =
              typeof feature === "string" ? feature : feature?.name || "";
            return featureName.toLowerCase().includes(filter.toLowerCase());
          }),
        );
        if (!hasSelectedFeature) return false;
      }

      return true;
    });
  };

  const toggleRoomExpansion = (roomId: string) => {
    setExpandedRooms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const handleBooking = (roomType: any, bargainPrice?: number) => {
    let perNightPrice: number;
    let totalPrice: number;

    if (bargainPrice) {
      // bargainPrice from the modal is the total bargained price
      totalPrice = bargainPrice;
      perNightPrice = Math.round(bargainPrice / hotel.totalNights);
    } else {
      // Regular booking - calculate from per-night price
      perNightPrice = roomType.pricePerNight;
      totalPrice = calculateTotalPrice(perNightPrice);
    }
    // Preserve original search parameters and add booking specific ones
    const existingParams = searchParams.toString();
    const bookingParams = new URLSearchParams({
      hotelId: hotel.id.toString(),
      roomType: roomType.type,
      pricePerNight: perNightPrice.toString(),
      totalPrice: totalPrice.toString(),
      nights: hotel.totalNights.toString(),
      bargained: (!!bargainPrice).toString(),
      roomName: roomType.name,
      checkIn: hotel.checkIn,
      checkOut: hotel.checkOut,
      rooms: hotel.rooms.toString(),
      guests: hotel.adults.toString(),
      hotelName: hotel.name,
      location: hotel.location,
      rating: hotel.rating.toString(),
      reviews: hotel.reviews.toString(),
    });

    // Merge existing search params with booking params
    const mergedParams = new URLSearchParams(existingParams);
    bookingParams.forEach((value, key) => {
      mergedParams.set(key, value);
    });

    navigate(`/reserve?${mergedParams.toString()}`);
  };

  // Show loading state while fetching hotel data
  if (isLoadingHotel || !hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hotel details...</p>
          <p className="text-sm text-gray-500 mt-2">
            Fetching live hotel data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>
        {`
          ${sliderStyles}
          :root {
            --header-height: 56px;
            --search-height: 88px;
            --tabs-height: 48px;
          }
          #mobile-header {
            position: sticky;
            top: 0;
            z-index: 40;
          }
          #mobile-search {
            position: sticky;
            top: var(--header-height);
            z-index: 30;
          }
          #section-tabs {
            position: sticky;
            top: calc(var(--header-height) + var(--search-height));
            z-index: 20;
          }
          #mobile-content-scroll {
            height: calc(100dvh - var(--header-height) - var(--search-height) - var(--tabs-height));
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
        `}
      </style>

      {/* Mobile-First Layout - Flex Container */}
      <div className="md:hidden flex flex-col min-h-screen bg-gray-50">
        <div id="mobile-header">
          <MobileNavBar
            title="Hotel Details"
            rating={hotel.rating}
            reviewCount={hotel.reviews}
            showBookmark={true}
            showShare={true}
            isBookmarked={isSaved}
            onBookmarkToggle={() => setIsSaved(!isSaved)}
            onShareClick={() => setIsShareModalOpen(true)}
            onBack={() => {
              console.log("Back button clicked - navigating to hotels");
              navigate("/hotels");
            }}
          />
        </div>

        {/* Mobile Search Bar - Collapsed Summary */}
        <div
          id="mobile-search"
          className="bg-white border-b border-gray-200 px-4 py-3"
        >
          <div className="max-w-md mx-auto">
            <CollapsedSearchSummary
              cityFull={cityFull}
              datesLabel={datesLabel}
              paxLabel={paxLabel}
              onExpand={() => setIsSearchSheetOpen(true)}
            />
          </div>
        </div>

        {/* Search Expansion Sheet */}
        <Sheet open={isSearchSheetOpen} onOpenChange={setIsSearchSheetOpen}>
          <SheetContent
            side="bottom"
            className="h-auto max-h-[80vh] flex flex-col rounded-t-3xl"
          >
            <div className="py-4 px-4 flex-1 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Edit search
              </h2>
              <HotelSearchForm
                initialDestination={
                  destinationName || searchParams.get("destination") || ""
                }
                initialCheckIn={searchParams.get("checkIn") || ""}
                initialCheckOut={searchParams.get("checkOut") || ""}
                initialGuests={{
                  adults: parseInt(searchParams.get("adults") || "2"),
                  children: parseInt(searchParams.get("children") || "0"),
                  rooms: parseInt(searchParams.get("rooms") || "1"),
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Content */}
        <div>
          {/* Simple Hero Image */}
          <div className="relative w-full h-64 overflow-hidden bg-white">
            <img
              src={hotel.image}
              alt={hotel.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop";
              }}
            />

            {/* Rating and Live Data Indicator */}
            <div className="absolute bottom-4 left-4 space-y-2">
              <div
                className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm cursor-pointer hover:bg-white/100 transition-colors"
                onClick={handleStarClick}
                title="Click to view reviews"
              >
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-blue-600 text-blue-600" />
                  <span className="font-semibold text-sm text-gray-900">
                    {hotel.rating}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({hotel.reviews})
                  </span>
                </div>
              </div>
              {hotel.isLiveData && (
                <div className="bg-green-500/95 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
                  🔴 LIVE DATA
                </div>
              )}
              {hotel.fallback && (
                <div className="bg-orange-500/95 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
                  📱 OFFLINE MODE
                </div>
              )}
            </div>
          </div>

          {/* Hotel Info with Star Rating */}
          <div className="bg-white p-4 border-b border-gray-100">
            <div
              className="flex items-center mb-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleStarClick}
              title="Click to view reviews"
            >
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(hotel.rating)
                        ? "text-blue-600 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">
                {hotel.rating}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {hotel.name}
            </h1>
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm">{hotel.location}</span>
            </div>

            {/* Simple Booking Details */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Check-in</div>
                <div className="font-semibold text-sm text-gray-900">
                  {formatDate(hotel.checkIn)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Check-out</div>
                <div className="font-semibold text-sm text-gray-900">
                  {formatDate(hotel.checkOut)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Nights</div>
                <div className="font-semibold text-sm text-gray-900">
                  {hotel.totalNights}
                </div>
              </div>
            </div>

            {/* Simple Features */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <div className="flex items-center space-x-1 text-xs">
                  <Wifi className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Free WiFi</span>
                </div>
                <div className="flex items-center space-x-1 text-xs">
                  <Car className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Free Parking</span>
                </div>
              </div>
              <span className="bg-red-50 text-red-700 text-xs font-medium px-2 py-1 rounded">
                Hot Deal
              </span>
            </div>
          </div>

          {/* Clean Mobile Tabs - Sticky at Top */}
          <div
            id="section-tabs"
            className="bg-white border-b border-gray-200 md:hidden"
          >
            <div className="flex overflow-x-auto scrollbar-hide px-4 py-0 pr-16">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToTab(tab.id)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Mobile Content Sections - Scrollable */}
          <div
            className="flex-1 overflow-y-auto bg-gray-50 md:hidden p-4 pb-40"
            style={{ paddingBottom: "max(10rem, env(safe-area-inset-bottom))" }}
          >
            {activeTab === "overview" && (
              <div id="overview-section-mobile" className="space-y-4">
                {/* Simple Room Selection */}
                <div className="bg-white rounded-lg p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Choose your room
                  </h2>

                  <div className="space-y-3">
                    {hotel.roomTypes.map((room, index) => (
                      <div
                        key={room.id}
                        className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                          selectedRoomType?.id === room.id
                            ? "border-blue-600 bg-blue-50 shadow-md"
                            : "border-gray-200 bg-white hover:shadow-sm"
                        }`}
                      >
                        {/* Status Badge */}
                        {index === 0 && (
                          <div className="bg-green-600 text-white px-3 py-1 text-xs font-medium">
                            Cheapest Room
                          </div>
                        )}
                        {index > 0 && (
                          <div className="bg-orange-500 text-white px-3 py-1 text-xs font-medium">
                            Upgrade for +₹
                            {room.pricePerNight - roomTypes[0].pricePerNight}
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {room.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {room.type}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg font-bold text-gray-900">
                                ₹
                                {calculateTotalPrice(
                                  room.pricePerNight,
                                  room,
                                ).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                ₹{room.pricePerNight.toLocaleString()} per room
                                per night
                              </div>
                            </div>
                          </div>

                          {/* Simple Room Features */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {Array.isArray(room.features)
                              ? room.features
                                  .slice(0, 3)
                                  .map((feature: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                    >
                                      {typeof feature === "string"
                                        ? feature
                                        : feature?.name || "Feature"}
                                    </span>
                                  ))
                              : null}
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            <Button
                              onClick={() => {
                                setSelectedRoomType(room);
                                if (navigator.vibrate) {
                                  navigator.vibrate(50);
                                }
                              }}
                              className={`w-full font-medium py-3 text-sm ${
                                selectedRoomType?.id === room.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-white border border-blue-600 text-blue-600 hover:bg-blue-50"
                              }`}
                            >
                              {selectedRoomType?.id === room.id ? (
                                <span className="flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Selected
                                </span>
                              ) : (
                                "Select This Room"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "gallery" && (
              <div
                id="gallery-section-mobile"
                className="bg-white rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Photos</h2>
                  {hotel.isLiveData && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                      Live Images
                    </span>
                  )}
                  {hotel.fallback && (
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
                      Sample Images
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    // Use live images if available, otherwise fallback to sample images
                    const galleryImages =
                      hotel.images && hotel.images.length > 0
                        ? hotel.images.slice(0, 12) // Limit to 12 images for mobile
                        : [
                            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
                            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop",
                            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop",
                            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop",
                            "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=400&h=300&fit=crop",
                            "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&h=300&fit=crop",
                          ];

                    return galleryImages.map((image, idx) => {
                      // Handle both string URLs and image objects
                      const imageUrl =
                        typeof image === "string"
                          ? image
                          : image.urlStandard || image.url || image;
                      const imageAlt =
                        typeof image === "object" && image.alt
                          ? image.alt
                          : `${hotel.name} - Image ${idx + 1}`;
                      const imageCategory =
                        typeof image === "object" && image.category
                          ? image.category
                          : "general";

                      return (
                        <div
                          key={idx}
                          className="aspect-video overflow-hidden rounded-lg relative group cursor-pointer"
                          onClick={() => {
                            // TODO: Open lightbox/modal for full-size image viewing
                            console.log("Image clicked:", imageUrl);
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={imageAlt}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              e.target.src =
                                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop";
                            }}
                          />
                          {/* Image overlay with category */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 flex items-end">
                            {typeof image === "object" && image.description && (
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {image.description}
                              </div>
                            )}
                          </div>
                          {/* Image count indicator for first image */}
                          {idx === 0 && galleryImages.length > 6 && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              +{galleryImages.length - 6} more
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* View all photos button if more images available */}
                {hotel.images && hotel.images.length > 12 && (
                  <div className="mt-4 text-center">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      View All {hotel.images.length} Photos
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "amenities" && (
              <div
                id="amenities-section-mobile"
                className="bg-white rounded-lg p-4"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Amenities
                </h2>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: Waves, name: "Swimming Pool" },
                    { icon: Dumbbell, name: "Fitness Center" },
                    { icon: Wifi, name: "Free WiFi" },
                    { icon: Utensils, name: "Restaurant" },
                    { icon: Bell, name: "Room Service" },
                    { icon: Car, name: "Parking" },
                    { icon: Sparkles, name: "Spa" },
                    { icon: Briefcase, name: "Business Center" },
                    { icon: Shirt, name: "Laundry" },
                    { icon: Building2, name: "Concierge" },
                    { icon: Baby, name: "Childcare" },
                    { icon: Accessibility, name: "Accessibility" },
                  ].map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <amenity.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{amenity.name}</span>
                      <div className="ml-auto">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div
                id="reviews-section-mobile"
                className="bg-white rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Guest Reviews
                  </h2>
                  <Button
                    onClick={() => setIsWriteReviewModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg min-h-[44px] active:scale-95 transition-all duration-200 touch-manipulation"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Write Review
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {hotel.rating}
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on {hotel.reviews} reviews
                  </div>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(hotel.rating)
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
                        "Excellent service and beautiful rooms. The staff was incredibly helpful!",
                    },
                    {
                      name: "John D.",
                      date: "1 week ago",
                      rating: 4,
                      comment:
                        "Great location and amenities. Pool area was fantastic.",
                    },
                    {
                      name: "Emily R.",
                      date: "2 weeks ago",
                      rating: 5,
                      comment:
                        "Perfect for business travel. Clean, modern, and professional.",
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

                {/* Write Another Review Button for bottom of reviews */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setIsWriteReviewModalOpen(true)}
                    variant="outline"
                    className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 font-medium py-3 min-h-[48px] active:scale-95 transition-all duration-200 touch-manipulation"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Share Your Experience
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "location" && (
              <div
                id="location-section-mobile"
                className="bg-white rounded-lg p-4"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Location
                </h2>
                <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-600 font-medium">
                      Interactive map
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Tap to open full map
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Address</p>
                      <p className="text-sm text-gray-600">{hotel.location}</p>
                    </div>
                  </div>
                </div>

                {/* Nearby attractions */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Nearby Attractions
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        name: "Burj Khalifa",
                        distance: "2.5 km",
                        time: "5 min drive",
                      },
                      {
                        name: "Dubai Mall",
                        distance: "1.8 km",
                        time: "3 min drive",
                      },
                      {
                        name: "Dubai Fountain",
                        distance: "2.0 km",
                        time: "4 min drive",
                      },
                      {
                        name: "Dubai International Airport",
                        distance: "12 km",
                        time: "15 min drive",
                      },
                    ].map((place, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {place.name}
                        </span>
                        <div className="text-right">
                          <div className="text-xs text-gray-600">
                            {place.distance}
                          </div>
                          <div className="text-xs text-gray-500">
                            {place.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />

        {/* Desktop Search Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <HotelSearchForm
              initialDestination={
                destinationName || searchParams.get("destination") || ""
              }
              initialCheckIn={searchParams.get("checkIn") || ""}
              initialCheckOut={searchParams.get("checkOut") || ""}
              initialGuests={{
                adults: parseInt(searchParams.get("adults") || "2"),
                children: parseInt(searchParams.get("children") || "0"),
                rooms: parseInt(searchParams.get("rooms") || "1"),
              }}
            />
          </div>
        </div>

        {/* Desktop Hotel Info Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              <div
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleStarClick}
                title="Click to view reviews"
              >
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(hotel.rating)
                          ? "text-blue-600 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-blue-600 ml-2">
                  {hotel.rating}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{hotel.name}</h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-sm">{hotel.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Mobile Header Bar - for tablet view */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-[64px] z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex items-center gap-2 px-3 py-2"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
              </Button>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-600">
                ���{lowestPrice}+ per night
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-2"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Map</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex relative">
        {/* Left Sidebar - Filters (Always Expanded on Desktop, Modal on Mobile) */}
        <div
          className={`${
            isMobileFilterOpen ? "fixed inset-0 z-50 bg-white" : "hidden"
          } lg:block lg:relative lg:w-80 xl:w-96 bg-white border-r border-gray-200 min-h-screen lg:sticky lg:top-[64px] lg:max-h-[calc(100vh-64px)]`}
        >
          <div className="overflow-y-auto h-full p-3 lg:p-4">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            {/* Comprehensive Filters Component */}
            <ComprehensiveFilters
              priceRange={filterPriceRange}
              setPriceRange={setFilterPriceRange}
              selectedFilters={tboSelectedFilters}
              setSelectedFilters={setTboSelectedFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onClearFilters={() => {
                setTboSelectedFilters({});
                setFilterPriceRange([0, 25000]);
              }}
              priceMax={25000}
            />

            {/* Mobile Apply Filters Button */}
            <div className="lg:hidden mt-6 pt-4 border-t border-gray-200">
              <Button
                className="w-full bg-[#003580] hover:bg-[#002a66] text-white font-medium py-3"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="hidden md:flex flex-1 min-h-screen pb-20 md:pb-0 flex-col">
          {/* Tab Navigation - Sticky */}
          <div className="bg-white border-b border-gray-200 sticky top-[64px] lg:top-0 z-30">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 sm:px-4 lg:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-700 text-blue-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <div
            id="mobile-content-scroll"
            className="p-2 sm:p-3 lg:p-4 overflow-y-auto max-h-[calc(100vh-120px)] lg:max-h-[calc(100vh-60px)]"
          >
            {activeTab === "overview" && (
              <>
                {/* Hotel Header with Large Image */}
                <div className="bg-white rounded-lg border border-gray-200 mb-4">
                  {/* Hotel Image - Large and Prominent */}
                  <div className="relative">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-40 sm:h-48 md:h-56 lg:h-72 xl:h-80 object-cover rounded-t-lg"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop";
                      }}
                    />
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <div className="relative" ref={saveDropdownRef}>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`text-xs px-3 py-1 bg-white/90 backdrop-blur ${
                            isSaved
                              ? "bg-blue-100 text-blue-700 border-blue-300"
                              : ""
                          }`}
                          onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                        >
                          <Bookmark
                            className={`w-3 h-3 mr-1 ${isSaved ? "fill-current" : ""}`}
                          />
                          Save
                        </Button>

                        {/* Save Dropdown Menu */}
                        {showSaveDropdown && (
                          <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="p-3">
                              <h4 className="font-semibold text-sm text-gray-900 mb-3">
                                Save to list
                              </h4>
                              <div className="space-y-2">
                                <button
                                  onClick={() => {
                                    setIsSaved(true);
                                    setShowSaveDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center"
                                >
                                  <Bookmark className="w-4 h-4 mr-2 text-blue-600" />
                                  <span>My Saved Properties</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setShowSaveDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center"
                                >
                                  <div className="w-4 h-4 mr-2 text-green-600">
                                    +
                                  </div>
                                  <span>Create new list</span>
                                </button>
                                <hr className="my-2" />
                                <button
                                  onClick={() => {
                                    setShowSaveDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center"
                                >
                                  <Share2 className="w-4 h-4 mr-2 text-gray-600" />
                                  <span>Share this property</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1 bg-white/90 backdrop-blur"
                        onClick={() => setIsShareModalOpen(true)}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-blue-700 text-white p-3">
                    <h2 className="text-base font-semibold">
                      Available Rooms - Starting from Cheapest
                    </h2>
                    <p className="text-sm opacity-90">
                      Start with our cheapest room, then upgrade to better
                      options for just a little more!
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {filterRooms(roomTypes).map((room, index) => (
                      <div
                        key={room.id}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <div
                          className={`flex items-center justify-between cursor-pointer p-5 transition-all duration-200 ${
                            expandedRooms.has(room.id)
                              ? "bg-blue-50 border-l-4 border-blue-500 shadow-sm"
                              : "hover:bg-gray-50 hover:shadow-sm"
                          }`}
                          onClick={() => toggleRoomExpansion(room.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base text-gray-900">
                                {room.name}
                              </h3>
                              {index === 0 && (
                                <Badge className="bg-green-500 text-white border border-green-600 shadow-sm text-xs font-semibold px-3 py-1">
                                  Cheapest Room
                                </Badge>
                              )}
                              {index > 0 && (
                                <Badge className="bg-orange-100 text-orange-800 border border-orange-200 text-xs font-semibold px-3 py-1">
                                  Upgrade for +₹
                                  {room.pricePerNight -
                                    roomTypes[0].pricePerNight}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {room.type} • {room.details}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                ₹
                                {calculateTotalPrice(
                                  room.pricePerNight,
                                  room,
                                ).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                Total Price (incl. taxes)
                              </div>
                              <div className="text-xs text-gray-400">
                                ��{room.pricePerNight.toLocaleString()} per
                                night
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                expandedRooms.has(room.id) ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded Room Details */}
                        {expandedRooms.has(room.id) && (
                          <div className="bg-white border-t border-gray-200 p-6 mt-2">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                              {/* Room Image */}
                              <div className="lg:col-span-3">
                                <img
                                  src={room.image}
                                  alt={room.name}
                                  className="w-full h-40 lg:h-32 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop";
                                  }}
                                />
                              </div>

                              {/* Room Details */}
                              <div className="lg:col-span-6">
                                <h4 className="font-semibold text-lg mb-2 text-gray-900">
                                  {room.type}
                                </h4>
                                <div className="text-sm text-gray-600 mb-3">
                                  {room.details}
                                </div>
                                {room.nonRefundable && (
                                  <Badge className="bg-red-100 text-red-800 text-xs mb-3 px-2 py-1">
                                    Non Refundable Rate
                                  </Badge>
                                )}
                                {bargainingRoomId === room.id && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs mb-3 px-2 py-1 animate-pulse">
                                    <Sparkles className="w-3 h-3 mr-1 inline" />
                                    Bargaining in Progress
                                  </Badge>
                                )}
                                <div className="space-y-2">
                                  <h5 className="font-medium text-sm text-gray-900 mb-2">
                                    Room features:
                                  </h5>
                                  <div className="grid grid-cols-1 gap-2 text-sm">
                                    {room.features &&
                                    room.features.length > 0 ? (
                                      room.features.map((feature, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-start"
                                        >
                                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                                          <span className="text-gray-700">
                                            {feature}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex items-start">
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                                        <span className="text-gray-700">
                                          Comfortable room with standard
                                          amenities
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Pricing and Actions */}
                              <div className="lg:col-span-3 mt-4 lg:mt-0">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                  <div className="text-2xl font-bold text-gray-900 mb-1">
                                    ₹
                                    {calculateTotalPrice(
                                      room.pricePerNight,
                                      room,
                                    ).toLocaleString()}
                                  </div>
                                  <div className="text-sm font-semibold text-gray-900 mb-1">
                                    Total Price (incl. taxes)
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    ₹{room.pricePerNight.toLocaleString()} per
                                    night × {hotel.totalNights} nights
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Includes taxes, fees & charges
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <div
                                    className={`flex items-center text-sm font-medium ${
                                      room.statusColor === "green"
                                        ? "text-green-700"
                                        : "text-blue-700"
                                    }`}
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full mr-2 ${
                                        room.statusColor === "green"
                                          ? "bg-green-600"
                                          : "bg-blue-600"
                                      }`}
                                    ></span>
                                    {room.statusColor === "green"
                                      ? "Cheapest Option Available"
                                      : "Premium Upgrade Available"}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <Button
                                    onClick={() => handleBooking(room)}
                                    variant="outline"
                                    className="w-full font-semibold py-3 text-sm transition-all duration-200 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white hover:shadow-md"
                                  >
                                    Reserve Room
                                  </Button>
                                  <BargainButton
                                    useBargainModal={true}
                                    module="hotels"
                                    itemName={`${hotel.name} - ${room.name}`}
                                    basePrice={(() => {
                                      const roomTotal = calculateTotalPrice(
                                        room.pricePerNight,
                                        room,
                                      );
                                      // Debug trace for bargain opening
                                      console.log("[BARGAIN BASE DESKTOP]", {
                                        baseFromSelectedRate: roomTotal,
                                        roomId: room.id,
                                        roomName: room.name,
                                        perNightPrice: room.pricePerNight,
                                        isConsistentPrice: room.priceConsistent,
                                        exactResultsTotal:
                                          room.exactResultsTotal,
                                      });
                                      return roomTotal;
                                    })()}
                                    productRef={room.id}
                                    itemDetails={{
                                      id: room.id,
                                      name: `${hotel.name} - ${room.name}`,
                                      location:
                                        hotel.location || "Hotel Location",
                                      provider: "Hotelbeds",
                                      checkIn:
                                        searchParams.get("checkIn") || "",
                                      checkOut:
                                        searchParams.get("checkOut") || "",
                                      features: room.amenities || [],
                                    }}
                                    onBargainSuccess={(
                                      finalPrice,
                                      orderRef,
                                    ) => {
                                      console.log(
                                        `Hotel Details Desktop Bargain success! Final price: ${finalPrice}, Order: ${orderRef}`,
                                      );
                                      handleBooking(room, finalPrice);
                                      setBargainedRooms(
                                        (prev) => new Set([...prev, room.id]),
                                      );
                                    }}
                                    className={`w-full font-medium py-2 text-sm transition-all duration-200 min-h-[44px] ${
                                      bargainedRooms.has(room.id)
                                        ? "bg-green-600 text-white"
                                        : bargainingRoomId === room.id
                                          ? "bg-blue-600 text-white animate-pulse"
                                          : ""
                                    }`}
                                    disabled={
                                      bargainedRooms.has(room.id) ||
                                      bargainingRoomId === room.id
                                    }
                                  >
                                    {bargainedRooms.has(room.id) ? (
                                      <span className="flex items-center justify-center">
                                        Bargained
                                        <CheckCircle className="w-4 h-4 ml-2" />
                                      </span>
                                    ) : bargainingRoomId === room.id ? (
                                      "Bargaining..."
                                    ) : (
                                      "Bargain Now"
                                    )}
                                  </BargainButton>
                                </div>

                                <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-green-700">
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    No prepayment
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    Free cancellation
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "gallery" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-xl font-bold mb-4">Hotel Gallery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    hotel.image,
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
                    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600",
                    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
                    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600",
                  ].map((image, index) => (
                    <div key={index} className="aspect-video">
                      <img
                        src={image}
                        alt={`${hotel.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "amenities" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Facilities of Grand Hyatt Dubai
                  </h2>
                </div>
                {/* Most popular facilities */}
                <div className="mb-8">
                  <h3 className="font-semibold text-base mb-4">
                    Most popular facilities
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700">2 swimming pools</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-orange-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700">Fitness centre</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Cigarette className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-gray-700">Non-smoking rooms</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <Utensils className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-gray-700">17 restaurants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">
                        Spa and wellness centre
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">Room service</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                          <Coffee className="w-3 h-3 text-amber-600" />
                        </div>
                        <span>Tea/Coffee Maker on All Rooms</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="w-3 h-3 text-blue-600" />
                        </div>
                        <span>Car</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                          <ChefHat className="w-3 h-3 text-orange-600" />
                        </div>
                        <span>Excellent Breakfast</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <Wifi className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Free WiFi available on request</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Facilities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Great for your stay */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Home className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-base">
                        Great for your stay
                      </h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        17 restaurants
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Parking
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Air conditioning
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Private bathroom
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Free WiFi
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Spa and wellness centre
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Family rooms
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Non-smoking rooms
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Fitness centre
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Live music/performance
                      </li>
                    </ul>
                  </div>

                  {/* Parking */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Car className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-base">Parking</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Free private parking is possible on site (reservation is
                        not needed)
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Valet parking
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Parking garage
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        Accessible parking
                      </li>
                    </ul>
                  </div>

                  {/* 2 swimming pools */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Waves className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-base">
                        2 swimming pools
                      </h3>
                    </div>
                    <div className="mb-3">
                      <h4 className="font-medium text-sm mb-1">
                        Pool 1 - Indoor Pool
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                          Opening times
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                          Open all year
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                          All ages welcome
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">
                        Pool 2 - outdoor Pool
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                          Opening times
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                          Open all year
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                          All ages welcome
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Reception services */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-base">
                        Reception services
                      </h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Invoice provided
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Private check-in/out
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Concierge service
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        ATM/cash machine on site
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Currency exchange
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Tour desk
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Luggage storage
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Express check-in/out
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        24-hour front desk
                      </li>
                    </ul>
                  </div>

                  {/* Wellness */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Sparkles className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-base">Wellness</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Fitness/spa locker rooms
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Personal trainer
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Yoga classes
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Full body massage
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Hand massage
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Head massage
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Couples massage
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Foot massage
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Neck massage
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Back massage
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Beauty Services
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Spa lounge/relaxation area
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Steam room
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Spa facilities
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Sauna
                      </li>
                    </ul>
                  </div>

                  {/* Entertainment and family services */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Baby className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-base">
                        Entertainment and family services
                      </h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Babysitting/child services
                      </li>
                    </ul>
                  </div>

                  {/* Cleaning services */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                        <Shirt className="w-4 h-4 text-teal-600" />
                      </div>
                      <h3 className="font-semibold text-base">
                        Cleaning services
                      </h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Daily housekeeping
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Trouser press
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Ironing service
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Dry cleaning
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Laundry
                      </li>
                    </ul>
                  </div>

                  {/* Business facilities */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                        <Briefcase className="w-4 h-4 text-slate-600" />
                      </div>
                      <h3 className="font-semibold text-base">
                        Business facilities
                      </h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Fax/photocopying
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Business centre
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Meeting/banquet facilities
                      </li>
                    </ul>
                  </div>

                  {/* Safety & security */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <Shield className="w-4 h-4 text-red-600" />
                      </div>
                      <h3 className="font-semibold text-base">
                        Safety & security
                      </h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Fire extinguishers
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        CCTV outside property
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        CCTV in common areas
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Smoke alarms
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Security alarm
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Key card access
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        24-hour security
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Safety deposit box
                      </li>
                    </ul>
                  </div>

                  {/* General */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <Info className="w-4 h-4 text-gray-600" />
                      </div>
                      <h3 className="font-semibold text-base">General</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Grocery deliveries
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Designated smoking area
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Air conditioning
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Wake-up service
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Car hire
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Lift
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Family rooms
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Barber/beauty shop
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Ironing facilities
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Facilities for disabled guests
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Non-smoking rooms
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Room service
                      </li>
                    </ul>
                  </div>

                  {/* Languages Spoken */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <Languages className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-base">
                        Languages Spoken
                      </h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Arabic
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        German
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        English
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Spanish
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        French
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Hindi
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Indonesian
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Italian
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Japanese
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Korean
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Russian
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />{" "}
                        Chinese
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div
                id="reviews-section-desktop"
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    Guest reviews for {hotel.name}
                  </h2>
                  <Button
                    onClick={() => setIsWriteReviewModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] active:scale-95 transition-all duration-200 touch-manipulation"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Write Review
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-700 text-white px-3 py-1 rounded text-lg font-bold mr-3">
                        8.5
                      </div>
                      <div>
                        <div className="font-semibold">Excellent</div>
                        <div className="text-sm text-gray-600">
                          {hotel.reviews} reviews
                        </div>
                        <div className="text-xs text-gray-500">
                          We aim for 100% real reviews
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { category: "Staff", score: 9.6 },
                      { category: "Facilities", score: 9 },
                      { category: "Cleanliness", score: 9.2 },
                      { category: "Comfort", score: 9.1 },
                      { category: "Value for money", score: 8.5 },
                      { category: "Location", score: 8.8 },
                      { category: "Free WiFi", score: 8.6 },
                    ].map((item, index) => (
                      <div key={index} className="text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          {item.category}
                        </div>
                        <div className="font-bold text-lg">{item.score}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.score * 10}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: "Mia",
                      location: "United Arab Emirates",
                      room: "Twin Room",
                      date: "August 2023",
                      type: "Family",
                      title: "We are happy",
                      review:
                        "It's my pleasure to be thankful for the polite service and see my birthday 🎂 Thanks for making it special for me",
                      helpful: 0,
                      avatar: "M",
                    },
                    {
                      name: "Rachelle",
                      location: "United Arab Emirates",
                      room: "King Room with Skyline View",
                      date: "July 2023",
                      type: "Family",
                      title: "Wonderful",
                      review:
                        "The hotel exceeded our expectations in every way. The staff was incredibly friendly and helpful, the room was spacious and clean, and the location was perfect for exploring the city.",
                      helpful: 3,
                      avatar: "R",
                    },
                  ].map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold">
                          {review.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{review.name}</span>
                            <span className="text-xs text-gray-500">
                              {review.location}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {review.room} • {review.date} • {review.type}
                          </div>
                          <h4 className="font-semibold mb-1">{review.title}</h4>
                          <p className="text-sm text-gray-700 mb-2">
                            {review.review}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <button className="text-blue-600 hover:underline">
                              Helpful ({review.helpful})
                            </button>
                            <button className="text-gray-500 hover:underline">
                              Not helpful
                            </button>
                          </div>
                        </div>
                        <div className="bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold">
                          {8 + index}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "street-view" && (
              <div
                id="street-view-section-mobile"
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <h2 className="text-xl font-bold mb-4">Street View</h2>
                <p className="text-gray-600 mb-4">
                  Explore the area around Grand Hyatt Dubai with Google Street
                  View
                </p>

                <div className="mb-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                    Street View
                  </Button>
                </div>

                <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fa819714c5cc047bf850c81dad7db477e?format=webp&width=800"
                    alt="Street View of Grand Hyatt Dubai Entrance"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop";
                    }}
                  />

                  {/* Street View Label Overlay */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                      <MapPin className="w-4 h-4 mr-1 inline" />
                      Street View: Grand Hyatt Dubai
                    </div>
                  </div>

                  {/* Live Street View Indicator */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Live Street View
                    </div>
                  </div>

                  {/* Location Info Overlay */}
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded">
                      <div className="text-sm font-medium">
                        Near Sheikh Zayed Road & Mall Mall, Dubai, United Arab
                        Emirates
                      </div>
                    </div>
                  </div>

                  {/* Street View Navigation Note */}
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded text-xs">
                      Drag street view to look around
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🗺️</span>
                    <span>
                      <strong>Interactive View</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps/@25.2048,55.2708,3a,75y,210h,90t/data=!3m6!1e1!3m4!1sAF1QipO8EibS-hL-yfA-v8sVtSxBJBn2J8bv1U_7UW-9!2e10!7i5760!8i2880`,
                          "_blank",
                        );
                      }}
                      className="ml-2"
                    >
                      Open in Google Maps
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Drag to explore around
                  </p>
                </div>
              </div>
            )}

            {activeTab === "location" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-xl font-bold mb-4">Location & Map</h2>
                <p className="text-gray-600 mb-6">
                  See the exact location of {hotel.name} and nearby attractions
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="flex gap-2 mb-4">
                      <Button className="bg-blue-700 text-white px-3 py-1 text-sm">
                        Map
                      </Button>
                      <Button variant="outline" className="px-3 py-1 text-sm">
                        Satellite
                      </Button>
                      <Button variant="outline" className="px-3 py-1 text-sm">
                        Terrain
                      </Button>
                    </div>
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center relative">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🗺��</div>
                        <div className="text-gray-600">Interactive Map</div>
                        <div className="text-sm text-gray-500">
                          Hotel location and nearby landmarks
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-white rounded px-2 py-1 text-xs shadow">
                        <MapPin className="w-3 h-3 mr-1 inline" />
                        {hotel.name}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Hotel Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Address:</span>
                        <div className="text-gray-600">{hotel.location}</div>
                      </div>
                    </div>

                    <h3 className="font-semibold mt-6 mb-3">
                      Nearby Landmarks
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Dubai International Airport</span>
                        <span className="text-gray-500">8.5 km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Burj Khalifa</span>
                        <span className="text-gray-500">2.1 km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dubai Mall</span>
                        <span className="text-gray-500">1.8 km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Business Bay Metro Station</span>
                        <span className="text-gray-500">0.5 km</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Share2 className="w-5 h-5 mr-2" />
              Share this hotel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">{hotel.name} - faredown</h3>
              <p className="text-sm text-gray-600 mt-1">
                Check out this amazing hotel in {hotel.location}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}
              >
                🔗 Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `Check out ${hotel.name} in ${hotel.location}! ${window.location.href}`;
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(text)}`,
                    "_blank",
                  );
                }}
              >
                💬 WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `Check out ${hotel.name} in ${hotel.location}!`;
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`,
                    "_blank",
                  );
                }}
              >
                🐦 Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                    "_blank",
                  );
                }}
              >
                📘 Facebook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hotel Conversational Bargain Modal */}

      {/* Enhanced Review Modal */}
      <ReviewModal
        isOpen={isWriteReviewModalOpen}
        onClose={() => setIsWriteReviewModalOpen(false)}
        hotel={{
          id: hotelId || "",
          name: hotel.name,
          roomTypes: hotel.roomTypes || [],
        }}
        searchDates={{
          checkIn: checkInParam || "",
          checkOut: checkOutParam || "",
        }}
      />

      {/* Clean Mobile Bottom Action Bar */}
      <div
        className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 z-[60]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {selectedRoomType ? (
          /* Room Selected - Clean Design */
          <div className="p-4">
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {selectedRoomType.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    ₹{selectedRoomType.pricePerNight.toLocaleString()} per room
                    per night
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ₹
                    {calculateTotalPrice(
                      selectedRoomType.pricePerNight,
                    ).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Total Price (All Inclusive)
                  </div>
                </div>
              </div>
            </div>

            {!isBargainModalOpen && (
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    handleBooking(selectedRoomType);
                    if (navigator.vibrate) {
                      navigator.vibrate(100);
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white font-semibold py-3"
                >
                  Reserve
                </Button>
                <BargainButton
                  useBargainModal={true}
                  module="hotels"
                  itemName={`${hotel.name} - ${selectedRoomType?.name}`}
                  basePrice={(() => {
                    const selectedTotal = selectedRoomType
                      ? calculateTotalPrice(selectedRoomType.pricePerNight)
                      : 0;
                    // Debug trace for mobile bottom bar bargain opening
                    console.log("[BARGAIN BASE - MOBILE]", {
                      baseFromSelectedRate: selectedTotal,
                      selectedRoomId: selectedRoomType?.id,
                      selectedRoomName: selectedRoomType?.name,
                      perNightPrice: selectedRoomType?.pricePerNight,
                      isPreselectedRoom:
                        preselectRate?.rateKey === selectedRoomType?.id,
                      fromPreselectRate: preselectRate?.totalPrice,
                    });
                    return selectedTotal;
                  })()}
                  productRef={selectedRoomType?.id || ""}
                  itemDetails={{
                    id: selectedRoomType?.id || "",
                    name: `${hotel.name} - ${selectedRoomType?.name}`,
                    location: hotel.location || "Hotel Location",
                    provider: "Hotelbeds",
                    checkIn: searchParams.get("checkIn") || "",
                    checkOut: searchParams.get("checkOut") || "",
                    features:
                      selectedRoomType &&
                      Array.isArray(selectedRoomType.features)
                        ? selectedRoomType.features
                            .slice(0, 5)
                            .map((f) =>
                              typeof f === "string" ? f : f?.name || "Feature",
                            )
                        : [],
                  }}
                  onBargainSuccess={(finalPrice, orderRef) => {
                    console.log(
                      `Hotel Details Bottom Bar Bargain success! Final price: ${finalPrice}, Order: ${orderRef}`,
                    );
                    if (selectedRoomType) {
                      handleBooking(selectedRoomType, finalPrice);
                      setBargainedRooms(
                        (prev) => new Set([...prev, selectedRoomType.id]),
                      );
                    }
                    if (navigator.vibrate) {
                      navigator.vibrate(50);
                    }
                  }}
                  className="flex-1 text-black font-semibold py-3 min-h-[44px]"
                >
                  Bargain Now
                </BargainButton>
              </div>
            )}
          </div>
        ) : (
          /* No Room Selected - Simple Prompt */
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Starting from</div>
                <div className="text-lg font-bold text-gray-900">
                  ₹{calculateTotalPrice(lowestPrice).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  Total Price (All Inclusive)
                </div>
                <div className="text-xs text-gray-500">
                  ₹{lowestPrice.toLocaleString()} per room per night
                </div>
              </div>
              <div>
                <Button
                  disabled
                  className="bg-gray-200 text-gray-500 cursor-not-allowed px-6 py-3"
                >
                  Select Room First
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}
