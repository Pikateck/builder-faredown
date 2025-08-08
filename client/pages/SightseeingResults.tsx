import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorBanner } from "@/components/ErrorBanner";
import { SightseeingCard } from "@/components/SightseeingCard";
import { BargainModalPhase1 } from "@/components/BargainModalPhase1";
import { useBargainPhase1 } from "@/hooks/useBargainPhase1";
import { useCurrency } from "@/contexts/CurrencyContext";
import { MobileBottomBar } from "@/components/mobile/MobileBottomBar";
import { 
  Filter, 
  SlidersHorizontal, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Clock,
  Ticket,
  Camera,
  Building2,
  Utensils,
  Music,
  Mountain,
  X,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SightseeingAttraction {
  id: string;
  name: string;
  location: string;
  images: string[];
  rating: number;
  reviews: number;
  originalPrice: number;
  currentPrice: number;
  description: string;
  category: "museum" | "landmark" | "tour" | "activity" | "food" | "culture" | "adventure";
  duration: string;
  highlights: string[];
  includes: string[];
  availableSlots: {
    date: string;
    times: string[];
  }[];
  features: string[];
  ticketTypes: {
    name: string;
    price: number;
    features: string[];
  }[];
}

export default function SightseeingResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();

  // Extract search parameters
  const destination = searchParams.get("destination") || "";
  const destinationName = searchParams.get("destinationName") || "";
  const visitDate = searchParams.get("visitDate") || "";
  const adults = searchParams.get("adults") || "2";
  const children = searchParams.get("children") || "0";
  const experienceType = searchParams.get("experienceType") || "any";
  const duration = searchParams.get("duration") || "any";

  // State for attractions data
  const [attractions, setAttractions] = useState<SightseeingAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter and sort states
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState("recommended");

  // Mobile states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);

  // Bargain hook integration
  const bargainHook = useBargainPhase1({
    onBookingConfirmed: (item, finalPrice) => {
      navigate(
        `/sightseeing-booking-confirmation?itemId=${item.itemId}&finalPrice=${finalPrice}&bargainApplied=true`,
      );
    },
    redirectToBooking: true,
    deviceType: window.innerWidth <= 768 ? "mobile" : "desktop",
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load sample attractions data
  useEffect(() => {
    const loadAttractions = async () => {
      setLoading(true);
      setError("");

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Sample data based on destination
        const sampleAttractions: SightseeingAttraction[] = [
          {
            id: "burj-khalifa",
            name: "Burj Khalifa: Floors 124 and 125",
            location: `${destinationName || "Dubai"}, UAE`,
            images: [
              "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F1c028110ac7249b5a2c29bd177bac3f3?format=webp&width=800",
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
            ],
            rating: 4.6,
            reviews: 45879,
            originalPrice: 189,
            currentPrice: 149,
            description: "Skip the line and enjoy breathtaking views from the world's tallest building",
            category: "landmark",
            duration: "1-2 hours",
            highlights: [
              "360-degree views of Dubai",
              "High-speed elevator experience",
              "Outdoor observation deck",
              "Interactive displays"
            ],
            includes: [
              "Skip-the-line access",
              "Access to floors 124 & 125",
              "Outdoor observation deck",
              "Welcome refreshment"
            ],
            features: ["Skip the line", "Audio guide", "Mobile ticket"],
            availableSlots: [
              {
                date: visitDate || new Date().toISOString(),
                times: ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"]
              }
            ],
            ticketTypes: [
              {
                name: "Standard Admission",
                price: 149,
                features: ["Floors 124 & 125", "Skip-the-line access"]
              },
              {
                name: "Prime Time",
                price: 199,
                features: ["Floors 124 & 125", "Skip-the-line access", "Prime viewing times"]
              }
            ]
          },
          {
            id: "dubai-aquarium",
            name: "Dubai Aquarium & Underwater Zoo",
            location: `${destinationName || "Dubai"}, UAE`,
            images: [
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
            ],
            rating: 4.4,
            reviews: 23156,
            originalPrice: 120,
            currentPrice: 89,
            description: "Explore one of the world's largest suspended aquariums with over 140 species",
            category: "museum",
            duration: "2-3 hours",
            highlights: [
              "48-meter aquarium tunnel",
              "King Crocodile encounter",
              "Underwater zoo experience",
              "Interactive touch tanks"
            ],
            includes: [
              "Aquarium tunnel access",
              "Underwater zoo entry",
              "King Crocodile viewing",
              "Touch tank experience"
            ],
            features: ["Mobile ticket", "Audio guide", "Photo opportunities"],
            availableSlots: [
              {
                date: visitDate || new Date().toISOString(),
                times: ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"]
              }
            ],
            ticketTypes: [
              {
                name: "Aquarium + Zoo",
                price: 89,
                features: ["Aquarium access", "Underwater zoo", "Touch tanks"]
              },
              {
                name: "Explorer Experience",
                price: 129,
                features: ["All standard features", "Behind-the-scenes tour", "Feeding experience"]
              }
            ]
          },
          {
            id: "desert-safari",
            name: "Desert Safari with BBQ Dinner",
            location: `${destinationName || "Dubai"} Desert, UAE`,
            images: [
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
            ],
            rating: 4.7,
            reviews: 18934,
            originalPrice: 179,
            currentPrice: 139,
            description: "Adventure through the golden dunes with camel riding, sandboarding, and traditional entertainment",
            category: "adventure",
            duration: "6-7 hours",
            highlights: [
              "Dune bashing in 4x4 vehicle",
              "Camel riding experience",
              "Traditional BBQ dinner",
              "Live entertainment shows"
            ],
            includes: [
              "Hotel pickup & drop-off",
              "Dune bashing experience",
              "Camel riding",
              "BBQ dinner & refreshments",
              "Entertainment shows"
            ],
            features: ["Hotel pickup", "Dinner included", "Cultural show"],
            availableSlots: [
              {
                date: visitDate || new Date().toISOString(),
                times: ["15:00", "15:30", "16:00"]
              }
            ],
            ticketTypes: [
              {
                name: "Standard Safari",
                price: 139,
                features: ["Dune bashing", "Camel ride", "BBQ dinner", "Shows"]
              },
              {
                name: "VIP Safari",
                price: 199,
                features: ["All standard features", "Private table", "Premium beverages", "Falcon photo"]
              }
            ]
          },
          {
            id: "dubai-marina-cruise",
            name: "Dubai Marina Yacht Cruise",
            location: `${destinationName || "Dubai"} Marina, UAE`,
            images: [
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
            ],
            rating: 4.5,
            reviews: 12487,
            originalPrice: 159,
            currentPrice: 119,
            description: "Luxury yacht cruise through Dubai Marina with stunning skyline views",
            category: "tour",
            duration: "2 hours",
            highlights: [
              "Luxury yacht experience",
              "Dubai Marina skyline",
              "Professional photography",
              "Refreshments included"
            ],
            includes: [
              "2-hour yacht cruise",
              "Welcome refreshments",
              "Professional crew",
              "Photo opportunities"
            ],
            features: ["Refreshments", "Photo stops", "Live commentary"],
            availableSlots: [
              {
                date: visitDate || new Date().toISOString(),
                times: ["10:00", "12:30", "15:00", "17:30", "20:00"]
              }
            ],
            ticketTypes: [
              {
                name: "Sharing Cruise",
                price: 119,
                features: ["2-hour cruise", "Refreshments", "Shared yacht"]
              },
              {
                name: "Private Cruise",
                price: 299,
                features: ["Private yacht", "Personal crew", "Premium refreshments", "Extended time"]
              }
            ]
          },
          {
            id: "spice-souk-tour",
            name: "Traditional Spice & Gold Souk Tour",
            location: `${destinationName || "Dubai"} Old Town, UAE`,
            images: [
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
            ],
            rating: 4.3,
            reviews: 8765,
            originalPrice: 89,
            currentPrice: 69,
            description: "Explore Dubai's traditional markets with a local guide and discover authentic spices and gold",
            category: "culture",
            duration: "3 hours",
            highlights: [
              "Traditional spice market",
              "Gold souk exploration",
              "Local guide insights",
              "Authentic shopping experience"
            ],
            includes: [
              "Professional local guide",
              "Market entrance fees",
              "Traditional tea tasting",
              "Shopping recommendations"
            ],
            features: ["Local guide", "Cultural experience", "Tea tasting"],
            availableSlots: [
              {
                date: visitDate || new Date().toISOString(),
                times: ["09:00", "11:00", "14:00", "16:00"]
              }
            ],
            ticketTypes: [
              {
                name: "Group Tour",
                price: 69,
                features: ["Shared guide", "Market tours", "Tea tasting"]
              },
              {
                name: "Private Tour",
                price: 149,
                features: ["Private guide", "Customized route", "Extended time", "Shopping assistance"]
              }
            ]
          },
          {
            id: "food-walking-tour",
            name: "Dubai Food Walking Tour",
            location: `${destinationName || "Dubai"} Food District, UAE`,
            images: [
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
              "/api/placeholder/400/300",
            ],
            rating: 4.8,
            reviews: 5432,
            originalPrice: 129,
            currentPrice: 99,
            description: "Taste authentic Middle Eastern cuisine while exploring Dubai's food scene",
            category: "food",
            duration: "4 hours",
            highlights: [
              "8 food tastings",
              "Local restaurants",
              "Cultural food stories",
              "Small group experience"
            ],
            includes: [
              "Professional food guide",
              "8 food and drink tastings",
              "Restaurant visits",
              "Cultural insights"
            ],
            features: ["Food included", "Small groups", "Local guide"],
            availableSlots: [
              {
                date: visitDate || new Date().toISOString(),
                times: ["10:00", "14:00", "18:00"]
              }
            ],
            ticketTypes: [
              {
                name: "Standard Tour",
                price: 99,
                features: ["8 tastings", "Group tour", "Cultural guide"]
              },
              {
                name: "VIP Food Tour",
                price: 159,
                features: ["12 tastings", "Private guide", "Premium restaurants", "Take-home treats"]
              }
            ]
          }
        ];

        setAttractions(sampleAttractions);
        
        // Set initial price range based on loaded data
        const prices = sampleAttractions.map(attraction => attraction.currentPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange([minPrice, maxPrice]);

      } catch (err) {
        console.error("Error loading attractions:", err);
        setError("Failed to load sightseeing attractions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAttractions();
  }, [destination, visitDate, adults, children]);

  // Filter categories and options
  const filterCategories = [
    {
      id: "category",
      name: "Experience Type",
      options: [
        { id: "landmark", name: "Landmarks & Attractions", icon: Monument },
        { id: "museum", name: "Museums & Culture", icon: Camera },
        { id: "tour", name: "Tours & Sightseeing", icon: Ticket },
        { id: "adventure", name: "Adventure & Sports", icon: Mountain },
        { id: "food", name: "Food & Dining", icon: Utensils },
        { id: "culture", name: "Cultural Experiences", icon: Music },
      ]
    },
    {
      id: "duration",
      name: "Duration",
      options: [
        { id: "short", name: "Up to 2 hours", icon: Clock },
        { id: "medium", name: "2-4 hours", icon: Clock },
        { id: "long", name: "4+ hours", icon: Clock },
        { id: "full-day", name: "Full day", icon: Clock },
      ]
    },
    {
      id: "features",
      name: "Features",
      options: [
        { id: "skip-line", name: "Skip-the-line", icon: Ticket },
        { id: "audio-guide", name: "Audio guide", icon: Camera },
        { id: "mobile-ticket", name: "Mobile ticket", icon: Ticket },
        { id: "hotel-pickup", name: "Hotel pickup", icon: MapPin },
        { id: "food-included", name: "Food included", icon: Utensils },
        { id: "small-groups", name: "Small groups", icon: Users },
      ]
    }
  ];

  // Sort options
  const sortOptions = [
    { id: "recommended", name: "Recommended" },
    { id: "price-low", name: "Price: Low to High" },
    { id: "price-high", name: "Price: High to Low" },
    { id: "rating", name: "Highest Rated" },
    { id: "duration-short", name: "Duration: Shortest First" },
    { id: "popularity", name: "Most Popular" },
  ];

  // Filter and sort attractions
  const filteredAndSortedAttractions = useMemo(() => {
    let filtered = attractions.filter((attraction) => {
      // Price range filter
      const price = attraction.currentPrice;
      if (price < priceRange[0] || price > priceRange[1]) return false;

      // Apply category filters
      for (const [categoryId, filterIds] of Object.entries(selectedFilters)) {
        if (filterIds.length === 0) continue;

        switch (categoryId) {
          case "category":
            if (!filterIds.includes(attraction.category)) return false;
            break;
          case "duration":
            // Map duration to filter IDs
            const durationHours = attraction.duration.includes("1-2") ? "short" :
                                 attraction.duration.includes("2-3") || attraction.duration.includes("2-4") ? "medium" :
                                 attraction.duration.includes("4") || attraction.duration.includes("6-7") ? "long" :
                                 "full-day";
            if (!filterIds.includes(durationHours)) return false;
            break;
          case "features":
            // Check if attraction has the required features
            const attractionFeatures = attraction.features.map(f => 
              f.toLowerCase().replace(/[^a-z]/g, '-')
            );
            const hasFeature = filterIds.some(filterId => 
              attractionFeatures.some(feature => feature.includes(filterId.replace('-', '')))
            );
            if (!hasFeature) return false;
            break;
        }
      }

      return true;
    });

    // Sort filtered results
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case "price-high":
        filtered.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "duration-short":
        filtered.sort((a, b) => {
          const getDurationHours = (duration: string) => {
            const match = duration.match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          return getDurationHours(a.duration) - getDurationHours(b.duration);
        });
        break;
      case "popularity":
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      default: // recommended
        filtered.sort((a, b) => b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews));
        break;
    }

    return filtered;
  }, [attractions, priceRange, selectedFilters, sortBy]);

  // Handle filter changes
  const handleFilterChange = (categoryId: string, filterId: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const categoryFilters = prev[categoryId] || [];
      
      if (checked) {
        return {
          ...prev,
          [categoryId]: [...categoryFilters, filterId]
        };
      } else {
        return {
          ...prev,
          [categoryId]: categoryFilters.filter(id => id !== filterId)
        };
      }
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({});
    setPriceRange([0, 10000]);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).reduce((count, filters) => count + filters.length, 0);
  };

  // Handle bargain click
  const handleBargainClick = (attraction: SightseeingAttraction, searchParams: URLSearchParams) => {
    const item = {
      itemId: attraction.id,
      name: attraction.name,
      originalPrice: attraction.originalPrice,
      currentPrice: attraction.currentPrice,
      type: "sightseeing" as const,
      imageUrl: attraction.images[0],
      details: {
        location: attraction.location,
        duration: attraction.duration,
        rating: attraction.rating,
        category: attraction.category,
      },
    };

    bargainHook.triggerBargain(item, {
      destination: searchParams.get("destination") || "",
      visitDate: searchParams.get("visitDate") || "",
      adults: searchParams.get("adults") || "2",
      children: searchParams.get("children") || "0",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Finding amazing experiences for you...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {error && (
        <ErrorBanner 
          message={error} 
          onClose={() => setError("")} 
        />
      )}

      {/* Search Summary */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Sightseeing in {destinationName || destination}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(visitDate).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {adults} adult{parseInt(adults) !== 1 ? 's' : ''}{parseInt(children) > 0 ? `, ${children} child${parseInt(children) !== 1 ? 'ren' : ''}` : ''}
                </span>
                <span className="text-gray-400">•</span>
                <span>{filteredAndSortedAttractions.length} experiences found</span>
              </div>
            </div>
            
            {/* Desktop: Filter and Sort */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
              
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Mobile: Filter and Sort buttons */}
            <div className="md:hidden flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMobileFilters(true)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowMobileSort(true)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          {showFilters && (
            <div className="hidden md:block w-80 bg-white rounded-lg shadow-sm border h-fit sticky top-24">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear all
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {/* Price Range */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>
                </div>

                {/* Filter Categories */}
                {filterCategories.map((category) => (
                  <div key={category.id}>
                    <h4 className="font-medium text-gray-900 mb-3">{category.name}</h4>
                    <div className="space-y-2">
                      {category.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${category.id}-${option.id}`}
                            checked={(selectedFilters[category.id] || []).includes(option.id)}
                            onCheckedChange={(checked) =>
                              handleFilterChange(category.id, option.id, !!checked)
                            }
                          />
                          <label
                            htmlFor={`${category.id}-${option.id}`}
                            className="text-sm text-gray-700 cursor-pointer flex items-center gap-2"
                          >
                            <option.icon className="w-4 h-4 text-gray-500" />
                            {option.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attractions List */}
          <div className="flex-1">
            {filteredAndSortedAttractions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No experiences found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={clearAllFilters} variant="outline">
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedAttractions.map((attraction) => (
                  <SightseeingCard
                    key={attraction.id}
                    attraction={attraction}
                    onBargainClick={() => handleBargainClick(attraction, searchParams)}
                    searchParams={searchParams}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Price Range */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="space-y-3">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={500}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Filter Categories */}
              {filterCategories.map((category) => (
                <div key={category.id}>
                  <h4 className="font-medium text-gray-900 mb-3">{category.name}</h4>
                  <div className="space-y-2">
                    {category.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mobile-${category.id}-${option.id}`}
                          checked={(selectedFilters[category.id] || []).includes(option.id)}
                          onCheckedChange={(checked) =>
                            handleFilterChange(category.id, option.id, !!checked)
                          }
                        />
                        <label
                          htmlFor={`mobile-${category.id}-${option.id}`}
                          className="text-sm text-gray-700 cursor-pointer flex items-center gap-2"
                        >
                          <option.icon className="w-4 h-4 text-gray-500" />
                          {option.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-2">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="flex-1"
              >
                Clear all
              </Button>
              <Button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 bg-[#003580] hover:bg-[#002a66] text-white"
              >
                Apply filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Modal */}
      {showMobileSort && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Sort by</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileSort(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSortBy(option.id);
                    setShowMobileSort(false);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    sortBy === option.id
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bargain Modal */}
      <BargainModalPhase1 {...bargainHook.getBargainModalProps()} />
    </div>
  );
}
