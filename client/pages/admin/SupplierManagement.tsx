/**
 * Supplier Management System
 * Manage multiple suppliers for flights and hotels with markup settings
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Plane,
  Hotel,
  DollarSign,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  Clock,
  RefreshCw,
} from "lucide-react";
import { adminAuthService, PERMISSIONS } from "@/services/adminAuthService";

interface Supplier {
  id: string;
  name: string;
  type: "flights" | "hotels" | "both";
  apiEndpoint: string;
  credentials: {
    username?: string;
    password?: string;
    apiKey?: string;
    officeId?: string;
  };
  isActive: boolean;
  connectionStatus: "connected" | "disconnected" | "error";
  lastSync: string;
  markupSettings: {
    type: "percentage" | "fixed";
    domestic: {
      min: number;
      max: number;
      default: number;
    };
    international: {
      min: number;
      max: number;
      default: number;
    };
  };
  fareRanges: {
    economy: { min: number; max: number };
    business: { min: number; max: number };
    first: { min: number; max: number };
  };
  performance: {
    totalBookings: number;
    successRate: number;
    avgResponseTime: number;
    monthlyRevenue: number;
  };
  commission: {
    rate: number;
    structure: "flat" | "tiered";
  };
}

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock supplier data
  const mockSuppliers: Supplier[] = [
    {
      id: "supplier-1",
      name: "Amadeus",
      type: "flights",
      apiEndpoint: "https://api.amadeus.com/v1",
      credentials: {
        apiKey: "•••••••••••••••",
        officeId: "DEL123456",
      },
      isActive: true,
      connectionStatus: "connected",
      lastSync: "2024-01-15T10:30:00Z",
      markupSettings: {
        type: "percentage",
        domestic: { min: 5, max: 15, default: 8 },
        international: { min: 8, max: 20, default: 12 },
      },
      fareRanges: {
        economy: { min: 5000, max: 50000 },
        business: { min: 25000, max: 150000 },
        first: { min: 80000, max: 300000 },
      },
      performance: {
        totalBookings: 1234,
        successRate: 98.5,
        avgResponseTime: 850,
        monthlyRevenue: 2456789,
      },
      commission: {
        rate: 2.5,
        structure: "flat",
      },
    },
    {
      id: "supplier-2",
      name: "Sabre",
      type: "flights",
      apiEndpoint: "https://api.sabre.com/v1",
      credentials: {
        username: "faredown_user",
        password: "•••••••••••••••",
        officeId: "BOM987654",
      },
      isActive: true,
      connectionStatus: "connected",
      lastSync: "2024-01-15T10:25:00Z",
      markupSettings: {
        type: "percentage",
        domestic: { min: 6, max: 18, default: 10 },
        international: { min: 10, max: 25, default: 15 },
      },
      fareRanges: {
        economy: { min: 4500, max: 45000 },
        business: { min: 20000, max: 140000 },
        first: { min: 75000, max: 280000 },
      },
      performance: {
        totalBookings: 987,
        successRate: 96.8,
        avgResponseTime: 1200,
        monthlyRevenue: 1876543,
      },
      commission: {
        rate: 3.0,
        structure: "tiered",
      },
    },
    {
      id: "supplier-3",
      name: "Booking.com",
      type: "hotels",
      apiEndpoint: "https://distribution-xml.booking.com/2.4",
      credentials: {
        username: "faredown_hotels",
        password: "•••••••••••••••",
      },
      isActive: true,
      connectionStatus: "connected",
      lastSync: "2024-01-15T10:28:00Z",
      markupSettings: {
        type: "percentage",
        domestic: { min: 8, max: 20, default: 12 },
        international: { min: 10, max: 25, default: 15 },
      },
      fareRanges: {
        economy: { min: 2000, max: 15000 },
        business: { min: 8000, max: 50000 },
        first: { min: 20000, max: 100000 },
      },
      performance: {
        totalBookings: 567,
        successRate: 94.2,
        avgResponseTime: 2100,
        monthlyRevenue: 1234567,
      },
      commission: {
        rate: 4.5,
        structure: "flat",
      },
    },
    {
      id: "supplier-4",
      name: "Expedia",
      type: "hotels",
      apiEndpoint: "https://api.expediapartnercentral.com/v1",
      credentials: {
        apiKey: "•••••••••••••••",
      },
      isActive: false,
      connectionStatus: "disconnected",
      lastSync: "2024-01-10T15:20:00Z",
      markupSettings: {
        type: "fixed",
        domestic: { min: 500, max: 2000, default: 800 },
        international: { min: 1000, max: 5000, default: 1500 },
      },
      fareRanges: {
        economy: { min: 1500, max: 12000 },
        business: { min: 6000, max: 40000 },
        first: { min: 15000, max: 80000 },
      },
      performance: {
        totalBookings: 123,
        successRate: 89.1,
        avgResponseTime: 3200,
        monthlyRevenue: 456789,
      },
      commission: {
        rate: 5.0,
        structure: "tiered",
      },
    },
  ];

  useEffect(() => {
    setSuppliers(mockSuppliers);
  }, []);

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(suppliers.filter((s) => s.id !== supplierId));
  };

  const handleToggleSupplier = (supplierId: string) => {
    setSuppliers(
      suppliers.map((s) =>
        s.id === supplierId ? { ...s, isActive: !s.isActive } : s,
      ),
    );
  };

  const testConnection = async (supplier: Supplier) => {
    // Simulate API test
    console.log(`Testing connection for ${supplier.name}...`);
    // Update connection status
    setSuppliers(
      suppliers.map((s) =>
        s.id === supplier.id
          ? {
              ...s,
              connectionStatus: "connected",
              lastSync: new Date().toISOString(),
            }
          : s,
      ),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-600";
      case "disconnected":
        return "text-gray-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "disconnected":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const renderSupplierOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Suppliers
                </p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Suppliers
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {suppliers.filter((s) => s.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Flight Suppliers
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {
                    suppliers.filter(
                      (s) => s.type === "flights" || s.type === "both",
                    ).length
                  }
                </p>
              </div>
              <Plane className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Hotel Suppliers
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {
                    suppliers.filter(
                      (s) => s.type === "hotels" || s.type === "both",
                    ).length
                  }
                </p>
              </div>
              <Hotel className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Supplier Management</CardTitle>
            <Button onClick={handleAddSupplier}>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {supplier.type === "flights" ||
                        supplier.type === "both" ? (
                          <Plane className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Hotel className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-600">
                          {supplier.apiEndpoint}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{supplier.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={supplier.isActive}
                        onCheckedChange={() =>
                          handleToggleSupplier(supplier.id)
                        }
                      />
                      <span className="text-sm">
                        {supplier.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(supplier.connectionStatus)}
                      <span
                        className={`text-sm ${getStatusColor(supplier.connectionStatus)}`}
                      >
                        {supplier.connectionStatus}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(supplier.lastSync).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{supplier.performance.successRate}% success</div>
                      <div className="text-gray-600">
                        {supplier.performance.totalBookings} bookings
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      ₹{supplier.performance.monthlyRevenue.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection(supplier)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {supplier.name}?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSupplier(supplier.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="markups">Markup Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderSupplierOverview()}</TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Performance Analytics
                </h3>
                <p className="text-gray-600">
                  Detailed performance charts and analytics will be displayed
                  here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="markups">
          <Card>
            <CardHeader>
              <CardTitle>Global Markup Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Markup Configuration
                </h3>
                <p className="text-gray-600">
                  Configure global and supplier-specific markup rules
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
            <DialogDescription>
              Configure supplier connection and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Supplier Name</Label>
                <Input
                  id="name"
                  defaultValue={selectedSupplier?.name || ""}
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={selectedSupplier?.type || "flights"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flights">Flights</SelectItem>
                    <SelectItem value="hotels">Hotels</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="endpoint">API Endpoint</Label>
              <Input
                id="endpoint"
                defaultValue={selectedSupplier?.apiEndpoint || ""}
                placeholder="https://api.supplier.com/v1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  defaultValue={selectedSupplier?.credentials.username || ""}
                  placeholder="API Username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password/API Key</Label>
                <Input
                  id="password"
                  type="password"
                  defaultValue={selectedSupplier?.credentials.password || ""}
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {selectedSupplier ? "Update" : "Add"} Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
