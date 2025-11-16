/**
 * API Logs Viewer
 * View and analyze third-party API logs (TBO, Hotelbeds, Amadeus, RateHawk)
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Trash2,
  Eye,
  BarChart3,
} from "lucide-react";
import {
  apiLogsService,
  APILog,
  APILogDetail,
  SupplierStats,
} from "@/services/apiLogsService";
import { format } from "date-fns";

const SUPPLIERS = ["TBO", "HOTELBEDS", "AMADEUS", "RATEHAWK"];

export default function APILogsViewer() {
  const [logs, setLogs] = useState<APILog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [selectedLog, setSelectedLog] = useState<APILogDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filters
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState<Record<string, SupplierStats>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        limit,
        offset: page * limit,
        errors_only: errorsOnly,
      };

      if (selectedSupplier !== "all") {
        params.supplier = selectedSupplier;
      }

      const response = await apiLogsService.fetchLogs(params);
      setLogs(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    setStatsLoading(true);

    try {
      const statsPromises = SUPPLIERS.map(async (supplier) => {
        const stat = await apiLogsService.fetchSupplierStats(supplier);
        return [supplier, stat];
      });

      const results = await Promise.all(statsPromises);
      const statsMap: Record<string, SupplierStats> = {};
      results.forEach(([supplier, stat]) => {
        statsMap[supplier as string] = stat as SupplierStats;
      });

      setStats(statsMap);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // View log details
  const viewLogDetails = async (logId: string) => {
    try {
      const details = await apiLogsService.fetchLogById(logId);
      setSelectedLog(details);
      setDetailsOpen(true);
    } catch (err: any) {
      alert("Failed to load log details: " + err.message);
    }
  };

  // Cleanup old logs
  const handleCleanup = async () => {
    if (!confirm("Are you sure you want to delete logs older than 90 days?")) {
      return;
    }

    try {
      const result = await apiLogsService.cleanupLogs();
      alert(result.message);
      fetchLogs();
    } catch (err: any) {
      alert("Failed to cleanup logs: " + err.message);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, selectedSupplier, errorsOnly]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Status badge
  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          {statusCode}
        </Badge>
      );
    } else if (statusCode >= 400) {
      return (
        <Badge className="bg-red-100 text-red-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          {statusCode}
        </Badge>
      );
    }
    return <Badge variant="outline">{statusCode}</Badge>;
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms}ms`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Logs</h1>
          <p className="text-gray-600">
            Monitor third-party supplier API requests and responses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleCleanup}>
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Old Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {statsLoading ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {SUPPLIERS.map((supplier) => {
                const stat = stats[supplier];
                if (!stat) return null;

                const successRate =
                  stat.total_requests > 0
                    ? (
                        (stat.successful_requests / stat.total_requests) *
                        100
                      ).toFixed(1)
                    : "0";

                return (
                  <Card key={supplier}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {supplier}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            Total Requests
                          </span>
                          <span className="text-sm font-semibold">
                            {stat.total_requests}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            Success Rate
                          </span>
                          <span
                            className={`text-sm font-semibold ${parseFloat(successRate) >= 90 ? "text-green-600" : "text-yellow-600"}`}
                          >
                            {successRate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            Avg Duration
                          </span>
                          <span className="text-sm font-semibold">
                            {formatDuration(Math.round(stat.avg_duration_ms))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Errors</span>
                          <span
                            className={`text-sm font-semibold ${stat.error_requests > 0 ? "text-red-600" : "text-gray-600"}`}
                          >
                            {stat.error_requests}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">
                    Supplier
                  </label>
                  <Select
                    value={selectedSupplier}
                    onValueChange={setSelectedSupplier}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {SUPPLIERS.map((supplier) => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={errorsOnly}
                      onChange={(e) => setErrorsOnly(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Errors Only</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>API Logs ({total} total)</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * limit >= total || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading logs...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No logs found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {format(
                            new Date(log.request_timestamp),
                            "MMM dd, HH:mm:ss",
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.supplier_name}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs">
                          {log.endpoint}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status_code)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            {formatDuration(log.duration_ms)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.error_message ? (
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewLogDetails(log.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>API Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Supplier
                  </label>
                  <p className="font-semibold">{selectedLog.supplier_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <p>{getStatusBadge(selectedLog.status_code)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Duration
                  </label>
                  <p className="font-semibold">
                    {formatDuration(selectedLog.duration_ms)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Trace ID
                  </label>
                  <p className="text-xs font-mono">{selectedLog.trace_id}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Endpoint
                </label>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                  {selectedLog.endpoint}
                </p>
              </div>

              {selectedLog.error_message && (
                <div>
                  <label className="text-sm font-medium text-red-600">
                    Error Message
                  </label>
                  <p className="text-sm bg-red-50 p-2 rounded">
                    {selectedLog.error_message}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Request Payload
                </label>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">
                  {JSON.stringify(selectedLog.request_payload, null, 2)}
                </pre>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Response Payload
                </label>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">
                  {JSON.stringify(selectedLog.response_payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
