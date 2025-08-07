import React, { useState, useEffect } from "react";
import React, { useState, useEffect } from "react";
import { markupService, type AirMarkup, type CreateAirMarkupRequest } from "@/services/markupService";
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
  Plane,
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
} from "lucide-react";

interface AirMarkup {
  id: string;
  name: string;
  description: string;
  airline: string;
  route: {
    from: string;
    to: string;
  };
  class: "economy" | "business" | "first" | "all";
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  validFrom: string;
  validTo: string;
  status: "active" | "inactive" | "expired";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions: string;
  createdAt: string;
  updatedAt: string;
}

const AIRLINES = [
  { code: "AI", name: "Air India", country: "India" },
  { code: "UK", name: "Vistara", country: "India" },
  { code: "6E", name: "IndiGo", country: "India" },
  { code: "SG", name: "SpiceJet", country: "India" },
  { code: "EK", name: "Emirates", country: "UAE" },
  { code: "EY", name: "Etihad", country: "UAE" },
  { code: "QR", name: "Qatar Airways", country: "Qatar" },
  { code: "LH", name: "Lufthansa", country: "Germany" },
  { code: "BA", name: "British Airways", country: "UK" },
  { code: "SQ", name: "Singapore Airlines", country: "Singapore" },
];

const POPULAR_ROUTES = [
  { from: "BOM", to: "DEL", route: "Mumbai → Delhi" },
  { from: "BOM", to: "DXB", route: "Mumbai → Dubai" },
  { from: "DEL", to: "LHR", route: "Delhi → London" },
  { from: "BOM", to: "SIN", route: "Mumbai → Singapore" },
  { from: "DEL", to: "JFK", route: "Delhi → New York" },
  { from: "BOM", to: "LAX", route: "Mumbai → Los Angeles" },
  { from: "DEL", to: "CDG", route: "Delhi → Paris" },
  { from: "BOM", to: "SYD", route: "Mumbai → Sydney" },
];

const CLASS_OPTIONS = [
  { value: "all", label: "All Classes" },
  { value: "economy", label: "Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First Class" },
];

// Mock data
const mockMarkups: AirMarkup[] = [
  {
    id: "1",
    name: "Mumbai-Dubai Economy Markup",
    description: "Standard markup for Mumbai to Dubai economy flights",
    airline: "EK",
    route: { from: "BOM", to: "DXB" },
    class: "economy",
    markupType: "percentage",
    markupValue: 5.5,
    minAmount: 500,
    maxAmount: 2000,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    status: "active",
    priority: 1,
    userType: "all",
    specialConditions: "Valid for advance bookings only",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T15:30:00Z",
  },
  {
    id: "2",
    name: "Delhi-London Business Markup",
    description: "Premium markup for Delhi to London business class",
    airline: "BA",
    route: { from: "DEL", to: "LHR" },
    class: "business",
    markupType: "fixed",
    markupValue: 15000,
    minAmount: 10000,
    maxAmount: 50000,
    validFrom: "2024-02-01",
    validTo: "2024-11-30",
    status: "active",
    priority: 2,
    userType: "b2c",
    specialConditions: "Applies to direct flights only",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-18T12:15:00Z",
  },
];

export default function MarkupManagementAir() {
  const [markups, setMarkups] = useState<AirMarkup[]>(mockMarkups);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAirline, setSelectedAirline] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMarkup, setSelectedMarkup] = useState<AirMarkup | null>(null);
  const [formData, setFormData] = useState<Partial<AirMarkup>>({});
  const [activeTab, setActiveTab] = useState("list");

  // Filter markups
  const filteredMarkups = markups.filter((markup) => {
    const matchesSearch =
      markup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      markup.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${markup.route.from}-${markup.route.to}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesAirline =
      selectedAirline === "all" || markup.airline === selectedAirline;
    const matchesClass =
      selectedClass === "all" || markup.class === selectedClass;
    const matchesStatus =
      selectedStatus === "all" || markup.status === selectedStatus;

    return matchesSearch && matchesAirline && matchesClass && matchesStatus;
  });

  const handleCreateMarkup = () => {
    setFormData({
      name: "",
      description: "",
      airline: "",
      route: { from: "", to: "" },
      class: "economy",
      markupType: "percentage",
      markupValue: 0,
      minAmount: 0,
      maxAmount: 0,
      validFrom: "",
      validTo: "",
      status: "active",
      priority: 1,
      userType: "all",
      specialConditions: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditMarkup = (markup: AirMarkup) => {
    setSelectedMarkup(markup);
    setFormData({ ...markup });
    setIsEditDialogOpen(true);
  };

  const handleSaveMarkup = () => {
    if (selectedMarkup) {
      // Update existing markup
      setMarkups(
        markups.map((m) =>
          m.id === selectedMarkup.id
            ? { ...m, ...formData, updatedAt: new Date().toISOString() }
            : m,
        ),
      );
      setIsEditDialogOpen(false);
    } else {
      // Create new markup
      const newMarkup: AirMarkup = {
        ...(formData as AirMarkup),
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMarkups([...markups, newMarkup]);
      setIsCreateDialogOpen(false);
    }
    setFormData({});
    setSelectedMarkup(null);
  };

  const handleDeleteMarkup = (markupId: string) => {
    if (confirm("Are you sure you want to delete this markup rule?")) {
      setMarkups(markups.filter((m) => m.id !== markupId));
    }
  };

  const toggleMarkupStatus = (markupId: string) => {
    setMarkups(
      markups.map((m) =>
        m.id === markupId
          ? {
              ...m,
              status: m.status === "active" ? "inactive" : "active",
              updatedAt: new Date().toISOString(),
            }
          : m,
      ),
    );
  };

  const StatusBadge = ({ status }: { status: AirMarkup["status"] }) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      inactive: { color: "bg-red-100 text-red-800", icon: AlertCircle },
      expired: { color: "bg-gray-100 text-gray-800", icon: Clock },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const MarkupForm = ({ isEdit = false }) => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>

        <div>
          <Label htmlFor="name">Markup Rule Name</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter markup rule name"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Enter description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="airline">Airline</Label>
            <Select
              value={formData.airline}
              onValueChange={(value) =>
                setFormData({ ...formData, airline: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select airline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Airlines</SelectItem>
                {AIRLINES.map((airline) => (
                  <SelectItem key={airline.code} value={airline.code}>
                    {airline.code} - {airline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="class">Class</Label>
            <Select
              value={formData.class}
              onValueChange={(value) =>
                setFormData({ ...formData, class: value as AirMarkup["class"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Route Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from">From (Origin)</Label>
            <Input
              id="from"
              value={formData.route?.from || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  route: { ...formData.route, from: e.target.value },
                })
              }
              placeholder="Airport code (e.g., BOM)"
            />
          </div>

          <div>
            <Label htmlFor="to">To (Destination)</Label>
            <Input
              id="to"
              value={formData.route?.to || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  route: { ...formData.route, to: e.target.value },
                })
              }
              placeholder="Airport code (e.g., DXB)"
            />
          </div>
        </div>

        {/* Quick Route Selection */}
        <div>
          <Label>Popular Routes (Quick Select)</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {POPULAR_ROUTES.map((route) => (
              <Button
                key={`${route.from}-${route.to}`}
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({
                    ...formData,
                    route: { from: route.from, to: route.to },
                  })
                }
                className="text-xs"
              >
                {route.route}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Markup Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">
          Markup Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="markupType">Markup Type</Label>
            <Select
              value={formData.markupType}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  markupType: value as AirMarkup["markupType"],
                })
              }
            >
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
            <Label htmlFor="markupValue">
              Markup Value{" "}
              {formData.markupType === "percentage" ? "(%)" : "(₹)"}
            </Label>
            <Input
              id="markupValue"
              type="number"
              value={formData.markupValue || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  markupValue: parseFloat(e.target.value) || 0,
                })
              }
              placeholder={
                formData.markupType === "percentage"
                  ? "e.g., 5.5"
                  : "e.g., 1500"
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minAmount">Minimum Markup Amount (₹)</Label>
            <Input
              id="minAmount"
              type="number"
              value={formData.minAmount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minAmount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="e.g., 500"
            />
          </div>

          <div>
            <Label htmlFor="maxAmount">Maximum Markup Amount (₹)</Label>
            <Input
              id="maxAmount"
              type="number"
              value={formData.maxAmount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxAmount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="e.g., 5000"
            />
          </div>
        </div>
      </div>

      {/* Validity and Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">
          Validity & Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="validFrom">Valid From</Label>
            <Input
              id="validFrom"
              type="date"
              value={formData.validFrom || ""}
              onChange={(e) =>
                setFormData({ ...formData, validFrom: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="validTo">Valid To</Label>
            <Input
              id="validTo"
              type="date"
              value={formData.validTo || ""}
              onChange={(e) =>
                setFormData({ ...formData, validTo: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: parseInt(e.target.value) || 1,
                })
              }
              placeholder="1 = Highest"
            />
          </div>

          <div>
            <Label htmlFor="userType">User Type</Label>
            <Select
              value={formData.userType}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  userType: value as AirMarkup["userType"],
                })
              }
            >
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

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="status"
              checked={formData.status === "active"}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  status: checked ? "active" : "inactive",
                })
              }
            />
            <Label htmlFor="status">Active</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="specialConditions">Special Conditions</Label>
          <Textarea
            id="specialConditions"
            value={formData.specialConditions || ""}
            onChange={(e) =>
              setFormData({ ...formData, specialConditions: e.target.value })
            }
            placeholder="Enter any special conditions or notes"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Markup List
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Markup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Air Markup Management
                </div>
                <Button
                  onClick={handleCreateMarkup}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Markup
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search markups by name, route, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select
                  value={selectedAirline}
                  onValueChange={setSelectedAirline}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by airline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Airlines</SelectItem>
                    {AIRLINES.map((airline) => (
                      <SelectItem key={airline.code} value={airline.code}>
                        {airline.code} - {airline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First Class</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Markups Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Markup Rule</TableHead>
                      <TableHead>Route & Airline</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Markup</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarkups.map((markup) => {
                      const airline = AIRLINES.find(
                        (a) => a.code === markup.airline,
                      );

                      return (
                        <TableRow key={markup.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{markup.name}</p>
                              <p className="text-sm text-gray-600 truncate max-w-48">
                                {markup.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <MapPin className="w-3 h-3 mr-1" />
                                {markup.route.from} → {markup.route.to}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Plane className="w-3 h-3 mr-1" />
                                {airline
                                  ? `${airline.code} - ${airline.name}`
                                  : markup.airline}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {markup.class}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm font-medium">
                                {markup.markupType === "percentage" ? (
                                  <Percent className="w-3 h-3 mr-1" />
                                ) : (
                                  <DollarSign className="w-3 h-3 mr-1" />
                                )}
                                {markup.markupValue}
                                {markup.markupType === "percentage" ? "%" : "₹"}
                              </div>
                              <div className="text-xs text-gray-600">
                                Min: ₹{markup.minAmount} | Max: ₹
                                {markup.maxAmount}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(
                                  markup.validFrom,
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-600">
                                to{" "}
                                {new Date(markup.validTo).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={markup.status} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditMarkup(markup)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Markup
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleMarkupStatus(markup.id)}
                                >
                                  {markup.status === "active" ? (
                                    <>
                                      <AlertCircle className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Activity className="w-4 h-4 mr-2" />
                                  View Stats
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMarkup(markup.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Markup
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Air Markup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarkupForm />
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setFormData({})}>
                  Reset
                </Button>
                <Button onClick={handleSaveMarkup}>Save Markup</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Markup Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Air Markup Rule</DialogTitle>
            <DialogDescription>
              Update markup configuration for flight bookings.
            </DialogDescription>
          </DialogHeader>
          <MarkupForm isEdit={true} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveMarkup}>Update Markup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
