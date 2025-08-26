import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft,
  Search, 
  Star, 
  Plane,
  Clock,
  TrendingUp,
  X,
  MapPin
} from "lucide-react";

interface Airport {
  code: string;
  city: string;
  country: string;
  airport: string;
  popular?: boolean;
  trending?: boolean;
}

interface MobileFullScreenCityInputProps {
  title: string;
  placeholder: string;
  selectedValue: string;
  onSelect: (city: string, code: string) => void;
  onBack: () => void;
  cities: Record<string, Airport>;
  recentSearches?: string[];
}

export function MobileFullScreenCityInput({
  title,
  placeholder,
  selectedValue,
  onSelect,
  onBack,
  cities,
  recentSearches = []
}: MobileFullScreenCityInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] = useState<Airport[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Convert cities object to array
  const citiesArray = Object.values(cities);

  // Popular cities
  const popularCities = [
    { code: "BOM", city: "Mumbai", country: "India", airport: "Chhatrapati Shivaji Intl", popular: true },
    { code: "DEL", city: "New Delhi", country: "India", airport: "Indira Gandhi Intl", popular: true },
    { code: "DXB", city: "Dubai", country: "UAE", airport: "Dubai International", popular: true },
    { code: "LHR", city: "London", country: "UK", airport: "Heathrow", popular: true },
    { code: "JFK", city: "New York", country: "USA", airport: "John F Kennedy Intl", popular: true },
    { code: "SIN", city: "Singapore", country: "Singapore", airport: "Changi", popular: true },
  ];

  // Trending cities
  const trendingCities = [
    { code: "CDG", city: "Paris", country: "France", airport: "Charles de Gaulle", trending: true },
    { code: "BKK", city: "Bangkok", country: "Thailand", airport: "Suvarnabhumi", trending: true },
    { code: "AMS", city: "Amsterdam", country: "Netherlands", airport: "Schiphol", trending: true },
    { code: "FRA", city: "Frankfurt", country: "Germany", airport: "Frankfurt am Main", trending: true },
  ];

  // Auto-focus input when component mounts (native behavior)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Filter cities based on search query
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setFilteredCities([]);
    } else {
      const filtered = citiesArray.filter(city =>
        city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.airport.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered.slice(0, 20));
    }
  }, [searchQuery, citiesArray]);

  const handleCitySelect = (city: Airport) => {
    onSelect(city.city, city.code);
    onBack();
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Native App Header */}
      <div className="bg-[#003580] text-white px-4 py-3 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-12 pr-10 h-12 bg-gray-50 border-gray-200 rounded-xl text-base focus:bg-white focus:border-[#003580] transition-all"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {!searchQuery ? (
          <div className="p-4">
            {/* Popular Destinations */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="w-5 h-5 text-[#febb02]" />
                <h2 className="text-lg font-semibold text-gray-900">Popular Destinations</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {popularCities.map((city) => (
                  <button
                    key={city.code}
                    onClick={() => handleCitySelect(city)}
                    className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#003580] hover:bg-blue-50 transition-all shadow-sm"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-xl flex items-center justify-center shadow-md">
                      <Plane className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 text-base">{city.city}</div>
                      <div className="text-sm text-gray-600">{city.airport}</div>
                      <div className="text-xs text-gray-500">{city.country}</div>
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-lg">
                      <span className="text-sm font-mono text-gray-700">{city.code}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Destinations */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">Trending Now</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {trendingCities.map((city) => (
                  <button
                    key={city.code}
                    onClick={() => handleCitySelect(city)}
                    className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all shadow-sm"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 text-base">{city.city}</div>
                      <div className="text-sm text-gray-600">{city.airport}</div>
                      <div className="text-xs text-gray-500">{city.country}</div>
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-lg">
                      <span className="text-sm font-mono text-gray-700">{city.code}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Recent Searches</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const city = popularCities.find(c => c.city === search);
                        if (city) handleCitySelect(city);
                      }}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">{search}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Search Results
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results ({filteredCities.length})
            </h2>
            {filteredCities.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {filteredCities.map((city) => (
                  <button
                    key={city.code}
                    onClick={() => handleCitySelect(city)}
                    className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#003580] hover:bg-blue-50 transition-all shadow-sm"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 text-base">{city.city}</div>
                      <div className="text-sm text-gray-600">{city.airport}</div>
                      <div className="text-xs text-gray-500">{city.country}</div>
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-lg">
                      <span className="text-sm font-mono text-gray-700">{city.code}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try searching with a different term</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected City Display (if any) */}
      {selectedValue && (
        <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#003580] rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Currently Selected</div>
                <div className="text-sm text-gray-600">{selectedValue}</div>
              </div>
            </div>
            <Button
              onClick={onBack}
              className="bg-[#003580] hover:bg-[#002660] text-white px-6 py-2 rounded-lg"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
