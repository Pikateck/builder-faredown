import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookingCalendar } from "@/components/BookingCalendar";
import { MobileDatePicker } from "@/components/MobileDropdowns";
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
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/ErrorBanner";

interface PassengerConfig {
  adults: number;
  children: number;
  childrenAges: number[];
  infants: number;
}

interface DestinationOption {
  id: string;
  code: string;
  name: string;
  country: string;
  type: string;
  flag?: string;
  popular?: boolean;
}

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  // Location states
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDropoffOpen, setIsDropoffOpen] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<DestinationOption[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<DestinationOption[]>([]);
  
  // Date and time states
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const returnDefault = new Date();
  returnDefault.setDate(returnDefault.getDate() + 4);
  returnDefault.setHours(14, 0, 0, 0);

  const [pickupDate, setPickupDate] = useState<Date | undefined>(tomorrow);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState("14:00");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Passenger states
  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 2,
    children: 0,
    childrenAges: [],
    infants: 0,
  });
  const [isPassengerPopoverOpen, setIsPassengerPopoverOpen] = useState(false);
  
  // Vehicle type filter
  const [vehicleType, setVehicleType] = useState("");
  
  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);

  // Options for transfers
  const transferOptions = [
    { value: "", label: "Any vehicle type" },
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "minivan", label: "Minivan" },
    { value: "luxury", label: "Luxury" },
    { value: "wheelchair", label: "Wheelchair accessible" },
  ];

  // Popular destinations (airports, hotels, etc.)
  const popularDestinations: DestinationOption[] = [
    { id: "BOM", code: "BOM", name: "Mumbai Airport (BOM)", country: "India", type: "airport" },
    { id: "DEL", code: "DEL", name: "Delhi Airport (DEL)", country: "India", type: "airport" },
    { id: "DXB", code: "DXB", name: "Dubai Airport (DXB)", country: "UAE", type: "airport" },
    { id: "SIN", code: "SIN", name: "Singapore Airport (SIN)", country: "Singapore", type: "airport" },
    { id: "LHR", code: "LHR", name: "London Heathrow (LHR)", country: "UK", type: "airport" },
    { id: "taj-mumbai", code: "TAJ", name: "The Taj Mahal Palace, Mumbai", country: "India", type: "hotel" },
    { id: "marina-dubai", code: "MAR", name: "Dubai Marina", country: "UAE", type: "area" },
    { id: "sentosa", code: "SEN", name: "Sentosa Island, Singapore", country: "Singapore", type: "area" },
  ];

  // Time options
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    return { value: time, label: time };
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle same as pickup toggle
  useEffect(() => {
    if (sameAsPickup) {
      setDropoffLocation(pickupLocation);
    }
  }, [sameAsPickup, pickupLocation]);

  // Calculate total passengers
  const totalPassengers = passengers.adults + passengers.children + passengers.infants;
  const passengersText = `${totalPassengers} passenger${totalPassengers !== 1 ? 's' : ''}`;

  // Filter destinations based on input
  const filterDestinations = (query: string): DestinationOption[] => {
    if (!query) return popularDestinations;
    return popularDestinations.filter(dest =>
      dest.name.toLowerCase().includes(query.toLowerCase()) ||
      dest.code.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleSearch = () => {
    if (!pickupLocation.trim()) {
      setErrorMessage("Please select a pickup location");
      setShowError(true);
      return;
    }
    
    if (!dropoffLocation.trim() && !sameAsPickup) {
      setErrorMessage("Please select a drop-off location");
      setShowError(true);
      return;
    }
    
    if (!pickupDate) {
      setErrorMessage("Please select a pickup date");
      setShowError(true);
      return;
    }

    // Navigate to transfer results with search parameters
    const searchParams = new URLSearchParams({
      pickup: pickupLocation,
      dropoff: sameAsPickup ? pickupLocation : dropoffLocation,
      pickupDate: pickupDate.toISOString(),
      pickupTime,
      passengers: totalPassengers.toString(),
      adults: passengers.adults.toString(),
      children: passengers.children.toString(),
      infants: passengers.infants.toString(),
      ...(isRoundTrip && returnDate && { returnDate: returnDate.toISOString(), returnTime }),
      ...(vehicleType && { vehicleType }),
    });

    navigate(`/transfer-results?${searchParams.toString()}`);
  };

  const handleChildrenChange = (newChildren: number) => {
    const currentAges = passengers.childrenAges;
    if (newChildren > currentAges.length) {
      // Add default ages for new children
      const newAges = [...currentAges];
      for (let i = currentAges.length; i < newChildren; i++) {
        newAges.push(10);
      }
      setPassengers({ ...passengers, children: newChildren, childrenAges: newAges });
    } else {
      // Remove ages for removed children
      setPassengers({ 
        ...passengers, 
        children: newChildren, 
        childrenAges: currentAges.slice(0, newChildren) 
      });
    }
  };

  return (
    <div className="mx-auto">
      {showError && (
        <ErrorBanner
          message={errorMessage}
          onClose={() => {
            setShowError(false);
            setErrorMessage("");
          }}
        />
      )}

      {/* Mobile Design */}
      <div className="md:hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          {/* Trip Type Toggle */}
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!isRoundTrip}
                onChange={() => setIsRoundTrip(false)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium">One way</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={isRoundTrip}
                onChange={() => setIsRoundTrip(true)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium">Round trip</span>
            </label>
          </div>

          {/* Pickup Location */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Pickup location"
              value={pickupLocation}
              onChange={(e) => {
                setPickupLocation(e.target.value);
                setIsPickupOpen(true);
              }}
              onFocus={() => setIsPickupOpen(true)}
              className="pl-10"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            {isPickupOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {filterDestinations(pickupLocation).map((dest) => (
                  <button
                    key={dest.id}
                    onClick={() => {
                      setPickupLocation(dest.name);
                      setIsPickupOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{dest.name}</div>
                    <div className="text-sm text-gray-500">{dest.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Same as pickup toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-as-pickup"
              checked={sameAsPickup}
              onCheckedChange={(checked) => setSameAsPickup(!!checked)}
            />
            <label htmlFor="same-as-pickup" className="text-sm">
              Drop-off at same location
            </label>
          </div>

          {/* Drop-off Location */}
          {!sameAsPickup && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Drop-off location"
                value={dropoffLocation}
                onChange={(e) => {
                  setDropoffLocation(e.target.value);
                  setIsDropoffOpen(true);
                }}
                onFocus={() => setIsDropoffOpen(true)}
                className="pl-10"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              {isDropoffOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filterDestinations(dropoffLocation).map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => {
                        setDropoffLocation(dest.name);
                        setIsDropoffOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{dest.name}</div>
                      <div className="text-sm text-gray-500">{dest.type}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
              <Button
                variant="outline"
                onClick={() => setShowMobileDatePicker(true)}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {pickupDate ? format(pickupDate, "MMM dd") : "Select date"}
              </Button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Return Date and Time (if round trip) */}
          {isRoundTrip && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                <Button
                  variant="outline"
                  onClick={() => setShowMobileDatePicker(true)}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {returnDate ? format(returnDate, "MMM dd") : "Select date"}
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                <Select value={returnTime} onValueChange={setReturnTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Passengers */}
          <Popover open={isPassengerPopoverOpen} onOpenChange={setIsPassengerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Users className="mr-2 h-4 w-4" />
                {passengersText}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Adults</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPassengers({ ...passengers, adults: Math.max(1, passengers.adults - 1) })}
                      disabled={passengers.adults <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{passengers.adults}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPassengers({ ...passengers, adults: passengers.adults + 1 })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Children (2-11 years)</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChildrenChange(Math.max(0, passengers.children - 1))}
                      disabled={passengers.children <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{passengers.children}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChildrenChange(passengers.children + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Infants (0-2 years)</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPassengers({ ...passengers, infants: Math.max(0, passengers.infants - 1) })}
                      disabled={passengers.infants <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{passengers.infants}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPassengers({ ...passengers, infants: passengers.infants + 1 })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Vehicle Type */}
          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger>
              <Car className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Vehicle type (optional)" />
            </SelectTrigger>
            <SelectContent>
              {transferOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="w-full bg-[#003580] hover:bg-[#0071c2] text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Transfers
          </Button>
        </div>
      </div>

      {/* Desktop Design */}
      <div className="hidden md:block">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Trip Type Toggle */}
          <div className="flex items-center space-x-6 mb-6">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!isRoundTrip}
                onChange={() => setIsRoundTrip(false)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium">One way</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={isRoundTrip}
                onChange={() => setIsRoundTrip(true)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium">Round trip</span>
            </label>
          </div>

          {/* Desktop Form Grid */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            {/* Pickup Location */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Pickup location"
                  value={pickupLocation}
                  onChange={(e) => {
                    setPickupLocation(e.target.value);
                    setIsPickupOpen(true);
                  }}
                  onFocus={() => setIsPickupOpen(true)}
                  className="pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {isPickupOpen && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filterDestinations(pickupLocation).map((dest) => (
                      <button
                        key={dest.id}
                        onClick={() => {
                          setPickupLocation(dest.name);
                          setIsPickupOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{dest.name}</div>
                        <div className="text-sm text-gray-500">{dest.type}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drop-off Location */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Drop-off location"
                  value={sameAsPickup ? pickupLocation : dropoffLocation}
                  onChange={(e) => {
                    if (!sameAsPickup) {
                      setDropoffLocation(e.target.value);
                      setIsDropoffOpen(true);
                    }
                  }}
                  onFocus={() => !sameAsPickup && setIsDropoffOpen(true)}
                  disabled={sameAsPickup}
                  className="pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {isDropoffOpen && !sameAsPickup && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filterDestinations(dropoffLocation).map((dest) => (
                      <button
                        key={dest.id}
                        onClick={() => {
                          setDropoffLocation(dest.name);
                          setIsDropoffOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{dest.name}</div>
                        <div className="text-sm text-gray-500">{dest.type}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pickup Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pickupDate ? format(pickupDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <BookingCalendar
                    mode="single"
                    selected={pickupDate}
                    onSelect={setPickupDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Pickup Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
              <Popover open={isPassengerPopoverOpen} onOpenChange={setIsPassengerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Users className="mr-2 h-4 w-4" />
                    {passengersText}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Adults</label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPassengers({ ...passengers, adults: Math.max(1, passengers.adults - 1) })}
                          disabled={passengers.adults <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{passengers.adults}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPassengers({ ...passengers, adults: passengers.adults + 1 })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Children (2-11 years)</label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChildrenChange(Math.max(0, passengers.children - 1))}
                          disabled={passengers.children <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{passengers.children}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChildrenChange(passengers.children + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Infants (0-2 years)</label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPassengers({ ...passengers, infants: Math.max(0, passengers.infants - 1) })}
                          disabled={passengers.infants <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{passengers.infants}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPassengers({ ...passengers, infants: passengers.infants + 1 })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Return trip row (if round trip) */}
          {isRoundTrip && (
            <div className="grid grid-cols-5 gap-4 mb-4">
              <div></div> {/* Empty space */}
              <div></div> {/* Empty space */}
              
              {/* Return Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <BookingCalendar
                      mode="single"
                      selected={returnDate}
                      onSelect={setReturnDate}
                      disabled={(date) => date < new Date() || (pickupDate && date <= pickupDate)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Return Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                <Select value={returnTime} onValueChange={setReturnTime}>
                  <SelectTrigger>
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div></div> {/* Empty space */}
            </div>
          )}

          {/* Additional Options */}
          <div className="flex items-center space-x-6 mb-6">
            {/* Same as pickup checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="same-as-pickup-desktop"
                checked={sameAsPickup}
                onCheckedChange={(checked) => setSameAsPickup(!!checked)}
              />
              <label htmlFor="same-as-pickup-desktop" className="text-sm">
                Drop-off at same location
              </label>
            </div>

            {/* Vehicle Type */}
            <div className="flex-1 max-w-xs">
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger>
                  <Car className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Vehicle type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {transferOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="bg-[#003580] hover:bg-[#0071c2] text-white px-8 py-3"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Transfers
          </Button>
        </div>
      </div>

      {/* Mobile Date Picker */}
      {showMobileDatePicker && (
        <MobileDatePicker
          isOpen={showMobileDatePicker}
          onClose={() => setShowMobileDatePicker(false)}
          tripType={isRoundTrip ? "round-trip" : "one-way"}
          setTripType={(type: string) => setIsRoundTrip(type === "round-trip")}
          selectedDepartureDate={pickupDate}
          selectedReturnDate={returnDate}
          setSelectedDepartureDate={setPickupDate}
          setSelectedReturnDate={setReturnDate}
          selectingDeparture={true}
          setSelectingDeparture={() => {}}
          bookingType="transfers"
        />
      )}
    </div>
  );
}
