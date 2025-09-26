import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PackageCard } from "@/components/PackageCard";
import { PackageCardSimple } from "@/components/PackageCardSimple";
import { PackageFilters } from "@/components/PackageFilters";
import { Button } from "@/components/ui/button";
import { Loader2, Filter, SortAsc, MapPin, Calendar, Grid3X3, List } from "lucide-react";
import { apiClient } from "@/lib/api";

interface Package {
  id: number;
  slug: string;
  title: string;
  region_name: string;
  country_name: string;
  duration_days: number;
  duration_nights: number;
  from_price: number;
  currency: string;
  next_departure_date: string;
  available_departures_count: number;
  hero_image_url: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  tags: string[];
  highlights: string[];
  category: string;
}

interface PackageSearchResponse {
  packages: Package[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  facets: {
    regions: Record<string, number>;
    categories: Record<string, number>;
    tags: Record<string, number>;
    price_ranges: {
      min: number;
      max: number;
      avg: number;
    };
  };
  filters: any;
}

export default function PackageResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<any>(null);
  const [facets, setFacets] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list"); // Default to list view

  // Current filters from URL
  const currentFilters = {
    q: searchParams.get("q") || "",
    destination: searchParams.get("destination") || "",
    destination_code: searchParams.get("destination_code") || "",
    destination_type: searchParams.get("destination_type") || "",
    region_id: searchParams.get("region_id") || "",
    country_id: searchParams.get("country_id") || "",
    category: searchParams.get("category") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    duration_min: searchParams.get("duration_min") || "",
    duration_max: searchParams.get("duration_max") || "",
    departure_city: searchParams.get("departure_city") || "",
    month: searchParams.get("month") || "",
    departure_date: searchParams.get("departure_date") || "",
    return_date: searchParams.get("return_date") || "",
    adults: parseInt(searchParams.get("adults") || "2"),
    children: parseInt(searchParams.get("children") || "0"),
    sort: searchParams.get("sort") || "popularity",
    page: parseInt(searchParams.get("page") || "1"),
  };

  const fetchPackages = async () => {
    setLoading(true);
    setError("");

    try {
      const queryParams = new URLSearchParams();

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== "" && value !== 0) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get<PackageSearchResponse>(`/packages?${queryParams.toString()}`);

      if (response.packages) {
        setPackages(response.packages);
        setPagination(response.pagination);
        setFacets(response.facets);
      } else {
        setError("Failed to fetch packages");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [searchParams]);

  // Force refresh on mount to ensure images load
  useEffect(() => {
    const timer = setTimeout(() => {
      // Force a re-render to ensure images are displayed
      setPackages(prev => [...prev]);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const updateFilters = (newFilters: any) => {
    const updatedParams = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "" && value !== "any") {
        updatedParams.set(key, value.toString());
      } else {
        updatedParams.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (!newFilters.page) {
      updatedParams.set("page", "1");
    }

    setSearchParams(updatedParams);
  };

  const changePage = (page: number) => {
    updateFilters({ page });
  };

  const changeSort = (sort: string) => {
    updateFilters({ sort, page: 1 });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams({ sort: "popularity" }));
  };

  if (loading) {
    return (
      <Layout showSearch={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Searching for packages...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showSearch={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSearch={false}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Fixed Packages
              </h1>
              {pagination && (
                <div className="text-gray-600">
                  <p>
                    {pagination.total} packages found
                    {currentFilters.q && (
                      <span> for "{currentFilters.q}"</span>
                    )}
                  </p>
                  {/* Search Summary */}
                  {(currentFilters.departure_date || currentFilters.destination || currentFilters.destination_code) && (
                    <div className="text-sm text-gray-500 mt-1">
                      {currentFilters.destination && (
                        <span>Destination: {currentFilters.destination}</span>
                      )}
                      {currentFilters.departure_date && (
                        <span className="ml-4">
                          Departure: {new Date(currentFilters.departure_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                      {currentFilters.return_date && (
                        <span className="ml-2">
                          - {new Date(currentFilters.return_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Sort and View Toggle */}
            <div className="hidden md:flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Grid
                </Button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={currentFilters.sort}
                onChange={(e) => changeSort(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="popularity">Most Popular</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="duration">Duration</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {Object.entries(currentFilters).some(([key, value]) =>
            value && value !== "" && value !== "popularity" && key !== "page" && key !== "adults" && key !== "children"
          ) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Filters:</span>
              {Object.entries(currentFilters).map(([key, value]) => {
                if (!value || value === "" || value === "popularity" || key === "page" || key === "adults" || key === "children") return null;

                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {key}: {value}
                    <button
                      onClick={() => updateFilters({ [key]: "" })}
                      className="ml-2 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Mobile View Toggle */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center border border-gray-300 rounded-lg p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600"}`}
              >
                <List className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600"}`}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                Grid
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Mobile Filter Toggle */}
          <div className="md:hidden fixed bottom-4 left-4 z-10">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-600 text-white rounded-full p-3 shadow-lg"
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Filters Sidebar */}
          <div className={`
            ${showFilters ? 'block' : 'hidden'} md:block
            fixed md:relative inset-0 md:inset-auto z-20 md:z-auto
            bg-white md:bg-transparent w-full md:w-80 h-full md:h-auto
            overflow-y-auto md:overflow-visible p-4 md:p-0
          `}>
            {showFilters && (
              <div className="md:hidden flex justify-between items-center mb-4 pb-4 border-b">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowFilters(false)}
                  className="p-2"
                >
                  ×
                </Button>
              </div>
            )}
            
            <PackageFilters
              filters={currentFilters}
              facets={facets}
              onFiltersChange={updateFilters}
            />
          </div>

          {/* Results */}
          <div className="flex-1">
            {packages.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No packages found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters to see more results.
                </p>
                <Button onClick={clearAllFilters} variant="outline">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                {/* Packages Results */}
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {packages.map((pkg) => (
                      <PackageCard
                        key={pkg.id}
                        package={pkg}
                        adults={currentFilters.adults}
                        children={currentFilters.children}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 mb-8">
                    {packages.map((pkg) => (
                      <PackageCardSimple
                        key={pkg.id}
                        package={pkg}
                        adults={currentFilters.adults}
                        children={currentFilters.children}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      disabled={!pagination.has_prev}
                      onClick={() => changePage(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const page = i + 1;
                      const isActive = page === pagination.page;
                      
                      return (
                        <Button
                          key={page}
                          variant={isActive ? "default" : "outline"}
                          onClick={() => changePage(page)}
                          className={isActive ? "bg-blue-600 text-white" : ""}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      disabled={!pagination.has_next}
                      onClick={() => changePage(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
