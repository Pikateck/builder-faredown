import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import OnOffToggle from "@/components/ui/OnOffToggle";

import {
  Activity,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  DollarSign,
  History,
  MoreHorizontal,
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
  // Optional fields from unified suppliers_master
  base_currency?: string;
  base_markup?: number;
  hedge_buffer?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  last_updated_by?: string | null;
  modules?: string[];
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
  const [previewSupplier, setPreviewSupplier] = useState<Supplier | null>(null);
  const [auditSupplier, setAuditSupplier] = useState<Supplier | null>(null);

  // Filters state for list view
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 250);

  // Virtualization state
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(640);
  const ROW_HEIGHT = 60; // px target per spec

  const { toast } = useToast();

  // Inline components for Preview Price and Audit Log
  const PreviewPriceForm = ({
    supplierCode,
    baseCurrency,
  }: {
    supplierCode: string;
    baseCurrency: string;
  }) => {
    const [amount, setAmount] = useState<number>(100);
    const [displayCurrency, setDisplayCurrency] = useState<string>("INR");
    const [result, setResult] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const runPreview = async () => {
      try {
        setLoadingPreview(true);
        const r = await apiClient.post<any>("/api/pricing/preview", {
          supplier_code: supplierCode,
          net_amount: amount,
          supplier_currency: baseCurrency,
          display_currency: displayCurrency,
          module: "hotels",
        });
        setResult(r.breakdown || r.data || r);
      } catch (e) {
        toast({
          title: "Preview failed",
          description: String((e as any)?.message || e),
          variant: "destructive",
        });
      } finally {
        setLoadingPreview(false);
      }
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Net Amount ({baseCurrency})</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value || "0"))}
            />
          </div>
          <div>
            <Label>Display Currency</Label>
            <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="AED">AED</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={runPreview} disabled={loadingPreview}>
          {loadingPreview ? "Calculating..." : "Preview"}
        </Button>
        {result && (
          <div className="text-sm text-gray-700 space-y-1 border rounded p-3">
            <div>
              USD after supplier markup: {result.usd_after_supplier_markup}
            </div>
            <div>Module markup %: {result.module_markup_percent}</div>
            <div>
              Output: {result.output?.amount} {result.output?.currency}
            </div>
          </div>
        )}
      </div>
    );
  };

  const AuditLogList = ({ supplierCode }: { supplierCode: string }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
      const load = async () => {
        try {
          setLoadingLogs(true);
          const r = await apiClient.get<any>(
            `/api/admin/suppliers/${supplierCode}/audit`,
          );
          const items = r.data || [];
          setLogs(Array.isArray(items) ? items : []);
        } catch {
          setLogs([]);
        } finally {
          setLoadingLogs(false);
        }
      };
      load();
    }, [supplierCode]);

    if (loadingLogs) return <div className="text-sm">Loading...</div>;
    if (!logs.length)
      return <div className="text-sm text-gray-500">No audit entries.</div>;

    return (
      <div className="max-h-80 overflow-y-auto text-sm">
        {logs.map((l, i) => (
          <div key={i} className="border-b py-2">
            <div className="flex justify-between">
              <span>
                {new Date(
                  l.acted_at || l.updated_at || Date.now(),
                ).toLocaleString()}
              </span>
              <span>{l.acted_by || "-"}</span>
            </div>
            <div className="text-gray-600">{l.action || "update"}</div>
          </div>
        ))}
      </div>
    );
  };

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
        const newEnabled = (response as any).data?.is_enabled ?? (response as any).data?.enabled ?? !supplier.is_enabled;
        toast({
          title: "Success",
          description: `${supplier.name} ${newEnabled ? "enabled" : "disabled"}`,
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

  const updateSupplierWeight = async (
    supplier: Supplier,
    newWeight: number,
  ) => {
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
      toast({
        title: "Error",
        description: "Failed to update weight",
        variant: "destructive",
      });
    }
  };

  // Compute filtered list
  const normalized = (v: string | null | undefined) => (v || "").toLowerCase();
  const filteredSuppliers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const seen = new Set<string>();
    const allow: Record<string, string[]> = {
      flights: ["AMADEUS", "TBO"],
      hotels: ["TBO", "RATEHAWK", "HOTELBEDS"],
      transfers: ["HOTELBEDS"],
      sightseeing: ["HOTELBEDS"],
    };
    const list = suppliers
      .filter((s) => {
        if (q.length > 0) {
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
        const pt = (s.product_type || "").toLowerCase();
        const code = String(s.code || "").toUpperCase();
        if (allow[pt] && !allow[pt].includes(code)) return false;
        const key = `${pt}|${code}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [suppliers, debouncedSearch, moduleFilter, statusFilter, envFilter]);

  const useVirtualization = filteredSuppliers.length > 200;
  const totalHeight = filteredSuppliers.length * ROW_HEIGHT;
  const startIndex = useMemo(() => {
    return useVirtualization
      ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5)
      : 0;
  }, [scrollTop, useVirtualization]);
  const endIndex = useMemo(() => {
    if (!useVirtualization) return filteredSuppliers.length;
    const visible = Math.ceil(viewportH / ROW_HEIGHT) + 10;
    return Math.min(filteredSuppliers.length, startIndex + visible);
  }, [viewportH, startIndex, filteredSuppliers.length, useVirtualization]);
  const visibleRows = useMemo(
    () => filteredSuppliers.slice(startIndex, endIndex),
    [filteredSuppliers, startIndex, endIndex],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Supplier Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage hotel and flight suppliers, markups, and integrations
          </p>
        </div>
        <div className="ml-auto">
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              Promise.all([loadSuppliers(), loadHealth()]).finally(() =>
                setLoading(false),
              );
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Search</Label>
            <Input
              className="h-9 text-sm"
              placeholder="Search suppliers or codes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Module</Label>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="h-9 text-sm">
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
              <SelectTrigger className="h-9 text-sm">
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
              <SelectTrigger className="h-9 text-sm">
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

      {/* Table */}
      <Card className="overflow-hidden">
        <div
          ref={scrollRef}
          className="max-h-[70vh] overflow-y-auto"
          onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
          onMouseEnter={() => {
            if (scrollRef.current) setViewportH(scrollRef.current.clientHeight);
          }}
        >
          <Table className="text-sm">
            <TableHeader className="text-xs uppercase tracking-wide">
              <TableRow className="border-b border-slate-300">
                <TableHead className="px-3 py-2.5 w-[220px]">
                  Supplier
                </TableHead>
                <TableHead className="px-3 py-2.5 w-[120px]">Code</TableHead>
                <TableHead className="px-3 py-2.5 w-[140px]">Modules</TableHead>
                <TableHead className="px-3 py-2.5 w-[80px]">Currency</TableHead>
                <TableHead className="px-3 py-2.5 w-[110px]">Total Markup</TableHead>
                <TableHead className="px-3 py-2.5 w-[140px]">Validity</TableHead>
                <TableHead className="px-3 py-2.5 w-[140px] xl:table-cell hidden">Last Updated</TableHead>
                <TableHead className="px-3 py-2.5 w-[80px]">Active</TableHead>
                <TableHead className="px-3 py-2.5 min-w-[120px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {!useVirtualization &&
                filteredSuppliers.map((supplier, idx) => {
                  const validity = "19-Oct-2025";
                  const modules: string[] = Array.isArray(
                    (supplier as any).modules,
                  )
                    ? (supplier as any).modules
                    : ([supplier.product_type].filter(Boolean) as string[]);
                  return (
                    <TableRow
                      key={supplier.id}
                      tabIndex={0}
                      className={`odd:bg-white even:bg-slate-50 hover:bg-slate-100 border-b border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 h-[60px]`}
                    >
                      <TableCell
                        className="px-3 py-2 font-medium leading-tight truncate"
                        title={supplier.name}
                      >
                        {supplier.name}
                      </TableCell>
                      <TableCell className="px-3 py-2 uppercase text-slate-600 leading-tight">
                        {supplier.code}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {modules.map((m, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-slate-100"
                            >
                              {String(m || "-").toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 uppercase">
                        {(supplier as any).base_currency || "USD"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-slate-600">
                        {typeof (supplier as any).base_markup === "number"
                          ? `${(supplier as any).base_markup}%`
                          : "-"}
                      </TableCell>
                      <TableCell className="px-3 py-2">{validity}</TableCell>
                      <TableCell className="px-3 py-2 text-slate-600 truncate xl:table-cell hidden" title="19-Oct-2025">19-Oct-2025</TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="w-full flex items-center justify-center">
                          <OnOffToggle size="sm" checked={supplier.is_enabled} onChange={() => toggleSupplier(supplier)} />
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                            >
                              <MoreHorizontal
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSelectedSupplier(supplier)}
                            >
                              <Settings className="h-4 w-4 mr-2" /> Manage
                              markups
                              <DropdownMenuShortcut>M</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setPreviewSupplier(supplier)}
                            >
                              <Activity className="h-4 w-4 mr-2" /> Preview
                              price
                              <DropdownMenuShortcut>P</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setAuditSupplier(supplier)}
                            >
                              <History className="h-4 w-4 mr-2" /> Audit log
                              <DropdownMenuShortcut>A</DropdownMenuShortcut>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {useVirtualization && (
                <>
                  <TableRow className="h-0">
                    <TableCell colSpan={10} className="p-0">
                      <div style={{ height: startIndex * ROW_HEIGHT }} />
                    </TableCell>
                  </TableRow>
                  {visibleRows.map((supplier, localIdx) => {
                    const idx = startIndex + localIdx;
                    const validity =
                      (supplier as any).valid_from || (supplier as any).valid_to
                        ? `${(supplier as any).valid_from ? new Date((supplier as any).valid_from).toLocaleDateString() : "-"} → ${(supplier as any).valid_to ? new Date((supplier as any).valid_to).toLocaleDateString() : "-"}`
                        : "-";
                    const modules: string[] = Array.isArray(
                      (supplier as any).modules,
                    )
                      ? (supplier as any).modules
                      : ([supplier.product_type].filter(Boolean) as string[]);
                    return (
                      <TableRow
                        key={supplier.id}
                        tabIndex={0}
                        className={`hover:bg-slate-100 border-b border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 h-[60px] ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                      >
                        <TableCell
                          className="px-3 py-2 font-medium leading-tight truncate"
                          title={supplier.name}
                        >
                          {supplier.name}
                        </TableCell>
                        <TableCell className="px-3 py-2 uppercase text-slate-600 leading-tight">
                          {supplier.code}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {modules.map((m, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-slate-100"
                              >
                                {String(m || "-").toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2 uppercase">
                          {(supplier as any).base_currency || "USD"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-slate-600">
                          {typeof (supplier as any).base_markup === "number"
                            ? `${(supplier as any).base_markup}%`
                            : "-"}
                        </TableCell>
                        <TableCell className="px-3 py-2">{validity}</TableCell>
                        <TableCell className="px-3 py-2 text-slate-600 truncate xl:table-cell hidden" title="19-Oct-2025">19-Oct-2025</TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="w-full flex items-center justify-center">
                          <OnOffToggle size="sm" checked={supplier.is_enabled} onChange={() => toggleSupplier(supplier)} />
                        </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                              >
                                <MoreHorizontal
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedSupplier(supplier)}
                              >
                                <Settings className="h-4 w-4 mr-2" /> Manage
                                markups
                                <DropdownMenuShortcut>M</DropdownMenuShortcut>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setPreviewSupplier(supplier)}
                              >
                                <Activity className="h-4 w-4 mr-2" /> Preview
                                price
                                <DropdownMenuShortcut>P</DropdownMenuShortcut>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setAuditSupplier(supplier)}
                              >
                                <History className="h-4 w-4 mr-2" /> Audit log
                                <DropdownMenuShortcut>A</DropdownMenuShortcut>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="h-0">
                    <TableCell colSpan={10} className="p-0">
                      <div
                        style={{ height: totalHeight - endIndex * ROW_HEIGHT }}
                      />
                    </TableCell>
                  </TableRow>
                </>
              )}

              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-gray-500 py-8"
                  >
                    No suppliers match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Preview Price Dialog */}
      {previewSupplier && (
        <Dialog
          open={!!previewSupplier}
          onOpenChange={() => setPreviewSupplier(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Preview Price — {previewSupplier.name}</DialogTitle>
              <DialogDescription>
                Test the USD normalization, hedge and base markup, converted to
                display currency.
              </DialogDescription>
            </DialogHeader>
            <PreviewPriceForm
              supplierCode={previewSupplier.code}
              baseCurrency={(previewSupplier as any).base_currency || "USD"}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Audit Log Dialog */}
      {auditSupplier && (
        <Dialog
          open={!!auditSupplier}
          onOpenChange={() => setAuditSupplier(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Audit Log — {auditSupplier.name}</DialogTitle>
            </DialogHeader>
            <AuditLogList supplierCode={auditSupplier.code} />
          </DialogContent>
        </Dialog>
      )}

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
                    Base: ₹{previewPrice.result.basePrice} �� Final: ₹
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
