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
              <div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg">
                  Search
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
    </div>
  );
}
