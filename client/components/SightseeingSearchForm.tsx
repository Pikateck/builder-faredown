import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { qp, saveLastSearch, getLastSearch } from "@/lib/searchParams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookingCalendar } from "@/components/BookingCalendar";
import { format, addDays } from "date-fns";
import { MapPin, CalendarIcon, Search, X, Camera } from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { RecentSearches } from "./RecentSearches";

export function SightseeingSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const [destination, setDestination] = useState("");
  const [destinationCode, setDestinationCode] = useState("");
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);

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

  // Initialize form with URL params or sessionStorage data
  useEffect(() => {
    const location = window.location;
    const urlParams = qp.parse(location.search);
    const lastSearch = getLastSearch();

    // Use URL params if available, otherwise fallback to sessionStorage
    const sourceData =
      Object.keys(urlParams).length > 0 ? urlParams : lastSearch;

    if (sourceData) {
      // Set destination
      if (sourceData.destination || sourceData.city) {
        const dest = sourceData.destination || sourceData.city;
        setDestination(dest);
        setInputValue(dest);
      }

      // Set tour date
      if (sourceData.tourDate || sourceData.date) {
        const tourDateStr = sourceData.tourDate || sourceData.date;
        const tourDateFromSource = new Date(tourDateStr);
        if (!isNaN(tourDateFromSource.getTime())) {
          setTourDate(tourDateFromSource);
        }
      }

      // Set end date if available
      if (sourceData.endDate) {
        const endDateFromSource = new Date(sourceData.endDate);
        if (!isNaN(endDateFromSource.getTime())) {
          setEndDate(endDateFromSource);
        }
      }
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsDestinationOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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
      // Prepare data for sessionStorage (normalized format)
      const searchData = {
        city: destination,
        date: tourDate.toISOString().split("T")[0],
        adults: "2",
        children: "0",
      };

      if (endDate) {
        searchData.endDate = endDate.toISOString().split("T")[0];
      }

      // Save to sessionStorage for persistence
      saveLastSearch(searchData);

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
          <div
            className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Where do you want to explore?
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDestinationOpen(!isDestinationOpen)}
                className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-10 w-full hover:border-blue-600 touch-manipulation pr-10"
              >
                <Camera className="w-4 h-4 text-gray-500 mr-2" />
                <div className="flex items-center space-x-2 min-w-0">
                  {destination ? (
                    <>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {destinationCode || "ACT"}
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {destination}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium">
                      Where do you want to explore?
                    </span>
                  )}
                </div>
              </button>
              {destination && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDestination("Dubai, United Arab Emirates");
                    setInputValue("");
                    setIsUserTyping(false);
                    setDestinationCode("DUB");
                    setIsDestinationOpen(false);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Reset to default destination"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Destinations Dropdown */}
            {isDestinationOpen && (
              <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Sightseeing destination
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        setInputValue(value);
                        setIsUserTyping(true);
                      }}
                      placeholder="Search destinations..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {popularDestinations
                    .filter((dest) =>
                      dest
                        .toLowerCase()
                        .includes((inputValue || "").toLowerCase()),
                    )
                    .slice(0, 8)
                    .map((dest, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setDestination(dest);
                          setDestinationCode(
                            dest.split(",")[0]?.substring(0, 3).toUpperCase() ||
                              "ACT",
                          );
                          setIsDestinationOpen(false);
                          setInputValue("");
                          setIsUserTyping(false);
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                            <Camera className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {dest}
                            </div>
                            <div className="text-xs text-gray-500">
                              Sightseeing destination
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
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
              className="h-10 sm:h-12 w-full sm:w-auto bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-bold rounded px-6 sm:px-8 transition-all duration-150"
            >
              <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Explore</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
