import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plane,
  ArrowLeft,
  Clock,
  Users,
  Luggage,
  Wifi,
  CoffeeIcon as Coffee,
  Zap,
  Shield,
  CheckCircle,
  MapPin,
  Calendar,
  Info,
  Star,
  TrendingDown,
  CreditCard,
  X,
} from "lucide-react";
import { flightsService, Flight } from "@/services/flightsService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";

interface FlightDetailsProps {
  flightId?: string;
  flight?: Flight;
  onBook?: (flight: Flight) => void;
  onBargain?: (flight: Flight) => void;
}

export default function FlightDetails({
  flightId,
  flight: providedFlight,
  onBook,
  onBargain,
}: FlightDetailsProps) {
  const params = useParams();
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();
  const [flight, setFlight] = useState<Flight | null>(providedFlight || null);
  const [isLoading, setIsLoading] = useState(!providedFlight);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showBargainModal, setShowBargainModal] = useState(false);
  const [bargainPrice, setBargainPrice] = useState("");

  const finalFlightId = flightId || params.flightId;

  useEffect(() => {
    if (!providedFlight && finalFlightId) {
      loadFlightDetails();
    }
  }, [finalFlightId, providedFlight]);

  const loadFlightDetails = async () => {
    if (!finalFlightId) return;

    try {
      setIsLoading(true);
      setError(null);
      const flightDetails =
        await flightsService.getFlightDetails(finalFlightId);
      setFlight(flightDetails);
    } catch (err) {
      console.error("Failed to load flight details:", err);
      setError("Failed to load flight details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatPrice = (amount: number) => {
    return `${selectedCurrency.symbol}${amount.toLocaleString("en-IN")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Plane className="w-8 h-8 mx-auto text-blue-600 animate-bounce" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Loading Flight Details
            </h3>
            <p className="text-gray-600">
              Please wait while we fetch the details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Info className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Flight Not Found
            </h3>
            <p className="text-gray-600">
              {error || "The requested flight could not be found."}
            </p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                className="min-h-[44px] px-3 py-2 font-semibold text-sm flex items-center gap-2"
                onClick={() => navigate("/flights")}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Results</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Flight Details
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">{flight.flightNumber}</p>
              </div>
            </div>
            <div className="flex items-center justify-end sm:space-x-3">
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatPrice(flight.price.amount)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium">per person</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Overview Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={`https://pics.avs.io/120/120/${flight.airlineCode || "XX"}.png`}
                      alt={flight.airline}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/48x48/E5E7EB/6B7280?text=���";
                      }}
                    />
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {flight.airline}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {flight.flightNumber} • {flight.aircraft}
                      </p>
                    </div>
                  </div>
                  <Badge variant={flight.stops === 0 ? "default" : "secondary"}>
                    {flight.stops === 0
                      ? "Direct"
                      : `${flight.stops} Stop${flight.stops > 1 ? "s" : ""}`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Departure */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {flight.departureTime}
                    </div>
                    <div className="text-lg font-semibold text-gray-700 mb-1">
                      {flight.departure.code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {flight.departure.city}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {flight.departure.name}
                    </div>
                    {flight.departure.terminal && (
                      <div className="text-xs text-blue-600 mt-1">
                        Terminal {flight.departure.terminal}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-full">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-dashed border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <div className="bg-white px-4">
                          <Plane className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-700 mt-2">
                      {flight.duration}
                    </div>
                    <div className="text-xs text-gray-500">Flight time</div>
                  </div>

                  {/* Arrival */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {flight.arrivalTime}
                    </div>
                    <div className="text-lg font-semibold text-gray-700 mb-1">
                      {flight.arrival.code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {flight.arrival.city}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {flight.arrival.name}
                    </div>
                    {flight.arrival.terminal && (
                      <div className="text-xs text-blue-600 mt-1">
                        Terminal {flight.arrival.terminal}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Information Tabs */}
            <Card>
              <CardContent className="p-0">
                <Tabs
                  value={selectedTab}
                  onValueChange={setSelectedTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                    <TabsTrigger value="policies">Policies</TabsTrigger>
                  </TabsList>

                  <div className="p-6">
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Flight Information
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Aircraft:</span>
                              <span className="font-medium">
                                {flight.aircraft}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Class:</span>
                              <span className="font-medium">
                                {flight.fareClass || "Economy"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Distance:</span>
                              <span className="font-medium">~2,200 km</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Baggage Allowance
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cabin bag:</span>
                              <span className="font-medium">
                                {flight.baggage?.carryOn?.weight || "7kg"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Check-in:</span>
                              <span className="font-medium">
                                {flight.baggage?.checked?.weight || "20kg"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dimensions:</span>
                              <span className="font-medium">
                                {flight.baggage?.carryOn?.dimensions ||
                                  "55x40x20cm"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="itinerary" className="space-y-4">
                      <h4 className="font-semibold text-gray-900 mb-4">
                        Detailed Itinerary
                      </h4>
                      {flight.segments?.map((segment, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-600">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {segment.airline}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {segment.flightNumber}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {segment.duration}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-600">
                                Departure
                              </div>
                              <div className="font-semibold">
                                {segment.departure.time} •{" "}
                                {segment.departure.code}
                              </div>
                              {segment.departure.terminal && (
                                <div className="text-sm text-gray-600">
                                  Terminal {segment.departure.terminal}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">
                                Arrival
                              </div>
                              <div className="font-semibold">
                                {segment.arrival.time} • {segment.arrival.code}
                              </div>
                              {segment.arrival.terminal && (
                                <div className="text-sm text-gray-600">
                                  Terminal {segment.arrival.terminal}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-gray-500">
                          <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>
                            Detailed itinerary information will be available
                            after booking
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="amenities" className="space-y-4">
                      <h4 className="font-semibold text-gray-900 mb-4">
                        In-Flight Amenities
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {flight.amenities?.map((amenity, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{amenity}</span>
                          </div>
                        )) || (
                          <div className="col-span-full text-center py-8 text-gray-500">
                            <Coffee className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>
                              Amenity information will be available during
                              booking
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="policies" className="space-y-4">
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Cancellation Policy
                          </h4>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-amber-800">
                              This fare is non-refundable. Changes may be
                              permitted with fees. Please review complete terms
                              and conditions before booking.
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Check-in Requirements
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <span>
                                Online check-in opens 24 hours before departure
                              </span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <span>
                                Arrive at airport at least 2 hours before
                                international flights
                              </span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <span>
                                Valid passport required for international travel
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Price Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Price Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base fare:</span>
                      <span>
                        {formatPrice(flight.price.breakdown.baseFare)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes & fees:</span>
                      <span>
                        {formatPrice(
                          flight.price.breakdown.taxes +
                            flight.price.breakdown.fees,
                        )}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span className="text-blue-600">
                          {formatPrice(flight.price.breakdown.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Button
                      className="w-full min-h-[44px] px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
                      onClick={() => {
                        if (onBook) {
                          onBook(flight);
                        } else {
                          // Navigate to booking flow with flight data
                          navigate("/booking-flow", {
                            state: {
                              selectedFlight: flight,
                              selectedFareType: {
                                id: "default",
                                name: flight.fareClass || "Economy",
                                price: flight.price.amount,
                                refundability: "Non-Refundable",
                              },
                              negotiatedPrice: flight.price.amount,
                              passengers: { adults: 1, children: 0 },
                            },
                          });
                        }
                      }}
                    >
                      <CreditCard className="w-4 h-4" />
                      Book Now
                    </Button>

                    <Button
                      className="w-full min-h-[44px] px-6 py-3 bg-[#febb02] hover:bg-[#e6a602] text-black font-semibold text-sm flex items-center justify-center gap-2"
                      onClick={() => {
                        if (onBargain) {
                          onBargain(flight);
                        } else {
                          setShowBargainModal(true);
                        }
                      }}
                    >
                      <TrendingDown className="w-4 h-4" />
                      Bargain Now
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    Prices include all taxes and fees
                  </div>
                </CardContent>
              </Card>

              {/* Flight Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Why Book This Flight?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">High customer rating</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-sm">On-time performance</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Flexible booking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Luggage className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">
                        Generous baggage allowance
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Bargain Modal */}
      {showBargainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Bargain for Better Price
              </h3>
              <button
                onClick={() => setShowBargainModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Current price: <span className="font-semibold">{formatPrice(flight.price.amount)}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your desired price and we'll try to negotiate with the airline:
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={bargainPrice}
                    onChange={(e) => setBargainPrice(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    {selectedCurrency.code}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBargainModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Here you would implement the actual bargain logic
                    alert(`Bargain request submitted for ${selectedCurrency.symbol}${bargainPrice}`);
                    setShowBargainModal(false);
                    setBargainPrice("");
                  }}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={!bargainPrice || parseInt(bargainPrice) >= flight.price.amount}
                >
                  Submit Bargain
                </Button>
              </div>

              {bargainPrice && parseInt(bargainPrice) >= flight.price.amount && (
                <p className="text-sm text-red-600 text-center">
                  Bargain price must be lower than current price
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}
