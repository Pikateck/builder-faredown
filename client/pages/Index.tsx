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
  Hotel,
  Globe,
  Zap,
  Target,
  Gift,
  Plus,
  Minus,
} from "lucide-react";
import { downloadProjectInfo } from "@/lib/codeExport";
import AdminTestButton from "@/components/AdminTestButton";

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
  const formatDate = (date: Date | null, compact = false) => {
    if (!date) return "";
    if (compact) {
      // For mobile and compact display - just day and month
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
    }
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
    clickedDate.setHours(0, 0, 0, 0);

    if (tripType === "one-way") {
      setSelectedDepartureDate(clickedDate);
      setShowCalendar(false);
    } else {
      if (selectingDeparture || !selectedDepartureDate) {
        setSelectedDepartureDate(clickedDate);
        setSelectedReturnDate(null);
        setSelectingDeparture(false);
      } else {
        if (clickedDate <= selectedDepartureDate) {
          setSelectedDepartureDate(clickedDate);
          setSelectedReturnDate(null);
          setSelectingDeparture(false);
        } else {
          setSelectedReturnDate(clickedDate);
          setShowCalendar(false);
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
    <div className="min-h-screen bg-white">
      {/* MOBILE-FIRST DESIGN: App-style layout for mobile, standard for desktop */}
      
      {/* Mobile Header & Search (≤768px) - Booking.com Style */}
      <div className="block md:hidden">
        {/* Mobile Header */}
        <header className="bg-[#003580] text-white sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#febb02] rounded flex items-center justify-center">
                  <Plane className="w-5 h-5 text-[#003580]" />
                </div>
                <span className="text-lg font-bold">faredown.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <button className="p-2">
                  <Globe className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Hero Section */}
        <div className="bg-[#003580] text-white pb-8">
          <div className="px-4 pt-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Upgrade. Bargain. Book.
              </h1>
              <p className="text-blue-200 text-sm">
                World's first travel portal where you control the price
              </p>
            </div>

            {/* Mobile Trip Type Selector */}
            <div className="flex space-x-1 mb-6 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setTripType("round-trip")}
                className={cn(
                  "flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors",
                  tripType === "round-trip"
                    ? "bg-white text-[#003580]"
                    : "text-white"
                )}
              >
                Round trip
              </button>
              <button
                onClick={() => setTripType("one-way")}
                className={cn(
                  "flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors",
                  tripType === "one-way"
                    ? "bg-white text-[#003580]"
                    : "text-white"
                )}
              >
                One way
              </button>
            </div>

            {/* Mobile Search Form - Card Style */}
            <div className="space-y-3">
              {/* From/To Cities */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <button
                      onClick={() => setShowFromCities(true)}
                      className="w-full text-left"
                    >
                      <div className="text-xs text-gray-500 mb-1">From</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Plane className="w-4 h-4 text-[#003580]" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {cityData[selectedFromCity]?.code}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cityData[selectedFromCity]?.name}
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
                      onClick={() => setShowToCities(true)}
                      className="w-full text-left"
                    >
                      <div className="text-xs text-gray-500 mb-1">To</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-[#003580]" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {cityData[selectedToCity]?.code}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cityData[selectedToCity]?.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <button
                  onClick={() => setShowCalendar(true)}
                  className="w-full text-left"
                >
                  <div className="text-xs text-gray-500 mb-1">Dates</div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-[#003580]" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedDepartureDate
                          ? formatDate(selectedDepartureDate, true)
                          : "Departure"}
                        {tripType === "round-trip" && (
                          <>
                            {" - "}
                            {selectedReturnDate
                              ? formatDate(selectedReturnDate, true)
                              : "Return"}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tripType === "round-trip"
                          ? "Choose departure & return"
                          : "Choose departure"}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Travelers & Class */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <button
                    onClick={() => setShowTravelers(true)}
                    className="w-full text-left"
                  >
                    <div className="text-xs text-gray-500 mb-1">Travelers</div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-[#003580]" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {travelers.adults + travelers.children}
                        </div>
                        <div className="text-xs text-gray-500">
                          {travelers.adults} adult{travelers.adults > 1 ? "s" : ""}
                          {travelers.children > 0 &&
                            `, ${travelers.children} child${travelers.children > 1 ? "ren" : ""}`}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <button
                    onClick={() => setShowClassDropdown(true)}
                    className="w-full text-left"
                  >
                    <div className="text-xs text-gray-500 mb-1">Class</div>
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-[#003580]" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedClass}
                        </div>
                        <div className="text-xs text-gray-500">Travel class</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Search Button */}
              <Link to={`/flights?adults=${travelers.adults}&children=${travelers.children}`}>
                <Button className="w-full bg-[#febb02] hover:bg-[#d19900] text-[#003580] font-bold py-4 text-lg rounded-xl shadow-lg">
                  <Search className="w-5 h-5 mr-2" />
                  Search Flights
                </Button>
              </Link>
            </div>
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
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Live Bargaining</h3>
                <p className="text-xs text-gray-600">
                  Negotiate real-time prices
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Best Prices</h3>
                <p className="text-xs text-gray-600">Pay what you feel is fair</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Secure Booking</h3>
                <p className="text-xs text-gray-600">
                  Instant confirmations
                </p>
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

        {/* Mobile Quick Links */}
        <div className="bg-white py-6">
          <div className="px-4">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link
                to="/hotels"
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <Hotel className="w-5 h-5 text-[#003580]" />
                <span className="font-medium">Hotels</span>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
              <Link
                to="/account"
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <User className="w-5 h-5 text-[#003580]" />
                <span className="font-medium">My Account</span>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-4 h-16">
            <button className="flex flex-col items-center justify-center space-y-1">
              <Plane className="w-5 h-5 text-[#003580]" />
              <span className="text-xs text-[#003580] font-medium">Flights</span>
            </button>
            <Link
              to="/hotels"
              className="flex flex-col items-center justify-center space-y-1"
            >
              <Hotel className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Hotels</span>
            </Link>
            <button className="flex flex-col items-center justify-center space-y-1">
              <Heart className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Saved</span>
            </button>
            <button className="flex flex-col items-center justify-center space-y-1">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Account</span>
            </button>
          </div>
        </div>

        {/* Mobile bottom padding */}
        <div className="h-16"></div>
      </div>

      {/* DESKTOP LAYOUT (≥769px) - Enhanced Original Design */}
      <div className="hidden md:block">
        {/* Desktop Header */}
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
              <nav className="flex items-center space-x-6 lg:space-x-8 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
                <Link
                  to="/flights"
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
              </nav>

              <div className="flex items-center space-x-2 md:space-x-6">
                {/* Language and Currency */}
                <div className="flex items-center space-x-4 text-sm">
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
                  {/* Admin Test Button */}
                  <AdminTestButton variant="desktop" />

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

          {/* Desktop Hero Search Section */}
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
                  <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-2 mt-2 w-full max-w-5xl overflow-visible">
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
                          <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                            {cityData[selectedFromCity]?.code || "BOM"}
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {cityData[selectedFromCity]?.airport ||
                              "Chhatrapati Shivaji International"}
                            ...
                          </span>
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
                        className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500 touch-manipulation"
                      >
                        <Plane className="w-4 h-4 text-gray-500 mr-2" />
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                            {cityData[selectedToCity]?.code || "DXB"}
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {cityData[selectedToCity]?.airport ||
                              "Dubai International Airport"}
                          </span>
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
                            setSelectingDeparture(true);
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
                        <span className="text-sm text-gray-700 font-medium truncate">
                          {tripType === "one-way"
                            ? formatDate(selectedDepartureDate) || "Select date"
                            : selectedDepartureDate
                              ? `${formatDate(selectedDepartureDate)}${selectedReturnDate ? ` - ${formatDate(selectedReturnDate)}` : " - Return"}`
                              : "Select dates"}
                        </span>
                      </button>

                      {showCalendar && (
                        <div className="absolute top-14 left-0 right-0 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-2xl z-[9999] w-full sm:w-[700px] max-w-[700px] overflow-hidden">
                          <div className="p-4">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() => navigateMonth("prev")}
                                  className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {getMonthName(currentMonth)} {currentYear}
                                </h3>
                                <button
                                  onClick={() => navigateMonth("next")}
                                  className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                              <button
                                onClick={() => setShowCalendar(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Trip Type Indicator */}
                            {tripType === "round-trip" && (
                              <div className="flex items-center space-x-4 mb-4 text-sm">
                                <div className={`px-3 py-1 rounded-full ${
                                  selectingDeparture
                                    ? "bg-blue-100 text-blue-700 font-medium"
                                    : "bg-gray-100 text-gray-600"
                                }`}>
                                  Departure: {selectedDepartureDate ? formatDate(selectedDepartureDate) : "Select"}
                                </div>
                                <div className={`px-3 py-1 rounded-full ${
                                  !selectingDeparture
                                    ? "bg-blue-100 text-blue-700 font-medium"
                                    : "bg-gray-100 text-gray-600"
                                }`}>
                                  Return: {selectedReturnDate ? formatDate(selectedReturnDate) : "Select"}
                                </div>
                              </div>
                            )}

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                                  {day}
                                </div>
                              ))}

                              {/* Empty cells for days before month starts */}
                              {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, index) => (
                                <div key={`empty-${index}`} className="p-2"></div>
                              ))}

                              {/* Days of the month */}
                              {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, index) => {
                                const day = index + 1;
                                const date = new Date(currentYear, currentMonth, day);
                                const today = new Date();
                                const isToday = date.toDateString() === today.toDateString();
                                const isPast = date < today;
                                const isSelected = isDateEqual(date, selectedDepartureDate) || isDateEqual(date, selectedReturnDate);
                                const isInRange = isDateInRange(date, selectedDepartureDate, selectedReturnDate);

                                return (
                                  <button
                                    key={day}
                                    onClick={() => !isPast && handleDateClick(day, currentMonth, currentYear)}
                                    disabled={isPast}
                                    className={`p-2 text-sm rounded-lg transition-colors ${
                                      isPast
                                        ? "text-gray-300 cursor-not-allowed"
                                        : isSelected
                                          ? "bg-blue-600 text-white font-medium"
                                          : isInRange
                                            ? "bg-blue-100 text-blue-700"
                                            : isToday
                                              ? "bg-blue-50 text-blue-700 font-medium border border-blue-300"
                                              : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
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
                        <div className="absolute top-14 right-0 bg-white border border-gray-300 rounded-md shadow-xl p-4 z-50 w-72">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between py-2">
                              <div>
                                <div className="font-medium text-gray-900">
                                  Adults
                                </div>
                                <div className="text-sm text-gray-500">Age 18+</div>
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
                                <div className="text-sm text-gray-500">Age 0-17</div>
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
                        to={`/flights?adults=${travelers.adults}&children=${travelers.children}`}
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

        {/* Additional desktop sections would continue here... */}
        {/* All the existing desktop sections from the original Index.tsx */}
      </div>

      {/* Mobile Dropdown Components */}
      <MobileCityDropdown
        isOpen={showFromCities}
        onClose={() => setShowFromCities(false)}
        title="Leaving from"
        cities={cityData}
        selectedCity={selectedFromCity}
        onSelectCity={setSelectedFromCity}
      />

      <MobileCityDropdown
        isOpen={showToCities}
        onClose={() => setShowToCities(false)}
        title="Going to"
        cities={cityData}
        selectedCity={selectedToCity}
        onSelectCity={setSelectedToCity}
      />

      <MobileDatePicker
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        tripType={tripType}
        setTripType={setTripType}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Sign in or create an account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            {/* Test Credentials Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Test Credentials:
              </p>
              <p className="text-xs text-blue-700">Email: test@faredown.com</p>
              <p className="text-xs text-blue-700">Password: password123</p>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                type="email"
                placeholder="Enter your email address"
                className="w-full"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                className="w-full"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              onClick={handleSignIn}
            >
              Sign in
            </Button>

            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full py-3 flex items-center justify-center space-x-2"
              >
                <span>🇬</span>
                <span>Continue with Google</span>
              </Button>

              <Button
                variant="outline"
                className="w-full py-3 flex items-center justify-center space-x-2"
              >
                <span>📧</span>
                <span>Continue with Apple</span>
              </Button>

              <Button
                variant="outline"
                className="w-full py-3 flex items-center justify-center space-x-2"
              >
                <span>📘</span>
                <span>Continue with Facebook</span>
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              By signing in or creating an account, you agree with our{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms & conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy statement
              </a>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setShowSignIn(false);
                  setShowRegister(true);
                }}
                className="text-blue-600 hover:underline text-sm"
              >
                Create account
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Create your account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                type="email"
                placeholder="Enter your email address"
                className="w-full"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="Create a password"
                className="w-full"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use at least 8 characters with a mix of letters, numbers &
                symbols
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>
              <Input
                type="text"
                placeholder="Enter your first name"
                className="w-full"
                value={registerFirstName}
                onChange={(e) => setRegisterFirstName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>
              <Input
                type="text"
                placeholder="Enter your last name"
                className="w-full"
                value={registerLastName}
                onChange={(e) => setRegisterLastName(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              onClick={handleRegister}
            >
              Create account
            </Button>

            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full py-3 flex items-center justify-center space-x-2"
              >
                <span>🇬</span>
                <span>Sign up with Google</span>
              </Button>

              <Button
                variant="outline"
                className="w-full py-3 flex items-center justify-center space-x-2"
              >
                <span>📧</span>
                <span>Sign up with Apple</span>
              </Button>

              <Button
                variant="outline"
                className="w-full py-3 flex items-center justify-center space-x-2"
              >
                <span>📘</span>
                <span>Sign up with Facebook</span>
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              By signing in or creating an account, you agree with our{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms & conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy statement
              </a>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setShowRegister(false);
                  setShowSignIn(true);
                }}
                className="text-blue-600 hover:underline text-sm"
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
