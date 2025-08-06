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
  Globe,
} from "lucide-react";
import AdminTestButton from "@/components/AdminTestButton";
import {
  MobileCityDropdown,
  MobileDatePicker,
  MobileTravelers,
} from "@/components/MobileDropdowns";
import { BookingSearchForm } from "@/components/BookingSearchForm";

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

  // Mobile dropdown states
  const [showMobileDestination, setShowMobileDestination] = useState(false);
  const [showMobileDates, setShowMobileDates] = useState(false);
  const [showMobileGuests, setShowMobileGuests] = useState(false);
  const [selectedDepartureDate, setSelectedDepartureDate] =
    useState<Date | null>(null);
  const [selectedReturnDate, setSelectedReturnDate] = useState<Date | null>(
    null,
  );
  const [selectingDeparture, setSelectingDeparture] = useState(true);

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
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-[#003580]" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                faredown.com
              </span>
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

            {/* Hotel Search Form with Hotelbeds Test Destinations */}
            <div className="mx-auto">
              <BookingSearchForm />
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
                <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-[#003580]" />
                </div>
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
                          <Globe className="w-4 h-4" />
                          <span>English</span>
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
                          { code: "ar", name: "الع��بية", flag: "🇸🇦" },
                          { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
                          { code: "ja", name: "日本語", flag: "🇯🇵" },
                          { code: "ko", name: "한국���", flag: "🇰🇷" },
                          { code: "zh", name: "中文", flag: "🇨���" },
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

            {/* Desktop Hotel Search Form with Hotelbeds Test Destinations */}
            <div className="max-w-7xl mx-auto">
              <BookingSearchForm />
            </div>
          </div>
        </div>

        {/* Upgrade & Add-ons Section */}
        <section className="py-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#003580] rounded-lg flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Want Business Class or Room Upgrade?
                  </h3>
                  <p className="text-gray-600">Bargain for It Instantly.</p>
                </div>
              </div>
              <Button className="bg-[#003580] hover:bg-[#0071c2] text-white font-medium px-6 py-2 rounded-lg">
                Start Bargaining
              </Button>
            </div>
          </div>
        </section>

        {/* Why Choose Faredown Section */}
        <section className="py-16 bg-white">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Faredown Is Reinventing Hotel Booking
              </h2>
              <p className="text-gray-600 text-lg">
                The future of booking isn't fixed pricing — it's{" "}
                <strong>live bargaining.</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#003580] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Live Bargain Technology
                </h3>
                <p className="text-gray-600 text-sm">
                  Negotiate room upgrades instantly — from standard to suite,
                  from basic to deluxe.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#003580] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Pay What You Feel Is Fair
                </h3>
                <p className="text-gray-600 text-sm">
                  Set your price and let Faredown try to get it for you — no
                  more overpaying.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#003580] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Secure, Real-Time Bookings
                </h3>
                <p className="text-gray-600 text-sm">
                  Your data is encrypted and bookings are confirmed instantly.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#003580] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Headphones className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Smarter Than Any Travel Agent
                </h3>
                <p className="text-gray-600 text-sm">
                  Skip the back and forth. Our AI works faster, 24/7.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Social Proof Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Trusted by 50M+ Travelers
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Real reviews from verified travelers
              </p>
              <div className="flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-2xl">
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-3xl font-bold text-gray-900">4.9</span>
                </div>
                <div className="text-gray-600">
                  <div className="font-medium">Excellent</div>
                  <div className="text-sm">
                    Based on 50,000+ reviews on Trustpilot
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Support Section */}
            <div className="text-center mb-12">
              <div className="bg-[#003580] text-white py-4 px-8 rounded-xl inline-block">
                <div className="flex items-center space-x-3">
                  <Headphones className="w-6 h-6" />
                  <span className="text-lg font-semibold">
                    24/7 Customer Support | Live Chat & Call Available
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Methods */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Live Chat
                </div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📞</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Phone Call
                </div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✉️</span>
                </div>
                <div className="text-sm font-medium text-gray-900">Email</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">���</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  24/7 Support
                </div>
              </div>
              <div className="text-center md:col-span-1 col-span-2">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Safe, Verified, and Instant Confirmations. Backed by real
                  humans.
                </div>
              </div>
            </div>

            {/* Customer Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-[#003580] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">P</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Priya Sharma
                    </div>
                    <div className="text-sm text-gray-500">
                      Marketing Manager
                    </div>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm">
                  "Saved ₹15,000 on my Dubai trip! The bargaining feature is
                  amazing. Got business class hotel using Bargain™. Faredown is
                  revolutionary! Customer service is excellent."
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  Verified Purchase
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-[#003580] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">R</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Rohit Kumar</div>
                    <div className="text-sm text-gray-500">
                      Software Engineer
                    </div>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm">
                  "Got suite upgrade in Singapore hotel using Bargain™.
                  Faredown is revolutionary! Customer service is excellent."
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  Verified Purchase
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-[#003580] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Anjali Patel
                    </div>
                    <div className="text-sm text-gray-500">
                      Product Designer
                    </div>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm">
                  "Easy booking process and instant confirmations. Saved on both
                  hotels and hotels. Will use again!"
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  Verified Purchase
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App Section */}
        <section className="py-16 bg-[#003580] text-white">
          <div className="max-w-[1280px] mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Travel Smarter. Bargain Better. On the Go.
            </h2>
            <p className="text-lg mb-8 text-blue-200">
              Download the Faredown app for exclusive mobile-only deals and
              instant bargain alerts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
              <div className="flex items-center space-x-3 text-blue-200">
                <span className="text-xl">📱</span>
                <span>Instant notifications</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-200">
                <span className="text-xl">⚡</span>
                <span>Mobile exclusive deals</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-200">
                <span className="text-xl">🎯</span>
                <span>Offline support available</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="bg-black text-white px-6 py-3 rounded-lg flex items-center space-x-3 hover:bg-gray-800 transition-colors">
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </button>
              <button className="bg-black text-white px-6 py-3 rounded-lg flex items-center space-x-3 hover:bg-gray-800 transition-colors">
                <span className="text-2xl">🤖</span>
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="text-lg font-semibold">Google Play</div>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Email Signup Section */}
        <section className="py-16 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay ahead with secret travel bargains
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Enter your email address
            </p>

            <div className="flex flex-col sm:flex-row max-w-md mx-auto space-y-4 sm:space-y-0 sm:space-x-4">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580] text-gray-900"
              />
              <Button className="bg-[#003580] hover:bg-[#0071c2] text-white px-8 py-3 rounded-lg font-medium">
                Subscribe
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4">No spam emails</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-12">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-4">Faredown</h3>
                <p className="text-gray-400 text-sm mb-4">
                  The world's first travel portal where you control the price.
                  Bargain for better deals on hotels and hotels.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <Link to="/" className="hover:text-white">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/" className="hover:text-white">
                      How it Works
                    </Link>
                  </li>
                  <li>
                    <Link to="/" className="hover:text-white">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link to="/" className="hover:text-white">
                      Help Center
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <Link to="/" className="hover:text-white">
                      Hotels
                    </Link>
                  </li>
                  <li>
                    <Link to="/hotels" className="hover:text-white">
                      Hotels
                    </Link>
                  </li>
                  <li>
                    <Link to="/" className="hover:text-white">
                      Car Rentals
                    </Link>
                  </li>
                  <li>
                    <Link to="/" className="hover:text-white">
                      Travel Insurance
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <Link to="/privacy-policy" className="hover:text-white">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms-conditions" className="hover:text-white">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link to="/cookie-policy" className="hover:text-white">
                      Cookie Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/refund-policy" className="hover:text-white">
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
              © 2024 Faredown.com. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Dropdown Components for Hotels */}
      <MobileCityDropdown
        isOpen={showMobileDestination}
        onClose={() => setShowMobileDestination(false)}
        title="Select destination"
        cities={cityData}
        selectedCity={selectedFromCity}
        onSelectCity={setSelectedFromCity}
        context="hotels"
      />

      <MobileDatePicker
        isOpen={showMobileDates}
        onClose={() => setShowMobileDates(false)}
        tripType="round-trip"
        setTripType={() => {}} // Hotels always use round-trip (check-in/check-out)
        selectedDepartureDate={departureDate}
        selectedReturnDate={returnDate}
        setSelectedDepartureDate={setDepartureDate}
        setSelectedReturnDate={setReturnDate}
        selectingDeparture={selectingDeparture}
        setSelectingDeparture={setSelectingDeparture}
        bookingType="hotels"
      />

      <MobileTravelers
        isOpen={showMobileGuests}
        onClose={() => setShowMobileGuests(false)}
        travelers={travelers}
        setTravelers={setTravelers}
      />

      <MobileNavigation />
    </div>
  );
}
