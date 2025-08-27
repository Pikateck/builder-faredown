import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  const [showMobileUserDropdown, setShowMobileUserDropdown] = useState(false);

  // User state
  const userName = user?.name || "Zubin Aibara";

  // Get active tab from URL
  const getActiveTab = () => {
    // Check actual route paths first
    if (location.pathname === "/" || location.pathname === "/flights")
      return "flights";
    if (location.pathname.includes("/hotels")) return "hotels";
    if (location.pathname.includes("/sightseeing")) return "sightseeing";
    if (location.pathname.includes("/transfers")) return "transfers";

    // Fallback to query parameters for backward compatibility
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab) return tab;

    return "flights";
  };

  const activeTab = getActiveTab();

  // Handle tab change
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case "flights":
        navigate("/flights");
        break;
      case "hotels":
        navigate("/hotels");
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
                <img src="/images/faredown-icon.png" alt="Faredown" className="w-8 h-8" />
                <span className="text-xl font-bold text-white">faredown.com</span>
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
                    {/* Account Section */}
                    <div className="mb-6">
                      <div className="text-xs font-semibold text-gray-500 px-4 py-2 mb-2 uppercase tracking-wider">
                        My Account
                      </div>

                      <button
                        onClick={() => {
                          handleNavigation("/account?tab=bookings");
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                      >
                        <Plane className="w-5 h-5 text-[#003580]" />
                        <span className="font-medium">My Bookings</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNavigation("/account?tab=profile");
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-5 h-5 text-[#003580]" />
                        <span className="font-medium">Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNavigation("/account?tab=loyalty");
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                      >
                        <Award className="w-5 h-5 text-[#003580]" />
                        <span className="font-medium">Loyalty Program</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNavigation("/account?tab=payment");
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                      >
                        <CreditCard className="w-5 h-5 text-[#003580]" />
                        <span className="font-medium">Payment & Wallet</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNavigation("/account?tab=settings");
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-5 h-5 text-[#003580]" />
                        <span className="font-medium">Settings</span>
                      </button>
                    </div>

                    {/* Other Services Section */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="text-xs font-semibold text-gray-500 px-4 py-2 mb-2 uppercase tracking-wider">
                        Other Services
                      </div>

                      <button
                        onClick={() => {
                          handleNavigation("/saved");
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                      >
                        <Heart className="w-5 h-5 text-[#003580]" />
                        <span className="font-medium">Saved</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNavigation("/help");
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                      >
                        <BookOpen className="w-5 h-5 text-[#003580]" />
                        <span className="font-medium">Help Center</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNavigation("/help-support");
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                      >
                        <Headphones className="w-5 h-5 text-[#003580]" />
                        <span className="font-medium">Help & Support</span>
                      </button>
                    </div>

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
                  </nav>

                  {/* User Section */}
                  {isLoggedIn ? (
                    <div className="mt-8 px-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        {/* User Profile Button */}
                        <button
                          className="flex items-center justify-between w-full mb-3 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                          onClick={() =>
                            setShowMobileUserDropdown(!showMobileUserDropdown)
                          }
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#003580] rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {userName.charAt(0)}
                              </span>
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-gray-900">
                                {userName}
                              </div>
                              <div className="text-sm text-gray-600">
                                Loyalty Level 1
                              </div>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-500 transition-transform ${showMobileUserDropdown ? "rotate-180" : ""}`}
                          />
                        </button>

                        {/* User Dropdown Menu */}
                        {showMobileUserDropdown && (
                          <div className="space-y-1 border-t border-gray-200 pt-3 mb-3">
                            <button
                              onClick={() => {
                                handleNavigation("/account?tab=bookings");
                                setShowMobileMenu(false);
                                setShowMobileUserDropdown(false);
                              }}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-blue-100"
                            >
                              <Plane className="w-4 h-4 text-[#003580]" />
                              <span className="text-sm font-medium">
                                My Bookings
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                handleNavigation("/account?tab=profile");
                                setShowMobileMenu(false);
                                setShowMobileUserDropdown(false);
                              }}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-blue-100"
                            >
                              <User className="w-4 h-4 text-[#003580]" />
                              <span className="text-sm font-medium">
                                Profile
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                handleNavigation("/account?tab=loyalty");
                                setShowMobileMenu(false);
                                setShowMobileUserDropdown(false);
                              }}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-blue-100"
                            >
                              <Award className="w-4 h-4 text-[#003580]" />
                              <span className="text-sm font-medium">
                                Loyalty Program
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                handleNavigation("/account?tab=payment");
                                setShowMobileMenu(false);
                                setShowMobileUserDropdown(false);
                              }}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-blue-100"
                            >
                              <CreditCard className="w-4 h-4 text-[#003580]" />
                              <span className="text-sm font-medium">
                                Payment & Wallet
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                handleNavigation("/account?tab=settings");
                                setShowMobileMenu(false);
                                setShowMobileUserDropdown(false);
                              }}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-blue-100"
                            >
                              <Settings className="w-4 h-4 text-[#003580]" />
                              <span className="text-sm font-medium">
                                Settings
                              </span>
                            </button>
                          </div>
                        )}

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
                          setShowMobileMenu(false);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-[#003580] text-[#003580] hover:bg-blue-50"
                        onClick={() => {
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


        {/* Notifications Dropdown - Mobile */}
        {showNotifications && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowNotifications(false)}
            />
            <div className="fixed top-16 right-4 bg-white rounded-lg shadow-xl border border-gray-200 w-80">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">2</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Flight Deal Alert</p>
                      <p className="text-xs text-gray-600">Mumbai to Dubai from ₹12,999</p>
                      <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Booking Reminder</p>
                      <p className="text-xs text-gray-600">Complete your hotel booking</p>
                      <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                    </div>
                  </div>
                  <div className="text-center pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All Notifications
                    </button>
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
                <img src="/images/faredown-icon.png" alt="Faredown" className="w-8 h-8" />
                <span className="text-xl font-bold text-white">faredown.com</span>
              </Link>

              {/* Centered Navigation */}
              <nav className="flex items-center space-x-6 lg:space-x-8 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
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
                  onClick={() => handleTabChange("hotels")}
                  className={cn(
                    "text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4",
                    activeTab === "hotels" && "border-b-2 border-white",
                  )}
                >
                  <span>Hotels</span>
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
                <button
                  onClick={() => handleNavigation("/help-center")}
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4"
                >
                  <span>Help Center</span>
                </button>
              </nav>

              <div className="flex items-center space-x-2 md:space-x-6">
                {/* Currency */}
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
                          <Link
                            to="/account?tab=bookings"
                            className="flex items-center"
                          >
                            <Plane className="w-4 h-4 mr-2" />
                            My Bookings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account?tab=profile"
                            className="flex items-center"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account?tab=loyalty"
                            className="flex items-center"
                          >
                            <Award className="w-4 h-4 mr-2" />
                            Loyalty Program
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account?tab=payment"
                            className="flex items-center"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Payment & Wallet
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
      </div>
    </>
  );
}
