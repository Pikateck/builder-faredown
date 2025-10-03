import React, { useState, useEffect } from "react";
import {
  promoCodeService,
  type PromoCode,
  type CreatePromoCodeRequest,
} from "@/services/promoCodeService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CABIN_CLASS_OPTIONS,
  getCabinClassLabel,
  normalizeCabinClass,
  type CabinClassValue,
} from "@/lib/cabinClasses";
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
import { AirportSelect } from "@/components/ui/airport-select";
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Download,
  Upload,
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
  Plane,
  Hotel,
  Users,
  Target,
  Image as ImageIcon,
  MapPin,
  Building,
  Star,
  RefreshCw,
} from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  description: string;
  category:
    | "flight"
    | "hotel"
    | "sightseeing"
    | "transfers"
    | "packages"
    | "all";
  image?: string;
  discountType: "percentage" | "fixed";
  discountMinValue: number;
  discountMaxValue: number;
  minimumFareAmount: number;
  marketingBudget: number;
  expiryDate: string;
  promoCodeImage: string;
  displayOnHomePage: "yes" | "no";
  status: "pending" | "active";

  // Flight-specific fields
  origin?: string | null;
  destination?: string | null;
  carrierCode?: string;
  cabinClass?: CabinClassValue | null;
  flightBy?: string;

  // Hotel-specific fields
  hotelCity?: string;
  hotelName?: string;

  // Sightseeing-specific fields
  tourType?: string;
  tourCity?: string;
  tourDuration?: string;

  // Transfer-specific fields
  vehicleType?: string;
  transferRoute?: string;
  pickupLocation?: string;
  dropLocation?: string;

  // Package-specific fields
  packageCategory?: string;
  packageDuration?: string;
  packageRegion?: string;

  createdOn: string;
  updatedOn: string;
  module: "flight" | "hotel" | "sightseeing" | "transfers" | "packages";
  validityType: "unlimited" | "limited";
  usageCount?: number;
  maxUsage?: number;
}

const AIRLINES = [
  { code: "ALL", name: "All Airlines" },
  { code: "AI", name: "Air India" },
  { code: "UK", name: "Vistara" },
  { code: "6E", name: "IndiGo" },
  { code: "SG", name: "SpiceJet" },
  { code: "EK", name: "Emirates" },
  { code: "EY", name: "Etihad" },
  { code: "QR", name: "Qatar Airways" },
];

const CITIES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ras Al Khaimah",
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Goa",
  "Singapore",
  "Bangkok",
  "Kuala Lumpur",
  "London",
  "New York",
  "Paris",
  "Sydney",
  "Doha",
  "Jeddah",
  "Istanbul",
];

const VEHICLE_TYPES = [
  { value: "ALL", label: "All Vehicles" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "luxury", label: "Luxury Car" },
  { value: "van", label: "Van" },
  { value: "bus", label: "Mini Bus" },
];

const TOUR_TYPES = [
  { value: "ALL", label: "All Tours" },
  { value: "city_tour", label: "City Tour" },
  { value: "cultural", label: "Cultural Tour" },
  { value: "adventure", label: "Adventure Tour" },
  { value: "heritage", label: "Heritage Tour" },
  { value: "nature", label: "Nature Tour" },
];

const PACKAGE_CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "cultural", label: "Cultural" },
  { value: "beach", label: "Beach" },
  { value: "adventure", label: "Adventure" },
  { value: "honeymoon", label: "Honeymoon" },
  { value: "family", label: "Family" },
  { value: "luxury", label: "Luxury" },
  { value: "budget", label: "Budget" },
];

// Mock data based on the screenshots - extended for all modules
const mockPromoCodes: PromoCode[] = [
  {
    id: "1",
    code: "FAREDOWNHOTEL",
    description: "Hotel booking discount",
    category: "hotel",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F57003a8eaa4240e5a35dce05a23e72f5?format=webp&width=800",
    discountType: "percentage",
    discountMinValue: 2000,
    discountMaxValue: 5000,
    minimumFareAmount: 10000,
    marketingBudget: 100000,
    expiryDate: "2024-12-31",
    promoCodeImage: "",
    displayOnHomePage: "yes",
    status: "active",
    hotelCity: "",
    hotelName: "",
    createdOn: "2024-01-14 13:31",
    updatedOn: "2024-01-16 13:58",
    module: "hotel",
    validityType: "unlimited",
  },
  {
    id: "2",
    code: "FAREDOWNFLIGHT",
    description: "Flight discount promo",
    category: "flight",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F8542893d1c0b422f87eee4c35e5441ae?format=webp&width=800",
    discountType: "fixed",
    discountMinValue: 1500,
    discountMaxValue: 3000,
    minimumFareAmount: 8000,
    marketingBudget: 150000,
    expiryDate: "2024-11-30",
    promoCodeImage: "",
    displayOnHomePage: "no",
    status: "active",
    origin: null,
    destination: null,
    carrierCode: "ALL",
    cabinClass: "ALL",
    flightBy: "",
    createdOn: "2024-01-10 09:15",
    updatedOn: "2024-01-15 16:45",
    module: "flight",
    validityType: "limited",
    usageCount: 45,
    maxUsage: 100,
  },
  {
    id: "3",
    code: "SIGHTSEEING20",
    description: "20% off sightseeing tours",
    category: "sightseeing",
    discountType: "percentage",
    discountMinValue: 500,
    discountMaxValue: 2000,
    minimumFareAmount: 2500,
    marketingBudget: 50000,
    expiryDate: "2024-12-31",
    promoCodeImage: "",
    displayOnHomePage: "yes",
    status: "active",
    tourType: "cultural",
    tourCity: "ALL",
    createdOn: "2024-01-20 10:30",
    updatedOn: "2024-01-22 14:20",
    module: "sightseeing",
    validityType: "unlimited",
  },
  {
    id: "4",
    code: "TRANSFER15",
    description: "15% discount on airport transfers",
    category: "transfers",
    discountType: "percentage",
    discountMinValue: 300,
    discountMaxValue: 1500,
    minimumFareAmount: 2000,
    marketingBudget: 75000,
    expiryDate: "2024-12-31",
    promoCodeImage: "",
    displayOnHomePage: "no",
    status: "active",
    vehicleType: "ALL",
    transferRoute: "Airport",
    createdOn: "2024-01-25 11:45",
    updatedOn: "2024-01-26 09:30",
    module: "transfers",
    validityType: "unlimited",
  },
  {
    id: "5",
    code: "PACKAGE25",
    description: "Special discount on holiday packages",
    category: "packages",
    discountType: "fixed",
    discountMinValue: 5000,
    discountMaxValue: 25000,
    minimumFareAmount: 25000,
    marketingBudget: 200000,
    expiryDate: "2024-12-31",
    promoCodeImage: "",
    displayOnHomePage: "yes",
    status: "active",
    packageCategory: "luxury",
    packageRegion: "ALL",
    createdOn: "2024-01-30 16:20",
    updatedOn: "2024-02-01 12:15",
    module: "packages",
    validityType: "limited",
    usageCount: 23,
    maxUsage: 200,
  },
];

export default function PromoCodeManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<PromoCode>>({});
  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // Load promo codes on component mount and when filters change
  useEffect(() => {
    loadPromoCodes();
  }, [searchTerm, selectedModule, selectedStatus, pagination.page]);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await promoCodeService.getPromoCodes({
        search: searchTerm || undefined,
        module: selectedModule,
        status: selectedStatus,
        page: pagination.page,
        limit: 10,
      });

      setPromoCodes(result.promoCodes);
      setPagination({
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      });
    } catch (err) {
      console.warn("API not available, using mock data:", err);

      // Use mock data as fallback
      let filteredMockData = [...mockPromoCodes];

      // Apply filters to mock data
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredMockData = filteredMockData.filter(
          (code) =>
            code.code.toLowerCase().includes(searchLower) ||
            code.description.toLowerCase().includes(searchLower),
        );
      }

      if (selectedModule && selectedModule !== "all") {
        filteredMockData = filteredMockData.filter(
          (code) => code.module === selectedModule || code.module === "all",
        );
      }

      if (selectedStatus && selectedStatus !== "all") {
        filteredMockData = filteredMockData.filter(
          (code) => code.status === selectedStatus,
        );
      }

      // Pagination for mock data
      const startIndex = (pagination.page - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedMockData = filteredMockData.slice(startIndex, endIndex);

      setPromoCodes(paginatedMockData);
      setPagination({
        page: pagination.page,
        totalPages: Math.ceil(filteredMockData.length / 10),
        total: filteredMockData.length,
      });

      setError("Using demo data - backend connection not available");
    } finally {
      setLoading(false);
    }
  };

  // Use server-filtered promo codes directly
  const filteredPromoCodes = promoCodes;

  const handleCreatePromoCode = () => {
    setFormData({
      code: "",
      description: "",
      category: "flight",
      discountType: "percentage",
      discountMinValue: 5.0,
      discountMaxValue: 25.0,
      minimumFareAmount: 1000,
      marketingBudget: 10000,
      expiryDate: "",
      promoCodeImage: "",
      displayOnHomePage: "yes",
      status: "pending",
      // Flight fields
      origin: null,
      destination: null,
      carrierCode: "ALL",
      cabinClass: "economy",
      flightBy: "",
      // Hotel fields
      hotelCity: "ALL",
      hotelName: "",
      // Sightseeing fields
      tourType: "ALL",
      tourCity: "ALL",
      tourDuration: "",
      // Transfer fields
      vehicleType: "ALL",
      transferRoute: "",
      pickupLocation: "",
      dropLocation: "",
      // Package fields
      packageCategory: "ALL",
      packageDuration: "",
      packageRegion: "",
      validityType: "unlimited",
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditPromoCode = (promo: PromoCode) => {
    setSelectedPromoCode(promo);
    setFormData({ ...promo });
    setIsEditDialogOpen(true);
  };

  const handleSavePromoCode = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.code || !formData.description) {
        setError("Code and description are required");
        return;
      }

      try {
        if (selectedPromoCode) {
          // Update existing promo code
          await promoCodeService.updatePromoCode(
            selectedPromoCode.id,
            formData as Partial<CreatePromoCodeRequest>,
          );
          setIsEditDialogOpen(false);
        } else {
          // Create new promo code
          await promoCodeService.createPromoCode(
            formData as CreatePromoCodeRequest,
          );
          setIsCreateDialogOpen(false);
          // Switch back to list tab after successful creation
          setActiveTab("list");
        }

        // Reload promo codes to reflect changes
        await loadPromoCodes();
      } catch (apiError) {
        console.warn("API save failed, updating mock data:", apiError);

        // Fallback to mock data update
        const newPromoCode = {
          id: selectedPromoCode?.id || `mock_${Date.now()}`,
          code: formData.code!.toUpperCase(),
          description: formData.description!,
          category: formData.category || "flight",
          discountType: formData.discountType || "percentage",
          discountMinValue: formData.discountMinValue || 10,
          discountMaxValue: formData.discountMaxValue || 1000,
          minimumFareAmount: formData.minimumFareAmount || 5000,
          marketingBudget: formData.marketingBudget || 50000,
          expiryDate: formData.expiryDate || "2024-12-31",
          promoCodeImage: formData.promoCodeImage || "",
          displayOnHomePage: formData.displayOnHomePage || "no",
          status: formData.status || "pending",
          createdOn:
            selectedPromoCode?.createdOn ||
            new Date().toISOString().split("T")[0] +
              " " +
              new Date().toTimeString().split(" ")[0],
          updatedOn:
            new Date().toISOString().split("T")[0] +
            " " +
            new Date().toTimeString().split(" ")[0],
          module:
            formData.category === "all" ? "all" : formData.category || "flight",
          validityType: formData.validityType || "unlimited",
          usageCount: selectedPromoCode?.usageCount || 0,
          maxUsage: formData.maxUsage || null,
          ...formData, // Include all other fields
        } as PromoCode;

        if (selectedPromoCode) {
          // Update existing in mock data
          const index = mockPromoCodes.findIndex(
            (p) => p.id === selectedPromoCode.id,
          );
          if (index !== -1) {
            mockPromoCodes[index] = newPromoCode;
          }
          setIsEditDialogOpen(false);
        } else {
          // Add new to mock data
          mockPromoCodes.unshift(newPromoCode);
          setIsCreateDialogOpen(false);
          setActiveTab("list");
        }

        // Update local state
        await loadPromoCodes();
        setError("Saved to demo data - backend connection not available");
      }

      setFormData({});
      setSelectedPromoCode(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save promo code",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromoCode = async (promoId: string) => {
    if (confirm("Are you sure you want to delete this promo code?")) {
      try {
        setError(null);
        await promoCodeService.deletePromoCode(promoId);
        await loadPromoCodes(); // Reload list
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete promo code",
        );
      }
    }
  };

  const togglePromoCodeStatus = async (promoId: string) => {
    try {
      setError(null);
      await promoCodeService.togglePromoCodeStatus(promoId);
      await loadPromoCodes(); // Reload list to reflect changes
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update promo code status",
      );
    }
  };

  const StatusBadge = ({ status }: { status: PromoCode["status"] }) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
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

  const PromoCodeForm = ({ isEdit = false }) => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="code">Promo Code*</Label>
          <Input
            id="code"
            value={formData.code || ""}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="Enter promo code"
          />
        </div>

        <div>
          <Label htmlFor="description">Description*</Label>
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

        <div>
          <Label htmlFor="category">Category*</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                category: value as PromoCode["category"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Please Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flight">Flight</SelectItem>
              <SelectItem value="hotel">Hotel</SelectItem>
              <SelectItem value="sightseeing">Sightseeing</SelectItem>
              <SelectItem value="transfers">Transfers</SelectItem>
              <SelectItem value="packages">Packages</SelectItem>
              <SelectItem value="all">All Modules</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Flight-specific fields */}
        {(formData.category === "flight" || formData.category === "all") && (
          <div className="space-y-4 border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-blue-700">Flight Details</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Select
                  value={formData.origin}
                  onValueChange={(value) =>
                    setFormData({ ...formData, origin: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="destination">Destination</Label>
                <AirportSelect
                  value={formData.destination || "ALL"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      destination: value === "ALL" ? null : value,
                    })
                  }
                  placeholder="Select destination airport"
                  includeAll={true}
                  allLabel="All Destinations"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="carrierCode">Carrier Code</Label>
                <Select
                  value={formData.carrierCode}
                  onValueChange={(value) =>
                    setFormData({ ...formData, carrierCode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {AIRLINES.map((airline) => (
                      <SelectItem key={airline.code} value={airline.code}>
                        {airline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cabinClass">Cabin Class</Label>
                <Select
                  value={formData.cabinClass}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cabinClass: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {CABIN_CLASSES.map((cabin) => (
                      <SelectItem key={cabin.value} value={cabin.value}>
                        {cabin.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="flightBy">Flight By</Label>
              <Input
                id="flightBy"
                value={formData.flightBy || ""}
                onChange={(e) =>
                  setFormData({ ...formData, flightBy: e.target.value })
                }
                placeholder="Enter flight details"
              />
            </div>
          </div>
        )}

        {/* Hotel-specific fields */}
        {(formData.category === "hotel" || formData.category === "all") && (
          <div className="space-y-4 border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-green-700">Hotel Details</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hotelCity">Hotel City</Label>
                <Select
                  value={formData.hotelCity}
                  onValueChange={(value) =>
                    setFormData({ ...formData, hotelCity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Cities</SelectItem>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
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
          </div>
        )}

        {/* Sightseeing-specific fields */}
        {(formData.category === "sightseeing" ||
          formData.category === "all") && (
          <div className="space-y-4 border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-purple-700">Sightseeing Details</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tourType">Tour Type</Label>
                <Select
                  value={formData.tourType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tourType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tour type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOUR_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tourCity">Tour City</Label>
                <Select
                  value={formData.tourCity}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tourCity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Cities</SelectItem>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tourDuration">Tour Duration</Label>
              <Input
                id="tourDuration"
                value={formData.tourDuration || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tourDuration: e.target.value })
                }
                placeholder="e.g., Half Day, Full Day, 2 Hours"
              />
            </div>
          </div>
        )}

        {/* Transfer-specific fields */}
        {(formData.category === "transfers" || formData.category === "all") && (
          <div className="space-y-4 border-l-4 border-orange-500 pl-4">
            <h4 className="font-medium text-orange-700">Transfer Details</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transferRoute">Transfer Route</Label>
                <Input
                  id="transferRoute"
                  value={formData.transferRoute || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, transferRoute: e.target.value })
                  }
                  placeholder="e.g., Airport, City Transfer, Hourly"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickupLocation">Pickup Location</Label>
                <Input
                  id="pickupLocation"
                  value={formData.pickupLocation || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, pickupLocation: e.target.value })
                  }
                  placeholder="Enter pickup location or 'ALL'"
                />
              </div>

              <div>
                <Label htmlFor="dropLocation">Drop Location</Label>
                <Input
                  id="dropLocation"
                  value={formData.dropLocation || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dropLocation: e.target.value })
                  }
                  placeholder="Enter drop location or 'ALL'"
                />
              </div>
            </div>
          </div>
        )}

        {/* Package-specific fields */}
        {(formData.category === "packages" || formData.category === "all") && (
          <div className="space-y-4 border-l-4 border-emerald-500 pl-4">
            <h4 className="font-medium text-emerald-700">Package Details</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="packageCategory">Package Category</Label>
                <Select
                  value={formData.packageCategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, packageCategory: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="packageDuration">Package Duration</Label>
                <Input
                  id="packageDuration"
                  value={formData.packageDuration || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packageDuration: e.target.value,
                    })
                  }
                  placeholder="e.g., 5 Days 4 Nights"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="packageRegion">Package Region</Label>
              <Input
                id="packageRegion"
                value={formData.packageRegion || ""}
                onChange={(e) =>
                  setFormData({ ...formData, packageRegion: e.target.value })
                }
                placeholder="e.g., Southeast Asia, Europe, Middle East"
              />
            </div>
          </div>
        )}

        {/* Discount Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium">Discount Configuration</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountType">Discount Type*</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    discountType: value as PromoCode["discountType"],
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
              <Label htmlFor="discountMinValue">
                Discount Min Value*{" "}
                {formData.discountType === "percentage" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="discountMinValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountMinValue || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountMinValue: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder={
                  formData.discountType === "percentage" ? "5.00" : "100"
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountMaxValue">
                Discount Max Value*{" "}
                {formData.discountType === "percentage" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="discountMaxValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountMaxValue || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountMaxValue: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder={
                  formData.discountType === "percentage" ? "25.00" : "2000"
                }
              />
            </div>

            <div>
              <Label htmlFor="minimumFareAmount">Minimum Fare Amount*</Label>
              <Input
                id="minimumFareAmount"
                type="number"
                value={formData.minimumFareAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumFareAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Enter minimum fare amount"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="marketingBudget">Marketing Budget*</Label>
            <Input
              id="marketingBudget"
              type="number"
              value={formData.marketingBudget || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  marketingBudget: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Enter marketing budget"
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">Expiry Date*</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="promoCodeImage">PromoCode Image</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <span className="text-sm text-gray-500">No file chosen</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayOnHomePage">Display on Home Page*</Label>
              <Select
                value={formData.displayOnHomePage}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    displayOnHomePage: value as "yes" | "no",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status*</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as PromoCode["status"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Promo Code List
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Manage Promo Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Promo Code List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Promo Code List
                </div>
                <Button
                  onClick={handleCreatePromoCode}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add/Update Promo Code
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Panel */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium mb-4">Search Panel</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Promo Code</Label>
                    <Input
                      placeholder="Enter promo code"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Module</Label>
                    <Select
                      value={selectedModule}
                      onValueChange={setSelectedModule}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Please select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        <SelectItem value="flight">Flight</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="sightseeing">Sightseeing</SelectItem>
                        <SelectItem value="transfers">Transfers</SelectItem>
                        <SelectItem value="packages">Packages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button className="flex-1">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline">Clear Filter</Button>
                  </div>
                </div>
              </div>

              {/* Promo Codes Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Promo Code</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Min Discount</TableHead>
                      <TableHead>Max Discount</TableHead>
                      <TableHead>Valid Upto</TableHead>
                      <TableHead>Minimum fare amount</TableHead>
                      <TableHead>Marketing Budget</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created On</TableHead>
                      <TableHead>Updated On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPromoCodes.map((promo, index) => (
                      <TableRow key={promo.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {promo.code}
                        </TableCell>
                        <TableCell>
                          {promo.image ? (
                            <img
                              src={promo.image}
                              alt={promo.code}
                              className="w-12 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {promo.discountType === "percentage"
                            ? `${promo.discountMinValue}%`
                            : `₹${promo.discountMinValue}`}
                        </TableCell>
                        <TableCell>
                          ₹{promo.discountMaxValue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(promo.expiryDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          ₹{promo.minimumFareAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ₹{promo.marketingBudget.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {promo.module}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={promo.status} />
                        </TableCell>
                        <TableCell>{promo.createdOn}</TableCell>
                        <TableCell>{promo.updatedOn}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditPromoCode(promo)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Promo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => togglePromoCodeStatus(promo.id)}
                              >
                                {promo.status === "active" ? (
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
                                View Usage
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeletePromoCode(promo.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Promo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
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
                Add/Update Promo Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PromoCodeForm />
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setFormData({})}>
                  Reset
                </Button>
                <Button onClick={handleSavePromoCode}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Promo Code Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Promo Code</DialogTitle>
            <DialogDescription>
              Create a new promo code with discounts and conditions.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <PromoCodeForm isEdit={false} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setError(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePromoCode}
              disabled={saving || !formData.code || !formData.description}
            >
              {saving ? "Creating..." : "Create Promo Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Promo Code Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
            <DialogDescription>
              Update promo code configuration and settings.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <PromoCodeForm isEdit={true} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setError(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePromoCode}
              disabled={saving || !formData.code || !formData.description}
            >
              {saving ? "Updating..." : "Update Promo Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
