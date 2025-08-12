import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MobileNavBar } from "@/components/mobile/MobileNavBar";
import { EnhancedBargainModal } from "@/components/EnhancedBargainModal";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { formatPriceNoDecimals as formatPrice } from "@/lib/formatPrice";
import { transfersService } from "@/services/transfersService";
import {
  MapPin,
  Clock,
  Users,
  Car,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Star,
  TrendingDown,
  ArrowRight,
  Luggage,
  Wifi,
  Snowflake,
  Shield,
  Baby,
  Accessibility,
} from "lucide-react";

interface TransferDetails {
  id: string;
  name: string;
  description: string;
  images: string[];
  vehicleType: string;
  category: string;
  maxPassengers: number;
  maxLuggage: number;
  duration: string;
  distance: string;
  pickupLocation: string;
  dropoffLocation: string;
  features: string[];
  amenities: string[];
  pricing: {
    basePrice: number;
    totalPrice: number;
    currency: string;
    priceBreakdown: {
      basePrice: number;
      taxes: number;
      fees: number;
    };
  };
  supplier: {
    name: string;
    rating: number;
    reviews: number;
  };
  cancellationPolicy: string;
  pickupInstructions: string;
  termsAndConditions: string[];
}

export function TransferDetails() {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State management
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);

  // Tabs configuration
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "vehicle", label: "Vehicle Info" },
    { id: "route", label: "Route" },
    { id: "terms", label: "Terms" },
  ];

  // Load transfer details
  useEffect(() => {
    const loadTransferDetails = async () => {
      if (!id) {
        setError("Transfer ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const transferData = await transfersService.getTransferDetails(id);

        // The service now returns transfer data directly (with fallback)
        if (transferData) {
          setTransfer({
            id: transferData.id,
            name: transferData.vehicleName,
            description: `Experience comfortable and reliable transport with our ${transferData.vehicleName}. Professional service with ${transferData.features?.join(", ") || "premium features"}.`,
            images: [transferData.vehicleImage || "https://images.unsplash.com/photo-1549317336-206569e8475c?w=800"],
            vehicleType: transferData.vehicleType,
            category: transferData.vehicleClass,
            maxPassengers: transferData.maxPassengers,
            maxLuggage: transferData.maxLuggage,
            duration: `${transferData.estimatedDuration} minutes`,
            distance: transferData.distance || "N/A",
            pickupLocation: transferData.pickupLocation,
            dropoffLocation: transferData.dropoffLocation,
            features: transferData.features || [],
            amenities: transferData.features || [],
            pricing: {
              basePrice: transferData.pricing?.basePrice || transferData.basePrice || 0,
              totalPrice: transferData.pricing?.totalPrice || transferData.totalPrice || 0,
              currency: transferData.pricing?.currency || transferData.currency || "INR",
              priceBreakdown: {
                basePrice: transferData.pricing?.basePrice || transferData.basePrice || 0,
                taxes: 0,
                fees: 0,
              },
            },
            supplier: {
              name: transferData.providerName || "Transfer Provider",
              rating: transferData.providerRating || 4.5,
              reviews: 124,
            },
            cancellationPolicy: `Free cancellation up to ${transferData.cancellationPolicy?.freeUntil || "24 hours"} before departure`,
            pickupInstructions: transferData.pickupInstructions || "Your driver will meet you at the designated pickup point with a name sign.",
            termsAndConditions: [
              "Professional driver included",
              "Meet and greet service",
              `${transferData.freeWaitingTime || 60} minutes free waiting time`,
              "Flight monitoring available",
              "Cancel up to " + (transferData.cancellationPolicy?.freeUntil || "24 hours") + " before departure"
            ]
          });
        } else {
          setError("Transfer not found");
        }
      } catch (err) {
        console.error("Error loading transfer details:", err);
        setError("Failed to load transfer details");
      } finally {
        setLoading(false);
      }
    };

    loadTransferDetails();
  }, [id]);

  // Image navigation
  const nextImage = () => {
    if (transfer && transfer.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === transfer.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (transfer && transfer.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? transfer.images.length - 1 : prev - 1
      );
    }
  };

  // Feature icons mapping
  const getFeatureIcon = (feature: string) => {
    const iconMap: { [key: string]: any } = {
      "air conditioning": Snowflake,
      "wifi": Wifi,
      "luggage space": Luggage,
      "child seat": Baby,
      "wheelchair accessible": Accessibility,
      "professional driver": Shield,
    };

    const IconComponent = iconMap[feature.toLowerCase()] || CheckCircle;
    return <IconComponent className="w-5 h-5 text-green-500 mr-3" />;
  };

  // Handle booking actions
  const handleBookNow = () => {
    if (transfer) {
      navigate(`/booking?type=transfer&id=${transfer.id}`);
    }
  };

  const handleBargainClick = () => {
    setIsBargainModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transfer details...</p>
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-600 mb-4">{error || "Transfer not found"}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileNavBar title="Transfer Details" />

      {/* Hero Image Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={transfer.images[currentImageIndex] || "/placeholder.svg"}
          alt={transfer.name}
          className="w-full h-full object-cover"
        />
        
        {/* Image Navigation */}
        {transfer.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Indicators */}
        {transfer.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {transfer.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Supplier Rating Badge */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-white text-gray-900 font-semibold">
            <Star className="w-4 h-4 text-yellow-500 mr-1 fill-current" />
            {transfer.supplier.rating.toFixed(1)}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 bg-white">
        {/* Transfer Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {transfer.name}
          </h1>
          
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {transfer.pickupLocation} → {transfer.dropoffLocation}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {transfer.duration}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Up to {transfer.maxPassengers} passengers
            </div>
            <div className="flex items-center">
              <Car className="w-4 h-4 mr-1" />
              {transfer.vehicleType}
            </div>
          </div>

          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600">by {transfer.supplier.name}</span>
            <span className="mx-2">•</span>
            <span className="text-sm text-gray-600">{transfer.supplier.reviews} reviews</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed">{transfer.description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
              <div className="grid grid-cols-1 gap-3">
                {transfer.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-600">
                    {getFeatureIcon(feature)}
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Route Information</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Pickup</div>
                  <div className="text-sm text-gray-600">{transfer.pickupLocation}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Drop-off</div>
                  <div className="text-sm text-gray-600">{transfer.dropoffLocation}</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600 text-center">
                Distance: {transfer.distance} • Duration: {transfer.duration}
              </div>
            </div>
          </div>
        )}

        {activeTab === "vehicle" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Vehicle Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold">{transfer.maxPassengers}</div>
                  <div className="text-sm text-gray-600">Max Passengers</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <Luggage className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold">{transfer.maxLuggage}</div>
                  <div className="text-sm text-gray-600">Luggage Pieces</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
              <div className="grid grid-cols-2 gap-3">
                {transfer.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Vehicle Category</h3>
              <Badge variant="secondary" className="text-sm">
                {transfer.category}
              </Badge>
            </div>
          </div>
        )}

        {activeTab === "route" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Pickup Instructions</h3>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700">{transfer.pickupInstructions}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Route Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold">{transfer.distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{transfer.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle Type:</span>
                  <span className="font-semibold">{transfer.vehicleType}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "terms" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Cancellation Policy</h3>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-gray-700">{transfer.cancellationPolicy}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
              <ul className="space-y-2">
                {transfer.termsAndConditions.map((term, index) => (
                  <li key={index} className="flex items-start text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Pricing & Booking Section */}
      <div className="p-4 bg-white border-t border-gray-200">
        <Card className="p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(transfer.pricing.totalPrice, transfer.pricing.currency)}
              </div>
              <div className="text-sm text-gray-600">
                includes taxes and fees
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Base Price</div>
              <div className="font-semibold">
                {formatPrice(transfer.pricing.basePrice, transfer.pricing.currency)}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span>{formatPrice(transfer.pricing.priceBreakdown.basePrice, transfer.pricing.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes:</span>
              <span>{formatPrice(transfer.pricing.priceBreakdown.taxes, transfer.pricing.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fees:</span>
              <span>{formatPrice(transfer.pricing.priceBreakdown.fees, transfer.pricing.currency)}</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleBargainClick}
            className="bg-[#febb02] hover:bg-[#e6a602] text-black min-h-[44px] touch-manipulation"
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Bargain Now
          </Button>
          <Button
            onClick={handleBookNow}
            className="bg-[#003580] hover:bg-[#002a66] text-white min-h-[44px] touch-manipulation"
          >
            Book Now
          </Button>
        </div>
      </div>

      {/* Bargain Modal */}
      {isBargainModalOpen && (
        <EnhancedBargainModal
          isOpen={isBargainModalOpen}
          onClose={() => setIsBargainModalOpen(false)}
          item={{
            id: transfer.id,
            name: transfer.name,
            type: "transfer",
            originalPrice: transfer.pricing.totalPrice,
            currency: transfer.pricing.currency,
            image: transfer.images[0],
            supplier: transfer.supplier.name,
            location: `${transfer.pickupLocation} → ${transfer.dropoffLocation}`,
          }}
          bookingDetails={{
            pickupLocation: transfer.pickupLocation,
            dropoffLocation: transfer.dropoffLocation,
            duration: transfer.duration,
            passengers: transfer.maxPassengers,
          }}
        />
      )}
    </div>
  );
}

export default TransferDetails;
