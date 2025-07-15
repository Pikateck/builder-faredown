import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Star,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  BookOpen,
  Award,
  Heart,
  LogOut,
  CreditCard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function Hotels() {
  const navigate = useNavigate();

  // Search form states
  const [destination, setDestination] = useState("");
  const [checkInDate, setCheckInDate] = useState("2024-12-15");
  const [checkOutDate, setCheckOutDate] = useState("2024-12-18");
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);

  // UI states
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // Sample destinations data
  const popularDestinations = [
    { city: "Dubai", country: "UAE", hotels: 1240, image: "🏙️" },
    { city: "Mumbai", country: "India", hotels: 856, image: "🌆" },
    { city: "Singapore", country: "Singapore", hotels: 523, image: "🏨" },
    { city: "London", country: "UK", hotels: 1150, image: "🏛️" },
    { city: "Paris", country: "France", hotels: 967, image: "🗼" },
    { city: "New York", country: "USA", hotels: 1325, image: "🗽" },
  ];

  const handleSearch = () => {
    // Navigate to hotel results with search parameters
    const searchParams = new URLSearchParams({
      destination,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults: guests.adults.toString(),
      children: guests.children.toString(),
      rooms: guests.rooms.toString(),
    });

    navigate(`/hotels/results?${searchParams}`);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
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
      <header className="bg-blue-700 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                faredown.com
              </span>
            </Link>
            <div className="flex items-center space-x-2 md:space-x-6">
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-white p-2 touch-manipulation"
              >
                <Menu className="w-6 h-6" />
              </button>

              <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                <Link
                  to="/flights"
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center py-4"
                >
                  <span>Flights</span>
                </Link>
                <Link
                  to="/hotels"
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center font-semibold border-b-2 border-white py-4"
                >
                  <span>Hotels</span>
                </Link>
                <Link
                  to="/transfers"
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center py-4"
                >
                  <span>Transfers</span>
                </Link>
                <Link
                  to="/sightseeing"
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center py-4"
                >
                  <span>Sightseeing</span>
                </Link>
                <Link
                  to="/sports"
                  className="text-white hover:text-blue-200 cursor-pointer py-4 flex items-center"
                >
                  <span>Sports & Events</span>
                </Link>
              </nav>

              {/* Language and Currency */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <button className="text-white hover:text-blue-200 cursor-pointer flex items-center space-x-1">
                  <span>🌐</span>
                  <span>English (UK)</span>
                </button>
                <button className="text-white hover:text-blue-200 cursor-pointer flex items-center space-x-1">
                  <span>₹ INR</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
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
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <User className="w-4 h-4 mr-2" />
                        My account
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Bookings & Trips
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Award className="w-4 h-4 mr-2" />
                        Loyalty program
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
                    >
                      Register
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-800 text-white rounded text-xs md:text-sm font-medium px-2 md:px-4 py-1.5"
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

      {/* Hero Search Section */}
      <div className="bg-blue-700 py-6 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="mb-4">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-semibold">
                🏨 Hotel Bargaining Available
              </Badge>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Find & Bargain Your Perfect Hotel Stay
            </h1>
            <p className="text-white text-lg opacity-90 mb-6">
              Discover amazing hotels worldwide and{" "}
              <strong>negotiate the best prices</strong> with AI-powered
              bargaining
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Destination */}
              <div className="relative md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Where are you going?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onFocus={() => setShowDestinations(true)}
                    className="pl-10 py-3 text-base"
                  />
                </div>

                {/* Destination Dropdown */}
                {showDestinations && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 z-50 max-h-80 overflow-y-auto">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Popular Destinations
                      </h3>
                      <div className="space-y-2">
                        {popularDestinations.map((dest) => (
                          <button
                            key={dest.city}
                            onClick={() => {
                              setDestination(`${dest.city}, ${dest.country}`);
                              setShowDestinations(false);
                            }}
                            className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{dest.image}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {dest.city}, {dest.country}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {dest.hotels} hotels
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Check-in Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="pl-10 py-3"
                  />
                </div>
              </div>

              {/* Check-out Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="pl-10 py-3"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* Guests */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guests & Rooms
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <button
                    onClick={() => setShowGuestSelector(!showGuestSelector)}
                    className="w-full text-left pl-10 pr-4 py-3 border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:outline-none"
                  >
                    <span className="text-gray-900">
                      {guests.adults} adult{guests.adults > 1 ? "s" : ""}
                      {guests.children > 0 &&
                        `, ${guests.children} child${guests.children > 1 ? "ren" : ""}`}
                      , {guests.rooms} room{guests.rooms > 1 ? "s" : ""}
                    </span>
                  </button>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>

                {/* Guest Selector Dropdown */}
                {showGuestSelector && (
                  <div className="absolute top-full left-0 right-0 md:right-auto md:w-80 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 z-50 p-4">
                    <div className="space-y-4">
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            Adults
                          </div>
                          <div className="text-sm text-gray-500">Age 18+</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              setGuests((prev) => ({
                                ...prev,
                                adults: Math.max(1, prev.adults - 1),
                              }))
                            }
                            disabled={guests.adults <= 1}
                            className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium">
                            {guests.adults}
                          </span>
                          <button
                            onClick={() =>
                              setGuests((prev) => ({
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

                      {/* Children */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            Children
                          </div>
                          <div className="text-sm text-gray-500">Age 0-17</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              setGuests((prev) => ({
                                ...prev,
                                children: Math.max(0, prev.children - 1),
                              }))
                            }
                            disabled={guests.children <= 0}
                            className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium">
                            {guests.children}
                          </span>
                          <button
                            onClick={() =>
                              setGuests((prev) => ({
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

                      {/* Rooms */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Rooms</div>
                          <div className="text-sm text-gray-500">
                            Hotel rooms
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              setGuests((prev) => ({
                                ...prev,
                                rooms: Math.max(1, prev.rooms - 1),
                              }))
                            }
                            disabled={guests.rooms <= 1}
                            className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium">
                            {guests.rooms}
                          </span>
                          <button
                            onClick={() =>
                              setGuests((prev) => ({
                                ...prev,
                                rooms: prev.rooms + 1,
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
                          onClick={() => setShowGuestSelector(false)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Hotels
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Destinations Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-gray-600 text-lg">
              Discover amazing hotels in these trending destinations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularDestinations.map((destination) => (
              <div
                key={destination.city}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={() => {
                  setDestination(`${destination.city}, ${destination.country}`);
                  handleSearch();
                }}
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-6xl">
                  {destination.image}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {destination.city}
                  </h3>
                  <p className="text-gray-600 mb-3">{destination.country}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{destination.hotels} hotels available</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Faredown Hotels?
            </h2>
            <p className="text-gray-600 text-lg">
              Experience the future of hotel booking with AI-powered bargaining
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                AI Price Bargaining
              </h3>
              <p className="text-gray-600">
                Our AI negotiates the best hotel rates in real-time, saving you
                up to 30% on bookings.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Global Coverage</h3>
              <p className="text-gray-600">
                Access millions of hotels worldwide with verified reviews and
                instant confirmations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Booking</h3>
              <p className="text-gray-600">
                Book with confidence using our secure payment system and free
                cancellation options.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
