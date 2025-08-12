import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorBanner } from "@/components/ErrorBanner";
import { FlightStyleBargainModal } from "@/components/FlightStyleBargainModal";
import { TransfersSearchForm } from "@/components/TransfersSearchForm";
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
  Car,
  Shield,
  Wifi,
  User,
  X,
  ArrowUpDown,
  ChevronDown,
  TrendingDown,
  Navigation,
  Luggage,
  Baby,
  Accessibility,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transfer {
  id: string;
  rateKey: string;
  supplierCode: string;
  vehicleType: string;
  vehicleClass: string;
  vehicleName: string;
  vehicleImage?: string;
  maxPassengers: number;
  maxLuggage: number;
  pickupLocation: string;
  pickupInstructions?: string;
  dropoffLocation: string;
  dropoffInstructions?: string;
  estimatedDuration: number;
  distance?: string;
  currency: string;
  basePrice: number;
  totalPrice: number;
  pricing: {
    basePrice: number;
    markupAmount: number;
    discountAmount: number;
    totalPrice: number;
    currency: string;
    savings: number;
  };
  features: string[];
  inclusions: string[];
  exclusions: string[];
  providerName: string;
  providerRating?: number;
  cancellationPolicy: any;
  freeWaitingTime: number;
  confirmationType: string;
  searchSessionId: string;
}

export default function TransferResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();

  // Extract search parameters
  const pickupLocation = searchParams.get("pickup") || "";
  const dropoffLocation = searchParams.get("dropoff") || "";
  const pickupDate = searchParams.get("pickupDate") || "";
  const pickupTime = searchParams.get("pickupTime") || "10:00";
  const returnDate = searchParams.get("returnDate") || "";
  const returnTime = searchParams.get("returnTime") || "14:00";
  const passengers = searchParams.get("passengers") || "2";
  const adults = searchParams.get("adults") || "2";
  const children = searchParams.get("children") || "0";
  const infants = searchParams.get("infants") || "0";
  const vehicleType = searchParams.get("vehicleType") || "";
  const isRoundTrip = searchParams.get("returnDate") !== null;

  // State for transfers data
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter and sort states
  const [showFilters, setShowFilters] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState("price_low");

  // Mobile states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Bargain modal states
  const [showBargainModal, setShowBargainModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  // Available filters based on current data
  const availableFilters = useMemo(() => {
    const vehicleTypes = [...new Set(transfers.map(t => t.vehicleType))];
    const vehicleClasses = [...new Set(transfers.map(t => t.vehicleClass))];
    const providers = [...new Set(transfers.map(t => t.providerName))];
    const maxCapacities = [...new Set(transfers.map(t => t.maxPassengers))].sort((a, b) => a - b);

    return {
      vehicleType: vehicleTypes,
      vehicleClass: vehicleClasses,
      provider: providers,
      capacity: maxCapacities,
      features: ["meet_greet", "flight_monitoring", "free_waiting", "professional_driver", "wifi", "air_conditioning"],
    };
  }, [transfers]);

  // Filter transfers based on selected filters and price range
  const filteredTransfers = useMemo(() => {
    let filtered = transfers.filter(transfer => {
      // Price range filter
      if (transfer.pricing.totalPrice < priceRange[0] || transfer.pricing.totalPrice > priceRange[1]) {
        return false;
      }

      // Vehicle type filter
      if (selectedFilters.vehicleType?.length && !selectedFilters.vehicleType.includes(transfer.vehicleType)) {
        return false;
      }

      // Vehicle class filter
      if (selectedFilters.vehicleClass?.length && !selectedFilters.vehicleClass.includes(transfer.vehicleClass)) {
        return false;
      }

      // Provider filter
      if (selectedFilters.provider?.length && !selectedFilters.provider.includes(transfer.providerName)) {
        return false;
      }

      // Capacity filter
      if (selectedFilters.capacity?.length) {
        const capacityMatch = selectedFilters.capacity.some(cap => transfer.maxPassengers >= parseInt(cap));
        if (!capacityMatch) return false;
      }

      // Features filter
      if (selectedFilters.features?.length) {
        const featuresMatch = selectedFilters.features.every(feature => transfer.features.includes(feature));
        if (!featuresMatch) return false;
      }

      return true;
    });

    // Sort transfers
    switch (sortBy) {
      case "price_low":
        filtered.sort((a, b) => a.pricing.totalPrice - b.pricing.totalPrice);
        break;
      case "price_high":
        filtered.sort((a, b) => b.pricing.totalPrice - a.pricing.totalPrice);
        break;
      case "duration":
        filtered.sort((a, b) => a.estimatedDuration - b.estimatedDuration);
        break;
      case "capacity":
        filtered.sort((a, b) => b.maxPassengers - a.maxPassengers);
        break;
      case "rating":
        filtered.sort((a, b) => (b.providerRating || 0) - (a.providerRating || 0));
        break;
      default:
        // Keep original order (recommended)
        break;
    }

    return filtered;
  }, [transfers, selectedFilters, priceRange, sortBy]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load transfer data
  useEffect(() => {
    const loadTransfers = async () => {
      try {
        setLoading(true);
        setError("");

        const searchPayload = {
          pickupLocation,
          dropoffLocation,
          pickupDate,
          pickupTime,
          ...(isRoundTrip && { returnDate, returnTime }),
          passengers: {
            adults: parseInt(adults),
            children: parseInt(children),
            infants: parseInt(infants),
          },
          isRoundTrip,
          vehicleType,
        };

        // TODO: Replace with actual API call
        const response = await fetch("/api/transfers/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchPayload),
        });

        if (!response.ok) {
          throw new Error("Failed to search transfers");
        }

        const data = await response.json();
        
        if (data.success) {
          setTransfers(data.data.transfers || []);
          
          // Set initial price range based on results
          if (data.data.transfers.length > 0) {
            const prices = data.data.transfers.map((t: Transfer) => t.pricing.totalPrice);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            setPriceRange([minPrice, maxPrice]);
          }
        } else {
          throw new Error(data.error || "Failed to load transfers");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load transfers");
        // Load sample data for demo
        loadSampleData();
      } finally {
        setLoading(false);
      }
    };

    loadTransfers();
  }, [pickupLocation, dropoffLocation, pickupDate, pickupTime, returnDate, returnTime, adults, children, infants, vehicleType, isRoundTrip]);

  // Load sample data for demo
  const loadSampleData = () => {
    const sampleTransfers: Transfer[] = [
      {
        id: "hotelbeds_1",
        rateKey: "sample_rate_1",
        supplierCode: "hotelbeds",
        vehicleType: "sedan",
        vehicleClass: "economy",
        vehicleName: "Sedan - Economy",
        maxPassengers: 3,
        maxLuggage: 2,
        pickupLocation: pickupLocation || "Mumbai Airport (BOM)",
        dropoffLocation: dropoffLocation || "Hotel Taj Mahal Palace",
        estimatedDuration: 45,
        distance: "25 km",
        currency: "INR",
        basePrice: 1200,
        totalPrice: 1380,
        pricing: {
          basePrice: 1200,
          markupAmount: 180,
          discountAmount: 0,
          totalPrice: 1380,
          currency: "INR",
          savings: 0,
        },
        features: ["meet_greet", "professional_driver", "free_waiting"],
        inclusions: ["Professional driver", "Meet & greet service", "60 minutes free waiting"],
        exclusions: ["Tolls", "Parking fees"],
        providerName: "Mumbai Transfers Ltd",
        providerRating: 4.3,
        cancellationPolicy: { freeUntil: "24h", feePercentage: 10 },
        freeWaitingTime: 60,
        confirmationType: "INSTANT",
        searchSessionId: "demo_session",
      },
      {
        id: "hotelbeds_2",
        rateKey: "sample_rate_2",
        supplierCode: "hotelbeds",
        vehicleType: "suv",
        vehicleClass: "premium",
        vehicleName: "SUV - Premium",
        maxPassengers: 6,
        maxLuggage: 4,
        pickupLocation: pickupLocation || "Mumbai Airport (BOM)",
        dropoffLocation: dropoffLocation || "Hotel Taj Mahal Palace",
        estimatedDuration: 45,
        distance: "25 km",
        currency: "INR",
        basePrice: 2200,
        totalPrice: 2530,
        pricing: {
          basePrice: 2200,
          markupAmount: 330,
          discountAmount: 0,
          totalPrice: 2530,
          currency: "INR",
          savings: 0,
        },
        features: ["meet_greet", "professional_driver", "free_waiting", "wifi", "air_conditioning"],
        inclusions: ["Professional driver", "Meet & greet service", "Free WiFi", "Air conditioning", "90 minutes free waiting"],
        exclusions: ["Tolls", "Parking fees"],
        providerName: "Premium Transfers",
        providerRating: 4.7,
        cancellationPolicy: { freeUntil: "24h", feePercentage: 15 },
        freeWaitingTime: 90,
        confirmationType: "INSTANT",
        searchSessionId: "demo_session",
      },
      {
        id: "hotelbeds_3",
        rateKey: "sample_rate_3",
        supplierCode: "hotelbeds",
        vehicleType: "luxury",
        vehicleClass: "luxury",
        vehicleName: "Mercedes E-Class",
        maxPassengers: 3,
        maxLuggage: 3,
        pickupLocation: pickupLocation || "Mumbai Airport (BOM)",
        dropoffLocation: dropoffLocation || "Hotel Taj Mahal Palace",
        estimatedDuration: 40,
        distance: "25 km",
        currency: "INR",
        basePrice: 3800,
        totalPrice: 4370,
        pricing: {
          basePrice: 3800,
          markupAmount: 570,
          discountAmount: 0,
          totalPrice: 4370,
          currency: "INR",
          savings: 0,
        },
        features: ["meet_greet", "professional_driver", "free_waiting", "wifi", "air_conditioning", "flight_monitoring"],
        inclusions: ["Professional chauffeur", "VIP service", "Flight monitoring", "Complimentary refreshments", "120 minutes free waiting"],
        exclusions: ["Tolls", "Parking fees"],
        providerName: "Luxury Chauffeurs",
        providerRating: 4.9,
        cancellationPolicy: { freeUntil: "12h", feePercentage: 25 },
        freeWaitingTime: 120,
        confirmationType: "INSTANT",
        searchSessionId: "demo_session",
      },
    ];

    setTransfers(sampleTransfers);
    
    // Set price range
    const prices = sampleTransfers.map(t => t.pricing.totalPrice);
    setPriceRange([Math.min(...prices), Math.max(...prices)]);
  };

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const current = prev[filterType] || [];
      if (checked) {
        return { ...prev, [filterType]: [...current, value] };
      } else {
        return { ...prev, [filterType]: current.filter(v => v !== value) };
      }
    });
  };

  const clearFilters = () => {
    setSelectedFilters({});
    const prices = transfers.map(t => t.pricing.totalPrice);
    if (prices.length > 0) {
      setPriceRange([Math.min(...prices), Math.max(...prices)]);
    }
  };

  const handleBargain = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setShowBargainModal(true);
  };

  const handleBookNow = (transfer: Transfer) => {
    const bookingParams = new URLSearchParams({
      transferId: transfer.id,
      rateKey: transfer.rateKey,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      ...(isRoundTrip && { returnDate, returnTime }),
      adults,
      children,
      infants,
    });

    navigate(`/transfer-booking?${bookingParams.toString()}`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case "sedan":
        return <Car className="w-5 h-5" />;
      case "suv":
        return <Car className="w-5 h-5" />;
      case "minivan":
        return <Car className="w-5 h-5" />;
      case "luxury":
        return <Car className="w-5 h-5" />;
      case "wheelchair":
        return <Accessibility className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "meet_greet":
        return <User className="w-4 h-4" />;
      case "flight_monitoring":
        return <Navigation className="w-4 h-4" />;
      case "free_waiting":
        return <Clock className="w-4 h-4" />;
      case "professional_driver":
        return <User className="w-4 h-4" />;
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      case "air_conditioning":
        return <Shield className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          message={error}
          onClose={() => setError("")}
        />
      )}

      {/* Search Form at Top */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="max-w-7xl mx-auto px-4">
          <TransfersSearchForm />
        </div>
      </div>

      {/* Search Summary Bar */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{pickupLocation}</span>
                <span>→</span>
                <span>{dropoffLocation}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(pickupDate).toLocaleDateString()}</span>
                {isRoundTrip && (
                  <>
                    <span>-</span>
                    <span>{new Date(returnDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{passengers} passenger{parseInt(passengers) !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Filters Sidebar */}
          <div className={cn(
            "lg:col-span-1",
            isMobile && !showFilters && "hidden"
          )}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </Button>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Price Range</h4>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={Math.max(...transfers.map(t => t.pricing.totalPrice), 10000)}
                  min={Math.min(...transfers.map(t => t.pricing.totalPrice), 0)}
                  step={100}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>

              {/* Vehicle Type */}
              {availableFilters.vehicleType.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Vehicle Type</h4>
                  <div className="space-y-2">
                    {availableFilters.vehicleType.map(type => (
                      <label key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedFilters.vehicleType?.includes(type) || false}
                          onCheckedChange={(checked) => handleFilterChange('vehicleType', type, !!checked)}
                        />
                        <span className="text-sm capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Class */}
              {availableFilters.vehicleClass.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Vehicle Class</h4>
                  <div className="space-y-2">
                    {availableFilters.vehicleClass.map(cls => (
                      <label key={cls} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedFilters.vehicleClass?.includes(cls) || false}
                          onCheckedChange={(checked) => handleFilterChange('vehicleClass', cls, !!checked)}
                        />
                        <span className="text-sm capitalize">{cls}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Features</h4>
                <div className="space-y-2">
                  {availableFilters.features.map(feature => (
                    <label key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedFilters.features?.includes(feature) || false}
                        onCheckedChange={(checked) => handleFilterChange('features', feature, !!checked)}
                      />
                      <span className="text-sm">
                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {filteredTransfers.length} transfer{filteredTransfers.length !== 1 ? 's' : ''} found
              </h2>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="duration">Duration</option>
                  <option value="capacity">Capacity</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>

            {/* Transfer Cards */}
            <div className="space-y-3">
              {filteredTransfers.map((transfer) => (
                <div key={transfer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    {/* Left Section - Transfer Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        {/* Vehicle Icon */}
                        <div className="flex-shrink-0 w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getVehicleIcon(transfer.vehicleType)}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {transfer.vehicleName}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {transfer.vehicleClass}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>Up to {transfer.maxPassengers} passengers</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Luggage className="w-4 h-4" />
                              <span>{transfer.maxLuggage} bags</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(transfer.estimatedDuration)}</span>
                            </div>
                            {transfer.distance && (
                              <div className="flex items-center space-x-1">
                                <Navigation className="w-4 h-4" />
                                <span>{transfer.distance}</span>
                              </div>
                            )}
                          </div>

                          {/* Features */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {transfer.features.slice(0, 4).map((feature) => (
                              <div key={feature} className="flex items-center space-x-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {getFeatureIcon(feature)}
                                <span>
                                  {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>
                            ))}
                            {transfer.features.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{transfer.features.length - 4} more
                              </span>
                            )}
                          </div>

                          {/* Provider Info */}
                          <div className="flex items-center space-x-3 text-sm">
                            <span className="text-gray-600">By {transfer.providerName}</span>
                            {transfer.providerRating && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-gray-600">{transfer.providerRating}</span>
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                              {transfer.confirmationType === "INSTANT" ? "Instant Confirmation" : "Confirmation Required"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Pricing and Actions */}
                    <div className="flex-shrink-0 lg:w-56 text-right">
                      {/* Pricing */}
                      <div className="mb-2">
                        {transfer.pricing.savings > 0 && (
                          <div className="text-sm text-green-600 mb-1">
                            Save {formatPrice(transfer.pricing.savings)}
                          </div>
                        )}
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(transfer.pricing.totalPrice)}
                        </div>
                        {transfer.pricing.markupAmount > 0 && (
                          <div className="text-sm text-gray-500">
                            Base: {formatPrice(transfer.pricing.basePrice)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {isRoundTrip ? "Round trip" : "One way"}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => navigate(`/transfer-details/${transfer.id}`)}
                          variant="outline"
                          className="w-full py-3 text-sm font-semibold border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white transition-all duration-200 min-h-[44px] rounded-xl active:scale-95 touch-manipulation"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => handleBookNow(transfer)}
                          className="w-full py-3 bg-[#003580] hover:bg-[#002860] active:bg-[#001f4a] text-white font-semibold text-sm min-h-[44px] rounded-xl shadow-sm active:scale-95 touch-manipulation transition-all duration-200"
                        >
                          Book Now
                        </Button>
                        <Button
                          onClick={() => handleBargain(transfer)}
                          className="w-full py-3 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px] rounded-xl shadow-sm active:scale-95 touch-manipulation transition-all duration-200"
                        >
                          <TrendingDown className="w-4 h-4" />
                          Bargain
                        </Button>
                      </div>

                      {/* Cancellation Policy */}
                      <div className="text-xs text-gray-500 mt-2">
                        Free cancellation up to {transfer.cancellationPolicy?.freeUntil || "24h"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredTransfers.length === 0 && (
              <div className="text-center py-12">
                <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No transfers found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="text-blue-600 border-blue-600"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      {isMobile && (
        <MobileBottomBar>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm font-semibold">
                {filteredTransfers.length} transfer{filteredTransfers.length !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-600">
                From {filteredTransfers.length > 0 ? formatPrice(Math.min(...filteredTransfers.map(t => t.pricing.totalPrice))) : "N/A"}
              </div>
            </div>
            <Button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              variant="outline"
              size="sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </MobileBottomBar>
      )}

      {/* Bargain Modal */}
      {showBargainModal && selectedTransfer && (
        <FlightStyleBargainModal
          isOpen={showBargainModal}
          onClose={() => {
            setShowBargainModal(false);
            setSelectedTransfer(null);
          }}
          transfer={{
            id: selectedTransfer.id,
            vehicleName: selectedTransfer.vehicleName,
            route: `${pickupLocation} → ${dropoffLocation}`,
            departureTime: pickupTime,
            duration: formatDuration(selectedTransfer.estimatedDuration),
            originalPrice: selectedTransfer.pricing.totalPrice,
            currency: selectedTransfer.currency,
            passengers: parseInt(passengers),
          }}
          onBargainSuccess={(newPrice) => {
            // Handle bargain success
            console.log("Bargain successful:", newPrice);
            setShowBargainModal(false);
            setSelectedTransfer(null);
          }}
        />
      )}
    </div>
  );
}
