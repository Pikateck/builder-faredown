import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Calendar,
  MapPin,
  Globe,
  Users,
  Clock,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Plane,
  Hotel,
  Camera,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { useCurrency } from "../../contexts/CurrencyContext";

interface Package {
  id: number;
  slug: string;
  title: string;
  region_name?: string;
  country_name?: string;
  city_name?: string;
  duration_days: number;
  duration_nights: number;
  base_price_pp: number;
  currency: string;
  category?: string;
  status: string;
  is_featured: boolean;
  rating: number;
  review_count: number;
  total_departures: number;
  upcoming_departures: number;
  total_bookings: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

interface Departure {
  id: number;
  departure_city_code: string;
  departure_city_name: string;
  departure_date: string;
  return_date?: string;
  price_per_person: number;
  available_seats: number;
  total_seats: number;
  is_active: boolean;
  is_guaranteed: boolean;
}

interface PackageStats {
  total_packages: number;
  active_packages: number;
  draft_packages: number;
  total_departures: number;
  upcoming_departures: number;
  total_bookings: number;
  total_revenue: number;
  avg_rating: number;
}

export default function PackageManagement() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeparturesDialog, setShowDeparturesDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Partial<Package>>({});
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { makeRequest } = useApi();
  const { formatPrice } = useCurrency();

  // Categories
  const categories = [
    "cultural",
    "beach",
    "adventure",
    "honeymoon",
    "family",
    "luxury",
    "budget",
    "wildlife",
    "spiritual",
  ];

  useEffect(() => {
    fetchPackages();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
      });

      const response = await makeRequest(`/api/admin/packages?${params}`, {
        headers: {
          "X-Admin-Key": process.env.REACT_APP_ADMIN_API_KEY || "admin123",
        },
      });

      if (response.success) {
        setPackages(response.data.packages);
        setTotalPages(response.data.pagination.total_pages);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await makeRequest("/api/admin/packages/stats", {
        headers: {
          "X-Admin-Key": process.env.REACT_APP_ADMIN_API_KEY || "admin123",
        },
      });

      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchDepartures = async (packageId: number) => {
    try {
      const response = await makeRequest(`/api/admin/packages/${packageId}/departures`, {
        headers: {
          "X-Admin-Key": process.env.REACT_APP_ADMIN_API_KEY || "admin123",
        },
      });

      if (response.success) {
        setDepartures(response.data);
      }
    } catch (error) {
      console.error("Error fetching departures:", error);
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setShowEditDialog(true);
  };

  const handleSavePackage = async () => {
    try {
      const method = editingPackage.id ? "PUT" : "POST";
      const url = editingPackage.id 
        ? `/api/admin/packages/${editingPackage.id}` 
        : "/api/admin/packages";

      const response = await makeRequest(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": process.env.REACT_APP_ADMIN_API_KEY || "admin123",
        },
        body: JSON.stringify(editingPackage),
      });

      if (response.success) {
        setShowEditDialog(false);
        setEditingPackage({});
        fetchPackages();
      }
    } catch (error) {
      console.error("Error saving package:", error);
    }
  };

  const handleDeletePackage = async (packageId: number) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const response = await makeRequest(`/api/admin/packages/${packageId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Key": process.env.REACT_APP_ADMIN_API_KEY || "admin123",
        },
      });

      if (response.success) {
        fetchPackages();
      }
    } catch (error) {
      console.error("Error deleting package:", error);
    }
  };

  const handleViewDepartures = (pkg: Package) => {
    setSelectedPackage(pkg);
    fetchDepartures(pkg.id);
    setShowDeparturesDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Packages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_packages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Packages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_packages}</p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.total_revenue)}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avg_rating.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Package Management</CardTitle>
          <CardDescription>
            Manage your travel packages, departures, and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="packages" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="space-y-4">
              {/* Filters and Actions */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search packages..."
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
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setEditingPackage({
                        status: "draft",
                        is_featured: false,
                        base_price_pp: 0,
                        duration_days: 1,
                        duration_nights: 0,
                        currency: "INR",
                      });
                      setShowEditDialog(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Package
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

              {/* Packages Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading packages...
                        </TableCell>
                      </TableRow>
                    ) : packages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No packages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{pkg.title}</div>
                              <div className="text-sm text-gray-500">
                                {pkg.category && (
                                  <span className="capitalize">{pkg.category}</span>
                                )}
                                {pkg.is_featured && (
                                  <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                              <span>
                                {pkg.region_name}
                                {pkg.country_name && ` • ${pkg.country_name}`}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 text-gray-400" />
                              {pkg.duration_days}D/{pkg.duration_nights}N
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {formatPrice(pkg.base_price_pp, pkg.currency)}
                          </TableCell>
                          
                          <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                          
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium">{pkg.total_bookings}</div>
                              <div className="text-xs text-gray-500">
                                {pkg.upcoming_departures} upcoming
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {formatPrice(pkg.total_revenue, pkg.currency)}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDepartures(pkg)}
                              >
                                <Calendar className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPackage(pkg)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePackage(pkg.id)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Packages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Package performance metrics coming soon...</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Revenue analytics coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Package Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage.id ? "Edit Package" : "Create New Package"}
            </DialogTitle>
            <DialogDescription>
              Manage package details, pricing, and availability
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Package Title</Label>
                <Input
                  id="title"
                  value={editingPackage.title || ""}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, title: e.target.value })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editingPackage.category || ""}
                  onValueChange={(value) =>
                    setEditingPackage({ ...editingPackage, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_days">Duration (Days)</Label>
                <Input
                  id="duration_days"
                  type="number"
                  value={editingPackage.duration_days || 1}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      duration_days: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration_nights">Duration (Nights)</Label>
                <Input
                  id="duration_nights"
                  type="number"
                  value={editingPackage.duration_nights || 0}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      duration_nights: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price_pp">Base Price (Per Person)</Label>
                <Input
                  id="base_price_pp"
                  type="number"
                  value={editingPackage.base_price_pp || 0}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      base_price_pp: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingPackage.status || "draft"}
                  onValueChange={(value) =>
                    setEditingPackage({ ...editingPackage, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overview">Overview</Label>
              <Textarea
                id="overview"
                value={editingPackage.overview || ""}
                onChange={(e) =>
                  setEditingPackage({ ...editingPackage, overview: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={editingPackage.is_featured || false}
                onCheckedChange={(checked) =>
                  setEditingPackage({ ...editingPackage, is_featured: checked })
                }
              />
              <Label htmlFor="is_featured">Featured Package</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePackage}>
              {editingPackage.id ? "Update" : "Create"} Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Departures Dialog */}
      <Dialog open={showDeparturesDialog} onOpenChange={setShowDeparturesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Departures - {selectedPackage?.title}
            </DialogTitle>
            <DialogDescription>
              Manage departure dates and availability for this package
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Available Departures</h4>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Departure
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departure City</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departures.map((departure) => (
                    <TableRow key={departure.id}>
                      <TableCell>{departure.departure_city_name}</TableCell>
                      <TableCell>
                        {new Date(departure.departure_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {formatPrice(departure.price_per_person)}
                      </TableCell>
                      <TableCell>
                        {departure.available_seats}/{departure.total_seats}
                      </TableCell>
                      <TableCell>
                        {departure.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeparturesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
