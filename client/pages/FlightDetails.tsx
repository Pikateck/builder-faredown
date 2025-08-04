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
  Suitcase,
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
            <h2 className="text-xl font-bold text-gray-900 mb-1">Flight to Dubai</h2>
            <p className="text-gray-600 text-sm mb-6">Direct • 3h • Economy</p>

            {/* Outbound Flight Timeline */}
            <div className="relative mb-8">
              {/* Departure */}
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-3 h-3 border-2 border-gray-900 rounded-full bg-white mt-2"></div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-900 mb-1">Sat, Sep 6 • 08:10</div>
                  <div className="font-bold text-gray-900 text-lg mb-1">BOM • Chhatrapati Shivaji International Airport Mumbai</div>

                  {/* Airline Info */}
                  <div className="flex items-center space-x-3 mt-4 mb-4">
                    <img
                      src={`https://pics.avs.io/120/120/6E.png`}
                      alt="IndiGo"
                      className="w-8 h-8 object-contain"
                    />
                    <div>
                      <div className="font-medium text-gray-900">IndiGo</div>
                      <div className="text-sm text-gray-600">Flight 6E1451</div>
                      <div className="text-sm text-gray-600">Flight time 3h</div>
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
                  <Suitcase className="w-6 h-6 text-gray-700 mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">1 carry-on bag</div>
                    <div className="text-gray-600 mb-2">Up to 7 kg • 25 x 35 x 55 cm</div>
                    <div className="text-green-600 font-medium">Included</div>
                  </div>
                </div>

                {/* Checked Bag */}
                <div className="flex items-start space-x-3">
                  <Suitcase className="w-6 h-6 text-gray-700 mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">1 checked bag</div>
                    <div className="text-gray-600 mb-2">Up to 15 kg</div>
                    <div className="text-green-600 font-medium">Included</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Footer */}
          <div className="border-t bg-white p-4 fixed bottom-0 left-0 right-0 z-40">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">₹ 24,216</span>
                  <Info className="w-4 h-4 text-gray-500" />
                </div>
                <div className="text-sm text-gray-600">1 traveler</div>
              </div>
              <Button className="bg-[#0071c2] hover:bg-[#005bb5] text-white px-8 py-3 text-lg font-semibold rounded">
                Select
              </Button>
            </div>
          </div>
        </div>
      </div>




    </div>
  );
}
