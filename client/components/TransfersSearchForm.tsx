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
import { MobileDatePicker, MobileTravelers, MobileCityDropdown } from "@/components/MobileDropdowns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays } from "date-fns";
import {
  MapPin,
  CalendarIcon,
  Users,
  Search,
  X,
  Plus,
  Minus,
  Clock,
  Car,
  Plane,
  Hotel,
  ArrowRight,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/ErrorBanner";

interface PassengerConfig {
  adults: number;
  children: number;
  childrenAges: number[];
  infants: number;
}

type TransferMode = "airport" | "rental";
type TripType = "one-way" | "return";

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Mode state - Airport taxi (default) | Car rentals
  const [transferMode, setTransferMode] = useState<TransferMode>("airport");
  const [tripType, setTripType] = useState<TripType>("one-way");

  // Location states
  const [pickup, setPickup] = useState<{ code: string; label: string; type: string } | null>(null);
  const [dropoff, setDropoff] = useState<{ code: string; label: string; type: string } | null>(null);

  // Date states
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("14:00");

  // Passenger states
  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 1,
    children: 0,
    childrenAges: [],
    infants: 0,
  });

  // Vehicle type
  const [vehicleType, setVehicleType] = useState("any");

  // Mobile dropdowns
  const [showMobileFromDestination, setShowMobileFromDestination] = useState(false);
  const [showMobileToDestination, setShowMobileToDestination] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  const [showMobilePassengers, setShowMobilePassengers] = useState(false);
  const [showMobileVehicleType, setShowMobileVehicleType] = useState(false);

  // Calendar states
  const [isPickupDateOpen, setIsPickupDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  // Dropdown states for desktop
  const [isPickupDropdownOpen, setIsPickupDropdownOpen] = useState(false);
  const [isDropoffDropdownOpen, setIsDropoffDropdownOpen] = useState(false);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isPassengersDropdownOpen, setIsPassengersDropdownOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sample locations for transfers
  const transferLocations = [
    { code: "BOM", label: "Mumbai Airport", type: "airport" },
    { code: "DEL", label: "Delhi Airport", type: "airport" },
    { code: "DXB", label: "Dubai Airport", type: "airport" },
    { code: "taj-mumbai", label: "Hotel Taj Mahal Palace", type: "hotel" },
    { code: "oberoi-mumbai", label: "The Oberoi Mumbai", type: "hotel" },
    { code: "mumbai-central", label: "Mumbai Central", type: "city" },
    { code: "colaba", label: "Colaba", type: "city" },
  ];

  // Time options
  const timeOptions = [
    { value: "06:00", label: "06:00" },
    { value: "07:00", label: "07:00" },
    { value: "08:00", label: "08:00" },
    { value: "09:00", label: "09:00" },
    { value: "10:00", label: "10:00" },
    { value: "11:00", label: "11:00" },
    { value: "12:00", label: "12:00" },
    { value: "13:00", label: "13:00" },
    { value: "14:00", label: "14:00" },
    { value: "15:00", label: "15:00" },
    { value: "16:00", label: "16:00" },
    { value: "17:00", label: "17:00" },
    { value: "18:00", label: "18:00" },
    { value: "19:00", label: "19:00" },
    { value: "20:00", label: "20:00" },
    { value: "21:00", label: "21:00" },
    { value: "22:00", label: "22:00" },
    { value: "23:00", label: "23:00" },
  ];

  // Vehicle types
  const vehicleTypes = [
    { value: "any", label: "Any vehicle type" },
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "van", label: "Van" },
    { value: "luxury", label: "Luxury" },
  ];

  // Handle search
  const handleSearch = () => {
    if (!pickup || !dropoff || !pickupDate) {
      setErrorMessage("Please select pickup location, dropoff location, and pickup date");
      setShowError(true);
      return;
    }

    if (tripType === "return" && !returnDate) {
      setErrorMessage("Please select return date for round trip");
      setShowError(true);
      return;
    }

    const searchParams = new URLSearchParams();
    searchParams.set("mode", transferMode);
    searchParams.set("tripType", tripType);
    searchParams.set("pickup", pickup.code);
    searchParams.set("dropoff", dropoff.code);
    searchParams.set("pickupDate", pickupDate.toISOString().split('T')[0]);
    searchParams.set("pickupTime", pickupTime);
    
    if (tripType === "return" && returnDate) {
      searchParams.set("returnDate", returnDate.toISOString().split('T')[0]);
      searchParams.set("returnTime", returnTime);
    }
    
    searchParams.set("adults", passengers.adults.toString());
    searchParams.set("children", passengers.children.toString());
    searchParams.set("infants", passengers.infants.toString());
    searchParams.set("vehicleType", vehicleType);

    navigate(`/transfer-results?${searchParams.toString()}`);
  };

  // Swap pickup and dropoff
  const swapLocations = () => {
    const tempPickup = pickup;
    setPickup(dropoff);
    setDropoff(tempPickup);
  };

  // Passenger summary
  const passengerSummary = () => {
    const parts = [];
    parts.push(`${passengers.adults} adult${passengers.adults > 1 ? "s" : ""}`);
    if (passengers.children > 0) {
      parts.push(`${passengers.children} child${passengers.children > 1 ? "ren" : ""}`);
    }
    if (passengers.infants > 0) {
      parts.push(`${passengers.infants} infant${passengers.infants > 1 ? "s" : ""}`);
    }
    return parts.join(", ");
  };

  // Check if form is valid
  const isFormValid = pickup && dropoff && pickupDate && (tripType === "one-way" || returnDate);

  if (isMobile) {
    // Mobile layout matching flights exactly
    return (
      <>
        <ErrorBanner
          message={errorMessage}
          isVisible={showError}
          onClose={() => setShowError(false)}
        />
        
        <div className="space-y-3">
          {/* Trip Type Selector - exactly like flights */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTripType("one-way")}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                tripType === "one-way"
                  ? "bg-[#003580] text-white"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              One way
            </button>
            <button
              onClick={() => setTripType("return")}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                tripType === "return"
                  ? "bg-[#003580] text-white"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              Return
            </button>
            <button
              onClick={() => setTransferMode(transferMode === "airport" ? "rental" : "airport")}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                transferMode === "rental"
                  ? "bg-[#003580] text-white"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              {transferMode === "airport" ? "Taxi" : "Rental"}
            </button>
          </div>

          {/* From/To Locations - exactly like flights */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <button
                  onClick={() => setShowMobileFromDestination(true)}
                  className="w-full text-left"
                >
                  <div className="text-xs text-gray-500 mb-1">From</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[#003580]" />
                    </div>
                    <div>
                      {pickup ? (
                        <>
                          <div className="font-medium text-gray-900">
                            {pickup.code}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pickup.label}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Pickup location
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={swapLocations}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>

              <div className="flex-1">
                <button
                  onClick={() => setShowMobileToDestination(true)}
                  className="w-full text-left"
                >
                  <div className="text-xs text-gray-500 mb-1">To</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#003580]" />
                    </div>
                    <div>
                      {dropoff ? (
                        <>
                          <div className="font-medium text-gray-900">
                            {dropoff.code}
                          </div>
                          <div className="text-xs text-gray-500">
                            {dropoff.label}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Drop-off location
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Dates - exactly like flights */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <button
              onClick={() => setShowMobileDatePicker(true)}
              className="w-full text-left p-5 hover:bg-gray-50 rounded-xl transition-colors duration-200"
            >
              <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Dates
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarIcon className="w-5 h-5 text-[#003580]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 text-base leading-tight">
                    {pickupDate
                      ? format(pickupDate, "dd MMM")
                      : "Select pickup date"}
                    {tripType === "return" && (
                      <>
                        <span className="mx-2 text-gray-400">—</span>
                        {returnDate
                          ? format(returnDate, "dd MMM")
                          : "Select return"}
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {tripType === "return"
                      ? "Add pickup and return dates"
                      : "Add pickup date"}
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Travelers & Vehicle Type - exactly like flights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <button
                onClick={() => setShowMobilePassengers(true)}
                className="w-full text-left"
              >
                <div className="text-xs text-gray-500 mb-1">Travelers</div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-[#003580]" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {passengers.adults + passengers.children}
                    </div>
                    <div className="text-xs text-gray-500">
                      {passengers.adults} adult{passengers.adults > 1 ? "s" : ""}
                      {passengers.children > 0 &&
                        `, ${passengers.children} child${passengers.children > 1 ? "ren" : ""}`}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <button
                onClick={() => setShowMobileVehicleType(true)}
                className="w-full text-left"
              >
                <div className="text-xs text-gray-500 mb-1">Vehicle</div>
                <div className="flex items-center space-x-2">
                  <Car className="w-5 h-5 text-[#003580]" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {vehicleTypes.find(v => v.value === vehicleType)?.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      Vehicle type
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Search Button - exactly like flights */}
          <Button
            onClick={handleSearch}
            disabled={!isFormValid}
            className="w-full bg-[#febb02] hover:bg-[#d19900] text-[#003580] font-bold py-4 text-lg rounded-xl shadow-lg"
          >
            <Search className="w-5 h-5 mr-2" />
            Search Transfers
          </Button>
        </div>

        {/* Mobile Dropdowns */}
        <MobileDatePicker
          isOpen={showMobileDatePicker}
          onClose={() => setShowMobileDatePicker(false)}
          tripType={tripType}
          selectedDepartureDate={pickupDate}
          selectedReturnDate={returnDate}
          setSelectedDepartureDate={setPickupDate}
          setSelectedReturnDate={setReturnDate}
          selectingDeparture={true}
          setSelectingDeparture={() => {}}
          bookingType="transfers"
        />

        <MobileTravelers
          isOpen={showMobilePassengers}
          onClose={() => setShowMobilePassengers(false)}
          travelers={{
            adults: passengers.adults,
            children: passengers.children,
            childAges: passengers.childrenAges,
          }}
          setTravelers={(travelers) => {
            setPassengers({
              adults: travelers.adults,
              children: travelers.children,
              childrenAges: travelers.childAges,
              infants: passengers.infants,
            });
          }}
        />

        <MobileCityDropdown
          isOpen={showMobileFromDestination}
          onClose={() => setShowMobileFromDestination(false)}
          title="Select pickup location"
          cities={transferLocations.reduce((acc, loc) => {
            acc[loc.label] = { code: loc.code, name: loc.label };
            return acc;
          }, {} as Record<string, { code: string; name: string }>)}
          selectedCity={pickup?.label || ""}
          onSelectCity={(cityLabel) => {
            const location = transferLocations.find(loc => loc.label === cityLabel);
            if (location) {
              setPickup(location);
            }
            setShowMobileFromDestination(false);
          }}
          context="transfers"
        />

        <MobileCityDropdown
          isOpen={showMobileToDestination}
          onClose={() => setShowMobileToDestination(false)}
          title="Select drop-off location"
          cities={transferLocations.reduce((acc, loc) => {
            acc[loc.label] = { code: loc.code, name: loc.label };
            return acc;
          }, {} as Record<string, { code: string; name: string }>)}
          selectedCity={dropoff?.label || ""}
          onSelectCity={(cityLabel) => {
            const location = transferLocations.find(loc => loc.label === cityLabel);
            if (location) {
              setDropoff(location);
            }
            setShowMobileToDestination(false);
          }}
          context="transfers"
        />
      </>
    );
  }

  // Desktop layout - similar card structure to flights
  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      
      <div className="w-full mx-auto rounded-2xl bg-white shadow-md border border-slate-200 px-3 py-3 max-w-screen-xl">
        {/* Trip Type Selector - exactly like flights */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTripType("one-way")}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
              tripType === "one-way"
                ? "bg-[#003580] text-white"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            One way
          </button>
          <button
            onClick={() => setTripType("return")}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
              tripType === "return"
                ? "bg-[#003580] text-white"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            Return
          </button>
          <button
            onClick={() => setTransferMode(transferMode === "airport" ? "rental" : "airport")}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
              transferMode === "rental"
                ? "bg-[#003580] text-white"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            {transferMode === "airport" ? "Taxi" : "Rental"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          {/* Pickup/Dropoff Card - exactly like flights */}
          <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <Popover open={isPickupDropdownOpen} onOpenChange={setIsPickupDropdownOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full text-left"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsPickupDropdownOpen(!isPickupDropdownOpen);
                      }}
                    >
                      <div className="text-xs text-gray-500 mb-1">From</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-[#003580]" />
                        </div>
                        <div>
                          {pickup ? (
                            <>
                              <div className="font-medium text-gray-900 text-sm">
                                {pickup.code}
                              </div>
                              <div className="text-xs text-gray-500">
                                {pickup.label}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Pickup location
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 border shadow-lg z-50" align="start">
                    <div className="max-h-64 overflow-y-auto">
                      {transferLocations.map((location) => (
                        <button
                          key={location.code}
                          className="w-full px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-left"
                          onClick={(e) => {
                            e.preventDefault();
                            setPickup(location);
                            setIsPickupDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {location.label}
                              </div>
                              <div className="text-sm text-gray-500 capitalize">
                                {location.type}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <button
                onClick={swapLocations}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                aria-label="Swap pickup and drop-off"
              >
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>

              <div className="flex-1">
                <Popover open={isDropoffDropdownOpen} onOpenChange={setIsDropoffDropdownOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full text-left"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDropoffDropdownOpen(!isDropoffDropdownOpen);
                      }}
                    >
                      <div className="text-xs text-gray-500 mb-1">To</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-[#003580]" />
                        </div>
                        <div>
                          {dropoff ? (
                            <>
                              <div className="font-medium text-gray-900 text-sm">
                                {dropoff.code}
                              </div>
                              <div className="text-xs text-gray-500">
                                {dropoff.label}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Drop-off location
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 border shadow-lg z-50" align="start">
                    <div className="max-h-64 overflow-y-auto">
                      {transferLocations.map((location) => (
                        <button
                          key={location.code}
                          className="w-full px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-left"
                          onClick={(e) => {
                            e.preventDefault();
                            setDropoff(location);
                            setIsDropoffDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {location.label}
                              </div>
                              <div className="text-sm text-gray-500 capitalize">
                                {location.type}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Date/Time Fields - exactly like flights */}
          <div className="flex-1">
            <Popover open={isPickupDateOpen} onOpenChange={setIsPickupDateOpen}>
              <PopoverTrigger asChild>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer p-4">
                  <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                    Dates
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-5 h-5 text-[#003580]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 text-base leading-tight">
                        {pickupDate
                          ? format(pickupDate, "dd MMM")
                          : "Select pickup date"}
                        {tripType === "return" && (
                          <>
                            <span className="mx-2 text-gray-400">—</span>
                            {returnDate
                              ? format(returnDate, "dd MMM")
                              : "Select return"}
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {tripType === "return"
                          ? "Add pickup and return dates"
                          : "Add pickup date"}
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <BookingCalendar
                  onChange={({ startDate, endDate }) => {
                    if (startDate) setPickupDate(startDate);
                    if (endDate && tripType === "return") setReturnDate(endDate);
                  }}
                  initialRange={pickupDate ? { startDate: pickupDate, endDate: returnDate || addDays(pickupDate, 3) } : undefined}
                  onClose={() => setIsPickupDateOpen(false)}
                  bookingType="transfers"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Travelers with dropdown - exactly like flights */}
          <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
            <Popover open={isPassengersDropdownOpen} onOpenChange={setIsPassengersDropdownOpen}>
              <PopoverTrigger asChild>
                <button
                  className="w-full text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsPassengersDropdownOpen(!isPassengersDropdownOpen);
                  }}
                >
                  <div className="text-xs text-gray-500 mb-1">Travelers</div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-[#003580]" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {passengers.adults + passengers.children}
                      </div>
                      <div className="text-xs text-gray-500">
                        {passengers.adults} adult{passengers.adults > 1 ? "s" : ""}
                        {passengers.children > 0 &&
                          `, ${passengers.children} child${passengers.children > 1 ? "ren" : ""}`}
                      </div>
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 border shadow-lg z-50" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Adults</div>
                      <div className="text-xs text-gray-500">Age 18+</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (passengers.adults > 1) {
                            setPassengers({...passengers, adults: passengers.adults - 1});
                          }
                        }}
                        disabled={passengers.adults <= 1}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{passengers.adults}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (passengers.adults < 8) {
                            setPassengers({...passengers, adults: passengers.adults + 1});
                          }
                        }}
                        disabled={passengers.adults >= 8}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Children</div>
                      <div className="text-xs text-gray-500">Age 2-17</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (passengers.children > 0) {
                            const newAges = [...passengers.childrenAges];
                            newAges.pop();
                            setPassengers({...passengers, children: passengers.children - 1, childrenAges: newAges});
                          }
                        }}
                        disabled={passengers.children <= 0}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{passengers.children}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (passengers.children < 6) {
                            setPassengers({
                              ...passengers,
                              children: passengers.children + 1,
                              childrenAges: [...passengers.childrenAges, 10]
                            });
                          }
                        }}
                        disabled={passengers.children >= 6}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Vehicle Type - replacing class selector */}
          <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
            <Popover open={isVehicleDropdownOpen} onOpenChange={setIsVehicleDropdownOpen}>
              <PopoverTrigger asChild>
                <button
                  className="w-full text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsVehicleDropdownOpen(!isVehicleDropdownOpen);
                  }}
                >
                  <div className="text-xs text-gray-500 mb-1">Vehicle</div>
                  <div className="flex items-center space-x-2">
                    <Car className="w-5 h-5 text-[#003580]" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {vehicleTypes.find(v => v.value === vehicleType)?.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        Vehicle type
                      </div>
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 border shadow-lg z-50" align="start">
                <div className="max-h-64 overflow-y-auto">
                  {vehicleTypes.map((vehicle) => (
                    <button
                      key={vehicle.value}
                      className="w-full px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-left"
                      onClick={(e) => {
                        e.preventDefault();
                        setVehicleType(vehicle.value);
                        setIsVehicleDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {vehicle.label}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button - exactly like flights */}
          <div className="flex-shrink-0 flex justify-center lg:justify-start">
            <Button
              onClick={handleSearch}
              disabled={!isFormValid}
              className="h-16 px-8 bg-[#febb02] hover:bg-[#d19900] text-[#003580] font-bold text-lg rounded-xl shadow-lg"
              title="Search transfers"
            >
              <Search className="mr-2 h-5 w-5" />
              <span>
                Search
              </span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
