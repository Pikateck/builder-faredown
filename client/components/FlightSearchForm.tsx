import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookingCalendar } from "@/components/BookingCalendar";
import { format, addDays } from "date-fns";
import {
  Plane,
  CalendarIcon,
  Users,
  Search,
  Plus,
  Minus,
  MapPin,
} from "lucide-react";

interface PassengerConfig {
  adults: number;
  children: number;
  rooms: number;
}

export function FlightSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  // Trip configuration - exactly like Booking.com
  const [tripType, setTripType] = useState("round-trip");
  const [cabinClass, setCabinClass] = useState("economy");

  // Airports
  const [departureCity, setDepartureCity] = useState("");
  const [arrivalCity, setArrivalCity] = useState("");
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false);

  // Dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 8);

  const [departureDate, setDepartureDate] = useState<Date | undefined>(tomorrow);
  const [returnDate, setReturnDate] = useState<Date | undefined>(dayAfter);
  const [isDepartureDateOpen, setIsDepartureDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  // Passengers - exactly like Booking.com
  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 1,
    children: 0,
    rooms: 1,
  });
  const [isPassengerPopoverOpen, setIsPassengerPopoverOpen] = useState(false);

  // Airport suggestions - matching Booking.com's popular destinations
  const airportSuggestions = [
    { code: "BOM", city: "Mumbai", country: "India", airport: "Chhatrapati Shivaji Intl" },
    { code: "DEL", city: "New Delhi", country: "India", airport: "Indira Gandhi Intl" },
    { code: "DXB", city: "Dubai", country: "United Arab Emirates", airport: "Dubai Intl" },
    { code: "LHR", city: "London", country: "United Kingdom", airport: "Heathrow" },
    { code: "JFK", city: "New York", country: "United States", airport: "John F Kennedy Intl" },
    { code: "CDG", city: "Paris", country: "France", airport: "Charles de Gaulle" },
    { code: "FRA", city: "Frankfurt", country: "Germany", airport: "Frankfurt am Main" },
    { code: "AMS", city: "Amsterdam", country: "Netherlands", airport: "Schiphol" },
    { code: "SIN", city: "Singapore", country: "Singapore", airport: "Changi" },
    { code: "BKK", city: "Bangkok", country: "Thailand", airport: "Suvarnabhumi" },
    { code: "NRT", city: "Tokyo", country: "Japan", airport: "Narita Intl" },
    { code: "SYD", city: "Sydney", country: "Australia", airport: "Kingsford Smith" },
  ];

  const filterAirports = (query: string) => {
    if (!query || query.length < 2) return airportSuggestions.slice(0, 8);
    return airportSuggestions.filter(airport =>
      airport.city.toLowerCase().includes(query.toLowerCase()) ||
      airport.code.toLowerCase().includes(query.toLowerCase()) ||
      airport.country.toLowerCase().includes(query.toLowerCase()) ||
      airport.airport.toLowerCase().includes(query.toLowerCase())
    );
  };

  const updatePassengerCount = (
    type: keyof PassengerConfig,
    operation: "increment" | "decrement"
  ) => {
    setPassengers((prev) => {
      const newValue = operation === "increment" ? prev[type] + 1 : prev[type] - 1;
      
      if (type === "adults" && newValue < 1) return prev;
      if (type === "children" && newValue < 0) return prev;
      if (type === "rooms" && newValue < 1) return prev;
      if (newValue > 30) return prev;

      return { ...prev, [type]: newValue };
    });
  };

  const handleSearch = () => {
    if (!departureCity || !arrivalCity) {
      alert("Please select departure and arrival cities");
      return;
    }

    if (!departureDate) {
      alert("Please select departure date");
      return;
    }

    if (tripType === "round-trip" && !returnDate) {
      alert("Please select return date");
      return;
    }

    const searchParams = new URLSearchParams({
      from: departureCity,
      to: arrivalCity,
      departureDate: departureDate.toISOString(),
      adults: passengers.adults.toString(),
      children: passengers.children.toString(),
      rooms: passengers.rooms.toString(),
      tripType,
      cabinClass,
    });

    if (tripType === "round-trip" && returnDate) {
      searchParams.set("returnDate", returnDate.toISOString());
    }

    navigate(`/flights/results?${searchParams.toString()}`);
  };

  const getPassengerSummary = () => {
    const total = passengers.adults + passengers.children;
    const roomText = passengers.rooms === 1 ? "room" : "rooms";
    return `${total} traveler${total !== 1 ? "s" : ""}, ${passengers.rooms} ${roomText}`;
  };

  const formatDateRange = () => {
    if (!departureDate) return "Travel dates";
    
    if (tripType === "round-trip" && returnDate) {
      return `${format(departureDate, "E MMM d")} - ${format(returnDate, "E MMM d")}`;
    }
    
    return format(departureDate, "E MMM d");
  };

  return (
    <div className="w-full max-w-7xl mx-auto booking-flight-search">
      {/* Booking.com Style Flight Search */}
      <div className="booking-search-section">
        {/* Top Row: Trip Type and Class */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
          {/* Trip Type Buttons */}
          <div className="flex items-center space-x-1 mr-6">
            <button
              onClick={() => setTripType("round-trip")}
              className={`booking-trip-button ${tripType === "round-trip" ? "active" : ""}`}
            >
              Round-trip
            </button>
            <button
              onClick={() => setTripType("one-way")}
              className={`booking-trip-button ${tripType === "one-way" ? "active" : ""}`}
            >
              One-way
            </button>
            <button
              onClick={() => setTripType("multi-city")}
              className={`booking-trip-button ${tripType === "multi-city" ? "active" : ""}`}
            >
              Multi-city
            </button>
          </div>

          {/* Cabin Class */}
          <Select value={cabinClass} onValueChange={setCabinClass}>
            <SelectTrigger className="w-32 h-8 text-sm border-gray-300 rounded-sm bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="premium-economy">Premium Economy</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="first">First Class</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Search Row */}
        <div className="flex items-stretch">
          {/* Leaving From */}
          <div className="flex-1 relative">
            <div className="booking-search-field">
              <label className="booking-field-label">
                Leaving from
              </label>
              <div className="relative">
                <Plane className="booking-field-icon" />
                <input
                  type="text"
                  value={departureCity}
                  onChange={(e) => setDepartureCity(e.target.value)}
                  onFocus={() => setShowDepartureDropdown(true)}
                  className="booking-field-input"
                  placeholder="Airport or city"
                />
              </div>
            </div>
            
            {/* Departure Dropdown */}
            {showDepartureDropdown && (
              <>
                <div
                  className="booking-dropdown-overlay"
                  onClick={() => setShowDepartureDropdown(false)}
                />
                <div className="booking-dropdown">
                  {filterAirports(departureCity).map((airport) => (
                    <button
                      key={airport.code}
                      onClick={() => {
                        setDepartureCity(`${airport.city} (${airport.code})`);
                        setShowDepartureDropdown(false);
                      }}
                      className="booking-dropdown-item"
                    >
                      <div className="booking-airport-suggestion">
                        <Plane className="w-4 h-4 text-gray-400" />
                        <div className="booking-airport-info">
                          <div className="booking-airport-name">
                            {airport.city} ({airport.code})
                          </div>
                          <div className="booking-airport-details">
                            {airport.airport}, {airport.country}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Going To */}
          <div className="flex-1 relative border-r border-gray-300">
            <div className="p-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Going to
              </label>
              <div className="relative">
                <MapPin className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={arrivalCity}
                  onChange={(e) => setArrivalCity(e.target.value)}
                  onFocus={() => setShowArrivalDropdown(true)}
                  className="w-full pl-6 text-sm font-medium text-gray-900 bg-transparent border-none outline-none"
                  placeholder="Airport or city"
                />
              </div>
            </div>
            
            {/* Arrival Dropdown */}
            {showArrivalDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowArrivalDropdown(false)}
                />
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 shadow-lg z-50 max-h-64 overflow-y-auto">
                  {filterAirports(arrivalCity).map((airport) => (
                    <button
                      key={airport.code}
                      onClick={() => {
                        setArrivalCity(`${airport.city} (${airport.code})`);
                        setShowArrivalDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 flex items-center space-x-3"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {airport.city} ({airport.code})
                        </div>
                        <div className="text-xs text-gray-500">
                          {airport.airport}, {airport.country}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Travel Dates */}
          <div className="flex-1 relative border-r border-gray-300">
            <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
              <PopoverTrigger asChild>
                <div className="p-4 cursor-pointer hover:bg-gray-50 h-full">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Travel dates
                  </label>
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateRange()}
                    </span>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <BookingCalendar
                  initialRange={{
                    startDate: departureDate || new Date(),
                    endDate: returnDate || addDays(departureDate || new Date(), 7),
                  }}
                  onChange={(range) => {
                    setDepartureDate(range.startDate);
                    if (tripType === "round-trip") {
                      setReturnDate(range.endDate);
                    }
                    setIsDepartureDateOpen(false);
                  }}
                  onClose={() => setIsDepartureDateOpen(false)}
                  showRange={tripType === "round-trip"}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Travelers */}
          <div className="flex-1 relative border-r border-gray-300">
            <Popover open={isPassengerPopoverOpen} onOpenChange={setIsPassengerPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="p-4 cursor-pointer hover:bg-gray-50 h-full">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Travelers
                  </label>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {getPassengerSummary()}
                    </span>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Travelers</h3>
                  
                  {/* Adults */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Adults</div>
                      <div className="text-xs text-gray-500">Ages 18+</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updatePassengerCount("adults", "decrement")}
                        disabled={passengers.adults <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {passengers.adults}
                      </span>
                      <button
                        onClick={() => updatePassengerCount("adults", "increment")}
                        disabled={passengers.adults >= 30}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Children</div>
                      <div className="text-xs text-gray-500">Ages 0-17</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updatePassengerCount("children", "decrement")}
                        disabled={passengers.children <= 0}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {passengers.children}
                      </span>
                      <button
                        onClick={() => updatePassengerCount("children", "increment")}
                        disabled={passengers.children >= 30}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rooms */}
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Rooms</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updatePassengerCount("rooms", "decrement")}
                        disabled={passengers.rooms <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {passengers.rooms}
                      </span>
                      <button
                        onClick={() => updatePassengerCount("rooms", "increment")}
                        disabled={passengers.rooms >= 30}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      onClick={() => setIsPassengerPopoverOpen(false)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button */}
          <div className="flex items-center px-4">
            <Button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-sm font-medium text-sm transition-colors"
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
