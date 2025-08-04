import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Plane,
  ArrowLeft,
  Users,
  Wifi,
  CoffeeIcon as Coffee,
  Zap,
  CheckCircle,
  MapPin,
  Calendar,
  Info,
  TrendingDown,
  CreditCard,
  X,
  Share2,
  Heart,
  Suitcase,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { flightsService, Flight } from "@/services/flightsService";
import { useCurrency } from "@/contexts/CurrencyContext";

import { useScrollToTop } from "@/hooks/useScrollToTop";
import { FlightStyleBargainModal } from "@/components/FlightStyleBargainModal";

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
  useScrollToTop();
  const params = useParams();
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();
  const [flight, setFlight] = useState<Flight | null>(providedFlight || null);
  const [isLoading, setIsLoading] = useState(!providedFlight);
  const [error, setError] = useState<string | null>(null);
  const [showBargainModal, setShowBargainModal] = useState(false);

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
      {/* Booking.com Style Header */}
      <div className="bg-[#003580] text-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 p-2"
              onClick={() => navigate("/flights")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                Your flight to Dubai
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 p-2"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Flight Details',
                    text: `${flight.airline} flight from ${flight.departure.city} to ${flight.arrival.city}`,
                    url: window.location.href
                  });
                }
              }}
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 p-2"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen pb-20">
        <div className="max-w-md mx-auto bg-white">
          {/* Flight to Dubai */}
          <div className="p-4">
            {/* Round-Trip Flight Cards */}
            <div className="space-y-4">
              {/* Outbound Flight */}
              <div>
                {/* Header */}
                <div className="flex items-center mb-4">
                  <Plane className="w-4 h-4 mr-2 text-gray-700" />
                  <h4 className="text-base font-semibold text-gray-900">
                    Outbound • Mon, Aug 5
                  </h4>
                </div>

                {/* Flight Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Airline Info Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={`https://pics.avs.io/120/120/${flight.airlineCode || "XX"}.png`}
                        alt={flight.airline}
                        className="w-8 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/32x24/E5E7EB/6B7280?text=✈";
                        }}
                      />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {flight.airline}
                        </div>
                        <div className="text-xs text-gray-600">
                          {flight.flightNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flight Timeline */}
                  <div className="flex items-center justify-between mb-4">
                    {/* Departure */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        14:30
                      </div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        BOM
                      </div>
                      <div className="text-xs text-gray-500">
                        Mumbai
                      </div>
                    </div>

                    {/* Connection Line */}
                    <div className="flex-1 flex items-center mx-6">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      <div className="flex-1 h-0.5 bg-gray-300 mx-2 relative">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="bg-white px-2">
                            <div className="flex flex-col items-center">
                              <div className="text-xs text-gray-500 mb-1">
                                3h 30m
                              </div>
                              <div className="w-2 h-2 bg-[#003580] rounded-full"></div>
                              <div className="text-xs text-green-600 mt-1">
                                Direct
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    </div>

                    {/* Arrival */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        16:00
                      </div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        DXB
                      </div>
                      <div className="text-xs text-gray-500">
                        Dubai
                      </div>
                    </div>
                  </div>

                  {/* Flight Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-gray-500 mb-1">Aircraft</p>
                      <p className="font-medium text-gray-900">Airbus A320</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Class</p>
                      <p className="font-medium text-gray-900">ECONOMY</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Flight time</p>
                      <p className="font-medium text-gray-900">3h 30m</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Operated by</p>
                      <p className="font-medium text-gray-900">IndiGo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Flight */}
              <div>
                {/* Header */}
                <div className="flex items-center mb-4">
                  <Plane className="w-4 h-4 mr-2 text-gray-700 rotate-180" />
                  <h4 className="text-base font-semibold text-gray-900">
                    Return • Thu, Aug 8
                  </h4>
                </div>

                {/* Flight Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Airline Info Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={`https://pics.avs.io/120/120/${flight.airlineCode || "XX"}.png`}
                        alt={flight.airline}
                        className="w-8 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/32x24/E5E7EB/6B7280?text=✈";
                        }}
                      />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {flight.airline}
                        </div>
                        <div className="text-xs text-gray-600">
                          6E 1408
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flight Timeline */}
                  <div className="flex items-center justify-between mb-4">
                    {/* Departure */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        18:45
                      </div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        DXB
                      </div>
                      <div className="text-xs text-gray-500">
                        Dubai
                      </div>
                    </div>

                    {/* Connection Line */}
                    <div className="flex-1 flex items-center mx-6">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      <div className="flex-1 h-0.5 bg-gray-300 mx-2 relative">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="bg-white px-2">
                            <div className="flex flex-col items-center">
                              <div className="text-xs text-gray-500 mb-1">
                                4h 30m
                              </div>
                              <div className="w-2 h-2 bg-[#003580] rounded-full"></div>
                              <div className="text-xs text-green-600 mt-1">
                                Direct
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    </div>

                    {/* Arrival */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        23:15
                      </div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        BOM
                      </div>
                      <div className="text-xs text-gray-500">
                        Mumbai
                      </div>
                    </div>
                  </div>

                  {/* Flight Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-gray-500 mb-1">Aircraft</p>
                      <p className="font-medium text-gray-900">Airbus A320</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Class</p>
                      <p className="font-medium text-gray-900">ECONOMY</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Flight time</p>
                      <p className="font-medium text-gray-900">4h 30m</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Operated by</p>
                      <p className="font-medium text-gray-900">IndiGo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* In-Flight Amenities */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  In-Flight Amenities
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {flight.amenities?.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-xs">{amenity}</span>
                    </div>
                  )) || (
                    <div className="col-span-full text-center py-6 text-gray-500">
                      <Coffee className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">
                        Amenity information will be available during
                        booking
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Policies */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                      Cancellation Policy
                    </h4>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800">
                        This fare is non-refundable. Changes may be
                        permitted with fees. Please review complete terms
                        and conditions before booking.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                      Check-in Requirements
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        <span>
                          Online check-in opens 24 hours before departure
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        <span>
                          Arrive at airport at least 2 hours before
                          international flights
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        <span>
                          Valid passport required for international travel
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Price Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-gray-900">Price Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base fare:</span>
                      <span>
                        {formatPrice(flight.price.breakdown.baseFare)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxes & fees:</span>
                      <span>
                        {formatPrice(
                          flight.price.breakdown.taxes +
                            flight.price.breakdown.fees,
                        )}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span className="text-blue-600">
                          {formatPrice(flight.price.breakdown.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    Prices include all taxes and fees
                  </div>
                </CardContent>
              </Card>


            </div>
          </div>
        </div>
      </div>

      {/* FlightStyleBargainModal */}
      <FlightStyleBargainModal
        roomType={{
          id: "flight-" + flight.flightNumber,
          name: `${flight.departure.code} → ${flight.arrival.code}`,
          description: `${flight.airline} Flight ${flight.flightNumber}`,
          image: "",
          marketPrice: flight.price.amount,
          totalPrice: flight.price.amount,
          features: [
            flight.fareClass || "Economy",
            flight.stops === 0 ? "Direct" : `${flight.stops} Stop${flight.stops > 1 ? "s" : ""}`,
            flight.duration,
            flight.aircraft
          ],
          maxOccupancy: 1,
          bedType: "Flight Seat",
          size: flight.fareClass || "Economy",
          cancellation: "Terms apply"
        }}
        hotel={{
          id: parseInt(flight.flightNumber?.replace(/[^0-9]/g, "") || "1"),
          name: flight.airline,
          location: `${flight.departure.city} to ${flight.arrival.city}`,
          checkIn: flight.departureDate || new Date().toISOString().split('T')[0],
          checkOut: flight.arrivalDate || new Date().toISOString().split('T')[0]
        }}
        isOpen={showBargainModal}
        onClose={() => setShowBargainModal(false)}
        checkInDate={new Date(flight.departureDate || new Date())}
        checkOutDate={new Date(flight.arrivalDate || new Date())}
        roomsCount={1}
        onBookingSuccess={(finalPrice) => {
          // Navigate to booking flow with bargained price
          navigate("/booking-flow", {
            state: {
              selectedFlight: { ...flight, price: { ...flight.price, amount: finalPrice } },
              selectedFareType: {
                id: "bargained",
                name: flight.fareClass || "Economy",
                price: finalPrice,
                refundability: "Non-Refundable",
              },
              negotiatedPrice: finalPrice,
              passengers: { adults: 1, children: 0 },
              isBargained: true,
            },
          });
        }}
      />

      {/* Fixed Footer with Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="min-h-[48px] px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
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
              className="min-h-[48px] px-6 py-3 bg-[#febb02] hover:bg-[#e6a602] text-black font-semibold text-sm flex items-center justify-center gap-2"
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
        </div>
      </div>


    </div>
  );
}
