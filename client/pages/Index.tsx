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
      // For round-trip bookings
      if (selectingDeparture || !selectedDepartureDate) {
        // Selecting departure date - always start fresh
        setSelectedDepartureDate(clickedDate);
        setSelectedReturnDate(null); // Clear any existing return date
        setSelectingDeparture(false); // Now we'll select return date
      } else {
        // Selecting return date
        if (clickedDate <= selectedDepartureDate) {
          // If clicked date is before or same as departure, start over with new departure
          setSelectedDepartureDate(clickedDate);
          setSelectedReturnDate(null);
          setSelectingDeparture(false);
        } else {
          // Valid return date (after departure)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="text-white sticky top-0 z-40" style={{ backgroundColor: "#003580" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Plane className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                faredown.com
              </span>
            </Link>

            {/* Centered Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm font-medium">
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

              {/* Currency */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowCurrencyDropdown(!showCurrencyDropdown)
                    }
                    className="text-white hover:text-blue-200 cursor-pointer flex items-center space-x-1"
                  >
                    <span>Curr {selectedCurrency.symbol} {selectedCurrency.code}</span>
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
      </header>

      {/* Hero Search Section */}
      <div className="py-8 pb-16" style={{ backgroundColor: "#003580" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Upgrade. Bargain. Book.
            </h1>
            <p className="text-xl text-white mb-2 opacity-90">
              Turn your seat into an upgrade and your fare into a win, with AI that bargains for you.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-6xl mx-auto">
            {/* Trip Type Radio Buttons */}
            <div className="flex space-x-6 mb-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tripType === "round-trip"}
                  onChange={() => setTripType("round-trip")}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Round trip</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tripType === "one-way"}
                  onChange={() => setTripType("one-way")}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">One way</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tripType === "multi-city"}
                  onChange={() => setTripType("multi-city")}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Multi-city</span>
              </label>
              <div className="ml-auto">
                <div className="relative">
                  <button
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded transition-colors border border-gray-300"
                  >
                    <span className="text-sm text-gray-700">{selectedClass}</span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>
                  {showClassDropdown && (
                    <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-[9999] w-48">
                      {["Economy", "Premium Economy", "Business", "First Class"].map((classType) => (
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

            {/* Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* From */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leaving from
                </label>
                <button
                  onClick={() => setShowFromCities(!showFromCities)}
                  className="w-full flex items-center border border-gray-300 rounded-lg px-3 py-3 hover:border-blue-500 focus:border-blue-500 bg-white"
                >
                  <Plane className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 font-medium">Leaving from</span>
                </button>
                {showFromCities && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 mt-1">
                    {Object.entries(cityData).map(([city, data]) => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedFromCity(city);
                          setShowFromCities(false);
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                      >
                        <div className="font-medium text-gray-900">{city} • {data.airport}</div>
                        <div className="text-sm text-gray-500">{data.fullName}</div>
                      </button>
                    ))}
                  </div>
                )}
<<<<<<< HEAD
              >
                Round trip
              </button>
              <button
                onClick={() => setTripType("one-way")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  tripType === "one-way"
                    ? "bg-[#003580] text-white"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                One way
              </button>
              <button
                onClick={() => setTripType("multi-city")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  tripType === "multi-city"
                    ? "bg-[#003580] text-white"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                Multi-city
              </button>
            </div>

            {/* Mobile Search Form - Card Style */}
            <div className="space-y-3">
              {/* From/To Cities */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowFromCities(true);
                      }}
                      className="w-full text-left touch-manipulation active:bg-gray-50 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                    >
                      <div className="text-xs text-gray-500 mb-1">From</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-[#003580]" />
                        </div>
                        <div>
                          {selectedFromCity ? (
                            <>
                              <div className="font-medium text-gray-900">
                                {cityData[selectedFromCity]?.code}
                              </div>
                              <div className="text-xs text-gray-500">
                                {cityData[selectedFromCity]?.name}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Leaving from
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const temp = selectedFromCity;
                      setSelectedFromCity(selectedToCity);
                      setSelectedToCity(temp);
                    }}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </button>

                  <div className="flex-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowToCities(true);
                      }}
                      className="w-full text-left touch-manipulation active:bg-gray-50 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                    >
                      <div className="text-xs text-gray-500 mb-1">To</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Plane className="w-4 h-4 text-[#003580]" />
                        </div>
                        <div>
                          {selectedToCity ? (
                            <>
                              <div className="font-medium text-gray-900">
                                {cityData[selectedToCity]?.code}
                              </div>
                              <div className="text-xs text-gray-500">
                                {cityData[selectedToCity]?.name}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Going to
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
=======
>>>>>>> refs/remotes/origin/main
              </div>

              {/* To */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Going to
                </label>
                <button
                  onClick={() => setShowToCities(!showToCities)}
                  className="w-full flex items-center border border-gray-300 rounded-lg px-3 py-3 hover:border-blue-500 focus:border-blue-500 bg-white"
                >
                  <Plane className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 font-medium">Going to</span>
                </button>
                {showToCities && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 mt-1">
                    {Object.entries(cityData).map(([city, data]) => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedToCity(city);
                          setShowToCities(false);
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                      >
                        <div className="font-medium text-gray-900">{city} • {data.airport}</div>
                        <div className="text-sm text-gray-500">{data.fullName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Travel dates */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel dates
                </label>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full flex items-center border border-gray-300 rounded-lg px-3 py-3 hover:border-blue-500 bg-white"
                >
                  <CalendarIcon className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 font-medium">
                    Sun, Aug 17 — Wed, ...
                  </span>
                </button>
              </div>

              {/* Travelers */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travelers
                </label>
                <button
                  onClick={() => setShowTravelers(!showTravelers)}
                  className="w-full flex items-center border border-gray-300 rounded-lg px-3 py-3 hover:border-blue-500 bg-white"
                >
                  <Users className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 font-medium">1 adult</span>
                </button>
              </div>

              {/* Search Button */}
<<<<<<< HEAD
              <Button
                onClick={() => {
                  const searchParams = getSearchParams();
                  searchParams.set("adults", travelers.adults.toString());
                  searchParams.set("children", travelers.children.toString());
                  if (tripType === "multi-city") {
                    searchParams.set(
                      "segments",
                      JSON.stringify(flightSegments),
                    );
                  }
                  navigate(`/flights/results?${searchParams.toString()}`);
                }}
                className="w-full bg-[#febb02] hover:bg-[#d19900] text-[#003580] font-bold py-4 text-lg rounded-xl shadow-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Flights
              </Button>
            </div>

            {/* Mobile Multi-city Additional Flights */}
            {tripType === "multi-city" && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    Additional flights
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs px-3 py-2"
                    onClick={addFlightSegment}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add flight
                  </Button>
                </div>

                {/* Mobile flight segments */}
                {flightSegments.slice(1).map((segment, index) => (
                  <div
                    key={segment.id}
                    className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 space-y-3"
                  >
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">
                          Flight {index + 2}
                        </div>
                        {flightSegments.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1"
                            onClick={() => removeFlightSegment(segment.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <button
                            onClick={() => setShowSegmentFromCities(segment.id)}
                            className="w-full text-left"
                          >
                            <div className="text-xs text-gray-500 mb-1">
                              From
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-[#003580]" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {segment.from || "Select city"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {segment.from &&
                                  cityData[
                                    segment.from as keyof typeof cityData
                                  ]
                                    ? cityData[
                                        segment.from as keyof typeof cityData
                                      ].airport
                                    : "Airport"}
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <button
                            onClick={() => setShowSegmentToCities(segment.id)}
                            className="w-full text-left"
                          >
                            <div className="text-xs text-gray-500 mb-1">To</div>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Plane className="w-4 h-4 text-[#003580]" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {segment.to || "Select city"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {segment.to &&
                                  cityData[segment.to as keyof typeof cityData]
                                    ? cityData[
                                        segment.to as keyof typeof cityData
                                      ].airport
                                    : "Airport"}
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <button
                        onClick={() => setShowSegmentCalendar(segment.id)}
                        className="w-full text-left"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          Travel date
                        </div>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-5 h-5 text-[#003580]" />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {segment.departureDate
                                ? formatDate(segment.departureDate)
                                : "Select date"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Choose departure date
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sightseeing Section */}
        <div
          className={`bg-white text-gray-900 pb-8 ${activeTab === "sightseeing" ? "" : "hidden"}`}
        >
          <div className="px-4 pt-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Upgrade. Bargain. Book.
              </h1>
              <p className="text-gray-600 text-sm mb-3">
                Experience more, spend less — our AI gets you the best price for
                every adventure.
              </p>
            </div>

            {/* Mobile Sightseeing Search Form */}
            <SightseeingSearchForm />
          </div>
        </div>

        {/* Mobile Transfers Section */}
        <div
          className={`bg-white text-gray-900 pb-8 ${activeTab === "transfers" ? "" : "hidden"}`}
        >
          <div className="px-4 pt-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Upgrade. Bargain. Book.
              </h1>
              <p className="text-gray-600 text-sm mb-3">
                Ride in comfort for less — AI secures your best deal on every
                trip.
              </p>
            </div>

            {/* Mobile Transfers Search Form */}
            <TransfersSearchForm />
          </div>
        </div>

        {/* Mobile Hotels Section */}
        <div
          className={`bg-white text-gray-900 pb-8 ${activeTab === "hotels" ? "" : "hidden"}`}
          style={{ display: activeTab === "hotels" ? "block" : "none" }}
        >
          <div className="px-4 pt-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Upgrade. Bargain. Book.
              </h1>
              <p className="text-gray-600 text-sm mb-3">
                From standard to suite, unlock room upgrades and rates you never
                thought possible.
              </p>
            </div>

            {/* Mobile Hotel Search Form */}
            <BookingSearchForm />
          </div>
        </div>

        {/* Mobile Features Section */}
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
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />

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
                <button
                  onClick={() => {
                    setActiveTab("flights");
                    window.history.pushState({}, "", "/?tab=flights");
                  }}
                  className={`text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4 ${
                    activeTab === "flights" ? "border-b-2 border-white" : ""
                  }`}
                >
                  <span>Flights</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("hotels");
                    window.history.pushState({}, "", "/?tab=hotels");
                  }}
                  className={`text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4 ${
                    activeTab === "hotels" ? "border-b-2 border-white" : ""
                  }`}
                >
                  <span>Hotels</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("sightseeing");
                    window.history.pushState({}, "", "/?tab=sightseeing");
                  }}
                  className={`text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4 ${
                    activeTab === "sightseeing" ? "border-b-2 border-white" : ""
                  }`}
                >
                  <span>Sightseeing</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("transfers");
                    window.history.pushState({}, "", "/?tab=transfers");
                  }}
                  className={`text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold py-3 lg:py-4 ${
                    activeTab === "transfers" ? "border-b-2 border-white" : ""
                  }`}
                >
                  <span>Transfers</span>
                </button>
              </nav>

              <div className="flex items-center space-x-2 md:space-x-6">
                {/* Currency Only - Language dropdown removed */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowCurrencyDropdown(!showCurrencyDropdown)
                      }
                      className="text-white hover:text-blue-200 cursor-pointer flex items-center space-x-1"
                    >
                      <span className="text-sm font-medium">Curr</span>
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
                          <Link
                            to="/account/trips"
                            className="flex items-center"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Bookings & Trips
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            to="/account?tab=loyalty"
                            className="flex items-center"
                          >
                            <Award className="w-4 h-4 mr-2" />
                            Loyalty program
                          </Link>
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
                        <DropdownMenuItem>
                          <Link to="/my-trips" className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed trips
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

          {/* Desktop Hero Search Section */}
          <div
            className={`py-3 sm:py-6 md:py-8 pb-24 sm:pb-8 ${activeTab === "flights" ? "" : "hidden"}`}
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
                  Turn your seat into an upgrade and your fare into a win, with
                  AI that bargains for you.
                </h1>
              </div>

              {/* Desktop Search Form */}
              <div className="bg-white border-b border-gray-200 overflow-visible rounded-t-lg">
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
                            <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-[9999] w-48 min-w-[180px]">
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
                                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm transition-colors ${
                                    selectedClass === classType
                                      ? "bg-blue-100 text-blue-700 font-medium"
                                      : "text-gray-900"
                                  }`}
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

                  {/* Desktop Search inputs */}
                  <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-3 mt-2 w-full max-w-5xl overflow-visible">
                    <div className="relative flex-1 lg:max-w-xs w-full lg:w-auto">
                      <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                        Leaving from
                      </label>
                      <button
                        onClick={() => setShowFromCities(!showFromCities)}
                        className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-12 w-full hover:border-blue-600 touch-manipulation"
                      >
                        <Plane className="w-4 h-4 text-gray-500 mr-2" />
                        <div className="flex items-center space-x-2">
                          {selectedFromCity ? (
                            <>
                              <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                                {cityData[selectedFromCity]?.code}
                              </div>
                              <span className="text-sm text-gray-700 font-medium">
                                {cityData[selectedFromCity]?.airport}...
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 font-medium">
                              Leaving from
                            </span>
                          )}
                        </div>
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
                                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                    <Plane className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      <span className="font-semibold">
                                        {data.code}
                                      </span>{" "}
                                      • {city}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {data.airport}
                                    </div>
                                    <div className="text-xs text-gray-400">
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
                        className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500 touch-manipulation"
                      >
                        <Plane className="w-4 h-4 text-gray-500 mr-2" />
                        <div className="flex items-center space-x-2">
                          {selectedToCity ? (
                            <>
                              <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                                {cityData[selectedToCity]?.code}
                              </div>
                              <span className="text-sm text-gray-700 font-medium">
                                {cityData[selectedToCity]?.airport}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 font-medium">
                              Going to
                            </span>
                          )}
                        </div>
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
                                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                    <Plane className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      <span className="font-semibold">
                                        {data.code}
                                      </span>{" "}
                                      ��� {city}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {data.airport}
                                    </div>
                                    <div className="text-xs text-gray-400">
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

                    <div className="relative overflow-visible lg:max-w-[250px] w-full lg:w-auto">
                      <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                        Travel dates
                      </label>
                      <button
                        onClick={() => {
                          if (!showCalendar) {
                            setSelectingDeparture(true);
                            setCurrentMonth(new Date().getMonth());
                            setCurrentYear(new Date().getFullYear());
                          }
                          setShowCalendar(!showCalendar);
                        }}
                        className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full min-w-[220px] hover:border-blue-500 touch-manipulation"
                      >
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <svg
                            className="w-4 h-4 text-blue-600"
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
                        </div>
                        <span className="text-sm text-gray-900 font-semibold truncate">
                          {tripType === "one-way"
                            ? formatDisplayDate(departureDate) || "Select date"
                            : departureDate
                              ? `${formatDisplayDate(departureDate)}${returnDate ? ` — ${formatDisplayDate(returnDate)}` : " — Return"}`
                              : "Select dates"}
                        </span>
                      </button>

                      {showCalendar && (
                        <>
                          {/* Mobile Overlay */}
                          <div
                            className="fixed inset-0 z-[99999] bg-black bg-opacity-50 sm:hidden"
                            onClick={() => setShowCalendar(false)}
                          />

                          {/* Calendar Container - Booking.com Style */}
                          <div className="fixed top-16 left-4 right-4 bottom-16 z-[100000] sm:absolute sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 sm:top-14 sm:bottom-auto sm:w-[750px] sm:max-w-[750px]">
                            <div className="h-full overflow-y-auto sm:h-auto bg-white rounded-2xl sm:rounded-2xl shadow-2xl border border-gray-100">
                              <div className="p-6">
                                <BookingCalendar
                                  bookingType="flight"
                                  initialRange={{
                                    startDate: departureDate || new Date(),
                                    endDate:
                                      returnDate ||
                                      (departureDate
                                        ? new Date(
                                            departureDate.getTime() +
                                              7 * 24 * 60 * 60 * 1000,
                                          )
                                        : new Date(
                                            Date.now() +
                                              7 * 24 * 60 * 60 * 1000,
                                          )),
                                  }}
                                  onChange={(range) => {
                                    setDepartureDate(range.startDate);
                                    if (tripType === "round-trip") {
                                      setReturnDate(range.endDate);
                                    }
                                  }}
                                  onClose={() => setShowCalendar(false)}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </>
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

                    <div className="lg:max-w-[100px] w-full lg:w-auto">
                      <Button
                        onClick={() => {
                          // Get city codes for from/to
                          const fromCode = selectedFromCity
                            ? cityData[selectedFromCity]?.code || ""
                            : "";
                          const toCode = selectedToCity
                            ? cityData[selectedToCity]?.code || ""
                            : "";

                          const additionalParams: Record<string, string> = {
                            adults: travelers.adults.toString(),
                            children: travelers.children.toString(),
                            from: fromCode,
                            to: toCode,
                            class: selectedClass.toLowerCase(),
                          };

                          if (tripType === "multi-city") {
                            additionalParams.segments =
                              JSON.stringify(flightSegments);
                          }

                          const searchParams =
                            getSearchParams(additionalParams);
                          navigate(
                            `/flights/results?${searchParams.toString()}`,
                          );
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded h-12 font-medium text-sm w-full touch-manipulation"
                      >
                        Search
                      </Button>
                    </div>
                  </div>

                  {/* Multi-city Additional Flights */}
                  {tripType === "multi-city" && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">
                          Additional flights
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={addFlightSegment}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add a flight
                        </Button>
                      </div>

                      {/* Additional flight segment example */}
                      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3">
                          <div className="relative flex-1 lg:min-w-[200px] w-full">
                            <label className="absolute -top-2 left-3 bg-gray-50 px-1 text-xs text-gray-600 font-medium z-10">
                              Leaving from
                            </label>
                            <button className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500">
                              <Plane className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-500">
                                Select city
                              </span>
                            </button>
                          </div>

                          <div className="relative flex-1 lg:min-w-[200px] w-full">
                            <label className="absolute -top-2 left-3 bg-gray-50 px-1 text-xs text-gray-600 font-medium z-10">
                              Going to
                            </label>
                            <button className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500">
                              <Plane className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-500">
                                Select city
                              </span>
                            </button>
                          </div>

                          <div className="relative flex-1 lg:min-w-[160px] w-full">
                            <label className="absolute -top-2 left-3 bg-gray-50 px-1 text-xs text-gray-600 font-medium z-10">
                              Travel date
                            </label>
                            <button className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500">
                              <CalendarIcon className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-500">
                                Select date
                              </span>
                            </button>
                          </div>

                          <div className="w-full lg:w-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-12 px-3"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hotels Search Form */}
        <header
          className={`py-3 sm:py-6 md:py-8 pb-24 sm:pb-8 ${activeTab === "hotels" ? "" : "hidden"}`}
          style={{
            backgroundColor: "#003580",
            display: activeTab === "hotels" ? "block" : "none",
          }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-2 sm:mb-3">
              <div className="mb-3 sm:mb-5">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  Upgrade. Bargain. Book.
                </h2>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-3 sm:mb-4 leading-tight px-2 opacity-95">
                From standard to suite, unlock room upgrades and rates you never
                thought possible.
              </h1>
            </div>

            {/* Hotel Search Form */}
            <BookingSearchForm />
          </div>
        </header>

        {/* Sightseeing Header Section */}
        <header
          className={`py-3 sm:py-6 md:py-8 pb-24 sm:pb-8 ${activeTab === "sightseeing" ? "" : "hidden"}`}
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
                Experience more, spend less — our AI gets you the best price for
                every adventure.
              </h1>
            </div>

            {/* Sightseeing Search Form */}
            <SightseeingSearchForm />
          </div>
        </header>

        {/* Transfers Header Section */}
        <header
          className={`py-3 sm:py-6 md:py-8 pb-24 sm:pb-8 ${activeTab === "transfers" ? "" : "hidden"}`}
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
                Ride in comfort for less — AI secures your best deal on every
                trip.
              </h1>
            </div>

            {/* Transfers Search Form */}
            <TransfersSearchForm />
          </div>
        </header>

        {/* Content sections shown for all tabs */}
        <div className="">
          {/* Desktop Content Sections */}
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
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Live Bargain Technology
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Negotiate upgrades instantly — from economy to business,
                    from standard to suite.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-[#003580] rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
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

                {/* Trustpilot Integration */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8 inline-block">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fb6ae57258e4549a19f25b81f562dc1a7?format=webp&width=800"
                      alt="Trustpilot"
                      className="h-8"
                    />
                    <div className="flex items-center space-x-1">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 text-green-500 fill-current"
                          />
                        ))}
                    </div>
                    <span className="text-xl font-bold text-gray-900">4.9</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Excellent • Based on 50,000+ reviews on Trustpilot
                  </p>
                </div>

                {/* Live Support Banner */}
                <div className="bg-blue-600 text-white px-8 py-4 rounded-lg flex items-center justify-center space-x-3 mb-8 mx-auto max-w-2xl">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.16 10.53c-.56.28-.56 1.07.085 1.492A9.963 9.963 0 0010.47 16.09c.423.644 1.213.644 1.492.085l1.145-1.73a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="font-medium text-lg">
                    24×7 Customer Support | Live Chat & Call Available
                  </span>
                </div>

                {/* Customer Support Visual */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-8 mb-8 mx-auto max-w-4xl">
                  <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-12">
                    {/* Support Team Illustration */}
                    <div className="flex -space-x-3">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <svg
                          className="w-8 h-8 text-white"
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
                      </div>
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <svg
                          className="w-8 h-8 text-white"
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
                      </div>
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <svg
                          className="w-8 h-8 text-white"
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
                      </div>
                    </div>

                    {/* Support Features */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          Live Chat
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.16 10.53c-.56.28-.56 1.07.085 1.492A9.963 9.963 0 0010.47 16.09c.423.644 1.213.644 1.492.085l1.145-1.73a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          Phone Call
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          Email
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mx-auto">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          24/7 Support
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Safe, Verified, and Instant Confirmations. Backed by real
                  humans.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Priya Sharma",
                    location: "Mumbai • Verified Traveler",
                    review:
                      "Saved ₹15,000 on my Dubai trip! The bargaining feature is amazing. Got business class for economy price.",
                    rating: 5,
                    profession: "Marketing Manager",
                    verified: true,
                  },
                  {
                    name: "Rohit Kumar",
                    location: "Delhi • Verified Traveler",
                    review:
                      "Got suite upgrade in Singapore hotel using Bargain It™. Faredown is revolutionary! Customer service is excellent.",
                    rating: 5,
                    profession: "Software Engineer",
                    verified: true,
                  },
                  {
                    name: "Anjali Patel",
                    location: "Bangalore • Verified Traveler",
                    review:
                      "Easy booking process and instant confirmations. Saved on both flights and hotels. Will use again!",
                    rating: 5,
                    profession: "Product Designer",
                    verified: true,
                  },
                ].map((testimonial, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">
                            {testimonial.name}
                          </h4>
                          {testimonial.verified && (
                            <svg
                              className="w-4 h-4 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {testimonial.profession}
                        </p>
                        <p className="text-xs text-gray-400">
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center mb-3">
                      {Array(testimonial.rating)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 text-yellow-400 fill-current"
                          />
                        ))}
                      <span className="ml-2 text-sm text-gray-500">5.0</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      "{testimonial.review}"
                    </p>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Verified Purchase
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Mobile App Promo Section */}
          <section className="py-16 bg-[#003580] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#003580] to-[#0071c2] opacity-90"></div>
            <div className="relative max-w-[1280px] mx-auto px-4">
              <div className="text-center text-white mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  Travel Smarter. Bargain Better. On the Go.
                </h2>
                <p className="text-xl text-blue-200 mb-8">
                  Download the Faredown app for exclusive mobile-only deals and
                  instant bargain alerts.
                </p>

                {/* App Features - Inline */}
                <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5v-5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4"
                      />
                    </svg>
                    <span className="text-blue-100">Instant notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-blue-100">
                      Mobile-exclusive deals
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-blue-100">Offline management</span>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                  <div className="flex-1 bg-black rounded-lg px-4 py-3 flex items-center justify-center space-x-3 cursor-pointer hover:bg-gray-800 transition-colors">
                    <svg
                      className="w-6 h-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">
                        Download on the
                      </div>
                      <div className="text-sm font-semibold">App Store</div>
                    </div>
                  </div>
                  <div className="flex-1 bg-black rounded-lg px-4 py-3 flex items-center justify-center space-x-3 cursor-pointer hover:bg-gray-800 transition-colors">
                    <svg
                      className="w-6 h-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">Get it on</div>
                      <div className="text-sm font-semibold">Google Play</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Email Signup Section */}
          <section className="py-16 bg-white">
            <div className="max-w-[1280px] mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Stay ahead with secret travel bargains
              </h2>
              <div className="max-w-md mx-auto flex space-x-4 mb-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1"
                />
                <Button className="bg-[#003580] hover:bg-[#0071c2] text-white px-8">
                  Subscribe
=======
              <div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg">
                  Search
>>>>>>> refs/remotes/origin/main
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Faredown Is Reinventing Travel Booking */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Faredown Is Reinventing Travel Booking
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            The future of booking isn't fixed pricing — it's <strong>live bargaining.</strong>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Live Bargain Technology
              </h3>
              <p className="text-gray-600">
                Negotiate upgrades instantly — from economy to business, from standard to suite.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Pay What You Feel Is Fair
              </h3>
              <p className="text-gray-600">
                Set your price and let Faredown try to get it for you — no more overpaying.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure, Real-Time Bookings
              </h3>
              <p className="text-gray-600">
                Your data is encrypted and bookings are confirmed instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smarter Than Any Travel Agent
              </h3>
              <p className="text-gray-600">
                Skip the back and forth. Our AI works faster, 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Dialogs */}
      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to your account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {authError}
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
                placeholder="Enter your email"
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
                placeholder="Enter your password"
              />
            </div>
            <div className="text-sm text-gray-600">
              Test credentials: test@faredown.com / password123
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSignIn} className="flex-1">
                Sign in
              </Button>
              <Button variant="outline" onClick={() => setShowSignIn(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create your account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {authError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <Input
                  value={registerFirstName}
                  onChange={(e) => setRegisterFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <Input
                  value={registerLastName}
                  onChange={(e) => setRegisterLastName(e.target.value)}
                  placeholder="Last name"
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
                placeholder="Enter your email"
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
                placeholder="Create a password"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleRegister} className="flex-1">
                Create account
              </Button>
              <Button variant="outline" onClick={() => setShowRegister(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
<<<<<<< HEAD

      {/* Multi-city segment dropdowns */}
      {tripType === "multi-city" &&
        flightSegments.slice(1).map((segment) => (
          <Fragment key={segment.id}>
            <MobileCityDropdown
              isOpen={showSegmentFromCities === segment.id}
              onClose={() => setShowSegmentFromCities(null)}
              title={`Flight ${flightSegments.findIndex((s) => s.id === segment.id) + 1} - Leaving from`}
              cities={cityData}
              selectedCity={segment.from}
              onSelectCity={(city) => {
                updateFlightSegment(segment.id, "from", city);
                setShowSegmentFromCities(null);
              }}
            />

            <MobileCityDropdown
              isOpen={showSegmentToCities === segment.id}
              onClose={() => setShowSegmentToCities(null)}
              title={`Flight ${flightSegments.findIndex((s) => s.id === segment.id) + 1} - Going to`}
              cities={cityData}
              selectedCity={segment.to}
              onSelectCity={(city) => {
                updateFlightSegment(segment.id, "to", city);
                setShowSegmentToCities(null);
              }}
            />

            <MobileDatePicker
              isOpen={showSegmentCalendar === segment.id}
              onClose={() => setShowSegmentCalendar(null)}
              tripType="one-way"
              setTripType={() => {}}
              selectedDepartureDate={segment.departureDate}
              selectedReturnDate={null}
              setSelectedDepartureDate={(date) => {
                updateFlightSegment(segment.id, "departureDate", date);
                setShowSegmentCalendar(null);
              }}
              setSelectedReturnDate={() => {}}
              selectingDeparture={true}
              setSelectingDeparture={() => {}}
            />
          </Fragment>
        ))}

      {/* Mobile Dropdown Components */}
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
        tripType={tripType}
        setTripType={setTripType}
        selectedDepartureDate={departureDate}
        selectedReturnDate={returnDate}
        setSelectedDepartureDate={setDepartureDate}
        setSelectedReturnDate={setReturnDate}
        selectingDeparture={selectingDeparture}
        setSelectingDeparture={setSelectingDeparture}
      />

      <MobileTravelers
        isOpen={showTravelers}
        onClose={() => setShowTravelers(false)}
        travelers={travelers}
        setTravelers={setTravelers}
      />

      <MobileClassDropdown
        isOpen={showClassDropdown}
        onClose={() => setShowClassDropdown(false)}
        selectedClass={selectedClass}
        onSelectClass={setSelectedClass}
      />
=======
>>>>>>> refs/remotes/origin/main
    </div>
  );
}
