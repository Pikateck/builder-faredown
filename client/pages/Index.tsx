import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MobileCityDropdown,
  MobileDatePicker,
  MobileTravelers,
} from "@/components/MobileDropdowns";
import {
  formatDateToDDMMMYYYY,
  formatDateToDisplayString,
} from "@/lib/dateUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { BookingCalendar } from "@/components/BookingCalendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plane,
  Search,
  Shield,
  Clock,
  TrendingUp,
  Headphones,
  CheckCircle,
  MessageCircle,
  Settings,
  Smartphone,
  BarChart3,
  Bell,
  DollarSign,
  MapPin,
  Star,
  Users,
  Phone,
  ArrowRight,
  Play,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  BookOpen,
  Award,
  CreditCard,
  Heart,
  LogOut,
  Menu,
  Code,
} from "lucide-react";
import { downloadProjectInfo } from "@/lib/codeExport";

export default function Index() {
  const [departureDate, setDepartureDate] = useState<Date>();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);


  // Auth form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [authError, setAuthError] = useState("");

  // Test credentials - hardcoded for demo
  const testCredentials = {
    email: "test@faredown.com",
    password: "password123",
    name: "Zubin Aibara",
  };

  // Authentication functions
  const handleSignIn = () => {
    setAuthError("");
    if (
      loginEmail === testCredentials.email &&
      loginPassword === testCredentials.password
    ) {
      setIsLoggedIn(true);
      setUserName(testCredentials.name);
      setShowSignIn(false);
      setLoginEmail("");
      setLoginPassword("");
    } else {
      setAuthError("Invalid email or password");
    }
  };

  const handleRegister = () => {
    setAuthError("");
    if (
      registerEmail &&
      registerPassword &&
      registerFirstName &&
      registerLastName
    ) {
      if (registerPassword.length < 8) {
        setAuthError("Password must be at least 8 characters long");
        return;
      }
      setIsLoggedIn(true);
      setUserName(`${registerFirstName} ${registerLastName}`);
      setShowRegister(false);
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterFirstName("");
      setRegisterLastName("");
    } else {
      setAuthError("Please fill in all fields");
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
  };
  const [returnDate, setReturnDate] = useState<Date>();
  const [tripType, setTripType] = useState<
    "round-trip" | "one-way" | "multi-city"
  >("round-trip");
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState("Economy");
  const [showFromCities, setShowFromCities] = useState(false);
  const [showToCities, setShowToCities] = useState(false);
  const [selectedFromCity, setSelectedFromCity] = useState("Mumbai");
  const [selectedToCity, setSelectedToCity] = useState("Dubai");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTravelers, setShowTravelers] = useState(false);
  const [travelers, setTravelers] = useState({ adults: 1, children: 0 });

  // Live calendar states
  const today = new Date();
  const [selectedDepartureDate, setSelectedDepartureDate] =
    useState<Date | null>(null);
  const [selectedReturnDate, setSelectedReturnDate] = useState<Date | null>(
    null,
  );
  const [selectingDeparture, setSelectingDeparture] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Calendar helper functions
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  };

  const getMonthName = (month: number) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[month];
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateInRange = (
    date: Date,
    startDate: Date | null,
    endDate: Date | null,
  ) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateEqual = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleDateClick = (day: number, month: number, year: number) => {
    const clickedDate = new Date(year, month, day);
    clickedDate.setHours(0, 0, 0, 0); // Normalize time

    if (tripType === "one-way") {
      setSelectedDepartureDate(clickedDate);
      setShowCalendar(false);
    } else {
      // For round-trip bookings (hotels)
      if (selectingDeparture || !selectedDepartureDate) {
        // Selecting check-in date - always start fresh
        setSelectedDepartureDate(clickedDate);
        setSelectedReturnDate(null); // Clear any existing return date
        setSelectingDeparture(false); // Now we'll select check-out date
      } else {
        // Selecting check-out date
        if (clickedDate <= selectedDepartureDate) {
          // If clicked date is before or same as check-in, start over with new check-in
          setSelectedDepartureDate(clickedDate);
          setSelectedReturnDate(null);
          setSelectingDeparture(false);
        } else {
          // Valid check-out date (after check-in)
          setSelectedReturnDate(clickedDate);
          setShowCalendar(false); // Close calendar after selecting both dates
        }
      }
    }
  };
  const [selectedCurrency, setSelectedCurrency] = useState({
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
  });

  // City data mapping
  const cityData = {
    Mumbai: {
      code: "BOM",
      name: "Mumbai",
      airport: "Rajiv Gandhi Shivaji International",
      fullName: "Mumbai, Maharashtra, India",
    },
    Delhi: {
      code: "DEL",
      name: "Delhi",
      airport: "Indira Gandhi International",
      fullName: "New Delhi, Delhi, India",
    },
    Dubai: {
      code: "DXB",
      name: "Dubai",
      airport: "Dubai International Airport",
      fullName: "Dubai, United Arab Emirates",
    },
    "Abu Dhabi": {
      code: "AUH",
      name: "Abu Dhabi",
      airport: "Zayed International",
      fullName: "Abu Dhabi, United Arab Emirates",
    },
    Singapore: {
      code: "SIN",
      name: "Singapore",
      airport: "Changi Airport",
      fullName: "Singapore, Singapore",
    },
  };

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      }}
    >
      {/* Header */}
      <header
        className="text-white sticky top-0 z-40"
        style={{ backgroundColor: "#003580" }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                faredown.com
              </span>
            </Link>

            {/* Centered Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
              <Link
                to="/"
                className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold border-b-2 border-white py-3 lg:py-4"
              >
                <span>Flights</span>
              </Link>
              <Link
                to="/hotels"
                className="text-white hover:text-blue-200 cursor-pointer flex items-center py-3 lg:py-4"
              >
                <span>Hotels</span>
              </Link>
              <Link
                to="/sightseeing"
                className="text-white hover:text-blue-200 cursor-pointer flex items-center py-3 lg:py-4"
              >
                <span>Sightseeing</span>
              </Link>
              <Link
                to="/transfers"
                className="text-white hover:text-blue-200 cursor-pointer flex items-center py-3 lg:py-4"
              >
                <span>Transfers</span>
              </Link>
            </nav>

            <div className="flex items-center space-x-2 md:space-x-6">
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-white p-2 touch-manipulation"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Language and Currency */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
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
                        { code: "USD", symbol: "$", name: "US Dollar" },
                        { code: "EUR", symbol: "€", name: "Euro" },
                        { code: "GBP", symbol: "£", name: "British Pound" },
                        { code: "INR", symbol: "₹", name: "Indian Rupee" },
                        { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
                        { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
                        { code: "JPY", symbol: "¥", name: "Japanese Yen" },
                        { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
                        { code: "KRW", symbol: "₩", name: "South Korean Won" },
                        { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
                        {
                          code: "AUD",
                          symbol: "A$",
                          name: "Australian Dollar",
                        },
                        { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
                        { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
                        { code: "THB", symbol: "฿", name: "Thai Baht" },
                        {
                          code: "MYR",
                          symbol: "RM",
                          name: "Malaysian Ringgit",
                        },
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
                {isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center space-x-2 bg-blue-600 rounded-full px-2 md:px-3 py-2 hover:bg-blue-800">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-black">
                          {userName.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-white hidden sm:inline">
                        {userName}
                      </span>
                      <span className="text-xs text-yellow-300 hidden md:inline">
                        Loyalty Level 1
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <Link to="/account" className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          My account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link to="/account/trips" className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Bookings & Trips
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Award className="w-4 h-4 mr-2" />
                        Loyalty program
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link
                          to="/account/payment"
                          className="flex items-center"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Rewards & Wallet
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={downloadProjectInfo}
                        className="border-t mt-1 pt-2"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        Download Code Info
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white text-blue-700 border-white hover:bg-gray-100 rounded text-xs md:text-sm font-medium px-2 md:px-4 py-1.5"
                      onClick={() => setShowRegister(true)}
                    >
                      Register
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-800 text-white rounded text-xs md:text-sm font-medium px-2 md:px-4 py-1.5"
                      onClick={() => setShowSignIn(true)}
                    >
                      Sign in
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="md:hidden bg-blue-800 border-t border-blue-600 absolute w-full z-50">
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/flights"
                className="flex items-center space-x-2 text-white py-3 px-2 rounded hover:bg-blue-700 border-b border-blue-600"
                onClick={() => setShowMobileMenu(false)}
              >
                <Plane className="w-4 h-4" />
                <span>Flights</span>
              </Link>
              <Link
                to="/hotels"
                className="flex items-center space-x-2 text-white py-3 px-2 rounded hover:bg-blue-700 border-b border-blue-600"
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="w-4 h-4" />
                <span>Hotels</span>
              </Link>
              {isLoggedIn && (
                <Link
                  to="/my-account"
                  className="flex items-center space-x-2 text-white py-3 px-2 rounded hover:bg-blue-700"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-4 h-4" />
                  <span>My Account</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Hero Search Section */}
        <div
          className="py-3 sm:py-6 md:py-8 pb-24 sm:pb-8"
          style={{ backgroundColor: "#003580" }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-4 sm:mb-6">
              <div className="mb-3 sm:mb-5">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  Upgrade. Bargain. Book.
                </h2>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-3 sm:mb-4 leading-tight px-2 opacity-95">
                Faredown is the world's first travel portal where you control
                the price — for flights and hotels.
              </h1>
              <p className="text-white text-sm sm:text-base md:text-lg opacity-80 mb-3 sm:mb-4 px-4">
                Don't Just Book It. <strong>Bargain It™.</strong>
              </p>
              <p className="text-white text-xs sm:text-sm opacity-70">
                Join 50M+ travelers who bargain for more.
              </p>
            </div>

            {/* Dynamic Search Form - Hidden on mobile, shown in sticky bottom */}
            <div className="hidden sm:block rounded-t-lg">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 overflow-visible">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center bg-white rounded-lg p-2 sm:p-3 flex-1 w-full border sm:border-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-6 w-full sm:w-auto">
                      <button
                        onClick={() => setTripType("round-trip")}
                        className="flex items-center space-x-2"
                      >
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full border-2",
                            tripType === "round-trip"
                              ? "bg-blue-600 border-white ring-1 ring-blue-600"
                              : "border-gray-300",
                          )}
                        ></div>
                        <span
                          className={cn(
                            "text-sm",
                            tripType === "round-trip"
                              ? "font-medium text-gray-900"
                              : "text-gray-500",
                          )}
                        >
                          Round trip
                        </span>
                      </button>
                      <button
                        onClick={() => setTripType("one-way")}
                        className="flex items-center space-x-2"
                      >
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full border-2",
                            tripType === "one-way"
                              ? "bg-blue-600 border-white ring-1 ring-blue-600"
                              : "border-gray-300",
                          )}
                        ></div>
                        <span
                          className={cn(
                            "text-sm",
                            tripType === "one-way"
                              ? "font-medium text-gray-900"
                              : "text-gray-500",
                          )}
                        >
                          One way
                        </span>
                      </button>
                      <button
                        onClick={() => setTripType("multi-city")}
                        className="flex items-center space-x-2"
                      >
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full border-2",
                            tripType === "multi-city"
                              ? "bg-blue-600 border-white ring-1 ring-blue-600"
                              : "border-gray-300",
                          )}
                        ></div>
                        <span
                          className={cn(
                            "text-sm",
                            tripType === "multi-city"
                              ? "font-medium text-gray-900"
                              : "text-gray-500",
                          )}
                        >
                          Multi-city
                        </span>
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowClassDropdown(!showClassDropdown)
                          }
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                        >
                          <div className="w-3 h-3 border-2 border-gray-300 rounded-full"></div>
                          <span className="text-sm text-gray-500">
                            {selectedClass}
                          </span>
                          <ChevronDown className="w-3 h-3 text-gray-500" />
                        </button>
                        {showClassDropdown && (
                          <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-[9999] w-48">
                            {[
                              "Economy",
                              "Premium Economy",
                              "Business",
                              "First Class",
                            ].map((classType) => (
                              <button
                                key={classType}
                                onClick={() => {
                                  setSelectedClass(classType);
                                  setShowClassDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                              >
                                {classType}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search inputs */}
                <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-2 mt-2 w-full max-w-5xl overflow-visible">
                  <div className="relative flex-1 lg:max-w-xs w-full lg:w-auto">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                      Leaving from
                    </label>
                    <button
                      onClick={() => setShowFromCities(!showFromCities)}
                      className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500 focus:border-blue-500 touch-manipulation"
                    >
                      <Plane className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700 font-medium">
                        Leaving from
                      </span>
                    </button>

                    {showFromCities && (
                      <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            Airport, city or country
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
                                    ✈
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {city} • {data.airport}
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

                  <div className="relative flex-1 lg:max-w-xs w-full lg:w-auto">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                      Going to
                    </label>
                    <button
                      onClick={() => setShowToCities(!showToCities)}
                      className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500 focus:border-blue-500 touch-manipulation"
                    >
                      <Plane className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700 font-medium">
                        Going to
                      </span>
                    </button>

                    {showToCities && (
                      <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            Airport, city or country
                          </h3>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Dubai"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          {Object.entries(cityData).map(([city, data]) => (
                            <button
                              key={city}
                              onClick={() => {
                                setSelectedToCity(city);
                                setShowToCities(false);
                              }}
                              className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-600">
                                    ✈
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {city} • {data.airport}
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

                  <div className="relative overflow-visible lg:max-w-[200px] w-full lg:w-auto">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                      Travel dates
                    </label>
                    <button
                      onClick={() => {
                        if (!showCalendar) {
                          // Reset selection state when opening calendar
                          setSelectingDeparture(true);
                          // Ensure we start with a clean state
                          setCurrentMonth(new Date().getMonth());
                          setCurrentYear(new Date().getFullYear());
                        }
                        setShowCalendar(!showCalendar);
                      }}
                      className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full min-w-[180px] hover:border-blue-500 touch-manipulation"
                    >
                      <svg
                        className="w-4 h-4 text-gray-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 font-medium">
                        {tripType === "one-way"
                          ? formatDate(selectedDepartureDate) || "Select date"
                          : selectedDepartureDate
                            ? `${formatDate(selectedDepartureDate)} ${selectedReturnDate ? `- ${formatDate(selectedReturnDate)}` : "- Return"}`
                            : "Select dates"}
                      </span>
                    </button>

                    {showCalendar && (
                      <div className="absolute top-14 left-0 right-0 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-2xl z-[9999] w-full sm:w-[700px] max-w-[700px] overflow-hidden">
                        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
                          <button
                            onClick={() => navigateMonth("prev")}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                          </button>
                          <div className="flex space-x-16">
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {getMonthName(currentMonth)} {currentYear}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {getMonthName(
                                  currentMonth === 11 ? 0 : currentMonth + 1,
                                )}{" "}
                                {currentMonth === 11
                                  ? currentYear + 1
                                  : currentYear}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => navigateMonth("next")}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-gray-200">
                          {/* Current Month Calendar */}
                          <div className="p-4">
                            <div className="grid grid-cols-7 gap-1 mb-3">
                              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                                (day) => (
                                  <div
                                    key={day}
                                    className="text-center py-2 text-xs font-medium text-gray-500"
                                  >
                                    {day}
                                  </div>
                                ),
                              )}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: 42 }, (_, i) => {
                                const firstDay = getFirstDayOfMonth(
                                  currentMonth,
                                  currentYear,
                                );
                                const daysInMonth = getDaysInMonth(
                                  currentMonth,
                                  currentYear,
                                );
                                const day = i - firstDay + 1;
                                const isValidDay =
                                  day >= 1 && day <= daysInMonth;
                                const currentDate = isValidDay
                                  ? new Date(currentYear, currentMonth, day)
                                  : null;
                                const isPastDate =
                                  currentDate &&
                                  currentDate < today &&
                                  !isDateEqual(currentDate, today);

                                if (!isValidDay) {
                                  return <div key={i} className="h-10"></div>;
                                }

                                const isDeparture = isDateEqual(
                                  currentDate,
                                  selectedDepartureDate,
                                );
                                const isReturn = isDateEqual(
                                  currentDate,
                                  selectedReturnDate,
                                );
                                const isInRange =
                                  selectedDepartureDate &&
                                  selectedReturnDate &&
                                  currentDate &&
                                  isDateInRange(
                                    currentDate,
                                    selectedDepartureDate,
                                    selectedReturnDate,
                                  ) &&
                                  !isDeparture &&
                                  !isReturn;
                                const isToday = isDateEqual(currentDate, today);

                                return (
                                  <button
                                    key={i}
                                    disabled={isPastDate}
                                    onClick={() =>
                                      handleDateClick(
                                        day,
                                        currentMonth,
                                        currentYear,
                                      )
                                    }
                                    className={cn(
                                      "h-10 w-10 text-sm font-medium flex items-center justify-center hover:bg-gray-100 transition-colors rounded relative",
                                      isPastDate &&
                                        "text-gray-300 cursor-not-allowed hover:bg-transparent",
                                      isToday &&
                                        !isDeparture &&
                                        !isReturn &&
                                        "bg-gray-100 font-semibold",
                                      isDeparture &&
                                        "bg-gray-900 text-white hover:bg-gray-800",
                                      isReturn &&
                                        "bg-gray-900 text-white hover:bg-gray-800",
                                      isInRange && "bg-gray-100 text-gray-700",
                                      !isPastDate &&
                                        !isDeparture &&
                                        !isReturn &&
                                        !isInRange &&
                                        !isToday &&
                                        "text-gray-900",
                                    )}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Next Month Calendar */}
                          <div className="p-4">
                            <div className="grid grid-cols-7 gap-1 mb-3">
                              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                                (day) => (
                                  <div
                                    key={day}
                                    className="text-center py-2 text-xs font-medium text-gray-500"
                                  >
                                    {day}
                                  </div>
                                ),
                              )}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: 42 }, (_, i) => {
                                const nextMonth =
                                  currentMonth === 11 ? 0 : currentMonth + 1;
                                const nextYear =
                                  currentMonth === 11
                                    ? currentYear + 1
                                    : currentYear;
                                const firstDay = getFirstDayOfMonth(
                                  nextMonth,
                                  nextYear,
                                );
                                const daysInMonth = getDaysInMonth(
                                  nextMonth,
                                  nextYear,
                                );
                                const day = i - firstDay + 1;
                                const isValidDay =
                                  day >= 1 && day <= daysInMonth;
                                const currentDate = isValidDay
                                  ? new Date(nextYear, nextMonth, day)
                                  : null;
                                const isPastDate =
                                  currentDate &&
                                  currentDate < today &&
                                  !isDateEqual(currentDate, today);

                                if (!isValidDay) {
                                  return <div key={i} className="h-10"></div>;
                                }

                                const isDeparture = isDateEqual(
                                  currentDate,
                                  selectedDepartureDate,
                                );
                                const isReturn = isDateEqual(
                                  currentDate,
                                  selectedReturnDate,
                                );
                                const isInRange =
                                  selectedDepartureDate &&
                                  selectedReturnDate &&
                                  currentDate &&
                                  isDateInRange(
                                    currentDate,
                                    selectedDepartureDate,
                                    selectedReturnDate,
                                  ) &&
                                  !isDeparture &&
                                  !isReturn;
                                const isToday = isDateEqual(currentDate, today);

                                return (
                                  <button
                                    key={i}
                                    disabled={isPastDate}
                                    onClick={() =>
                                      handleDateClick(day, nextMonth, nextYear)
                                    }
                                    className={cn(
                                      "h-10 w-10 text-sm font-medium flex items-center justify-center hover:bg-gray-100 transition-colors rounded relative",
                                      isPastDate &&
                                        "text-gray-300 cursor-not-allowed hover:bg-transparent",
                                      isToday &&
                                        !isDeparture &&
                                        !isReturn &&
                                        "bg-gray-100 font-semibold",
                                      isDeparture &&
                                        "bg-gray-900 text-white hover:bg-gray-800",
                                      isReturn &&
                                        "bg-gray-900 text-white hover:bg-gray-800",
                                      isInRange && "bg-gray-100 text-gray-700",
                                      !isPastDate &&
                                        !isDeparture &&
                                        !isReturn &&
                                        !isInRange &&
                                        !isToday &&
                                        "text-gray-900",
                                    )}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Calendar Instructions */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-gray-900 rounded"></div>
                                <span>Selected</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                                <span>Range</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-gray-100 border border-gray-400 rounded"></div>
                                <span>Today</span>
                              </div>
                              {(selectedDepartureDate ||
                                selectedReturnDate) && (
                                <button
                                  onClick={() => {
                                    setSelectedDepartureDate(null);
                                    setSelectedReturnDate(null);
                                    setSelectingDeparture(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                                >
                                  Clear dates
                                </button>
                              )}
                            </div>
                            {tripType === "round-trip" && (
                              <span>
                                {selectingDeparture
                                  ? "Select check-in date"
                                  : "Select check-out date"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative lg:max-w-[150px] w-full lg:w-auto">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                      Travelers
                    </label>
                    <button
                      onClick={() => setShowTravelers(!showTravelers)}
                      className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full min-w-[120px] hover:border-blue-500 touch-manipulation"
                    >
                      <svg
                        className="w-4 h-4 text-gray-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 font-medium">
                        {travelers.adults} adult
                        {travelers.adults > 1 ? "s" : ""}
                        {travelers.children > 0
                          ? `, ${travelers.children} child${travelers.children > 1 ? "ren" : ""}`
                          : ""}
                      </span>
                    </button>

                    {showTravelers && (
                      <div className="absolute top-14 left-0 right-0 sm:right-0 sm:left-auto bg-white border border-gray-300 rounded-md shadow-xl p-4 z-50 w-full sm:w-72">
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

                  <div className="lg:max-w-[100px] w-full lg:w-auto">
                    <Link
                      to={`/flights/results?adults=${travelers.adults}&children=${travelers.children}`}
                      className="w-full"
                    >
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded h-12 font-medium text-sm w-full touch-manipulation">
                        Search
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Search Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setShowFromCities(!showFromCities)}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-4 border touch-manipulation"
            >
              <div className="flex items-center space-x-2">
                <Plane className="w-4 h-4 text-gray-500" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">From</div>
                  <div className="text-sm font-medium text-gray-900">
                    {cityData[selectedFromCity]?.code}
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setShowToCities(!showToCities)}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-4 border touch-manipulation"
            >
              <div className="flex items-center space-x-2">
                <Plane className="w-4 h-4 text-gray-500" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">To</div>
                  <div className="text-sm font-medium text-gray-900">
                    {cityData[selectedToCity]?.code}
                  </div>
                </div>
              </div>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => {
                if (!showCalendar) {
                  // Reset selection state when opening calendar
                  setSelectingDeparture(true);
                  // Ensure we start with a clean state
                  setCurrentMonth(new Date().getMonth());
                  setCurrentYear(new Date().getFullYear());
                }
                setShowCalendar(!showCalendar);
              }}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-4 border touch-manipulation"
            >
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">Dates</div>
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {tripType === "one-way"
                      ? selectedDepartureDate
                        ? formatDate(selectedDepartureDate).split("-")[0]
                        : "Select"
                      : selectedDepartureDate
                        ? `${formatDate(selectedDepartureDate).split("-")[0]} ${selectedReturnDate ? `- ${formatDate(selectedReturnDate).split("-")[0]}` : "- Return"}`
                        : "Select dates"}
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setShowTravelers(!showTravelers)}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-4 border touch-manipulation"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">Travelers</div>
                  <div className="text-sm font-medium text-gray-900">
                    {travelers.adults + travelers.children}
                  </div>
                </div>
              </div>
            </button>
          </div>
          <Link
            to={`/flights/results?adults=${travelers.adults}&children=${travelers.children}`}
            className="w-full"
          >
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-base touch-manipulation">
              Search Flights
            </Button>
          </Link>
        </div>
      </div>

      {/* Why Choose Faredown Section */}
      <section className="py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Faredown Is Reinventing Travel Booking
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
                Negotiate upgrades instantly — from economy to business, from
                standard to suite.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Pay What You Feel Is Fair
              </h3>
              <p className="text-gray-600 text-sm">
                Set your price and let Faredown try to get it for you — no more
                overpaying.
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

      {/* Why Travelers Love Faredown */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#003580] mb-8">
                Why travelers
                <br />
                love Faredown
              </h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#003580] rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Best Price Guarantee
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Find a better price elsewhere? We'll match it and give you
                      an extra 5% off your next booking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#003580] rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Instant Confirmation
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Get instant booking confirmations and e-tickets delivered
                      to your inbox immediately.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#003580] rounded-full flex items-center justify-center flex-shrink-0">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Flexible Booking Options
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Change or cancel your bookings easily with our flexible
                      policies and get refunds quickly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-[#003580] text-white p-8 rounded-lg">
                <div className="absolute top-4 right-4">
                  <div className="bg-white text-[#003580] px-3 py-1 rounded-full text-sm font-semibold">
                    4.8★
                  </div>
                </div>
                <div className="text-right mb-4 text-sm">24M+ reviews</div>
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop"
                    alt="Customer support team"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Top-Rated Customer Support
                  </h3>
                  <p className="text-sm opacity-90 mb-4">
                    Our award-winning support team is available 24/7 to help
                    with any booking questions or changes.
                  </p>
                  <Button className="bg-white text-[#003580] hover:bg-gray-100">
                    Get Help Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile dropdowns */}
      <MobileCityDropdown
        isOpen={showFromCities}
        onClose={() => setShowFromCities(false)}
        title="Select departure city"
        cities={cityData}
        selectedCity={selectedFromCity}
        onSelectCity={(city) => {
          setSelectedFromCity(city);
          setShowFromCities(false);
        }}
      />

      <MobileCityDropdown
        isOpen={showToCities}
        onClose={() => setShowToCities(false)}
        title="Select destination city"
        cities={cityData}
        selectedCity={selectedToCity}
        onSelectCity={(city) => {
          setSelectedToCity(city);
          setShowToCities(false);
        }}
      />

      <MobileDatePicker
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        tripType={tripType === "one-way" ? "one-way" : "round-trip"}
        selectedDepartureDate={selectedDepartureDate}
        selectedReturnDate={selectedReturnDate}
        setSelectedDepartureDate={setSelectedDepartureDate}
        setSelectedReturnDate={setSelectedReturnDate}
        selectingDeparture={selectingDeparture}
        setSelectingDeparture={setSelectingDeparture}
      />

      <MobileTravelers
        isOpen={showTravelers}
        onClose={() => setShowTravelers(false)}
        travelers={travelers}
        setTravelers={setTravelers}
      />

      {/* Sign In Modal */}
      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to Faredown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="test@faredown.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="password123"
                className="w-full"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-600">
                <strong>Demo credentials:</strong>
                <br />
                Email: test@faredown.com
                <br />
                Password: password123
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleSignIn}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSignIn(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  setShowSignIn(false);
                  setShowRegister(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Don't have an account? Register
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create your Faredown account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  type="text"
                  value={registerFirstName}
                  onChange={(e) => setRegisterFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  type="text"
                  value={registerLastName}
                  onChange={(e) => setRegisterLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full"
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleRegister}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Account
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRegister(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  setShowRegister(false);
                  setShowSignIn(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
