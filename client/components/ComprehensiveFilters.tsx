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
import { FilterModalSelect } from "@/components/common/FilterModalSelect";

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
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "budget",
    "popular",
    "deals",
  ]);
  const [showAllSections, setShowAllSections] = useState<string[]>([]);

  // Modal state for "View more" filters
  const [openModal, setOpenModal] = useState<string | null>(null);

  // Search block state (with 400ms debounce)
  const [propertyNameQuery, setPropertyNameQuery] = useState(
    (selectedFilters.qPropertyName as string) || "",
  );
  const [areaQuery, setAreaQuery] = useState(
    (selectedFilters.qAddress as string) || "",
  );
  const [roomNameQuery, setRoomNameQuery] = useState(
    (selectedFilters.qRoomName as string) || "",
  );

  // Debounce search inputs
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = { ...selectedFilters };
      if (propertyNameQuery) {
        newFilters.qPropertyName = propertyNameQuery;
      } else {
        delete newFilters.qPropertyName;
      }
      setSelectedFilters(newFilters);
    }, 400);
    return () => clearTimeout(timer);
  }, [propertyNameQuery, setSelectedFilters]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = { ...selectedFilters };
      if (areaQuery) {
        newFilters.qAddress = areaQuery;
      } else {
        delete newFilters.qAddress;
      }
      setSelectedFilters(newFilters);
    }, 400);
    return () => clearTimeout(timer);
  }, [areaQuery, setSelectedFilters]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = { ...selectedFilters };
      if (roomNameQuery) {
        newFilters.qRoomName = roomNameQuery;
      } else {
        delete newFilters.qRoomName;
      }
      setSelectedFilters(newFilters);
    }, 400);
    return () => clearTimeout(timer);
  }, [roomNameQuery, setSelectedFilters]);

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
      id: "search-block",
      title: "Search Properties",
      isCollapsible: false,
      items: [],
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
      id: "cancellation",
      title: "Cancellation Policy",
      isCollapsible: true,
      items: [
        { id: "FC", label: "Free Cancellation", count: 4009 },
        { id: "PR", label: "Partially-Refundable", count: 2450 },
        { id: "NR", label: "Non-Refundable", count: 1200 },
      ],
    },
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
    {
      id: "neighborhood",
      title: "Neighborhood",
      isCollapsible: true,
      items: [
        { id: "beach-coast", label: "Beach & Coast", count: 2108 },
        { id: "downtown-dubai", label: "Downtown Dubai", count: 1069 },
        { id: "guests-favorite", label: "Guests' favorite area", count: 1084 },
        { id: "bur-dubai", label: "Bur Dubai", count: 337 },
        { id: "palm-jumeirah", label: "Palm Jumeirah", count: 440 },
        { id: "deira", label: "Deira", count: 217 },
        { id: "sheikh-zayed", label: "Sheikh Zayed Road", count: 601 },
        { id: "jumeirah-beach", label: "Jumeirah Beach Residence", count: 341 },
        { id: "dubai-marina", label: "Dubai Marina", count: 769 },
        { id: "old-dubai", label: "Old Dubai", count: 114 },
      ],
      maxVisible: 6,
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

  const handleFilterChange = (
    categoryId: string,
    itemId: string,
    checked: boolean,
  ) => {
    const currentCategoryFilters = selectedFilters[categoryId] || [];

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
                    onClick={() => {
                      // For brands, amenities, and neighborhoods, open modal instead
                      if (
                        ["brands", "amenities", "neighborhood"].includes(
                          category.id,
                        )
                      ) {
                        setOpenModal(category.id);
                      } else {
                        toggleShowAll(category.id);
                      }
                    }}
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
              onClick={() => {
                // For brands, amenities, and neighborhoods, open modal instead
                if (
                  ["brands", "amenities", "neighborhood"].includes(category.id)
                ) {
                  setOpenModal(category.id);
                } else {
                  toggleShowAll(category.id);
                }
              }}
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
    return Object.values(selectedFilters).reduce(
      (total, filters) => total + filters.length,
      0,
    );
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
      </div>

      {/* Filter Categories */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="px-4 pb-4">
          {/* Search Block */}
          <div className="border-b border-gray-200 py-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Search Properties
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-700 mb-1.5 block">
                  Property name
                </Label>
                <Input
                  placeholder="Search property..."
                  value={propertyNameQuery}
                  onChange={(e) => setPropertyNameQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-1.5 block">
                  Area / Address
                </Label>
                <Input
                  placeholder="Search area..."
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-1.5 block">
                  Room name
                </Label>
                <Input
                  placeholder="Search room type..."
                  value={roomNameQuery}
                  onChange={(e) => setRoomNameQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Other Filter Categories */}
          {filterCategories.map((category) => {
            if (category.id === "search-block") return null;
            return renderFilterCategory(category);
          })}
        </div>
      </ScrollArea>

      {/* View More Modals */}
      {openModal === "brands" && filterCategories && (
        <FilterModalSelect
          title="Select Brands"
          items={
            filterCategories
              .find((c) => c.id === "brands")
              ?.items.map((item) => ({
                code: item.id,
                name: item.label,
                count: item.count,
              })) || []
          }
          selected={selectedFilters["brands"] || []}
          onApply={(selected) => {
            setSelectedFilters({
              ...selectedFilters,
              brands: selected,
            });
            setOpenModal(null);
          }}
          onClose={() => setOpenModal(null)}
          searchPlaceholder="Search brands..."
        />
      )}

      {openModal === "amenities" && filterCategories && (
        <FilterModalSelect
          title="Select Amenities"
          items={
            filterCategories
              .find((c) => c.id === "amenities")
              ?.items.map((item) => ({
                code: item.id,
                name: item.label,
                count: item.count,
              })) || []
          }
          selected={selectedFilters["amenities"] || []}
          onApply={(selected) => {
            setSelectedFilters({
              ...selectedFilters,
              amenities: selected,
            });
            setOpenModal(null);
          }}
          onClose={() => setOpenModal(null)}
          searchPlaceholder="Search amenities..."
        />
      )}

      {openModal === "neighborhood" && filterCategories && (
        <FilterModalSelect
          title="Select Locations"
          items={
            filterCategories
              .find((c) => c.id === "neighborhood")
              ?.items.map((item) => ({
                code: item.id,
                name: item.label,
                count: item.count,
              })) || []
          }
          selected={selectedFilters["neighborhood"] || []}
          onApply={(selected) => {
            setSelectedFilters({
              ...selectedFilters,
              neighborhood: selected,
            });
            setOpenModal(null);
          }}
          onClose={() => setOpenModal(null)}
          searchPlaceholder="Search locations..."
        />
      )}
    </div>
  );
}
