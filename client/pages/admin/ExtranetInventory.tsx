import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import {
  Package,
  Plane,
  Hotel,
  Camera,
  Car,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Upload,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Users,
  Activity,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiClient } from "@/lib/api";

interface InventoryItem {
  id: string;
  module: "flights" | "hotels" | "sightseeing" | "transfers" | "packages";
  title: string;
  description: string;
  location: {
    city: string;
    country: string;
    region?: string;
  };
  pricing: {
    basePrice: number;
    currency: string;
    priceType: "per_person" | "per_room" | "per_group" | "per_vehicle";
  };
  availability: {
    status: "active" | "inactive" | "draft";
    startDate?: string;
    endDate?: string;
    capacity?: number;
    availableSlots?: number;
  };
  details: {
    duration?: string;
    includes?: string[];
    excludes?: string[];
    highlights?: string[];
    images?: string[];
  };
  metadata: {
    created_at: string;
    updated_at: string;
    created_by: string;
    source: "offline" | "extranet";
  };
}

interface ExtranetStats {
  total_items: number;
  active_items: number;
  draft_items: number;
  total_revenue: number;
  total_bookings: number;
  avg_rating: number;
}

const MODULE_CONFIG = {
  flights: {
    name: "Flights",
    icon: Plane,
    color: "bg-blue-600",
    fields: ["origin", "destination", "airline", "cabin_class", "flight_duration"],
  },
  hotels: {
    name: "Hotels",
    icon: Hotel,
    color: "bg-green-600",
    fields: ["check_in", "check_out", "room_type", "amenities", "star_rating"],
  },
  sightseeing: {
    name: "Sightseeing",
    icon: Camera,
    color: "bg-purple-600",
    fields: ["tour_type", "duration", "group_size", "difficulty_level", "languages"],
  },
  transfers: {
    name: "Transfers",
    icon: Car,
    color: "bg-orange-600",
    fields: ["vehicle_type", "pickup_location", "drop_location", "journey_time", "capacity"],
  },
  packages: {
    name: "Packages",
    icon: Package,
    color: "bg-emerald-600",
    fields: ["package_type", "duration_days", "duration_nights", "inclusions", "category"],
  },
};

const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad",
  "Dubai", "Singapore", "Bangkok", "Kuala Lumpur", "London", "Paris", "New York", "Los Angeles",
  "Goa", "Jaipur", "Agra", "Udaipur", "Kochi", "Mysore", "Manali", "Shimla", "Darjeeling",
];

const COUNTRIES = [
  "India", "UAE", "Thailand", "Singapore", "Malaysia", "UK", "France", "USA", "Australia",
  "Japan", "South Korea", "China", "Indonesia", "Philippines", "Vietnam", "Nepal", "Sri Lanka",
];

export default function ExtranetInventory() {
  const [activeModule, setActiveModule] = useState<keyof typeof MODULE_CONFIG>("flights");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem>>({});
  const [stats, setStats] = useState<ExtranetStats>({
    total_items: 0,
    active_items: 0,
    draft_items: 0,
    total_revenue: 0,
    total_bookings: 0,
    avg_rating: 0,
  });

  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, [activeModule, searchTerm, statusFilter]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        module: activeModule,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await apiClient.get(`/api/admin/extranet/inventory?${params}`);
      
      if (response.success) {
        setInventory(response.data.items);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      // Use mock data for demonstration
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get(`/api/admin/extranet/stats?module=${activeModule}`);
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Use mock stats for demonstration
      setStats({
        total_items: 45,
        active_items: 38,
        draft_items: 7,
        total_revenue: 2840000,
        total_bookings: 127,
        avg_rating: 4.6,
      });
    }
  };

  const handleCreateItem = () => {
    setEditingItem({
      module: activeModule,
      pricing: {
        basePrice: 0,
        currency: "INR",
        priceType: "per_person",
      },
      availability: {
        status: "draft",
        capacity: 10,
        availableSlots: 10,
      },
      location: {
        city: "",
        country: "",
      },
      details: {
        includes: [],
        excludes: [],
        highlights: [],
        images: [],
      },
      metadata: {
        source: "extranet",
        created_by: "admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
    setShowCreateDialog(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleSaveItem = async () => {
    try {
      const method = editingItem.id ? "PUT" : "POST";
      const url = editingItem.id
        ? `/api/admin/extranet/inventory/${editingItem.id}`
        : "/api/admin/extranet/inventory";

      const response = method === "POST"
        ? await apiClient.post(url, editingItem)
        : await apiClient.put(url, editingItem);

      if (response.success) {
        setShowCreateDialog(false);
        setShowEditDialog(false);
        setEditingItem({});
        fetchInventory();
        fetchStats();
      }
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await apiClient.delete(`/api/admin/extranet/inventory/${itemId}`);
      
      if (response.success) {
        fetchInventory();
        fetchStats();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const toggleItemStatus = async (itemId: string) => {
    try {
      const response = await apiClient.patch(`/api/admin/extranet/inventory/${itemId}/toggle-status`);
      
      if (response.success) {
        fetchInventory();
        fetchStats();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderModuleSpecificFields = () => {
    const moduleConfig = MODULE_CONFIG[activeModule];
    
    switch (activeModule) {
      case "flights":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Origin</Label>
              <Select
                value={editingItem.origin || ""}
                onValueChange={(value) => setEditingItem({ ...editingItem, origin: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select origin" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destination</Label>
              <Select
                value={editingItem.destination || ""}
                onValueChange={(value) => setEditingItem({ ...editingItem, destination: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Airline</Label>
              <Input
                value={editingItem.airline || ""}
                onChange={(e) => setEditingItem({ ...editingItem, airline: e.target.value })}
                placeholder="Enter airline name"
              />
            </div>
            <div>
              <Label>Cabin Class</Label>
              <Select
                value={editingItem.cabin_class || ""}
                onValueChange={(value) => setEditingItem({ ...editingItem, cabin_class: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cabin class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economy">Economy</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="First">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "hotels":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Room Type</Label>
              <Input
                value={editingItem.room_type || ""}
                onChange={(e) => setEditingItem({ ...editingItem, room_type: e.target.value })}
                placeholder="e.g., Deluxe Room, Suite"
              />
            </div>
            <div>
              <Label>Star Rating</Label>
              <Select
                value={editingItem.star_rating || ""}
                onValueChange={(value) => setEditingItem({ ...editingItem, star_rating: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Star</SelectItem>
                  <SelectItem value="4">4 Star</SelectItem>
                  <SelectItem value="5">5 Star</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Amenities</Label>
              <Textarea
                value={editingItem.amenities || ""}
                onChange={(e) => setEditingItem({ ...editingItem, amenities: e.target.value })}
                placeholder="List hotel amenities (WiFi, Pool, Spa, etc.)"
                rows={2}
              />
            </div>
          </div>
        );

      case "sightseeing":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tour Type</Label>
              <Select
                value={editingItem.tour_type || ""}
                onValueChange={(value) => setEditingItem({ ...editingItem, tour_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tour type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="city_tour">City Tour</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="heritage">Heritage</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                value={editingItem.duration || ""}
                onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                placeholder="e.g., 4 hours, Full day"
              />
            </div>
            <div>
              <Label>Group Size</Label>
              <Input
                type="number"
                value={editingItem.group_size || ""}
                onChange={(e) => setEditingItem({ ...editingItem, group_size: e.target.value })}
                placeholder="Maximum group size"
              />
            </div>
            <div>
              <Label>Difficulty Level</Label>
              <Select
                value={editingItem.difficulty_level || ""}
                onValueChange={(value) => setEditingItem({ ...editingItem, difficulty_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="challenging">Challenging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "transfers":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vehicle Type</Label>
              <Select
                value={editingItem.vehicle_type || ""}
                onValueChange={(value) => setEditingItem({ ...editingItem, vehicle_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="luxury">Luxury Car</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="bus">Mini Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                value={editingItem.vehicle_capacity || ""}
                onChange={(e) => setEditingItem({ ...editingItem, vehicle_capacity: e.target.value })}
                placeholder="Number of passengers"
              />
            </div>
            <div>
              <Label>Pickup Location</Label>
              <Input
                value={editingItem.pickup_location || ""}
                onChange={(e) => setEditingItem({ ...editingItem, pickup_location: e.target.value })}
                placeholder="Pickup address/location"
              />
            </div>
            <div>
              <Label>Drop Location</Label>
              <Input
                value={editingItem.drop_location || ""}
                onChange={(e) => setEditingItem({ ...editingItem, drop_location: e.target.value })}
                placeholder="Drop address/location"
              />
            </div>
          </div>
        );

      case "packages":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Package Category</Label>
              <Select
                value={editingItem.package_category || ""}
                onValueChange={(value) => setEditingItem({ ...editingItem, package_category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="beach">Beach</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="honeymoon">Honeymoon</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                value={editingItem.package_duration || ""}
                onChange={(e) => setEditingItem({ ...editingItem, package_duration: e.target.value })}
                placeholder="e.g., 5 Days 4 Nights"
              />
            </div>
            <div className="col-span-2">
              <Label>Inclusions</Label>
              <Textarea
                value={editingItem.package_inclusions || ""}
                onChange={(e) => setEditingItem({ ...editingItem, package_inclusions: e.target.value })}
                placeholder="List what's included in the package"
                rows={2}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const ItemFormDialog = ({ isEdit = false }) => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="font-medium">Basic Information</h4>
        
        <div>
          <Label>Title*</Label>
          <Input
            value={editingItem.title || ""}
            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
            placeholder="Enter item title"
          />
        </div>

        <div>
          <Label>Description*</Label>
          <Textarea
            value={editingItem.description || ""}
            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
            placeholder="Enter detailed description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>City*</Label>
            <Select
              value={editingItem.location?.city || ""}
              onValueChange={(value) => setEditingItem({
                ...editingItem,
                location: { ...editingItem.location, city: value }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Country*</Label>
            <Select
              value={editingItem.location?.country || ""}
              onValueChange={(value) => setEditingItem({
                ...editingItem,
                location: { ...editingItem.location, country: value }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Module-specific fields */}
      <div className="space-y-4">
        <h4 className="font-medium">{MODULE_CONFIG[activeModule].name} Details</h4>
        {renderModuleSpecificFields()}
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h4 className="font-medium">Pricing</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Base Price*</Label>
            <Input
              type="number"
              value={editingItem.pricing?.basePrice || ""}
              onChange={(e) => setEditingItem({
                ...editingItem,
                pricing: { ...editingItem.pricing, basePrice: parseFloat(e.target.value) || 0 }
              })}
              placeholder="Enter base price"
            />
          </div>

          <div>
            <Label>Price Type*</Label>
            <Select
              value={editingItem.pricing?.priceType || "per_person"}
              onValueChange={(value) => setEditingItem({
                ...editingItem,
                pricing: { ...editingItem.pricing, priceType: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_person">Per Person</SelectItem>
                <SelectItem value="per_room">Per Room</SelectItem>
                <SelectItem value="per_group">Per Group</SelectItem>
                <SelectItem value="per_vehicle">Per Vehicle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <h4 className="font-medium">Availability</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Status*</Label>
            <Select
              value={editingItem.availability?.status || "draft"}
              onValueChange={(value) => setEditingItem({
                ...editingItem,
                availability: { ...editingItem.availability, status: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Capacity</Label>
            <Input
              type="number"
              value={editingItem.availability?.capacity || ""}
              onChange={(e) => setEditingItem({
                ...editingItem,
                availability: { ...editingItem.availability, capacity: parseInt(e.target.value) || 0 }
              })}
              placeholder="Maximum capacity"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={editingItem.availability?.startDate || ""}
              onChange={(e) => setEditingItem({
                ...editingItem,
                availability: { ...editingItem.availability, startDate: e.target.value }
              })}
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={editingItem.availability?.endDate || ""}
              onChange={(e) => setEditingItem({
                ...editingItem,
                availability: { ...editingItem.availability, endDate: e.target.value }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_items}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_items}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.total_revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avg_rating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Extranet Inventory Management</CardTitle>
          <CardDescription>
            Manage offline inventory for all modules. Add, edit, and publish inventory that appears alongside online supplier content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Module Tabs */}
          <Tabs value={activeModule} onValueChange={(value) => setActiveModule(value as keyof typeof MODULE_CONFIG)}>
            <TabsList className="grid w-full grid-cols-5">
              {Object.entries(MODULE_CONFIG).map(([key, config]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <config.icon className="w-4 h-4" />
                  {config.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(MODULE_CONFIG).map(([moduleKey, config]) => (
              <TabsContent key={moduleKey} value={moduleKey} className="space-y-4">
                {/* Filters and Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-1 gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder={`Search ${config.name.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add {config.name}
                    </Button>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Inventory Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading {config.name.toLowerCase()}...
                          </TableCell>
                        </TableRow>
                      ) : inventory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <config.icon className="w-12 h-12 text-gray-400" />
                              <p className="text-gray-500">No {config.name.toLowerCase()} found</p>
                              <p className="text-sm text-gray-400">Create your first {config.name.toLowerCase()} item to get started</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        inventory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {item.description}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                <span>{item.location.city}, {item.location.country}</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {formatPrice(item.pricing.basePrice, item.pricing.currency)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.pricing.priceType.replace('_', ' ')}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>{getStatusBadge(item.availability.status)}</TableCell>

                            <TableCell>
                              <div className="text-center">
                                <div className="font-medium">0</div>
                                <div className="text-xs text-gray-500">bookings</div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-sm">
                                {new Date(item.metadata.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleItemStatus(item.id)}
                                >
                                  {item.availability.status === "active" ? (
                                    <XCircle className="w-4 h-4 text-orange-600" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Item Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New {MODULE_CONFIG[activeModule].name}</DialogTitle>
            <DialogDescription>
              Create a new {MODULE_CONFIG[activeModule].name.toLowerCase()} item for offline inventory.
            </DialogDescription>
          </DialogHeader>

          <ItemFormDialog isEdit={false} />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveItem}
              disabled={!editingItem.title || !editingItem.description}
            >
              Create Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {MODULE_CONFIG[activeModule].name}</DialogTitle>
            <DialogDescription>
              Update {MODULE_CONFIG[activeModule].name.toLowerCase()} item details and settings.
            </DialogDescription>
          </DialogHeader>

          <ItemFormDialog isEdit={true} />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveItem}
              disabled={!editingItem.title || !editingItem.description}
            >
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
