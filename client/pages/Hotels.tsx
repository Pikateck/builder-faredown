import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDateContext } from "@/contexts/DateContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookingCalendar } from "@/components/BookingCalendar";
import { addDays } from "date-fns";
import {
  Plane,
  ChevronDown,
  ArrowRightLeft,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Settings,
  User,
  Hotel,
  Heart,
  TrendingUp,
  DollarSign,
  Shield,
  Headphones,
  ArrowRight,
} from "lucide-react";
import AdminTestButton from "@/components/AdminTestButton";

export default function Hotels() {
  const navigate = useNavigate();
  const { 
    departureDate,
    returnDate,
    tripType,
    setTripType,
    formatDisplayDate,
  } = useDateContext();

  // State for hotel search functionality
  const [activeTab, setActiveTab] = useState("hotels");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState({
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
  });
  const [showFromCities, setShowFromCities] = useState(false);
  const [showToCities, setShowToCities] = useState(false);
  const [selectedFromCity, setSelectedFromCity] = useState("Mumbai");
  const [selectedToCity, setSelectedToCity] = useState("Dubai");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState("Economy");
  const [showTravelers, setShowTravelers] = useState(false);
  const [travelers, setTravelers] = useState({ adults: 1, children: 0 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // City data for hotels
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* MOBILE-FIRST DESIGN: App-style layout for mobile, standard for desktop */}

      {/* Mobile Layout (≤768px) */}
      <div className="block md:hidden">
        {/* Mobile Features Section */}
        <div className="bg-gray-50 py-8">
          <div className="px-4">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-900">
              Why Faredown?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Live Bargaining</h3>
                <p className="text-xs text-gray-600">
                  Negotiate real-time prices
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Best Prices</h3>
                <p className="text-xs text-gray-600">
                  Pay what you feel is fair
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Secure Booking</h3>
                <p className="text-xs text-gray-600">Instant confirmations</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">24/7 Support</h3>
                <p className="text-xs text-gray-600">Always here to help</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Quick Links */}
        <div className="bg-white py-6">
          <div className="px-4">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link
                to="/hotels"
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <Hotel className="w-5 h-5 text-[#003580]" />
                <span className="font-medium">Hotels</span>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
              <Link
                to="/account"
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <User className="w-5 h-5 text-[#003580]" />
                <span className="font-medium">My Account</span>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="bg-white border-t border-gray-200">
          <div className="grid grid-cols-4 h-16">
            <Link
              to="/"
              className="flex flex-col items-center justify-center space-y-1"
            >
              <Plane className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Flights</span>
            </Link>
            <button className="flex flex-col items-center justify-center space-y-1">
              <Hotel className="w-5 h-5 text-[#003580]" />
              <span className="text-xs text-[#003580] font-medium">Hotels</span>
            </button>
            <button className="flex flex-col items-center justify-center space-y-1">
              <Heart className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Saved</span>
            </button>
            <button className="flex flex-col items-center justify-center space-y-1">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT (≥769px) - Enhanced Original Design */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <header className="text-white" style={{ backgroundColor: "#003580" }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight">
                  faredown.com
                </span>
              </Link>

              {/* Centered Navigation */}
              <nav className="flex items-center space-x-6 lg:space-x-8 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
                <Link
                  to="/"
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4"
                >
                  <span>Flights</span>
                </Link>
                <button
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4 border-b-2 border-white"
                >
                  <span>Hotels</span>
                </button>
              </nav>

              <div className="flex items-center space-x-2 md:space-x-6">
                {/* Language and Currency */}
                <div className="flex items-center space-x-4 text-sm">
                  <button className="text-white hover:text-blue-200 cursor-pointer flex items-center space-x-1">
                    <span>English (UK)</span>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowCurrencyDropdown(!showCurrencyDropdown)
                      }
                      className="text-white hover:text-blue-200 cursor-pointer flex items-center space-x-1"
                    >
                      <span>
                        {selectedCurrency.symbol} {selectedCurrency.code}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showCurrencyDropdown && (
                      <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 w-48 max-h-60 overflow-y-auto">
                        {[
                          { code: "INR", symbol: "₹", name: "Indian Rupee" },
                          { code: "AED", symbol: "د.إ", name: "United Arab Emirates Dirham" },
                          { code: "USD", symbol: "$", name: "US Dollar" },
                          { code: "GBP", symbol: "£", name: "Great Britain Pound" },
                          { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
                          { code: "EUR", symbol: "€", name: "Euro" },
                        ].map((currency) => (
                          <button
                            key={currency.code}
                            onClick={() => {
                              setSelectedCurrency(currency);
                              setShowCurrencyDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-900 flex items-center justify-between"
                          >
                            <span>{currency.name}</span>
                            <span className="font-medium">
                              {currency.symbol} {currency.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Admin Test Button */}
                  <AdminTestButton variant="desktop" />

                  {!isLoggedIn && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600 transition-colors px-6 py-2 h-9 font-medium"
                      >
                        Register
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-2 h-9 font-medium rounded-md"
                      >
                        Sign in
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Desktop Main Content */}
        <div
          className="py-3 sm:py-6 md:py-8 pb-24 sm:pb-8"
          style={{ backgroundColor: "#003580" }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-2 sm:mb-3">
              <div className="mb-3 sm:mb-5">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  Find your perfect stay
                </h2>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-3 sm:mb-4 leading-tight px-2 opacity-95">
                Search hotels with live AI bargaining.
              </h1>
            </div>

            {/* Desktop Hotel Search Form */}
            <div className="bg-white border-b border-gray-200 overflow-visible rounded-t-lg">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 overflow-visible">
                {/* Hotel Search inputs */}
                <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3 w-full max-w-6xl overflow-visible">
                  {/* Destination */}
                  <div className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                      Destination
                    </label>
                    <button
                      onClick={() => setShowFromCities(!showFromCities)}
                      className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-12 w-full hover:border-blue-600 touch-manipulation"
                    >
                      <Hotel className="w-4 h-4 text-gray-500 mr-2" />
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                          {cityData[selectedFromCity]?.code || "BOM"}
                        </div>
                        <span className="text-sm text-gray-700 font-medium truncate">
                          {cityData[selectedFromCity]?.airport ||
                            "Mumbai, Maharashtra, India"}
                        </span>
                      </div>
                    </button>

                    {showFromCities && (
                      <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            City or destination
                          </h3>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Mumbai"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          {Object.entries(cityData).map(([city, data]) => (
                            <button
                              key={city}
                              onClick={() => {
                                setSelectedFromCity(city);
                                setShowFromCities(false);
                              }}
                              className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-600">
                                    🏨
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {city}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {data.fullName}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Check-in / Check-out Dates */}
                  <div className="relative flex-1 lg:min-w-[320px] lg:max-w-[380px] w-full">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                      Check-in / Check-out
                    </label>
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500 touch-manipulation">
                          <CalendarIcon className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-sm text-gray-700 font-medium truncate">
                              {departureDate
                                ? `${formatDisplayDate(departureDate)} - ${
                                    returnDate
                                      ? formatDisplayDate(returnDate)
                                      : "Check-out"
                                  }`
                                : "Select dates"}
                            </span>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <BookingCalendar
                          initialRange={{
                            startDate: departureDate || new Date(),
                            endDate:
                              returnDate || addDays(departureDate || new Date(), 7),
                          }}
                          onChange={(range) => {
                            console.log(
                              "Hotel calendar range selected:",
                              range,
                            );
                          }}
                          onClose={() => setShowCalendar(false)}
                          className="w-full"
                          bookingType="hotel"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Guests */}
                  <div className="relative flex-1 lg:min-w-[240px] lg:max-w-[280px] w-full">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                      Guests
                    </label>
                    <button
                      onClick={() => setShowTravelers(!showTravelers)}
                      className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500 touch-manipulation"
                    >
                      <Users className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {travelers.adults} adult
                        {travelers.adults > 1 ? "s" : ""}
                        {travelers.children > 0
                          ? `, ${travelers.children} child${travelers.children > 1 ? "ren" : ""}`
                          : ""}
                      </span>
                    </button>

                    {showTravelers && (
                      <div className="absolute top-14 right-0 bg-white border border-gray-300 rounded-md shadow-xl p-4 z-50 w-72">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <div className="font-medium text-gray-900">Adults</div>
                              <div className="text-sm text-gray-500">Age 18+</div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() =>
                                  setTravelers((prev) => ({
                                    ...prev,
                                    adults: Math.max(1, prev.adults - 1),
                                  }))
                                }
                                disabled={travelers.adults <= 1}
                                className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 font-bold"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-medium text-gray-900">
                                {travelers.adults}
                              </span>
                              <button
                                onClick={() =>
                                  setTravelers((prev) => ({
                                    ...prev,
                                    adults: prev.adults + 1,
                                  }))
                                }
                                className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 text-blue-600 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div>
                              <div className="font-medium text-gray-900">
                                Children
                              </div>
                              <div className="text-sm text-gray-500">Age 0-17</div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() =>
                                  setTravelers((prev) => ({
                                    ...prev,
                                    children: Math.max(0, prev.children - 1),
                                  }))
                                }
                                disabled={travelers.children <= 0}
                                className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 font-bold"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-medium text-gray-900">
                                {travelers.children}
                              </span>
                              <button
                                onClick={() =>
                                  setTravelers((prev) => ({
                                    ...prev,
                                    children: prev.children + 1,
                                  }))
                                }
                                className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 text-blue-600 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="pt-2">
                            <Button
                              onClick={() => setShowTravelers(false)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-auto lg:min-w-[120px]">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded h-12 font-medium text-sm w-full touch-manipulation"
                      onClick={() => navigate("/hotels/results")}
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
