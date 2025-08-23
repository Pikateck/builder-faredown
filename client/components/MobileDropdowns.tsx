import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Search,
  Plane,
  Building,
  Calendar,
  CalendarIcon,
  Users,
  ChevronLeft,
  ChevronRight,
  Navigation,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingCalendar } from "@/components/BookingCalendar";
import { addDays } from "date-fns";

interface CityData {
  code: string;
  name: string;
  airport: string;
  fullName: string;
}

interface MobileCityDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cities: Record<string, CityData>;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  context?: "flights" | "hotels"; // Add context to determine what to show
}

export function MobileCityDropdown({
  isOpen,
  onClose,
  title,
  cities,
  selectedCity,
  onSelectCity,
  context = "flights", // Default to flights for backward compatibility
}: MobileCityDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDestinations, setFilteredDestinations] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced destination data with optimized search
  const allDestinations = [
    // Popular destinations for fast access
    {
      id: "DXB",
      code: "DXB",
      name: "Dubai",
      country: "United Arab Emirates",
      airport: context === "hotels" ? "Downtown Dubai, Marina, Business Bay" : "Dubai International Airport",
      description: context === "hotels" ? "Luxury hotels, beaches, shopping malls" : "Major international hub",
      searchTerms: ["dubai", "dxb", "emirates", "uae", "united arab emirates"],
      popular: true,
    },
    {
      id: "BCN",
      code: "BCN", 
      name: "Barcelona",
      country: "Spain",
      airport: context === "hotels" ? "Gothic Quarter, Eixample, Barceloneta" : "Barcelona-El Prat Airport",
      description: context === "hotels" ? "Beach hotels, city center, Gothic quarter" : "European gateway",
      searchTerms: ["barcelona", "bcn", "spain", "catalonia"],
      popular: true,
    },
    {
      id: "LON",
      code: "LON",
      name: "London", 
      country: "United Kingdom",
      airport: context === "hotels" ? "Westminster, Kensington, Canary Wharf" : "Heathrow Airport",
      description: context === "hotels" ? "Historic hotels, business districts" : "Major European hub",
      searchTerms: ["london", "lon", "uk", "england", "united kingdom", "heathrow"],
      popular: true,
    },
    {
      id: "PAR",
      code: "PAR",
      name: "Paris",
      country: "France", 
      airport: context === "hotels" ? "Champs-Élysées, Le Marais, Montmartre" : "Charles de Gaulle Airport",
      description: context === "hotels" ? "Boutique hotels, romantic locations" : "European cultural hub",
      searchTerms: ["paris", "par", "france", "charles de gaulle", "cdg"],
      popular: true,
    },
    {
      id: "BOM",
      code: "BOM",
      name: "Mumbai",
      country: "India",
      airport: context === "hotels" ? "Bandra, Andheri, South Mumbai" : "Chhatrapati Shivaji International",
      description: context === "hotels" ? "Business hotels, city center locations" : "Financial capital of India",
      searchTerms: ["mumbai", "bom", "bombay", "india", "maharashtra"],
      popular: true,
    },
    {
      id: "DEL",
      code: "DEL",
      name: "Delhi",
      country: "India",
      airport: context === "hotels" ? "Connaught Place, Gurgaon, Airport area" : "Indira Gandhi International",
      description: context === "hotels" ? "Heritage hotels, business districts" : "Capital of India",
      searchTerms: ["delhi", "del", "new delhi", "india", "igi"],
      popular: true,
    },
    {
      id: "NYC",
      code: "NYC",
      name: "New York",
      country: "United States",
      airport: context === "hotels" ? "Manhattan, Times Square, Central Park" : "John F. Kennedy Airport",
      description: context === "hotels" ? "Luxury hotels, iconic locations" : "Major US gateway",
      searchTerms: ["new york", "nyc", "jfk", "usa", "manhattan", "america"],
      popular: true,
    },
    {
      id: "SIN",
      code: "SIN", 
      name: "Singapore",
      country: "Singapore",
      airport: context === "hotels" ? "Marina Bay, Orchard Road, Sentosa" : "Changi Airport",
      description: context === "hotels" ? "Luxury resorts, city center hotels" : "Southeast Asian hub",
      searchTerms: ["singapore", "sin", "changi"],
      popular: true,
    },
    {
      id: "BKK",
      code: "BKK",
      name: "Bangkok", 
      country: "Thailand",
      airport: context === "hotels" ? "Sukhumvit, Silom, Chatuchak" : "Suvarnabhumi Airport",
      description: context === "hotels" ? "Budget to luxury hotels, city center" : "Southeast Asian gateway",
      searchTerms: ["bangkok", "bkk", "thailand", "suvarnabhumi"],
      popular: true,
    },
    {
      id: "ROM",
      code: "ROM",
      name: "Rome",
      country: "Italy",
      airport: context === "hotels" ? "Vatican, Colosseum, Trastevere" : "Fiumicino Airport",
      description: context === "hotels" ? "Historic hotels, ancient sites" : "European cultural hub",
      searchTerms: ["rome", "rom", "italy", "fiumicino"],
      popular: true,
    },
    {
      id: "TKO",
      code: "TKO",
      name: "Tokyo",
      country: "Japan",
      airport: context === "hotels" ? "Shibuya, Shinjuku, Ginza" : "Haneda Airport",
      description: context === "hotels" ? "Modern hotels, traditional ryokans" : "Major Asian hub",
      searchTerms: ["tokyo", "tko", "japan", "haneda", "narita"],
      popular: true,
    },
    {
      id: "SYD",
      code: "SYD",
      name: "Sydney",
      country: "Australia",
      airport: context === "hotels" ? "Circular Quay, Darling Harbour, Bondi" : "Kingsford Smith Airport",
      description: context === "hotels" ? "Harbour views, beach hotels" : "Australian gateway",
      searchTerms: ["sydney", "syd", "australia", "kingsford smith"],
      popular: true,
    },
  ];

  // Fast search function with optimized matching
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredDestinations([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const searchTerm = query.toLowerCase().trim();
    
    // Fast filtering with multiple match criteria
    const matches = allDestinations.filter(dest => {
      return (
        dest.code.toLowerCase().includes(searchTerm) ||
        dest.name.toLowerCase().includes(searchTerm) ||
        dest.country.toLowerCase().includes(searchTerm) ||
        dest.airport.toLowerCase().includes(searchTerm) ||
        dest.searchTerms.some(term => term.includes(searchTerm))
      );
    });

    // Sort by relevance: exact matches first, then popular destinations
    const sorted = matches.sort((a, b) => {
      const aExact = a.code.toLowerCase() === searchTerm || a.name.toLowerCase() === searchTerm;
      const bExact = b.code.toLowerCase() === searchTerm || b.name.toLowerCase() === searchTerm;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    });

    setFilteredDestinations(sorted);
    setIsSearching(false);
  }, [context]);

  // Debounced search for optimal performance
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Ultra-fast response for exact matches like "DXB"
    if (value.length <= 3) {
      debounceRef.current = setTimeout(() => performSearch(value), 50);
    } else {
      debounceRef.current = setTimeout(() => performSearch(value), 150);
    }
  }, [performSearch]);

  // Focus input when component opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const showingSearchResults = searchQuery.trim().length > 0;
  const destinationsToShow = showingSearchResults ? filteredDestinations : allDestinations.filter(d => d.popular);

  return (
    <div className="sm:hidden fixed inset-0 bg-white z-[60] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 touch-manipulation"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                context === "hotels"
                  ? "Search cities, destinations or countries"
                  : "Search airports, cities or countries"
              }
              className="w-full pl-10 pr-4 py-4 text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              onMouseDown={(e) => e.preventDefault()}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilteredDestinations([]);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {isSearching && (
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              Searching...
            </div>
          )}
        </div>

        {/* Search Results or Popular Destinations */}
        <div className="mb-6">
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-3">
            <h3 className="text-sm font-semibold text-blue-800">
              {showingSearchResults 
                ? `Search Results ${filteredDestinations.length > 0 ? `(${filteredDestinations.length})` : ''}`
                : context === "hotels"
                ? "Popular Hotel Destinations"
                : "Popular Flight Destinations"}
            </h3>
            <p className="text-xs text-blue-600">
              {showingSearchResults 
                ? `Results for "${searchQuery}"`
                : context === "hotels"
                ? "Top destinations for hotel bookings"
                : "Popular airports and cities worldwide"}
            </p>
          </div>
          
          {destinationsToShow.length === 0 && showingSearchResults ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-4">
                We couldn't find any destinations matching "{searchQuery}"
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilteredDestinations([]);
                  inputRef.current?.focus();
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search and browse popular destinations
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {destinationsToShow.map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => {
                    onSelectCity(dest.name);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-4 hover:bg-blue-50 rounded-lg border border-gray-100 touch-manipulation transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      {context === "hotels" ? (
                        <Building className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Plane className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-gray-900">
                          {context === "hotels" ? (
                            dest.name
                          ) : (
                            <>
                              <span className="font-semibold">{dest.code}</span> • {dest.name}
                            </>
                          )}
                        </span>
                        {dest.popular && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dest.description || dest.airport}
                      </div>
                      <div className="text-xs text-gray-400">{dest.country}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Regular Cities from props (backward compatibility) */}
        {Object.keys(cities).length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 px-4 py-2">
              Additional Destinations
            </h3>
            <div className="space-y-2">
              {Object.entries(cities)
                .filter(([city]) => {
                  if (!showingSearchResults) return true;
                  const searchTerm = searchQuery.toLowerCase();
                  return (
                    city.toLowerCase().includes(searchTerm) ||
                    cities[city].code.toLowerCase().includes(searchTerm) ||
                    cities[city].name.toLowerCase().includes(searchTerm)
                  );
                })
                .map(([city, data]) => (
                <button
                  key={city}
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className={cn(
                    "w-full text-left px-4 py-4 hover:bg-gray-50 rounded-lg border touch-manipulation",
                    selectedCity === city
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100",
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      <Plane className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-medium text-gray-900">
                        <span className="font-semibold">{data.code}</span> • {city}
                      </div>
                      <div className="text-sm text-gray-500">{data.airport}</div>
                      <div className="text-xs text-gray-400">{data.fullName}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MobileDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  tripType: string;
  setTripType: (type: string) => void;
  selectedDepartureDate: Date | null;
  selectedReturnDate: Date | null;
  setSelectedDepartureDate: (date: Date | null) => void;
  setSelectedReturnDate: (date: Date | null) => void;
  selectingDeparture: boolean;
  setSelectingDeparture: (selecting: boolean) => void;
  bookingType?: "flights" | "hotels"; // Add booking type context
}

export function MobileDatePicker({
  isOpen,
  onClose,
  tripType,
  setTripType,
  selectedDepartureDate,
  selectedReturnDate,
  setSelectedDepartureDate: setParentDepartureDate,
  setSelectedReturnDate: setParentReturnDate,
  selectingDeparture,
  setSelectingDeparture,
  bookingType = "flights", // Default to flights for backward compatibility
}: MobileDatePickerProps) {
  if (!isOpen) return null;

  // Helper functions
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  };

  const handleCalendarChange = (range: { startDate: Date; endDate: Date }) => {
    console.log("Mobile calendar range selected:", range);
    console.log("Current tripType:", tripType);
    console.log("Current bookingType:", bookingType);

    // Update parent component state immediately
    setParentDepartureDate(range.startDate);

    if (bookingType === "hotels") {
      // For hotels, always set both check-in and check-out dates
      setParentReturnDate(range.endDate);
      console.log("Hotel booking: Set check-out date:", range.endDate);
    } else if (tripType === "round-trip") {
      // For flights round-trip
      setParentReturnDate(range.endDate);
      console.log("Flight round-trip: Set return date:", range.endDate);
    } else {
      // For flights one-way, clear the return date
      setParentReturnDate(null);
      console.log("Flight one-way: cleared return date");
    }
  };

  const handleDoneClick = () => {
    console.log("=== MOBILE DATE PICKER DONE CLICKED ===");
    console.log("selectedDepartureDate:", selectedDepartureDate);
    console.log("selectedReturnDate:", selectedReturnDate);
    console.log("tripType:", tripType);
    console.log("bookingType:", bookingType);

    // Make sure parent component state is updated
    if (selectedDepartureDate) {
      setParentDepartureDate(selectedDepartureDate);
    }

    if (bookingType === "hotels") {
      // For hotels, always require check-out date
      if (selectedReturnDate) {
        setParentReturnDate(selectedReturnDate);
      }
    } else if (tripType === "round-trip") {
      // For flights round-trip
      if (selectedReturnDate) {
        setParentReturnDate(selectedReturnDate);
      }
    } else {
      // For flights one-way, clear return date
      setParentReturnDate(null);
    }

    onClose();
  };

  return (
    <div className="sm:hidden fixed inset-0 bg-white z-[60] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {bookingType === "hotels" ? "Select dates" : "Select travel dates"}
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 touch-manipulation"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4">
        {/* Trip Type Selector - Only for flights */}
        {bookingType === "flights" && (
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3">Trip type</div>
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTripType("round-trip")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation",
                  tripType === "round-trip"
                    ? "bg-[#003580] text-white"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                Round trip
              </button>
              <button
                onClick={() => setTripType("one-way")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation",
                  tripType === "one-way"
                    ? "bg-[#003580] text-white"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                One way
              </button>
            </div>
          </div>
        )}

        {/* Date Display */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                {bookingType === "hotels" ? "Check-in" : "Departure"}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {selectedDepartureDate
                  ? formatDate(selectedDepartureDate)
                  : "Select date"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                {bookingType === "hotels"
                  ? "Check-out"
                  : tripType === "round-trip"
                  ? "Return"
                  : "N/A"}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {bookingType === "hotels" || tripType === "round-trip"
                  ? selectedReturnDate
                    ? formatDate(selectedReturnDate)
                    : "Select date"
                  : "One way"}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-6">
          <BookingCalendar
            initialRange={{
              startDate: selectedDepartureDate || new Date(),
              endDate:
                selectedReturnDate ||
                addDays(selectedDepartureDate || new Date(), 3),
            }}
            onChange={handleCalendarChange}
            onClose={() => {}} // Don't close on calendar interaction
            className="w-full"
            enableRangeMode={bookingType === "hotels" || tripType === "round-trip"}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-3 touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDoneClick}
            className="flex-1 bg-[#003580] hover:bg-[#002a66] text-white py-3 touch-manipulation"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MobileTravelersProps {
  isOpen: boolean;
  onClose: () => void;
  travelers: {
    adults: number;
    children: number;
    childAges?: number[];
  };
  setTravelers: (travelers: {
    adults: number;
    children: number;
    childAges?: number[];
  }) => void;
}

export function MobileTravelers({
  isOpen,
  onClose,
  travelers,
  setTravelers,
}: MobileTravelersProps) {
  if (!isOpen) return null;

  const updateTravelerCount = (
    type: "adults" | "children",
    operation: "increment" | "decrement",
  ) => {
    const newValue =
      operation === "increment" ? travelers[type] + 1 : travelers[type] - 1;

    // Validation rules
    if (type === "adults" && newValue < 1) return;
    if (type === "children" && newValue < 0) return;
    if (newValue > 9) return; // Max 9 travelers

    if (type === "children") {
      // Handle children ages array
      const childAges = travelers.childAges || [];
      let newChildAges = [...childAges];

      if (newValue > travelers.children) {
        // Add new child age (default to 10)
        newChildAges.push(10);
      } else if (newValue < travelers.children) {
        // Remove last child age
        newChildAges.pop();
      }

      setTravelers({
        ...travelers,
        [type]: newValue,
        childAges: newChildAges,
      });
    } else {
      setTravelers({
        ...travelers,
        [type]: newValue,
      });
    }
  };

  const updateChildAge = (index: number, age: number) => {
    const childAges = travelers.childAges || [];
    const newChildAges = [...childAges];
    newChildAges[index] = age;

    setTravelers({
      ...travelers,
      childAges: newChildAges,
    });
  };

  return (
    <div className="sm:hidden fixed inset-0 bg-white z-[60] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Travelers</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 touch-manipulation"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4">
        {/* Adults */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div>
            <div className="font-medium text-gray-900">Adults</div>
            <div className="text-sm text-gray-500">Age 18+</div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateTravelerCount("adults", "decrement")}
              disabled={travelers.adults <= 1}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">-</span>
            </button>
            <span className="w-8 text-center font-medium text-lg">
              {travelers.adults}
            </span>
            <button
              onClick={() => updateTravelerCount("adults", "increment")}
              disabled={travelers.adults >= 9}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">+</span>
            </button>
          </div>
        </div>

        {/* Children */}
        <div className="flex items-center justify-between py-4">
          <div>
            <div className="font-medium text-gray-900">Children</div>
            <div className="text-sm text-gray-500">Age 0-17</div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateTravelerCount("children", "decrement")}
              disabled={travelers.children <= 0}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">-</span>
            </button>
            <span className="w-8 text-center font-medium text-lg">
              {travelers.children}
            </span>
            <button
              onClick={() => updateTravelerCount("children", "increment")}
              disabled={travelers.children >= 9}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">+</span>
            </button>
          </div>
        </div>

        {/* Children Ages */}
        {travelers.children > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Ages of children
            </div>
            <div className="space-y-3">
              {Array.from({ length: travelers.children }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Child {index + 1}
                  </span>
                  <select
                    value={travelers.childAges?.[index] || 10}
                    onChange={(e) =>
                      updateChildAge(index, parseInt(e.target.value))
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: 18 }, (_, i) => (
                      <option key={i} value={i}>
                        {i} years old
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done Button */}
        <div className="mt-8">
          <Button
            onClick={onClose}
            className="w-full bg-[#003580] hover:bg-[#002a66] text-white py-3 touch-manipulation"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MobileClassDropdown({
  isOpen,
  onClose,
  selectedClass,
  onSelectClass,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  onSelectClass: (classType: string) => void;
}) {
  if (!isOpen) return null;

  const classes = [
    { id: "Economy", name: "Economy", description: "Standard seating" },
    {
      id: "Premium Economy",
      name: "Premium Economy",
      description: "Extra legroom",
    },
    { id: "Business", name: "Business", description: "Premium service" },
    { id: "First", name: "First", description: "Luxury experience" },
  ];

  return (
    <div className="sm:hidden fixed inset-0 bg-white z-[60] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Travel Class</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 touch-manipulation"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          {classes.map((classItem) => (
            <button
              key={classItem.id}
              onClick={() => {
                onSelectClass(classItem.id);
                onClose();
              }}
              className={cn(
                "w-full text-left px-4 py-4 rounded-lg border touch-manipulation transition-colors",
                selectedClass === classItem.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50",
              )}
            >
              <div className="font-medium text-gray-900">{classItem.name}</div>
              <div className="text-sm text-gray-500">{classItem.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
