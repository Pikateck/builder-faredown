import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supplierService, Supplier, SyncLog } from "@/services/supplierService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Database,
  Eye,
  Download,
  AlertTriangle,
  Briefcase,
  Globe,
  Key,
  Calendar,
  BarChart3,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  type: "flight" | "hotel" | "car" | "package";
  status: "active" | "inactive" | "testing";
  apiEndpoint: string;
  lastSync: string;
  totalBookings: number;
  successRate: number;
  averageResponseTime: number;
  credentials: {
    apiKey: string;
    secret: string;
    username?: string;
    password?: string;
  };
  configuration: {
    contentAPI?: string;
    bookingAPI?: string;
    timeoutMs: number;
    retryAttempts: number;
    cacheEnabled: boolean;
    syncFrequency: string;
  };
  supportedCurrencies: string[];
  supportedDestinations: string[];
  markup: {
    defaultPercentage: number;
    minPercentage: number;
    maxPercentage: number;
  };
}

interface SyncLog {
  id: string;
  supplierId: string;
  timestamp: string;
  status: "success" | "failed" | "partial";
  recordsProcessed: number;
  duration: number;
  errors: string[];
  details: string;
}

const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Hotelbeds",
    type: "hotel",
    status: "active",
    apiEndpoint: "https://api.test.hotelbeds.com",
    lastSync: "2025-01-23T10:30:00Z",
    totalBookings: 1247,
    successRate: 94.2,
    averageResponseTime: 850,
    credentials: {
      apiKey: "91d2368789abdb5beec101ce95a9d185",
      secret: "a9ffaaecce",
    },
    configuration: {
      contentAPI: "https://api.test.hotelbeds.com/hotel-content-api/1.0/",
      bookingAPI: "https://api.test.hotelbeds.com/hotel-api/1.0/",
      timeoutMs: 30000,
      retryAttempts: 3,
      cacheEnabled: true,
      syncFrequency: "daily",
    },
    supportedCurrencies: ["EUR", "USD", "GBP", "INR"],
    supportedDestinations: ["Dubai", "Mumbai", "Delhi", "Singapore"],
    markup: {
      defaultPercentage: 12,
      minPercentage: 8,
      maxPercentage: 25,
    },
  },
  {
    id: "2",
    name: "Sabre",
    type: "flight",
    status: "testing",
    apiEndpoint: "https://api.test.sabre.com",
    lastSync: "2025-01-23T08:15:00Z",
    totalBookings: 892,
    successRate: 91.8,
    averageResponseTime: 1200,
    credentials: {
      apiKey: "test_key_sabre",
      secret: "test_secret_sabre",
    },
    configuration: {
      timeoutMs: 45000,
      retryAttempts: 2,
      cacheEnabled: false,
      syncFrequency: "realtime",
    },
    supportedCurrencies: ["USD", "EUR", "INR"],
    supportedDestinations: ["Dubai", "New York", "London"],
    markup: {
      defaultPercentage: 8,
      minPercentage: 5,
      maxPercentage: 15,
    },
  },
];

const mockSyncLogs: SyncLog[] = [
  {
    id: "1",
    supplierId: "1",
    timestamp: "2025-01-23T10:30:00Z",
    status: "success",
    recordsProcessed: 1247,
    duration: 45000,
    errors: [],
    details: "Full hotel content sync completed successfully",
  },
  {
    id: "2",
    supplierId: "1",
    timestamp: "2025-01-22T10:30:00Z",
    status: "partial",
    recordsProcessed: 980,
    duration: 38000,
    errors: ["Failed to sync 15 hotels due to API timeout"],
    details: "Partial sync - some hotels failed to update",
  },
];

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncingSupplier, setSyncingSupplier] = useState<string | null>(null);

  // Load suppliers and sync logs on component mount
  useEffect(() => {
    loadSuppliers();
    loadSyncLogs();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const suppliersData = await supplierService.getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const logsData = await supplierService.getSyncLogs();
      setSyncLogs(logsData);
    } catch (error) {
      console.error("Failed to load sync logs:", error);
    }
  };

  const handleAddSupplier = (newSupplier: Partial<Supplier>) => {
    const supplier: Supplier = {
      id: Date.now().toString(),
      name: newSupplier.name || "",
      type: newSupplier.type || "hotel",
      status: "testing",
      apiEndpoint: newSupplier.apiEndpoint || "",
      lastSync: "",
      totalBookings: 0,
      successRate: 0,
      averageResponseTime: 0,
      credentials: newSupplier.credentials || { apiKey: "", secret: "" },
      configuration: {
        timeoutMs: 30000,
        retryAttempts: 3,
        cacheEnabled: true,
        syncFrequency: "daily",
        ...newSupplier.configuration,
      },
      supportedCurrencies: newSupplier.supportedCurrencies || [],
      supportedDestinations: newSupplier.supportedDestinations || [],
      markup: {
        defaultPercentage: 10,
        minPercentage: 5,
        maxPercentage: 20,
        ...newSupplier.markup,
      },
    };

    setSuppliers([...suppliers, supplier]);
    setIsAddDialogOpen(false);
  };

  const handleEditSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(
      suppliers.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s)),
    );
    setIsEditDialogOpen(false);
    setSelectedSupplier(null);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(suppliers.filter((s) => s.id !== supplierId));
  };

  const handleToggleStatus = async (supplierId: string) => {
    try {
      const supplier = suppliers.find((s) => s.id === supplierId);
      if (!supplier) return;

      const newStatus = supplier.status === "active" ? "inactive" : "active";
      await supplierService.toggleSupplierStatus(supplierId, newStatus);

      // Update local state
      setSuppliers(
        suppliers.map((s) =>
          s.id === supplierId ? { ...s, status: newStatus } : s,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle supplier status:", error);
    }
  };

  const handleSyncSupplier = async (supplierId: string) => {
    try {
      setSyncingSupplier(supplierId);
      setLoading(true);

      // Get default destination codes for sync - you can make this configurable
      const destinationCodes = ["DXB", "BOM", "DEL"]; // Dubai, Mumbai, Delhi

      const syncResult = await supplierService.syncSupplier(
        supplierId,
        destinationCodes,
        false,
      );

      // Reload suppliers and sync logs to get updated data
      await loadSuppliers();
      await loadSyncLogs();

      console.log("Sync completed:", syncResult);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncingSupplier(null);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "testing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      case "testing":
        return <Clock className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "partial":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Supplier Management
          </h2>
          <p className="text-muted-foreground">
            Manage hotel and flight suppliers, API integrations, and data
            synchronization
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>
            <SupplierForm
              onSubmit={handleAddSupplier}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Suppliers
                    </p>
                    <p className="text-2xl font-bold">{suppliers.length}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {suppliers.filter((s) => s.status === "active").length}
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
                    <p className="text-sm font-medium text-gray-600">Testing</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {suppliers.filter((s) => s.status === "testing").length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Avg Success Rate
                    </p>
                    <p className="text-2xl font-bold">
                      {(
                        suppliers.reduce((acc, s) => acc + s.successRate, 0) /
                        suppliers.length
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Supplier List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-gray-500">
                            {supplier.apiEndpoint}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{supplier.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(supplier.status)}>
                          {getStatusIcon(supplier.status)}
                          <span className="ml-1">{supplier.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {supplier.lastSync ? (
                          <div className="text-sm">
                            {new Date(supplier.lastSync).toLocaleDateString()}
                            <div className="text-xs text-gray-500">
                              {new Date(supplier.lastSync).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">
                            {supplier.successRate}%
                          </span>
                          <div className="ml-2 w-16 h-2 bg-gray-200 rounded">
                            <div
                              className="h-2 bg-green-500 rounded"
                              style={{ width: `${supplier.successRate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.totalBookings.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSyncSupplier(supplier.id)}
                            disabled={syncingSupplier === supplier.id}
                          >
                            {syncingSupplier === supplier.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Switch
                            checked={supplier.status === "active"}
                            onCheckedChange={() =>
                              handleToggleStatus(supplier.id)
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log) => {
                    const supplier = suppliers.find(
                      (s) => s.id === log.supplierId,
                    );
                    return (
                      <TableRow key={log.id}>
                        <TableCell>{supplier?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(log.timestamp).toLocaleDateString()}
                            <div className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSyncStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                          {log.errors.length > 0 && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" />
                          )}
                        </TableCell>
                        <TableCell>
                          {log.recordsProcessed.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {(log.duration / 1000).toFixed(1)}s
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm">
                            {log.details}
                          </div>
                          {log.errors.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {log.errors.length} error(s)
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">
                          {supplier.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {supplier.successRate}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {supplier.totalBookings} bookings
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">
                          {supplier.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {supplier.averageResponseTime}ms
                        </div>
                        <div className="text-xs text-gray-500">
                          avg response
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierForm
              supplier={selectedSupplier}
              onSubmit={handleEditSupplier}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Supplier Form Component
function SupplierForm({
  supplier,
  onSubmit,
  onCancel,
}: {
  supplier?: Supplier;
  onSubmit: (supplier: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    type: supplier?.type || "hotel",
    apiEndpoint: supplier?.apiEndpoint || "",
    apiKey: supplier?.credentials?.apiKey || "",
    secret: supplier?.credentials?.secret || "",
    contentAPI: supplier?.configuration?.contentAPI || "",
    bookingAPI: supplier?.configuration?.bookingAPI || "",
    timeoutMs: supplier?.configuration?.timeoutMs || 30000,
    retryAttempts: supplier?.configuration?.retryAttempts || 3,
    cacheEnabled: supplier?.configuration?.cacheEnabled || true,
    syncFrequency: supplier?.configuration?.syncFrequency || "daily",
    defaultPercentage: supplier?.markup?.defaultPercentage || 10,
    minPercentage: supplier?.markup?.minPercentage || 5,
    maxPercentage: supplier?.markup?.maxPercentage || 20,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const supplierData = {
      ...supplier,
      name: formData.name,
      type: formData.type,
      apiEndpoint: formData.apiEndpoint,
      credentials: {
        apiKey: formData.apiKey,
        secret: formData.secret,
      },
      configuration: {
        contentAPI: formData.contentAPI,
        bookingAPI: formData.bookingAPI,
        timeoutMs: formData.timeoutMs,
        retryAttempts: formData.retryAttempts,
        cacheEnabled: formData.cacheEnabled,
        syncFrequency: formData.syncFrequency,
      },
      markup: {
        defaultPercentage: formData.defaultPercentage,
        minPercentage: formData.minPercentage,
        maxPercentage: formData.maxPercentage,
      },
    };

    onSubmit(supplierData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Supplier Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Hotelbeds"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({ ...formData, type: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hotel">Hotel</SelectItem>
              <SelectItem value="flight">Flight</SelectItem>
              <SelectItem value="car">Car Rental</SelectItem>
              <SelectItem value="package">Package</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">API Endpoint</label>
        <Input
          value={formData.apiEndpoint}
          onChange={(e) =>
            setFormData({ ...formData, apiEndpoint: e.target.value })
          }
          placeholder="https://api.supplier.com"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            value={formData.apiKey}
            onChange={(e) =>
              setFormData({ ...formData, apiKey: e.target.value })
            }
            placeholder="API Key"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Secret</label>
          <Input
            type="password"
            value={formData.secret}
            onChange={(e) =>
              setFormData({ ...formData, secret: e.target.value })
            }
            placeholder="Secret Key"
            required
          />
        </div>
      </div>

      {formData.type === "hotel" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Content API URL</label>
            <Input
              value={formData.contentAPI}
              onChange={(e) =>
                setFormData({ ...formData, contentAPI: e.target.value })
              }
              placeholder="Content API endpoint"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Booking API URL</label>
            <Input
              value={formData.bookingAPI}
              onChange={(e) =>
                setFormData({ ...formData, bookingAPI: e.target.value })
              }
              placeholder="Booking API endpoint"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Default Markup %</label>
          <Input
            type="number"
            value={formData.defaultPercentage}
            onChange={(e) =>
              setFormData({
                ...formData,
                defaultPercentage: parseInt(e.target.value),
              })
            }
            min="0"
            max="100"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Min Markup %</label>
          <Input
            type="number"
            value={formData.minPercentage}
            onChange={(e) =>
              setFormData({
                ...formData,
                minPercentage: parseInt(e.target.value),
              })
            }
            min="0"
            max="100"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Max Markup %</label>
          <Input
            type="number"
            value={formData.maxPercentage}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxPercentage: parseInt(e.target.value),
              })
            }
            min="0"
            max="100"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{supplier ? "Update" : "Add"} Supplier</Button>
      </div>
    </form>
  );
}
