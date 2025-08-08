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
                  className={cn(
                    "text-white hover:text-[#e7f0fa] cursor-pointer flex items-center py-4",
                    false ? "font-semibold border-b-2 border-white" : "",
                  )}
                >
                  <span>Flights</span>
                </Link>
                <Link
                  to="/hotels"
                  className={cn(
                    "text-white hover:text-[#e7f0fa] cursor-pointer flex items-center py-4",
                    false ? "font-semibold border-b-2 border-white" : "",
                  )}
                >
                  <span>Hotels</span>
                </Link>
                <Link
                  to="/sightseeing"
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
                      {selectedCurrency}
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
                          selectedCurrency === currency.code
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
                <Monument className="w-8 h-8 text-[#003580]" />
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

      {/* CTA SECTION */}
      <section className="bg-[#003580] text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Explore the World?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Start your adventure today with Faredown's amazing sightseeing experiences.
          </p>
          <Button
            onClick={() => document.querySelector('.sightseeing-search-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-[#febb02] hover:bg-[#e6a602] text-black font-semibold px-8 py-3 text-lg"
          >
            Start Exploring
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}
