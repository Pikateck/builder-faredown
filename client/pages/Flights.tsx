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
  Sparkles,
  Target,
  Lock,
  MessageCircle,
  Crown,
  Rocket,
  Star,
  ArrowRight,
} from "lucide-react";
import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function Flights() {
  useScrollToTop();

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
              <FlightSearchForm />
            </div>
          </div>
        </div>

        {/* Why Faredown Section - Ultra Modern Mobile Design */}
        <div className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-16 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-4 w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-4 w-40 h-40 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-3xl"></div>
          </div>

          <div className="relative px-6 max-w-sm mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-xl border border-white/20 px-5 py-2.5 rounded-full mb-6 shadow-lg">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent font-semibold text-sm">Flight Excellence</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3 leading-tight">
                Why Choose
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Faredown Flights?</span>
              </h2>
              <p className="text-slate-600 font-medium">Sky-high savings, premium upgrades</p>
            </div>

            {/* Feature Cards - Asymmetrical Layout */}
            <div className="space-y-4">
              {/* Primary Feature - Full Width */}
              <div className="group relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-start space-x-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      Flight Upgrade Bargaining
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Our AI negotiates seat upgrades in real-time, turning economy bookings into business class at unbeatable prices.
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary Features - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 text-sm group-hover:text-emerald-600 transition-colors">
                      Best Flight Fares
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Pay what feels right for business class comfort
                    </p>
                  </div>
                </div>

                <div className="group relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 text-sm group-hover:text-purple-600 transition-colors">
                      Secure Ticketing
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Instant confirmations with verified airlines
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Feature - Full Width */}
              <div className="group relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">
                        24/7 Flight Support
                      </h3>
                      <p className="text-slate-600 text-sm">
                        Expert flight assistance anytime
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-amber-100 group-hover:to-orange-100 transition-all duration-300">
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-600 transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center space-x-2 text-sm text-slate-500">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Premium airlines worldwide</span>
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
            <FlightSearchForm />
          </div>
        </div>

        {/* Why Choose Faredown Section - Enhanced Desktop Design */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-blue-50 px-6 py-3 rounded-full mb-6">
                <div className="w-3 h-3 bg-[#003580] rounded-full animate-pulse"></div>
                <span className="text-[#003580] font-semibold text-sm">Revolutionizing Travel</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Why Faredown Is Reinventing Travel Booking
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                The future of booking isn't fixed pricing — it's{" "}
                <span className="text-[#003580] font-bold">live bargaining</span> powered by cutting-edge AI technology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 transform group">
                <div className="w-20 h-20 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  Live Bargain Technology
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Negotiate flight upgrades instantly — from economy to business, from basic to deluxe with our revolutionary AI engine.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 transform group">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  Pay What You Feel Is Fair
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Set your price and let Faredown negotiate for you — no more overpaying for flight experiences.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 transform group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  Secure, Real-Time Bookings
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Your data is encrypted with bank-level security and bookings are confirmed instantly with verified airlines.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 transform group">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  Smarter Than Any Travel Agent
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Skip the back and forth. Our AI works faster, smarter, and is available 24/7 to secure your best flight deals.
                </p>
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
                <span className="text-green-700 font-medium text-sm">Trusted by millions worldwide</span>
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
                      <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-4xl font-bold text-gray-900">4.9</span>
                </div>

                <div className="text-center">
                  <div className="font-semibold text-gray-900 text-lg">Excellent</div>
                  <div className="text-gray-600 text-sm">Based on 50,000+ reviews on</div>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <div className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">Trustpilot</div>
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
                    <div className="text-xl font-bold">24/7 Customer Support</div>
                    <div className="text-blue-100">Live Chat & Call Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Methods - Enhanced Grid */}
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-16 border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Safe, Verified, and Instant Confirmations</h3>
                <p className="text-gray-600">Backed by real humans</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">Live Chat</div>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-2xl">📞</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">Phone Call</div>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">Email</div>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Headphones className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">24/7 Support</div>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-200 md:col-span-1 col-span-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">Instant Confirmations</div>
                </div>
              </div>
            </div>

            {/* Customer Testimonials - Enhanced Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">P</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">Priya Sharma</div>
                    <div className="text-gray-500 text-sm">Marketing Manager</div>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-600 text-xs font-medium">Verified Purchase</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-gray-600 text-sm ml-2">5.0</span>
                </div>

                <blockquote className="text-gray-700 leading-relaxed italic">
                  "Saved ₹15,000 on my Dubai trip! The bargaining feature is amazing. Got business class using Bargain™. Faredown is revolutionary! Customer service is excellent."
                </blockquote>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">R</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">Rohit Kumar</div>
                    <div className="text-gray-500 text-sm">Software Engineer</div>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-600 text-xs font-medium">Verified Purchase</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-gray-600 text-sm ml-2">5.0</span>
                </div>

                <blockquote className="text-gray-700 leading-relaxed italic">
                  "Got business class upgrade in Singapore flight using Bargain™. Faredown is revolutionary! Customer service is excellent."
                </blockquote>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">Anjali Patel</div>
                    <div className="text-gray-500 text-sm">Product Designer</div>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-600 text-xs font-medium">Verified Purchase</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-green-600 text-sm ml-2">5.0</span>
                </div>

                <blockquote className="text-gray-700 leading-relaxed italic">
                  "Easy booking process and instant confirmations. Saved on both flights and hotels. Will use again!"
                </blockquote>
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
    </div>
  );
}
