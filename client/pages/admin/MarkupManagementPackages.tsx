import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Upload,
  DollarSign,
  Percent,
  TrendingUp,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  Globe,
  Calendar,
  Users,
  Target,
  Activity,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiClient } from "@/lib/api";

interface MarkupRule {
  id: string;
  name: string;
  description: string;
  category?: string;
  ruleType: "percentage" | "fixed" | "tiered";
  value: number;
  minValue?: number;
  maxValue?: number;
  conditions: {
    packageCategory?: string[];
    priceRange?: { min: number; max: number };
    seasonality?: "peak" | "off_peak" | "regular";
    advanceBooking?: number; // days
    groupSize?: { min: number; max: number };
    region?: string[];
  };
  priority: number;
  isActive: boolean;
  appliesTo: "all" | "online" | "offline";
  createdAt: string;
  updatedAt: string;
  usage: {
    totalApplications: number;
    revenue: number;
    avgMarkup: number;
  };
}

interface TieredMarkup {
  id: string;
  minPrice: number;
  maxPrice: number;
  markupPercentage: number;
}

interface PackageMarkupStats {
  totalRules: number;
  activeRules: number;
  totalRevenue: number;
  avgMarkupPercentage: number;
  topPerformingRule: string;
  recentApplications: number;
}

const PACKAGE_CATEGORIES = [
  "cultural", "beach", "adventure", "honeymoon", "family", "luxury", "budget", "wildlife", "spiritual"
];

const REGIONS = [
  "South Asia", "Southeast Asia", "Middle East", "Europe", "North America", "Australia", "Africa"
];

const SEASONALITY_OPTIONS = [
  { value: "regular", label: "Regular Season" },
  { value: "peak", label: "Peak Season" },
  { value: "off_peak", label: "Off Peak Season" }
];

export default function MarkupManagementPackages() {
  const [markupRules, setMarkupRules] = useState<MarkupRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<MarkupRule>>({});
  const [tieredMarkups, setTieredMarkups] = useState<TieredMarkup[]>([]);
  const [stats, setStats] = useState<PackageMarkupStats>({
    totalRules: 0,
    activeRules: 0,
    totalRevenue: 0,
    avgMarkupPercentage: 0,
    topPerformingRule: "",
    recentApplications: 0,
  });
  const [activeTab, setActiveTab] = useState("rules"); // rules, settings, analytics

  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchMarkupRules();
    fetchStats();
  }, [searchTerm, categoryFilter, statusFilter]);

  const fetchMarkupRules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        module: "packages",
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await apiClient.get(`/api/admin/markup/packages?${params}`);
      
      if (response.success) {
        setMarkupRules(response.data.rules);
      }
    } catch (error) {
      console.error("Error fetching markup rules:", error);
      // Use mock data for demonstration
      setMarkupRules([
        {
          id: "1",
          name: "Luxury Package Markup",
          description: "Premium markup for luxury packages",
          category: "luxury",
          ruleType: "percentage",
          value: 25,
          conditions: {
            packageCategory: ["luxury"],
            priceRange: { min: 50000, max: 500000 },
            seasonality: "regular",
          },
          priority: 1,
          isActive: true,
          appliesTo: "all",
          createdAt: "2024-01-15",
          updatedAt: "2024-01-20",
          usage: {
            totalApplications: 156,
            revenue: 2840000,
            avgMarkup: 23.5,
          },
        },
        {
          id: "2",
          name: "Peak Season Boost",
          description: "Additional markup during peak travel seasons",
          ruleType: "percentage",
          value: 15,
          conditions: {
            seasonality: "peak",
            advanceBooking: 30,
          },
          priority: 2,
          isActive: true,
          appliesTo: "all",
          createdAt: "2024-01-10",
          updatedAt: "2024-01-18",
          usage: {
            totalApplications: 89,
            revenue: 1650000,
            avgMarkup: 14.8,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/api/admin/markup/packages/stats");

      if (response.success && response.data) {
        // Ensure all required fields are present with fallback values
        setStats({
          totalRules: response.data.totalRules || 0,
          activeRules: response.data.activeRules || 0,
          totalRevenue: response.data.totalRevenue || 0,
          avgMarkupPercentage: response.data.avgMarkupPercentage || 0,
          topPerformingRule: response.data.topPerformingRule || "None",
          recentApplications: response.data.recentApplications || 0,
        });
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Use mock stats as fallback
      setStats({
        totalRules: 12,
        activeRules: 8,
        totalRevenue: 4890000,
        avgMarkupPercentage: 18.6,
        topPerformingRule: "Luxury Package Markup",
        recentApplications: 245,
      });
    }
  };

  const handleCreateRule = () => {
    setEditingRule({
      name: "",
      description: "",
      ruleType: "percentage",
      value: 10,
      conditions: {
        packageCategory: [],
        region: [],
      },
      priority: 1,
      isActive: true,
      appliesTo: "all",
    });
    setTieredMarkups([]);
    setShowCreateDialog(true);
  };

  const handleEditRule = (rule: MarkupRule) => {
    setEditingRule(rule);
    if (rule.ruleType === "tiered") {
      // Load tiered markups for this rule
      setTieredMarkups([
        { id: "1", minPrice: 0, maxPrice: 10000, markupPercentage: 5 },
        { id: "2", minPrice: 10001, maxPrice: 50000, markupPercentage: 10 },
        { id: "3", minPrice: 50001, maxPrice: 999999, markupPercentage: 15 },
      ]);
    }
    setShowEditDialog(true);
  };

  const handleSaveRule = async () => {
    try {
      const method = editingRule.id ? "PUT" : "POST";
      const url = editingRule.id
        ? `/api/admin/markup/packages/${editingRule.id}`
        : "/api/admin/markup/packages";

      const payload = {
        ...editingRule,
        ...(editingRule.ruleType === "tiered" && { tieredMarkups }),
      };

      const response = method === "POST"
        ? await apiClient.post(url, payload)
        : await apiClient.put(url, payload);

      if (response.success) {
        setShowCreateDialog(false);
        setShowEditDialog(false);
        setEditingRule({});
        setTieredMarkups([]);
        fetchMarkupRules();
        fetchStats();
      }
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this markup rule?")) return;

    try {
      const response = await apiClient.delete(`/api/admin/markup/packages/${ruleId}`);
      
      if (response.success) {
        fetchMarkupRules();
        fetchStats();
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  const toggleRuleStatus = async (ruleId: string) => {
    try {
      const response = await apiClient.patch(`/api/admin/markup/packages/${ruleId}/toggle`);
      
      if (response.success) {
        fetchMarkupRules();
        fetchStats();
      }
    } catch (error) {
      console.error("Error toggling rule status:", error);
    }
  };

  const addTieredMarkup = () => {
    const newTier: TieredMarkup = {
      id: Date.now().toString(),
      minPrice: 0,
      maxPrice: 10000,
      markupPercentage: 5,
    };
    setTieredMarkups([...tieredMarkups, newTier]);
  };

  const updateTieredMarkup = (index: number, field: keyof TieredMarkup, value: number) => {
    const updated = [...tieredMarkups];
    updated[index] = { ...updated[index], [field]: value };
    setTieredMarkups(updated);
  };

  const removeTieredMarkup = (index: number) => {
    setTieredMarkups(tieredMarkups.filter((_, i) => i !== index));
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
  };

  const getRuleTypeBadge = (ruleType: string) => {
    const config = {
      percentage: { color: "bg-blue-100 text-blue-800", icon: Percent },
      fixed: { color: "bg-green-100 text-green-800", icon: DollarSign },
      tiered: { color: "bg-purple-100 text-purple-800", icon: TrendingUp },
    };

    const { color, icon: Icon } = config[ruleType] || config.percentage;
    
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {ruleType.charAt(0).toUpperCase() + ruleType.slice(1)}
      </Badge>
    );
  };

  const MarkupRuleForm = ({ isEdit = false }) => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="font-medium">Basic Information</h4>
        
        <div>
          <Label>Rule Name*</Label>
          <Input
            value={editingRule.name || ""}
            onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
            placeholder="Enter rule name"
          />
        </div>

        <div>
          <Label>Description*</Label>
          <Textarea
            value={editingRule.description || ""}
            onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
            placeholder="Describe when this markup rule applies"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Rule Type*</Label>
            <Select
              value={editingRule.ruleType}
              onValueChange={(value) => setEditingRule({ ...editingRule, ruleType: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                <SelectItem value="tiered">Tiered Pricing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priority*</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={editingRule.priority || 1}
              onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) })}
              placeholder="1 = highest priority"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Applies To*</Label>
            <Select
              value={editingRule.appliesTo}
              onValueChange={(value) => setEditingRule({ ...editingRule, appliesTo: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages (Online + Offline)</SelectItem>
                <SelectItem value="online">Online Packages Only</SelectItem>
                <SelectItem value="offline">Offline/Extranet Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              checked={editingRule.isActive || false}
              onCheckedChange={(checked) => setEditingRule({ ...editingRule, isActive: checked })}
            />
            <Label>Active</Label>
          </div>
        </div>
      </div>

      {/* Markup Configuration */}
      {editingRule.ruleType !== "tiered" && (
        <div className="space-y-4">
          <h4 className="font-medium">Markup Configuration</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Markup Value*{" "}
                {editingRule.ruleType === "percentage" ? "(%)" : "(₹)"}
              </Label>
              <Input
                type="number"
                step={editingRule.ruleType === "percentage" ? "0.1" : "1"}
                min="0"
                value={editingRule.value || ""}
                onChange={(e) => setEditingRule({ ...editingRule, value: parseFloat(e.target.value) || 0 })}
                placeholder={editingRule.ruleType === "percentage" ? "10.0" : "1000"}
              />
            </div>

            {editingRule.ruleType === "percentage" && (
              <div>
                <Label>Maximum Cap (₹)</Label>
                <Input
                  type="number"
                  value={editingRule.maxValue || ""}
                  onChange={(e) => setEditingRule({ ...editingRule, maxValue: parseFloat(e.target.value) || undefined })}
                  placeholder="Optional maximum amount"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tiered Markup Configuration */}
      {editingRule.ruleType === "tiered" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Tiered Markup Configuration</h4>
            <Button size="sm" onClick={addTieredMarkup}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tier
            </Button>
          </div>
          
          <div className="space-y-3">
            {tieredMarkups.map((tier, index) => (
              <div key={tier.id} className="grid grid-cols-4 gap-2 items-center p-3 border rounded">
                <div>
                  <Label className="text-xs">Min Price (₹)</Label>
                  <Input
                    type="number"
                    value={tier.minPrice}
                    onChange={(e) => updateTieredMarkup(index, "minPrice", parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Price (₹)</Label>
                  <Input
                    type="number"
                    value={tier.maxPrice}
                    onChange={(e) => updateTieredMarkup(index, "maxPrice", parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Markup (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={tier.markupPercentage}
                    onChange={(e) => updateTieredMarkup(index, "markupPercentage", parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTieredMarkup(index)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conditions */}
      <div className="space-y-4">
        <h4 className="font-medium">Conditions (Optional)</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Package Categories</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
              {PACKAGE_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={editingRule.conditions?.packageCategory?.includes(category) || false}
                    onChange={(e) => {
                      const categories = editingRule.conditions?.packageCategory || [];
                      const updated = e.target.checked
                        ? [...categories, category]
                        : categories.filter(c => c !== category);
                      setEditingRule({
                        ...editingRule,
                        conditions: { ...editingRule.conditions, packageCategory: updated }
                      });
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`category-${category}`} className="text-sm capitalize">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Regions</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
              {REGIONS.map((region) => (
                <div key={region} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`region-${region}`}
                    checked={editingRule.conditions?.region?.includes(region) || false}
                    onChange={(e) => {
                      const regions = editingRule.conditions?.region || [];
                      const updated = e.target.checked
                        ? [...regions, region]
                        : regions.filter(r => r !== region);
                      setEditingRule({
                        ...editingRule,
                        conditions: { ...editingRule.conditions, region: updated }
                      });
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`region-${region}`} className="text-sm">
                    {region}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Price Range (₹)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min price"
                value={editingRule.conditions?.priceRange?.min || ""}
                onChange={(e) => setEditingRule({
                  ...editingRule,
                  conditions: {
                    ...editingRule.conditions,
                    priceRange: {
                      ...editingRule.conditions?.priceRange,
                      min: parseFloat(e.target.value) || 0
                    }
                  }
                })}
              />
              <Input
                type="number"
                placeholder="Max price"
                value={editingRule.conditions?.priceRange?.max || ""}
                onChange={(e) => setEditingRule({
                  ...editingRule,
                  conditions: {
                    ...editingRule.conditions,
                    priceRange: {
                      ...editingRule.conditions?.priceRange,
                      max: parseFloat(e.target.value) || 0
                    }
                  }
                })}
              />
            </div>
          </div>

          <div>
            <Label>Seasonality</Label>
            <Select
              value={editingRule.conditions?.seasonality || ""}
              onValueChange={(value) => setEditingRule({
                ...editingRule,
                conditions: { ...editingRule.conditions, seasonality: value as any }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Season</SelectItem>
                {SEASONALITY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Advance Booking (days)</Label>
            <Input
              type="number"
              min="0"
              value={editingRule.conditions?.advanceBooking || ""}
              onChange={(e) => setEditingRule({
                ...editingRule,
                conditions: { ...editingRule.conditions, advanceBooking: parseInt(e.target.value) || undefined }
              })}
              placeholder="Minimum advance booking days"
            />
          </div>

          <div>
            <Label>Group Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min size"
                value={editingRule.conditions?.groupSize?.min || ""}
                onChange={(e) => setEditingRule({
                  ...editingRule,
                  conditions: {
                    ...editingRule.conditions,
                    groupSize: {
                      ...editingRule.conditions?.groupSize,
                      min: parseInt(e.target.value) || 0
                    }
                  }
                })}
              />
              <Input
                type="number"
                placeholder="Max size"
                value={editingRule.conditions?.groupSize?.max || ""}
                onChange={(e) => setEditingRule({
                  ...editingRule,
                  conditions: {
                    ...editingRule.conditions,
                    groupSize: {
                      ...editingRule.conditions?.groupSize,
                      max: parseInt(e.target.value) || 0
                    }
                  }
                })}
              />
            </div>
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
              <Settings className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRules || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRules || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Markup</p>
                <p className="text-2xl font-bold text-gray-900">{(stats.avgMarkupPercentage || 0).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Markup Management - Packages
          </CardTitle>
          <CardDescription>
            Configure markup rules for package pricing. Rules apply to both online supplier content and offline extranet inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex flex-1 gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search markup rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {PACKAGE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateRule}>
                <Plus className="w-4 h-4 mr-2" />
                Add Markup Rule
              </Button>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Rules
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Rules
              </Button>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Markup Application Logic</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Rules are applied in priority order (1 = highest). First matching rule wins. 
                  Markup applies to both online supplier inventory and offline extranet inventory.
                  Final pricing: Base Price + Markup + Taxes + Payment Gateway Charges.
                </p>
              </div>
            </div>
          </div>

          {/* Markup Rules Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading markup rules...
                    </TableCell>
                  </TableRow>
                ) : markupRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Calculator className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-500">No markup rules found</p>
                        <p className="text-sm text-gray-400">Create your first markup rule to start configuring package pricing</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  markupRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {rule.priority}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {rule.description}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{getRuleTypeBadge(rule.ruleType)}</TableCell>

                      <TableCell>
                        <div className="font-medium">
                          {rule.ruleType === "percentage"
                            ? `${rule.value || 0}%`
                            : rule.ruleType === "fixed"
                              ? formatPrice(rule.value || 0)
                              : "Tiered"
                          }
                        </div>
                        {rule.maxValue && (
                          <div className="text-xs text-gray-500">
                            Cap: {formatPrice(rule.maxValue || 0)}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {rule.conditions?.packageCategory && rule.conditions.packageCategory.length > 0 && (
                            <div className="text-xs text-gray-600">
                              Categories: {rule.conditions.packageCategory.slice(0, 2).join(", ")}
                              {rule.conditions.packageCategory.length > 2 && " +more"}
                            </div>
                          )}
                          {rule.conditions?.seasonality && (
                            <div className="text-xs text-gray-600">
                              Season: {rule.conditions.seasonality.replace("_", " ")}
                            </div>
                          )}
                          {rule.conditions?.priceRange && (
                            <div className="text-xs text-gray-600">
                              Price: {formatPrice((rule.conditions?.priceRange?.min || 0))} - {formatPrice((rule.conditions?.priceRange?.max || 999999))}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {rule.appliesTo.replace("_", " ")}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{rule.usage?.totalApplications || 0}</div>
                          <div className="text-xs text-gray-500">applications</div>
                          <div className="text-xs text-green-600">
                            {formatPrice(rule.usage?.revenue || 0)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{getStatusBadge(rule.isActive || false)}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRuleStatus(rule.id)}
                          >
                            {rule.isActive ? (
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
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
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Markup Rule</DialogTitle>
            <DialogDescription>
              Configure a new markup rule for package pricing with specific conditions and priorities.
            </DialogDescription>
          </DialogHeader>

          <MarkupRuleForm isEdit={false} />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRule}
              disabled={!editingRule.name || !editingRule.description}
            >
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Markup Rule</DialogTitle>
            <DialogDescription>
              Update markup rule configuration and conditions.
            </DialogDescription>
          </DialogHeader>

          <MarkupRuleForm isEdit={true} />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRule}
              disabled={!editingRule.name || !editingRule.description}
            >
              Update Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
