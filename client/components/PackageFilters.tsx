import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  X,
  Filter,
  Camera,
  Building2,
  Mountain,
  Heart,
  Users,
  Star,
  Wallet,
  TreePine,
  Church,
  MapPin,
  Globe,
  Clock,
} from "lucide-react";

interface PackageFiltersProps {
  filters: {
    q: string;
    region_id: string;
    country_id: string;
    category: string;
    price_min: string;
    price_max: string;
    duration_min: string;
    duration_max: string;
    departure_city: string;
    month: string;
    sort: string;
    page: number;
  };
  facets: {
    regions?: Record<string, number>;
    categories?: Record<string, number>;
    tags?: Record<string, number>;
    price_ranges?: {
      min: number;
      max: number;
      avg: number;
    };
  } | null;
  onFiltersChange: (filters: any) => void;
}

export function PackageFilters({
  filters,
  facets,
  onFiltersChange,
}: PackageFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.q);
  const [priceRange, setPriceRange] = useState([
    parseInt(filters.price_min) || 0,
    parseInt(filters.price_max) || 1000000,
  ]);
  const [durationRange, setDurationRange] = useState([
    parseInt(filters.duration_min) || 1,
    parseInt(filters.duration_max) || 30,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ q: searchTerm, page: 1 });
  };

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
    onFiltersChange({
      price_min: values[0] > 0 ? values[0].toString() : "",
      price_max: values[1] < 1000000 ? values[1].toString() : "",
      page: 1,
    });
  };

  const handleDurationChange = (values: number[]) => {
    setDurationRange(values);
    onFiltersChange({
      duration_min: values[0] > 1 ? values[0].toString() : "",
      duration_max: values[1] < 30 ? values[1].toString() : "",
      page: 1,
    });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      category: filters.category === category ? "" : category,
      page: 1,
    });
  };

  const handleRegionChange = (regionId: string) => {
    onFiltersChange({
      region_id: filters.region_id === regionId ? "" : regionId,
      country_id: "", // Clear country when region changes
      page: 1,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPriceRange([0, 1000000]);
    setDurationRange([1, 30]);
    onFiltersChange({
      q: "",
      region_id: "",
      country_id: "",
      category: "",
      price_min: "",
      price_max: "",
      duration_min: "",
      duration_max: "",
      departure_city: "",
      month: "",
      page: 1,
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    }
    if (price >= 1000) {
      return `₹${(price / 1000).toFixed(0)}K`;
    }
    return `₹${price}`;
  };

  const categories = [
    { id: "cultural", name: "Cultural & Heritage", icon: Building2 },
    { id: "beach", name: "Beach & Islands", icon: Camera },
    { id: "adventure", name: "Adventure", icon: Mountain },
    { id: "honeymoon", name: "Honeymoon", icon: Heart },
    { id: "family", name: "Family", icon: Users },
    { id: "luxury", name: "Luxury", icon: Star },
    { id: "budget", name: "Budget", icon: Wallet },
    { id: "wildlife", name: "Wildlife", icon: TreePine },
    { id: "spiritual", name: "Spiritual", icon: Church },
  ];

  const regions = [
    { id: "1", name: "Europe", icon: Building2 },
    { id: "2", name: "Asia", icon: Mountain },
    { id: "3", name: "North America", icon: Camera },
    { id: "4", name: "South America", icon: TreePine },
    { id: "5", name: "Africa", icon: MapPin },
    { id: "6", name: "Australia & Oceania", icon: Globe },
    { id: "7", name: "Middle East", icon: Star },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-6">
      {/* Search */}
      <div>
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">
            Search Packages
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search destinations, packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  onFiltersChange({ q: "", page: 1 });
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="w-full" size="sm">
            Search
          </Button>
        </form>
      </div>

      {/* Clear All Filters */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-blue-600 hover:text-blue-800"
        >
          Clear All
        </Button>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["category", "price", "duration"]}
        className="space-y-0"
      >
        {/* Category Filter */}
        <AccordionItem value="category" className="border-b border-gray-200">
          <AccordionTrigger className="py-4 text-sm font-medium text-gray-900">
            Package Type
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={category.id}
                    checked={filters.category === category.id}
                    onCheckedChange={() => handleCategoryChange(category.id)}
                  />
                  <Label
                    htmlFor={category.id}
                    className="text-sm text-gray-700 flex items-center space-x-2 cursor-pointer"
                  >
                    <category.icon className="w-4 h-4 text-gray-500" />
                    <span>{category.name}</span>
                    {facets?.categories?.[category.id] && (
                      <span className="text-xs text-gray-500">
                        ({facets.categories[category.id]})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range Filter */}
        <AccordionItem value="price" className="border-b border-gray-200">
          <AccordionTrigger className="py-4 text-sm font-medium text-gray-900">
            Price Range (per person)
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  max={1000000}
                  min={0}
                  step={10000}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
              {facets?.price_ranges && (
                <div className="text-xs text-gray-500">
                  Average: {formatPrice(facets.price_ranges.avg)}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Duration Filter */}
        <AccordionItem value="duration" className="border-b border-gray-200">
          <AccordionTrigger className="py-4 text-sm font-medium text-gray-900">
            Duration (days)
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  value={durationRange}
                  onValueChange={handleDurationChange}
                  max={30}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  {durationRange[0]} day{durationRange[0] > 1 ? "s" : ""}
                </span>
                <span>
                  {durationRange[1]} day{durationRange[1] > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Region Filter */}
        <AccordionItem value="region" className="border-b border-gray-200">
          <AccordionTrigger className="py-4 text-sm font-medium text-gray-900">
            Destination Region
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-3">
              {regions.map((region) => (
                <div key={region.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`region-${region.id}`}
                    checked={filters.region_id === region.id}
                    onCheckedChange={() => handleRegionChange(region.id)}
                  />
                  <Label
                    htmlFor={`region-${region.id}`}
                    className="text-sm text-gray-700 cursor-pointer flex items-center space-x-2 flex-1"
                  >
                    <region.icon className="w-4 h-4 text-gray-500" />
                    <span>{region.name}</span>
                    {facets?.regions?.[region.name] && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({facets.regions[region.name]})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Departure Month Filter */}
        <AccordionItem value="month" className="border-b border-gray-200">
          <AccordionTrigger className="py-4 text-sm font-medium text-gray-900">
            Departure Month
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <select
              value={filters.month}
              onChange={(e) =>
                onFiltersChange({ month: e.target.value, page: 1 })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Any Month</option>
              <option value="2025-01">Jan 2025</option>
              <option value="2025-02">Feb 2025</option>
              <option value="2025-03">Mar 2025</option>
              <option value="2025-04">Apr 2025</option>
              <option value="2025-05">May 2025</option>
              <option value="2025-06">Jun 2025</option>
              <option value="2025-07">Jul 2025</option>
              <option value="2025-08">Aug 2025</option>
              <option value="2025-09">Sep 2025</option>
              <option value="2025-10">Oct 2025</option>
              <option value="2025-11">Nov 2025</option>
              <option value="2025-12">Dec 2025</option>
            </select>
          </AccordionContent>
        </AccordionItem>

        {/* Popular Tags */}
        {facets?.tags && Object.keys(facets.tags).length > 0 && (
          <AccordionItem value="tags" className="border-b border-gray-200">
            <AccordionTrigger className="py-4 text-sm font-medium text-gray-900">
              Popular Tags
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(facets.tags)
                  .slice(0, 10)
                  .map(([tag, count]) => (
                    <button
                      key={tag}
                      onClick={() => onFiltersChange({ q: tag, page: 1 })}
                      className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      {tag} ({count})
                    </button>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
