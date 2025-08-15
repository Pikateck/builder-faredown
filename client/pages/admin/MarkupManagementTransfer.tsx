import React, { useState, useEffect } from "react";
import {
  markupService,
  type TransferMarkup,
  type CreateTransferMarkupRequest,
} from "@/services/markupService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Car,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Download,
  MapPin,
  Calendar,
  DollarSign,
  Percent,
  Settings,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Users,
  Briefcase,
  RefreshCw,
  ArrowLeft,
  Truck,
} from "lucide-react";

interface TransferMarkup {
  id: string;
  name: string;
  description: string;
  originCity: string;
  destinationCity: string;
  transferType: "Private" | "Shared" | "Luxury" | "Economy" | "ALL";
  vehicleType: "Sedan" | "SUV" | "Van" | "Bus" | "ALL";
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  currentFareMin: number;
  currentFareMax: number;
  bargainFareMin: number;
  bargainFareMax: number;
  validFrom: string;
  validTo: string;
  status: "active" | "inactive" | "expired";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions: string;
  createdAt: string;
  updatedAt: string;
}

const TRANSFER_TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "Private", label: "Private Transfer" },
  { value: "Shared", label: "Shared Transfer" },
  { value: "Luxury", label: "Luxury Transfer" },
  { value: "Economy", label: "Economy Transfer" },
];

const VEHICLE_TYPES = [
  { value: "ALL", label: "All Vehicles" },
  { value: "Sedan", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "Van", label: "Van" },
  { value: "Bus", label: "Bus" },
];

const CITIES = [
  { value: "Dubai Airport", label: "Dubai Airport" },
  { value: "Dubai Marina", label: "Dubai Marina" },
  { value: "Downtown Dubai", label: "Downtown Dubai" },
  { value: "JBR", label: "Jumeirah Beach Residence" },
  { value: "Dubai Mall", label: "Dubai Mall" },
  { value: "Burj Al Arab", label: "Burj Al Arab" },
  { value: "Mumbai Airport", label: "Mumbai Airport" },
  { value: "Bandra", label: "Bandra" },
  { value: "Andheri", label: "Andheri" },
  { value: "Worli", label: "Worli" },
  { value: "Powai", label: "Powai" },
  { value: "ALL", label: "All Cities" },
];

export default function MarkupManagementTransfer() {
  const [markups, setMarkups] = useState<TransferMarkup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transferTypeFilter, setTransferTypeFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMarkup, setEditingMarkup] = useState<TransferMarkup | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for creating/editing markups
  const [formData, setFormData] = useState<Partial<CreateTransferMarkupRequest>>({
    name: "",
    description: "",
    originCity: "",
    destinationCity: "",
    transferType: "ALL",
    vehicleType: "ALL",
    markupType: "percentage",
    markupValue: 20,
    minAmount: 0,
    maxAmount: 0,
    currentFareMin: 15,
    currentFareMax: 25,
    bargainFareMin: 10,
    bargainFareMax: 20,
    validFrom: new Date().toISOString().split("T")[0],
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "active",
    priority: 1,
    userType: "all",
    specialConditions: "",
  });

  // Load markups on component mount
  useEffect(() => {
    loadMarkups();
  }, []);

  const loadMarkups = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call when backend is ready
      const mockMarkups: TransferMarkup[] = [
        {
          id: "1",
          name: "Dubai Airport to Marina",
          description: "Airport transfers to Dubai Marina area",
          originCity: "Dubai Airport",
          destinationCity: "Dubai Marina",
          transferType: "ALL",
          vehicleType: "ALL",
          markupType: "percentage",
          markupValue: 20,
          minAmount: 0,
          maxAmount: 0,
          currentFareMin: 15,
          currentFareMax: 25,
          bargainFareMin: 10,
          bargainFareMax: 20,
          validFrom: "2024-01-01",
          validTo: "2024-12-31",
          status: "active",
          priority: 1,
          userType: "all",
          specialConditions: "",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          name: "Mumbai Airport to Bandra",
          description: "Airport transfers to Bandra area",
          originCity: "Mumbai Airport",
          destinationCity: "Bandra",
          transferType: "Private",
          vehicleType: "Sedan",
          markupType: "percentage",
          markupValue: 25,
          minAmount: 0,
          maxAmount: 0,
          currentFareMin: 20,
          currentFareMax: 30,
          bargainFareMin: 15,
          bargainFareMax: 25,
          validFrom: "2024-01-01",
          validTo: "2024-12-31",
          status: "active",
          priority: 2,
          userType: "all",
          specialConditions: "",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];
      setMarkups(mockMarkups);
    } catch (error) {
      console.error("Error loading transfer markups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarkup = async () => {
    try {
      if (!formData.name || !formData.originCity || !formData.destinationCity) {
        alert("Please fill in all required fields");
        return;
      }

      // For now, just add to local state - replace with API call when backend is ready
      const newMarkup: TransferMarkup = {
        id: (markups.length + 1).toString(),
        name: formData.name!,
        description: formData.description || "",
        originCity: formData.originCity!,
        destinationCity: formData.destinationCity!,
        transferType: formData.transferType as any,
        vehicleType: formData.vehicleType as any,
        markupType: formData.markupType as any,
        markupValue: formData.markupValue!,
        minAmount: formData.minAmount!,
        maxAmount: formData.maxAmount!,
        currentFareMin: formData.currentFareMin!,
        currentFareMax: formData.currentFareMax!,
        bargainFareMin: formData.bargainFareMin!,
        bargainFareMax: formData.bargainFareMax!,
        validFrom: formData.validFrom!,
        validTo: formData.validTo!,
        status: formData.status as any,
        priority: formData.priority!,
        userType: formData.userType as any,
        specialConditions: formData.specialConditions || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMarkups([...markups, newMarkup]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating transfer markup:", error);
      alert("Failed to create transfer markup");
    }
  };

  const handleUpdateMarkup = async () => {
    try {
      if (!editingMarkup || !formData.name) {
        alert("Please fill in all required fields");
        return;
      }

      // For now, just update local state - replace with API call when backend is ready
      const updatedMarkups = markups.map(markup =>
        markup.id === editingMarkup.id
          ? { ...markup, ...formData, updatedAt: new Date().toISOString() }
          : markup
      );

      setMarkups(updatedMarkups);
      setEditingMarkup(null);
      resetForm();
    } catch (error) {
      console.error("Error updating transfer markup:", error);
      alert("Failed to update transfer markup");
    }
  };

  const handleDeleteMarkup = async (markupId: string) => {
    try {
      // For now, just remove from local state - replace with API call when backend is ready
      setMarkups(markups.filter(markup => markup.id !== markupId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting transfer markup:", error);
      alert("Failed to delete transfer markup");
    }
  };

  const toggleMarkupStatus = async (markupId: string) => {
    try {
      // For now, just toggle in local state - replace with API call when backend is ready
      const updatedMarkups = markups.map(markup =>
        markup.id === markupId
          ? { 
              ...markup, 
              status: markup.status === "active" ? "inactive" : "active",
              updatedAt: new Date().toISOString()
            }
          : markup
      );
      setMarkups(updatedMarkups);
    } catch (error) {
      console.error("Error toggling transfer markup status:", error);
      alert("Failed to update transfer markup status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      originCity: "",
      destinationCity: "",
      transferType: "ALL",
      vehicleType: "ALL",
      markupType: "percentage",
      markupValue: 20,
      minAmount: 0,
      maxAmount: 0,
      currentFareMin: 15,
      currentFareMax: 25,
      bargainFareMin: 10,
      bargainFareMax: 20,
      validFrom: new Date().toISOString().split("T")[0],
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "active",
      priority: 1,
      userType: "all",
      specialConditions: "",
    });
  };

  const startEdit = (markup: TransferMarkup) => {
    setEditingMarkup(markup);
    setFormData({
      name: markup.name,
      description: markup.description,
      originCity: markup.originCity,
      destinationCity: markup.destinationCity,
      transferType: markup.transferType,
      vehicleType: markup.vehicleType,
      markupType: markup.markupType,
      markupValue: markup.markupValue,
      minAmount: markup.minAmount,
      maxAmount: markup.maxAmount,
      currentFareMin: markup.currentFareMin,
      currentFareMax: markup.currentFareMax,
      bargainFareMin: markup.bargainFareMin,
      bargainFareMax: markup.bargainFareMax,
      validFrom: markup.validFrom,
      validTo: markup.validTo,
      status: markup.status,
      priority: markup.priority,
      userType: markup.userType,
      specialConditions: markup.specialConditions,
    });
    setShowCreateModal(true);
  };

  const filteredMarkups = markups.filter(markup => {
    const matchesSearch = markup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         markup.originCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         markup.destinationCity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || markup.status === statusFilter;
    const matchesTransferType = transferTypeFilter === "all" || markup.transferType === transferTypeFilter;
    
    return matchesSearch && matchesStatus && matchesTransferType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Car className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transfer Markup Management</h1>
            <p className="text-gray-600">Manage markup rules for transfer bookings</p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingMarkup(null);
            setShowCreateModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Markup
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search markups by name, origin, destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {TRANSFER_TYPES.filter(type => type.value !== "ALL").map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Markups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Transfer Markups ({filteredMarkups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Markup Rule</TableHead>
                  <TableHead>Route & Type</TableHead>
                  <TableHead>Markup</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMarkups.map((markup) => (
                  <TableRow key={markup.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium truncate max-w-48" title={markup.name}>
                          {markup.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-48" title={markup.description}>
                          {markup.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{markup.originCity} → {markup.destinationCity}</div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">{markup.transferType}</Badge>
                          <Badge variant="outline" className="text-xs">{markup.vehicleType}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {markup.markupType === "percentage" ? `${markup.markupValue}%` : `₹${markup.markupValue}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          Range: {markup.currentFareMin}% - {markup.currentFareMax}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(markup.validFrom).toLocaleDateString()}</div>
                        <div className="text-gray-500">to {new Date(markup.validTo).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(markup.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(markup)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMarkupStatus(markup.id)}>
                            <Settings className="w-4 h-4 mr-2" />
                            {markup.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteConfirmId(markup.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredMarkups.length === 0 && (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transfer markups found</p>
              <p className="text-sm text-gray-400">Create your first transfer markup to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMarkup ? "Edit Transfer Markup" : "Create New Transfer Markup"}
            </DialogTitle>
            <DialogDescription>
              Set up markup rules for transfer bookings based on routes, vehicle types, and other criteria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Markup Rule Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Dubai Airport to Marina"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
            </div>

            {/* Route Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originCity">Origin City *</Label>
                <Select value={formData.originCity} onValueChange={(value) => setFormData({ ...formData, originCity: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(city => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="destinationCity">Destination City *</Label>
                <Select value={formData.destinationCity} onValueChange={(value) => setFormData({ ...formData, destinationCity: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(city => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transfer & Vehicle Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transferType">Transfer Type</Label>
                <Select value={formData.transferType} onValueChange={(value) => setFormData({ ...formData, transferType: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFER_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Markup Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="markupType">Markup Type</Label>
                <Select value={formData.markupType} onValueChange={(value) => setFormData({ ...formData, markupType: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="markupValue">Markup Value *</Label>
                <Input
                  id="markupValue"
                  type="number"
                  value={formData.markupValue}
                  onChange={(e) => setFormData({ ...formData, markupValue: parseFloat(e.target.value) || 0 })}
                  placeholder="20"
                />
              </div>
            </div>

            {/* Fare Ranges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">Current Fare Range (%)</Label>
                <p className="text-xs text-gray-500 mb-2">Markup percentage range for user-visible pricing</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={formData.currentFareMin}
                    onChange={(e) => setFormData({ ...formData, currentFareMin: parseFloat(e.target.value) || 0 })}
                    placeholder="Min %"
                  />
                  <Input
                    type="number"
                    value={formData.currentFareMax}
                    onChange={(e) => setFormData({ ...formData, currentFareMax: parseFloat(e.target.value) || 0 })}
                    placeholder="Max %"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Bargain Fare Range (%)</Label>
                <p className="text-xs text-gray-500 mb-2">Acceptable bargain percentage range</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={formData.bargainFareMin}
                    onChange={(e) => setFormData({ ...formData, bargainFareMin: parseFloat(e.target.value) || 0 })}
                    placeholder="Min %"
                  />
                  <Input
                    type="number"
                    value={formData.bargainFareMax}
                    onChange={(e) => setFormData({ ...formData, bargainFareMax: parseFloat(e.target.value) || 0 })}
                    placeholder="Max %"
                  />
                </div>
              </div>
            </div>

            {/* Validity & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="validTo">Valid To</Label>
                <Input
                  id="validTo"
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="userType">User Type</Label>
                <Select value={formData.userType} onValueChange={(value) => setFormData({ ...formData, userType: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="b2c">B2C Only</SelectItem>
                    <SelectItem value="b2b">B2B Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Special Conditions */}
            <div>
              <Label htmlFor="specialConditions">Special Conditions (Optional)</Label>
              <Textarea
                id="specialConditions"
                value={formData.specialConditions}
                onChange={(e) => setFormData({ ...formData, specialConditions: e.target.value })}
                placeholder="Any special conditions or notes for this markup rule..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingMarkup(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingMarkup ? handleUpdateMarkup : handleCreateMarkup}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingMarkup ? "Update Markup" : "Save Markup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transfer Markup</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transfer markup? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteMarkup(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
