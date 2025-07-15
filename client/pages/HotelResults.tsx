import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  MapPin,
  Star,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  Users,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Filter,
  SortAsc,
  Heart,
  User,
  BookOpen,
  Award,
  LogOut,
  CreditCard,
  Settings,
} from "lucide-react";

// Sample hotel data - this would come from your echo-space project
const hotelData = [
  {
    id: 1,
    name: "The Ritz-Carlton Dubai",
    location: "Downtown Dubai, Dubai",
    rating: 4.8,
    reviews: 2847,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    price: 25600,
    originalPrice: 32000,
    amenities: ["wifi", "pool", "gym", "parking", "restaurant"],
    roomType: "Deluxe Room",
    cancellation: "Free cancellation",
    breakfast: "Breakfast included",
    discount: 20,
  },
  {
    id: 2,
    name: "JW Marriott Marquis Dubai",
    location: "Business Bay, Dubai",
    rating: 4.7,
    reviews: 1923,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400",
    price: 18900,
    originalPrice: 23625,
    amenities: ["wifi", "pool", "gym", "spa", "restaurant"],
    roomType: "Superior Room",
    cancellation: "Free cancellation",
    breakfast: "Breakfast included",
    discount: 15,
  },
  {
    id: 3,
    name: "Atlantis The Palm",
    location: "Palm Jumeirah, Dubai",
    rating: 4.6,
    reviews: 3156,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",
    price: 42000,
    originalPrice: 50000,
    amenities: ["wifi", "pool", "gym", "waterpark", "restaurant"],
    roomType: "Ocean View Suite",
    cancellation: "Non-refundable",
    breakfast: "Breakfast not included",
    discount: 16,
  },
  {
    id: 4,
    name: "Grand Hyatt Mumbai",
    location: "Bandra Kurla Complex, Mumbai",
    rating: 4.5,
    reviews: 1567,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
    price: 12800,
    originalPrice: 16000,
    amenities: ["wifi", "pool", "gym", "spa", "restaurant"],
    roomType: "Grand Room",
    cancellation: "Free cancellation",
    breakfast: "Breakfast included",
    discount: 20,
  },
];

// Amenity icons mapping
const amenityIcons = {
  wifi: Wifi,
  pool: Pool,
  gym: Dumbbell,
  parking: Car,
  restaurant: Coffee,
  spa: "🧖",
  waterpark: "🏊",
};

export default function HotelResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get search parameters
  const destination = searchParams.get("destination") || "Dubai, UAE";
  const checkIn = searchParams.get("checkIn") || "2024-12-15";
  const checkOut = searchParams.get("checkOut") || "2024-12-18";
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");

  // UI States
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "rating" | "distance">(
    "price",
  );
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // Filter States
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Bargaining States
  const [showBargainModal, setShowBargainModal] = useState(false);
  const [bargainHotel, setBargainHotel] = useState<any>(null);
  const [bargainStep, setBargainStep] = useState<
    "input" | "progress" | "result"
  >("input");
  const [bargainPrice, setBargainPrice] = useState("");
  const [bargainProgress, setBargainProgress] = useState(0);
  const [bargainResult, setBargainResult] = useState<
    "accepted" | "rejected" | "counter" | null
  >(null);
  const [aiOfferPrice, setAiOfferPrice] = useState<number | null>(null);
  const [usedPrices, setUsedPrices] = useState<Set<string>>(new Set());

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Calculate number of nights
  const calculateNights = () => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  // Filter and sort hotels
  const filteredHotels = hotelData
    .filter((hotel) => {
      if (hotel.price < priceRange.min || hotel.price > priceRange.max)
        return false;
      if (selectedRating > 0 && hotel.rating < selectedRating) return false;
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every((amenity) =>
          hotel.amenities.includes(amenity),
        );
        if (!hasAllAmenities) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "rating":
          return b.rating - a.rating;
        case "distance":
          return 0; // Would implement distance calculation
        default:
          return 0;
      }
    });

  // Bargaining functions
  const handleBargain = (hotel: any) => {
    setBargainHotel(hotel);
    setShowBargainModal(true);
    setBargainStep("input");
    setBargainPrice("");
    setBargainProgress(0);
    setBargainResult(null);
    setAiOfferPrice(null);
  };

  const generateAICounterOffer = (userPrice: number, originalPrice: number) => {
    const discountRequested = (originalPrice - userPrice) / originalPrice;

    if (discountRequested <= 0.3) {
      return Math.random() < 0.8 ? userPrice : Math.round(userPrice * 1.05);
    } else if (discountRequested <= 0.5) {
      const minOffer = Math.round(originalPrice * 0.7);
      return Math.max(userPrice, Math.round(originalPrice * 0.75));
    } else {
      return Math.round(originalPrice * 0.65);
    }
  };

  const startBargaining = () => {
    if (!bargainHotel || !bargainPrice) return;

    const targetPrice = parseInt(bargainPrice);
    const currentPrice = bargainHotel.price;
    const priceKey = `${bargainHotel.id}-${targetPrice}`;

    if (usedPrices.has(priceKey)) {
      alert(
        "You've already tried this price! Please enter a different amount.",
      );
      return;
    }

    if (targetPrice >= currentPrice) {
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

          const aiOfferPrice = generateAICounterOffer(
            targetPrice,
            currentPrice,
          );
          setAiOfferPrice(aiOfferPrice);

          const isExactMatch = aiOfferPrice === targetPrice;
          setBargainResult(isExactMatch ? "accepted" : "counter");
          setBargainStep("result");

          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleBooking = (hotel: any, finalPrice?: number) => {
    navigate("/hotels/booking", {
      state: {
        selectedHotel: hotel,
        checkIn,
        checkOut,
        guests: { adults, children, rooms },
        negotiatedPrice: finalPrice || hotel.price,
        nights,
      },
    });
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-base sm:text-xl font-bold tracking-tight">
                  faredown.com
                </span>
              </Link>
              <div className="text-xs sm:text-sm text-blue-200 hidden sm:block">
                / Hotel Results
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-6">
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
              </nav>

              <div className="flex items-center space-x-3">
                {isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center space-x-2 bg-blue-600 rounded-full px-2 md:px-3 py-2 hover:bg-blue-800">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-black">
                          {userName.charAt(0)}
                        </span>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
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
                      className="bg-white text-blue-700"
                    >
                      Register
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-800 text-white"
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

      {/* Search Summary */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Hotels in {destination}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {checkIn} - {checkOut} • {nights} night{nights > 1 ? "s" : ""} •{" "}
                {adults + children} guest{adults + children > 1 ? "s" : ""} •{" "}
                {rooms} room{rooms > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Modify Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <Button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 py-3"
            >
              <Filter className="w-4 h-4" />
              <span>Filters & Sort</span>
            </Button>
          </div>

          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">
                Filter Results
              </h3>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Price per night
                </h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        max: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹0</span>
                    <span>₹{priceRange.max.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Star Rating</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <label
                      key={rating}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={selectedRating === rating}
                        onChange={() => setSelectedRating(rating)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        {Array.from({ length: rating }, (_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                        <span className="ml-2 text-sm">
                          {rating} star{rating > 1 ? "s" : ""} & up
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Amenities</h4>
                <div className="space-y-2">
                  {["wifi", "pool", "gym", "parking", "restaurant", "spa"].map(
                    (amenity) => (
                      <label
                        key={amenity}
                        className="flex items-center cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAmenities((prev) => [
                                ...prev,
                                amenity,
                              ]);
                            } else {
                              setSelectedAmenities((prev) =>
                                prev.filter((a) => a !== amenity),
                              );
                            }
                          }}
                          className="mr-3"
                        />
                        <span className="text-sm capitalize">{amenity}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hotel Results */}
          <div className="flex-1">
            {/* Sort Options */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {filteredHotels.length} hotels found
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="price">Price (Low to High)</option>
                    <option value="rating">Rating (High to Low)</option>
                    <option value="distance">Distance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hotel Cards */}
            <div className="space-y-6">
              {filteredHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Hotel Image */}
                    <div className="md:w-1/3">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-48 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                      />
                    </div>

                    {/* Hotel Details */}
                    <div className="md:w-2/3 p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                {hotel.name}
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <MapPin className="w-4 h-4 mr-1" />
                                {hotel.location}
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-red-500">
                              <Heart className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(hotel.rating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {hotel.rating} ({hotel.reviews} reviews)
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {hotel.amenities.slice(0, 4).map((amenity) => {
                              const IconComponent = amenityIcons[amenity];
                              return (
                                <div
                                  key={amenity}
                                  className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                                >
                                  {typeof IconComponent === "string" ? (
                                    <span className="mr-1">
                                      {IconComponent}
                                    </span>
                                  ) : (
                                    <IconComponent className="w-3 h-3 mr-1" />
                                  )}
                                  <span className="capitalize">{amenity}</span>
                                </div>
                              );
                            })}
                            {hotel.amenities.length > 4 && (
                              <span className="text-xs text-blue-600">
                                +{hotel.amenities.length - 4} more
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 mb-4">
                            <div>{hotel.roomType}</div>
                            <div className="text-green-600">
                              {hotel.cancellation}
                            </div>
                            <div>{hotel.breakfast}</div>
                          </div>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-gray-900">
                                {formatCurrency(hotel.price)}
                              </span>
                              <span className="text-sm text-gray-500">
                                per night
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(hotel.price * nights)} total for{" "}
                              {nights} nights
                            </div>
                            {hotel.discount > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500 line-through">
                                  {formatCurrency(hotel.originalPrice)}
                                </span>
                                <Badge className="bg-green-100 text-green-800">
                                  {hotel.discount}% off
                                </Badge>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleBargain(hotel)}
                              variant="outline"
                              className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            >
                              🏷️ Bargain
                            </Button>
                            <Button
                              onClick={() => handleBooking(hotel)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bargaining Modal */}
      <Dialog open={showBargainModal} onOpenChange={setShowBargainModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bargain for {bargainHotel?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {bargainStep === "input" && (
              <>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    Current Price: {formatCurrency(bargainHotel?.price || 0)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Enter your desired price and our AI will negotiate for you
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Offer (per night)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter your price"
                    value={bargainPrice}
                    onChange={(e) => setBargainPrice(e.target.value)}
                    className="text-center text-lg font-semibold"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => setShowBargainModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={startBargaining}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={!bargainPrice}
                  >
                    Start Bargaining
                  </Button>
                </div>
              </>
            )}

            {bargainStep === "progress" && (
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold">
                  AI is negotiating...
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-150"
                    style={{ width: `${bargainProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  Our AI is working to get you the best deal
                </p>
              </div>
            )}

            {bargainStep === "result" && (
              <div className="text-center space-y-4">
                {bargainResult === "accepted" ? (
                  <>
                    <div className="text-green-600 text-xl font-bold">
                      🎉 Offer Accepted!
                    </div>
                    <div className="text-lg">
                      Final Price: {formatCurrency(parseInt(bargainPrice))}
                    </div>
                    <Button
                      onClick={() => {
                        setShowBargainModal(false);
                        handleBooking(bargainHotel, parseInt(bargainPrice));
                      }}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Book at This Price
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-orange-600 text-xl font-bold">
                      💼 Counter Offer
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">
                        Hotel's counter offer:
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(aiOfferPrice || 0)}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => setShowBargainModal(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Decline
                      </Button>
                      <Button
                        onClick={() => {
                          setShowBargainModal(false);
                          handleBooking(
                            bargainHotel,
                            aiOfferPrice || bargainHotel?.price,
                          );
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Accept Offer
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
