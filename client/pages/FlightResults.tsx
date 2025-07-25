import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileFilters } from "@/components/MobileFilters";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { BookingCalendar } from "@/components/BookingCalendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import {
  Plane,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  X,
  Shield,
  Users,
  User,
  BookOpen,
  Award,
  Heart,
  LogOut,
  Settings,
  CreditCard,
  Luggage,
  Info,
  Target,
  CheckCircle,
  XCircle,
  RefreshCw,
  Menu,
  Star,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  MapPin,
  Clock,
  Wifi,
  Headphones,
  Calendar,
  TrendingUp,
} from "lucide-react";

// Flight data with fare types
const flightData = [
  {
    id: 1,
    departureTime: "10:15",
    arrivalTime: "11:45",
    departureCode: "BOM",
    arrivalCode: "DXB",
    duration: "3h 30m",
    returnDepartureTime: "13:00",
    returnArrivalTime: "17:40",
    returnDuration: "4h 40m",
    airline: "Emirates",
    flightNumber: "EK 500",
    logo: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F64e4a8449d984f8fb3cfc5224927fe3c?format=webp&width=800",
    aircraft: "Boeing 777",
    flightType: "Direct",
    stops: 0,
    fareTypes: [
      {
        name: "Eco Saver",
        price: 32168,
        features: ["Carry-on included"],
        baggage: "23kg",
      },
      {
        name: "Eco Flex",
        price: 35253,
        features: ["Carry-on + checked bag", "Free cancellation"],
        baggage: "23kg",
      },
      {
        name: "Eco Flexplus",
        price: 37506,
        features: ["Priority boarding", "Extra legroom"],
        baggage: "23kg",
      },
    ],
  },
  {
    id: 2,
    departureTime: "04:25",
    arrivalTime: "06:00",
    departureCode: "BOM",
    arrivalCode: "DXB",
    duration: "3h 35m",
    returnDepartureTime: "13:00",
    returnArrivalTime: "17:40",
    returnDuration: "4h 40m",
    airline: "Emirates",
    flightNumber: "EK 502",
    logo: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F64e4a8449d984f8fb3cfc5224927fe3c?format=webp&width=800",
    aircraft: "Boeing 777",
    flightType: "Direct",
    stops: 0,
    fareTypes: [
      {
        name: "Eco Saver",
        price: 32168,
        features: ["Carry-on included"],
        baggage: "23kg",
      },
      {
        name: "Eco Flex",
        price: 35253,
        features: ["Carry-on + checked bag", "Free cancellation"],
        baggage: "23kg",
      },
      {
        name: "Eco Flexplus",
        price: 37506,
        features: ["Priority boarding", "Extra legroom"],
        baggage: "23kg",
      },
    ],
  },
  {
    id: 3,
    departureTime: "14:20",
    arrivalTime: "16:05",
    departureCode: "BOM",
    arrivalCode: "DXB",
    duration: "3h 45m",
    returnDepartureTime: "18:30",
    returnArrivalTime: "23:15",
    returnDuration: "4h 45m",
    airline: "Air India",
    flightNumber: "AI 131",
    logo: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F5ced42d744ea46f9b9a1e71f3ee70d15?format=webp&width=800",
    aircraft: "Airbus A320",
    flightType: "Direct",
    stops: 0,
    fareTypes: [
      {
        name: "Economy",
        price: 28450,
        features: ["Carry-on included"],
        baggage: "20kg",
      },
      {
        name: "Premium Economy",
        price: 31200,
        features: ["Carry-on + checked bag", "Priority boarding"],
        baggage: "25kg",
      },
    ],
  },
  {
    id: 4,
    departureTime: "08:15",
    arrivalTime: "12:30",
    departureCode: "BOM",
    arrivalCode: "DXB",
    duration: "4h 15m",
    returnDepartureTime: "14:00",
    returnArrivalTime: "19:30",
    returnDuration: "5h 30m",
    airline: "Indigo",
    flightNumber: "6E 1406",
    logo: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fde5fb672c9d04b3f8118cb8a0874235a?format=webp&width=800",
    aircraft: "Airbus A321",
    flightType: "1 Stop",
    stops: 1,
    fareTypes: [
      {
        name: "Saver",
        price: 25890,
        features: ["Carry-on included"],
        baggage: "15kg",
      },
      {
        name: "Flexi",
        price: 29100,
        features: ["Carry-on + checked bag", "Free cancellation"],
        baggage: "20kg",
      },
    ],
  },
];

export default function FlightResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get passenger data from URL params
  const adults = parseInt(searchParams.get("adults") || "1");
  const children = parseInt(searchParams.get("children") || "0");
  const [selectedFlight, setSelectedFlight] = useState<
    (typeof flightData)[0] | null
  >(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Mobile UI states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showSearchEdit, setShowSearchEdit] = useState(false);

  // Search panel states
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState("Economy");
  const [tripType, setTripType] = useState("round-trip");
  const [showFromCities, setShowFromCities] = useState(false);
  const [showToCities, setShowToCities] = useState(false);
  const [selectedFromCity, setSelectedFromCity] = useState("Mumbai");
  const [selectedToCity, setSelectedToCity] = useState("Dubai");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTravelers, setShowTravelers] = useState(false);
  const [travelers, setTravelers] = useState({ adults: 1, children: 0 });
  const [selectedDepartureDate, setSelectedDepartureDate] =
    useState("09-Dec-2024");
  const [selectedReturnDate, setSelectedReturnDate] = useState("16-Dec-2024");
  const [selectingDeparture, setSelectingDeparture] = useState(true);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(0);

  // Bargain states
  const [showBargainModal, setShowBargainModal] = useState(false);
  const [bargainFlight, setBargainFlight] = useState<
    (typeof flightData)[0] | null
  >(null);
  const [bargainFareType, setBargainFareType] = useState<any>(null);
  const [bargainStep, setBargainStep] = useState<
    "input" | "progress" | "result"
  >("input");
  const [bargainPrice, setBargainPrice] = useState("");
  const [bargainProgress, setBargainProgress] = useState(0);
  const [bargainResult, setBargainResult] = useState<
    "accepted" | "rejected" | "counter" | null
  >(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [bargainTimer, setBargainTimer] = useState(0);
  const [faredownBonus, setFaredownBonus] = useState(0);

  // Flight details modal states
  const [showFlightDetails, setShowFlightDetails] = useState(false);
  const [selectedFlightForDetails, setSelectedFlightForDetails] = useState<
    (typeof flightData)[0] | null
  >(null);
  const [sortBy, setSortBy] = useState<"cheapest" | "fastest">("cheapest");
  const [expandedTicketOptions, setExpandedTicketOptions] = useState<
    number | null
  >(null);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState({
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
  });
  const [usedPrices, setUsedPrices] = useState<Set<string>>(new Set());
  const [aiOfferPrice, setAiOfferPrice] = useState<number | null>(null);
  const [isOfferValid, setIsOfferValid] = useState(false);
  const [offerExpiryTime, setOfferExpiryTime] = useState(0);

  // Format number with commas
  const formatNumberWithCommas = (num: string) => {
    if (!num) return "";
    return parseInt(num).toLocaleString("en-IN");
  };

  // Convert number to words (Indian numbering system)
  const numberToWords = (num: string): string => {
    if (!num || parseInt(num) <= 0) return "";

    const n = parseInt(num);
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const convertHundreds = (num: number): string => {
      let result = "";

      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
      }

      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + " ";
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + " ";
        return result;
      }

      if (num > 0) {
        result += ones[num] + " ";
      }

      return result;
    };

    if (n === 0) return "Zero";

    let result = "";

    // Handle crores (10,000,000s)
    if (n >= 10000000) {
      result += convertHundreds(Math.floor(n / 10000000)) + "Crore ";
    }

    // Handle lakhs (100,000s)
    if (n >= 100000) {
      const lakhs = Math.floor((n % 10000000) / 100000);
      if (lakhs > 0) {
        result += convertHundreds(lakhs) + "Lakh ";
      }
    }

    // Handle thousands
    if (n >= 1000) {
      const thousands = Math.floor((n % 100000) / 1000);
      if (thousands > 0) {
        result += convertHundreds(thousands) + "Thousand ";
      }
    }

    // Handle hundreds
    const remainder = n % 1000;
    if (remainder > 0) {
      result += convertHundreds(remainder);
    }

    return result.trim() + " Rupees Only";
  };

  // Airlines filter state - Initialize with all airlines selected to show all flights by default
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(
    new Set([
      "Emirates", "Air India", "Indigo", "Fly Dubai", "Air Arabia", "Spicejet",
      "Vistara", "Air Asia", "GoAir", "Alliance Air", "Qatar Airways", "Etihad Airways",
      "Lufthansa", "British Airways", "Singapore Airlines", "Thai Airways", "Malaysia Airlines",
      "Kuwait Airways", "Oman Air", "Saudia", "Turkish Airlines", "Flydubai"
    ]),
  );

  // Additional filter states (needed to prevent errors)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedStops, setSelectedStops] = useState<string>("any");
  const [departureTimeRange, setDepartureTimeRange] = useState<[number, number]>([0, 24]);
  const [arrivalTimeRange, setArrivalTimeRange] = useState<[number, number]>([0, 24]);
  const [maxDuration, setMaxDuration] = useState<number>(24);
  const [hoveredAirline, setHoveredAirline] = useState<string | null>(null);

  // Exchange rates relative to INR (base currency)
  const exchangeRates = {
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    INR: 1,
    AED: 0.044,
    SAR: 0.045,
    JPY: 1.8,
    CNY: 0.087,
    KRW: 16.2,
    SGD: 0.016,
    AUD: 0.018,
    CAD: 0.017,
    CHF: 0.011,
    THB: 0.42,
    MYR: 0.056,
  };

  // Convert price from INR to selected currency
  const convertPrice = (priceInINR: number): number => {
    const rate =
      exchangeRates[selectedCurrency.code as keyof typeof exchangeRates] || 1;
    return Math.round(priceInINR * rate);
  };

  // Format price with currency symbol
  const formatPrice = (priceInINR: number): string => {
    if (!priceInINR || isNaN(priceInINR)) {
      return `${selectedCurrency.symbol}0`;
    }
    const convertedPrice = convertPrice(priceInINR);
    return `${selectedCurrency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
  };

  // Handle airline filter selection
  const handleAirlineFilter = (airlineName: string, isChecked: boolean) => {
    setSelectedAirlines((prev) => {
      const newSelected = new Set(prev);
      if (isChecked) {
        newSelected.add(airlineName);
      } else {
        newSelected.delete(airlineName);
      }
      return newSelected;
    });
  };

  // Reset filters function
  const resetAllFilters = () => {
    setSelectedAirlines(new Set(availableAirlines));
    setPriceRange([0, 100000]);
    setSelectedStops("any");
    setDepartureTimeRange([0, 24]);
    setArrivalTimeRange([0, 24]);
    setMaxDuration(24);
  };

  // Additional helper functions
  const handleStopsFilter = (stops: string) => {
    setSelectedStops(stops);
  };

  // Calendar helper functions (restored)
  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return months[month];
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateInRange = (date: Date, startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateEqual = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentCalendarMonth === 0) {
        setCurrentCalendarMonth(11);
        setCurrentYear((prev) => prev - 1);
      } else {
        setCurrentCalendarMonth(currentCalendarMonth - 1);
      }
    } else {
      if (currentCalendarMonth === 11) {
        setCurrentCalendarMonth(0);
        setCurrentYear((prev) => prev + 1);
      } else {
        setCurrentCalendarMonth(currentCalendarMonth + 1);
      }
    }
  };

  const handleDateClick = (day: number, month: number, year: number) => {
    const clickedDate = new Date(year, month, day);
    clickedDate.setHours(0, 0, 0, 0);

    if (tripType === "one-way") {
      setSelectedDepartureDate(formatDateHelper(clickedDate));
      setShowCalendar(false);
    } else {
      if (selectingDeparture) {
        setSelectedDepartureDate(formatDateHelper(clickedDate));
        setSelectedReturnDate("");
        setSelectingDeparture(false);
      } else {
        const departureDate = selectedDepartureDate ? new Date(selectedDepartureDate) : null;
        if (departureDate && clickedDate <= departureDate) {
          setSelectedDepartureDate(formatDateHelper(clickedDate));
          setSelectedReturnDate("");
          setSelectingDeparture(false);
        } else {
          setSelectedReturnDate(formatDateHelper(clickedDate));
          setShowCalendar(false);
        }
      }
    }
  };

  // Format date helper
  const formatDateHelper = (date: Date | string, compact = false) => {
    if (!date) return "";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (compact) {
      return dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
    }
    return dateObj
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  };

  // Add calendar year state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // City data mapping (from landing page)
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



  // Expanded airlines list with more options
  const availableAirlines = [
    "Emirates", "Air India", "Indigo", "Fly Dubai", "Air Arabia", "Spicejet",
    "Vistara", "Air Asia", "GoAir", "Alliance Air", "Qatar Airways", "Etihad Airways",
    "Lufthansa", "British Airways", "Singapore Airlines", "Thai Airways", "Malaysia Airlines",
    "Kuwait Airways", "Oman Air", "Saudia", "Turkish Airlines", "Flydubai"
  ];

  const airlineCounts = availableAirlines.reduce((acc, airline) => {
    const count = flightData.filter(flight => flight.airline === airline).length;
    acc[airline] = count > 0 ? count : Math.floor(Math.random() * 15) + 1; // Random count for demo airlines
    return acc;
  }, {} as Record<string, number>);

  // Filter flights based on selected airlines with sorting and pricing logic
  const filteredFlights = (
    selectedAirlines.size === 0
      ? flightData
      : flightData.filter((flight) => selectedAirlines.has(flight.airline))
  )
    .map((flight) => ({
      ...flight,
      fareTypes: flight.fareTypes.map((fareType) => ({
        ...fareType,
        price:
          tripType === "one-way" && fareType.price
            ? Math.round(fareType.price * 0.6)
            : fareType.price || 0,
      })),
      durationMinutes: (() => {
        try {
          const duration = flight.duration || "0h 0m";
          const hours = parseInt(duration.split("h")[0]) || 0;
          const minutes =
            parseInt(duration.split("h ")[1]?.split("m")[0] || "0") || 0;
          return hours * 60 + minutes;
        } catch {
          return 0;
        }
      })(),
    }))
    .sort((a, b) => {
      if (sortBy === "cheapest") {
        const priceA = a.fareTypes[0]?.price || 0;
        const priceB = b.fareTypes[0]?.price || 0;
        return priceA - priceB;
      } else if (sortBy === "fastest") {
        return a.durationMinutes - b.durationMinutes;
      }
      return 0;
    });

  // Test credentials
  const testCredentials = {
    email: "test@faredown.com",
    password: "password123",
    name: "Zubin Aibara",
  };

  // Authentication functions
  const handleSignIn = () => {
    setIsLoggedIn(true);
    setUserName(testCredentials.name);
    setShowSignIn(false);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
  };

  const handleBooking = (flight: (typeof flightData)[0], fareType: any) => {
    navigate("/booking-flow", {
      state: {
        selectedFlight: flight,
        selectedFareType: fareType,
        negotiatedPrice: fareType.price,
        passengers: { adults, children },
      },
    });
  };

  // Bargain functions
  const handleBargain = (flight: (typeof flightData)[0], fareType: any) => {
    setBargainFlight(flight);
    setBargainFareType(fareType);
    setShowBargainModal(true);
    setBargainStep("input");
    setBargainPrice("");
    setBargainProgress(0);
    setBargainResult(null);
    setFinalPrice(0);
    setFaredownBonus(0);
  };

  const generateAICounterOffer = (userPrice: number, originalPrice: number) => {
    const discountRequested = (originalPrice - userPrice) / originalPrice;
    if (discountRequested <= 0.3) {
      return Math.random() < 0.8 ? userPrice : Math.round(userPrice * 1.05);
    } else if (discountRequested <= 0.5) {
      const minOffer = Math.round(originalPrice * 0.7);
      const maxOffer = Math.round(originalPrice * 0.8);
      return Math.max(
        userPrice,
        Math.min(maxOffer, Math.round(userPrice * 1.1)),
      );
    } else {
      return Math.round(originalPrice * 0.7);
    }
  };

  const startBargaining = () => {
    if (!bargainFareType || !bargainPrice) return;

    const targetPriceInSelectedCurrency = parseInt(bargainPrice);
    const targetPriceInINR = Math.round(
      targetPriceInSelectedCurrency /
        (exchangeRates[selectedCurrency.code as keyof typeof exchangeRates] ||
          1),
    );
    const currentPriceInINR = bargainFareType.price;
    const priceKey = `${bargainFareType.name}-${targetPriceInSelectedCurrency}`;

    if (usedPrices.has(priceKey)) {
      alert(
        "You've already tried this price! Please enter a different amount.",
      );
      return;
    }

    if (targetPriceInINR >= currentPriceInINR) {
      alert("Please enter a price lower than the current price!");
      return;
    }

    setUsedPrices((prev) => new Set([...prev, priceKey]));
    setBargainStep("progress");
    setBargainProgress(0);

    const progressInterval = setInterval(() => {
      setBargainProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);

          const aiOfferInINR = generateAICounterOffer(
            targetPriceInINR,
            currentPriceInINR,
          );
          setAiOfferPrice(aiOfferInINR);

          const isExactMatch = aiOfferInINR === targetPriceInINR;
          setBargainResult(isExactMatch ? "accepted" : "counter");
          setBargainStep("result");

          setIsOfferValid(true);
          setOfferExpiryTime(30);

          const timerInterval = setInterval(() => {
            setOfferExpiryTime((prev) => {
              if (prev <= 1) {
                clearInterval(timerInterval);
                setIsOfferValid(false);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* MOBILE-FIRST DESIGN: App-style header for mobile, standard for desktop */}
      <header className="bg-white md:bg-[#003580] shadow-sm md:shadow-none sticky top-0 z-50">
        {/* Mobile Header (≤768px) - App Style */}
        <div className="block md:hidden">
          <div className="px-4 py-3 bg-[#003580]">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <div className="flex-1 text-center">
                <h1 className="text-white font-semibold text-lg">Flight Results</h1>
                <p className="text-blue-200 text-xs">BOM → DXB • 1 adult</p>
              </div>
              <button
                onClick={() => setShowMobileMenu(true)}
                className="p-2 -mr-2"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Mobile Search Summary Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <Plane className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      BOM → DXB
                    </div>
                    <div className="text-xs text-gray-500">Dec 9-16</div>
                  </div>
                </div>
                <div className="text-gray-300">•</div>
                <div className="text-sm text-gray-700">1 adult</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 font-medium px-3 py-1 h-auto"
                onClick={() => setShowSearchEdit(true)}
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Mobile Filter & Sort Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 border-gray-300"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                <Badge variant="secondary" className="ml-2">3</Badge>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 border-gray-300"
                onClick={() => setShowSortOptions(true)}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort: {sortBy === "cheapest" ? "Price" : "Duration"}
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Header (≥769px) - Builder.io Design Format */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between text-white">
              {/* Left: Logo */}
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-white hover:text-blue-200 transition-colors">
                  faredown.com
                </Link>
              </div>

              {/* Center: Navigation */}
              <nav className="flex items-center space-x-8">
                <Link
                  to="/flights"
                  className="text-white font-medium px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-600 transition-colors"
                >
                  Flights
                </Link>
                <Link
                  to="/hotels"
                  className="text-white font-medium px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Hotels
                </Link>
              </nav>

              {/* Right: Currency + Auth */}
              <div className="flex items-center space-x-4">
                {/* Currency Dropdown */}
                <DropdownMenu open={showCurrencyDropdown} onOpenChange={setShowCurrencyDropdown}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-blue-600 border border-blue-400 px-3 py-1 h-8 font-medium"
                    >
                      English (UK) • {selectedCurrency.code}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                    {Object.entries({
                      USD: { symbol: "$", name: "US Dollar" },
                      EUR: { symbol: "€", name: "Euro" },
                      GBP: { symbol: "£", name: "British Pound" },
                      INR: { symbol: "₹", name: "Indian Rupee" },
                      AED: { symbol: "د.إ", name: "UAE Dirham" },
                      SAR: { symbol: "���", name: "Saudi Riyal" },
                      JPY: { symbol: "¥", name: "Japanese Yen" },
                      CNY: { symbol: "¥", name: "Chinese Yuan" },
                      SGD: { symbol: "S$", name: "Singapore Dollar" },
                      AUD: { symbol: "A$", name: "Australian Dollar" },
                      CAD: { symbol: "C$", name: "Canadian Dollar" },
                    }).map(([code, currency]) => (
                      <DropdownMenuItem
                        key={code}
                        onClick={() => {
                          setSelectedCurrency({ code, ...currency });
                          setShowCurrencyDropdown(false);
                        }}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center space-x-2">
                          <span className="font-medium">{code}</span>
                          <span className="text-gray-600">{currency.symbol}</span>
                        </span>
                        <span className="text-sm text-gray-500">{currency.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Auth Buttons */}
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
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Search Form Section - Exact Homepage Design */}
      <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
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

          {/* Desktop Search inputs - Responsive Design */}
          <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3 mt-2 w-full max-w-6xl overflow-visible">
            <div className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                Leaving from
              </label>
              <button
                onClick={() => setShowFromCities(!showFromCities)}
                className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-12 w-full hover:border-blue-600 touch-manipulation"
              >
                <Plane className="w-4 h-4 text-gray-500 mr-2" />
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                    {cityData[selectedFromCity]?.code || "BOM"}
                  </div>
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {cityData[selectedFromCity]?.airport || "Chhatrapati Shivaji International"}
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

            <div className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                Going to
              </label>
              <button
                onClick={() => setShowToCities(!showToCities)}
                className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500 touch-manipulation"
              >
                <Plane className="w-4 h-4 text-gray-500 mr-2" />
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                    {cityData[selectedToCity]?.code || "DXB"}
                  </div>
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {cityData[selectedToCity]?.airport || "Dubai International Airport"}
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

            <div className="relative flex-1 lg:min-w-[320px] lg:max-w-[380px] w-full">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                Travel dates
              </label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <button className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500 touch-manipulation">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {tripType === "one-way"
                          ? selectedDepartureDate || "Select date"
                          : selectedDepartureDate
                            ? `${selectedDepartureDate}${selectedReturnDate ? ` - ${selectedReturnDate}` : " - Return"}`
                            : "Select dates"}
                      </span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <BookingCalendar
                    initialRange={{
                      startDate: selectedDepartureDate ? new Date(selectedDepartureDate) : new Date(),
                      endDate: selectedReturnDate ? new Date(selectedReturnDate) : addDays(new Date(), 7)
                    }}
                    onChange={(range) => {
                      console.log("Flight results calendar range selected:", range);
                      setSelectedDepartureDate(formatDateHelper(range.startDate));
                      if (tripType === "round-trip") {
                        setSelectedReturnDate(formatDateHelper(range.endDate));
                      }
                    }}
                    onClose={() => setShowCalendar(false)}
                    className="w-full"
                    bookingType="flight"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="relative flex-1 lg:min-w-[240px] lg:max-w-[280px] w-full">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                Travelers
              </label>
              <button
                onClick={() => setShowTravelers(!showTravelers)}
                className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-12 w-full hover:border-blue-500 touch-manipulation"
              >
                <svg
                  className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0"
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
                <span className="text-sm text-gray-700 font-medium truncate">
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

            <div className="w-full lg:w-auto lg:min-w-[120px]">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded h-12 font-medium text-sm w-full touch-manipulation">
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        {/* Desktop Sidebar Filters (≥769px) - Hotel Style Applied */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 sticky top-24">
            {/* Filter Header */}
            <div className="text-lg font-semibold mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-[#003580]" />
              Filter by
            </div>

            {/* Clear Filters Button */}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <button
                onClick={resetAllFilters}
                className="w-full text-blue-600 border border-blue-600 hover:bg-blue-50 text-sm h-8 rounded font-medium"
              >
                Clear all filters
              </button>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {/* Stops Filter */}
              <div className="space-y-1">
                <div className="border-b border-gray-200 pb-1">
                  <div className="text-sm font-semibold text-gray-900">Stops</div>
                </div>
                {[
                  { value: "any", label: "Any", count: flightData.length },
                  { value: "direct", label: "Direct only", count: flightData.filter(f => f.stops === 0).length },
                  { value: "1-stop", label: "1 stop", count: flightData.filter(f => f.stops === 1).length },
                  { value: "2-plus", label: "2+ stops", count: flightData.filter(f => f.stops >= 2).length }
                ].map((option) => (
                  <div key={option.value} className="flex items-center justify-between py-0.5 min-h-[24px] pr-1">
                    <label className="text-sm text-gray-700 cursor-pointer flex-1 leading-tight flex items-center">
                      <div className="w-4 h-4 flex items-center justify-center mr-2">
                        <input
                          type="radio"
                          name="stops"
                          value={option.value}
                          checked={selectedStops === option.value}
                          onChange={() => handleStopsFilter(option.value)}
                          className={`w-4 h-4 ${selectedStops === option.value ? 'bg-blue-600' : 'bg-white border border-gray-400'}`}
                        />
                      </div>
                      {option.label}
                    </label>
                    <span className="text-xs text-gray-500 ml-2 mr-1">{option.count}</span>
                  </div>
                ))}
              </div>

              {/* Airlines Filter */}
              <div className="space-y-1 mt-4">
                <div className="border-b border-gray-200 pb-1">
                  <div className="text-sm font-semibold text-gray-900">Airlines</div>
                </div>
                {availableAirlines.map((airline) => (
                  <div
                    key={airline}
                    className="flex items-center justify-between py-0.5 min-h-[24px] group relative pr-1"
                    onMouseEnter={() => setHoveredAirline(airline)}
                    onMouseLeave={() => setHoveredAirline(null)}
                  >
                    <label className="text-sm text-gray-700 cursor-pointer flex-1 leading-tight flex items-center">
                      <div className="w-4 h-4 flex items-center justify-center mr-2">
                        <input
                          type="checkbox"
                          checked={selectedAirlines.has(airline)}
                          onChange={(e) => handleAirlineFilter(airline, e.target.checked)}
                          className={`w-4 h-4 ${selectedAirlines.has(airline) ? 'bg-blue-600' : 'bg-white border border-gray-400'}`}
                        />
                      </div>
                      <span className={`transition-colors ${hoveredAirline === airline ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                        {airline}
                      </span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 ml-2 mr-1">{airlineCounts[airline]}</span>
                      {hoveredAirline === airline && (
                        <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                          Only this airline
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Flight Times */}
              <div className="space-y-1 mt-4">
                <div className="border-b border-gray-200 pb-1">
                  <div className="text-sm font-semibold text-gray-900">Flight times</div>
                </div>

                {/* Departure times */}
                <div className="mt-1 space-y-0">
                  <div className="text-sm font-medium text-gray-700 mb-1">Departing flight</div>
                  {[
                    { label: "3:00 AM - 5:59 AM", range: [3, 6], count: 115 },
                    { label: "6:00 AM - 11:59 AM", range: [6, 12], count: 93 },
                    { label: "12:00 PM - 5:59 PM", range: [12, 18], count: 290 },
                    { label: "6:00 PM - 11:59 PM", range: [18, 24], count: 145 }
                  ].map((time, index) => (
                    <div key={index} className="flex items-center justify-between py-0.5 min-h-[24px] pr-1">
                      <label className="text-sm text-gray-700 cursor-pointer flex-1 leading-tight flex items-center">
                        <div className="w-4 h-4 flex items-center justify-center mr-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 bg-white border border-gray-400"
                          />
                        </div>
                        {time.label}
                      </label>
                      <span className="text-xs text-gray-500 ml-2 mr-1">{time.count}</span>
                    </div>
                  ))}
                </div>

                {/* Return times */}
                <div className="mt-1 space-y-0">
                  <div className="text-sm font-medium text-gray-700 mb-1">Return flight</div>
                  {[
                    { label: "3:00 AM - 5:59 AM", range: [3, 6], count: 115 },
                    { label: "6:00 AM - 11:59 AM", range: [6, 12], count: 93 },
                    { label: "12:00 PM - 5:59 PM", range: [12, 18], count: 290 },
                    { label: "6:00 PM - 11:59 PM", range: [18, 24], count: 145 }
                  ].map((time, index) => (
                    <div key={index} className="flex items-center justify-between py-0.5 min-h-[24px] pr-1">
                      <label className="text-sm text-gray-700 cursor-pointer flex-1 leading-tight flex items-center">
                        <div className="w-4 h-4 flex items-center justify-center mr-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 bg-white border border-gray-400"
                          />
                        </div>
                        {time.label}
                      </label>
                      <span className="text-xs text-gray-500 ml-2 mr-1">{time.count}</span>
                    </div>
                  ))}
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* Flight Results */}
        <div className="flex-1 p-0 md:p-4">
          {/* Desktop Sort Header */}
          <div className="hidden md:flex items-center justify-between mb-6 bg-white rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Sort by:</span>
              <div className="flex space-x-2">
                <Button
                  variant={sortBy === "cheapest" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("cheapest")}
                  className={sortBy === "cheapest" ? "bg-blue-600" : ""}
                >
                  Cheapest
                </Button>
                <Button
                  variant={sortBy === "fastest" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("fastest")}
                  className={sortBy === "fastest" ? "bg-blue-600" : ""}
                >
                  Fastest
                </Button>
              </div>
            </div>
          </div>

          {/* Flight Cards */}
          <div className="space-y-0 md:space-y-4">
            {filteredFlights.map((flight) => (
              <div key={flight.id}>
                {/* MOBILE CARD DESIGN (≤768px) - App Style */}
                <div className="block md:hidden bg-white border-b border-gray-100">
                  <div className="p-4">
                    {/* Flight Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg border shadow-sm flex items-center justify-center">
                          <img
                            src={flight.logo}
                            alt={flight.airline}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {flight.airline}
                          </div>
                          <div className="text-xs text-gray-500">
                            {flight.flightNumber} • {flight.aircraft}
                          </div>
                        </div>
                      </div>
                      <div className="text-right relative">
                        <div className="flex items-center justify-end space-x-1">
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(flight.fareTypes[0].price)}
                          </div>
                          <button
                            onClick={() => setExpandedTicketOptions(
                              expandedTicketOptions === `mobile-tooltip-${flight.id}` ? null : `mobile-tooltip-${flight.id}`
                            )}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Info className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">per person</div>
                        {/* Mobile Fare Breakdown Tooltip */}
                        {expandedTicketOptions === `mobile-tooltip-${flight.id}` && (
                          <div className="absolute right-0 bottom-full mb-2 z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[180px]">
                              <div className="text-center font-medium mb-2">Fare breakdown</div>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>Base fare:</span>
                                  <span>{formatPrice(Math.round(flight.fareTypes[0].price * 0.75))}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Taxes & fees:</span>
                                  <span>{formatPrice(Math.round(flight.fareTypes[0].price * 0.25))}</span>
                                </div>
                                <div className="border-t border-gray-600 pt-1 mt-1">
                                  <div className="flex justify-between font-medium">
                                    <span>Total:</span>
                                    <span>{formatPrice(flight.fareTypes[0].price)}</span>
                                  </div>
                                </div>
                              </div>
                              {/* Tooltip arrow */}
                              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Flight Route - Mobile */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {flight.departureTime}
                        </div>
                        <div className="text-sm text-gray-600">
                          {flight.departureCode}
                        </div>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-dashed border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <div className="bg-white px-2">
                              <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 mb-1">
                                  {flight.duration}
                                </div>
                                <div className="w-3 h-3 bg-[#003580] rounded-full"></div>
                                <div className="text-xs text-green-600 mt-1">
                                  {flight.flightType}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {flight.arrivalTime}
                        </div>
                        <div className="text-sm text-gray-600">
                          {flight.arrivalCode}
                        </div>
                      </div>
                    </div>

                    {/* Flight Features - Mobile */}
                    <div className="flex items-center justify-center space-x-4 mb-4 py-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <Luggage className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-700">Baggage</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-700">Flexible</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Wifi className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-700">Wi-Fi</span>
                      </div>
                    </div>

                    {/* Action Buttons - Mobile */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="bg-white border-2 border-[#febb02] text-[#febb02] hover:bg-[#febb02] hover:text-white font-semibold py-3 text-sm"
                        onClick={() => handleBargain(flight, flight.fareTypes[0])}
                      >
                        🤝 Bargain
                      </Button>
                      <Button
                        className="bg-[#003580] hover:bg-[#0071c2] text-white font-semibold py-3 text-sm"
                        onClick={() => handleBooking(flight, flight.fareTypes[0])}
                      >
                        Book Now
                      </Button>
                    </div>

                    {/* View Details Link - Mobile */}
                    <div className="text-center mt-3">
                      <button
                        onClick={() => setExpandedTicketOptions(
                          expandedTicketOptions === flight.id ? null : flight.id
                        )}
                        className="text-blue-600 text-sm font-medium"
                      >
                        View ticket options {expandedTicketOptions === flight.id ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Options - Mobile */}
                  {expandedTicketOptions === flight.id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      <div className="space-y-3">
                        {flight.fareTypes.map((fareType, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-3 border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-sm">
                                {fareType.name}
                              </div>
                              <div className="text-lg font-bold text-[#003580]">
                                {formatPrice(fareType.price)}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
                              <div className="flex items-center space-x-1">
                                <Luggage className="w-3 h-3" />
                                <span>{fareType.baggage}</span>
                              </div>
                              {fareType.features.map((feature, idx) => (
                                <span key={idx}>{feature}</span>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleBargain(flight, fareType)}
                              >
                                Bargain
                              </Button>
                              <Button
                                size="sm"
                                className="bg-[#003580] text-xs"
                                onClick={() => handleBooking(flight, fareType)}
                              >
                                Book
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* DESKTOP CARD DESIGN (≥769px) - Original Enhanced */}
                <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Green Upgrade Header */}
                  <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                    <span className="text-green-700 text-sm font-medium">
                      ✅ Flexible ticket upgrade available
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Left Side - Flight Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-8">
                          {/* Airline Logo */}
                          <div className="flex flex-col space-y-4">
                            <div className="w-12 h-12 bg-white rounded border border-gray-200 flex items-center justify-center">
                              <img
                                src={flight.logo}
                                alt={flight.airline}
                                className="w-8 h-6 object-contain"
                              />
                            </div>
                            <div className="w-12 h-12 bg-white rounded border border-gray-200 flex items-center justify-center">
                              <img
                                src={flight.logo}
                                alt={flight.airline}
                                className="w-8 h-6 object-contain"
                              />
                            </div>
                          </div>

                          {/* Flight Route */}
                          <div className="space-y-6">
                            {/* Outbound */}
                            <div className="flex items-center space-x-12">
                              <div className="text-center">
                                <div className="text-xl font-bold text-gray-900">
                                  {flight.departureTime}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {flight.departureCode} • Aug 9
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="relative flex items-center">
                                  <div className="w-3 h-3 bg-white border-2 border-gray-400 rounded-full"></div>
                                  <div className="w-16 h-px bg-gray-300 mx-2"></div>
                                  <div className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
                                    {flight.flightType}
                                  </div>
                                  <div className="w-16 h-px bg-gray-300 mx-2"></div>
                                  <div className="w-3 h-3 bg-white border-2 border-gray-400 rounded-full"></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {flight.duration}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-gray-900">
                                  {flight.arrivalTime}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {flight.arrivalCode} • Aug 9
                                </div>
                              </div>
                            </div>

                            {/* Return Flight */}
                            {tripType === "round-trip" && (
                              <div className="flex items-center space-x-12">
                                <div className="text-center">
                                  <div className="text-xl font-bold text-gray-900">
                                    {flight.returnDepartureTime}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {flight.arrivalCode} • Aug 16
                                  </div>
                                </div>
                                <div className="flex flex-col items-center">
                                  <div className="relative flex items-center">
                                    <div className="w-3 h-3 bg-white border-2 border-gray-400 rounded-full"></div>
                                    <div className="w-16 h-px bg-gray-300 mx-2"></div>
                                    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
                                      {flight.flightType}
                                    </div>
                                    <div className="w-16 h-px bg-gray-300 mx-2"></div>
                                    <div className="w-3 h-3 bg-white border-2 border-gray-400 rounded-full"></div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {flight.returnDuration}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xl font-bold text-gray-900">
                                    {flight.returnArrivalTime}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {flight.departureCode} • Aug 17
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-600">
                          {flight.airline}
                        </div>
                      </div>

                      {/* Right Side - Pricing */}
                      <div className="text-center ml-8">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {flight.fareTypes[0].name}
                          </span>
                        </div>
                        <div className="flex items-center justify-center space-x-1 mb-3">
                          <Luggage className="w-4 h-4 text-green-600" />
                          <Shield className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="relative">
                          <div className="flex items-center justify-center space-x-2 mb-1">
                            <div className="text-xl font-bold text-gray-900">
                              {formatPrice(flight.fareTypes[0].price)}
                            </div>
                            <button
                              onClick={() => setExpandedTicketOptions(
                                expandedTicketOptions === `tooltip-${flight.id}` ? null : `tooltip-${flight.id}`
                              )}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Fare Breakdown Tooltip */}
                          {expandedTicketOptions === `tooltip-${flight.id}` && (
                            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[200px]">
                                <div className="text-center font-medium mb-2">Fare breakdown</div>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Base fare:</span>
                                    <span>{formatPrice(Math.round(flight.fareTypes[0].price * 0.75))}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Taxes & fees:</span>
                                    <span>{formatPrice(Math.round(flight.fareTypes[0].price * 0.25))}</span>
                                  </div>
                                  <div className="border-t border-gray-600 pt-1 mt-1">
                                    <div className="flex justify-between font-medium">
                                      <span>Total:</span>
                                      <span>{formatPrice(flight.fareTypes[0].price)}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Tooltip arrow */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mb-4">
                          All-inclusive price
                        </div>
                        <div className="space-y-2 w-32">
                          <Button
                            onClick={() => handleBargain(flight, flight.fareTypes[0])}
                            variant="outline"
                            className="w-full border-[#febb02] text-[#febb02] hover:bg-[#febb02] hover:text-white"
                          >
                            Bargain
                          </Button>
                          <Button
                            onClick={() => handleBooking(flight, flight.fareTypes[0])}
                            className="w-full bg-[#003580] hover:bg-[#0071c2]"
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Explore Options */}
                    <div className="border-t border-gray-200 bg-gray-50 py-2 mt-4 -mx-6 -mb-6 rounded-b-lg">
                      <div className="flex justify-center">
                        <button
                          onClick={() =>
                            setExpandedTicketOptions(
                              expandedTicketOptions === flight.id ? null : flight.id,
                            )
                          }
                          className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors flex items-center py-1 px-2 rounded hover:bg-blue-50"
                        >
                          Explore ticket options
                          <ChevronDown
                            className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                              expandedTicketOptions === flight.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Ticket Options - Desktop */}
                  {expandedTicketOptions === flight.id && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-3 divide-x divide-gray-200">
                        {flight.fareTypes.map((fareType, index) => (
                          <div key={index} className="p-4 text-center">
                            <h4 className="font-medium text-sm text-gray-900 mb-1">
                              {fareType.name}
                            </h4>
                            <div className="flex items-center justify-center space-x-1 mb-2">
                              <Luggage className="w-4 h-4 text-green-600" />
                              <Shield className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="text-lg font-bold text-gray-900 mb-1">
                              {formatPrice(fareType.price)}
                            </div>
                            <div className="text-xs text-gray-600 mb-3">All-inclusive</div>
                            <div className="space-y-2">
                              <Button
                                onClick={() => handleBargain(flight, fareType)}
                                variant="outline"
                                className="w-full border-[#febb02] text-[#febb02] hover:bg-[#febb02] hover:text-white text-xs py-1.5"
                              >
                                Bargain
                              </Button>
                              <Button
                                onClick={() => handleBooking(flight, fareType)}
                                className="w-full bg-[#003580] hover:bg-[#0071c2] text-xs py-1.5"
                              >
                                Book Now
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Lucky Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 mx-4 md:mx-0 flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#003580] rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🍀</span>
            </div>
            <div>
              <p className="font-medium text-[#003580]">
                You're lucky! There are no better prices on nearby dates.
              </p>
              <p className="text-sm text-gray-600">
                Latest prices found for your search.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Padding */}
      <div className="h-20 md:h-0"></div>

      {/* Mobile Navigation Bottom Bar (���768px) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <div className="grid grid-cols-4 h-16">
          <button className="flex flex-col items-center justify-center space-y-1">
            <Plane className="w-5 h-5 text-[#003580]" />
            <span className="text-xs text-[#003580] font-medium">Flights</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500">Hotels</span>
          </button>
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

      {/* Mobile Filters Modal */}
      <Dialog open={showMobileFilters} onOpenChange={setShowMobileFilters}>
        <DialogContent className="w-full h-full max-w-none m-0 rounded-none md:max-w-lg md:h-auto md:rounded-lg">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                Filters & Sort
              </DialogTitle>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          <div className="space-y-6 p-4">
            {/* Sort Options */}
            <div>
              <h3 className="font-medium mb-3">Sort by</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === "cheapest"}
                    onChange={() => setSortBy("cheapest")}
                    className="text-[#003580]"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Cheapest first</div>
                    <div className="text-sm text-gray-500">Lowest price</div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === "fastest"}
                    onChange={() => setSortBy("fastest")}
                    className="text-[#003580]"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Fastest first</div>
                    <div className="text-sm text-gray-500">Shortest duration</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <h3 className="font-medium mb-3">Price range (per person)</h3>
              <div className="flex items-center space-x-2 mb-3">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="flex-1 h-10"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="flex-1 h-10"
                />
              </div>
            </div>

            {/* Stops Filter */}
            <div>
              <h3 className="font-medium mb-3">Stops</h3>
              <div className="space-y-2">
                {[
                  { value: "any", label: "Any", count: flightData.length },
                  { value: "direct", label: "Direct only", count: flightData.filter(f => f.stops === 0).length },
                  { value: "1-stop", label: "1 stop", count: flightData.filter(f => f.stops === 1).length },
                  { value: "2-plus", label: "2+ stops", count: flightData.filter(f => f.stops >= 2).length }
                ].map((option) => (
                  <label key={option.value} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="mobile-stops"
                        value={option.value}
                        checked={selectedStops === option.value}
                        onChange={() => handleStopsFilter(option.value)}
                        className="text-[#003580]"
                      />
                      <span>{option.label}</span>
                    </div>
                    <span className="text-sm text-gray-500">{option.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Airlines Filter */}
            <div>
              <h3 className="font-medium mb-3">Airlines</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableAirlines.map((airline) => (
                  <label key={airline} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedAirlines.has(airline)}
                        onChange={(e) => handleAirlineFilter(airline, e.target.checked)}
                        className="text-[#003580]"
                      />
                      <span>{airline}</span>
                    </div>
                    <span className="text-sm text-gray-500">{airlineCounts[airline]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Flight Times */}
            <div>
              <h3 className="font-medium mb-3">Departure time</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Morning", range: [6, 12], icon: "☀️" },
                  { label: "Afternoon", range: [12, 18], icon: "☀️" },
                  { label: "Evening", range: [18, 24], icon: "🌙" },
                  { label: "Night", range: [0, 6], icon: "🌅" }
                ].map((timeSlot) => (
                  <button
                    key={timeSlot.label}
                    onClick={() => setDepartureTimeRange(timeSlot.range as [number, number])}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      departureTimeRange[0] === timeSlot.range[0] && departureTimeRange[1] === timeSlot.range[1]
                        ? 'border-[#003580] bg-blue-50 text-[#003580]'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-lg mb-1">{timeSlot.icon}</div>
                    <div className="text-xs font-medium">{timeSlot.label}</div>
                    <div className="text-xs text-gray-500">{timeSlot.range[0]}:00-{timeSlot.range[1]}:00</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetAllFilters();
                  setShowMobileFilters(false);
                }}
              >
                Clear all
              </Button>
              <Button
                className="flex-1 bg-[#003580] hover:bg-[#0071c2]"
                onClick={() => setShowMobileFilters(false)}
              >
                Show results
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced AI Bargain Modal */}
      <Dialog open={showBargainModal} onOpenChange={setShowBargainModal}>
        <DialogContent className="w-full h-full max-w-none m-0 rounded-none md:max-w-2xl md:h-auto md:rounded-lg bg-gradient-to-br from-blue-50 to-white">
          <DialogHeader className="border-b border-[#003580]/20 pb-4 bg-gradient-to-r from-[#003580] to-[#0071c2] text-white rounded-t-lg -m-6 mb-6 p-6">
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <span className="text-xl font-semibold">AI Price Negotiator</span>
            </DialogTitle>
          </DialogHeader>

          {bargainFlight && bargainFareType && (
            <div className="space-y-6 p-6">
              {bargainStep === "input" && (
                <>
                  {/* Flight Info */}
                  <div className="bg-white rounded-xl p-6 border border-[#003580]/10 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[#003580]/10 rounded-lg flex items-center justify-center">
                          <Plane className="w-6 h-6 text-[#003580]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {bargainFlight.airline}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {bargainFareType.name} • {bargainFlight.flightNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">
                          Current All-Inclusive Price
                        </p>
                        <p className="text-3xl font-bold text-[#003580]">
                          {formatPrice(bargainFareType.price)}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {numberToWords(bargainFareType.price.toString())}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Interface */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#003580]/5 to-[#0071c2]/5 rounded-xl border border-[#003580]/10">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">AI</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          AI Assistant
                        </p>
                        <p className="text-sm text-gray-600">
                          Tell me your target price and I'll negotiate with the airline!
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-900">
                        What price would you like to pay? ({selectedCurrency.symbol})
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={
                            bargainPrice
                              ? formatNumberWithCommas(bargainPrice)
                              : ""
                          }
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(
                              /[^0-9]/g,
                              "",
                            );
                            setBargainPrice(numericValue);
                          }}
                          placeholder="Enter your target price"
                          className="text-xl font-bold text-center py-6 border-2 border-[#003580]/20 focus:border-[#003580] placeholder:text-gray-400 placeholder:font-normal rounded-xl bg-white shadow-sm"
                        />
                        <div className="absolute inset-y-0 left-4 flex items-center">
                          <span className="text-[#003580] text-xl font-semibold">
                            {selectedCurrency.symbol}
                          </span>
                        </div>
                      </div>
                      {bargainPrice && (
                        <p className="text-center text-sm text-gray-600 mt-2 font-medium">
                          {numberToWords(bargainPrice)}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={startBargaining}
                      disabled={!bargainPrice || parseInt(bargainPrice) <= 0}
                      className="w-full bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002d6b] hover:to-[#005a9f] text-white py-6 text-lg font-semibold rounded-xl disabled:bg-gray-400 shadow-lg"
                    >
                      Start AI Negotiation
                    </Button>
                  </div>
                </>
              )}

              {bargainStep === "progress" && (
                <div className="text-center space-y-6 py-8">
                  <div className="relative">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      <RefreshCw className="w-12 h-12 text-white animate-spin" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      AI Negotiating with {bargainFlight.airline}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Analyzing market rates and finding the best deal for you...
                    </p>
                    <Progress value={bargainProgress} className="w-full h-4 bg-gray-200" />
                    <p className="text-sm text-[#003580] font-semibold mt-2">
                      {bargainProgress}% Complete
                    </p>
                  </div>
                </div>
              )}

              {bargainStep === "result" && (
                <div className="text-center space-y-6">
                  {bargainResult === "accepted" ? (
                    <>
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4 shadow-lg">
                          <CheckCircle className="w-16 h-16 text-green-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-green-600 mb-2">
                          Perfect Match!
                        </h3>
                        <p className="text-gray-600 mb-1 text-lg">
                          The airline accepted your exact price!
                        </p>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 shadow-lg">
                        <div className="text-4xl font-bold text-green-700 mb-2">
                          {selectedCurrency.symbol}
                          {parseInt(bargainPrice).toLocaleString()}
                        </div>
                        <p className="text-sm text-green-600 font-medium">
                          {numberToWords(bargainPrice)}
                        </p>
                      </div>
                    </>
                  ) : bargainResult === "counter" ? (
                    <>
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-[#003580]/10 rounded-full flex items-center justify-center mb-4 shadow-lg">
                          <Target className="w-16 h-16 text-[#003580]" />
                        </div>
                        <h3 className="text-3xl font-bold text-[#003580] mb-2">
                          AI Counter Offer!
                        </h3>
                        <p className="text-gray-600 mb-1 text-lg">
                          The airline couldn't match your price, but here's their best offer!
                        </p>
                      </div>

                      <div className="bg-gradient-to-r from-[#003580]/5 to-[#0071c2]/5 border-2 border-[#003580]/20 rounded-xl p-8 shadow-lg">
                        <div className="text-4xl font-bold text-[#003580] mb-2">
                          {selectedCurrency.symbol}
                          {aiOfferPrice
                            ? convertPrice(aiOfferPrice).toLocaleString()
                            : "0"}
                        </div>
                        <p className="text-sm text-[#003580] font-medium mb-3">
                          {aiOfferPrice ? numberToWords((convertPrice(aiOfferPrice) * (exchangeRates[selectedCurrency.code as keyof typeof exchangeRates] || 1)).toString()) : ""}
                        </p>
                        <div className="text-center">
                          <span className="text-sm font-semibold text-green-600 bg-green-100 px-4 py-2 rounded-full">
                            You save {selectedCurrency.symbol}
                            {convertPrice(
                              bargainFareType.price - (aiOfferPrice || 0),
                            ).toLocaleString()}!
                          </span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {isOfferValid ? (
                    <>
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4 shadow-lg">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-sm">⏰</span>
                          </div>
                          <span className="font-bold text-orange-800 text-xl">
                            Offer expires in: {offerExpiryTime}s
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Button
                          onClick={() => {
                            setShowBargainModal(false);
                            handleBooking(bargainFlight, {
                              ...bargainFareType,
                              price: aiOfferPrice || parseInt(bargainPrice),
                            });
                          }}
                          disabled={!isOfferValid}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-5 text-xl font-bold rounded-xl shadow-lg"
                        >
                          Book This Deal - {selectedCurrency.symbol}
                          {bargainResult === "accepted"
                            ? parseInt(bargainPrice).toLocaleString()
                            : aiOfferPrice
                              ? convertPrice(aiOfferPrice).toLocaleString()
                              : parseInt(bargainPrice).toLocaleString()}
                        </Button>

                        <Button
                          onClick={() => setBargainStep("input")}
                          variant="outline"
                          className="w-full border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white py-4 text-lg font-semibold rounded-xl"
                        >
                          Try Different Price
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-600 font-medium">Offer has expired</p>
                      </div>
                      <Button
                        onClick={() => {
                          setBargainStep("input");
                          setBargainPrice("");
                          setBargainResult(null);
                          setIsOfferValid(false);
                          setOfferExpiryTime(0);
                        }}
                        className="w-full bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002d6b] hover:to-[#005a9f] text-white py-4 text-lg font-semibold rounded-xl"
                      >
                        Start New Negotiation
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
