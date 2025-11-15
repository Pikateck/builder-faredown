import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSearch } from "@/contexts/SearchContext";
import { qp, saveLastSearch, getLastSearch } from "@/lib/searchParams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StableBookingCalendar } from "@/components/StableBookingCalendar";
import { format, addDays } from "date-fns";
import {
  MapPin,
  CalendarIcon,
  Users,
  Search,
  Plus,
  Minus,
  X,
  Hotel,
  Building,
  Landmark,
  Plane,
  Globe,
} from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  searchHotels,
  getTypeIcon,
  getTypeLabel,
  type SearchResult,
} from "@/lib/hotelSearchData";
import {
  getNationalities,
  getDefaultNationality,
  type Nationality,
} from "@/services/nationalitiesService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GuestConfig {
  adults: number;
  children: number;
  childrenAges: number[];
  rooms: number;
}

interface HotelSearchFormProps {
  className?: string;
  variant?: "compact" | "full";
  onSearch?: (searchData: any) => void;
  initialDestination?: string;
  initialDestinationCode?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: { adults: number; children: number; rooms: number };
  initialNationality?: string;
}

export function HotelSearchForm({
  className = "",
  variant = "full",
  onSearch,
  initialDestination,
  initialDestinationCode,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialNationality,
}: HotelSearchFormProps) {
  const navigate = useNavigate();
  const { updateSearchParams, getDisplayData, searchParams } = useSearch();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Hydrate from props or start blank
  const [destination, setDestination] = useState(initialDestination || "");
  const [destinationCode, setDestinationCode] = useState(
    initialDestinationCode || "",
  );
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [inputValue, setInputValue] = useState(initialDestination || "");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null,
  );

  // Hydrate dates from props or start blank
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    initialCheckIn ? new Date(initialCheckIn) : undefined,
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    initialCheckOut ? new Date(initialCheckOut) : undefined,
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Hydrate guests from props or use defaults
  const [guests, setGuests] = useState<GuestConfig>(
    initialGuests
      ? {
          adults: initialGuests.adults,
          children: initialGuests.children,
          childrenAges: Array(initialGuests.children).fill(null),
          rooms: initialGuests.rooms,
        }
      : {
          adults: 2,
          children: 0,
          childrenAges: [],
          rooms: 1,
        },
  );
  const [isGuestPopoverOpen, setIsGuestPopoverOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Nationality state
  const { user } = useAuth() || { user: null };
  const [nationality, setNationality] = useState<string>(initialNationality || 'IN');
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [isNationalityLoading, setIsNationalityLoading] = useState(true);

  // Keep form blank by default - users can load from Recent Searches if needed
  // useEffect(() => {
  //   // Auto-population logic commented out to ensure blank-by-default behavior
  // }, [searchParams, getDisplayData]);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkMobile();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  // Load nationalities on mount
  useEffect(() => {
    const loadNationalities = async () => {
      try {
        setIsNationalityLoading(true);

        // Fetch nationalities from API
        const data = await getNationalities();
        setNationalities(data);

        // Set default based on user profile or fallback to IN
        if (!initialNationality) {
          const defaultNat = getDefaultNationality(user);
          setNationality(defaultNat);
        }

        console.log(`✅ Loaded ${data.length} nationalities, default: ${nationality}`);
      } catch (error) {
        console.error('❌ Error loading nationalities:', error);
        // Fallback to minimal list if API fails
        setNationalities([
          { isoCode: 'IN', countryName: 'India' },
          { isoCode: 'AE', countryName: 'United Arab Emirates' },
          { isoCode: 'GB', countryName: 'United Kingdom' },
          { isoCode: 'US', countryName: 'United States' },
          { isoCode: 'SG', countryName: 'Singapore' },
          { isoCode: 'AU', countryName: 'Australia' },
        ]);
        setNationality('IN');
      } finally {
        setIsNationalityLoading(false);
      }
    };

    loadNationalities();
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsDestinationOpen(false);
    };

    if (typeof document !== "undefined") {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, []);

  // ✅ OPTIMIZED: Debounce location search to prevent excessive API calls
  useEffect(() => {
    if (!isUserTyping || inputValue.length === 0) {
      // Show popular destinations when not typing
      const results = searchHotels("", 8);
      setSearchResults(results);
      return;
    }

    // Debounce API call by 400ms to avoid excessive requests
    const debounceTimer = setTimeout(() => {
      const fetchLocations = async () => {
        try {
          // Get the proper API base URL
          const apiBaseUrl = (() => {
            if (typeof window !== "undefined") {
              const envUrl = import.meta.env.VITE_API_BASE_URL;
              if (envUrl) {
                return envUrl.replace(/\/$/, ""); // Remove trailing slash
              }
              // Fallback: use Render API
              return "https://builder-faredown-pricing.onrender.com/api";
            }
            return "/api";
          })();

          const response = await fetch(
            `${apiBaseUrl}/tbo-hotels/cities?q=${encodeURIComponent(inputValue)}&limit=15`,
          );
          if (response.ok) {
            const data = await response.json();
            if (
              data.success &&
              Array.isArray(data.data) &&
              data.data.length > 0
            ) {
              // Map TBO cities API results to SearchResult format
              const results = data.data.map((item: any) => ({
                id: item.code,
                code: item.code,
                name: item.name,
                type: "city",
                location: `${item.name}${item.countryName ? ", " + item.countryName : ""}`,
                description: item.region || "City",
                rating: undefined,
              }));

              setSearchResults(results);
            } else {
              // Fallback to local search if API returns empty results
              const results = searchHotels(inputValue);
              setSearchResults(results);
            }
          } else {
            // Fallback to local search if API fails
            const results = searchHotels(inputValue);
            setSearchResults(results);
          }
        } catch (error) {
          // Fallback to local search if API fails (silent fail, no logging)
          const results = searchHotels(inputValue);
          setSearchResults(results);
        }
      };
      fetchLocations();
    }, 400); // 400ms debounce

    return () => clearTimeout(debounceTimer);
  }, [inputValue, isUserTyping]);

  const childAgeOptions = Array.from({ length: 13 }, (_, i) => i);

  const calculateNights = (
    checkIn: Date | undefined,
    checkOut: Date | undefined,
  ): number => {
    if (!checkIn || !checkOut) return 0;
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(nights, 1);
  };

  const nights = calculateNights(checkInDate, checkOutDate);

  const updateGuestCount = (
    type: keyof Pick<GuestConfig, "adults" | "children" | "rooms">,
    operation: "increment" | "decrement",
  ) => {
    setGuests((prev) => {
      const newValue =
        operation === "increment" ? prev[type] + 1 : prev[type] - 1;

      // Validation rules
      if (type === "adults" && newValue < 1) return prev;
      if (type === "children" && newValue < 0) return prev;
      if (type === "rooms" && newValue < 1) return prev;
      if (type === "rooms" && newValue > 8) return prev;
      if ((type === "adults" || type === "children") && newValue > 16)
        return prev;

      // Handle children ages array
      if (type === "children") {
        const childrenAges = [...prev.childrenAges];
        if (newValue > prev.children) {
          // Add new child age
          childrenAges.push(10);
        } else if (newValue < prev.children) {
          // Remove last child age
          childrenAges.pop();
        }
        return {
          ...prev,
          [type]: newValue,
          childrenAges,
        };
      }

      return {
        ...prev,
        [type]: newValue,
      };
    });
  };

  const updateChildAge = (index: number, age: number) => {
    setGuests((prev) => ({
      ...prev,
      childrenAges: prev.childrenAges.map((existingAge, i) =>
        i === index ? age : existingAge,
      ),
    }));
  };

  const handleSearch = () => {
    console.log("🔍 Starting hotel search with:", {
      destination,
      checkInDate,
      checkOutDate,
      guests,
    });

    // Only validate dates, destination is optional for browsing
    // Use selected result location if available
    const searchDestination = selectedResult
      ? selectedResult.location
      : destination;
    // Validate dates are properly set

    if (
      !checkInDate ||
      !checkOutDate ||
      !(checkInDate instanceof Date) ||
      !(checkOutDate instanceof Date)
    ) {
      const missingFields = [];
      if (!checkInDate || !(checkInDate instanceof Date))
        missingFields.push("check-in date");
      if (!checkOutDate || !(checkOutDate instanceof Date))
        missingFields.push("check-out date");

      setErrorMessage(`Please select ${missingFields.join(" and ")}`);
      setShowError(true);
      return;
    }

    // Validate date range
    const daysBetween = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysBetween < 1) {
      setErrorMessage("Check-out date must be after check-in date");
      setShowError(true);
      return;
    }
    if (daysBetween > 30) {
      setErrorMessage("Maximum stay duration is 30 days");
      setShowError(true);
      return;
    }

    try {
      // Update SearchContext with the search parameters
      const fullLocationName = selectedResult?.location || destination;
      const code = destinationCode || (selectedResult?.code as string) || "";

      updateSearchParams({
        destination: code || destination,
        destinationName: fullLocationName,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        departureDate: checkInDate.toISOString(),
        returnDate: checkOutDate.toISOString(),
        guests: {
          adults: guests.adults,
          children: guests.children,
        },
        passengers: {
          adults: guests.adults,
          children: guests.children,
          infants: 0,
        },
        rooms: guests.rooms,
        guestNationality: nationality,
        module: "hotels",
        tripType: "round-trip",
        searchTimestamp: new Date().toISOString(),
      });

      const urlSearchParams = new URLSearchParams({
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        adults: guests.adults.toString(),
        children: guests.children.toString(),
        rooms: guests.rooms.toString(),
        guestNationality: nationality,
        searchType: "live",
        searchId: Date.now().toString(),
      });

      // Only add destination if it exists
      if (destination || selectedResult) {
        const code =
          destinationCode || (selectedResult?.code as string) || "HTL";
        const fullLocationName = selectedResult?.location || destination;

        urlSearchParams.set("destination", code); // use code for backend search
        urlSearchParams.set("destinationCode", code);
        urlSearchParams.set("destinationName", fullLocationName);
      }

      // Save search data to sessionStorage for persistence
      const searchData = {
        city: destination,
        checkin: checkInDate.toISOString().split("T")[0],
        checkout: checkOutDate.toISOString().split("T")[0],
        adults: guests.adults.toString(),
        children: guests.children.toString(),
        rooms: guests.rooms.toString(),
        guestNationality: nationality,
      };
      saveLastSearch(searchData);

      // Store in recent searches API (non-blocking)
      const recentSearchData = {
        destination: {
          name: destination || "Any destination",
          code: destinationCode || "HTL",
        },
        dates: {
          checkin: checkInDate.toISOString(),
          checkout: checkOutDate.toISOString(),
        },
        adults: guests.adults,
        children: guests.children,
        rooms: guests.rooms,
        guestNationality: nationality,
      };

      // Non-blocking API call to store recent search
      const apiBaseUrl = (() => {
        if (typeof window !== "undefined") {
          const envUrl = import.meta.env.VITE_API_BASE_URL;
          if (envUrl) {
            return envUrl.replace(/\/$/, "");
          }
          return "https://builder-faredown-pricing.onrender.com/api";
        }
        return "/api";
      })();

      fetch(`${apiBaseUrl}/recent-searches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          module: "hotels",
          query: recentSearchData,
        }),
      })
        .then((response) => {
          if (response.ok) {
            console.log("✅ Recent hotel search saved successfully");
            return response.json();
          } else {
            console.warn(
              `⚠️  Recent search API returned ${response.status}, continuing anyway`,
            );
            return { id: 0, warning: `HTTP ${response.status}` };
          }
        })
        .then((data) => {
          if (data.id) {
            console.log("📋 Saved hotel search ID:", data.id);
          } else if (data.warning) {
            console.warn("⚠️  Recent search note:", data.warning);
          }
        })
        .catch((error) => {
          console.warn(
            "⚠️  Failed to save recent hotel search (non-blocking):",
            error.message,
          );
          // This is non-blocking, so don't propagate the error
        });

      const url = `/hotels/results?${urlSearchParams.toString()}`;
      console.log("🏨 Navigating to hotel search:", url);

      if (onSearch) {
        onSearch({
          destination,
          checkInDate,
          checkOutDate,
          guests,
        });
      } else {
        navigate(url);
      }
    } catch (error) {
      console.error("🚨 Error in hotel search:", error);
      setErrorMessage("Search failed. Please try again.");
      setShowError(true);
    }
  };

  const guestSummary = () => {
    const parts = [];
    parts.push(`${guests.adults} adult${guests.adults > 1 ? "s" : ""}`);
    if (guests.children > 0) {
      parts.push(`${guests.children} child${guests.children > 1 ? "ren" : ""}`);
    }
    parts.push(`${guests.rooms} room${guests.rooms > 1 ? "s" : ""}`);
    return parts.join(" • ");
  };

  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      <div
        className={`bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200 ${className}`}
      >
        {/* Main Search Form */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">
          {/* Destination */}
          <div
            className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Where are you going?
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDestinationOpen(!isDestinationOpen)}
                className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-10 w-full hover:border-blue-600 touch-manipulation pr-10"
              >
                <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                <div className="flex items-center space-x-2 min-w-0">
                  {selectedResult ? (
                    <>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {selectedResult.code || "HTL"}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-gray-900 font-medium truncate">
                          {selectedResult.name}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {getTypeLabel(selectedResult.type)} •{" "}
                          {selectedResult.description}
                        </span>
                      </div>
                    </>
                  ) : destination ? (
                    <>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {destinationCode || "HTL"}
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {destination}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium">
                      Search hotels, cities, landmarks...
                    </span>
                  )}
                </div>
              </button>
              {(destination || selectedResult) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDestination("");
                    setInputValue("");
                    setIsUserTyping(false);
                    setDestinationCode("");
                    setSelectedResult(null);
                    setIsDestinationOpen(false);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear destination"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Smart Search Dropdown */}
            {isDestinationOpen && (
              <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {isUserTyping && inputValue
                      ? `Search results for "${inputValue}"`
                      : "Popular destinations"}
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        setInputValue(value);
                        setIsUserTyping(value.length > 0);
                      }}
                      placeholder="Search hotels, cities, landmarks..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {searchResults.length > 0 ? (
                    searchResults.map((result) => {
                      const getIcon = () => {
                        switch (result.type) {
                          case "hotel":
                            return <Hotel className="w-4 h-4 text-blue-600" />;
                          case "city":
                            return (
                              <Building className="w-4 h-4 text-green-600" />
                            );
                          case "area":
                            return (
                              <MapPin className="w-4 h-4 text-purple-600" />
                            );
                          case "landmark":
                            return (
                              <Landmark className="w-4 h-4 text-orange-600" />
                            );
                          case "airport":
                            return <Plane className="w-4 h-4 text-gray-600" />;
                          default:
                            return <MapPin className="w-4 h-4 text-blue-600" />;
                        }
                      };

                      const getIconBg = () => {
                        switch (result.type) {
                          case "hotel":
                            return "bg-blue-50";
                          case "city":
                            return "bg-green-50";
                          case "area":
                            return "bg-purple-50";
                          case "landmark":
                            return "bg-orange-50";
                          case "airport":
                            return "bg-gray-50";
                          default:
                            return "bg-blue-50";
                        }
                      };

                      return (
                        <button
                          key={result.id}
                          onClick={() => {
                            setSelectedResult(result);
                            setDestination(result.location);
                            setDestinationCode(result.code || "HTL");
                            setIsDestinationOpen(false);
                            setInputValue("");
                            setIsUserTyping(false);
                          }}
                          className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 ${getIconBg()} rounded-full flex items-center justify-center flex-shrink-0`}
                            >
                              {getIcon()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {result.name}
                                {result.rating && (
                                  <span className="ml-2 text-xs text-yellow-600">
                                    ⭐ {result.rating}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {getTypeLabel(result.type)} •{" "}
                                {result.description}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {result.location}
                              </div>
                            </div>
                            {result.type === "hotel" && (
                              <div className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded">
                                Hotel
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-6 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No results found</p>
                      <p className="text-xs mt-1">
                        Try searching for hotels, cities, or landmarks
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Check-in/Check-out Dates */}
          <div className="flex-1 lg:max-w-[280px] relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Check-in - Check-out
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {checkInDate && checkOutDate ? (
                      <>
                        <span className="hidden md:inline">
                          {format(checkInDate, "EEE, MMM d")} to{" "}
                          {format(checkOutDate, "EEE, MMM d")}
                        </span>
                        <span className="md:hidden">
                          {format(checkInDate, "d MMM")} -{" "}
                          {format(checkOutDate, "d MMM")}
                        </span>
                      </>
                    ) : (
                      "Check-in to Check-out"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <StableBookingCalendar
                  bookingType="hotel"
                  initialRange={{
                    startDate: checkInDate || new Date(),
                    endDate:
                      checkOutDate || addDays(checkInDate || new Date(), 3),
                  }}
                  onChange={(range) => {
                    if (range.startDate && range.endDate) {
                      setCheckInDate(range.startDate);
                      setCheckOutDate(range.endDate);
                      // Clear any existing error when valid dates are selected
                      if (
                        showError &&
                        errorMessage.includes("Please select check-in")
                      ) {
                        setShowError(false);
                        setErrorMessage("");
                      }
                    }
                  }}
                  onClose={() => setIsCalendarOpen(false)}
                  className="w-full"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests & Rooms + Nationality Container */}
        <div className="flex-1 lg:max-w-[280px] flex flex-col gap-2">
          {/* Guests & Rooms */}
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Guests & Rooms
            </label>
            <Popover
              open={isGuestPopoverOpen}
              onOpenChange={setIsGuestPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm overflow-hidden">
                    <span className="hidden lg:inline">
                      {guests.adults} adults, {guests.children} children,{" "}
                      {guests.rooms} room{guests.rooms > 1 ? "s" : ""}
                    </span>
                    <span className="hidden md:inline lg:hidden">
                      {guests.adults + guests.children} guests, {guests.rooms}{" "}
                      room{guests.rooms > 1 ? "s" : ""}
                    </span>
                    <span className="hidden sm:inline md:hidden">
                      {guests.adults + guests.children} guests, {guests.rooms}rm
                      {guests.rooms > 1 ? "s" : ""}
                    </span>
                    <span className="sm:hidden">
                      {guests.rooms}rm �� {guests.adults + guests.children}ppl
                    </span>
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-96" align="start">
                <div className="space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Adults</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("adults", "decrement")}
                        disabled={guests.adults <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {guests.adults}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("adults", "increment")}
                        disabled={guests.adults >= 16}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Children</div>
                      <div className="text-sm text-gray-500">Ages 0-17</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() =>
                          updateGuestCount("children", "decrement")
                        }
                        disabled={guests.children <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {guests.children}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() =>
                          updateGuestCount("children", "increment")
                        }
                        disabled={guests.children >= 16}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Children Ages */}
                  {guests.children > 0 && (
                    <div className="space-y-2">
                      {guests.childrenAges.map((age, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">
                            Age of child {index + 1}
                          </span>
                          <select
                            value={age}
                            onChange={(e) =>
                              updateChildAge(index, parseInt(e.target.value))
                            }
                            className="border rounded px-2 py-1 text-sm"
                          >
                            {childAgeOptions.map((ageOption) => (
                              <option key={ageOption} value={ageOption}>
                                {ageOption} years old
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rooms */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Rooms</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("rooms", "decrement")}
                        disabled={guests.rooms <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {guests.rooms}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("rooms", "increment")}
                        disabled={guests.rooms >= 8}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsGuestPopoverOpen(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Nationality */}
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Guest Nationality
            </label>
            <Select
              value={nationality}
              onValueChange={setNationality}
              disabled={isNationalityLoading}
            >
              <SelectTrigger className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3">
                <Globe className="mr-2 h-4 w-4 flex-shrink-0" />
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {nationalities.map((n) => (
                  <SelectItem key={n.isoCode} value={n.isoCode}>
                    {n.countryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Button
            onClick={handleSearch}
            className="h-10 sm:h-12 w-full sm:w-auto bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-bold rounded px-6 sm:px-8 transition-all duration-150"
            title="Search hotels"
          >
            <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Search</span>
          </Button>
        </div>
        </div>
      </div>
    </>
  );
}
