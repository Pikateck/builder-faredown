import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
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
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Headphones,
  X,
  Bell,
  Menu,
  LogOut,
  Code,
  Camera,
  Car,
  BookOpen,
  Award,
  CreditCard,
} from "lucide-react";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();
  const { selectedCurrency, currencies, setCurrency } = useCurrency();

  // State for dropdowns and mobile menu
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Auth modal state with debouncing
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login",
  );
  const [isModalTransitioning, setIsModalTransitioning] = useState(false);

  // User state - use OAuth user data when available
  const userName = user?.name || (isLoggedIn ? "User" : "");

  // Get active tab from URL
  const getActiveTab = () => {
    // Check actual route paths first
    if (location.pathname === "/" || location.pathname === "/hotels")
      return "hotels";
    if (location.pathname.includes("/flights")) return "flights";
    if (location.pathname.includes("/sightseeing")) return "sightseeing";
    if (location.pathname.includes("/transfers")) return "transfers";

    // Fallback to query parameters for backward compatibility
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab) return tab;

    return "hotels";
  };

  const activeTab = getActiveTab();

  // Handle tab change
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case "hotels":
        navigate("/hotels");
        break;
      case "flights":
        navigate("/flights");
        break;
      case "sightseeing":
        navigate("/sightseeing");
        break;
      case "transfers":
        navigate("/transfers");
        break;
      default:
        navigate("/");
    }
    window.scrollTo(0, 0);
  };

  // Handle sign out
  const handleSignOut = () => {
    logout();
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* Mobile Layout (≤768px) */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="bg-[#003580] text-white">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F6610cbb1369a49b6a98ce99413f8d9ae?format=webp&width=800"
                  alt="Faredown Logo"
                  className="w-8 h-8 object-contain"
                  style={{
                    background: "none",
                    border: "none",
                    boxShadow: "none",
                  }}
                />
                <span className="text-xl font-medium text-white">
                  faredown.com
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  className="p-2 relative hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors touch-manipulation"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
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
                  }}
                  className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors touch-manipulation"
                  data-mobile-menu-trigger
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Notifications Panel */}
        {showNotifications && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowNotifications(false)}
            />

            {/* Notifications Panel */}
            <div className="fixed top-16 left-0 right-0 mx-4 bg-white rounded-lg shadow-xl max-h-96 overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                  <span className="text-lg font-bold text-gray-900">
                    Notifications
                  </span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                  {/* Sample notifications */}
                  <div className="space-y-1">
                    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 border-b border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Booking Confirmed
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Your hotel booking in Dubai has been confirmed.
                          Reference: FD12345
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          2 hours ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 border-b border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Plane className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Flight Update
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Your flight AI 131 departure time has been updated to
                          14:30
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          5 hours ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 border-b border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Check-in Reminder
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Don't forget to check-in for your flight tomorrow at
                          10:00 AM
                        </p>
                        <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 border-b border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Payment Failed
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Your payment for booking FD12346 was declined. Please
                          update your payment method.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Special Offer
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Get 20% off on your next hotel booking. Use code
                          SAVE20
                        </p>
                        <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      handleNavigation("/account?tab=notifications");
                    }}
                    className="w-full text-center text-sm text-[#003580] font-medium hover:text-[#0071c2]"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                <div className="flex-1 overflow-y-auto">
                  {/* User Section First */}
                  {isLoggedIn && (
                    <div className="px-4 py-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-[#003580] rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {userName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">
                            {userName}
                          </div>
                          <div className="text-sm text-gray-600">
                            FaredownClub Gold
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <nav className="px-4 py-4">
                    {/* Account Section */}
                    {isLoggedIn && (
                      <div className="mb-6">
                        <div className="text-xs font-semibold text-gray-500 px-0 py-2 mb-3 uppercase tracking-wider">
                          My Account
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              handleNavigation("/account/trips");
                              setShowMobileMenu(false);
                            }}
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                          >
                            <Plane className="w-5 h-5 text-[#003580]" />
                            <span className="font-medium">My Bookings</span>
                          </button>

                          <button
                            onClick={() => {
                              handleNavigation("/account/personal");
                              setShowMobileMenu(false);
                            }}
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                          >
                            <User className="w-5 h-5 text-[#003580]" />
                            <span className="font-medium">Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              handleNavigation("/account/loyalty");
                              setShowMobileMenu(false);
                            }}
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                          >
                            <Award className="w-5 h-5 text-[#003580]" />
                            <span className="font-medium">Loyalty Program</span>
                          </button>

                          <button
                            onClick={() => {
                              handleNavigation("/account/payment");
                              setShowMobileMenu(false);
                            }}
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                          >
                            <CreditCard className="w-5 h-5 text-[#003580]" />
                            <span className="font-medium">
                              Payment & Wallet
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              handleNavigation("/account/preferences");
                              setShowMobileMenu(false);
                            }}
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                          >
                            <Settings className="w-5 h-5 text-[#003580]" />
                            <span className="font-medium">Settings</span>
                          </button>

                          <button
                            onClick={() => {
                              handleNavigation("/help-center");
                              setShowMobileMenu(false);
                            }}
                            className="flex items-center space-x-3 px-3 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                          >
                            <BookOpen className="w-5 h-5 text-[#003580]" />
                            <span className="font-medium">Help Centre</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Other Services Section */}
                    <div className="mb-6">
                      <div className="text-xs font-semibold text-gray-500 px-0 py-2 mb-3 uppercase tracking-wider">
                        Services
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            handleNavigation("/saved");
                            setShowMobileMenu(false);
                          }}
                          className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                        >
                          <Heart className="w-5 h-5 text-[#003580]" />
                          <span className="font-medium">Saved</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation("/help-support");
                            setShowMobileMenu(false);
                          }}
                          className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                        >
                          <Headphones className="w-5 h-5 text-[#003580]" />
                          <span className="font-medium">Help & Support</span>
                        </button>
                      </div>
                    </div>

                    {/* Currency Section */}
                    <div className="mb-6">
                      <div className="text-xs font-semibold text-gray-500 px-0 py-2 mb-3 uppercase tracking-wider flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-[#003580]" />
                        Currency
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Selected Currency
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {selectedCurrency.flag}
                            </span>
                            <span className="font-medium text-gray-900">
                              {selectedCurrency.name}
                            </span>
                          </div>
                          <span className="font-semibold text-[#003580]">
                            {selectedCurrency.symbol} {selectedCurrency.code}
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs text-gray-600 mb-2">
                            Change Currency:
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {currencies
                              .filter((c) => c.code !== selectedCurrency.code)
                              .slice(0, 3)
                              .map((currency) => (
                                <button
                                  key={currency.code}
                                  onClick={() => {
                                    setCurrency(currency);
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm flex items-center justify-between transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm">
                                      {currency.flag}
                                    </span>
                                    <span className="text-sm">
                                      {currency.name}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium">
                                    {currency.symbol} {currency.code}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </nav>

                  {/* Bottom Actions */}
                  <div className="px-4 pb-4">
                    {isLoggedIn ? (
                      <div className="space-y-3">
                        {/* Admin Links */}
                        <div className="border-t border-gray-200 pt-4 space-y-2">
                          <button
                            onClick={() => {
                              handleNavigation("/admin/login");
                              setShowMobileMenu(false);
                            }}
                            className="flex items-center space-x-3 px-3 py-2 text-[#003580] hover:bg-blue-50 rounded-lg w-full text-left"
                          >
                            <Shield className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Admin Panel
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              handleNavigation("/admin/api");
                              setShowMobileMenu(false);
                            }}
                            className="flex items-center space-x-3 px-3 py-2 text-[#003580] hover:bg-blue-50 rounded-lg w-full text-left"
                          >
                            <Code className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Live APIs
                            </span>
                          </button>
                        </div>

                        {/* Sign Out */}
                        <button
                          className="flex items-center justify-center space-x-2 w-full py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => {
                            handleSignOut();
                            setShowMobileMenu(false);
                          }}
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 border-t border-gray-200 pt-4">
                        <Button
                          className="w-full bg-[#003580] hover:bg-[#0071c2] text-white"
                          onClick={() => {
                            if (isModalTransitioning) return;
                            setShowMobileMenu(false);
                            setIsModalTransitioning(true);
                            setAuthModalMode("login");
                            setShowAuthModal(true);
                            setTimeout(() => setIsModalTransitioning(false), 200);
                          }}
                        >
                          Sign In
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-[#003580] text-[#003580] hover:bg-blue-50"
                          onClick={() => {
                            if (isModalTransitioning) return;
                            setShowMobileMenu(false);
                            setIsModalTransitioning(true);
                            setAuthModalMode("register");
                            setShowAuthModal(true);
                            setTimeout(() => setIsModalTransitioning(false), 200);
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
          </div>
        )}
      </div>

      {/* Desktop Layout (≥769px) */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <header className="text-white" style={{ backgroundColor: "#003580" }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F6610cbb1369a49b6a98ce99413f8d9ae?format=webp&width=800"
                  alt="Faredown Logo"
                  className="w-8 h-8 object-contain"
                  style={{
                    background: "none",
                    border: "none",
                    boxShadow: "none",
                  }}
                />
                <span className="text-xl font-medium text-white">
                  faredown.com
                </span>
              </Link>

              {/* Centered Navigation */}
              <nav className="flex items-center space-x-6 lg:space-x-8 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
                <button
                  onClick={() => handleTabChange("hotels")}
                  className={cn(
                    "text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4",
                    activeTab === "hotels" && "border-b-2 border-white",
                  )}
                >
                  <span>Hotels</span>
                </button>
                <button
                  onClick={() => handleTabChange("flights")}
                  className={cn(
                    "text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4",
                    activeTab === "flights" && "border-b-2 border-white",
                  )}
                >
                  <span>Flights</span>
                </button>
                <button
                  onClick={() => handleTabChange("sightseeing")}
                  className={cn(
                    "text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4",
                    activeTab === "sightseeing" && "border-b-2 border-white",
                  )}
                >
                  <span>Sightseeing</span>
                </button>
                <button
                  onClick={() => handleTabChange("transfers")}
                  className={cn(
                    "text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4",
                    activeTab === "transfers" && "border-b-2 border-white",
                  )}
                >
                  <span>Transfers</span>
                </button>
              </nav>

              <div className="flex items-center space-x-2 md:space-x-6">
                {/* Currency */}
                <div className="flex items-center space-x-4 text-sm">
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
                  {/* Desktop Notifications Bell */}
                  {isLoggedIn && (
                    <div className="relative">
                      <button
                        className="p-2 relative hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors"
                        onClick={() => {
                          setShowNotifications(!showNotifications);
                          setShowCurrencyDropdown(false);
                        }}
                      >
                        <Bell className="w-5 h-5 text-white" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg"></span>
                      </button>

                      {/* Desktop Notifications Dropdown */}
                      {showNotifications && (
                        <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-xl w-80 max-h-96 overflow-hidden z-50">
                          <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                              <span className="text-lg font-bold text-gray-900">
                                Notifications
                              </span>
                              <button
                                onClick={() => setShowNotifications(false)}
                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-80 overflow-y-auto">
                              <div className="space-y-1">
                                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100">
                                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      Booking Confirmed
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Your hotel booking in Dubai has been
                                      confirmed.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      2 hours ago
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100">
                                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Plane className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      Flight Update
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Your flight departure time has been
                                      updated.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      5 hours ago
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100">
                                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <Clock className="w-3 h-3 text-yellow-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      Check-in Reminder
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Don't forget to check-in for your flight
                                      tomorrow.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      1 day ago
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 p-3">
                              <button
                                onClick={() => {
                                  setShowNotifications(false);
                                  handleNavigation(
                                    "/account?tab=notifications",
                                  );
                                }}
                                className="w-full text-center text-sm text-[#003580] font-medium hover:text-[#0071c2]"
                              >
                                View All Notifications
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                          <Link
                            to="/account/trips"
                            className="flex items-center"
                          >
                            <Plane className="w-4 h-4 mr-2" />
                            My Bookings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account/personal"
                            className="flex items-center"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account/loyalty"
                            className="flex items-center"
                          >
                            <Award className="w-4 h-4 mr-2" />
                            Loyalty Program
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account/payment"
                            className="flex items-center"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Payment & Wallet
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account/preferences"
                            className="flex items-center"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link to="/help-center" className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Help Centre
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign out
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link to="/admin/login" className="flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link to="/admin/api" className="flex items-center">
                            <Code className="w-4 h-4 mr-2" />
                            Live APIs
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600 transition-colors px-6 py-2 h-9 font-medium"
                        onClick={() => {
                          if (isModalTransitioning) return;
                          setIsModalTransitioning(true);
                          setAuthModalMode("register");
                          setShowAuthModal(true);
                          setTimeout(() => setIsModalTransitioning(false), 200);
                        }}
                      >
                        Register
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-2 h-9 font-medium rounded-md"
                        onClick={() => {
                          if (isModalTransitioning) return;
                          setIsModalTransitioning(true);
                          setAuthModalMode("login");
                          setShowAuthModal(true);
                          setTimeout(() => setIsModalTransitioning(false), 200);
                        }}
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
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setAuthModalMode("login");
          setIsModalTransitioning(false);
        }}
        initialMode={authModalMode}
      />
    </>
  );
}
