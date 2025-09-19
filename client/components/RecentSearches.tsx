import React, { useState, useEffect } from 'react';
import { Clock, X, Plane, MapPin, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

interface RecentSearch {
  id: number;
  module: string;
  query: any;
  created_at: string;
  updated_at: string;
}

interface RecentSearchesProps {
  module: 'flights' | 'hotels' | 'flight_hotel' | 'cars' | 'activities' | 'taxis' | 'sightseeing' | 'transfers';
  onSearchClick: (searchData: any) => void;
  className?: string;
}

export function RecentSearches({ module, onSearchClick, className = '' }: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent searches on component mount with retry
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 2;

    const fetchWithRetry = async () => {
      try {
        await fetchRecentSearches();
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying recent searches fetch (${retryCount}/${maxRetries})`);
          setTimeout(fetchWithRetry, 1000 * retryCount); // Exponential backoff
        }
      }
    };

    fetchWithRetry();
  }, [module]);

  const fetchRecentSearches = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recent-searches?module=${module}&limit=6`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 404) {
          console.warn('Recent searches API not available');
          setRecentSearches([]);
          return;
        } else if (response.status >= 500) {
          throw new Error('Server error - please try again later');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('📋 Fetched recent searches:', data.length, 'items');
      setRecentSearches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching recent searches:', err);

      // Handle network errors gracefully
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to server');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load recent searches');
      }

      // Set empty array as fallback
      setRecentSearches([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecentSearch = async (searchId: number, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      const response = await fetch(`/api/recent-searches/${searchId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok || response.status === 204) {
        // Remove from local state
        setRecentSearches(prev => prev.filter(search => search.id !== searchId));
      } else if (response.status === 404) {
        // Item already deleted, just remove from UI
        setRecentSearches(prev => prev.filter(search => search.id !== searchId));
      } else {
        console.error('Failed to delete recent search:', response.status);
      }
    } catch (err) {
      console.error('Error deleting recent search:', err);
      // Don't show error to user for delete operations
    }
  };

  const formatFlightSearch = (query: any) => {
    const from = query.from?.name || query.from?.code || 'Unknown';
    const to = query.to?.name || query.to?.code || 'Unknown';
    const dates = query.dates;
    const adults = query.adults || 1;
    const children = query.children || 0;
    
    let dateStr = '';
    if (dates?.depart) {
      const departDate = new Date(dates.depart);
      dateStr = format(departDate, 'dd MMM');
      
      if (dates.return && query.tripType === 'round_trip') {
        const returnDate = new Date(dates.return);
        dateStr += ` – ${format(returnDate, 'dd MMM')}`;
      }
    }

    let travelers = `${adults} adult${adults > 1 ? 's' : ''}`;
    if (children > 0) {
      travelers += `, ${children} child${children > 1 ? 'ren' : ''}`;
    }

    return {
      title: `${from} → ${to}`,
      subtitle: `${dateStr} · ${travelers}`,
      icon: <Plane className="w-4 h-4 text-blue-600" />
    };
  };

  const formatHotelSearch = (query: any) => {
    const destination = query.destination?.name || 'Unknown destination';
    const dates = query.dates;
    const rooms = query.rooms || [{ adults: 2, children: 0 }];
    
    let dateStr = '';
    if (dates?.checkin && dates?.checkout) {
      const checkinDate = new Date(dates.checkin);
      const checkoutDate = new Date(dates.checkout);
      dateStr = `${format(checkinDate, 'dd MMM')} – ${format(checkoutDate, 'dd MMM')}`;
    }

    const totalAdults = rooms.reduce((sum: number, room: any) => sum + (room.adults || 0), 0);
    const roomCount = rooms.length;

    return {
      title: destination,
      subtitle: `${dateStr} · ${totalAdults} adult${totalAdults > 1 ? 's' : ''} · ${roomCount} room${roomCount > 1 ? 's' : ''}`,
      icon: <MapPin className="w-4 h-4 text-green-600" />
    };
  };

  const formatSearchDisplay = (search: RecentSearch) => {
    switch (search.module) {
      case 'flights':
        return formatFlightSearch(search.query);
      case 'hotels':
        return formatHotelSearch(search.query);
      default:
        return {
          title: `${search.module} search`,
          subtitle: 'Recent search',
          icon: <Clock className="w-4 h-4 text-gray-600" />
        };
    }
  };

  // Don't render if no searches and not loading
  if (!loading && recentSearches.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Your recent searches</h3>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-gray-500 py-4">
          Unable to load recent searches
        </div>
      )}

      {!loading && !error && recentSearches.length > 0 && (
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
      )}
    </div>
  );
}
