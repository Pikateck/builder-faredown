import { apiClient } from "@/lib/api";

export type MonitorStatus =
  | "connected"
  | "warning"
  | "disconnected"
  | "configured"
  | "not_configured"
  | "set"
  | "missing";

export interface ComponentUptime {
  last24h: number | null;
  last7d: number | null;
}

export interface ComponentStatus {
  component: string;
  name: string;
  target: string | null;
  status: MonitorStatus;
  latencyMs: number | null;
  httpStatus: number | null;
  checkedAt: string;
  uptime: ComponentUptime;
}

export interface SystemMonitorResponse {
  meta: {
    checkedAt: string;
    server: string;
  };
  summary: {
    healthy: number;
    warning: number;
    failing: number;
    total: number;
  };
  components: ComponentStatus[];
  env: Record<string, string | null>;
}

export interface MonitorHistoryPoint {
  checkedAt: string;
  status: MonitorStatus;
  latencyMs: number | null;
  detail?: any;
}

export interface MonitorHistoryResponse {
  component: string;
  hours: number;
  uptimePct: number | null;
  points: MonitorHistoryPoint[];
}

export async function fetchSystemStatus() {
  return apiClient.get<SystemMonitorResponse>("/api/admin/system-status");
}

export async function fetchComponentHistory(component: string, hours: number) {
  return apiClient.get<MonitorHistoryResponse>(
    `/api/admin/system-monitor/history?component=${encodeURIComponent(component)}&hours=${hours}`,
  );
}
