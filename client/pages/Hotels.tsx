import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDateContext } from "@/contexts/DateContext";
import { useCurrency } from "@/contexts/CurrencyContext";
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
import { SimpleCalendar } from "@/components/SimpleCalendar";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
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
  Search,
  X,
} from "lucide-react";
import AdminTestButton from "@/components/AdminTestButton";

export default function Hotels() {
  const navigate = useNavigate();
  const {
    departureDate,
    returnDate,
    setDepartureDate,
    setReturnDate,
    tripType,
    setTripType,
    formatDisplayDate,
  } = useDateContext();

  const { selectedCurrency, currencies, setCurrency } = useCurrency();

  // State for hotel search functionality
  const [activeTab, setActiveTab] = useState("hotels");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showFromCities, setShowFromCities] = useState(false);
  const [showToCities, setShowToCities] = useState(false);
  const [selectedFromCity, setSelectedFromCity] = useState("Mumbai");
  const [selectedToCity, setSelectedToCity] = useState("Dubai");
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);
  const [showDesktopCalendar, setShowDesktopCalendar] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState("Economy");
  const [showTravelers, setShowTravelers] = useState(false);
  const [travelers, setTravelers] = useState({
    adults: 1,
    children: 0,
    childAges: [] as number[],
  });
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userName] = useState("Zubin Aibara");

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
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* MOBILE-FIRST DESIGN: App-style layout for mobile, standard for desktop */}

      {/* Mobile Layout (≤768px) - Match Index.tsx exactly */}
      <div className="md:hidden">
        {/* Mobile Top Header */}
        <div
          className="text-white py-3 px-4"
          style={{ backgroundColor: "#003580" }}
        >
          <div className="flex items-center justify-between">
            <Link to="/" className="text-lg font-bold tracking-tight">
              faredown.com
            </Link>
            <div className="flex items-center space-x-3">
              {/* Hamburger Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger className="p-2 hover:bg-white/10 rounded">
                  <div className="w-5 h-5 flex flex-col justify-between">
                    <div className="w-full h-0.5 bg-white"></div>
                    <div className="w-full h-0.5 bg-white"></div>
                    <div className="w-full h-0.5 bg-white"></div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Link to="/" className="flex items-center">
                      <Plane className="w-4 h-4 mr-2" />
                      Flights
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/hotels" className="flex items-center">
                      <Hotel className="w-4 h-4 mr-2" />
                      Hotels
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/account" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      My Account
                    </Link>
                  </DropdownMenuItem>

                  {/* Currency Selection Tab */}
                  <div className="border-t border-gray-200 my-1"></div>
                  <div className="px-2 py-2">
                    <div className="text-xs font-semibold text-gray-700 px-2 py-1 mb-2 flex items-center">
                      <DollarSign className="w-3 h-3 mr-2" />
                      Currency
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {currencies.map((currency) => (
                        <button
                          key={currency.code}
                          onClick={() => {
                            setCurrency(currency);
                          }}
                          className={`w-full text-left px-2 py-2 hover:bg-gray-100 rounded text-sm flex items-center justify-between transition-colors ${
                            selectedCurrency.code === currency.code
                              ? "bg-blue-50 text-blue-600 border border-blue-200"
                              : "text-gray-900"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{currency.flag}</span>
                            <span className="font-medium">{currency.name}</span>
                          </div>
                          <span className="font-semibold text-xs">
                            {currency.symbol} {currency.code}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-1"></div>

                  <DropdownMenuItem>
                    <Link to="/saved" className="flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Saved
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/help" className="flex items-center">
                      <Headphones className="w-4 h-4 mr-2" />
                      Help & Support
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      to="/account?tab=settings"
                      className="flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Zubin Aibara
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <button className="flex items-center text-red-600">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Search Section */}
        <div className="pb-8 pt-4" style={{ backgroundColor: "#003580" }}>
          <div className="px-4">
            {/* Upgrade Message */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="bg-[#febb02] p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-[#003580]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Upgrade. Bargain. Book.
                  </h3>
                  <p className="text-xs text-gray-600">
                    Control your price for flights & hotels — with live AI
                    bargaining.
                  </p>
                </div>
              </div>
            </div>

            {/* Hotel Search Form */}
            <div className="space-y-4">
              {/* Destination */}
              <div className="bg-white rounded-xl p-4 shadow-sm relative">
                <button
                  onClick={() => setShowFromCities(!showFromCities)}
                  className="w-full text-left"
                >
                  <div className="text-xs text-gray-500 mb-1">Destination</div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-[#003580]" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedFromCity}
                      </div>
                      <div className="text-xs text-gray-500">
                        {cityData[selectedFromCity]?.fullName || "City"}
                      </div>
                    </div>
                  </div>
                </button>

                {showFromCities && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFromCities(false)}
                    />
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 mt-1 max-h-60 overflow-y-auto">
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
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Hotel className="w-4 h-4 text-blue-600" />
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
                  </>
                )}
              </div>

              {/* Check-in / Check-out */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <button
                  onClick={() => setShowMobileCalendar(!showMobileCalendar)}
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

                {showMobileCalendar && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-auto">
                      <SimpleCalendar
                        onDateSelect={(checkIn, checkOut) => {
                          console.log("Mobile hotel dates selected:", {
                            checkIn,
                            checkOut,
                          });
                          setDepartureDate(checkIn);
                          setReturnDate(checkOut);
                          setShowMobileCalendar(false); // Close calendar after selection
                        }}
                        onClose={() => setShowMobileCalendar(false)}
                        initialCheckIn={departureDate || undefined}
                        initialCheckOut={returnDate || undefined}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Guests */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <button
                  onClick={() => setShowTravelers(!showTravelers)}
                  className="w-full text-left"
                >
                  <div className="text-xs text-gray-500 mb-1">Guests</div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-[#003580]" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {travelers.adults + travelers.children}
                      </div>
                      <div className="text-xs text-gray-500">
                        {travelers.adults} adult
                        {travelers.adults > 1 ? "s" : ""}
                        {travelers.children > 0 &&
                          `, ${travelers.children} child${travelers.children > 1 ? "ren" : ""}`}
                      </div>
                    </div>
                  </div>
                </button>

                {showTravelers && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-lg w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-auto p-4 sm:p-6">
                      <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base sm:text-lg font-semibold">
                            Select guests
                          </h3>
                          <button
                            onClick={() => setShowTravelers(false)}
                            className="p-2 hover:bg-gray-100 rounded-full touch-manipulation"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between py-2 sm:py-3">
                            <div>
                              <div className="font-medium text-gray-900 text-sm sm:text-base">
                                Adults
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                Age 18+
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <button
                                onClick={() =>
                                  setTravelers((prev) => ({
                                    ...prev,
                                    adults: Math.max(1, prev.adults - 1),
                                  }))
                                }
                                disabled={travelers.adults <= 1}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#003580] flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-[#003580] font-bold touch-manipulation text-sm sm:text-base"
                              >
                                −
                              </button>
                              <span className="w-8 sm:w-10 text-center font-medium text-gray-900 text-sm sm:text-base">
                                {travelers.adults}
                              </span>
                              <button
                                onClick={() =>
                                  setTravelers((prev) => ({
                                    ...prev,
                                    adults: prev.adults + 1,
                                  }))
                                }
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#003580] flex items-center justify-center hover:bg-blue-50 text-[#003580] font-bold touch-manipulation text-sm sm:text-base"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between py-2 sm:py-3">
                            <div>
                              <div className="font-medium text-gray-900 text-sm sm:text-base">
                                Children
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                Age 0-17
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <button
                                onClick={() =>
                                  setTravelers((prev) => {
                                    const newChildren = Math.max(
                                      0,
                                      prev.children - 1,
                                    );
                                    const newChildAges = prev.childAges.slice(
                                      0,
                                      newChildren,
                                    );
                                    return {
                                      ...prev,
                                      children: newChildren,
                                      childAges: newChildAges,
                                    };
                                  })
                                }
                                disabled={travelers.children <= 0}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#003580] flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-[#003580] font-bold touch-manipulation text-sm sm:text-base"
                              >
                                −
                              </button>
                              <span className="w-8 sm:w-10 text-center font-medium text-gray-900 text-sm sm:text-base">
                                {travelers.children}
                              </span>
                              <button
                                onClick={() =>
                                  setTravelers((prev) => ({
                                    ...prev,
                                    children: prev.children + 1,
                                    childAges: [...prev.childAges, 5],
                                  }))
                                }
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#003580] flex items-center justify-center hover:bg-blue-50 text-[#003580] font-bold touch-manipulation text-sm sm:text-base"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Children Ages */}
                          {travelers.children > 0 && (
                            <div className="space-y-2 sm:space-y-3">
                              <div className="text-xs sm:text-sm font-medium text-gray-700">
                                Children's Ages
                              </div>
                              {Array.from({ length: travelers.children }).map(
                                (_, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between py-1"
                                  >
                                    <span className="text-xs sm:text-sm text-gray-600">
                                      Child {index + 1}
                                    </span>
                                    <select
                                      value={travelers.childAges[index] || 5}
                                      onChange={(e) =>
                                        setTravelers((prev) => {
                                          const newChildAges = [
                                            ...prev.childAges,
                                          ];
                                          newChildAges[index] = parseInt(
                                            e.target.value,
                                          );
                                          return {
                                            ...prev,
                                            childAges: newChildAges,
                                          };
                                        })
                                      }
                                      className="border border-gray-300 rounded px-2 sm:px-3 py-1 text-xs sm:text-sm min-w-[80px] touch-manipulation"
                                    >
                                      {Array.from({ length: 18 }, (_, i) => (
                                        <option key={i} value={i}>
                                          {i} {i === 1 ? "year" : "years"}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => setShowTravelers(false)}
                          className="w-full bg-[#003580] hover:bg-[#002347] text-white font-medium py-3 sm:py-4 text-sm sm:text-base touch-manipulation"
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <Button
                onClick={() => navigate("/hotels/results")}
                className="w-full bg-[#febb02] hover:bg-[#d19900] text-[#003580] font-bold py-4 text-lg rounded-xl shadow-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Hotels
              </Button>
            </div>

            {/* Sample Hotel Prices with Currency Conversion */}
            <div className="mt-8">
              <h2 className="text-white text-lg font-semibold mb-4 text-center">
                Sample Hotel Prices in {selectedCurrency.name}
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        Luxury Resort Dubai
                      </h3>
                      <p className="text-xs text-gray-500">5★ • Pool • Spa</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#003580]">
                        {selectedCurrency.symbol}
                        {(8500 * selectedCurrency.rate).toFixed(
                          selectedCurrency.decimalPlaces,
                        )}
                      </div>
                      <div className="text-xs text-gray-500">per night</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        Business Hotel Mumbai
                      </h3>
                      <p className="text-xs text-gray-500">
                        4★ • WiFi • Breakfast
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#003580]">
                        {selectedCurrency.symbol}
                        {(3200 * selectedCurrency.rate).toFixed(
                          selectedCurrency.decimalPlaces,
                        )}
                      </div>
                      <div className="text-xs text-gray-500">per night</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        Budget Inn Delhi
                      </h3>
                      <p className="text-xs text-gray-500">3★ • AC • Clean</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#003580]">
                        {selectedCurrency.symbol}
                        {(1800 * selectedCurrency.rate).toFixed(
                          selectedCurrency.decimalPlaces,
                        )}
                      </div>
                      <div className="text-xs text-gray-500">per night</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-blue-200 mt-3">
                ✨ Prices automatically convert to your selected currency
              </p>
            </div>

            {/* Why Faredown Section */}
            <div className="mt-8">
              <h2 className="text-white text-lg font-semibold mb-4 text-center">
                Why Faredown?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">
                    Live Bargaining
                  </h3>
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
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="block md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
          <div className="grid grid-cols-4 h-16">
            <Link
              to="/"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
              onClick={() =>
                console.log("Flights button clicked - navigating to /")
              }
            >
              <Plane className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Flights</span>
            </Link>
            <Link
              to="/hotels"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
              onClick={() =>
                console.log("Hotels button clicked - already on Hotels page")
              }
            >
              <Hotel className="w-5 h-5 text-[#003580]" />
              <span className="text-xs text-[#003580] font-medium">Hotels</span>
            </Link>
            <Link
              to="/saved"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
              onClick={() =>
                console.log("Saved button clicked - navigating to /saved")
              }
            >
              <Heart className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Saved</span>
            </Link>
            <Link
              to="/account"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
              onClick={() =>
                console.log("Account button clicked - navigating to /account")
              }
            >
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Account</span>
            </Link>
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
                <button className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4 border-b-2 border-white">
                  <span>Hotels</span>
                </button>
              </nav>

              <div className="flex items-center space-x-2 md:space-x-6">
                {/* Language and Currency */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-white hover:text-blue-200 cursor-pointer flex items-center space-x-1">
                          <span>🌐 English</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        {[
                          { code: "en", name: "English", flag: "🇬🇧" },
                          { code: "es", name: "Español", flag: "🇪🇸" },
                          { code: "fr", name: "Français", flag: "🇫🇷" },
                          { code: "de", name: "Deutsch", flag: "🇩🇪" },
                          { code: "it", name: "Italiano", flag: "🇮🇹" },
                          { code: "pt", name: "Português", flag: "���🇹" },
                          { code: "ar", name: "العربية", flag: "🇸🇦" },
                          { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
                          { code: "ja", name: "日本語", flag: "🇯🇵" },
                          { code: "ko", name: "한국어", flag: "🇰🇷" },
                          { code: "zh", name: "中文", flag: "🇨🇳" },
                        ].map((language) => (
                          <DropdownMenuItem
                            key={language.code}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <span>{language.flag}</span>
                            <span>{language.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
                      <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 w-56 max-h-60 overflow-y-auto">
                        {currencies.map((currency) => (
                          <button
                            key={currency.code}
                            onClick={() => {
                              setCurrency(currency);
                              setShowCurrencyDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center justify-between transition-colors ${
                              selectedCurrency.code === currency.code
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-900"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{currency.flag}</span>
                              <span>{currency.name}</span>
                            </div>
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
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Hotel className="w-4 h-4 text-blue-600" />
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
                    <Popover
                      open={showDesktopCalendar}
                      onOpenChange={setShowDesktopCalendar}
                    >
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
                        <SimpleCalendar
                          onDateSelect={(checkIn, checkOut) => {
                            console.log("Desktop hotel dates selected:", {
                              checkIn,
                              checkOut,
                            });
                            setDepartureDate(checkIn);
                            setReturnDate(checkOut);
                            setShowDesktopCalendar(false);
                          }}
                          onClose={() => setShowDesktopCalendar(false)}
                          initialCheckIn={departureDate || undefined}
                          initialCheckOut={returnDate || undefined}
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
                              <div className="font-medium text-gray-900">
                                Adults
                              </div>
                              <div className="text-sm text-gray-500">
                                Age 18+
                              </div>
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
                              <div className="text-sm text-gray-500">
                                Age 0-17
                              </div>
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
      <MobileNavigation />
    </div>
  );
}
