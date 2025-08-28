import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  Hotel,
  Building,
  MapPin,
  Landmark,
  Plane,
  ArrowLeft,
} from "lucide-react";
import { searchHotels, getTypeLabel, type SearchResult } from "@/lib/hotelSearchData";

interface MobileHotelSmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
  initialValue?: string;
}

export function MobileHotelSmartSearch({
  isOpen,
  onClose,
  onSelect,
  initialValue = "",
}: MobileHotelSmartSearchProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Update search results when input changes
  useEffect(() => {
    if (inputValue.trim()) {
      setIsSearching(true);
      const results = searchHotels(inputValue, 12);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      // Show popular destinations when not searching
      const results = searchHotels("", 8);
      setSearchResults(results);
    }
  }, [inputValue]);

  // Initialize results on open
  useEffect(() => {
    if (isOpen) {
      const results = searchHotels(inputValue || "", 8);
      setSearchResults(results);
    }
  }, [isOpen, inputValue]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'hotel':
        return <Hotel className="w-5 h-5 text-blue-600" />;
      case 'city':
        return <Building className="w-5 h-5 text-green-600" />;
      case 'area':
        return <MapPin className="w-5 h-5 text-purple-600" />;
      case 'landmark':
        return <Landmark className="w-5 h-5 text-orange-600" />;
      case 'airport':
        return <Plane className="w-5 h-5 text-gray-600" />;
      default:
        return <MapPin className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'hotel':
        return 'bg-blue-50';
      case 'city':
        return 'bg-green-50';
      case 'area':
        return 'bg-purple-50';
      case 'landmark':
        return 'bg-orange-50';
      case 'airport':
        return 'bg-gray-50';
      default:
        return 'bg-blue-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="bg-[#003580] text-white p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Where are you going?</h1>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search hotels, cities, landmarks..."
            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#003580] text-base"
            autoFocus
          />
          {inputValue && (
            <button
              onClick={() => setInputValue("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {inputValue.trim() ? `Search results for "${inputValue}"` : 'Popular destinations'}
          </h3>

          {isSearching ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003580]"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    onSelect(result);
                    onClose();
                  }}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-[#003580] hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${getIconBg(result.type)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {result.name}
                        </h4>
                        {result.rating && (
                          <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                            <span className="text-yellow-600 text-xs">⭐</span>
                            <span className="text-yellow-700 font-medium text-xs">
                              {result.rating}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {getTypeLabel(result.type)} • {result.description}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {result.location}
                      </p>
                    </div>
                    {result.type === 'hotel' && (
                      <div className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-lg">
                        Hotel
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No results found
              </h3>
              <p className="text-gray-500">
                Try searching for hotels, cities, or landmarks
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setInputValue("Dubai")}
            className="p-3 bg-white rounded-lg border border-gray-200 text-center hover:border-[#003580] transition-colors"
          >
            <div className="text-xs font-medium text-gray-900">Dubai</div>
          </button>
          <button
            onClick={() => setInputValue("Mumbai")}
            className="p-3 bg-white rounded-lg border border-gray-200 text-center hover:border-[#003580] transition-colors"
          >
            <div className="text-xs font-medium text-gray-900">Mumbai</div>
          </button>
          <button
            onClick={() => setInputValue("London")}
            className="p-3 bg-white rounded-lg border border-gray-200 text-center hover:border-[#003580] transition-colors"
          >
            <div className="text-xs font-medium text-gray-900">London</div>
          </button>
          <button
            onClick={() => setInputValue("Tokyo")}
            className="p-3 bg-white rounded-lg border border-gray-200 text-center hover:border-[#003580] transition-colors"
          >
            <div className="text-xs font-medium text-gray-900">Tokyo</div>
          </button>
        </div>
      </div>
    </div>
  );
}
