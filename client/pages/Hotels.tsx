import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Header } from "@/components/Header";
import { BookingSearchForm } from "@/components/BookingSearchForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Heart,
  ChevronLeft,
  Menu,
  Search,
  Filter,
  SlidersHorizontal,
  Calendar,
  Users,
  ArrowRight,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  User,
  Hotel,
  Plane,
  Gift,
  Shield,
  Clock,
  CheckCircle,
  Zap,
} from "lucide-react";
import { ApiConnectionTest } from "@/components/ApiConnectionTest";

export default function Hotels() {
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('price');

  // Sample hotel data
  const hotels = [
    {
      id: 1,
      name: "Grand Hyatt Dubai",
      location: "Dubai - Deira Creek",
      rating: 8.1,
      ratingText: "Excellent",
      reviews: 234,
      price: 18500,
      originalPrice: 22000,
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
      amenities: ["Wifi", "Pool", "Gym", "Parking"],
      distance: "2.1 km from center",
      breakfast: true,
      freeWifi: true,
      discount: 15,
    },
    {
      id: 2,
      name: "Atlantis The Palm",
      location: "Dubai - Palm Jumeirah",
      rating: 9.2,
      ratingText: "Wonderful",
      reviews: 1247,
      price: 45600,
      originalPrice: 52000,
      image:
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400",
      amenities: ["Beach", "Pool", "Spa", "Restaurant"],
      distance: "15.3 km from center",
      breakfast: true,
      freeWifi: true,
      discount: 12,
    },
    {
      id: 3,
      name: "Four Seasons Resort Dubai",
      location: "Dubai - Jumeirah Beach",
      rating: 9.0,
      ratingText: "Wonderful",
      reviews: 856,
      price: 38900,
      originalPrice: 44000,
      image:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
      amenities: ["Beach", "Spa", "Fine Dining", "Kids Club"],
      distance: "12.8 km from center",
      breakfast: true,
      freeWifi: true,
      discount: 11,
    },
  ];

  const recentSearches = [
    {
      destination: "Dubai",
      dates: "Aug 1 - Aug 5, 2 people",
      image:
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=100",
    },
  ];

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  // Filter and sort hotels
  const filteredAndSortedHotels = React.useMemo(() => {
    let filtered = hotels.filter((hotel) => {
      // Price filter
      if (hotel.price < priceRange[0] || hotel.price > priceRange[1]) return false;

      // Rating filter
      if (selectedAmenities.includes('Rating 8+') && hotel.rating < 8) return false;

      // Amenities filter
      if (selectedAmenities.includes('Free WiFi') && !hotel.freeWifi) return false;
      if (selectedAmenities.includes('Breakfast') && !hotel.breakfast) return false;

      return true;
    });

    // Sort hotels
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
        // Simple distance sort based on distance string
        filtered.sort((a, b) => {
          const aDistance = parseFloat(a.distance.split(' ')[0]);
          const bDistance = parseFloat(b.distance.split(' ')[0]);
          return aDistance - bDistance;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [hotels, priceRange, selectedAmenities, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* MOBILE-FIRST DESIGN: App-style layout for mobile, standard for desktop */}

      {/* Mobile Header & Search (≤768px) */}
      <div className="block md:hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div className="flex-1 text-center">
                <h1 className="text-lg font-semibold text-gray-900">Hotels</h1>
                <p className="text-xs text-gray-500">
                  Dubai • Aug 1-5 • 2 guests
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 -mr-2">
                    <Menu className="w-6 h-6 text-gray-700" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/account')}>My Account</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account/trips')}>My Trips</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/help')}>Help Center</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/')}>Home</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Search Summary */}
          <div className="border-t border-gray-100 px-4 py-3">
            <button
              onClick={() => setShowMobileSearch(true)}
              className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <Search className="w-5 h-5 text-gray-400" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">
                  Dubai • Aug 1-5 • 2 guests
                </div>
                <div className="text-xs text-gray-500">
                  Tap to change search
                </div>
              </div>
            </button>
          </div>

          {/* Mobile Filter Bar */}
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center space-x-3 overflow-x-auto">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 space-y-6">
                    {/* Price Range */}
                    <div>
                      <h3 className="font-medium mb-3">Price per night</h3>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={100000}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>₹{priceRange[0].toLocaleString()}</span>
                        <span>₹{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div>
                      <h3 className="font-medium mb-3">Amenities</h3>
                      <div className="space-y-2">
                        {['Free WiFi', 'Breakfast', 'Pool', 'Gym', 'Spa', 'Parking'].map((amenity) => (
                          <div key={amenity} className="flex items-center space-x-2">
                            <Checkbox
                              id={amenity}
                              checked={selectedAmenities.includes(amenity)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAmenities([...selectedAmenities, amenity]);
                                } else {
                                  setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                                }
                              }}
                            />
                            <label htmlFor={amenity} className="text-sm">{amenity}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Apply Button */}
                    <div className="pt-4">
                      <Button className="w-full" onClick={() => setShowFilters(false)}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    Price
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('price-low')}>Lowest price first</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-high')}>Highest price first</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={selectedAmenities.includes('Rating 8+') ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => {
                  if (selectedAmenities.includes('Rating 8+')) {
                    setSelectedAmenities(selectedAmenities.filter(a => a !== 'Rating 8+'));
                  } else {
                    setSelectedAmenities([...selectedAmenities, 'Rating 8+']);
                  }
                }}
              >
                Rating 8+
              </Button>

              <Button
                variant={selectedAmenities.includes('Free WiFi') ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => {
                  if (selectedAmenities.includes('Free WiFi')) {
                    setSelectedAmenities(selectedAmenities.filter(a => a !== 'Free WiFi'));
                  } else {
                    setSelectedAmenities([...selectedAmenities, 'Free WiFi']);
                  }
                }}
              >
                Free WiFi
              </Button>

              <Button
                variant={selectedAmenities.includes('Breakfast') ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => {
                  if (selectedAmenities.includes('Breakfast')) {
                    setSelectedAmenities(selectedAmenities.filter(a => a !== 'Breakfast'));
                  } else {
                    setSelectedAmenities([...selectedAmenities, 'Breakfast']);
                  }
                }}
              >
                Breakfast
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Hotel Results */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredAndSortedHotels.length} properties found
            </h2>
            <DropdownMenu open={showSort} onOpenChange={setShowSort}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  Sort by: {sortBy === 'price-low' ? 'Price (Low)' : sortBy === 'price-high' ? 'Price (High)' : sortBy === 'rating' ? 'Rating' : 'Price'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('price-low')}>Price (Lowest first)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price-high')}>Price (Highest first)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('rating')}>Guest rating</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('distance')}>Distance from center</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Hotel Cards */}
          {filteredAndSortedHotels.map((hotel) => (
            <Card
              key={hotel.id}
              className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/hotels/${hotel.id}`)}
            >
              <div className="relative">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-green-600 text-white">
                    {hotel.discount}% OFF
                  </Badge>
                </div>
                <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <CardContent className="p-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {hotel.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {hotel.location}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {hotel.distance}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="bg-[#003580] text-white px-2 py-1 rounded text-sm font-semibold">
                    {hotel.rating}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {hotel.ratingText}
                    </div>
                    <div className="text-xs text-gray-500">
                      {hotel.reviews} reviews
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex items-center space-x-3 mb-3 text-xs">
                  {hotel.freeWifi && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Wifi className="w-3 h-3" />
                      <span>Free WiFi</span>
                    </div>
                  )}
                  {hotel.breakfast && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Coffee className="w-3 h-3" />
                      <span>Breakfast</span>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-gray-500 line-through">
                      {formatPrice(hotel.originalPrice)}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatPrice(hotel.price)}
                    </div>
                    <div className="text-xs text-gray-500">per night</div>
                  </div>
                  <div className="text-right">
                    <Button className="bg-[#003580] hover:bg-[#0071c2]">
                      Select
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Mobile Load More */}
          <div className="text-center py-6">
            <Button variant="outline" className="w-full">
              Load more properties
            </Button>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="grid grid-cols-4 h-16">
            <Link
              to="/"
              className="flex flex-col items-center justify-center space-y-1"
            >
              <Plane className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Flights</span>
            </Link>
            <button className="flex flex-col items-center justify-center space-y-1">
              <Hotel className="w-5 h-5 text-[#003580]" />
              <span className="text-xs text-[#003580] font-medium">Hotels</span>
            </button>
            <Link
              to="/account"
              className="flex flex-col items-center justify-center space-y-1"
            >
              <Heart className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Saved</span>
            </Link>
            <Link
              to="/account"
              className="flex flex-col items-center justify-center space-y-1"
            >
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Account</span>
            </Link>
          </div>
        </div>

        {/* Mobile bottom padding */}
        <div className="h-16"></div>
      </div>

      {/* DESKTOP LAYOUT (≥769px) */}
      <div className="hidden md:block">
        <div className="min-h-screen bg-[#003580]">
          <Header />
          <ApiConnectionTest />

          {/* Desktop Content */}
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
            {/* Desktop Hero Section */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-4">
                Find your next stay
              </h1>
              <p className="text-white/90 text-sm sm:text-base">
                Search low prices on hotels, homes and much more...
              </p>
            </div>

            {/* Desktop Search Form */}
            <div className="mb-6 sm:mb-8">
              <BookingSearchForm />
            </div>

            {/* Desktop Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Left Column - Recent Searches */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Recent Searches */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Your recent searches
                  </h2>

                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation"
                    >
                      <img
                        src={search.image}
                        alt={search.destination}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {search.destination}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {search.dates}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Featured Hotels */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Recommended hotels in Dubai
                  </h2>

                  <div className="grid gap-4">
                    {hotels.slice(0, 2).map((hotel) => (
                      <Card
                        key={hotel.id}
                        className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow touch-manipulation cursor-pointer"
                        onClick={() => navigate(`/hotels/${hotel.id}`)}
                      >
                        <div className="flex">
                          <div className="relative w-48 flex-shrink-0">
                            <img
                              src={hotel.image}
                              alt={hotel.name}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-green-600 text-white text-xs">
                                {hotel.discount}% OFF
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="flex-1 p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                  {hotel.name}
                                </h3>
                                <div className="flex items-center space-x-1 mt-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-600">
                                    {hotel.location}
                                  </span>
                                </div>
                              </div>
                              <button className="p-1">
                                <Heart className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="bg-[#003580] text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                                  {hotel.rating}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {hotel.ratingText} • {hotel.reviews} reviews
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500 line-through">
                                  {formatPrice(hotel.originalPrice)}
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                  {formatPrice(hotel.price)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-4 sm:space-y-6">
                {/* Special Offers */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Special Offers
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Gift className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Early Bird Special
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Book 30 days in advance and save up to 25%
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Flash Sale
                        </span>
                      </div>
                      <p className="text-xs text-green-700">
                        Limited time offer - 48 hours only!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Why Book With Us */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Why book with Faredown?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Best Price Guarantee
                        </div>
                        <div className="text-xs text-gray-600">
                          Find it cheaper? We'll match it
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Secure Booking
                        </div>
                        <div className="text-xs text-gray-600">
                          Your details are safe with us
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          24/7 Support
                        </div>
                        <div className="text-xs text-gray-600">
                          We're here when you need us
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
