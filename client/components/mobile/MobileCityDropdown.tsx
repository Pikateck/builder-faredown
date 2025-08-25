import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Search, 
  Star, 
  Plane,
  Clock,
  TrendingUp,
  X
} from "lucide-react";

interface Airport {
  code: string;
  city: string;
  country: string;
  popular?: boolean;
  trending?: boolean;
}

interface MobileCityDropdownProps {
  cities: Record<string, Airport>;
  selectedCity: string;
  onSelect: (city: string) => void;
  placeholder?: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCityDropdown({
  cities,
  selectedCity,
  onSelect,
  placeholder = "Search cities",
  title = "Select City",
  isOpen,
  onClose
}: MobileCityDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] = useState<Airport[]>([]);

  // Convert cities object to array
  const citiesArray = Object.values(cities);

  // Popular and trending cities
  const popularCities = citiesArray.filter(city => city.popular);
  const trendingCities = [
    { code: "DXB", city: "Dubai", country: "UAE", trending: true },
    { code: "SIN", city: "Singapore", country: "Singapore", trending: true },
    { code: "BKK", city: "Bangkok", country: "Thailand", trending: true },
    { code: "LHR", city: "London", country: "UK", trending: true },
  ];

  useEffect(() => {
    if (!searchQuery) {
      setFilteredCities(citiesArray.slice(0, 20));
    } else {
      const filtered = citiesArray.filter(city =>
        city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered.slice(0, 20));
    }
  }, [searchQuery, citiesArray]);

  const handleCitySelect = (city: Airport) => {
    onSelect(city.city);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003580] to-[#0071c2] text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-12 h-12 bg-white/20 border-white/30 text-white placeholder-white/70 rounded-xl"
            autoFocus
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {!searchQuery && (
          <>
            {/* Popular Cities */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">Popular Destinations</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {popularCities.slice(0, 6).map((city) => (
                  <Button
                    key={city.code}
                    variant="outline"
                    onClick={() => handleCitySelect(city)}
                    className="h-16 p-3 flex items-center space-x-3 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Plane className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">{city.city}</div>
                      <div className="text-xs text-gray-600">{city.code}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Trending Cities */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Trending Now</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {trendingCities.map((city) => (
                  <Button
                    key={city.code}
                    variant="outline"
                    onClick={() => handleCitySelect(city)}
                    className="h-14 p-3 flex items-center space-x-3 border-gray-200 hover:border-green-400 hover:bg-green-50 rounded-xl transition-all justify-start"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{city.city}</div>
                      <div className="text-sm text-gray-600">{city.country}</div>
                    </div>
                    <div className="ml-auto text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {city.code}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500 text-center py-8">
                  No recent searches
                </div>
              </div>
            </div>
          </>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Search Results ({filteredCities.length})
            </h3>
            <div className="space-y-2">
              {filteredCities.map((city) => (
                <Button
                  key={city.code}
                  variant="outline"
                  onClick={() => handleCitySelect(city)}
                  className="w-full h-16 p-4 flex items-center space-x-3 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all justify-start"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">{city.city}</div>
                    <div className="text-sm text-gray-600">{city.country}</div>
                  </div>
                  <div className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {city.code}
                  </div>
                </Button>
              ))}
              
              {filteredCities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No cities found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected City Display */}
      {selectedCity && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Selected</div>
                <div className="text-sm text-gray-600">{selectedCity}</div>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="bg-[#003580] hover:bg-[#002660] text-white px-6 py-2 rounded-lg"
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
