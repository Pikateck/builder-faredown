import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDateContext } from "@/contexts/DateContext";
import { useBooking } from "@/contexts/BookingContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { BargainButton } from "@/components/ui/BargainButton";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  ChevronLeft,
  ArrowRight,
  MapPin,
  Shield,
  Clock,
  Wifi,
  Star,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";

// Simplified flight data for testing
const sampleFlights = [
  {
    id: "1",
    airline: "Emirates",
    airlineCode: "EK",
    flightNumber: "EK 500",
    departureTime: "10:15",
    arrivalTime: "11:45",
    duration: "3h 30m",
    aircraft: "Boeing 777-300ER",
    stops: 0,
    price: { amount: 32168, currency: "INR" },
    departure: { code: "BOM", city: "Mumbai" },
    arrival: { code: "DXB", city: "Dubai" },
    fareTypes: [
      {
        id: "eco-saver",
        name: "Eco Saver",
        price: 32168,
        features: ["Carry-on included"],
        baggage: "23kg",
        refundability: "Non-Refundable",
      }
    ]
  },
  {
    id: "2",
    airline: "Air India",
    airlineCode: "AI",
    flightNumber: "AI 131",
    departureTime: "14:20",
    arrivalTime: "16:05",
    duration: "3h 45m",
    aircraft: "Airbus A350-900",
    stops: 0,
    price: { amount: 28450, currency: "INR" },
    departure: { code: "BOM", city: "Mumbai" },
    arrival: { code: "DXB", city: "Dubai" },
    fareTypes: [
      {
        id: "economy",
        name: "Economy",
        price: 28450,
        features: ["Carry-on included"],
        baggage: "20kg",
        refundability: "Non-Refundable",
      }
    ]
  }
];

export default function FlightResults() {
  useScrollToTop();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, user } = useAuth();
  const { departureDate, returnDate, tripType } = useDateContext();
  const { updateSearchParams, setSelectedFlight, setSelectedFare } = useBooking();

  // States
  const [flights, setFlights] = useState(sampleFlights);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"cheapest" | "fastest">("cheapest");
  const [expandedTicketOptions, setExpandedTicketOptions] = useState<number | null>(null);

  // Get search parameters
  const from = searchParams.get("from") || "Mumbai";
  const to = searchParams.get("to") || "Dubai";
  const fromCode = searchParams.get("fromCode") || "BOM";
  const toCode = searchParams.get("toCode") || "DXB";
  const adults = parseInt(searchParams.get("adults") || "1");
  const children = parseInt(searchParams.get("children") || "0");

  // Load flights (simplified)
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    const timer = setTimeout(() => {
      setFlights(sampleFlights);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  // Format price
  const formatPrice = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  // Handle booking
  const handleBooking = (flight: any, fareType: any) => {
    // Update booking context
    updateSearchParams({
      from,
      to,
      fromCode,
      toCode,
      departureDate: departureDate?.toISOString().split('T')[0] || "",
      returnDate: returnDate?.toISOString().split('T')[0],
      tripType: tripType as any,
      passengers: { adults, children, infants: 0 },
      class: "economy" as any,
    });

    setSelectedFlight({
      id: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      aircraft: flight.aircraft,
      stops: flight.stops,
      departureCode: flight.departure.code,
      arrivalCode: flight.arrival.code,
      departureCity: flight.departure.city,
      arrivalCity: flight.arrival.city,
      departureDate: departureDate?.toISOString().split('T')[0] || "",
      arrivalDate: departureDate?.toISOString().split('T')[0] || "",
    });

    setSelectedFare({
      id: fareType.id,
      name: fareType.name,
      type: "economy",
      price: fareType.price,
      isRefundable: fareType.refundability === "Refundable",
      isBargained: false,
      includedBaggage: fareType.baggage,
      includedMeals: false,
      seatSelection: false,
      changes: { allowed: false },
      cancellation: { allowed: false },
    });

    navigate("/booking-flow");
  };

  // Sort flights
  const sortedFlights = [...flights].sort((a, b) => {
    if (sortBy === "cheapest") {
      return a.price.amount - b.price.amount;
    } else {
      const aDuration = parseInt(a.duration.split('h')[0]) * 60 + parseInt(a.duration.split(' ')[1].split('m')[0]);
      const bDuration = parseInt(b.duration.split('h')[0]) * 60 + parseInt(b.duration.split(' ')[1].split('m')[0]);
      return aDuration - bDuration;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for flights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <Header />

      {/* Mobile Header */}
      <div className="block md:hidden bg-[#003580] text-white">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="font-semibold text-lg">Flight Results</h1>
              <p className="text-blue-200 text-xs">
                {fromCode} → {toCode} • {tripType} • {adults} adult{adults > 1 ? "s" : ""}
              </p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Search Summary */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{from} → {to}</span>
              </div>
              <div className="text-gray-500">
                {departureDate?.toLocaleDateString()}
              </div>
              <div className="text-gray-500">
                {adults} passenger{adults > 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={sortBy === "cheapest" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("cheapest")}
              >
                Cheapest
              </Button>
              <Button
                variant={sortBy === "fastest" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("fastest")}
              >
                Fastest
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {sortedFlights.map((flight, index) => (
            <div key={flight.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Flight Info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plane className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{flight.airline}</div>
                      <div className="text-sm text-gray-500">{flight.flightNumber}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl">{formatPrice(flight.price.amount)}</div>
                    <div className="text-sm text-gray-500">per person</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <div className="font-semibold text-lg">{flight.departureTime}</div>
                      <div className="text-sm text-gray-500">{flight.departure.code}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-px bg-gray-300 w-16"></div>
                      <div className="text-xs text-gray-500">
                        {flight.duration}
                        {flight.stops === 0 && (
                          <div className="text-green-600">Direct</div>
                        )}
                      </div>
                      <div className="h-px bg-gray-300 w-16"></div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">{flight.arrivalTime}</div>
                      <div className="text-sm text-gray-500">{flight.arrival.code}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      {flight.duration}
                    </Badge>
                    <Badge variant="secondary">
                      <Shield className="w-3 h-3 mr-1" />
                      {flight.aircraft}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Fare Options */}
              <div className="border-t border-gray-200">
                {flight.fareTypes.map((fareType) => (
                  <div key={fareType.id} className="p-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-medium">{fareType.name}</div>
                            <div className="text-sm text-gray-500">
                              {fareType.features.join(" • ")}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatPrice(fareType.price)}</div>
                          <div className="text-xs text-gray-500">{fareType.refundability}</div>
                        </div>
                        <div className="flex space-x-2">
                          <BargainButton
                            flightData={{
                              id: flight.id,
                              airline: flight.airline,
                              flightNumber: flight.flightNumber,
                              route: `${flight.departure.code}-${flight.arrival.code}`,
                              price: fareType.price,
                              passengers: adults,
                            }}
                            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                          />
                          <Button
                            onClick={() => handleBooking(flight, fareType)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {sortedFlights.length === 0 && (
          <div className="text-center py-12">
            <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No flights found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
            <Button
              onClick={() => navigate("/")}
              className="mt-4"
            >
              Modify Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
