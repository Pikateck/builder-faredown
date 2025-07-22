import React, { useState, useEffect } from "react";
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
  Hotel,
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
  Star,
  Bed,
  Building,
  Car,
  Wifi,
  Coffee,
} from "lucide-react";

interface HotelMarkup {
  id: string;
  name: string;
  description: string;
  city: string;
  hotelName: string;
  hotelChain: string;
  starRating: number;
  roomCategory: "standard" | "deluxe" | "suite" | "all";
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  validFrom: string;
  validTo: string;
  checkInDays: string[];
  minStay: number;
  maxStay: number;
  status: "active" | "inactive" | "expired";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  seasonType: "all" | "peak" | "off-peak" | "festival";
  specialConditions: string;
  createdAt: string;
  updatedAt: string;
}

const POPULAR_CITIES = [
  { code: "BOM", name: "Mumbai", country: "India" },
  { code: "DEL", name: "Delhi", country: "India" },
  { code: "BLR", name: "Bangalore", country: "India" },
  { code: "MAA", name: "Chennai", country: "India" },
  { code: "CCU", name: "Kolkata", country: "India" },
  { code: "GOI", name: "Goa", country: "India" },
  { code: "DXB", name: "Dubai", country: "UAE" },
  { code: "AUH", name: "Abu Dhabi", country: "UAE" },
  { code: "SIN", name: "Singapore", country: "Singapore" },
  { code: "BKK", name: "Bangkok", country: "Thailand" },
  { code: "KUL", name: "Kuala Lumpur", country: "Malaysia" },
  { code: "LHR", name: "London", country: "UK" },
  { code: "CDG", name: "Paris", country: "France" },
  { code: "JFK", name: "New York", country: "USA" },
];

const HOTEL_CHAINS = [
  "Marriott",
  "Hilton",
  "Hyatt",
  "Radisson",
  "ITC Hotels",
  "Taj Hotels",
  "Oberoi",
  "Leela",
  "Accor",
  "Four Seasons",
  "Ritz Carlton",
  "Sheraton",
  "Holiday Inn",
  "Crowne Plaza",
  "Novotel",
  "Ibis",
  "OYO",
  "Zostel",
];

const ROOM_CATEGORIES = [
  { value: "all", label: "All Room Types" },
  { value: "standard", label: "Standard Room" },
  { value: "deluxe", label: "Deluxe Room" },
  { value: "suite", label: "Suite" },
];

const SEASON_TYPES = [
  { value: "all", label: "All Seasons" },
  { value: "peak", label: "Peak Season" },
  { value: "off-peak", label: "Off-Peak Season" },
  { value: "festival", label: "Festival Season" },
];

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

// Mock data
const mockMarkups: HotelMarkup[] = [
  {
    id: "1",
    name: "Mumbai Luxury Hotels Markup",
    description: "Standard markup for luxury hotels in Mumbai",
    city: "Mumbai",
    hotelName: "Taj Hotel",
    hotelChain: "Taj Hotels",
    starRating: 5,
    roomCategory: "deluxe",
    markupType: "percentage",
    markupValue: 8.5,
    minAmount: 1000,
    maxAmount: 5000,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    checkInDays: ["friday", "saturday", "sunday"],
    minStay: 1,
    maxStay: 7,
    status: "active",
    priority: 1,
    userType: "all",
    seasonType: "peak",
    specialConditions: "Valid for weekend bookings only",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T15:30:00Z",
  },
  {
    id: "2",
    name: "Delhi Business Hotels Markup",
    description: "Corporate markup for business hotels in Delhi",
    city: "Delhi",
    hotelName: "ITC Maurya",
    hotelChain: "ITC Hotels",
    starRating: 5,
    roomCategory: "suite",
    markupType: "fixed",
    markupValue: 2500,
    minAmount: 1500,
    maxAmount: 8000,
    validFrom: "2024-02-01",
    validTo: "2024-11-30",
    checkInDays: ["monday", "tuesday", "wednesday", "thursday"],
    minStay: 2,
    maxStay: 14,
    status: "active",
    priority: 2,
    userType: "b2b",
    seasonType: "all",
    specialConditions: "Applies to corporate bookings with minimum 2 nights",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-18T12:15:00Z",
  },
];

export default function MarkupManagementHotel() {
  const [markups, setMarkups] = useState<HotelMarkup[]>(mockMarkups);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMarkup, setSelectedMarkup] = useState<HotelMarkup | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<HotelMarkup>>({});
  const [activeTab, setActiveTab] = useState("list");

  // Filter markups
  const filteredMarkups = markups.filter((markup) => {
    const matchesSearch =
      markup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      markup.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      markup.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      markup.hotelName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity =
      selectedCity === "all" ||
      markup.city.toLowerCase().includes(selectedCity.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || markup.roomCategory === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || markup.status === selectedStatus;

    return matchesSearch && matchesCity && matchesCategory && matchesStatus;
  });

  const handleCreateMarkup = () => {
    setFormData({
      name: "",
      description: "",
      city: "",
      hotelName: "",
      hotelChain: "",
      starRating: 3,
      roomCategory: "standard",
      markupType: "percentage",
      markupValue: 0,
      minAmount: 0,
      maxAmount: 0,
      validFrom: "",
      validTo: "",
      checkInDays: [],
      minStay: 1,
      maxStay: 30,
      status: "active",
      priority: 1,
      userType: "all",
      seasonType: "all",
      specialConditions: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditMarkup = (markup: HotelMarkup) => {
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
      const newMarkup: HotelMarkup = {
        ...(formData as HotelMarkup),
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

  const handleCheckInDaysChange = (day: string, checked: boolean) => {
    const currentDays = formData.checkInDays || [];
    if (checked) {
      setFormData({ ...formData, checkInDays: [...currentDays, day] });
    } else {
      setFormData({
        ...formData,
        checkInDays: currentDays.filter((d) => d !== day),
      });
    }
  };

  const StatusBadge = ({ status }: { status: HotelMarkup["status"] }) => {
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

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">({rating})</span>
    </div>
  );

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
            <Label htmlFor="city">City</Label>
            <Select
              value={formData.city}
              onValueChange={(value) =>
                setFormData({ ...formData, city: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Cities</SelectItem>
                {POPULAR_CITIES.map((city) => (
                  <SelectItem key={city.code} value={city.name}>
                    {city.name}, {city.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="hotelName">Hotel Name</Label>
            <Input
              id="hotelName"
              value={formData.hotelName || ""}
              onChange={(e) =>
                setFormData({ ...formData, hotelName: e.target.value })
              }
              placeholder="Enter hotel name or 'ALL' for all hotels"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hotelChain">Hotel Chain</Label>
            <Select
              value={formData.hotelChain}
              onValueChange={(value) =>
                setFormData({ ...formData, hotelChain: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hotel chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Chains</SelectItem>
                {HOTEL_CHAINS.map((chain) => (
                  <SelectItem key={chain} value={chain}>
                    {chain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="starRating">Star Rating</Label>
            <Select
              value={formData.starRating?.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, starRating: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Star Ratings</SelectItem>
                <SelectItem value="3">3 Star</SelectItem>
                <SelectItem value="4">4 Star</SelectItem>
                <SelectItem value="5">5 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="roomCategory">Room Category</Label>
          <Select
            value={formData.roomCategory}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                roomCategory: value as HotelMarkup["roomCategory"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROOM_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  markupType: value as HotelMarkup["markupType"],
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
                  ? "e.g., 8.5"
                  : "e.g., 2500"
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
              placeholder="e.g., 1000"
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
              placeholder="e.g., 8000"
            />
          </div>
        </div>
      </div>

      {/* Booking Conditions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">
          Booking Conditions
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

        <div>
          <Label>Check-in Days (Select applicable days)</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={day.value}
                  checked={formData.checkInDays?.includes(day.value) || false}
                  onChange={(e) =>
                    handleCheckInDaysChange(day.value, e.target.checked)
                  }
                  className="rounded"
                />
                <label htmlFor={day.value} className="text-sm">
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minStay">Minimum Stay (nights)</Label>
            <Input
              id="minStay"
              type="number"
              value={formData.minStay || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minStay: parseInt(e.target.value) || 1,
                })
              }
              placeholder="e.g., 1"
            />
          </div>

          <div>
            <Label htmlFor="maxStay">Maximum Stay (nights)</Label>
            <Input
              id="maxStay"
              type="number"
              value={formData.maxStay || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxStay: parseInt(e.target.value) || 30,
                })
              }
              placeholder="e.g., 30"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="seasonType">Season Type</Label>
          <Select
            value={formData.seasonType}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                seasonType: value as HotelMarkup["seasonType"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEASON_TYPES.map((season) => (
                <SelectItem key={season.value} value={season.value}>
                  {season.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Settings</h3>

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
                  userType: value as HotelMarkup["userType"],
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
            <Hotel className="w-4 h-4" />
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
                  <Hotel className="w-5 h-5" />
                  Hotel Markup Management
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
                      placeholder="Search markups by name, city, hotel, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {POPULAR_CITIES.map((city) => (
                      <SelectItem key={city.code} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
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
                      <TableHead>Hotel Details</TableHead>
                      <TableHead>Room & Season</TableHead>
                      <TableHead>Markup</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarkups.map((markup) => {
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
                                <Building className="w-3 h-3 mr-1" />
                                {markup.hotelName}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="w-3 h-3 mr-1" />
                                {markup.city}
                              </div>
                              <StarRating rating={markup.starRating} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge
                                variant="outline"
                                className="capitalize flex items-center gap-1"
                              >
                                <Bed className="w-3 h-3" />
                                {markup.roomCategory}
                              </Badge>
                              <div className="text-xs text-gray-600 capitalize">
                                {markup.seasonType} season
                              </div>
                            </div>
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
                Create New Hotel Markup
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
            <DialogTitle>Edit Hotel Markup Rule</DialogTitle>
            <DialogDescription>
              Update markup configuration for hotel bookings.
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
