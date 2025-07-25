import React, { useState, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDateContext } from "@/contexts/DateContext";
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
import { BookingCalendar } from "@/components/BookingCalendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays } from "date-fns";
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
  const { isLoggedIn, user, login, logout } = useAuth();
  const {
    departureDate,
    returnDate,
    tripType,
    setDepartureDate,
    setReturnDate,
    setTripType,
    formatDisplayDate,
    getSearchParams,
  } = useDateContext();
  const userName = user?.name || "";
  const navigate = useNavigate();

  // Date state now managed by DateContext
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
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
      login({
        id: "1",
        name: testCredentials.name,
        email: loginEmail,
        loyaltyLevel: 1,
      });
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
      login({
        id: "1",
        name: `${registerFirstName} ${registerLastName}`,
        email: registerEmail,
        loyaltyLevel: 1,
      });
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
    logout();
  };

  // Return date and trip type now managed by DateContext
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
  const [selectingDeparture, setSelectingDeparture] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Multi-city segment dropdown states
  const [showSegmentFromCities, setShowSegmentFromCities] = useState<
    string | null
  >(null);
  const [showSegmentToCities, setShowSegmentToCities] = useState<string | null>(
    null,
  );
  const [showSegmentCalendar, setShowSegmentCalendar] = useState<string | null>(
    null,
  );

  // Multi-city flight segments state
  interface FlightSegment {
    id: string;
    from: string;
    to: string;
    departureDate: Date | null;
  }

  const [flightSegments, setFlightSegments] = useState<FlightSegment[]>([
    { id: "1", from: "", to: "", departureDate: null },
    { id: "2", from: "", to: "", departureDate: null },
  ]);

  // Add flight segment function
  const addFlightSegment = () => {
    const newSegment: FlightSegment = {
      id: Date.now().toString(),
      from: "",
      to: "",
      departureDate: null,
    };
    setFlightSegments([...flightSegments, newSegment]);
  };

  // Remove flight segment function
  const removeFlightSegment = (id: string) => {
    if (flightSegments.length > 2) {
      setFlightSegments(flightSegments.filter((segment) => segment.id !== id));
    }
  };

  // Update flight segment function
  const updateFlightSegment = (
    id: string,
    field: keyof FlightSegment,
    value: string | Date | null,
  ) => {
    setFlightSegments(
      flightSegments.map((segment) =>
        segment.id === id ? { ...segment, [field]: value } : segment,
      ),
    );
  };

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
      setDepartureDate(clickedDate);
      setShowCalendar(false);
    } else {
      if (selectingDeparture || !departureDate) {
        setDepartureDate(clickedDate);
        setReturnDate(null);
        setSelectingDeparture(false);
      } else {
        if (clickedDate <= departureDate) {
          setDepartureDate(clickedDate);
          setReturnDate(null);
          setSelectingDeparture(false);
        } else {
          setReturnDate(clickedDate);
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
        <header className="bg-[#003580] text-white">
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
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#003580]">
                  <span className="text-lg font-bold text-white">Menu</span>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 text-white hover:bg-blue-700 rounded-lg"
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
                      to="/account"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <User className="w-5 h-5 text-[#003580]" />
                      <span className="font-medium">My Account</span>
                    </Link>

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

        {/* Mobile Hero Section */}
        <div className="bg-[#003580] text-white pb-8">
          <div className="px-4 pt-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Upgrade. Bargain. Book.
              </h1>
              <p className="text-blue-200 text-sm mb-3">
                Control your price for flights & hotels — with live AI
                bargaining.
              </p>
              <p className="text-blue-100 text-xs mb-3">
                Join 50M+ travelers who bargain smarter.
              </p>
            </div>

            {/* Mobile Trip Type Selector */}
            <div className="flex space-x-1 mb-6 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setTripType("round-trip")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  tripType === "round-trip"
                    ? "bg-white text-[#003580]"
                    : "text-white",
                )}
              >
                Round trip
              </button>
              <button
                onClick={() => setTripType("one-way")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  tripType === "one-way"
                    ? "bg-white text-[#003580]"
                    : "text-white",
                )}
              >
                One way
              </button>
              <button
                onClick={() => setTripType("multi-city")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  tripType === "multi-city"
                    ? "bg-white text-[#003580]"
                    : "text-white",
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
                        {departureDate
                          ? formatDisplayDate(departureDate, "dd MMM")
                          : "Departure"}
                        {tripType === "round-trip" && (
                          <>
                            {" - "}
                            {returnDate
                              ? formatDisplayDate(returnDate, "dd MMM")
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
                          {travelers.adults} adult
                          {travelers.adults > 1 ? "s" : ""}
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
                        <div className="text-xs text-gray-500">
                          Travel class
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Search Button */}
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
                  navigate(`/flights?${searchParams.toString()}`);
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
                                <Plane className="w-4 h-4 text-[#003580]" />
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
                                <MapPin className="w-4 h-4 text-[#003580]" />
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
        <div className="bg-white border-t border-gray-200">
          <div className="grid grid-cols-4 h-16">
            <button className="flex flex-col items-center justify-center space-y-1">
              <Plane className="w-5 h-5 text-[#003580]" />
              <span className="text-xs text-[#003580] font-medium">
                Flights
              </span>
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
      </div>

      {/* DESKTOP LAYOUT (≥769px) - Enhanced Original Design */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <header className="text-white" style={{ backgroundColor: "#003580" }}>
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
                          {
                            code: "KRW",
                            symbol: "₩",
                            name: "South Korean Won",
                          },
                          {
                            code: "SGD",
                            symbol: "S$",
                            name: "Singapore Dollar",
                          },
                          {
                            code: "AUD",
                            symbol: "A$",
                            name: "Australian Dollar",
                          },
                          {
                            code: "CAD",
                            symbol: "C$",
                            name: "Canadian Dollar",
                          },
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
                  Control your price for flights & hotels — with live AI
                  bargaining.
                </h1>
                <p className="text-white text-sm sm:text-base md:text-lg opacity-80 mb-3 sm:mb-4 px-4">
                  Join 50M+ travelers who bargain smarter.
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
                            ? formatDisplayDate(departureDate) || "Select date"
                            : departureDate
                              ? `${formatDisplayDate(departureDate)}${returnDate ? ` - ${formatDisplayDate(returnDate)}` : " - Return"}`
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

                          {/* Calendar Container */}
                          <div className="fixed top-16 left-4 right-4 bottom-16 z-[100000] sm:absolute sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 sm:top-14 sm:bottom-auto sm:w-[700px] sm:max-w-[700px]">
                            <div className="h-full overflow-y-auto sm:h-auto bg-white rounded-lg sm:rounded-lg shadow-2xl">
                              <div className="p-0">
                                <BookingCalendar
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
                                    console.log(
                                      "Flight calendar range selected:",
                                      range,
                                    );
                                    setDepartureDate(range.startDate);
                                    if (tripType === "round-trip") {
                                      setReturnDate(range.endDate);
                                    }
                                  }}
                                  onClose={() => setShowCalendar(false)}
                                  className="w-full"
                                  bookingType="flight"
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
                          const searchParams = getSearchParams();
                          searchParams.set(
                            "adults",
                            travelers.adults.toString(),
                          );
                          searchParams.set(
                            "children",
                            travelers.children.toString(),
                          );
                          if (tripType === "multi-city") {
                            searchParams.set(
                              "segments",
                              JSON.stringify(flightSegments),
                            );
                          }
                          navigate(`/flights?${searchParams.toString()}`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded h-12 font-medium text-sm w-full touch-manipulation"
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

        {/* Upgrade & Add-ons Section */}
        <section className="py-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#003580] rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Want Business Class or Room Upgrade?
                  </h3>
                  <p className="text-gray-600">Bargain for It Instantly.</p>
                </div>
              </div>
              <Button className="bg-[#003580] hover:bg-[#0071c2] text-white font-medium px-6 py-2 rounded-lg">
                Start Bargaining
              </Button>
            </div>
          </div>
        </section>

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
                      <p className="text-sm font-medium text-gray-700">Email</p>
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
                  <span className="text-blue-100">Mobile-exclusive deals</span>
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
                    <div className="text-xs text-gray-300">Download on the</div>
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
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>We respect your inbox.</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Faredown</h3>
                <p className="text-gray-400 text-sm">
                  The world's first travel portal where you control the price.
                  Bargain for better deals on flights and hotels.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-400 hover:text-white cursor-pointer">
                    About Us
                  </div>
                  <div className="text-gray-400 hover:text-white cursor-pointer">
                    How It Works
                  </div>
                  <div className="text-gray-400 hover:text-white cursor-pointer">
                    Contact
                  </div>
                  <div className="text-gray-400 hover:text-white cursor-pointer">
                    Help Center
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <div className="space-y-2 text-sm">
                  <Link
                    to="/flights"
                    className="text-gray-400 hover:text-white cursor-pointer block"
                  >
                    Flights
                  </Link>
                  <Link
                    to="/hotels"
                    className="text-gray-400 hover:text-white cursor-pointer block"
                  >
                    Hotels
                  </Link>
                  <div className="text-gray-400 hover:text-white cursor-pointer">
                    Car Rentals
                  </div>
                  <div className="text-gray-400 hover:text-white cursor-pointer">
                    Travel Insurance
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <div className="space-y-2 text-sm">
                  <Link
                    to="/privacy-policy"
                    className="text-gray-400 hover:text-white cursor-pointer block"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/terms-conditions"
                    className="text-gray-400 hover:text-white cursor-pointer block"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    to="/cookie-policy"
                    className="text-gray-400 hover:text-white cursor-pointer block"
                  >
                    Cookie Policy
                  </Link>
                  <Link
                    to="/refund-policy"
                    className="text-gray-400 hover:text-white cursor-pointer block"
                  >
                    Refund Policy
                  </Link>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2024 Faredown.com. All rights reserved.</p>
            </div>
          </div>
        </footer>
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
                <span>����</span>
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
    </div>
  );
}
