import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";

// Unified search parameters that work across all modules
export interface UnifiedSearchParams {
  // Common fields for all modules
  destination: string;
  destinationCode: string;
  destinationName: string;
  
  // Dates (using both naming conventions for compatibility)
  departureDate: string;
  returnDate?: string;
  checkIn: string;
  checkOut: string;
  
  // Trip/booking type
  tripType: "one-way" | "round-trip" | "multi-city";
  module: "hotels" | "flights" | "sightseeing" | "transfers";
  
  // Travelers/Guests
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  guests: {
    adults: number;
    children: number;
  };
  rooms: number;
  
  // Flight-specific
  class?: "economy" | "premium-economy" | "business" | "first";
  
  // Hotel-specific  
  nights?: number;
  
  // Transfers-specific
  transferType?: "airport-hotel" | "hotel-airport" | "city-transfer";
  
  // Metadata
  searchId?: string;
  searchTimestamp?: string;
}

interface SearchContextType {
  searchParams: UnifiedSearchParams;
  updateSearchParams: (params: Partial<UnifiedSearchParams>) => void;
  loadFromUrlParams: (urlParams: URLSearchParams) => void;
  loadFromBookingData: (booking: any) => void;
  getDisplayData: () => {
    destination: string;
    checkIn: string;
    checkOut: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    rooms: number;
    nights: number;
    totalGuests: number;
  };
  generateUrlParams: () => URLSearchParams;
  clearSearchParams: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const initialSearchParams: UnifiedSearchParams = {
  destination: "",
  destinationCode: "",
  destinationName: "",
  departureDate: "",
  checkIn: "",
  checkOut: "",
  tripType: "round-trip",
  module: "hotels",
  passengers: {
    adults: 2,
    children: 0,
    infants: 0,
  },
  guests: {
    adults: 2,
    children: 0,
  },
  rooms: 1,
  searchTimestamp: new Date().toISOString(),
};

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useState<UnifiedSearchParams>(() => {
    // Try to restore from localStorage
    try {
      const saved = localStorage.getItem("faredown_search_params");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialSearchParams, ...parsed };
      }
    } catch (error) {
      console.warn("Failed to restore search params:", error);
    }
    return initialSearchParams;
  });

  const location = useLocation();
  const [urlParams] = useSearchParams();

  // Save to localStorage whenever search params change
  useEffect(() => {
    try {
      localStorage.setItem("faredown_search_params", JSON.stringify(searchParams));
    } catch (error) {
      console.warn("Failed to save search params:", error);
    }
  }, [searchParams]);

  // Auto-load from URL params when location changes
  useEffect(() => {
    if (urlParams.toString()) {
      loadFromUrlParams(urlParams);
    }
  }, [location.search]);

  const updateSearchParams = React.useCallback((params: Partial<UnifiedSearchParams>) => {
    setSearchParams((prev) => {
      const updated = { ...prev, ...params };

      // Sync dates between different naming conventions
      if (params.departureDate) {
        updated.checkIn = params.departureDate;
      }
      if (params.checkIn) {
        updated.departureDate = params.checkIn;
      }
      if (params.returnDate) {
        updated.checkOut = params.returnDate;
      }
      if (params.checkOut) {
        updated.returnDate = params.checkOut;
      }

      // Sync guests/passengers
      if (params.passengers) {
        updated.guests = {
          adults: params.passengers.adults,
          children: params.passengers.children,
        };
      }
      if (params.guests) {
        updated.passengers = {
          adults: params.guests.adults,
          children: params.guests.children,
          infants: updated.passengers.infants,
        };
      }

      // Calculate nights if dates are available
      if (updated.checkIn && updated.checkOut) {
        const checkInDate = new Date(updated.checkIn);
        const checkOutDate = new Date(updated.checkOut);
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        updated.nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      return updated;
    });
  }, []);

  const loadFromUrlParams = React.useCallback((urlParams: URLSearchParams) => {
    const newParams: Partial<UnifiedSearchParams> = {};

    // Location/Destination
    if (urlParams.get("destination")) newParams.destination = urlParams.get("destination")!;
    if (urlParams.get("destinationCode")) newParams.destinationCode = urlParams.get("destinationCode")!;
    if (urlParams.get("destinationName")) newParams.destinationName = urlParams.get("destinationName")!;
    if (urlParams.get("from")) newParams.destination = urlParams.get("from")!;
    if (urlParams.get("to")) newParams.destination = urlParams.get("to")!;

    // Dates (support both naming conventions)
    if (urlParams.get("departureDate")) {
      newParams.departureDate = urlParams.get("departureDate")!;
      newParams.checkIn = urlParams.get("departureDate")!;
    }
    if (urlParams.get("checkIn")) {
      newParams.checkIn = urlParams.get("checkIn")!;
      newParams.departureDate = urlParams.get("checkIn")!;
    }
    if (urlParams.get("returnDate")) {
      newParams.returnDate = urlParams.get("returnDate")!;
      newParams.checkOut = urlParams.get("returnDate")!;
    }
    if (urlParams.get("checkOut")) {
      newParams.checkOut = urlParams.get("checkOut")!;
      newParams.returnDate = urlParams.get("checkOut")!;
    }

    // Trip type
    if (urlParams.get("tripType")) {
      newParams.tripType = urlParams.get("tripType") as "one-way" | "round-trip" | "multi-city";
    }

    // Module detection from URL path
    const path = window.location.pathname;
    if (path.includes("/hotels")) newParams.module = "hotels";
    else if (path.includes("/flights")) newParams.module = "flights";
    else if (path.includes("/sightseeing")) newParams.module = "sightseeing";
    else if (path.includes("/transfers")) newParams.module = "transfers";

    // Travelers/Guests
    const adults = parseInt(urlParams.get("adults") || "2");
    const children = parseInt(urlParams.get("children") || "0");
    const infants = parseInt(urlParams.get("infants") || "0");
    const rooms = parseInt(urlParams.get("rooms") || "1");

    newParams.passengers = { adults, children, infants };
    newParams.guests = { adults, children };
    newParams.rooms = rooms;

    // Class for flights
    if (urlParams.get("class")) {
      newParams.class = urlParams.get("class") as any;
    }

    // Transfer type
    if (urlParams.get("transferType")) {
      newParams.transferType = urlParams.get("transferType") as any;
    }

    updateSearchParams(newParams);
  }, [updateSearchParams]);

  const loadFromBookingData = (booking: any) => {
    if (!booking) return;

    const newParams: Partial<UnifiedSearchParams> = {};

    // Handle hotel booking data
    if (booking.checkIn) {
      newParams.checkIn = booking.checkIn;
      newParams.departureDate = booking.checkIn;
    }
    if (booking.checkOut) {
      newParams.checkOut = booking.checkOut;
      newParams.returnDate = booking.checkOut;
    }
    if (booking.hotel?.location || booking.hotel?.name) {
      newParams.destination = booking.hotel.location || booking.hotel.name;
      newParams.destinationName = booking.hotel.location || booking.hotel.name;
    }
    if (booking.guests) newParams.guests = { adults: booking.guests, children: 0 };
    if (booking.rooms) newParams.rooms = booking.rooms;
    if (booking.nights) newParams.nights = booking.nights;

    // Handle flight booking data
    if (booking.departureDate) {
      newParams.departureDate = booking.departureDate;
      newParams.checkIn = booking.departureDate;
    }
    if (booking.returnDate) {
      newParams.returnDate = booking.returnDate;
      newParams.checkOut = booking.returnDate;
    }
    if (booking.route?.from) newParams.destination = booking.route.from;
    if (booking.passengers) {
      newParams.passengers = booking.passengers;
      newParams.guests = {
        adults: booking.passengers.adults || booking.passengers.total || 2,
        children: booking.passengers.children || 0,
      };
    }

    // Handle search params from booking context
    if (booking.searchParams) {
      if (booking.searchParams.from) newParams.destination = booking.searchParams.from;
      if (booking.searchParams.to && !newParams.destination) newParams.destination = booking.searchParams.to;
      if (booking.searchParams.departureDate) {
        newParams.departureDate = booking.searchParams.departureDate;
        newParams.checkIn = booking.searchParams.departureDate;
      }
      if (booking.searchParams.returnDate) {
        newParams.returnDate = booking.searchParams.returnDate;
        newParams.checkOut = booking.searchParams.returnDate;
      }
      if (booking.searchParams.passengers) {
        newParams.passengers = booking.searchParams.passengers;
        newParams.guests = {
          adults: booking.searchParams.passengers.adults,
          children: booking.searchParams.passengers.children,
        };
      }
    }

    updateSearchParams(newParams);
  };

  const getDisplayData = React.useCallback(() => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      try {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, "0");
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      } catch (error) {
        return dateStr;
      }
    };

    const totalGuests = searchParams.guests.adults + searchParams.guests.children;
    const nights = searchParams.nights || 
      (searchParams.checkIn && searchParams.checkOut 
        ? Math.ceil((new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) / (1000 * 3600 * 24))
        : 1);

    return {
      destination: searchParams.destinationName || searchParams.destination || "Dubai",
      checkIn: formatDate(searchParams.checkIn),
      checkOut: formatDate(searchParams.checkOut),
      departureDate: formatDate(searchParams.departureDate),
      returnDate: searchParams.returnDate ? formatDate(searchParams.returnDate) : undefined,
      adults: searchParams.guests.adults,
      children: searchParams.guests.children,
      rooms: searchParams.rooms,
      nights,
      totalGuests,
    };
  }, [searchParams]);

  const generateUrlParams = React.useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchParams.destination) params.set("destination", searchParams.destination);
    if (searchParams.destinationName) params.set("destinationName", searchParams.destinationName);
    if (searchParams.destinationCode) params.set("destinationCode", searchParams.destinationCode);
    
    if (searchParams.departureDate) params.set("departureDate", searchParams.departureDate);
    if (searchParams.checkIn) params.set("checkIn", searchParams.checkIn);
    if (searchParams.returnDate) params.set("returnDate", searchParams.returnDate);
    if (searchParams.checkOut) params.set("checkOut", searchParams.checkOut);
    
    params.set("adults", searchParams.guests.adults.toString());
    params.set("children", searchParams.guests.children.toString());
    params.set("rooms", searchParams.rooms.toString());
    
    if (searchParams.passengers.infants > 0) {
      params.set("infants", searchParams.passengers.infants.toString());
    }
    
    if (searchParams.tripType) params.set("tripType", searchParams.tripType);
    if (searchParams.class) params.set("class", searchParams.class);
    if (searchParams.transferType) params.set("transferType", searchParams.transferType);
    
    return params;
  }, [searchParams]);

  const clearSearchParams = React.useCallback(() => {
    setSearchParams(initialSearchParams);
    localStorage.removeItem("faredown_search_params");
  }, []);

  const contextValue: SearchContextType = {
    searchParams,
    updateSearchParams,
    loadFromUrlParams,
    loadFromBookingData,
    getDisplayData,
    generateUrlParams,
    clearSearchParams,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
