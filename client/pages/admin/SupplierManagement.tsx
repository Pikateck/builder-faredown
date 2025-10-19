import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Activity,
  Settings,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  DollarSign,
} from "lucide-react";

interface Supplier {
  id: number;
  code: string;
  name: string;
  product_type: string;
  is_enabled: boolean;
  environment: string;
  weight?: number;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_msg: string | null;
  total_bookings: number;
  bookings_24h: number;
  success_calls_24h: number;
  error_calls_24h: number;
}

interface SupplierMarkup {
  id: number;
  supplier_code: string;
  product_type: string;
  market: string;
  currency: string;
  hotel_id: string;
  destination: string;
  channel: string;
  value_type: string;
  value: number;
  priority: number;
  is_active: boolean;
  valid_from: string | null;
  valid_to: string | null;
}

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [markups, setMarkups] = useState<SupplierMarkup[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<any>(null);
  const [weightEdits, setWeightEdits] = useState<Record<string, number>>({});

  // Filters state for list view
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");

  const { toast } = useToast();

  // New markup form state
  const [newMarkup, setNewMarkup] = useState({
    product_type: "hotels",
    market: "ALL",
    currency: "ALL",
    hotel_id: "ALL",
    destination: "ALL",
    channel: "ALL",
    value_type: "PERCENT",
    value: 20,
    priority: 100,
  });

  // Preview state
  const [previewPrice, setPreviewPrice] = useState({
    basePrice: 10000,
    result: null as any,
  });

  useEffect(() => {
    loadSuppliers();
    loadHealth();
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      loadMarkups(selectedSupplier.code);
    }
  }, [selectedSupplier]);

  const loadSuppliers = async () => {
    try {
      const response = await apiClient.get<any>("/api/admin/suppliers");
      if (response.success) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      const response = await apiClient.get<any>("/api/admin/suppliers/health");
      if (response.success) {
        setHealthData(response.data);
      }
    } catch (error) {
      console.error("Error loading health:", error);
    }
  };

  const loadMarkups = async (supplierCode: string) => {
    try {
      const response = await apiClient.get<any>(
        `/api/admin/suppliers/${supplierCode}/markups`,
      );
      if (response.success) {
        setMarkups(response.data);
      }
    } catch (error) {
      console.error("Error loading markups:", error);
    }
  };

  const toggleSupplier = async (supplier: Supplier) => {
    try {
      const response = await apiClient.put<any>(
        `/api/admin/suppliers/${supplier.code}`,
        { is_enabled: !supplier.is_enabled },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `${supplier.name} ${response.data.is_enabled ? "enabled" : "disabled"}`,
        });
        loadSuppliers();
      }
    } catch (error) {
      console.error("Error toggling supplier:", error);
      toast({
        title: "Error",
        description: "Failed to update supplier",
        variant: "destructive",
      });
    }
  };

  const createMarkup = async () => {
    if (!selectedSupplier) return;

    try {
      const response = await apiClient.post<any>(
        `/api/admin/suppliers/${selectedSupplier.code}/markups`,
        newMarkup,
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Markup created successfully",
        });
        loadMarkups(selectedSupplier.code);
        setNewMarkup({
          product_type: "hotels",
          market: "ALL",
          currency: "ALL",
          hotel_id: "ALL",
          destination: "ALL",
          channel: "ALL",
          value_type: "PERCENT",
          value: 20,
          priority: 100,
        });
      }
    } catch (error) {
      console.error("Error creating markup:", error);
      toast({
        title: "Error",
        description: "Failed to create markup",
        variant: "destructive",
      });
    }
  };

  const deleteMarkup = async (markupId: number) => {
    if (!selectedSupplier) return;

    try {
      const response = await apiClient.delete<any>(
        `/api/admin/suppliers/${selectedSupplier.code}/markups/${markupId}`,
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Markup deleted successfully",
        });
        loadMarkups(selectedSupplier.code);
      }
    } catch (error) {
      console.error("Error deleting markup:", error);
      toast({
        title: "Error",
        description: "Failed to delete markup",
        variant: "destructive",
      });
    }
  };

  const previewMarkup = async () => {
    if (!selectedSupplier) return;

    try {
      const response = await apiClient.post<any>(
        `/api/admin/suppliers/${selectedSupplier.code}/markups/preview`,
        {
          ...newMarkup,
          base_price: previewPrice.basePrice,
        },
      );

      if (response.success) {
        setPreviewPrice({ ...previewPrice, result: response.data });
      }
    } catch (error) {
      console.error("Error previewing markup:", error);
    }
  };

  const updateSupplierWeight = async (supplier: Supplier, newWeight: number) => {
    try {
      const response = await apiClient.put<any>(
        `/api/admin/suppliers/${supplier.code}`,
        { weight: newWeight },
      );
      if (response.success) {
        toast({ title: "Updated", description: `Weight set to ${newWeight}` });
        setWeightEdits((prev) => ({ ...prev, [supplier.code]: newWeight }));
        await loadSuppliers();
      }
    } catch (error) {
      console.error("Error updating weight:", error);
      toast({ title: "Error", description: "Failed to update weight", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Compute filtered list
  const normalized = (v: string | null | undefined) => (v || "").toLowerCase();
  const filteredSuppliers = suppliers
    .filter((s) => {
      if (search.trim().length > 0) {
        const q = normalized(search);
        const hit =
          normalized(s.name).includes(q) ||
          normalized(s.code).includes(q) ||
          normalized(s.product_type).includes(q);
        if (!hit) return false;
      }
      if (moduleFilter !== "all") {
        const pt = normalized(s.product_type);
        if (pt !== normalized(moduleFilter)) return false;
      }
      if (statusFilter !== "all") {
        const enabled = s.is_enabled ? "enabled" : "disabled";
        if (enabled !== statusFilter) return false;
      }
      if (envFilter !== "all") {
        if (normalized(s.environment) !== normalized(envFilter)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600 mt-2">Manage hotel and flight suppliers, markups, and integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setLoading(true); Promise.all([loadSuppliers(), loadHealth()]).finally(() => setLoading(false)); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Search</Label>
            <Input placeholder="Search suppliers or codes" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Module</Label>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="flights">Flights</SelectItem>
                <SelectItem value="hotels">Hotels</SelectItem>
                <SelectItem value="transfers">Transfers</SelectItem>
                <SelectItem value="packages">Packages</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Environment</Label>
            <Select value={envFilter} onValueChange={setEnvFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Suppliers List Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%]">Supplier</TableHead>
              <TableHead className="w-[10%]">Code</TableHead>
              <TableHead className="w-[12%]">Module</TableHead>
              <TableHead className="w-[12%]">Environment</TableHead>
              <TableHead className="w-[10%]">Enabled</TableHead>
              <TableHead className="w-[16%]">Weight</TableHead>
              <TableHead className="w-[12%]">Health</TableHead>
              <TableHead className="w-[12%]">Calls 24h</TableHead>
              <TableHead className="w-[12%]">Bookings 24h</TableHead>
              <TableHead className="w-[14%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier) => {
              const health = supplier.last_success_at
                ? { label: "Healthy", color: "text-green-600", Icon: CheckCircle }
                : supplier.last_error_at
                  ? { label: "Error", color: "text-red-600", Icon: XCircle }
                  : { label: "Unknown", color: "text-gray-400", Icon: Activity };
              return (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="uppercase text-gray-600">{supplier.code}</TableCell>
                  <TableCell className="capitalize">{supplier.product_type}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.environment === "production" ? "default" : "secondary"}>{supplier.environment}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={supplier.is_enabled} onCheckedChange={() => toggleSupplier(supplier)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24 h-8"
                        value={
                          weightEdits[supplier.code] !== undefined
                            ? weightEdits[supplier.code]
                            : (typeof supplier.weight === "number" ? supplier.weight : 100)
                        }
                        onChange={(e) =>
                          setWeightEdits((prev) => ({
                            ...prev,
                            [supplier.code]: parseInt(e.target.value || "0"),
                          }))
                        }
                      />
                      <Button size="sm" variant="outline" onClick={() => updateSupplierWeight(supplier, weightEdits[supplier.code] ?? (supplier.weight || 100))}>Save</Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${health.color}`}>
                      <health.Icon className="h-4 w-4" />
                      <span>{health.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>{supplier.success_calls_24h || 0} / {supplier.total_bookings || 0}</TableCell>
                  <TableCell>{supplier.bookings_24h || 0}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setSelectedSupplier(supplier)}>
                      <Settings className="h-4 w-4 mr-2" /> Manage Markups
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-500 py-8">No suppliers match your filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Markup Management Dialog */}
      {selectedSupplier && (
        <Dialog
          open={!!selectedSupplier}
          onOpenChange={() => setSelectedSupplier(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedSupplier.name} - Markup Management
              </DialogTitle>
              <DialogDescription>
                Configure supplier-specific markups with market, currency, and
                priority rules
              </DialogDescription>
            </DialogHeader>

            {/* Create New Markup */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Markup
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Market</Label>
                  <Select
                    value={newMarkup.market}
                    onValueChange={(value) =>
                      setNewMarkup({ ...newMarkup, market: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Markets</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Currency</Label>
                  <Select
                    value={newMarkup.currency}
                    onValueChange={(value) =>
                      setNewMarkup({ ...newMarkup, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Currencies</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Type</Label>
                  <Select
                    value={newMarkup.value_type}
                    onValueChange={(value) =>
                      setNewMarkup({ ...newMarkup, value_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">Percentage</SelectItem>
                      <SelectItem value="FLAT">Flat Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={newMarkup.value}
                    onChange={(e) =>
                      setNewMarkup({
                        ...newMarkup,
                        value: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Priority (lower = higher priority)</Label>
                  <Input
                    type="number"
                    value={newMarkup.priority}
                    onChange={(e) =>
                      setNewMarkup({
                        ...newMarkup,
                        priority: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Channel</Label>
                  <Select
                    value={newMarkup.channel}
                    onValueChange={(value) =>
                      setNewMarkup({ ...newMarkup, channel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Channels</SelectItem>
                      <SelectItem value="web">Web</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createMarkup}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Markup
                </Button>
                <Button variant="outline" onClick={previewMarkup}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>

              {previewPrice.result && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm font-semibold mb-1">Price Preview:</p>
                  <p className="text-sm">
                    Base: ₹{previewPrice.result.basePrice} → Final: ₹
                    {previewPrice.result.finalPrice.toFixed(2)} (+
                    {previewPrice.result.increasePercent.toFixed(1)}%)
                  </p>
                </div>
              )}
            </div>

            {/* Existing Markups */}
            <div>
              <h3 className="font-semibold mb-4">Existing Markups</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {markups.map((markup) => (
                    <TableRow key={markup.id}>
                      <TableCell>{markup.market}</TableCell>
                      <TableCell>{markup.currency}</TableCell>
                      <TableCell>{markup.value_type}</TableCell>
                      <TableCell>
                        {markup.value}
                        {markup.value_type === "PERCENT" ? "%" : ""}
                      </TableCell>
                      <TableCell>{markup.priority}</TableCell>
                      <TableCell>
                        <Badge
                          variant={markup.is_active ? "default" : "secondary"}
                        >
                          {markup.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMarkup(markup.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
