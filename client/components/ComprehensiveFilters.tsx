import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  Utensils,
  Shield,
  Home,
  Building,
  Trees,
  Bed,
  Bath,
  Clock,
  CreditCard,
  Users,
  Heart,
  Award,
  Accessibility,
  X,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPriceWithSymbol } from "@/lib/pricing";

interface FilterCategory {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: FilterItem[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  showAll?: boolean;
  maxVisible?: number;
  type?: "checkbox" | "radio" | "range";
}

interface FilterItem {
  id: string;
  label: string;
  count?: number;
  popular?: boolean;
}

interface ComprehensiveFiltersProps {
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  selectedFilters: Record<string, string[] | string>;
  setSelectedFilters: (filters: Record<string, string[] | string>) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onClearFilters: () => void;
  className?: string;
  priceMax?: number;
  supplierCounts?: Record<string, number>;
}

export function ComprehensiveFilters({
  priceRange,
  setPriceRange,
  selectedFilters,
  setSelectedFilters,
  sortBy,
  setSortBy,
  onClearFilters,
  className,
  priceMax,
  supplierCounts,
}: ComprehensiveFiltersProps) {
  const { selectedCurrency } = useCurrency();
  // Initialize with all filter categories expanded by default
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "stars",
    "meal-plans",
    "cancellation",
    "amenities",
    "property-type",
    "neighborhood",
    "guest-rating",
    "brands",
  ]);
  const [showAllSections, setShowAllSections] = useState<string[]>([]);
  const [hotelNameSearch, setHotelNameSearch] = useState<string>("");

  const sortOptions = [
    { value: "recommended", label: "Our top picks" },
    { value: "price-low", label: "Price (lowest first)" },
    { value: "price-high", label: "Price (highest first)" },
    { value: "rating", label: "Best reviewed & lowest price" },
    { value: "stars-high", label: "Property rating (high to low)" },
    { value: "distance", label: "Distance from downtown" },
  ];

  const filterCategories: FilterCategory[] = [
    {
      id: "stars",
      title: "Star Rating",
      isCollapsible: true,
      items: [
        { id: "5", label: "★★★★★ 5 stars", count: 799 },
        { id: "4", label: "★★★★ 4 stars", count: 3644 },
        { id: "3", label: "★★★ 3 stars", count: 424 },
        { id: "2", label: "★★ 2 stars", count: 95 },
        { id: "1", label: "★ 1 star", count: 31 },
      ],
    },
    {
      id: "meal-plans",
      title: "Meal Plan",
      isCollapsible: true,
      items: [
        { id: "RO", label: "Room Only", count: 3800 },
        { id: "BB", label: "Breakfast Included", count: 627 },
        { id: "HB", label: "Half Board", count: 156 },
        { id: "FB", label: "Full Board", count: 89 },
        { id: "DN", label: "Dinner Only", count: 42 },
      ],
    },
    {
      id: "cancellation",
      title: "Refundability",
      isCollapsible: true,
      items: [
        { id: "FC", label: "Free Cancellation", count: 4009 },
        { id: "NR", label: "Non-Refundable", count: 1200 },
        { id: "PR", label: "Partially-Refundable", count: 800 },
      ],
    },
    {
      id: "amenities",
      title: "Amenities",
      isCollapsible: true,
      items: [
        { id: "parking", label: "Parking", count: 5444 },
        { id: "restaurant", label: "Restaurant", count: 876 },
        { id: "room-service", label: "Room service", count: 800 },
        { id: "24h-front-desk", label: "24-hour front desk", count: 2021 },
        { id: "fitness-center", label: "Fitness center", count: 3388 },
        { id: "spa", label: "Spa", count: 1256 },
        { id: "bar", label: "Bar", count: 1845 },
        { id: "business-center", label: "Business center", count: 897 },
        { id: "concierge", label: "Concierge service", count: 567 },
        { id: "laundry", label: "Laundry service", count: 1234 },
        { id: "airport-shuttle", label: "Airport shuttle", count: 234 },
        { id: "free-wifi", label: "Free WiFi", count: 3421 },
        { id: "pet-friendly", label: "Pet friendly", count: 945 },
        { id: "non-smoking", label: "Non-smoking rooms", count: 2341 },
      ],
      maxVisible: 10,
    },
    {
      id: "property-type",
      title: "Property Type",
      isCollapsible: true,
      items: [
        { id: "HOTEL", label: "Hotel", count: 656 },
        { id: "APARTMENT", label: "Apartment", count: 5060 },
        { id: "APARTHOTEL", label: "Aparthotel", count: 2500 },
        { id: "RESORT", label: "Resort", count: 59 },
        { id: "VILLA", label: "Villa", count: 104 },
      ],
    },
    {
      id: "neighborhood",
      title: "Locations",
      isCollapsible: true,
      items: [
        { id: "dubai-coastline", label: "Dubai's coastline", count: 2108 },
        { id: "near-dubai-mall", label: "Near Dubai mall", count: 1670 },
        {
          id: "nightlife-areas",
          label: "In lively nightlife areas",
          count: 3586,
        },
        { id: "beachfront-jbr", label: "Beachfront and JBR walk", count: 1550 },
        {
          id: "traditional-souks",
          label: "Traditional Souks and Old Dubai",
          count: 554,
        },
        { id: "iconic-landmarks", label: "Near iconic landmarks", count: 2193 },
        { id: "metro-stations", label: "Near metro stations", count: 3295 },
        {
          id: "family-attractions",
          label: "Near family attractions",
          count: 1936,
        },
        { id: "residential-areas", label: "In residential areas", count: 76 },
      ],
      maxVisible: 6,
    },
    {
      id: "guest-rating",
      title: "Guest Rating",
      isCollapsible: true,
      items: [
        { id: "EXCELLENT", label: "Excellent", count: 1593 },
        { id: "VERY_GOOD", label: "Very Good", count: 2649 },
        { id: "GOOD", label: "Good", count: 3193 },
      ],
    },
    {
      id: "brands",
      title: "Brands",
      isCollapsible: true,
      items: [
        { id: "millennium-hotels", label: "Millennium Hotels", count: 15 },
        { id: "jumeirah", label: "Jumeirah", count: 12 },
        { id: "rove-hotels", label: "ROVE Hotels", count: 10 },
        {
          id: "address-hotels",
          label: "The Address Hotels and Resorts",
          count: 8,
        },
        { id: "oyo-rooms", label: "OYO Rooms", count: 8 },
        { id: "movenpick", label: "Mövenpick", count: 8 },
        { id: "premier-inn", label: "Premier Inn", count: 7 },
        { id: "rotana-hotels", label: "Rotana Hotels & Resorts", count: 7 },
        { id: "marriott", label: "Marriott Hotels & Resorts", count: 6 },
        { id: "belvilla", label: "Belvilla", count: 6 },
      ],
      maxVisible: 10,
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const toggleShowAll = (sectionId: string) => {
    setShowAllSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const handleHotelNameSearch = (value: string) => {
    setHotelNameSearch(value);
    setSelectedFilters({
      ...selectedFilters,
      hotelName: value.trim(),
    });
  };

  const handleFilterChange = (
    categoryId: string,
    itemId: string,
    checked: boolean,
  ) => {
    // Ensure filters are always arrays, not strings
    let currentCategoryFilters = selectedFilters[categoryId];
    if (typeof currentCategoryFilters === "string") {
      currentCategoryFilters = currentCategoryFilters
        ? [currentCategoryFilters]
        : [];
    } else if (!Array.isArray(currentCategoryFilters)) {
      currentCategoryFilters = [];
    }

    if (checked) {
      setSelectedFilters({
        ...selectedFilters,
        [categoryId]: [...currentCategoryFilters, itemId],
      });
    } else {
      setSelectedFilters({
        ...selectedFilters,
        [categoryId]: currentCategoryFilters.filter((id) => id !== itemId),
      });
    }
  };

  const renderFilterItem = (item: FilterItem, categoryId: string) => {
    const isChecked = selectedFilters[categoryId]?.includes(item.id) || false;

    return (
      <div
        key={item.id}
        className="flex items-center justify-between py-1 min-h-[28px]"
      >
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id={`${categoryId}-${item.id}`}
            checked={isChecked}
            onCheckedChange={(checked) =>
              handleFilterChange(categoryId, item.id, checked as boolean)
            }
            className="w-4 h-4"
          />
          <label
            htmlFor={`${categoryId}-${item.id}`}
            className="text-sm text-gray-700 cursor-pointer flex-1 leading-tight"
          >
            {item.label}
            {item.popular && (
              <span className="ml-1 text-xs text-orange-600 bg-orange-100 px-1 py-0.5 rounded">
                Popular
              </span>
            )}
          </label>
        </div>
        {item.count && (
          <span className="text-xs text-gray-500 ml-2">{item.count}</span>
        )}
      </div>
    );
  };

  const renderFilterCategory = (category: FilterCategory) => {
    const isExpanded = expandedSections.includes(category.id);
    const showAll = showAllSections.includes(category.id);
    const maxVisible = category.maxVisible || category.items.length;
    const visibleItems = showAll
      ? category.items
      : category.items.slice(0, maxVisible);
    const hasMore = category.items.length > maxVisible;

    if (category.isCollapsible) {
      return (
        <div key={category.id} className="border-b border-gray-200 py-4">
          <Collapsible
            open={isExpanded}
            onOpenChange={() => toggleSection(category.id)}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left">
              <h3 className="text-base font-semibold text-gray-900">
                {category.title}
              </h3>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-1">
                {visibleItems.map((item) =>
                  renderFilterItem(item, category.id),
                )}
                {hasMore && (
                  <button
                    onClick={() => toggleShowAll(category.id)}
                    className="text-blue-600 text-sm hover:underline mt-2 flex items-center gap-1"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        View more
                      </>
                    )}
                  </button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <div key={category.id} className="border-b border-gray-200 py-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          {category.title}
        </h3>
        <div className="space-y-1">
          {visibleItems.map((item) => renderFilterItem(item, category.id))}
          {hasMore && (
            <button
              onClick={() => toggleShowAll(category.id)}
              className="text-blue-600 text-sm hover:underline mt-2 flex items-center gap-1"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  View more
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const getActiveFiltersCount = () => {
    return Object.values(selectedFilters).reduce((total, value) => {
      if (typeof value === "string") {
        return total + (value ? 1 : 0);
      }
      return total + (Array.isArray(value) ? value.length : 0);
    }, 0);
  };

  return (
    <div className={`bg-white ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter by:
          </h2>
          {getActiveFiltersCount() > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Sort Options */}
        <div className="mb-4">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Sort by
          </Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Your budget (total stay)
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {formatPriceWithSymbol(priceRange[0], selectedCurrency.code)}
              </span>
              <span>
                {formatPriceWithSymbol(priceRange[1], selectedCurrency.code)}+
              </span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={priceMax ?? Math.max(50000, priceRange[1])}
              min={0}
              step={500}
              className="w-full"
            />
          </div>
        </div>

        {/* Hotel Name Search */}
        <div className="mb-4">
          <Label
            htmlFor="hotelNameSearch"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Search hotel name
          </Label>
          <Input
            id="hotelNameSearch"
            type="text"
            placeholder="Type hotel name..."
            value={hotelNameSearch}
            onChange={(e) => handleHotelNameSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Room Type Search */}
        <div className="mb-6">
          <Label
            htmlFor="roomTypeSearch"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Search by room type
          </Label>
          <Input
            id="roomTypeSearch"
            type="text"
            placeholder="e.g. Deluxe, Suite, Twin..."
            value={(selectedFilters["qRoomName"] as string) || ""}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedFilters((prev) => ({
                ...prev,
                qRoomName: value,
              }));
            }}
            className="w-full"
          />
          {selectedFilters["qRoomName"] && (
            <p className="text-xs text-gray-500 mt-1">
              Filtering rooms matching: "{selectedFilters["qRoomName"]}"
            </p>
          )}
        </div>
      </div>

      {/* Filter Categories */}
      <div className="px-4 pb-4">
        {filterCategories.map((category) => renderFilterCategory(category))}
      </div>
    </div>
  );
}
