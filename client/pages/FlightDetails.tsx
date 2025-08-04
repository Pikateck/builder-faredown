import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


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
  Luggage,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { flightsService, Flight } from "@/services/flightsService";
import { useCurrency } from "@/contexts/CurrencyContext";

import { useScrollToTop } from "@/hooks/useScrollToTop";


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

  // Fallback flight data if none provided
  const fallbackFlight = {
    id: "fallback",
    flightNumber: "6E 1407",
    airline: "IndiGo",
    airlineCode: "6E",
    departure: {
      code: "BOM",
      city: "Mumbai",
      name: "Chhatrapati Shivaji International Airport",
      terminal: "2"
    },
    arrival: {
      code: "DXB",
      city: "Dubai",
      name: "Dubai International Airport",
      terminal: "2"
    },
    departureTime: "14:30",
    arrivalTime: "16:00",
    duration: "3h 30m",
    stops: 0,
    aircraft: "Airbus A320",
    fareClass: "Economy",
    price: {
      amount: 22650,
      breakdown: {
        baseFare: 18120,
        taxes: 3030,
        fees: 1500,
        total: 22650
      }
    }
  };

  // Use fallback data if no flight is available
  const displayFlight = flight || fallbackFlight;

  if (error) {
    console.error("Flight Details Error:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Info className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Error Loading Flight
            </h3>
            <p className="text-gray-600">
              {error}
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
                    text: `${displayFlight.airline} flight from ${displayFlight.departure.city} to ${displayFlight.arrival.city}`,
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
            <h2 className="text-xl font-bold text-gray-900 mb-1">Flight to Dubai</h2>
            <p className="text-gray-600 text-sm mb-6">Direct • 3h • Economy</p>

            {/* Outbound Flight Timeline */}
            <div className="relative mb-8">
              {/* Departure */}
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-3 h-3 border-2 border-gray-900 rounded-full bg-white mt-2"></div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-900 mb-1">Sat, Sep 6 • {displayFlight.departureTime}</div>
                  <div className="font-bold text-gray-900 text-lg mb-1">{displayFlight.departure.code} • {displayFlight.departure.name}</div>

                  {/* Airline Info */}
                  <div className="flex items-center space-x-3 mt-4 mb-4">
                    <img
                      src={`https://pics.avs.io/120/120/${displayFlight.airlineCode}.png`}
                      alt={displayFlight.airline}
                      className="w-8 h-8 object-contain"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{displayFlight.airline}</div>
                      <div className="text-sm text-gray-600">Flight {displayFlight.flightNumber}</div>
                      <div className="text-sm text-gray-600">Flight time {displayFlight.duration}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="absolute left-[5px] top-8 w-0.5 bg-gray-300 h-16"></div>

              {/* Arrival */}
              <div className="flex items-start space-x-4 mb-8">
                <div className="w-3 h-3 border-2 border-gray-900 rounded-full bg-white mt-2"></div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-900 mb-1">Sat, Sep 6 • 09:40</div>
                  <div className="font-bold text-gray-900 text-lg">DXB • Dubai International Airport</div>
                </div>
              </div>
            </div>

            {/* Flight to Mumbai */}
            <h2 className="text-xl font-bold text-gray-900 mb-1 mt-8">Flight to Mumbai</h2>
            <p className="text-gray-600 text-sm mb-6">Direct • 3h 15m • Economy</p>

            {/* Return Flight Timeline */}
            <div className="relative mb-8">
              {/* Departure */}
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-3 h-3 border-2 border-gray-900 rounded-full bg-white mt-2"></div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-900 mb-1">Sat, Sep 13 • 20:50</div>
                  <div className="font-bold text-gray-900 text-lg mb-1">DXB • Dubai International Airport</div>

                  {/* Airline Info */}
                  <div className="flex items-center space-x-3 mt-4 mb-4">
                    <img
                      src={`https://pics.avs.io/120/120/6E.png`}
                      alt="IndiGo"
                      className="w-8 h-8 object-contain"
                    />
                    <div>
                      <div className="font-medium text-gray-900">IndiGo</div>
                      <div className="text-sm text-gray-600">Flight 6E1456</div>
                      <div className="text-sm text-gray-600">Flight time 3h 15m</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="absolute left-[5px] top-8 w-0.5 bg-gray-300 h-16"></div>

              {/* Arrival */}
              <div className="flex items-start space-x-4 mb-8">
                <div className="w-3 h-3 border-2 border-gray-900 rounded-full bg-white mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg font-semibold text-gray-900">Sun, Sep 14 • 01:35</span>
                    <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                      <Info className="w-3 h-3 text-gray-600" />
                      <span className="text-xs text-gray-600">Arrive on a different day</span>
                    </div>
                  </div>
                  <div className="font-bold text-gray-900 text-lg">BOM • Chhatrapati Shivaji International Airport Mumbai</div>
                </div>
              </div>
            </div>

            {/* Included Baggage */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Included baggage</h3>
              <p className="text-gray-600 text-sm mb-6">Total baggage allowance for each flight</p>

              <div className="space-y-6">
                {/* Personal Item */}
                <div className="flex items-start space-x-3">
                  <ShoppingBag className="w-6 h-6 text-gray-700 mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">1 personal item</div>
                    <div className="text-gray-600 mb-2">Fits under the seat in front of you</div>
                    <div className="text-green-600 font-medium">Included</div>
                  </div>
                </div>

                {/* Carry-on */}
                <div className="flex items-start space-x-3">
                  <Luggage className="w-6 h-6 text-gray-700 mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">1 carry-on bag</div>
                    <div className="text-gray-600 mb-2">Up to 7 kg • 25 x 35 x 55 cm</div>
                    <div className="text-green-600 font-medium">Included</div>
                  </div>
                </div>

                {/* Checked Bag */}
                <div className="flex items-start space-x-3">
                  <Luggage className="w-6 h-6 text-gray-700 mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">1 checked bag</div>
                    <div className="text-gray-600 mb-2">Up to 15 kg</div>
                    <div className="text-green-600 font-medium">Included</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Footer with Book Now and Bargain Now */}
          <div className="border-t bg-white p-4 fixed bottom-0 left-0 right-0 z-40">
            <div className="max-w-md mx-auto">
              {/* Price Display */}
              <div className="flex items-center justify-center space-x-2 mb-3">
                <span className="text-2xl font-bold text-gray-900">₹ 24,216</span>
                <div className="relative group">
                  <Info className="w-4 h-4 text-gray-500 cursor-help" />
                  {/* Price Breakdown Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-white text-gray-800 text-sm rounded-xl p-4 shadow-xl border border-gray-100 min-w-[220px] backdrop-blur-sm">
                      <div className="text-center font-semibold mb-3 text-gray-900 border-b border-gray-100 pb-2">
                        Fare Breakdown
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Base fare:</span>
                          <span className="font-medium text-gray-900">₹ 18,120</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Taxes & fees:</span>
                          <span className="font-medium text-gray-900">₹ 6,096</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex justify-between items-center font-semibold">
                            <span className="text-gray-900">Total:</span>
                            <span className="text-blue-600">₹ 24,216</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-3">
                        All taxes and fees included
                      </p>
                      {/* Tooltip arrow pointing downward */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">per person</span>
              </div>

              {/* Action Buttons */}
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
                      // For now, show an alert - you can implement bargain modal later
                      alert('Bargain functionality coming soon!');
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
      </div>




    </div>
  );
}
