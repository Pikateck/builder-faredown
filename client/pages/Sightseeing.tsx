import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDateContext } from "@/contexts/DateContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SimpleCalendar } from "@/components/SimpleCalendar";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { addDays } from "date-fns";
import {
  Plane,
  ChevronDown,
  ArrowRightLeft,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Settings,
  User,
  Camera,
  Heart,
  TrendingUp,
  DollarSign,
  Shield,
  Headphones,
  ArrowRight,
  Search,
  X,
  Globe,
  Zap,
  Bell,
  Menu,
  LogOut,
  Code,
  Clock,
  Star,
  Building2,
  Ticket,
  Binoculars,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import {
  MobileCityDropdown,
  MobileDatePicker,
  MobileTravelers,
} from "@/components/MobileDropdowns";
import { SightseeingSearchForm } from "@/components/SightseeingSearchForm";

export default function Sightseeing() {
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();
  const {
    departureDate,
    returnDate,
    setDepartureDate,
    setReturnDate,
    tripType,
    setTripType,
    formatDisplayDate,
  } = useDateContext();

  const { selectedCurrency, currencies, setCurrency } = useCurrency();

  // State for sightseeing search functionality
  const [activeTab, setActiveTab] = useState("sightseeing");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showFromCities, setShowFromCities] = useState(false);
  const [showToCities, setShowToCities] = useState(false);
  const [selectedFromCity, setSelectedFromCity] = useState("Mumbai");
  const [selectedToCity, setSelectedToCity] = useState("Dubai");
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);
  const [showDesktopCalendar, setShowDesktopCalendar] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState("Standard");
  const [showTravelers, setShowTravelers] = useState(false);
  const [travelers, setTravelers] = useState({
    adults: 2,
    children: 0,
    childAges: [] as number[],
  });

  // Mobile dropdown states
  const [showMobileDestination, setShowMobileDestination] = useState(false);
  const [showMobileDates, setShowMobileDates] = useState(false);
  const [showMobileGuests, setShowMobileGuests] = useState(false);
  const [selectedDepartureDate, setSelectedDepartureDate] =
    useState<Date | null>(null);
  const [selectedReturnDate, setSelectedReturnDate] = useState<Date | null>(
    null,
  );
  const [selectingDeparture, setSelectingDeparture] = useState(true);

  // Mobile menu states to match flights page
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // User state
  const userName = user?.name || "Zubin Aibara";

  // Handle sign out
  const handleSignOut = () => {
    logout();
  };

  // City data for sightseeing destinations
  const cityData = {
    Mumbai: {
      code: "BOM",
      name: "Mumbai",
      airport: "Mumbai, Maharashtra, India",
      fullName: "Mumbai, Maharashtra, India",
    },
    Delhi: {
      code: "DEL",
      name: "Delhi",
      airport: "New Delhi, Delhi, India",
      fullName: "New Delhi, Delhi, India",
    },
    Dubai: {
      code: "DXB",
      name: "Dubai",
      airport: "Dubai, United Arab Emirates",
      fullName: "Dubai, United Arab Emirates",
    },
    "Abu Dhabi": {
      code: "AUH",
      name: "Abu Dhabi",
      airport: "Abu Dhabi, United Arab Emirates",
      fullName: "Abu Dhabi, United Arab Emirates",
    },
    Singapore: {
      code: "SIN",
      name: "Singapore",
      airport: "Singapore, Singapore",
      fullName: "Singapore, Singapore",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* MOBILE-FIRST DESIGN: App-style layout for mobile, standard for desktop */}
      
      {/* MOBILE HEADER (ONLY visible on mobile) */}
      <div className="md:hidden">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-blue-200 hover:bg-blue-600"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-blue-200 hover:bg-blue-600"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Offer Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2">
            <div className="flex items-center justify-center space-x-2">
              <Ticket className="w-4 h-4" />
              <span className="text-sm font-medium">
                🎭 Explore Amazing Experiences - Save up to 40%!
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Slide-out Menu */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-xl">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#003580]">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-1">
                  <Link
                    to="/flights"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Plane className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Flights</span>
                  </Link>
                  <Link
                    to="/hotels"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Hotels</span>
                  </Link>
                  <Link
                    to="/sightseeing"
                    className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Camera className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-600">Sightseeing</span>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* DESKTOP HEADER (ONLY visible on desktop) */}
      <div className="hidden md:block">
        <header className="text-white bg-[#003580]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                  <Plane className="w-5 h-5 text-[#003580]" />
                </div>
                <span className="text-lg sm:text-xl font-bold tracking-tight">
                  faredown.com
                </span>
              </Link>

              {/* CENTERED NAVIGATION */}
              <nav className="flex items-center space-x-6 lg:space-x-8 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
                <Link
                  to="/flights"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={cn(
                    "text-white hover:text-[#e7f0fa] cursor-pointer flex items-center py-4",
                    false ? "font-semibold border-b-2 border-white" : "",
                  )}
                >
                  <span>Flights</span>
                </Link>
                <Link
                  to="/hotels"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={cn(
                    "text-white hover:text-[#e7f0fa] cursor-pointer flex items-center py-4",
                    false ? "font-semibold border-b-2 border-white" : "",
                  )}
                >
                  <span>Hotels</span>
                </Link>
                <Link
                  to="/sightseeing"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={cn(
                    "text-white hover:text-[#e7f0fa] cursor-pointer flex items-center py-4",
                    true ? "font-semibold border-b-2 border-white" : "",
                  )}
                >
                  <span>Sightseeing</span>
                </Link>
              </nav>

              <div className="flex items-center space-x-2 md:space-x-6">
                {/* Currency dropdown */}
                <DropdownMenu
                  open={showCurrencyDropdown}
                  onOpenChange={setShowCurrencyDropdown}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-white hover:text-[#e7f0fa] hover:bg-blue-600 text-sm px-3 py-2"
                    >
                      {selectedCurrency.symbol} {selectedCurrency.code}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-64 overflow-y-auto">
                    {currencies.map((currency) => (
                      <DropdownMenuItem
                        key={currency.code}
                        onClick={() => {
                          setCurrency(currency.code);
                          setShowCurrencyDropdown(false);
                        }}
                        className={cn(
                          "cursor-pointer",
                          selectedCurrency.code === currency.code
                            ? "bg-blue-50 text-blue-700"
                            : "",
                        )}
                      >
                        {currency.symbol} {currency.code} - {currency.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center space-x-3">
                  {isLoggedIn ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center space-x-2 bg-blue-600 rounded-full px-2 md:px-3 py-2 hover:bg-blue-800">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-900" />
                        </div>
                        <span className="hidden sm:inline text-sm font-medium">
                          {userName}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => navigate("/account")}>
                          <User className="w-4 h-4 mr-2" />
                          My Account
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/bookings")}>
                          <Ticket className="w-4 h-4 mr-2" />
                          My Bookings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      onClick={() => navigate("/auth/signin")}
                      className="bg-white text-blue-700 hover:bg-blue-50 font-medium rounded-md px-4 py-2 text-sm"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-[#003580] to-[#0071c2] text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
              Discover Amazing Experiences
            </h1>
            <p className="text-base md:text-lg text-blue-100 max-w-2xl mx-auto">
              Explore fascinating attractions, cultural landmarks, and exciting activities. 
              Create unforgettable memories with our curated sightseeing experiences.
            </p>
          </div>

          {/* SEARCH FORM */}
          <div className="max-w-4xl mx-auto">
            <SightseeingSearchForm />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Why Choose Faredown Sightseeing?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make it easy to discover and book the best attractions and activities around the world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#febb02] rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-[#003580]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Bargain Engine
              </h3>
              <p className="text-gray-600 text-sm">
                Get the best deals with our smart bargaining system that saves you up to 40%.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#febb02] rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-[#003580]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Curated Experiences
              </h3>
              <p className="text-gray-600 text-sm">
                Hand-picked attractions and activities to ensure memorable experiences.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#febb02] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#003580]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure Booking
              </h3>
              <p className="text-gray-600 text-sm">
                Safe and secure payment processing with instant confirmation.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#febb02] rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-[#003580]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                24/7 Support
              </h3>
              <p className="text-gray-600 text-sm">
                Round-the-clock customer support to help you every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR DESTINATIONS */}
      <section className="py-12 md:py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-gray-600">
              Discover trending sightseeing experiences in these amazing destinations
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Dubai", flag: "🇦🇪", attractions: "120+ experiences" },
              { name: "Paris", flag: "🇫🇷", attractions: "200+ experiences" },
              { name: "London", flag: "🇬🇧", attractions: "180+ experiences" },
              { name: "Tokyo", flag: "🇯🇵", attractions: "150+ experiences" },
              { name: "Barcelona", flag: "🇪🇸", attractions: "90+ experiences" },
              { name: "Mumbai", flag: "🇮🇳", attractions: "80+ experiences" },
            ].map((destination) => (
              <div
                key={destination.name}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() =>
                  navigate(
                    `/sightseeing/results?destination=${destination.name}&date=${new Date().toISOString().split("T")[0]}&adults=2&children=0`,
                  )
                }
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-4xl">{destination.flag}</span>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {destination.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {destination.attractions}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              What Our Travelers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Amazing experience at the Burj Khalifa! The booking process was seamless and the views were incredible."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">SA</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah Ahmed</p>
                  <p className="text-sm text-gray-500">Dubai Experience</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "The bargain feature saved us 35% on our Louvre tickets. Faredown makes travel affordable!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">MJ</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Michael Johnson</p>
                  <p className="text-sm text-gray-500">Paris Experience</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Fast confirmation and great customer support. Highly recommend for booking sightseeing tours!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">RP</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Raj Patel</p>
                  <p className="text-sm text-gray-500">London Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY FAREDOWN IS REINVENTING TRAVEL BOOKING */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Why Faredown Is Reinventing Travel Booking
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The future of booking isn't fixed pricing — it's live bargaining.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Live Bargain Technology
              </h3>
              <p className="text-gray-600 text-sm">
                Negotiate sightseeing prices in real-time and discover the best deals available.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pay What You Feel Is Fair
              </h3>
              <p className="text-gray-600 text-sm">
                Set your price and let Faredown do its job to get a deal that works for everyone.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure, Real-Time Bookings
              </h3>
              <p className="text-gray-600 text-sm">
                Your data is encrypted and transactions are processed securely and instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smarter Than Any Travel Agent
              </h3>
              <p className="text-gray-600 text-sm">
                Skip the back and forth. Our AI works faster, smarter, and always in your favor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY MILLIONS */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Trusted by 50M+ Travelers
            </h2>
            <p className="text-gray-600">
              Real reviews from verified travelers
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="flex text-green-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900">4.9</span>
            </div>
          </div>

          <div className="text-center mb-12">
            <p className="text-gray-600">
              Excellent • Based on 50,000+ reviews on Trustpilot
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-1">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Live Chat</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Diya Sharma</h3>
              <p className="text-sm text-gray-500 mb-3">Marketing Manager</p>
              <div className="flex justify-center text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 text-sm">
                "Saved ₹15,000 on Dubai trip! The bargaining feature is amazing. Got business class for economy price!"
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-1">
                  <Headphones className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Phone Call</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Rohit Kumar</h3>
              <p className="text-sm text-gray-500 mb-3">Software Engineer</p>
              <div className="flex justify-center text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 text-sm">
                "Best app especially in Singapore hotels using Bargain™. Faredown is revolutionary! Customer service A+++"
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-1">
                  <User className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">24/7 Support</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Anjali Patel</h3>
              <p className="text-sm text-gray-500 mb-3">Product Designer</p>
              <div className="flex justify-center text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 text-sm">
                "Easy booking process and instant confirmations. Saved on both flights and hotels. Will use again!"
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Safe, Verified, and Instant Confirmations. Backed by real humans.
            </p>
          </div>
        </div>
      </section>

      {/* APP DOWNLOAD SECTION */}
      <section className="bg-[#003580] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Travel Smarter. Bargain Better. On the Go.
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Download the Faredown app for exclusive mobile-only deals and instant bargain alerts
            </p>
          </div>

          <div className="flex justify-center items-center space-x-8 mb-8">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#febb02]" />
              <span className="text-sm">Instant notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#febb02]" />
              <span className="text-sm">Mobile-exclusive deals</span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-[#febb02]" />
              <span className="text-sm">Offline management</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
              onClick={() => window.open('https://apps.apple.com/', '_blank')}
            >
              <span className="text-lg">📱</span>
              <div className="text-left">
                <div className="text-xs">Download on the</div>
                <div className="font-semibold">App Store</div>
              </div>
            </Button>
            <Button
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
              onClick={() => window.open('https://play.google.com/', '_blank')}
            >
              <span className="text-lg">▶️</span>
              <div className="text-left">
                <div className="text-xs">Get it on</div>
                <div className="font-semibold">Google Play</div>
              </div>
            </Button>
          </div>
        </div>
      </section>

      {/* NEWSLETTER SIGNUP */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Stay ahead with secret travel bargains
          </h2>
          <p className="text-gray-600 mb-8">
            Enter your email address
          </p>
          <div className="flex justify-center max-w-md mx-auto">
            <div className="flex w-full">
              <input
                type="email"
                placeholder="No spam promise ✋"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#003580] focus:border-transparent"
              />
              <Button className="bg-[#003580] hover:bg-[#002347] text-white px-6 py-3 rounded-r-lg">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1a1a2e] text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3">Faredown</h3>
              <p className="text-gray-400 text-sm mb-4">
                The world's first travel portal where you can negotiate and bargain for better deals.
              </p>
              <div className="flex space-x-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Services</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li><Link to="/flights" className="hover:text-white">Flights</Link></li>
                <li><Link to="/hotels" className="hover:text-white">Hotels</Link></li>
                <li><Link to="/sightseeing" className="hover:text-white">Sightseeing</Link></li>
                <li><Link to="/car-rental" className="hover:text-white">Car Rental</Link></li>
                <li><Link to="/travel-insurance" className="hover:text-white">Travel Insurance</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/refund" className="hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-6 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3 text-xs text-gray-400">
                  <span className="font-semibold">Certified by:</span>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white rounded px-2 py-1">
                      <span className="text-[#003580] font-bold text-xs">TAAI</span>
                    </div>
                    <div className="bg-white rounded px-2 py-1">
                      <span className="text-[#003580] font-bold text-xs">TAAFI</span>
                    </div>
                    <div className="bg-white rounded px-2 py-1">
                      <span className="text-[#003580] font-bold text-xs">IATA</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                © 2025 Faredown.com. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}
