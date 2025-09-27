/**
 * Countries Error Test Component
 * Tests the useCountries hook graceful fallback when API is offline
 */

import React from "react";
import { Globe, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useCountries from "@/hooks/useCountries";

export default function CountriesErrorTest() {
  const {
    countries,
    popularCountries,
    loading,
    error,
    refresh,
    searchCountries,
    isLoading,
    hasError,
    isEmpty,
    count,
  } = useCountries({ autoFetch: true });

  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchCountries(query);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Countries Hook Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {loading ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader className="w-3 h-3 animate-spin" />
                Loading
              </Badge>
            ) : hasError ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Error (but working with fallback)
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Working
              </Badge>
            )}
          </div>

          {/* Error Message (if any) */}
          {error && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">⚠️ {error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Countries:</span> {count}
            </div>
            <div>
              <span className="font-medium">Popular Countries:</span>{" "}
              {popularCountries.length}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={refresh} size="sm" variant="outline">
              Refresh Countries
            </Button>
          </div>

          {/* Search Test */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Search:</label>
            <input
              type="text"
              placeholder="Search countries (e.g., 'india', 'us', 'sing')"
              className="w-full px-3 py-2 border rounded-md text-sm"
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchLoading && (
              <div className="text-sm text-gray-500">Searching...</div>
            )}
            {searchResults.length > 0 && (
              <div className="text-sm">
                Found {searchResults.length} countries:
                <div className="mt-1 flex flex-wrap gap-1">
                  {searchResults.slice(0, 5).map((country) => (
                    <Badge
                      key={country.iso2}
                      variant="outline"
                      className="text-xs"
                    >
                      {country.flag_emoji} {country.display_name}
                    </Badge>
                  ))}
                  {searchResults.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{searchResults.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Popular Countries Display */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Popular Countries ({popularCountries.length}):
            </h4>
            <div className="flex flex-wrap gap-1">
              {popularCountries.map((country) => (
                <Badge key={country.iso2} variant="outline" className="text-xs">
                  {country.flag_emoji} {country.display_name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Expected Behavior */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">
              Expected Behavior (API Offline):
            </h4>
            <ul className="list-disc list-inside text-green-800 text-sm space-y-1">
              <li>✅ Should show countries from fallback data (not empty)</li>
              <li>✅ Should NOT show "Failed to fetch countries" error</li>
              <li>✅ Search should work with client-side filtering</li>
              <li>✅ Popular countries should be available</li>
              <li>✅ Should show "Using offline country data" if anything</li>
            </ul>
          </div>

          {/* Debug Info */}
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600">
              Debug Info
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(
                {
                  count,
                  hasError,
                  error,
                  isLoading,
                  isEmpty,
                  sampleCountries: countries.slice(0, 3).map((c) => ({
                    iso2: c.iso2,
                    name: c.display_name,
                    popular: c.popular,
                  })),
                },
                null,
                2,
              )}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
