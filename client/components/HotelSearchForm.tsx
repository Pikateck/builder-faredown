import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookingCalendar } from "@/components/BookingCalendar";
import { format, addDays } from "date-fns";
import {
  MapPin,
  CalendarIcon,
  Users,
  Search,
  Plus,
  Minus,
} from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";

interface GuestConfig {
  adults: number;
  children: number;
  childrenAges: number[];
  rooms: number;
}

interface HotelSearchFormProps {
  className?: string;
  variant?: "compact" | "full";
  onSearch?: (searchData: any) => void;
}

export function HotelSearchForm({
  className = "",
  variant = "full",
  onSearch,
}: HotelSearchFormProps) {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  const [destination, setDestination] = useState("");
  
  // Set default dates to future dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkOutDefault = new Date();
  checkOutDefault.setDate(checkOutDefault.getDate() + 4);

  const [checkInDate, setCheckInDate] = useState<Date | undefined>(tomorrow);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(checkOutDefault);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [guests, setGuests] = useState<GuestConfig>({
    adults: 2,
    children: 1,
    childrenAges: [10],
    rooms: 1,
  });
  const [isGuestPopoverOpen, setIsGuestPopoverOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Popular destinations
  const popularDestinations = [
    "Dubai, United Arab Emirates",
    "London, United Kingdom",
    "Barcelona, Spain",
    "Paris, France",
    "Rome, Italy",
    "New York, United States",
    "Bangkok, Thailand",
    "Singapore",
    "Tokyo, Japan",
    "Sydney, Australia",
    "Mumbai, India",
    "Delhi, India",
  ];

  const childAgeOptions = Array.from({ length: 18 }, (_, i) => i);

  const calculateNights = (
    checkIn: Date | undefined,
    checkOut: Date | undefined,
  ): number => {
    if (!checkIn || !checkOut) return 0;
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(nights, 1);
  };

  const nights = calculateNights(checkInDate, checkOutDate);

  const updateGuestCount = (
    type: keyof Pick<GuestConfig, "adults" | "children" | "rooms">,
    operation: "increment" | "decrement",
  ) => {
    setGuests((prev) => {
      const newValue =
        operation === "increment" ? prev[type] + 1 : prev[type] - 1;

      // Validation rules
      if (type === "adults" && newValue < 1) return prev;
      if (type === "children" && newValue < 0) return prev;
      if (type === "rooms" && newValue < 1) return prev;
      if (type === "rooms" && newValue > 8) return prev;
      if ((type === "adults" || type === "children") && newValue > 16)
        return prev;

      // Handle children ages array
      if (type === "children") {
        const childrenAges = [...prev.childrenAges];
        if (newValue > prev.children) {
          // Add new child age
          childrenAges.push(10);
        } else if (newValue < prev.children) {
          // Remove last child age
          childrenAges.pop();
        }
        return {
          ...prev,
          [type]: newValue,
          childrenAges,
        };
      }

      return {
        ...prev,
        [type]: newValue,
      };
    });
  };

  const updateChildAge = (index: number, age: number) => {
    setGuests((prev) => ({
      ...prev,
      childrenAges: prev.childrenAges.map((existingAge, i) =>
        i === index ? age : existingAge,
      ),
    }));
  };

  const handleSearch = () => {
    console.log("🔍 Starting hotel search with:", {
      destination,
      checkInDate,
      checkOutDate,
      guests,
    });

    // Only validate dates, destination is optional for browsing
    if (!checkInDate || !checkOutDate) {
      setErrorMessage("Please select check-in and check-out dates");
      setShowError(true);
      return;
    }

    // Validate date range
    const daysBetween = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysBetween < 1) {
      setErrorMessage("Check-out date must be after check-in date");
      setShowError(true);
      return;
    }
    if (daysBetween > 30) {
      setErrorMessage("Maximum stay duration is 30 days");
      setShowError(true);
      return;
    }

    try {
      const searchParams = new URLSearchParams({
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        adults: guests.adults.toString(),
        children: guests.children.toString(),
        rooms: guests.rooms.toString(),
        searchType: "live",
        searchId: Date.now().toString(),
      });

      // Only add destination if it exists
      if (destination) {
        searchParams.set("destination", destination);
        searchParams.set("destinationName", destination);
      }

      const url = `/hotels/results?${searchParams.toString()}`;
      console.log("🏨 Navigating to hotel search:", url);
      
      if (onSearch) {
        onSearch({
          destination,
          checkInDate,
          checkOutDate,
          guests,
        });
      } else {
        navigate(url);
      }
    } catch (error) {
      console.error("🚨 Error in hotel search:", error);
      setErrorMessage("Search failed. Please try again.");
      setShowError(true);
    }
  };

  const guestSummary = () => {
    const parts = [];
    parts.push(`${guests.adults} adult${guests.adults > 1 ? "s" : ""}`);
    if (guests.children > 0) {
      parts.push(`${guests.children} child${guests.children > 1 ? "ren" : ""}`);
    }
    parts.push(`${guests.rooms} room${guests.rooms > 1 ? "s" : ""}`);
    return parts.join(" • ");
  };

  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      <div className={`bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200 ${className}`}>
        {/* Main Search Form */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">
          {/* Destination */}
          <div className="flex-1 lg:max-w-[320px] relative">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Destination
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4" />
              <Input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-10 pr-4 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm"
                placeholder="Where are you going?"
                autoComplete="off"
                list="destinations"
              />
              <datalist id="destinations">
                {popularDestinations.map((dest, index) => (
                  <option key={index} value={dest} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Check-in/Check-out Dates */}
          <div className="flex-1 lg:max-w-[280px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Dates
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {checkInDate && checkOutDate ? (
                      <>
                        <span className="hidden md:inline">
                          {format(checkInDate, "EEE, MMM d")} to{" "}
                          {format(checkOutDate, "EEE, MMM d")}
                        </span>
                        <span className="md:hidden">
                          {format(checkInDate, "d MMM")} -{" "}
                          {format(checkOutDate, "d MMM")}
                        </span>
                      </>
                    ) : (
                      "Check-in to Check-out"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <BookingCalendar
                  initialRange={{
                    startDate: checkInDate || new Date(),
                    endDate: checkOutDate || addDays(checkInDate || new Date(), 3),
                  }}
                  onChange={(range) => {
                    console.log("Hotel calendar range selected:", range);
                    setCheckInDate(range.startDate);
                    setCheckOutDate(range.endDate);
                  }}
                  onClose={() => setIsCalendarOpen(false)}
                  className="w-full"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests & Rooms */}
          <div className="flex-1 lg:max-w-[220px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Guests & Rooms
            </label>
            <Popover
              open={isGuestPopoverOpen}
              onOpenChange={setIsGuestPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    <span className="hidden md:inline">
                      {guests.adults} adults, {guests.children} children,{" "}
                      {guests.rooms} room{guests.rooms > 1 ? "s" : ""}
                    </span>
                    <span className="hidden sm:inline md:hidden">
                      {guests.adults + guests.children} guests, {guests.rooms}{" "}
                      room{guests.rooms > 1 ? "s" : ""}
                    </span>
                    <span className="sm:hidden">
                      {guests.rooms} Room{guests.rooms > 1 ? "s" : ""} •{" "}
                      {guests.adults} Adult{guests.adults > 1 ? "s" : ""} •{" "}
                      {guests.children} Child
                      {guests.children !== 1 ? "ren" : ""}
                    </span>
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-96" align="start">
                <div className="space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Adults</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("adults", "decrement")}
                        disabled={guests.adults <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {guests.adults}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("adults", "increment")}
                        disabled={guests.adults >= 16}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Children</div>
                      <div className="text-sm text-gray-500">Ages 0-17</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("children", "decrement")}
                        disabled={guests.children <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {guests.children}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("children", "increment")}
                        disabled={guests.children >= 16}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Children Ages */}
                  {guests.children > 0 && (
                    <div className="space-y-2">
                      {guests.childrenAges.map((age, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">Age of child {index + 1}</span>
                          <select
                            value={age}
                            onChange={(e) => updateChildAge(index, parseInt(e.target.value))}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            {childAgeOptions.map((ageOption) => (
                              <option key={ageOption} value={ageOption}>
                                {ageOption} years old
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rooms */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Rooms</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("rooms", "decrement")}
                        disabled={guests.rooms <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {guests.rooms}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateGuestCount("rooms", "increment")}
                        disabled={guests.rooms >= 8}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsGuestPopoverOpen(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button
              onClick={handleSearch}
              className="h-10 sm:h-12 w-full sm:w-auto bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded px-6 sm:px-8 transition-all duration-150"
              title="Search hotels"
            >
              <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Search</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
