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
import { MapPin, CalendarIcon, Search } from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";

export function SightseeingSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const [destination, setDestination] = useState("");
  
  // Set default dates to future dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [tourDate, setTourDate] = useState<Date | undefined>(tomorrow);
  const [endDate, setEndDate] = useState<Date | undefined>(nextWeek);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

  // Popular sightseeing destinations
  const popularDestinations = [
    "Dubai, United Arab Emirates",
    "London, United Kingdom", 
    "Paris, France",
    "Rome, Italy",
    "Barcelona, Spain",
    "New York, United States",
    "Bangkok, Thailand",
    "Singapore",
    "Tokyo, Japan",
    "Sydney, Australia",
    "Istanbul, Turkey",
    "Mumbai, India",
  ];

  const handleSearch = () => {
    console.log("🔍 Starting sightseeing search with:", {
      destination,
      tourDate,
      endDate,
    });

    // Validate required fields
    if (!destination) {
      setErrorMessage("Please enter a destination");
      setShowError(true);
      return;
    }

    if (!tourDate) {
      setErrorMessage("Please select tour date");
      setShowError(true);
      return;
    }

    try {
      const searchParams = new URLSearchParams({
        destination: destination,
        tourDate: tourDate.toISOString(),
        searchType: "live",
        searchId: Date.now().toString(),
      });

      if (endDate) {
        searchParams.set("endDate", endDate.toISOString());
      }

      const url = `/sightseeing/results?${searchParams.toString()}`;
      console.log("🎯 Navigating to sightseeing search:", url);
      navigate(url);
    } catch (error) {
      console.error("🚨 Error in sightseeing search:", error);
      setErrorMessage("Search failed. Please try again.");
      setShowError(true);
    }
  };

  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
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
                placeholder="Where do you want to explore?"
                autoComplete="off"
                list="sightseeing-destinations"
              />
              <datalist id="sightseeing-destinations">
                {popularDestinations.map((dest, index) => (
                  <option key={index} value={dest} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Tour Date */}
          <div className="flex-1 lg:max-w-[280px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Tour Dates
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {tourDate && endDate ? (
                      <>
                        <span className="hidden md:inline">
                          {format(tourDate, "EEE, MMM d")} to{" "}
                          {format(endDate, "EEE, MMM d")}
                        </span>
                        <span className="md:hidden">
                          {format(tourDate, "d MMM")} -{" "}
                          {format(endDate, "d MMM")}
                        </span>
                      </>
                    ) : tourDate ? (
                      <>
                        <span className="hidden md:inline">
                          {format(tourDate, "EEE, MMM d")}
                        </span>
                        <span className="md:hidden">
                          {format(tourDate, "d MMM")}
                        </span>
                      </>
                    ) : (
                      "Select tour dates"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <BookingCalendar
                  initialRange={{
                    startDate: tourDate || new Date(),
                    endDate: endDate || addDays(tourDate || new Date(), 3),
                  }}
                  onChange={(range) => {
                    console.log("Sightseeing calendar range selected:", range);
                    setTourDate(range.startDate);
                    setEndDate(range.endDate);
                  }}
                  onClose={() => setIsCalendarOpen(false)}
                  className="w-full"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button
              onClick={handleSearch}
              className="h-10 sm:h-12 w-full sm:w-auto bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded px-6 sm:px-8 transition-all duration-150"
            >
              <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Explore</span>
            </Button>
          </div>
        </div>

        {/* Popular Activities */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">Popular Activities</div>
          <div className="flex flex-wrap gap-2">
            {[
              "🎢 Theme Parks",
              "🏛️ Museums",
              "🌆 City Tours", 
              "🏖️ Beach Activities",
              "🗼 Landmarks",
              "🍽️ Food Tours",
            ].map((activity, index) => (
              <button
                key={index}
                onClick={() => setDestination(activity.split(" ")[1])}
                className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
              >
                {activity}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
