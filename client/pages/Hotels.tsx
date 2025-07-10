import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Calendar,
  MapPin,
  Users,
  Star,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  X,
  User,
  BookOpen,
  Award,
  CreditCard,
  Settings,
  Heart,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Hotels() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [destination, setDestination] = useState("Mumbai");
  const [checkIn, setCheckIn] = useState("Dec 15");
  const [checkOut, setCheckOut] = useState("Dec 17");
  const [guests, setGuests] = useState("2 adults · 1 room");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuestSelector, setShowGuestSelector] = useState(false);

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
  };

  const hotelData = [
    {
      id: 1,
      name: "The Taj Mahal Palace",
      location: "Mumbai, Maharashtra",
      rating: 4.8,
      price: 12500,
      originalPrice: 15000,
      image: "/api/placeholder/300/200",
      amenities: ["Free WiFi", "Pool", "Spa", "Gym"],
      reviews: 2156,
      discount: 17,
    },
    {
      id: 2,
      name: "ITC Grand Central",
      location: "Mumbai, Maharashtra",
      rating: 4.6,
      price: 8900,
      originalPrice: 11200,
      image: "/api/placeholder/300/200",
      amenities: ["Free WiFi", "Restaurant", "Gym", "Business Center"],
      reviews: 1843,
      discount: 21,
    },
    {
      id: 3,
      name: "JW Marriott Mumbai Sahar",
      location: "Mumbai, Maharashtra",
      rating: 4.7,
      price: 10200,
      originalPrice: 13500,
      image: "/api/placeholder/300/200",
      amenities: ["Free WiFi", "Pool", "Spa", "Airport Shuttle"],
      reviews: 1678,
      discount: 24,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold">
              faredown.com
            </Link>

            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/flights"
                className="flex items-center space-x-1 hover:text-blue-200 transition-colors"
              >
                <span>✈️</span>
                <span>Flights</span>
              </Link>
              <Link
                to="/hotels"
                className="flex items-center space-x-1 text-yellow-300 font-medium"
              >
                <span>🏨</span>
                <span>Hotels</span>
              </Link>
              <Link
                to="/transfers"
                className="flex items-center space-x-1 hover:text-blue-200 transition-colors"
              >
                <span>🚗</span>
                <span>Transfers</span>
              </Link>
              <Link
                to="/sightseeing"
                className="flex items-center space-x-1 hover:text-blue-200 transition-colors"
              >
                <span>🎯</span>
                <span>Sightseeing</span>
              </Link>
              <Link
                to="/sports"
                className="flex items-center space-x-1 hover:text-blue-200 transition-colors"
              >
                <span>🎪</span>
                <span>Sports & Events</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-sm hover:text-blue-200">
                  <span>🌐</span>
                  <span>English (UK)</span>
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>🇬🇧 English (UK)</DropdownMenuItem>
                  <DropdownMenuItem>🇺🇸 English (US)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-sm hover:text-blue-200">
                  <span>INR</span>
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  <DropdownMenuItem>₹ INR - Indian Rupee</DropdownMenuItem>
                  <DropdownMenuItem>$ USD - US Dollar</DropdownMenuItem>
                  <DropdownMenuItem>€ EUR - Euro</DropdownMenuItem>
                  <DropdownMenuItem>£ GBP - British Pound</DropdownMenuItem>
                  <DropdownMenuItem>¥ JPY - Japanese Yen</DropdownMenuItem>
                  <DropdownMenuItem>C$ CAD - Canadian Dollar</DropdownMenuItem>
                  <DropdownMenuItem>
                    A$ AUD - Australian Dollar
                  </DropdownMenuItem>
                  <DropdownMenuItem>CHF - Swiss Franc</DropdownMenuItem>
                  <DropdownMenuItem>¥ CNY - Chinese Yuan</DropdownMenuItem>
                  <DropdownMenuItem>kr SEK - Swedish Krona</DropdownMenuItem>
                  <DropdownMenuItem>kr NOK - Norwegian Krone</DropdownMenuItem>
                  <DropdownMenuItem>kr DKK - Danish Krone</DropdownMenuItem>
                  <DropdownMenuItem>₩ KRW - South Korean Won</DropdownMenuItem>
                  <DropdownMenuItem>S$ SGD - Singapore Dollar</DropdownMenuItem>
                  <DropdownMenuItem>
                    HK$ HKD - Hong Kong Dollar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    NZ$ NZD - New Zealand Dollar
                  </DropdownMenuItem>
                  <DropdownMenuItem>₽ RUB - Russian Ruble</DropdownMenuItem>
                  <DropdownMenuItem>
                    R ZAR - South African Rand
                  </DropdownMenuItem>
                  <DropdownMenuItem>₺ TRY - Turkish Lira</DropdownMenuItem>
                  <DropdownMenuItem>R$ BRL - Brazilian Real</DropdownMenuItem>
                  <DropdownMenuItem>Mex$ MXN - Mexican Peso</DropdownMenuItem>
                  <DropdownMenuItem>₪ ILS - Israeli Shekel</DropdownMenuItem>
                  <DropdownMenuItem>₦ NGN - Nigerian Naira</DropdownMenuItem>
                  <DropdownMenuItem>EGP - Egyptian Pound</DropdownMenuItem>
                  <DropdownMenuItem>₨ PKR - Pakistani Rupee</DropdownMenuItem>
                  <DropdownMenuItem>৳ BDT - Bangladeshi Taka</DropdownMenuItem>
                  <DropdownMenuItem>₨ LKR - Sri Lankan Rupee</DropdownMenuItem>
                  <DropdownMenuItem>
                    Rp IDR - Indonesian Rupiah
                  </DropdownMenuItem>
                  <DropdownMenuItem>₱ PHP - Philippine Peso</DropdownMenuItem>
                  <DropdownMenuItem>₫ VND - Vietnamese Dong</DropdownMenuItem>
                  <DropdownMenuItem>฿ THB - Thai Baht</DropdownMenuItem>
                  <DropdownMenuItem>
                    RM MYR - Malaysian Ringgit
                  </DropdownMenuItem>
                  <DropdownMenuItem>AED - UAE Dirham</DropdownMenuItem>
                  <DropdownMenuItem>SAR - Saudi Riyal</DropdownMenuItem>
                  <DropdownMenuItem>QAR - Qatari Riyal</DropdownMenuItem>
                  <DropdownMenuItem>KWD - Kuwaiti Dinar</DropdownMenuItem>
                  <DropdownMenuItem>BHD - Bahraini Dinar</DropdownMenuItem>
                  <DropdownMenuItem>OMR - Omani Rial</DropdownMenuItem>
                  <DropdownMenuItem>zł PLN - Polish Zloty</DropdownMenuItem>
                  <DropdownMenuItem>Kč CZK - Czech Koruna</DropdownMenuItem>
                  <DropdownMenuItem>Ft HUF - Hungarian Forint</DropdownMenuItem>
                  <DropdownMenuItem>RON - Romanian Leu</DropdownMenuItem>
                  <DropdownMenuItem>BGN - Bulgarian Lev</DropdownMenuItem>
                  <DropdownMenuItem>kn HRK - Croatian Kuna</DropdownMenuItem>
                  <DropdownMenuItem>₴ UAH - Ukrainian Hryvnia</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="text-sm">?</span>

              <div className="flex items-center space-x-3">
                {isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center space-x-2 bg-blue-600 rounded-full px-3 py-2 hover:bg-blue-800">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-black">
                          {userName.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-white">{userName}</span>
                      <span className="text-xs text-yellow-300">
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
                      className="bg-white text-blue-700 border-white hover:bg-gray-100 rounded text-sm font-medium px-4 py-1.5"
                      onClick={() => setShowRegister(true)}
                    >
                      Register
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-800 text-white rounded text-sm font-medium px-4 py-1.5"
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

        {/* Search Bar */}
        <div className="bg-blue-700 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-yellow-400 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Find and book the perfect stay
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-yellow-400 px-1 text-xs text-gray-700 font-medium">
                    Destination
                  </label>
                  <div className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12">
                    <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="flex-1 outline-none text-sm font-medium"
                      placeholder="Where are you going?"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-yellow-400 px-1 text-xs text-gray-700 font-medium">
                    Check-in
                  </label>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12 w-full"
                  >
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">{checkIn}</span>
                  </button>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-yellow-400 px-1 text-xs text-gray-700 font-medium">
                    Check-out
                  </label>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12 w-full"
                  >
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">{checkOut}</span>
                  </button>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-yellow-400 px-1 text-xs text-gray-700 font-medium">
                    Guests
                  </label>
                  <button
                    onClick={() => setShowGuestSelector(!showGuestSelector)}
                    className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12 w-full"
                  >
                    <Users className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">{guests}</span>
                  </button>
                </div>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 mt-4 font-medium">
                Search Hotels
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Hotels in {destination}
          </h1>
          <p className="text-gray-600">{hotelData.length} properties found</p>
        </div>

        {/* Hotel Cards */}
        <div className="space-y-6">
          {hotelData.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-64 h-48 rounded-lg overflow-hidden">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{hotel.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(hotel.rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">
                          {hotel.rating}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({hotel.reviews} reviews)
                        </span>
                      </div>
                    </div>

                    {hotel.discount > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        {hotel.discount}% off
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                      >
                        {amenity === "Free WiFi" && (
                          <Wifi className="w-3 h-3" />
                        )}
                        {amenity === "Pool" && <span>🏊</span>}
                        {amenity === "Spa" && <span>💆</span>}
                        {amenity === "Gym" && <Dumbbell className="w-3 h-3" />}
                        {amenity === "Restaurant" && (
                          <Coffee className="w-3 h-3" />
                        )}
                        {amenity === "Business Center" && <span>💼</span>}
                        {amenity === "Airport Shuttle" && (
                          <Car className="w-3 h-3" />
                        )}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      {hotel.originalPrice > hotel.price && (
                        <p className="text-sm text-gray-500 line-through">
                          ₹{hotel.originalPrice.toLocaleString()}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{hotel.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">per night</p>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        View Details
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
