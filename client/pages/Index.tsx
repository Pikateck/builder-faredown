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
  Building,
  Car,
  Camera,
} from "lucide-react";

export default function Index() {
  const [activeTab, setActiveTab] = useState("flights");
  const [tripType, setTripType] = useState("round-trip");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Flight search states
  const [selectedFromCity, setSelectedFromCity] = useState("Mumbai");
  const [selectedToCity, setSelectedToCity] = useState("Delhi");
  const [showFromCities, setShowFromCities] = useState(false);
  const [showToCities, setShowToCities] = useState(false);
  const [travelers, setTravelers] = useState({
    adults: 1,
    children: 0,
    infants: 0,
  });

  // Hotel search states
  const [hotelDestination, setHotelDestination] = useState("");
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [roomsGuests, setRoomsGuests] = useState({
    rooms: 1,
    adults: 2,
    children: 0,
  });

  // Sightseeing states
  const [sightseeingDestination, setSightseeingDestination] = useState("");
  const [sightseeingDate, setSightseeingDate] = useState<Date>();

  // Transfer states
  const [transferMode, setTransferMode] = useState("airport");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferDate, setTransferDate] = useState<Date>();
  const [transferTime, setTransferTime] = useState("10:00");

  const cityData = {
    Mumbai: {
      code: "BOM",
      name: "Mumbai",
      airport: "Chhatrapati Shivaji International",
      fullName: "Mumbai, India",
    },
    Delhi: {
      code: "DEL",
      name: "Delhi",
      airport: "Indira Gandhi International",
      fullName: "New Delhi, India",
    },
    Bangalore: {
      code: "BLR",
      name: "Bangalore",
      airport: "Kempegowda International",
      fullName: "Bangalore, India",
    },
    Chennai: {
      code: "MAA",
      name: "Chennai",
      airport: "Chennai International",
      fullName: "Chennai, India",
    },
    Dubai: {
      code: "DXB",
      name: "Dubai",
      airport: "Dubai International",
      fullName: "Dubai, United Arab Emirates",
    },
    London: {
      code: "LHR",
      name: "London",
      airport: "Heathrow Airport",
      fullName: "London, United Kingdom",
    },
    "New York": {
      code: "JFK",
      name: "New York",
      airport: "John F. Kennedy International",
      fullName: "New York, United States",
    },
    Singapore: {
      code: "SIN",
      name: "Singapore",
      airport: "Changi Airport",
      fullName: "Singapore, Singapore",
    },
  };

  const handleFlightSearch = () => {
    const searchParams = new URLSearchParams({
      from: selectedFromCity,
      to: selectedToCity,
      departDate: departureDate ? format(departureDate, "yyyy-MM-dd") : "",
      returnDate: tripType === "round-trip" && returnDate ? format(returnDate, "yyyy-MM-dd") : "",
      adults: travelers.adults.toString(),
      children: travelers.children.toString(),
      infants: travelers.infants.toString(),
      tripType,
    });
    window.location.href = `/flights/results?${searchParams.toString()}`;
  };

  const handleHotelSearch = () => {
    const searchParams = new URLSearchParams({
      destination: hotelDestination,
      checkIn: checkInDate ? format(checkInDate, "yyyy-MM-dd") : "",
      checkOut: checkOutDate ? format(checkOutDate, "yyyy-MM-dd") : "",
      rooms: roomsGuests.rooms.toString(),
      adults: roomsGuests.adults.toString(),
      children: roomsGuests.children.toString(),
    });
    window.location.href = `/hotels/results?${searchParams.toString()}`;
  };

  const handleSightseeingSearch = () => {
    const searchParams = new URLSearchParams({
      destination: sightseeingDestination,
      date: sightseeingDate ? format(sightseeingDate, "yyyy-MM-dd") : "",
    });
    window.location.href = `/sightseeing/results?${searchParams.toString()}`;
  };

  const handleTransferSearch = () => {
    const searchParams = new URLSearchParams({
      mode: transferMode,
      from: transferFrom,
      to: transferTo,
      date: transferDate ? format(transferDate, "yyyy-MM-dd") : "",
      time: transferTime,
    });
    window.location.href = `/transfer-results?${searchParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#003580] text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-[#003580]" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                faredown.com
              </span>
            </Link>

            <div className="flex items-center space-x-2 md:space-x-6">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-white p-2"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <button className="text-white hover:text-blue-200">
                  English (UK)
                </button>
                <button className="text-white hover:text-blue-200">
                  ₹ INR
                </button>
                {!isLoggedIn ? (
                  <Button
                    onClick={() => setShowSignIn(true)}
                    variant="outline"
                    className="text-white border-white hover:bg-white hover:text-[#003580]"
                  >
                    Sign In
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Hi, {userName}</span>
                    <Button
                      onClick={() => setIsLoggedIn(false)}
                      variant="outline"
                      size="sm"
                    >
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
              <span className="text-lg font-bold text-gray-900">Menu</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <Link
                to="/flights"
                className="flex items-center space-x-3 text-gray-700 py-3 px-2 rounded hover:bg-gray-100"
                onClick={() => setShowMobileMenu(false)}
              >
                <Plane className="w-5 h-5 text-[#003580]" />
                <span>Flights</span>
              </Link>
              <Link
                to="/hotels"
                className="flex items-center space-x-3 text-gray-700 py-3 px-2 rounded hover:bg-gray-100"
                onClick={() => setShowMobileMenu(false)}
              >
                <Building className="w-5 h-5 text-[#003580]" />
                <span>Hotels</span>
              </Link>
              <Link
                to="/sightseeing"
                className="flex items-center space-x-3 text-gray-700 py-3 px-2 rounded hover:bg-gray-100"
                onClick={() => setShowMobileMenu(false)}
              >
                <Camera className="w-5 h-5 text-[#003580]" />
                <span>Sightseeing</span>
              </Link>
              <Link
                to="/transfers"
                className="flex items-center space-x-3 text-gray-700 py-3 px-2 rounded hover:bg-gray-100"
                onClick={() => setShowMobileMenu(false)}
              >
                <Car className="w-5 h-5 text-[#003580]" />
                <span>Transfers</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section with Tabbed Search */}
      <section className="bg-[#003580] pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center pt-8 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Upgrade. Bargain. Book.
            </h1>
            <p className="text-white text-lg opacity-90 mb-6">
              Faredown is the world's first travel portal where you control the price — for flights and hotels.
            </p>
            <div className="bg-orange-500 text-white px-6 py-2 rounded-full inline-block mb-4">
              🟠 Bargain Mode Activated
            </div>
            <p className="text-white text-sm opacity-80">
              Don't Just Book It. <strong>Bargain It™.</strong>
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-lg p-1 flex space-x-1">
              <button
                onClick={() => setActiveTab("flights")}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  activeTab === "flights"
                    ? "bg-[#003580] text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Plane className="w-4 h-4" />
                <span>Flights</span>
              </button>
              <button
                onClick={() => setActiveTab("hotels")}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  activeTab === "hotels"
                    ? "bg-[#003580] text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Building className="w-4 h-4" />
                <span>Hotels</span>
              </button>
              <button
                onClick={() => setActiveTab("sightseeing")}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  activeTab === "sightseeing"
                    ? "bg-[#003580] text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Camera className="w-4 h-4" />
                <span>Sightseeing</span>
              </button>
              <button
                onClick={() => setActiveTab("transfers")}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  activeTab === "transfers"
                    ? "bg-[#003580] text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Car className="w-4 h-4" />
                <span>Transfers</span>
              </button>
            </div>
          </div>

          {/* Search Forms */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            {/* Flights Tab */}
            <div className={`${activeTab === "flights" ? "" : "hidden"}`}>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Upgrade. Bargain. Book.
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Control your price for flights & hotels — with live AI bargaining.
              </p>

              {/* Trip Type Selector */}
              <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTripType("round-trip")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                    tripType === "round-trip"
                      ? "bg-[#003580] text-white"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Round trip
                </button>
                <button
                  onClick={() => setTripType("one-way")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                    tripType === "one-way"
                      ? "bg-[#003580] text-white"
                      : "text-gray-600 hover:text-gray-900"
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
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Multi-city
                </button>
              </div>

              {/* Flight Search Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">From</label>
                  <Select value={selectedFromCity} onValueChange={setSelectedFromCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select departure city" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(cityData).map(([city, data]) => (
                        <SelectItem key={city} value={city}>
                          {data.code} - {data.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">To</label>
                  <Select value={selectedToCity} onValueChange={setSelectedToCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(cityData).map(([city, data]) => (
                        <SelectItem key={city} value={city}>
                          {data.code} - {data.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Departure</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {departureDate ? format(departureDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={setDepartureDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {tripType === "round-trip" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Return</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {returnDate ? format(returnDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={returnDate}
                          onSelect={setReturnDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <Button
                onClick={handleFlightSearch}
                className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Flights
              </Button>
            </div>

            {/* Hotels Tab */}
            <div className={`${activeTab === "hotels" ? "" : "hidden"}`}>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Find your next stay
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Search low prices on hotels, homes and much more...
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destination</label>
                  <Input
                    placeholder="Where are you going?"
                    value={hotelDestination}
                    onChange={(e) => setHotelDestination(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Check-in</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate ? format(checkInDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={setCheckInDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Check-out</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOutDate ? format(checkOutDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkOutDate}
                        onSelect={setCheckOutDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                onClick={handleHotelSearch}
                className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Hotels
              </Button>
            </div>

            {/* Sightseeing Tab */}
            <div className={`${activeTab === "sightseeing" ? "" : "hidden"}`}>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Discover Amazing Experiences
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Explore fascinating attractions, cultural landmarks, and exciting activities...
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destination</label>
                  <Input
                    placeholder="Where do you want to explore?"
                    value={sightseeingDestination}
                    onChange={(e) => setSightseeingDestination(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {sightseeingDate ? format(sightseeingDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={sightseeingDate}
                        onSelect={setSightseeingDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                onClick={handleSightseeingSearch}
                className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Experiences
              </Button>
            </div>

            {/* Transfers Tab */}
            <div className={`${activeTab === "transfers" ? "" : "hidden"}`}>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Reliable Airport Transfers
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Book safe, comfortable transfers with professional drivers and competitive rates.
              </p>

              <div className="mb-4">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setTransferMode("airport")}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      transferMode === "airport"
                        ? "bg-[#003580] text-white"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Airport Transfer
                  </button>
                  <button
                    onClick={() => setTransferMode("car")}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      transferMode === "car"
                        ? "bg-[#003580] text-white"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Car Rental
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">From</label>
                  <Input
                    placeholder="Pickup location"
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">To</label>
                  <Input
                    placeholder="Drop-off location"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {transferDate ? format(transferDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={transferDate}
                        onSelect={setTransferDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  <Select value={transferTime} onValueChange={setTransferTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0");
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleTransferSearch}
                className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
              >
                <Search className="w-4 h-4 mr-2" />
                Search {transferMode === "airport" ? "Transfers" : "Car Rentals"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Faredown Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Faredown Is Reinventing Travel Booking
            </h2>
            <p className="text-gray-600 text-lg">
              The future of booking isn't fixed pricing — it's <strong>live bargaining</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-[#003580] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Live Bargain Technology</h3>
              <p className="text-gray-600">
                Our AI negotiates in real-time, adapting to demand from 
                economy to business, from standard to suite.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#003580] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Pay What You Feel Is Fair</h3>
              <p className="text-gray-600">
                Unlike fixed-price platforms like Expedia & Priceline, 
                for you — no more overpaying.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#003580] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure, Real-Time Bookings</h3>
              <p className="text-gray-600">
                Every booking is secured with instant airline and hotel 
                confirmed instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#003580] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smarter Than Any Travel Agent</h3>
              <p className="text-gray-600">
                Stop paying fixed rates. Our AI works faster than any travel 
                24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-[#003580]" />
                </div>
                <span className="text-xl font-bold">faredown.com</span>
              </div>
              <p className="text-gray-400 text-sm">
                The world's first travel portal where you control the price.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link to="/press" className="hover:text-white">Press</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/help-center" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/safety" className="hover:text-white">Safety</Link></li>
                <li><Link to="/accessibility" className="hover:text-white">Accessibility</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/cookie-policy" className="hover:text-white">Cookie Policy</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Faredown. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Email" type="email" />
            <Input placeholder="Password" type="password" />
            <Button className="w-full bg-[#003580] hover:bg-[#002d66]">
              Sign In
            </Button>
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setShowSignIn(false);
                  setShowRegister(true);
                }}
                className="text-[#003580] hover:underline"
              >
                Register here
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="First Name" />
            <Input placeholder="Last Name" />
            <Input placeholder="Email" type="email" />
            <Input placeholder="Password" type="password" />
            <Button className="w-full bg-[#003580] hover:bg-[#002d66]">
              Create Account
            </Button>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => {
                  setShowRegister(false);
                  setShowSignIn(true);
                }}
                className="text-[#003580] hover:underline"
              >
                Sign in here
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
