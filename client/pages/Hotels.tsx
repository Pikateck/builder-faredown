import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDateContext } from "@/contexts/DateContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plane,
  ChevronDown,
  Users,
  Settings,
  User,
  Hotel,
  Heart,
  DollarSign,
  Shield,
  Headphones,
  X,
  Globe,
  Bell,
  Menu,
  LogOut,
  Code,
  Camera,
  Car,
} from "lucide-react";
import { HotelSearchForm } from "@/components/HotelSearchForm";
import { UnifiedSearchPanel } from "@/components/UnifiedSearchPanel";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";

export default function Hotels() {
  useScrollToTop();

  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();
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

  // Mobile menu states to match flights page
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // User state
  const userName = user?.name || "Zubin Aibara";

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Handle sign out
  const handleSignOut = () => {
    logout();
  };

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
        {/* Mobile Header */}
        <header className="bg-[#003580] text-white">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-[#003580]" />
                </div>
                <span className="text-lg font-bold">faredown.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  className="p-2 relative hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors touch-manipulation"
                  onClick={() => {
                    setShowLanguageMenu(!showLanguageMenu);
                    setShowNotifications(false);
                    setShowMobileMenu(false);
                  }}
                >
                  <Globe className="w-5 h-5" />
                </button>
                <button
                  className="p-2 relative hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors touch-manipulation"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowLanguageMenu(false);
                    setShowMobileMenu(false);
                  }}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg"></span>
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(!showMobileMenu);
                    setShowNotifications(false);
                    setShowLanguageMenu(false);
                  }}
                  className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors touch-manipulation"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileMenu(false)}
            />

            {/* Menu Panel */}
            <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                  <span className="text-lg font-bold text-gray-900">Menu</span>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 py-4">
                  <nav className="space-y-1 px-4">
                    <Link
                      to="/"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Plane className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Flights</span>
                    </Link>

                    <Link
                      to="/hotels"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Hotel className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Hotels</span>
                    </Link>

                    <Link
                      to="/sightseeing"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Camera className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Sightseeing</span>
                    </Link>

                    <Link
                      to="/?tab=transfers"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Car className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Transfers</span>
                    </Link>

                    <Link
                      to="/bookings"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <BookOpen className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">My Bookings</span>
                    </Link>

                    {/* Currency Selection Tab */}
                    <div className="border-t border-gray-200 my-4"></div>
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-700 px-0 py-1 mb-2 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-[#003580]" />
                        Currency
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {currencies.map((currency) => (
                          <button
                            key={currency.code}
                            onClick={() => {
                              setCurrency(currency);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm flex items-center justify-between transition-colors ${
                              selectedCurrency.code === currency.code
                                ? "bg-blue-50 text-blue-600 border border-blue-200"
                                : "text-gray-700"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-base">{currency.flag}</span>
                              <span className="font-medium">
                                {currency.name}
                              </span>
                            </div>
                            <span className="font-semibold text-xs">
                              {currency.symbol} {currency.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 my-4"></div>

                    <button
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full"
                      onClick={() => {
                        setShowMobileMenu(false);
                      }}
                    >
                      <Heart className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Saved</span>
                    </button>

                    <button
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full"
                      onClick={() => {
                        setShowMobileMenu(false);
                      }}
                    >
                      <Headphones className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Help & Support</span>
                    </button>

                    <button
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full"
                      onClick={() => {
                        setShowMobileMenu(false);
                      }}
                    >
                      <Settings className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Settings</span>
                    </button>
                  </nav>

                  {/* User Section */}
                  {isLoggedIn ? (
                    <div className="mt-8 px-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-[#003580] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {userName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {userName}
                            </div>
                            <div className="text-sm text-gray-600">
                              Loyalty Level 1
                            </div>
                          </div>
                        </div>
                        <button
                          className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full"
                          onClick={() => {
                            handleSignOut();
                            setShowMobileMenu(false);
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>

                        {/* Admin Panel Access */}
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <button
                            className="flex items-center space-x-2 text-[#003580] hover:text-[#0071c2] w-full"
                            onClick={() => {
                              // Navigate to admin panel
                              window.open("/admin/login", "_blank");
                              setShowMobileMenu(false);
                            }}
                          >
                            <Shield className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Admin Panel
                            </span>
                          </button>
                          <button
                            className="flex items-center space-x-2 text-[#003580] hover:text-[#0071c2] w-full"
                            onClick={() => {
                              // Navigate to live API
                              window.open("/admin/api", "_blank");
                              setShowMobileMenu(false);
                            }}
                          >
                            <Code className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Live API
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 px-4 space-y-3">
                      <Button
                        className="w-full bg-[#003580] hover:bg-[#0071c2] text-white"
                        onClick={() => {
                          setShowSignIn(true);
                          setShowMobileMenu(false);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-[#003580] text-[#003580] hover:bg-blue-50"
                        onClick={() => {
                          setShowRegister(true);
                          setShowMobileMenu(false);
                        }}
                      >
                        Register
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Unified Landing Page */}
        <UnifiedLandingPage
          module="hotels"
          tagline="Control your price with AI-powered hotel upgrades."
          searchPanel={
            <UnifiedSearchPanel
              module="hotels"
              tagline="Control your price with AI-powered hotel upgrades."
              searchForm={<HotelSearchForm />}
            />
          }
        />


        {/* Mobile Bottom Navigation */}
        <div className="block md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
          <div className="grid grid-cols-5 h-16">
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
              to="/sightseeing"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
              onClick={() =>
                console.log(
                  "Sightseeing button clicked - navigating to /sightseeing",
                )
              }
            >
              <Camera className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Sightseeing</span>
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
                  to="/?tab=flights"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4"
                >
                  <span>Flights</span>
                </Link>
                <Link
                  to="/?tab=hotels"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4 border-b-2 border-white"
                >
                  <span>Hotels</span>
                </Link>
                <Link
                  to="/sightseeing"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4"
                >
                  <span>Sightseeing</span>
                </Link>
                <Link
                  to="/?tab=transfers"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4"
                >
                  <span>Transfers</span>
                </Link>
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
                          { code: "es", name: "Español", flag: "🇪����" },
                          { code: "fr", name: "Français", flag: "🇫🇷" },
                          { code: "de", name: "Deutsch", flag: "🇩🇪" },
                          { code: "it", name: "Italiano", flag: "🇮🇹" },
                          { code: "pt", name: "Português", flag: "🇵🇹" },
                          { code: "ar", name: "الع��بي��", flag: "🇸🇦" },
                          { code: "hi", name: "���ि��्दी", flag: "🇮🇳" },
                          { code: "ja", name: "日��語", flag: "🇯🇵" },
                          { code: "ko", name: "��국어", flag: "🇰🇷" },
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
                  {isLoggedIn ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center space-x-2 text-white hover:text-blue-200 px-3 py-2 rounded-lg transition-colors">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <span className="text-[#003580] font-bold text-sm">
                              {userName.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{userName}</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48" align="end">
                        <DropdownMenuItem>
                          <Link to="/account" className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            My account
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account/trips"
                            className="flex items-center"
                          >
                            <Plane className="w-4 h-4 mr-2" />
                            Bookings & Trips
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account/loyalty"
                            className="flex items-center"
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Loyalty program
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account/payment"
                            className="flex items-center"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Rewards & Wallet
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link to="/my-trips" className="flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            Completed trips
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign out
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open("/admin/login", "_blank")}
                          className="border-t mt-1 pt-2"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open("/admin/api", "_blank")}
                        >
                          <Code className="w-4 h-4 mr-2" />
                          Live API
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
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

        {/* Desktop Unified Landing Page */}
        <UnifiedLandingPage
          module="hotels"
          tagline="Control your price with AI-powered hotel upgrades."
          searchPanel={
            <UnifiedSearchPanel
              module="hotels"
              tagline="Control your price with AI-powered hotel upgrades."
              searchForm={<HotelSearchForm />}
            />
          }
        />

        {/* Why Choose Faredown Section - Ultra Modern Desktop Design */}
        <section className="relative py-24 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-8">
            {/* Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center space-x-3 bg-white/70 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-full mb-8 shadow-lg">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent font-bold text-lg">
                  Hotel Excellence Redefined
                </span>
              </div>

              <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-8 leading-tight">
                Why Choose{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Faredown Hotels?
                </span>
              </h2>

              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
                Experience luxury hotels like never before — where{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  AI-powered room upgrades
                </span>{" "}
                meet uncompromising comfort and unprecedented savings.
              </p>
            </div>

            {/* Feature Grid - Modern Asymmetrical Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Hero Feature - Spans 8 columns */}
              <div className="lg:col-span-8 group relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-3">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="relative flex items-start space-x-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        Smart Hotel Upgrades
                      </h3>
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full">
                        EXCLUSIVE
                      </div>
                    </div>
                    <p className="text-slate-600 text-lg leading-relaxed mb-6">
                      Our AI negotiates directly with hotels to secure room
                      upgrades, premium amenities, and exclusive perks that
                      transform your stay from ordinary to extraordinary.
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-slate-500">
                      <div className="flex items-center space-x-2">
                        <Rocket className="w-4 h-4 text-blue-500" />
                        <span>Suite upgrades</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-purple-500" />
                        <span>VIP amenities</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <span>Best locations</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Feature - Spans 4 columns */}
              <div className="lg:col-span-4 group relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">
                    Premium for Less
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Set your budget and let our AI secure luxury accommodations
                    at prices that work for you.
                  </p>
                  <div className="inline-flex items-center text-emerald-600 font-semibold text-sm group-hover:text-emerald-700 transition-colors">
                    <span>Save up to 70%</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Security Feature - Spans 6 columns */}
              <div className="lg:col-span-6 group relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-start space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Lock className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">
                        Verified Hotel Partners
                      </h3>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        Every hotel in our network is verified and trusted. Book
                        with complete confidence knowing your reservation is
                        guaranteed.
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Instant confirmation</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>No hidden fees</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Feature - Spans 6 columns */}
              <div className="lg:col-span-6 group relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-start space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors">
                        Hotel Concierge Service
                      </h3>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        Dedicated hotel experts available 24/7 to handle special
                        requests, room preferences, and any travel needs.
                      </p>
                      <div className="inline-flex items-center text-amber-600 font-semibold text-sm group-hover:text-amber-700 transition-colors">
                        <span>Connect with concierge</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="mt-20 text-center">
              <div className="inline-flex items-center space-x-8 bg-white/70 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-full shadow-lg">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-slate-700 font-semibold">
                    5-Star Hotels
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-300"></div>
                <div className="flex items-center space-x-2">
                  <Hotel className="w-5 h-5 text-blue-500" />
                  <span className="text-slate-700 font-semibold">
                    Global Network
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-300"></div>
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-purple-500" />
                  <span className="text-slate-700 font-semibold">
                    Luxury Upgrades
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Social Proof Section - Enhanced Classy Design */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-[1280px] mx-auto px-6">
            {/* Header with Trust Indicators */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full mb-6">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium text-sm">
                  Trusted by millions worldwide
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Trusted by 50M+ Travelers
              </h2>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Real reviews from verified travelers
              </p>

              {/* Trust Score Display */}
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-gray-100">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-6 h-6 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-4xl font-bold text-gray-900">4.9</span>
                </div>

                <div className="text-center">
                  <div className="font-semibold text-gray-900 text-lg">
                    Excellent
                  </div>
                  <div className="text-gray-600 text-sm">
                    Based on 50,000+ reviews on
                  </div>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <div className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">
                      Trustpilot
                    </div>
                    <span className="text-green-600 font-medium">★★★★★</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Support Banner */}
            <div className="text-center mb-16">
              <div className="bg-gradient-to-r from-[#003580] to-[#0071c2] text-white py-6 px-8 rounded-2xl inline-block shadow-xl">
                <div className="flex items-center justify-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold">
                      24/7 Customer Support
                    </div>
                    <div className="text-blue-100">
                      Live Chat & Call Available
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Methods - Enhanced Grid */}
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-16 border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Safe, Verified, and Instant Confirmations
                </h3>
                <p className="text-gray-600">Backed by real humans</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Live Chat
                  </div>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-2xl">📞</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Phone Call
                  </div>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Email
                  </div>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Headphones className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">
                    24/7 Support
                  </div>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-200 md:col-span-1 col-span-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Instant Confirmations
                  </div>
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
                  amazing. Got business class hotel using Bargain��. Faredown is
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

        <Footer />
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
