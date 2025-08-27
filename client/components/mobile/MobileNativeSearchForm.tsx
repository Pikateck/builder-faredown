import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Calendar,
  Users,
  Search,
  MapPin,
  Hotel,
  Camera,
  Car,
  Clock,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { MobileFullScreenCityInput } from "./MobileFullScreenCityInput";
import { MobileFullScreenDateInput } from "./MobileFullScreenDateInput";
import { MobileFullScreenTravelersInput } from "./MobileFullScreenTravelersInput";
import { MobileFullScreenTimeInput } from "./MobileFullScreenTimeInput";
import { MobileFullScreenTransferTypeInput } from "./MobileFullScreenTransferTypeInput";
import { MobileFullScreenMultiCityInput } from "./MobileFullScreenMultiCityInput";

interface Travelers {
  adults: number;
  children: number;
  infants?: number;
  rooms?: number;
}

interface DateRange {
  startDate: Date;
  endDate?: Date;
}

interface FlightLeg {
  id: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  date: Date;
}

interface MobileNativeSearchFormProps {
  module: "flights" | "hotels" | "sightseeing" | "transfers";
  transferType?: "airport-taxi" | "car-rentals";
}

// City data - expanded for all modules
const cityData = {
  Mumbai: {
    code: "BOM",
    city: "Mumbai",
    country: "India",
    airport: "Chhatrapati Shivaji Intl",
  },
  Delhi: {
    code: "DEL",
    city: "New Delhi",
    country: "India",
    airport: "Indira Gandhi Intl",
  },
  Dubai: {
    code: "DXB",
    city: "Dubai",
    country: "UAE",
    airport: "Dubai International",
  },
  London: {
    code: "LHR",
    city: "London",
    country: "UK",
    airport: "Heathrow",
  },
  Singapore: {
    code: "SIN",
    city: "Singapore",
    country: "Singapore",
    airport: "Changi",
  },
  Paris: {
    code: "CDG",
    city: "Paris",
    country: "France",
    airport: "Charles de Gaulle",
  },
  Bangkok: {
    code: "BKK",
    city: "Bangkok",
    country: "Thailand",
    airport: "Suvarnabhumi",
  },
  Tokyo: {
    code: "NRT",
    city: "Tokyo",
    country: "Japan",
    airport: "Narita Intl",
  },
};

export function MobileNativeSearchForm({
  module,
  transferType: initialTransferType,
}: MobileNativeSearchFormProps) {
  const navigate = useNavigate();

  // Form states
  const [tripType, setTripType] = useState<
    "round-trip" | "one-way" | "multi-city"
  >(
    module === "hotels" || module === "sightseeing"
      ? "one-way"
      : module === "transfers"
        ? "one-way"
        : "round-trip",
  );

  // Transfers specific state
  const [transferType, setTransferType] = useState<
    "airport-taxi" | "car-rentals"
  >(initialTransferType || "airport-taxi");
  const [transferTripType, setTransferTripType] = useState<
    "one-way" | "return"
  >("one-way");

  // Location states
  const [fromCity, setFromCity] = useState("Mumbai");
  const [fromCode, setFromCode] = useState("BOM");
  const [toCity, setToCity] = useState("Dubai");
  const [toCode, setToCode] = useState("DXB");

  // Date states
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: addDays(new Date(), 1),
    endDate: addDays(new Date(), 8),
  });

  // Time states (for transfers)
  const [pickupTime, setPickupTime] = useState("12:00");
  const [returnTime, setReturnTime] = useState("12:00");

  // Multi-city states (for flights)
  const [multiCityLegs, setMultiCityLegs] = useState<FlightLeg[]>([]);

  // Travelers state
  const [travelers, setTravelers] = useState<Travelers>({
    adults: 1,
    children: 0,
    infants: 0,
    rooms: 1,
  });

  // UI states for full-screen inputs
  const [showFromInput, setShowFromInput] = useState(false);
  const [showToInput, setShowToInput] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);
  const [showTravelersInput, setShowTravelersInput] = useState(false);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [showTransferTypeInput, setShowTransferTypeInput] = useState(false);
  const [showMultiCityInput, setShowMultiCityInput] = useState(false);

  // Validation states
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle city selection
  const handleFromCitySelect = (city: string, code: string) => {
    setFromCity(city);
    setFromCode(code);
  };

  const handleToCitySelect = (city: string, code: string) => {
    setToCity(city);
    setToCode(code);
  };

  // Handle date selection
  const handleDateSelect = (range: DateRange) => {
    setDateRange(range);
  };

  // Handle travelers selection
  const handleTravelersSelect = (newTravelers: Travelers) => {
    setTravelers(newTravelers);
  };

  // Handle time selection
  const handleTimeSelect = (time: string, type: "pickup" | "return") => {
    if (type === "pickup") {
      setPickupTime(time);
    } else {
      setReturnTime(time);
    }
  };

  // Handle transfer type selection
  const handleTransferTypeSelect = (
    type: "airport-taxi" | "car-rentals",
    tripType: "one-way" | "return",
  ) => {
    setTransferType(type);
    setTransferTripType(tripType);
  };

  // Handle multi-city selection
  const handleMultiCitySelect = (legs: FlightLeg[]) => {
    setMultiCityLegs(legs);
  };

  // Format date display
  const formatDateDisplay = () => {
    if (module === "flights" && tripType === "multi-city") {
      if (multiCityLegs.length > 0) {
        const cities = multiCityLegs
          .map((leg) => leg.fromCode)
          .concat(multiCityLegs[multiCityLegs.length - 1].toCode);
        return `${cities.join(" → ")} (${multiCityLegs.length} flights)`;
      }
      return "Add multiple destinations";
    }

    if (!dateRange.startDate) return "Select dates";

    if (module === "hotels") {
      const checkIn = format(dateRange.startDate, "MMM d");
      const checkOut = dateRange.endDate
        ? format(dateRange.endDate, "MMM d")
        : "Check-out";
      return `${checkIn} - ${checkOut}`;
    }

    if (tripType === "one-way" || module === "transfers") {
      return format(dateRange.startDate, "MMM d");
    }

    if (dateRange.endDate) {
      return `${format(dateRange.startDate, "MMM d")} - ${format(dateRange.endDate, "MMM d")}`;
    }

    return format(dateRange.startDate, "MMM d") + " - Return";
  };

  // Format travelers display
  const formatTravelersDisplay = () => {
    const parts = [];

    if (travelers.adults > 0) {
      parts.push(`${travelers.adults} adult${travelers.adults > 1 ? "s" : ""}`);
    }

    if (travelers.children && travelers.children > 0) {
      parts.push(
        `${travelers.children} child${travelers.children > 1 ? "ren" : ""}`,
      );
    }

    if (module === "hotels" && travelers.rooms && travelers.rooms > 0) {
      parts.push(`${travelers.rooms} room${travelers.rooms > 1 ? "s" : ""}`);
    }

    return parts.join(", ") || "1 adult";
  };

  // Get appropriate icon for module
  const getModuleIcon = () => {
    switch (module) {
      case "flights":
        return Plane;
      case "hotels":
        return Hotel;
      case "sightseeing":
        return Camera;
      case "transfers":
        return Car;
      default:
        return Plane;
    }
  };

  // Get field labels based on module
  const getFieldLabels = () => {
    switch (module) {
      case "flights":
        return {
          from: "Leaving from",
          to: "Going to",
          dates:
            tripType === "one-way"
              ? "Departure"
              : tripType === "multi-city"
                ? "Travel dates"
                : "Travel dates",
        };
      case "hotels":
        return {
          from: "Destination",
          to: null, // Hotels don't have "to"
          dates: "Check-in - Check-out",
        };
      case "sightseeing":
        return {
          from: "Destination",
          to: null,
          dates: "Activity date",
        };
      case "transfers":
        return {
          from:
            transferType === "airport-taxi"
              ? "Pickup location"
              : "Pickup location",
          to:
            transferType === "airport-taxi"
              ? "Drop-off location"
              : "Drop-off location",
          dates: "Transfer date",
        };
      default:
        return {
          from: "From",
          to: "To",
          dates: "Dates",
        };
    }
  };

  const fieldLabels = getFieldLabels();
  const ModuleIcon = getModuleIcon();

  // Validation for multi-city searches
  const validateMultiCitySearch = (): { isValid: boolean; error?: string } => {
    if (module !== "flights" || tripType !== "multi-city") {
      return { isValid: true };
    }

    if (multiCityLegs.length < 2) {
      return {
        isValid: false,
        error: "Add at least 2 flight segments for multi-city travel",
      };
    }

    // Check if all legs have valid destinations
    for (let i = 0; i < multiCityLegs.length; i++) {
      const leg = multiCityLegs[i];
      if (!leg.from || !leg.fromCode || !leg.to || !leg.toCode) {
        return {
          isValid: false,
          error: `Complete destinations for Flight ${i + 1}`,
        };
      }
      if (!leg.date) {
        return {
          isValid: false,
          error: `Select date for Flight ${i + 1}`,
        };
      }
    }

    return { isValid: true };
  };

  // Handle search
  const handleSearch = () => {
    // Clear previous validation errors
    setValidationError(null);

    // Validate multi-city before proceeding
    const validation = validateMultiCitySearch();
    if (!validation.isValid) {
      setValidationError(validation.error!);
      return;
    }

    const searchParams = new URLSearchParams({
      from: fromCode,
      to: toCode,
      departureDate: dateRange.startDate.toISOString(),
      adults: travelers.adults.toString(),
      children: (travelers.children || 0).toString(),
      tripType,
    });

    // Add multi-city legs data
    if (module === "flights" && tripType === "multi-city") {
      searchParams.set("multiCityLegs", JSON.stringify(multiCityLegs));
    }

    if (
      dateRange.endDate &&
      (tripType === "round-trip" || module === "hotels")
    ) {
      searchParams.set("returnDate", dateRange.endDate.toISOString());
    }

    if (module === "hotels" && travelers.rooms) {
      searchParams.set("rooms", travelers.rooms.toString());
    }

    if (module === "transfers") {
      searchParams.set("transferType", transferType);
      searchParams.set("transferTripType", transferTripType);
      searchParams.set("pickupTime", pickupTime);
      if (transferTripType === "return") {
        searchParams.set("returnTime", returnTime);
      }
    }

    if (module === "flights" && travelers.infants) {
      searchParams.set("infants", travelers.infants.toString());
    }

    navigate(`/${module}/results?${searchParams.toString()}`);
  };

  return (
    <div>
      {/* Blue Header Section */}
      <div className="py-6 md:py-8" style={{ backgroundColor: "#003580" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Upgrade. Bargain. Book.
            </h2>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight opacity-95">
              {module === "flights" &&
                "Turn your fare into an upgrade with live AI bargaining."}
              {module === "hotels" &&
                "Control your price with AI-powered hotel upgrades."}
              {module === "sightseeing" &&
                "Explore attractions & experiences with AI that bargains for you."}
              {module === "transfers" &&
                "Ride in comfort for less — AI secures your best deal on every trip."}
            </h1>
          </div>
        </div>
      </div>

      {/* Native Mobile Search Panel */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
          {/* Trip Type Selection (for flights only) */}
          {module === "flights" && (
            <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-100">
              <button
                onClick={() => setTripType("round-trip")}
                className={`flex items-center space-x-2 ${
                  tripType === "round-trip" ? "text-[#003580]" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    tripType === "round-trip"
                      ? "bg-[#003580] border-[#003580]"
                      : "border-gray-300"
                  }`}
                ></div>
                <span className="text-sm font-medium">Round trip</span>
              </button>

              <button
                onClick={() => setTripType("one-way")}
                className={`flex items-center space-x-2 ${
                  tripType === "one-way" ? "text-[#003580]" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    tripType === "one-way"
                      ? "bg-[#003580] border-[#003580]"
                      : "border-gray-300"
                  }`}
                ></div>
                <span className="text-sm font-medium">One way</span>
              </button>

              <button
                onClick={() => setTripType("multi-city")}
                className={`flex items-center space-x-2 ${
                  tripType === "multi-city" ? "text-[#003580]" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    tripType === "multi-city"
                      ? "bg-[#003580] border-[#003580]"
                      : "border-gray-300"
                  }`}
                ></div>
                <span className="text-sm font-medium">Multi-city</span>
              </button>
            </div>
          )}

          {/* Transfer Type Selection (for transfers only) */}
          {module === "transfers" && (
            <button
              onClick={() => setShowTransferTypeInput(true)}
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580] mb-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    Transfer type
                  </div>
                  <div className="font-semibold text-gray-900 text-base">
                    {transferType === "airport-taxi"
                      ? "Airport Taxi"
                      : "Car Rentals"}{" "}
                    • {transferTripType === "one-way" ? "One-way" : "Return"}
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Search Fields */}
          <div className="space-y-3">
            {/* From Field */}
            <button
              onClick={() => setShowFromInput(true)}
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#003580] rounded-lg flex items-center justify-center">
                  <ModuleIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    {fieldLabels.from}
                  </div>
                  <div className="font-semibold text-gray-900 text-base">
                    {fromCity} ({fromCode})
                  </div>
                </div>
              </div>
            </button>

            {/* To Field (if applicable) */}
            {fieldLabels.to && (
              <button
                onClick={() => setShowToInput(true)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {fieldLabels.to}
                    </div>
                    <div className="font-semibold text-gray-900 text-base">
                      {toCity} ({toCode})
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Dates Field */}
            <button
              onClick={() => {
                if (module === "flights" && tripType === "multi-city") {
                  setShowMultiCityInput(true);
                } else {
                  setShowDateInput(true);
                }
              }}
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    module === "flights" && tripType === "multi-city"
                      ? "bg-orange-500"
                      : "bg-emerald-500"
                  }`}
                >
                  {module === "flights" && tripType === "multi-city" ? (
                    <Plane className="w-5 h-5 text-white" />
                  ) : (
                    <Calendar className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    {module === "flights" && tripType === "multi-city"
                      ? "Multi-city flights"
                      : fieldLabels.dates}
                  </div>
                  <div className="font-semibold text-gray-900 text-base">
                    {formatDateDisplay()}
                  </div>
                  {module === "flights" && tripType === "multi-city" && (
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      Tap to add flights →
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Time Field (for transfers only) */}
            {module === "transfers" && (
              <button
                onClick={() => setShowTimeInput(true)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {transferTripType === "return"
                        ? "Pickup & return time"
                        : "Pickup time"}
                    </div>
                    <div className="font-semibold text-gray-900 text-base">
                      {transferTripType === "return"
                        ? `${pickupTime} - ${returnTime}`
                        : pickupTime}
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Travelers Field */}
            <button
              onClick={() => setShowTravelersInput(true)}
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    {module === "hotels" ? "Guests & rooms" : "Travelers"}
                  </div>
                  <div className="font-semibold text-gray-900 text-base">
                    {formatTravelersDisplay()}
                  </div>
                </div>
              </div>
            </button>

            {/* Validation Error Display */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-700 text-sm font-medium">
                    {validationError}
                  </p>
                </div>
              </div>
            )}

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center space-x-2 mt-6 transition-all duration-150 ${
                module === "flights" &&
                tripType === "multi-city" &&
                !validateMultiCitySearch().isValid
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black"
              }`}
              disabled={
                module === "flights" &&
                tripType === "multi-city" &&
                !validateMultiCitySearch().isValid
              }
            >
              <Search className="w-5 h-5" />
              <span>
                {module === "flights" && tripType === "multi-city"
                  ? multiCityLegs.length < 2
                    ? "Add Flight Segments"
                    : "Search Multi-City"
                  : "Search"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Full-Screen Input Components */}
      {showFromInput && (
        <MobileFullScreenCityInput
          title={fieldLabels.from || "Select location"}
          placeholder="Search cities, airports..."
          selectedValue={`${fromCity} (${fromCode})`}
          onSelect={handleFromCitySelect}
          onBack={() => setShowFromInput(false)}
          cities={cityData}
        />
      )}

      {showToInput && fieldLabels.to && (
        <MobileFullScreenCityInput
          title={fieldLabels.to}
          placeholder="Search cities, airports..."
          selectedValue={`${toCity} (${toCode})`}
          onSelect={handleToCitySelect}
          onBack={() => setShowToInput(false)}
          cities={cityData}
        />
      )}

      {showDateInput && (
        <MobileFullScreenDateInput
          title={fieldLabels.dates || "Select dates"}
          tripType={module === "transfers" ? transferTripType : tripType}
          initialRange={dateRange}
          onSelect={handleDateSelect}
          onBack={() => setShowDateInput(false)}
        />
      )}

      {showTravelersInput && (
        <MobileFullScreenTravelersInput
          title={module === "hotels" ? "Guests & rooms" : "Travelers"}
          bookingType={module}
          initialTravelers={travelers}
          onSelect={handleTravelersSelect}
          onBack={() => setShowTravelersInput(false)}
        />
      )}

      {showTimeInput && module === "transfers" && (
        <MobileFullScreenTimeInput
          title="Select time"
          transferTripType={transferTripType}
          initialPickupTime={pickupTime}
          initialReturnTime={returnTime}
          onSelect={handleTimeSelect}
          onBack={() => setShowTimeInput(false)}
        />
      )}

      {showTransferTypeInput && module === "transfers" && (
        <MobileFullScreenTransferTypeInput
          title="Transfer type"
          initialTransferType={transferType}
          initialTripType={transferTripType}
          onSelect={handleTransferTypeSelect}
          onBack={() => setShowTransferTypeInput(false)}
        />
      )}

      {showMultiCityInput &&
        module === "flights" &&
        tripType === "multi-city" && (
          <MobileFullScreenMultiCityInput
            title="Multi-city flights"
            initialLegs={multiCityLegs}
            onSelect={handleMultiCitySelect}
            onBack={() => setShowMultiCityInput(false)}
            cities={cityData}
          />
        )}
    </div>
  );
}
