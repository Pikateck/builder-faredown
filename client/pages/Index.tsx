import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useDateContext } from "@/contexts/DateContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useScrollToTop } from "@/hooks/useScrollToTop";
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
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  BookOpen,
  Sparkles,
  Target,
  Crown,
  Star,
  Play,
  Download,
  Smartphone,
} from "lucide-react";
import { BookingSearchForm } from "@/components/BookingSearchForm";
import { SightseeingSearchForm } from "@/components/SightseeingSearchForm";
import { TransfersSearchForm } from "@/components/TransfersSearchForm";

export default function Index() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, user, logout } = useAuth();
  const { selectedCurrency, currencies, setCurrency } = useCurrency();

  // Get active tab from URL params, default to flights
  const activeTab = searchParams.get("tab") || "flights";

  // State for functionality
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // User state
  const userName = user?.name || "Zubin Aibara";

  // Scroll to top when component mounts or tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Handle sign out
  const handleSignOut = () => {
    logout();
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // Get content based on active tab
  const getTabContent = () => {
    switch (activeTab) {
      case "hotels":
        return {
          title: "Find your perfect stay",
          subtitle: "Search hotels with live AI bargaining.",
          searchForm: <BookingSearchForm />,
        };
      case "sightseeing":
        return {
          title: "Upgrade. Bargain. Book.",
          subtitle: "Explore fascinating attractions, cultural landmarks, and exciting activities. Create unforgettable memories with our curated sightseeing experiences.",
          searchForm: <SightseeingSearchForm />,
        };
      case "transfers":
        return {
          title: "Upgrade. Bargain. Book.",
          subtitle: "Ride in comfort for less — AI secures your best deal on every trip.",
          searchForm: <TransfersSearchForm />,
        };
      default: // flights
        return {
          title: "Upgrade. Bargain. Book.",
          subtitle: "Turn your seat into an upgrade and your fare into a win, with AI that bargains for you.",
          searchForm: <BookingSearchForm />,
        };
    }
  };

  const tabContent = getTabContent();

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
                    <button
                      onClick={() => {
                        handleTabChange("flights");
                        setShowMobileMenu(false);
                      }}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left",
                        activeTab === "flights"
                          ? "text-[#003580] bg-blue-50"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Plane className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Flights</span>
                    </button>

                    <button
                      onClick={() => {
                        handleTabChange("hotels");
                        setShowMobileMenu(false);
                      }}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left",
                        activeTab === "hotels"
                          ? "text-[#003580] bg-blue-50"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Hotel className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Hotels</span>
                    </button>

                    <button
                      onClick={() => {
                        handleTabChange("sightseeing");
                        setShowMobileMenu(false);
                      }}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left",
                        activeTab === "sightseeing"
                          ? "text-[#003580] bg-blue-50"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Camera className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Sightseeing</span>
                    </button>

                    <button
                      onClick={() => {
                        handleTabChange("transfers");
                        setShowMobileMenu(false);
                      }}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left",
                        activeTab === "transfers"
                          ? "text-[#003580] bg-blue-50"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Car className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">Transfers</span>
                    </button>

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

        {/* Mobile Search Section */}
        <div className="pb-8 pt-4 bg-white">
          <div className="px-4">
            {/* Upgrade Message */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2 text-gray-900">
                {tabContent.title}
              </h1>
              <p className="text-gray-600 text-sm mb-3">
                {tabContent.subtitle}
              </p>
            </div>

            {/* Search Form */}
            <div className="mx-auto">
              {tabContent.searchForm}
            </div>
          </div>
        </div>

        {/* ========== FRESH MOBILE REDESIGN STARTS HERE ========== */}

        {/* AI Hero Banner - Mobile */}
        <section className="relative bg-gradient-to-br from-[#003580] via-[#0071c2] to-[#003580] py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-24 h-24 bg-[#febb02] rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-8 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative px-6 text-center text-white">
            <div className="inline-flex items-center space-x-2 bg-[#febb02] text-[#003580] px-4 py-2 rounded-full mb-8 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI that bargains while you relax</span>
            </div>

            <h2 className="text-4xl font-black mb-6 leading-tight">
              Save more,<br />fly smarter.
            </h2>

            <Button className="bg-[#febb02] hover:bg-[#e6a602] text-[#003580] font-bold px-10 py-4 rounded-full text-lg">
              Start Bargaining Now
            </Button>
          </div>
        </section>

        {/* Minimal Benefits - Mobile */}
        <section className="py-16 bg-white">
          <div className="px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-gray-900 mb-4">Your fare, your win.</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Bargain in seconds</h3>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">AI upgrades your journey</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section - Mobile */}
        <section className="py-16 bg-gray-50">
          <div className="px-6 text-center">
            <h2 className="text-2xl font-black text-gray-900 mb-8">
              4.9★ – Loved by travelers worldwide
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">P</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Priya Sharma</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-[#febb02] fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-left">"Saved ₹15,000 on my Dubai trip – business class at economy price!"</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">R</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Rohit Kumar</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-[#febb02] fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-left">"Suite upgrade in Singapore using AI Bargaining – revolutionary!"</p>
              </div>
            </div>
          </div>
        </section>

        {/* App Download - Mobile */}
        <section className="py-16 bg-[#003580] text-white">
          <div className="px-6 text-center">
            <div className="w-20 h-20 bg-[#febb02] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-10 h-10 text-[#003580]" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Your AI travel companion, in your pocket.</h2>
            <p className="text-blue-100 mb-8">Download for exclusive mobile deals</p>
            
            <div className="space-y-4">
              <Button className="w-full bg-black hover:bg-gray-900 text-white py-4 rounded-xl flex items-center justify-center space-x-3">
                <Download className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs opacity-75">Download on the</div>
                  <div className="font-bold">App Store</div>
                </div>
              </Button>
              
              <Button className="w-full bg-black hover:bg-gray-900 text-white py-4 rounded-xl flex items-center justify-center space-x-3">
                <Download className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs opacity-75">Get it on</div>
                  <div className="font-bold">Google Play</div>
                </div>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer - Mobile */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="px-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-[#febb02] rounded-xl flex items-center justify-center">
                <Plane className="w-5 h-5 text-[#003580]" />
              </div>
              <span className="text-2xl font-bold">faredown.com</span>
            </div>

            <p className="text-gray-400 mb-8">The world's first AI-powered travel portal</p>

            <div className="flex justify-center space-x-6 mb-8 text-sm text-gray-400">
              <button onClick={() => handleTabChange("flights")}>Flights</button>
              <button onClick={() => handleTabChange("hotels")}>Hotels</button>
              <Link to="/help">Help</Link>
              <Link to="/contact">Contact</Link>
            </div>

            <div className="flex justify-center space-x-4 mb-8">
              {[Facebook, Instagram, Twitter, Linkedin].map((Social, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-[#003580] transition-colors"
                >
                  <Social className="w-4 h-4" />
                </a>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                {["TAAI", "TAAFI", "IATA"].map((cert) => (
                  <div key={cert} className="bg-white rounded-lg px-3 py-1">
                    <span className="text-[#003580] font-bold text-xs">{cert}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400">© 2025 Faredown.com. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Mobile Bottom Navigation */}
        <div className="block md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
          <div className="grid grid-cols-5 h-16">
            <button
              onClick={() => handleTabChange("flights")}
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
            >
              <Plane className={cn("w-5 h-5", activeTab === "flights" ? "text-[#003580]" : "text-gray-400")} />
              <span className={cn("text-xs", activeTab === "flights" ? "text-[#003580] font-medium" : "text-gray-500")}>Flights</span>
            </button>
            <button
              onClick={() => handleTabChange("hotels")}
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
            >
              <Hotel className={cn("w-5 h-5", activeTab === "hotels" ? "text-[#003580]" : "text-gray-400")} />
              <span className={cn("text-xs", activeTab === "hotels" ? "text-[#003580] font-medium" : "text-gray-500")}>Hotels</span>
            </button>
            <button
              onClick={() => handleTabChange("sightseeing")}
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
            >
              <Camera className={cn("w-5 h-5", activeTab === "sightseeing" ? "text-[#003580]" : "text-gray-400")} />
              <span className={cn("text-xs", activeTab === "sightseeing" ? "text-[#003580] font-medium" : "text-gray-500")}>Sightseeing</span>
            </button>
            <button
              onClick={() => handleTabChange("transfers")}
              className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
            >
              <Car className={cn("w-5 h-5", activeTab === "transfers" ? "text-[#003580]" : "text-gray-400")} />
              <span className={cn("text-xs", activeTab === "transfers" ? "text-[#003580] font-medium" : "text-gray-500")}>Transfers</span>
            </button>
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

      {/* DESKTOP LAYOUT (≥769px) - Fresh Premium Design */}
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
                <button
                  onClick={() => handleTabChange("flights")}
                  className={cn(
                    "text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4",
                    activeTab === "flights" && "border-b-2 border-white"
                  )}
                >
                  <span>Flights</span>
                </button>
                <button
                  onClick={() => handleTabChange("hotels")}
                  className={cn(
                    "text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4",
                    activeTab === "hotels" && "border-b-2 border-white"
                  )}
                >
                  <span>Hotels</span>
                </button>
                <button
                  onClick={() => handleTabChange("sightseeing")}
                  className={cn(
                    "text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4",
                    activeTab === "sightseeing" && "border-b-2 border-white"
                  )}
                >
                  <span>Sightseeing</span>
                </button>
                <button
                  onClick={() => handleTabChange("transfers")}
                  className={cn(
                    "text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4",
                    activeTab === "transfers" && "border-b-2 border-white"
                  )}
                >
                  <span>Transfers</span>
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
                          { code: "it", name: "Italiano", flag: "���🇹" },
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

        {/* Desktop Search Section */}
        <div
          className="py-3 sm:py-6 md:py-8 pb-24 sm:pb-8"
          style={{ backgroundColor: "#003580" }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-2 sm:mb-3">
              <div className="mb-3 sm:mb-5">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  {tabContent.title}
                </h2>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-3 sm:mb-4 leading-tight px-2 opacity-95">
                {tabContent.subtitle}
              </h1>
            </div>

            {/* Desktop Search Form */}
            <div className="max-w-7xl mx-auto">
              {tabContent.searchForm}
            </div>
          </div>
        </div>

        {/* ========== FRESH DESKTOP REDESIGN STARTS HERE ========== */}

        {/* Premium AI Hero Section */}
        <section className="relative py-32 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-[#febb02] to-[#e6a602] rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-8 text-center">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-[#003580] to-[#0071c2] text-white px-8 py-4 rounded-full mb-12 shadow-lg">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-lg">AI that bargains while you relax</span>
            </div>

            <h1 className="text-7xl md:text-8xl font-black text-gray-900 mb-16 leading-tight">
              Save more,<br />
              <span className="bg-gradient-to-r from-[#003580] to-[#0071c2] bg-clip-text text-transparent">
                fly smarter.
              </span>
            </h1>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8 mb-20">
              <Button className="bg-[#febb02] hover:bg-[#e6a602] text-[#003580] font-bold text-xl px-16 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                Start Bargaining Now
              </Button>

              <Button variant="outline" className="border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white font-bold text-xl px-16 py-6 rounded-full">
                <Play className="w-6 h-6 mr-3" />
                Watch Demo
              </Button>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-lg">
                <div className="text-5xl font-black text-[#003580] mb-3">60%</div>
                <div className="text-gray-600 font-medium text-lg">Average savings</div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-lg">
                <div className="text-5xl font-black text-[#003580] mb-3">2M+</div>
                <div className="text-gray-600 font-medium text-lg">Happy travelers</div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-lg">
                <div className="text-5xl font-black text-[#003580] mb-3">4.9★</div>
                <div className="text-gray-600 font-medium text-lg">Customer rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Benefits Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-black text-gray-900 mb-4">
                Your fare, <span className="text-[#003580]">your win.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-6xl mx-auto">
              <div className="text-center group">
                <div className="w-24 h-24 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Zap className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Bargain in seconds</h3>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Crown className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">AI upgrades your journey</h3>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Target className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Your fare, your win</h3>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Star className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Trusted worldwide</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Social Proof */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black text-gray-900 mb-8">
                4.9★ – Loved by travelers worldwide
              </h2>
            </div>

            {/* Customer Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">P</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Priya Sharma</div>
                    <div className="text-gray-500 text-sm">Marketing Manager</div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#febb02] fill-current" />
                  ))}
                </div>

                <blockquote className="text-gray-700 leading-relaxed text-lg">
                  "Saved ₹15,000 on my Dubai trip – business class at economy price!"
                </blockquote>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">R</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Rohit Kumar</div>
                    <div className="text-gray-500 text-sm">Software Engineer</div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#febb02] fill-current" />
                  ))}
                </div>

                <blockquote className="text-gray-700 leading-relaxed text-lg">
                  "Suite upgrade in Singapore using AI Bargaining – revolutionary!"
                </blockquote>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Anjali Patel</div>
                    <div className="text-gray-500 text-sm">Product Designer</div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#febb02] fill-current" />
                  ))}
                </div>

                <blockquote className="text-gray-700 leading-relaxed text-lg">
                  "Easy booking + instant savings. Faredown is my go-to travel app."
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App CTA */}
        <section className="py-20 bg-[#003580] text-white">
          <div className="max-w-5xl mx-auto px-8 text-center">
            <div className="w-28 h-28 bg-[#febb02] rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Smartphone className="w-14 h-14 text-[#003580]" />
            </div>

            <h2 className="text-5xl font-black mb-8">
              Travel Smarter. Bargain Better.<br />
              <span className="text-[#febb02]">On the Go.</span>
            </h2>

            <p className="text-xl text-blue-100 mb-12">
              Get the Faredown app for instant bargains and exclusive deals.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <div className="flex items-center space-x-2 text-blue-100">
                <Zap className="w-5 h-5 text-[#febb02]" />
                <span>Instant alerts</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <Smartphone className="w-5 h-5 text-[#febb02]" />
                <span>Mobile exclusive deals</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <Headphones className="w-5 h-5 text-[#febb02]" />
                <span>Offline support</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button className="bg-black hover:bg-gray-900 text-white py-6 px-8 rounded-2xl flex items-center space-x-4 text-lg">
                <Download className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-sm opacity-75">Download on the</div>
                  <div className="font-bold">App Store</div>
                </div>
              </Button>

              <Button className="bg-black hover:bg-gray-900 text-white py-6 px-8 rounded-2xl flex items-center space-x-4 text-lg">
                <Download className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-sm opacity-75">Get it on</div>
                  <div className="font-bold">Google Play</div>
                </div>
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <h2 className="text-4xl font-black text-gray-900 mb-6">
              Book smarter with AI
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Join 2M+ travelers getting exclusive deals
            </p>

            <div className="flex flex-col sm:flex-row max-w-lg mx-auto space-y-4 sm:space-y-0 sm:space-x-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-5 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#003580] text-gray-900 text-lg"
              />
              <Button className="bg-[#003580] hover:bg-[#0071c2] text-white px-10 py-5 rounded-2xl font-bold text-lg">
                Subscribe
              </Button>
            </div>
          </div>
        </section>

        {/* Premium Footer */}
        <footer className="bg-gray-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-[#febb02] rounded-2xl flex items-center justify-center">
                <Plane className="w-6 h-6 text-[#003580]" />
              </div>
              <span className="text-3xl font-bold">faredown.com</span>
            </div>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              The world's first AI-powered travel platform
            </p>

            <div className="flex justify-center space-x-8 mb-12 text-gray-400">
              <button onClick={() => handleTabChange("flights")} className="hover:text-white transition-colors font-medium">Flights</button>
              <button onClick={() => handleTabChange("hotels")} className="hover:text-white transition-colors font-medium">Hotels</button>
              <button onClick={() => handleTabChange("sightseeing")} className="hover:text-white transition-colors font-medium">Sightseeing</button>
              <button onClick={() => handleTabChange("transfers")} className="hover:text-white transition-colors font-medium">Transfers</button>
              <Link to="/help" className="hover:text-white transition-colors font-medium">Help Center</Link>
              <Link to="/contact" className="hover:text-white transition-colors font-medium">Contact</Link>
              <Link to="/privacy" className="hover:text-white transition-colors font-medium">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors font-medium">Terms</Link>
            </div>

            <div className="flex justify-center space-x-6 mb-12">
              {[Facebook, Instagram, Twitter, Linkedin].map((Social, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center hover:bg-[#003580] transition-colors"
                >
                  <Social className="w-6 h-6" />
                </a>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
                <div className="flex items-center space-x-6">
                  <span className="text-gray-400 font-medium">Certified by:</span>
                  <div className="flex items-center space-x-4">
                    {["TAAI", "TAAFI", "IATA"].map((cert) => (
                      <div key={cert} className="bg-white rounded-xl px-4 py-2">
                        <span className="text-[#003580] font-bold">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-gray-400 text-lg">
                  © 2025 Faredown.com. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
