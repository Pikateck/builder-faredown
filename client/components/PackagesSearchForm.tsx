import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/contexts/SearchContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StableBookingCalendar } from "@/components/StableBookingCalendar";
import { format, addDays } from "date-fns";
import { MapPin, CalendarIcon, Search, X, Users, Globe } from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";

interface Region {
  id: string;
  name: string;
  level: string;
  parent_id: string | null;
  sort_order: number;
}

interface City {
  id: string;
  name: string;
  code: string;
  country: {
    id: string;
    name: string;
    iso: string;
  };
}

export function PackagesSearchForm() {
  const navigate = useNavigate();
  const { updateSearchParams, getDisplayData, searchParams } = useSearch();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Region state
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regionInputValue, setRegionInputValue] = useState("");
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

  // City state
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInputValue, setCityInputValue] = useState("");
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Dates
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    undefined,
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Filters
  const [duration, setDuration] = useState("any");
  const [budget, setBudget] = useState("any");
  const [category, setCategory] = useState("any");

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load regions on component mount
  useEffect(() => {
    loadRegions();
  }, []);

  // Load regions
  const loadRegions = async (query = "") => {
    setLoadingRegions(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);

      const response = await fetch(`/api/destinations/regions?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRegions(result.data.items || []);
        }
      }
    } catch (error) {
      console.error("Error loading regions:", error);
    }
    setLoadingRegions(false);
  };

  // Load cities for selected region
  const loadCitiesForRegion = async (regionId: string, query = "") => {
    setLoadingCities(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);

      const response = await fetch(
        `/api/destinations/regions/${regionId}/cities?${params}`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCities(result.data.items || []);
        }
      }
    } catch (error) {
      console.error("Error loading cities:", error);
    }
    setLoadingCities(false);
  };

  // Handle region input change
  const handleRegionInputChange = (value: string) => {
    setRegionInputValue(value);
    loadRegions(value);
  };

  // Handle city input change
  const handleCityInputChange = (value: string) => {
    setCityInputValue(value);
    if (selectedRegion) {
      loadCitiesForRegion(selectedRegion.id, value);
    }
  };

  // Handle region selection
  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setRegionInputValue(region.name);
    setIsRegionOpen(false);

    // Clear city selection when region changes
    setSelectedCity(null);
    setCityInputValue("");
    setCities([]);

    // Load cities for this region
    loadCitiesForRegion(region.id);
  };

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setCityInputValue(city.name);
    setIsCityOpen(false);
  };

  // Clear region selection
  const handleClearRegion = () => {
    setSelectedRegion(null);
    setRegionInputValue("");
    setSelectedCity(null);
    setCityInputValue("");
    setCities([]);
  };

  // Clear city selection
  const handleClearCity = () => {
    setSelectedCity(null);
    setCityInputValue("");
  };

  const handleSearch = () => {
    // Validate form
    if (!selectedRegion) {
      setErrorMessage("Please select a region");
      setShowError(true);
      return;
    }

    if (!departureDate) {
      setErrorMessage("Please select departure date");
      setShowError(true);
      return;
    }

    // Clear any existing errors
    setShowError(false);
    setErrorMessage("");

    // Build search parameters
    const searchData = {
      region_id: selectedRegion.id,
      region_name: selectedRegion.name,
      city_id: selectedCity?.id,
      city_name: selectedCity?.name,
      departure_date: departureDate
        ? format(departureDate, "yyyy-MM-dd")
        : undefined,
      return_date: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      duration,
      budget,
      category,
      module: "packages",
    };

    // Update search context
    updateSearchParams(searchData);

    // Navigate to results page
    navigate("/packages/results");
  };

  return (
    <div className="w-full">
      {/* Error Banner */}
      {showError && (
        <div className="mb-4">
          <ErrorBanner
            message={errorMessage}
            onClose={() => setShowError(false)}
          />
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <Popover open={isRegionOpen} onOpenChange={setIsRegionOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-500 hover:border-blue-600 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <div className="flex items-center w-full">
                    <Globe className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      {selectedRegion ? (
                        <span className="text-gray-900 truncate">
                          {selectedRegion.name}
                        </span>
                      ) : (
                        <span className="text-gray-500 truncate">
                          Select region...
                        </span>
                      )}
                    </div>
                    {selectedRegion && (
                      <X
                        className="ml-2 h-4 w-4 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearRegion();
                        }}
                      />
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search regions..."
                      value={regionInputValue}
                      onChange={(e) => handleRegionInputChange(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {loadingRegions ? (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        Loading regions...
                      </div>
                    ) : regions.length === 0 ? (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No regions found
                      </div>
                    ) : (
                      regions.map((region) => (
                        <button
                          key={region.id}
                          onClick={() => handleRegionSelect(region)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center"
                        >
                          <Globe className="mr-3 h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {region.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Level {region.level}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <Popover open={isCityOpen} onOpenChange={setIsCityOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!selectedRegion}
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-500 hover:border-blue-600 rounded text-xs sm:text-sm px-2 sm:px-3 disabled:border-gray-300 disabled:bg-gray-50"
                >
                  <div className="flex items-center w-full">
                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      {selectedCity ? (
                        <span className="text-gray-900 truncate">
                          {selectedCity.name}
                        </span>
                      ) : (
                        <span className="text-gray-500 truncate">
                          {selectedRegion
                            ? "Select city..."
                            : "Select a region first"}
                        </span>
                      )}
                    </div>
                    {selectedCity && (
                      <X
                        className="ml-2 h-4 w-4 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearCity();
                        }}
                      />
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search cities..."
                      value={cityInputValue}
                      onChange={(e) => handleCityInputChange(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {loadingCities ? (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        Loading cities...
                      </div>
                    ) : cities.length === 0 ? (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        {selectedRegion
                          ? "No cities found in this region"
                          : "Select a region first"}
                      </div>
                    ) : (
                      cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelect(city)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center"
                        >
                          <MapPin className="mr-3 h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {city.name} {city.code && `(${city.code})`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {city.country.name}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure Date
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-500 hover:border-blue-600 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {departureDate
                      ? format(departureDate, "MMM d, yyyy")
                      : "Select date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <StableBookingCalendar
                  bookingType="packages"
                  initialRange={{
                    startDate: departureDate || new Date(),
                    endDate:
                      returnDate || addDays(departureDate || new Date(), 7),
                  }}
                  onChange={(range) => {
                    setDepartureDate(range.startDate);
                    setReturnDate(range.endDate);
                    setIsCalendarOpen(false);
                  }}
                  onClose={() => setIsCalendarOpen(false)}
                  className="w-full"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Duration Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full h-10 sm:h-12 px-3 border-2 border-blue-500 rounded text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="any">Any Duration</option>
              <option value="1-5">1-5 Days</option>
              <option value="6-10">6-10 Days</option>
              <option value="11-15">11-15 Days</option>
              <option value="16+">16+ Days</option>
            </select>
          </div>
        </div>

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget (per person)
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full h-10 sm:h-12 px-3 border-2 border-blue-500 rounded text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="any">Any Budget</option>
              <option value="0-50000">Under ₹50,000</option>
              <option value="50000-100000">₹50,000 - ₹1,00,000</option>
              <option value="100000-200000">₹1,00,000 - ₹2,00,000</option>
              <option value="200000-500000">₹2,00,000 - ₹5,00,000</option>
              <option value="500000+">Above ₹5,00,000</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 sm:h-12 px-3 border-2 border-blue-500 rounded text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="any">All Types</option>
              <option value="cultural">Cultural & Heritage</option>
              <option value="beach">Beach & Islands</option>
              <option value="adventure">Adventure</option>
              <option value="honeymoon">Honeymoon</option>
              <option value="family">Family</option>
              <option value="luxury">Luxury</option>
              <option value="budget">Budget</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              className="w-full h-10 sm:h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-sm sm:text-base px-4 sm:px-6 flex items-center justify-center"
            >
              <Search className="mr-2 h-4 w-4" />
              Search Packages
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
