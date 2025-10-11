import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchComponentHistory,
  fetchSystemStatus,
  ComponentStatus,
  MonitorHistoryResponse,
  SystemMonitorResponse,
} from "@/services/systemMonitorService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  Globe,
  Mail,
  RefreshCcw,
  Server,
  ShieldCheck,
  SignalHigh,
  SignalLow,
  Wifi,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CACHE_KEY = "faredown-system-monitor-cache";

interface CachedMonitorPayload {
  timestamp: string;
  data: SystemMonitorResponse;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  connected: {
    label: "Connected",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  configured: {
    label: "Configured",
    className: "bg-blue-100 text-blue-700",
    icon: ShieldCheck,
  },
  set: {
    label: "Valid",
    className: "bg-emerald-100 text-emerald-700",
    icon: ShieldCheck,
  },
  warning: {
    label: "Warning",
    className: "bg-yellow-100 text-yellow-700",
    icon: AlertTriangle,
  },
  disconnected: {
    label: "Disconnected",
    className: "bg-red-100 text-red-700",
    icon: ShieldAlert,
  },
  missing: {
    label: "Missing",
    className: "bg-red-100 text-red-700",
    icon: ShieldAlert,
  },
  not_configured: {
    label: "Not Configured",
    className: "bg-slate-100 text-slate-700",
    icon: ShieldAlert,
  },
};

function formatLatency(latencyMs: number | null) {
  if (latencyMs === null || latencyMs === undefined) {
    return "—";
  }
  if (latencyMs >= 1000) {
    return `${(latencyMs / 1000).toFixed(2)}s`;
  }
  return `${latencyMs}ms`;
}

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] || {
      label: status,
      className: "bg-gray-100 text-gray-700",
      icon: ShieldCheck,
    }
  );
}

function extractDetailError(
  detail: Record<string, unknown> | null | undefined,
) {
  if (!detail) {
    return null;
  }

  const info = detail as { error?: unknown; message?: unknown };

  if (typeof info.error === "string" && info.error.trim().length > 0) {
    return info.error;
  }

  if (typeof info.message === "string" && info.message.trim().length > 0) {
    return info.message;
  }

  return null;
}

type HistoryRange = "24" | "168";

export default function SystemMonitor() {
  const [components, setComponents] = useState<ComponentStatus[]>([]);
  const [summary, setSummary] = useState({
    healthy: 0,
    warning: 0,
    failing: 0,
    total: 0,
  });
  const [meta, setMeta] = useState({ checkedAt: "", server: "" });
  const [envSnapshot, setEnvSnapshot] = useState<Record<string, string | null>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<ComponentStatus | null>(
    null,
  );
  const [historyData, setHistoryData] = useState<MonitorHistoryResponse | null>(
    null,
  );
  const [historyRange, setHistoryRange] = useState<HistoryRange>("24");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const latestDataRef = useRef<SystemMonitorResponse | null>(null);

  const loadCachedData = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSystemStatus();
      setComponents(response.components);
      setSummary(response.summary);
      setMeta(response.meta);
      setEnvSnapshot(response.env);
    } catch (err: any) {
      setError(err?.message || "Failed to load system status");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(
    async (component: ComponentStatus, range: HistoryRange) => {
      try {
        setHistoryLoading(true);
        const data = await fetchComponentHistory(
          component.component,
          Number(range),
        );
        setHistoryData(data);
      } catch (err: any) {
        setHistoryData(null);
      } finally {
        setHistoryLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadStatus]);

  useEffect(() => {
    if (historyOpen && historyTarget) {
      loadHistory(historyTarget, historyRange);
    }
  }, [historyOpen, historyTarget, historyRange, loadHistory]);

  const overallState = useMemo(() => {
    if (summary.failing > 0) {
      return {
        icon: ShieldAlert,
        tone: "bg-red-50 text-red-700 border-red-200",
        message: `${summary.failing} system${summary.failing > 1 ? "s" : ""} require attention`,
      };
    }
    if (summary.warning > 0) {
      return {
        icon: AlertTriangle,
        tone: "bg-yellow-50 text-yellow-700 border-yellow-200",
        message: `${summary.warning} system${summary.warning > 1 ? "s" : ""} showing warnings`,
      };
    }
    return {
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
      message: "All systems operational",
    };
  }, [summary]);

  const handleOpenHistory = (component: ComponentStatus) => {
    setHistoryTarget(component);
    setHistoryRange("24");
    setHistoryOpen(true);
  };

  const historyChartData = useMemo(() => {
    if (!historyData?.points?.length) {
      return [];
    }
    return historyData.points.map((point) => ({
      time: new Date(point.checkedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      latency: point.latencyMs ?? 0,
      status: point.status,
    }));
  }, [historyData]);

  const uptimeLabel = useMemo(() => {
    if (!historyData) {
      return "";
    }
    const pct = historyData.uptimePct;
    if (pct === null || pct === undefined) {
      return "No samples";
    }
    return `${pct.toFixed(1)}% uptime`;
  }, [historyData]);

  return (
    <div className="space-y-6">
      <Card className={`border ${overallState.tone}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            {overallState.icon && <overallState.icon className="h-6 w-6" />}
            <CardTitle className="text-lg">
              System Connectivity &amp; Environment Monitor
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStatus}
            disabled={loading}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh All
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <SummaryMetric
            label="Healthy"
            value={summary.healthy}
            tone="text-emerald-700"
            icon={CheckCircle2}
          />
          <SummaryMetric
            label="Warnings"
            value={summary.warning}
            tone="text-yellow-700"
            icon={AlertTriangle}
          />
          <SummaryMetric
            label="Failing"
            value={summary.failing}
            tone="text-red-700"
            icon={ShieldAlert}
          />
          <SummaryMetric
            label="Last Checked"
            value={
              meta.checkedAt
                ? formatDistanceToNow(new Date(meta.checkedAt), {
                    addSuffix: true,
                  })
                : "—"
            }
            tone="text-slate-700"
            icon={Clock3}
          />
        </CardContent>
      </Card>

      <EnvSnapshot env={envSnapshot} server={meta.server} />

      <div className="hidden xl:block">
        <Card>
          <CardHeader>
            <CardTitle>Live Connectivity Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>URL / Variable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((component) => (
                  <TableRow key={component.component}>
                    <TableCell className="font-medium">
                      {component.name}
                    </TableCell>
                    <TableCell>
                      {component.target ? (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <span
                            className="truncate max-w-[320px]"
                            title={component.target}
                          >
                            {component.target}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={component.status}
                        reason={extractDetailError(component.detail)}
                      />
                    </TableCell>
                    <TableCell>{formatLatency(component.latencyMs)}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {component.checkedAt
                        ? formatDistanceToNow(new Date(component.checkedAt), {
                            addSuffix: true,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div className="flex flex-col gap-1">
                        <span>
                          24h:{" "}
                          {component.uptime.last24h !== null
                            ? `${component.uptime.last24h.toFixed(1)}%`
                            : "—"}
                        </span>
                        <span>
                          7d:{" "}
                          {component.uptime.last7d !== null
                            ? `${component.uptime.last7d.toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenHistory(component)}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" /> History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:hidden">
        {components.map((component) => (
          <ComponentCard
            key={component.component}
            component={component}
            onHistory={() => handleOpenHistory(component)}
          />
        ))}
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetTrigger asChild>
          <span />
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {historyTarget
                ? `${historyTarget.name} • History`
                : "Component History"}
            </SheetTitle>
            <SheetDescription>
              {historyTarget?.target
                ? `Target: ${historyTarget.target}`
                : "Connectivity history"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <Tabs
              value={historyRange}
              onValueChange={(value) => setHistoryRange(value as HistoryRange)}
            >
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="24">Last 24h</TabsTrigger>
                <TabsTrigger value="168">Last 7d</TabsTrigger>
              </TabsList>
              <TabsContent value={historyRange} className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Latency &amp; Uptime
                    </CardTitle>
                    <div className="text-sm text-slate-500">{uptimeLabel}</div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-64">
                      {historyLoading ? (
                        <div className="flex h-full items-center justify-center text-slate-500">
                          Loading history…
                        </div>
                      ) : historyChartData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historyChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="time"
                              tick={{ fontSize: 12 }}
                              minTickGap={24}
                            />
                            <YAxis tick={{ fontSize: 12 }} width={48} />
                            <Tooltip
                              labelFormatter={(value) => `Time: ${value}`}
                              formatter={(value: number) => [
                                `${value} ms`,
                                "Latency",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="latency"
                              stroke="#2563eb"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          No samples available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 pr-3">
                  <div className="space-y-3">
                    {historyData?.points?.length ? (
                      historyData.points
                        .slice()
                        .reverse()
                        .map((point, index) => (
                          <div
                            key={`${point.checkedAt}-${index}`}
                            className="flex items-start justify-between rounded-lg border border-slate-200 p-3"
                          >
                            <div>
                              <div className="text-sm font-medium">
                                {new Date(point.checkedAt).toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500">
                                Latency: {formatLatency(point.latencyMs)}
                              </div>
                            </div>
                            <StatusBadge
                              status={point.status}
                              reason={extractDetailError(
                                point.detail as Record<string, unknown> | null,
                              )}
                            />
                          </div>
                        ))
                    ) : (
                      <div className="text-sm text-slate-500">
                        No history available.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  reason,
}: {
  status: string;
  reason?: string | null;
}) {
  const config = getStatusConfig(status);
  return (
    <Badge
      className={`${config.className} flex items-center gap-1`}
      title={reason || undefined}
    >
      <config.icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
      <Icon className={`h-6 w-6 ${tone}`} />
      <div>
        <div className={`text-xl font-semibold ${tone}`}>{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function EnvSnapshot({
  env,
  server,
}: {
  env: Record<string, string | null>;
  server: string;
}) {
  const entries = Object.entries(env || {});
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-slate-600" />
          Environment Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <EnvRow label="Server" value={server || "—"} icon={SignalHigh} />
        {entries.map(([key, value]) => (
          <EnvRow key={key} label={key} value={value ?? "—"} icon={Globe} />
        ))}
      </CardContent>
    </Card>
  );
}

function EnvRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="h-4 w-4 text-slate-500" />
        {label}
      </div>
      <span
        className="max-w-[220px] truncate text-xs text-slate-500"
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function ComponentCard({
  component,
  onHistory,
}: {
  component: ComponentStatus;
  onHistory: () => void;
}) {
  const Icon = getComponentIcon(component.component);
  const errorDetail = extractDetailError(component.detail);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">{component.name}</CardTitle>
        </div>
        <StatusBadge status={component.status} reason={errorDetail} />
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoRow label="Target" value={component.target || "—"} icon={Globe} />
        <InfoRow
          label="Latency"
          value={formatLatency(component.latencyMs)}
          icon={Wifi}
        />
        <InfoRow
          label="Last Checked"
          value={
            component.checkedAt
              ? formatDistanceToNow(new Date(component.checkedAt), {
                  addSuffix: true,
                })
              : "—"
          }
          icon={Clock3}
        />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <SignalLow className="h-4 w-4 text-slate-500" />
            <span>Uptime</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <span>
              24h:{" "}
              {component.uptime.last24h !== null
                ? `${component.uptime.last24h.toFixed(1)}%`
                : "—"}
            </span>
            <span>
              7d:{" "}
              {component.uptime.last7d !== null
                ? `${component.uptime.last7d.toFixed(1)}%`
                : "—"}
            </span>
          </div>
        </div>
        {errorDetail ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <div className="font-semibold">Last error</div>
            <div className="mt-1 whitespace-pre-line">{errorDetail}</div>
          </div>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onHistory}
        >
          <BarChart3 className="mr-2 h-4 w-4" /> View History
        </Button>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <span>{label}</span>
      </div>
      <span className="max-w-[160px] truncate text-xs" title={value}>
        {value}
      </span>
    </div>
  );
}

function getComponentIcon(component: string) {
  switch (component) {
    case "frontend":
      return Globe;
    case "backend":
      return Server;
    case "database":
      return Database;
    case "email":
      return Mail;
    case "auth":
      return ShieldCheck;
    case "cors":
      return ShieldCheck;
    default:
      return Activity;
  }
}
