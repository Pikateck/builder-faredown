import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  markupService,
  type AirMarkup,
  type CreateAirMarkupRequest,
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
import { AirportSelect } from "@/components/ui/airport-select";
import { downloadTextFile } from "@/lib/downloadUtils";
import {
  CABIN_CLASS_FILTER_OPTIONS,
  CABIN_CLASS_OPTIONS,
  getCabinClassLabel,
  normalizeCabinClass,
} from "@/lib/cabinClasses";
import {
  convertToInputDate,
  formatDateToDDMMMYYYY,
  formatDateToDisplayString,
  getCurrentDateFormatted,
} from "@/lib/dateUtils";
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
  RefreshCw,
} from "lucide-react";

const displayDate = (value?: string | null): string => {
  const formatted = formatDateToDisplayString(value ?? "");
  return formatted || "-";
};

const normalizeDisplayDate = (value: string): string => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    const isoCandidate = `${year}-${month}-${day}`;
    const formatted = formatDateToDDMMMYYYY(isoCandidate);
    if (formatted) {
      return formatted;
    }
  }

  const formatted = formatDateToDDMMMYYYY(trimmed);
  if (formatted) {
    return formatted;
  }

  return trimmed;
};

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

export default function MarkupManagementAir() {
  const [markups, setMarkups] = useState<AirMarkup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAirline, setSelectedAirline] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMarkup, setSelectedMarkup] = useState<AirMarkup | null>(null);
  const [formData, setFormData] = useState<Partial<AirMarkup>>({});
  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [searchParams, setSearchParams] = useSearchParams();

  // Load markups on component mount and when filters change
  useEffect(() => {
    loadMarkups();
  }, [
    searchTerm,
    selectedAirline,
    selectedClass,
    selectedStatus,
    pagination.page,
  ]);

  const loadMarkups = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await markupService.getAirMarkups({
        search: searchTerm || undefined,
        airline: selectedAirline,
        class: selectedClass,
        status: selectedStatus,
        page: pagination.page,
        limit: 10,
      });

      setMarkups(result.markups);
      setPagination({
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load air markups",
      );
      console.error("Error loading air markups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      const csvContent = await markupService.exportAirMarkups({
        search: searchTerm,
        airline: selectedAirline,
        class: selectedClass,
        status: selectedStatus,
      });

      const timestamp = new Date().toISOString().split("T")[0];
      downloadTextFile(csvContent, `air-markups-${timestamp}.csv`, "text/csv");
    } catch (err) {
      console.error("Failed to export air markups:", err);
      setError(
        err instanceof Error ? err.message : "Failed to export air markups",
      );
    } finally {
      setExporting(false);
    }
  };

  // Use server-filtered markups directly
  const filteredMarkups = markups;

  const handleCreateMarkup = useCallback(
    (overrides: Partial<AirMarkup> = {}) => {
      const normalizeIata = (code: string | null | undefined) => {
        if (!code) {
          return null;
        }

        const trimmed = code.trim();
        if (!trimmed) {
          return null;
        }

        return trimmed.slice(0, 3).toUpperCase();
      };

      const originCode = normalizeIata(
        overrides.origin_iata ?? overrides.route?.from ?? null,
      );
      const destinationCode = normalizeIata(
        overrides.dest_iata ?? overrides.route?.to ?? null,
      );

      const normalizedValidFrom = overrides.validFrom
        ? normalizeDisplayDate(overrides.validFrom)
        : getCurrentDateFormatted();
      const normalizedValidTo = overrides.validTo
        ? normalizeDisplayDate(overrides.validTo)
        : "";

      const baseData: Partial<AirMarkup> = {
        name: "",
        description: "",
        airline: "",
        route: { from: originCode, to: destinationCode },
        origin_iata: originCode,
        dest_iata: destinationCode,
        class: "economy",
        markupType: "percentage",
        markupValue: 5.0, // Default with decimal precision
        minAmount: 100,
        maxAmount: 5000,
        // Current Fare Range defaults
        currentFareMin: 10.0, // 10% minimum markup for user-visible fare
        currentFareMax: 15.0, // 15% maximum markup for user-visible fare
        // Bargain Fare Range defaults
        bargainFareMin: 5.0, // 5% minimum acceptable bargain
        bargainFareMax: 15.0, // 15% maximum acceptable bargain
        validFrom: normalizedValidFrom,
        validTo: normalizedValidTo,
        status: "active",
        priority: 1,
        userType: "all",
        specialConditions: "",
      };

      const mergedData: Partial<AirMarkup> = {
        ...baseData,
        ...overrides,
        validFrom: normalizeDisplayDate(
          overrides.validFrom ?? baseData.validFrom ?? "",
        ),
        validTo: normalizeDisplayDate(
          overrides.validTo ?? baseData.validTo ?? "",
        ),
        origin_iata: originCode,
        dest_iata: destinationCode,
        route: {
          from: originCode,
          to: destinationCode,
        },
      };

      setSelectedMarkup(null);
      setFormData(mergedData);
      setIsCreateDialogOpen(true);
    },
    [setFormData, setIsCreateDialogOpen, setSelectedMarkup],
  );

  useEffect(() => {
    const action = searchParams.get("action");
    if (action !== "create" || isCreateDialogOpen) {
      return;
    }

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    handleCreateMarkup({
      origin_iata: fromParam ?? undefined,
      dest_iata: toParam ?? undefined,
    });

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("action");
    if (fromParam) {
      nextParams.delete("from");
    }
    if (toParam) {
      nextParams.delete("to");
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, handleCreateMarkup, isCreateDialogOpen, setSearchParams]);

  const handleEditMarkup = (markup: AirMarkup) => {
    setSelectedMarkup(markup);
    setFormData({
      ...markup,
      class: normalizeCabinClass(markup.class) || markup.class,
      validFrom: normalizeDisplayDate(markup.validFrom || ""),
      validTo: normalizeDisplayDate(markup.validTo || ""),
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveMarkup = async () => {
    try {
      setSaving(true);
      setError(null);

      if (selectedMarkup) {
        // Update existing markup
        await markupService.updateAirMarkup(
          selectedMarkup.id,
          formData as Partial<CreateAirMarkupRequest>,
        );
        setIsEditDialogOpen(false);
      } else {
        // Create new markup
        if (!formData.name || !formData.airline) {
          setError("Name and airline are required");
          return;
        }

        await markupService.createAirMarkup(formData as CreateAirMarkupRequest);
        setIsCreateDialogOpen(false);
        // Switch back to list tab after successful creation
        setActiveTab("list");
      }

      // Reload markups to reflect changes
      await loadMarkups();
      setFormData({});
      setSelectedMarkup(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save air markup",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMarkup = async (markupId: string) => {
    if (confirm("Are you sure you want to delete this markup rule?")) {
      try {
        setError(null);
        await markupService.deleteAirMarkup(markupId);
        await loadMarkups(); // Reload list
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete air markup",
        );
      }
    }
  };

  const toggleMarkupStatus = async (markupId: string) => {
    try {
      setError(null);
      await markupService.toggleAirMarkupStatus(markupId);
      await loadMarkups(); // Reload list to reflect changes
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update air markup status",
      );
    }
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
              value={normalizeCabinClass(formData.class) || "economy"}
              onValueChange={(value) =>
                setFormData({ ...formData, class: value as AirMarkup["class"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CABIN_CLASS_OPTIONS.map((option) => (
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
            <AirportSelect
              value={formData.origin_iata || "ALL"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  origin_iata: value === "ALL" ? null : value,
                  route: {
                    ...formData.route,
                    from: value === "ALL" ? null : value,
                  },
                })
              }
              placeholder="Select origin airport"
              includeAll={true}
              allLabel="All Origins"
            />
          </div>

          <div>
            <Label htmlFor="to">To (Destination)</Label>
            <AirportSelect
              value={formData.dest_iata || "ALL"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  dest_iata: value === "ALL" ? null : value,
                  route: {
                    ...formData.route,
                    to: value === "ALL" ? null : value,
                  },
                })
              }
              placeholder="Select destination airport"
              includeAll={true}
              allLabel="All Destinations"
            />
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
              {formData.markupType === "percentage" ? "(%)" : "(��)"}
            </Label>
            <Input
              id="markupValue"
              type="number"
              step="0.01"
              min="0"
              value={formData.markupValue || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  markupValue: parseFloat(e.target.value) || 0,
                })
              }
              placeholder={
                formData.markupType === "percentage"
                  ? "5.00, 5.15, 5.25, etc."
                  : "1500"
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
            <Label htmlFor="maxAmount">Maximum Markup Amount (��)</Label>
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

        {/* Current Fare Range (Min/Max) */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-blue-800 mb-3">
            Current Fare Range (User-Visible Pricing)
          </h4>
          <p className="text-sm text-blue-700 mb-4">
            The markup percentage range applied on top of net fare. User-visible
            fare will randomly fluctuate within this range.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentFareMin">Current Fare Min (%)</Label>
              <Input
                id="currentFareMin"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.currentFareMin || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentFareMin: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="e.g., 10.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum markup percentage for user-visible fare
              </p>
            </div>

            <div>
              <Label htmlFor="currentFareMax">Current Fare Max (%)</Label>
              <Input
                id="currentFareMax"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.currentFareMax || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentFareMax: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="e.g., 15.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum markup percentage for user-visible fare
              </p>
            </div>
          </div>
        </div>

        {/* Bargain Fare Range (Min/Max) */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-green-800 mb-3">
            Bargain Fare Range (Acceptable Bargain Pricing)
          </h4>
          <p className="text-sm text-green-700 mb-4">
            When users enter a desired price, if it falls within this range,
            show "Your price is matched!". Otherwise, provide counter-offers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bargainFareMin">Bargain Fare Min (%)</Label>
              <Input
                id="bargainFareMin"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.bargainFareMin || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bargainFareMin: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="e.g., 5.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum acceptable bargain percentage
              </p>
            </div>

            <div>
              <Label htmlFor="bargainFareMax">Bargain Fare Max (%)</Label>
              <Input
                id="bargainFareMax"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.bargainFareMax || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bargainFareMax: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="e.g., 15.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum acceptable bargain percentage
              </p>
            </div>
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
                    <SelectValue placeholder="All Cabin Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    {CABIN_CLASS_FILTER_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value ?? "all"}
                        value={option.value ?? "all"}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
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

                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center"
                >
                  {exporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
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
                                {markup.route.from || "All"} →{" "}
                                {markup.route.to || "All"}
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
                            <Badge variant="outline">
                              {getCabinClassLabel(markup.class)}
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

      {/* Create Markup Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Air Markup Rule</DialogTitle>
            <DialogDescription>
              Create a new markup rule for flight bookings with decimal
              precision.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <MarkupForm isEdit={false} />
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
              onClick={handleSaveMarkup}
              disabled={saving || !formData.name || !formData.airline}
            >
              {saving ? "Creating..." : "Create Markup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Markup Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Air Markup Rule</DialogTitle>
            <DialogDescription>
              Update markup configuration for flight bookings.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <MarkupForm isEdit={true} />
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
              onClick={handleSaveMarkup}
              disabled={saving || !formData.name || !formData.airline}
            >
              {saving ? "Updating..." : "Update Markup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
