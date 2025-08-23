import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDateContext } from "@/contexts/DateContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
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
  TrendingUp,
  DollarSign,
  Shield,
  Headphones,
  X,
  Globe,
  Zap,
  Bell,
  Menu,
  LogOut,
  Code,
  Camera,
  Car,
} from "lucide-react";
import { BookingSearchForm } from "@/components/BookingSearchForm";

export default function Flights() {
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();
  const { selectedCurrency, currencies, setCurrency } = useCurrency();

  // State for flights functionality
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* MOBILE-FIRST DESIGN: App-style layout for mobile, standard for desktop */}

      {/* Mobile Layout (≤768px) - Match Hotels.tsx exactly */}
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

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="bg-white shadow-lg border-t border-gray-200 absolute w-full z-50">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <span className="text-lg font-bold text-gray-900">Menu</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-white">
                <div className="p-4 space-y-1">
                  <Link
                    to="/flights"
                    className="flex items-center space-x-3 text-[#003580] bg-blue-50 py-3 px-3 rounded-lg touch-manipulation font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Plane className="w-5 h-5 text-[#003580]" strokeWidth={2} />
                    <span>Flights</span>
                  </Link>
                  <Link
                    to="/hotels"
                    className="flex items-center space-x-3 text-gray-700 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Hotel className="w-5 h-5 text-[#003580]" strokeWidth={2} />
                    <span className="font-medium">Hotels</span>
                  </Link>
                  <Link
                    to="/sightseeing"
                    className="flex items-center space-x-3 text-gray-700 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Camera className="w-5 h-5 text-[#003580]" strokeWidth={2} />
                    <span className="font-medium">Sightseeing</span>
                  </Link>
                  <Link
                    to="/transfers"
                    className="flex items-center space-x-3 text-gray-700 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Car className="w-5 h-5 text-[#003580]" strokeWidth={2} />
                    <span className="font-medium">Transfers</span>
                  </Link>
                </div>

                {isLoggedIn ? (
                  <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-[#003580] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {userName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {userName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Faredown Member
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Link
                        to="/account"
                        className="flex items-center space-x-3 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">My Account</span>
                      </Link>
                      <Link
                        to="/my-trips"
                        className="flex items-center space-x-3 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Plane className="w-4 h-4" />
                        <span className="text-sm">My Trips</span>
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-3 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
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
          )}
        </header>

        {/* Mobile Search Section */}
        <div className="pb-8 pt-4 bg-white">
          <div className="px-4">
            {/* Upgrade Message */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2 text-gray-900">
                Upgrade. Bargain. Book.
              </h1>
              <p className="text-gray-600 text-sm mb-3">
                Control your price for flights & hotels — with live AI bargaining.
              </p>
            </div>

            {/* Flight Search Form */}
            <div className="mx-auto">
              <BookingSearchForm />
            </div>
          </div>
        </div>

        {/* Why Faredown Section */}
        <div className="bg-gray-50 py-8">
          <div className="px-4">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-900">
              Why Faredown?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Live Bargaining</h3>
                <p className="text-xs text-gray-600">
                  Negotiate real-time prices
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
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

        {/* Mobile Bottom Navigation */}
        <div className="block md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
          <div className="grid grid-cols-5 h-16">
            <Link
              to="/flights"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
            >
              <Plane className="w-5 h-5 text-[#003580]" />
              <span className="text-xs text-[#003580] font-medium">Flights</span>
            </Link>
            <Link
              to="/hotels"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
            >
              <Hotel className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Hotels</span>
            </Link>
            <Link
              to="/sightseeing"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
            >
              <Camera className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Sightseeing</span>
            </Link>
            <Link
              to="/transfers"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
            >
              <Car className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Transfers</span>
            </Link>
            <Link
              to="/account"
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
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
                  to="/flights"
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4 border-b-2 border-white"
                >
                  <span>Flights</span>
                </Link>
                <Link
                  to="/hotels"
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4"
                >
                  <span>Hotels</span>
                </Link>
                <Link
                  to="/sightseeing"
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4"
                >
                  <span>Sightseeing</span>
                </Link>
                <Link
                  to="/transfers"
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
                          { code: "es", name: "Español", flag: "🇪🇸" },
                          { code: "fr", name: "Français", flag: "🇫🇷" },
                          { code: "de", name: "Deutsch", flag: "🇩🇪" },
                          { code: "it", name: "Italiano", flag: "🇮🇹" },
                          { code: "pt", name: "Português", flag: "🇵🇹" },
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

        {/* Desktop Main Content */}
        <div
          className="py-3 sm:py-6 md:py-8 pb-24 sm:pb-8"
          style={{ backgroundColor: "#003580" }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-2 sm:mb-3">
              <div className="mb-3 sm:mb-5">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  Upgrade. Bargain. Book.
                </h2>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-3 sm:mb-4 leading-tight px-2 opacity-95">
                Control your price for flights & hotels — with live AI bargaining.
              </h1>
            </div>

            {/* Desktop Flight Search Form */}
            <BookingSearchForm />
          </div>
        </div>
      </div>
    </div>
  );
}
