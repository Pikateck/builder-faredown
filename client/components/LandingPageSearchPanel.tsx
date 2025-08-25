import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/components/BookingCalendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import {
  Plane,
  ChevronDown,
  X,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// City data mapping (same as FlightResults.tsx)
const cityData = {
  Mumbai: {
    code: "BOM",
    name: "Mumbai",
    airport: "Rajiv Gandhi Shivaji International",
    fullName: "Mumbai, Maharashtra, India",
  },
  Delhi: {
    code: "DEL", 
    name: "Delhi",
    airport: "Indira Gandhi International",
    fullName: "New Delhi, Delhi, India",
  },
  Dubai: {
    code: "DXB",
    name: "Dubai",
    airport: "Dubai International Airport",
    fullName: "Dubai, United Arab Emirates",
  },
  "Abu Dhabi": {
    code: "AUH",
    name: "Abu Dhabi",
    airport: "Zayed International",
    fullName: "Abu Dhabi, United Arab Emirates",
  },
  Singapore: {
    code: "SIN",
    name: "Singapore",
    airport: "Changi Airport", 
    fullName: "Singapore, Singapore",
  },
};

interface Travelers {
  adults: number;
  children: number;
}

export function LandingPageSearchPanel() {
  const navigate = useNavigate();
  
  // Trip type state
  const [tripType, setTripType] = useState("round-trip");
  const [selectedClass, setSelectedClass] = useState("Economy");
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  // City selection states
  const [selectedFromCity, setSelectedFromCity] = useState("Mumbai");
  const [selectedToCity, setSelectedToCity] = useState("Dubai");
  const [showFromCities, setShowFromCities] = useState(false);
  const [showToCities, setShowToCities] = useState(false);

  // Date states
  const [departureDate, setDepartureDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [returnDate, setReturnDate] = useState<Date>(addDays(new Date(), 8)); // Week from now
  const [showCalendar, setShowCalendar] = useState(false);

  // Travelers state
  const [travelers, setTravelers] = useState<Travelers>({
    adults: 1,
    children: 0,
  });
  const [showTravelers, setShowTravelers] = useState(false);

  // Format date for display
  const formatDisplayDate = (date: Date) => {
    return format(date, "E MMM d");
  };

  // Handle travelers change
  const handleTravelersChange = (newTravelers: Travelers) => {
    setTravelers(newTravelers);
  };

  // Handle search
  const handleSearch = () => {
    const fromCode = cityData[selectedFromCity]?.code || "BOM";
    const toCode = cityData[selectedToCity]?.code || "DXB";
    
    const searchParams = new URLSearchParams({
      from: `${selectedFromCity} (${fromCode})`,
      to: `${selectedToCity} (${toCode})`, 
      departureDate: departureDate.toISOString(),
      adults: travelers.adults.toString(),
      children: travelers.children.toString(),
      rooms: "1",
      tripType,
      cabinClass: selectedClass.toLowerCase().replace(" ", "-"),
    });

    if (tripType === "round-trip") {
      searchParams.set("returnDate", returnDate.toISOString());
    }

    navigate(`/flights/results?${searchParams.toString()}`);
  };

  // Handle class change
  const handleClassChange = (classType: string) => {
    setSelectedClass(classType);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowFromCities(false);
      setShowToCities(false);
      setShowClassDropdown(false);
      setShowTravelers(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 overflow-visible">
        <div className="flex flex-col gap-4">
          {/* Trip Type and Class Selection Row */}
          <div className="flex items-center bg-white rounded-lg p-2 sm:p-3 flex-1 w-full border sm:border-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-6 w-full sm:w-auto">
              {/* Round Trip */}
              <button
                onClick={() => setTripType("round-trip")}
                className="flex items-center space-x-2"
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2",
                    tripType === "round-trip"
                      ? "bg-blue-600 border-white ring-1 ring-blue-600"
                      : "border-gray-300"
                  )}
                ></div>
                <span
                  className={cn(
                    "text-sm",
                    tripType === "round-trip"
                      ? "font-medium text-gray-900"
                      : "text-gray-500"
                  )}
                >
                  Round trip
                </span>
              </button>

              {/* One Way */}
              <button
                onClick={() => setTripType("one-way")}
                className="flex items-center space-x-2"
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2",
                    tripType === "one-way"
                      ? "bg-blue-600 border-white ring-1 ring-blue-600"
                      : "border-gray-300"
                  )}
                ></div>
                <span
                  className={cn(
                    "text-sm",
                    tripType === "one-way"
                      ? "font-medium text-gray-900"
                      : "text-gray-500"
                  )}
                >
                  One way
                </span>
              </button>

              {/* Multi-city */}
              <button
                onClick={() => setTripType("multi-city")}
                className="flex items-center space-x-2"
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2",
                    tripType === "multi-city"
                      ? "bg-blue-600 border-white ring-1 ring-blue-600"
                      : "border-gray-300"
                  )}
                ></div>
                <span
                  className={cn(
                    "text-sm",
                    tripType === "multi-city"
                      ? "font-medium text-gray-900"
                      : "text-gray-500"
                  )}
                >
                  Multi-city
                </span>
              </button>

              {/* Class Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                >
                  <div className="w-3 h-3 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-500">
                    {selectedClass}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                {showClassDropdown && (
                  <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-[9999] w-48 min-w-[180px]">
                    {[
                      "Economy",
                      "Premium Economy",
                      "Business",
                      "First Class",
                    ].map((classType) => (
                      <button
                        key={classType}
                        onClick={() => {
                          handleClassChange(classType);
                          setShowClassDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm transition-colors ${
                          selectedClass === classType
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : "text-gray-900"
                        }`}
                      >
                        {classType}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Inputs Row */}
        <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3 mt-2 w-full max-w-6xl overflow-visible">
          {/* Leaving From */}
          <div className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full" onClick={(e) => e.stopPropagation()}>
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Leaving from
            </label>
            <div className="relative">
              <button
                onClick={() => setShowFromCities(!showFromCities)}
                className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-10 w-full hover:border-blue-600 touch-manipulation pr-10"
              >
                <Plane className="w-4 h-4 text-gray-500 mr-2" />
                <div className="flex items-center space-x-2 min-w-0">
                  {selectedFromCity ? (
                    <>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {cityData[selectedFromCity]?.code}
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {cityData[selectedFromCity]?.airport}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium">
                      Leaving from
                    </span>
                  )}
                </div>
              </button>
              {selectedFromCity && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFromCity("");
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear departure city"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* From Cities Dropdown */}
            {showFromCities && (
              <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Airport, city or country
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Mumbai"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {Object.entries(cityData).map(([city, data]) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedFromCity(city);
                        setShowFromCities(false);
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                          <Plane className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <span className="font-semibold">{data.code}</span>{" "}
                            • {city}
                          </div>
                          <div className="text-xs text-gray-500">
                            {data.airport}
                          </div>
                          <div className="text-xs text-gray-400">
                            {data.fullName}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Going To */}
          <div className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full" onClick={(e) => e.stopPropagation()}>
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Going to
            </label>
            <div className="relative">
              <button
                onClick={() => setShowToCities(!showToCities)}
                className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-10 w-full hover:border-blue-500 touch-manipulation pr-10"
              >
                <Plane className="w-4 h-4 text-gray-500 mr-2" />
                <div className="flex items-center space-x-2 min-w-0">
                  {selectedToCity ? (
                    <>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {cityData[selectedToCity]?.code}
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {cityData[selectedToCity]?.airport}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium">
                      Going to
                    </span>
                  )}
                </div>
              </button>
              {selectedToCity && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedToCity("");
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear destination city"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* To Cities Dropdown */}
            {showToCities && (
              <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Airport, city or country
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Dubai"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {Object.entries(cityData).map(([city, data]) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedToCity(city);
                        setShowToCities(false);
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                          <Plane className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <span className="font-semibold">{data.code}</span>{" "}
                            • {city}
                          </div>
                          <div className="text-xs text-gray-500">
                            {data.airport}
                          </div>
                          <div className="text-xs text-gray-400">
                            {data.fullName}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Travel Dates */}
          <div className="relative flex-1 lg:min-w-[240px] lg:max-w-[280px] w-full">
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Travel dates
            </label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <button className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-10 w-full hover:border-blue-500 touch-manipulation">
                  <Calendar className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-sm text-gray-700 font-medium truncate">
                      {tripType === "one-way"
                        ? departureDate
                          ? formatDisplayDate(departureDate)
                          : "Select date"
                        : departureDate
                          ? `${formatDisplayDate(departureDate)}${returnDate ? ` - ${formatDisplayDate(returnDate)}` : " - Return"}`
                          : "Select dates"}
                    </span>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <BookingCalendar
                  bookingType="flight"
                  initialRange={{
                    startDate: departureDate || new Date(),
                    endDate: returnDate || addDays(departureDate || new Date(), 7),
                  }}
                  onChange={(range) => {
                    setDepartureDate(range.startDate);
                    if (tripType === "round-trip" && range.endDate) {
                      setReturnDate(range.endDate);
                    }
                  }}
                  onClose={() => setShowCalendar(false)}
                  className="w-full"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Travelers */}
          <div className="relative flex-1 lg:min-w-[240px] lg:max-w-[280px] w-full" onClick={(e) => e.stopPropagation()}>
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Travelers
            </label>
            <button
              onClick={() => setShowTravelers(!showTravelers)}
              className="flex items-center bg-white rounded border border-gray-300 px-3 py-2 h-10 w-full hover:border-blue-500 touch-manipulation"
            >
              <svg
                className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm text-gray-700 font-medium truncate">
                {travelers.adults} adult
                {travelers.adults > 1 ? "s" : ""}
                {travelers.children > 0
                  ? `, ${travelers.children} child${travelers.children > 1 ? "ren" : ""}`
                  : ""}
              </span>
            </button>

            {/* Travelers Dropdown */}
            {showTravelers && (
              <div className="absolute top-14 right-0 bg-white border border-gray-300 rounded-md shadow-xl p-4 z-50 w-72">
                <div className="space-y-6">
                  {/* Adults */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-gray-900">Adults</div>
                      <div className="text-sm text-gray-500">Age 18+</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() =>
                          handleTravelersChange({
                            ...travelers,
                            adults: Math.max(1, travelers.adults - 1),
                          })
                        }
                        disabled={travelers.adults <= 1}
                        className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium text-gray-900">
                        {travelers.adults}
                      </span>
                      <button
                        onClick={() =>
                          handleTravelersChange({
                            ...travelers,
                            adults: travelers.adults + 1,
                          })
                        }
                        className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 text-blue-600 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-gray-900">Children</div>
                      <div className="text-sm text-gray-500">Age 0-17</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() =>
                          handleTravelersChange({
                            ...travelers,
                            children: Math.max(0, travelers.children - 1),
                          })
                        }
                        disabled={travelers.children <= 0}
                        className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium text-gray-900">
                        {travelers.children}
                      </span>
                      <button
                        onClick={() =>
                          handleTravelersChange({
                            ...travelers,
                            children: travelers.children + 1,
                          })
                        }
                        className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 text-blue-600 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Done Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => setShowTravelers(false)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <div className="w-full lg:w-auto lg:min-w-[120px]">
            <Button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded h-10 font-medium text-sm w-full touch-manipulation"
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
