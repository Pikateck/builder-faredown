import React, { useState, useEffect } from "react";
import { Clock, X, Plane, MapPin, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

interface RecentSearch {
  id: number;
  module: string;
  query: any;
  created_at: string;
  updated_at: string;
}

interface RecentSearchesProps {
  module:
    | "flights"
    | "hotels"
    | "flight_hotel"
    | "cars"
    | "activities"
    | "taxis"
    | "sightseeing"
    | "transfers";
  onSearchClick: (searchData: any) => void;
  className?: string;
}

// Utility function to save searches to localStorage when API is unavailable
export const saveRecentSearchToLocalStorage = (
  module: string,
  searchData: any,
) => {
  try {
    const key = `faredown_recent_searches_${module}`;
    const existing = localStorage.getItem(key);
    let searches = [];

    if (existing) {
      searches = JSON.parse(existing);
    }

    // Add new search with timestamp
    const newSearch = {
      ...searchData,
      timestamp: new Date().toISOString(),
    };

    // Remove duplicates and add to front
    searches = searches.filter(
      (s: any) => JSON.stringify(s) !== JSON.stringify(searchData),
    );
    searches.unshift(newSearch);

    // Keep only last 6 searches
    searches = searches.slice(0, 6);

    localStorage.setItem(key, JSON.stringify(searches));
    console.log(`💾 Saved search to localStorage for ${module}`);
    return true;
  } catch (err) {
    console.error("Error saving to localStorage:", err);
    return false;
  }
};

export function RecentSearches({
  module,
  onSearchClick,
  className = "",
}: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent searches on component mount with retry
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 1; // Reduced retries since we have localStorage fallback

    const fetchWithRetry = async () => {
      try {
        await fetchRecentSearches();
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Retrying recent searches fetch (${retryCount}/${maxRetries})`,
          );
          setTimeout(fetchWithRetry, 1000 * retryCount); // Exponential backoff
        } else {
          // All retries failed, use localStorage fallback
          console.warn("All retries failed, using localStorage fallback");
          loadFromLocalStorage();
        }
      }
    };

    fetchWithRetry();
  }, [module]);

  // Save search to localStorage as backup
  const saveToLocalStorage = (searchData: any) => {
    try {
      const key = `faredown_recent_searches_${module}`;
      const existing = localStorage.getItem(key);
      let searches = [];

      if (existing) {
        searches = JSON.parse(existing);
      }

      // Add new search with timestamp
      const newSearch = {
        ...searchData,
        timestamp: new Date().toISOString(),
      };

      // Remove duplicates and add to front
      searches = searches.filter(
        (s: any) => JSON.stringify(s) !== JSON.stringify(searchData),
      );
      searches.unshift(newSearch);

      // Keep only last 6 searches
      searches = searches.slice(0, 6);

      localStorage.setItem(key, JSON.stringify(searches));
      console.log(`💾 Saved search to localStorage for ${module}`);
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
  };

  const fetchRecentSearches = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if API server is reachable
      const healthResponse = await fetch("/health", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!healthResponse.ok) {
        console.warn(
          "API server health check failed, falling back to local storage",
        );
        loadFromLocalStorage();
        return;
      }

      const response = await fetch(
        `/api/recent-searches?module=${module}&limit=6`,
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 404) {
          console.warn(
            "Recent searches API endpoint not found, falling back to local storage",
          );
          loadFromLocalStorage();
          return;
        } else if (response.status >= 500) {
          console.warn("Server error, falling back to local storage");
          loadFromLocalStorage();
          return;
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log("📋 Fetched recent searches from API:", data.length, "items");
      setRecentSearches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching recent searches:", err);

      // Handle network errors gracefully - fall back to localStorage
      if (err instanceof TypeError && err.message.includes("fetch")) {
        console.warn("Network error, falling back to local storage");
        loadFromLocalStorage();
      } else {
        console.warn("API error, falling back to local storage");
        loadFromLocalStorage();
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback function to load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(`faredown_recent_searches_${module}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          console.log(
            "📋 Loaded recent searches from localStorage:",
            parsed.length,
            "items",
          );
          // Transform localStorage format to match API format
          const transformed = parsed.map((item, index) => ({
            id: index + 1,
            module,
            query: item,
            created_at: item.timestamp || new Date().toISOString(),
            updated_at: item.timestamp || new Date().toISOString(),
          }));
          setRecentSearches(transformed.slice(0, 6));
          return;
        }
      }
    } catch (err) {
      console.error("Error loading from localStorage:", err);
    }

    // Final fallback - empty array
    setRecentSearches([]);
  };

  const deleteRecentSearch = async (
    searchId: number,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    // First remove from UI immediately for better UX
    const searchToDelete = recentSearches.find((s) => s.id === searchId);
    setRecentSearches((prev) =>
      prev.filter((search) => search.id !== searchId),
    );

    try {
      // Try to delete from API
      const response = await fetch(`/api/recent-searches/${searchId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (response.ok || response.status === 204 || response.status === 404) {
        console.log("✅ Successfully deleted from API");
      } else {
        console.warn("API delete failed, will update localStorage");
      }
    } catch (err) {
      console.warn("API delete failed, will update localStorage:", err);
    }

    // Always update localStorage regardless of API success/failure
    try {
      if (searchToDelete) {
        const key = `faredown_recent_searches_${module}`;
        const existing = localStorage.getItem(key);
        if (existing) {
          let searches = JSON.parse(existing);
          searches = searches.filter(
            (s: any) =>
              JSON.stringify(s) !== JSON.stringify(searchToDelete.query),
          );
          localStorage.setItem(key, JSON.stringify(searches));
          console.log("💾 Updated localStorage after delete");
        }
      }
    } catch (err) {
      console.error("Error updating localStorage:", err);
    }
  };

  const formatFlightSearch = (query: any) => {
    const from = query.from?.name || query.from?.code || "Unknown";
    const to = query.to?.name || query.to?.code || "Unknown";
    const dates = query.dates;
    const adults = query.adults || 1;
    const children = query.children || 0;

    let dateStr = "";
    if (dates?.depart) {
      const departDate = new Date(dates.depart);
      dateStr = format(departDate, "dd MMM");

      if (dates.return && query.tripType === "round_trip") {
        const returnDate = new Date(dates.return);
        dateStr += ` – ${format(returnDate, "dd MMM")}`;
      }
    }

    let travelers = `${adults} adult${adults > 1 ? "s" : ""}`;
    if (children > 0) {
      travelers += `, ${children} child${children > 1 ? "ren" : ""}`;
    }

    return {
      title: `${from} → ${to}`,
      subtitle: `${dateStr} · ${travelers}`,
      icon: <Plane className="w-4 h-4 text-blue-600" />,
    };
  };

  const formatHotelSearch = (query: any) => {
    const destination = query.destination?.name || "Unknown destination";
    const dates = query.dates;
    const rooms = query.rooms || [{ adults: 2, children: 0 }];

    let dateStr = "";
    if (dates?.checkin && dates?.checkout) {
      const checkinDate = new Date(dates.checkin);
      const checkoutDate = new Date(dates.checkout);
      dateStr = `${format(checkinDate, "dd MMM")} – ${format(checkoutDate, "dd MMM")}`;
    }

    const totalAdults = rooms.reduce(
      (sum: number, room: any) => sum + (room.adults || 0),
      0,
    );
    const roomCount = rooms.length;

    return {
      title: destination,
      subtitle: `${dateStr} · ${totalAdults} adult${totalAdults > 1 ? "s" : ""} · ${roomCount} room${roomCount > 1 ? "s" : ""}`,
      icon: <MapPin className="w-4 h-4 text-green-600" />,
    };
  };

  const formatSearchDisplay = (search: RecentSearch) => {
    switch (search.module) {
      case "flights":
        return formatFlightSearch(search.query);
      case "hotels":
        return formatHotelSearch(search.query);
      default:
        return {
          title: `${search.module} search`,
          subtitle: "Recent search",
          icon: <Clock className="w-4 h-4 text-gray-600" />,
        };
    }
  };

  // ONLY render if we have actual searches to display - never show loading states for blank initial state
  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Your recent searches
        </h3>
      </div>

      <div className="space-y-2">
        {recentSearches.map((search) => {
          const { title, subtitle, icon } = formatSearchDisplay(search);

          return (
            <div
              key={search.id}
              onClick={() => onSearchClick(search.query)}
              className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {icon}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {title}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {subtitle}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => deleteRecentSearch(search.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-full transition-all"
                title="Remove from recent searches"
              >
                <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
