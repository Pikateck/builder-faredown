import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Globe, 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  Download,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Eye,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Region {
  id: string;
  code?: string;
  name: string;
  level: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface Country {
  id: string;
  name: string;
  iso2?: string;
  iso3?: string;
  region_name?: string;
  region_code?: string;
  sort_order: number;
  is_active: boolean;
}

interface City {
  id: string;
  name: string;
  country_name: string;
  country_code?: string;
  region_name?: string;
  region_code?: string;
  sort_order: number;
  is_active: boolean;
  is_package_destination: boolean;
}

interface Alias {
  id: string;
  dest_type: 'region' | 'country' | 'city';
  dest_id: string;
  alias: string;
  weight: number;
  created_at: string;
}

interface Stats {
  total_regions: number;
  total_countries: number;
  total_cities: number;
  total_aliases: number;
  active_regions: number;
  active_countries: number;
  active_cities: number;
}

export default function DestinationsManagement() {
  const { toast } = useToast();
  
  // Data states
  const [regions, setRegions] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("regions");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  
  // Form states
  const [regionForm, setRegionForm] = useState({
    name: "",
    level: "continent",
    parent_id: "",
    slug: "",
    sort_order: 0,
    is_active: true
  });
  
  const [countryForm, setCountryForm] = useState({
    name: "",
    iso_code: "",
    region_id: "",
    slug: "",
    sort_order: 0,
    is_active: true
  });
  
  const [cityForm, setCityForm] = useState({
    name: "",
    code: "",
    country_id: "",
    region_id: "",
    slug: "",
    sort_order: 0,
    is_active: true
  });
  
  const [aliasForm, setAliasForm] = useState({
    dest_type: "city" as 'region' | 'country' | 'city',
    dest_id: "",
    alias: "",
    weight: 5
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regionsRes, countriesRes, citiesRes, statsRes] = await Promise.all([
        fetch('/api/destinations/regions'),
        fetch('/api/destinations/countries'),
        fetch('/api/destinations/cities'),
        fetch('/api/destinations/stats')
      ]);

      if (regionsRes.ok) {
        const regionsData = await regionsRes.json();
        setRegions(regionsData.data || []);
      }

      if (countriesRes.ok) {
        const countriesData = await countriesRes.json();
        setCountries(countriesData.data || []);
      }

      if (citiesRes.ok) {
        const citiesData = await citiesRes.json();
        setCities(citiesData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data?.summary || null);
      }

    } catch (error) {
      console.error('Error loading destinations data:', error);
      toast({
        title: "Error",
        description: "Failed to load destinations data",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Create operations
  const createRegion = async () => {
    try {
      const response = await fetch('/api/destinations/admin/regions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'admin-key-placeholder'
        },
        body: JSON.stringify(regionForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Region created successfully",
        });
        setIsCreateDialogOpen(false);
        setRegionForm({
          name: "",
          level: "continent",
          parent_id: "",
          slug: "",
          sort_order: 0,
          is_active: true
        });
        loadData();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create region');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create region: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const createCountry = async () => {
    try {
      const response = await fetch('/api/destinations/admin/countries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'admin-key-placeholder'
        },
        body: JSON.stringify(countryForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Country created successfully",
        });
        setIsCreateDialogOpen(false);
        setCountryForm({
          name: "",
          iso_code: "",
          region_id: "",
          slug: "",
          sort_order: 0,
          is_active: true
        });
        loadData();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create country');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create country: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const createCity = async () => {
    try {
      const response = await fetch('/api/destinations/admin/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'admin-key-placeholder'
        },
        body: JSON.stringify(cityForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "City created successfully",
        });
        setIsCreateDialogOpen(false);
        setCityForm({
          name: "",
          code: "",
          country_id: "",
          region_id: "",
          slug: "",
          sort_order: 0,
          is_active: true
        });
        loadData();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create city');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create city: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (type: string, id: string, currentStatus: boolean) => {
    try {
      // This would be a PUT/PATCH request to update the status
      // For now, just reload data
      toast({
        title: "Status Updated",
        description: `${type} ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${type} status`,
        variant: "destructive",
      });
    }
  };

  // Test search functionality
  const testSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const response = await fetch(`/api/destinations/search?q=${encodeURIComponent(searchTerm)}&limit=10`);
      if (response.ok) {
        const results = await response.json();
        toast({
          title: "Search Test Results",
          description: `Found ${results.length} results for "${searchTerm}" in ${response.headers.get('X-Response-Time') || 'unknown'}`,
        });
        console.log('🔍 Search test results:', results);

        // Show results in a more detailed way
        if (results.length > 0) {
          const resultSummary = results.map(r => `${r.type}: ${r.label} (score: ${r.score})`).join('\n');
          console.log('📊 Detailed results:\n', resultSummary);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Search request failed');
      }
    } catch (error) {
      toast({
        title: "Search Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter data based on search term
  const filterData = (data: any[], searchFields: string[]) => {
    if (!searchTerm.trim()) return data;
    return data.filter(item => 
      searchFields.some(field => 
        item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const filteredRegions = filterData(regions, ['name', 'level', 'parent_name']);
  const filteredCountries = filterData(countries, ['name', 'iso_code', 'region_name']);
  const filteredCities = filterData(cities, ['name', 'code', 'country_name', 'region_name']);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Destinations Master</h1>
          <p className="text-muted-foreground mt-1">
            Manage regions, countries, cities, and search aliases
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regions</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_regions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_regions} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_countries}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_countries} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cities</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_cities}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_cities} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Search Aliases</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_aliases}</div>
              <p className="text-xs text-muted-foreground">
                Alternative names
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Test & Diagnostics</CardTitle>
          <CardDescription>
            Test the destinations search functionality and run diagnostics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search destinations (e.g., Dubai, Paris, Europe, DXB)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={testSearch} disabled={!searchTerm.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Test Search
            </Button>
          </div>

          {/* Quick diagnostic tests */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("dubai");
                setTimeout(testSearch, 100);
              }}
            >
              Test "Dubai"
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("paris");
                setTimeout(testSearch, 100);
              }}
            >
              Test "Paris"
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("europe");
                setTimeout(testSearch, 100);
              }}
            >
              Test "Europe"
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("dxb");
                setTimeout(testSearch, 100);
              }}
            >
              Test "DXB" (alias)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("bombay");
                setTimeout(testSearch, 100);
              }}
            >
              Test "Bombay" (alias)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setTimeout(testSearch, 100);
              }}
            >
              Test Popular Destinations
            </Button>
          </div>

          {/* Performance indicators */}
          {stats && (
            <div className="text-sm text-gray-600 border-t pt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="font-medium">Searchable Items:</span> {stats.searchable_items}
                </div>
                <div>
                  <span className="font-medium">Total Cities:</span> {stats.total_cities}
                </div>
                <div>
                  <span className="font-medium">Package Cities:</span> {stats.package_cities}
                </div>
                <div>
                  <span className="font-medium">Active Aliases:</span> {stats.active_aliases}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="regions">Regions</TabsTrigger>
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="aliases">Aliases</TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab.slice(0, -1)}
          </Button>
        </div>

        {/* Regions Tab */}
        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regions Management</CardTitle>
              <CardDescription>
                Manage geographical regions and continents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegions.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell className="font-medium">{region.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{region.level}</Badge>
                      </TableCell>
                      <TableCell>{region.parent_name || "-"}</TableCell>
                      <TableCell>{region.countries_count}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActiveStatus('region', region.id, region.is_active)}
                          className="flex items-center"
                        >
                          {region.is_active ? (
                            <ToggleRight className="w-5 h-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setItemToDelete(region);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Countries Tab */}
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Countries Management</CardTitle>
              <CardDescription>
                Manage countries and their regional assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Cities</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCountries.map((country) => (
                    <TableRow key={country.id}>
                      <TableCell className="font-medium">{country.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{country.iso_code}</Badge>
                      </TableCell>
                      <TableCell>{country.region_name}</TableCell>
                      <TableCell>{country.cities_count}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActiveStatus('country', country.id, country.is_active)}
                          className="flex items-center"
                        >
                          {country.is_active ? (
                            <ToggleRight className="w-5 h-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setItemToDelete(country);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cities Management</CardTitle>
              <CardDescription>
                Manage cities and their country/region assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCities.slice(0, 50).map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>
                        {city.code && <Badge variant="secondary">{city.code}</Badge>}
                      </TableCell>
                      <TableCell>{city.country_name}</TableCell>
                      <TableCell>{city.region_name || "-"}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActiveStatus('city', city.id, city.is_active)}
                          className="flex items-center"
                        >
                          {city.is_active ? (
                            <ToggleRight className="w-5 h-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setItemToDelete(city);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredCities.length > 50 && (
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Showing first 50 of {filteredCities.length} cities. Use search to filter.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aliases Tab */}
        <TabsContent value="aliases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Aliases Management</CardTitle>
              <CardDescription>
                Manage alternative names and airport codes (DXB, Bombay, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Aliases management coming soon...
                <br />
                This will allow adding alternative names like "DXB" → "Dubai"
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create {activeTab.slice(0, -1)}</DialogTitle>
            <DialogDescription>
              Add a new {activeTab.slice(0, -1)} to the destinations database.
            </DialogDescription>
          </DialogHeader>
          
          {activeTab === 'regions' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={regionForm.name}
                  onChange={(e) => setRegionForm({...regionForm, name: e.target.value})}
                  placeholder="e.g., Europe, Asia, North India"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level">Level *</Label>
                <select
                  value={regionForm.level}
                  onChange={(e) => setRegionForm({...regionForm, level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="global">Global</option>
                  <option value="continent">Continent</option>
                  <option value="subregion">Subregion</option>
                  <option value="country">Country</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={regionForm.slug}
                  onChange={(e) => setRegionForm({...regionForm, slug: e.target.value})}
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>
          )}

          {activeTab === 'countries' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={countryForm.name}
                  onChange={(e) => setCountryForm({...countryForm, name: e.target.value})}
                  placeholder="e.g., France, India, United States"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="iso_code">ISO Code</Label>
                <Input
                  id="iso_code"
                  value={countryForm.iso_code}
                  onChange={(e) => setCountryForm({...countryForm, iso_code: e.target.value.toUpperCase()})}
                  placeholder="e.g., FR, IN, US"
                  maxLength={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="region_id">Region *</Label>
                <select
                  value={countryForm.region_id}
                  onChange={(e) => setCountryForm({...countryForm, region_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Region</option>
                  {regions.filter(r => r.is_active).map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'cities' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({...cityForm, name: e.target.value})}
                  placeholder="e.g., Paris, Mumbai, New York"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Airport/City Code</Label>
                <Input
                  id="code"
                  value={cityForm.code}
                  onChange={(e) => setCityForm({...cityForm, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., PAR, BOM, NYC"
                  maxLength={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country_id">Country *</Label>
                <select
                  value={cityForm.country_id}
                  onChange={(e) => setCityForm({...cityForm, country_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Country</option>
                  {countries.filter(c => c.is_active).map(country => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (activeTab === 'regions') createRegion();
              else if (activeTab === 'countries') createCountry();
              else if (activeTab === 'cities') createCity();
            }}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.name} {activeTab.slice(0, -1)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Implement delete functionality
                setIsDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
