/**
 * API Logs Service
 * Fetches third-party API logs from the admin endpoint
 */

import { apiClient } from "@/lib/api";

export interface APILog {
  id: string;
  supplier_name: string;
  endpoint: string;
  method: string;
  status_code: number;
  duration_ms: number;
  error_message?: string;
  request_timestamp: string;
  response_timestamp: string;
  trace_id: string;
  correlation_id?: string;
  environment: string;
  created_at: string;
}

export interface APILogDetail extends APILog {
  request_payload: any;
  request_headers: any;
  response_payload: any;
  response_headers: any;
  error_stack?: string;
}

export interface APILogsResponse {
  success: boolean;
  data: APILog[];
  total: number;
  limit: number;
  offset: number;
}

export interface SupplierStats {
  supplier_name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  error_requests: number;
  avg_duration_ms: number;
  max_duration_ms: number;
  min_duration_ms: number;
}

export interface APILogsQueryParams {
  supplier?: string;
  status?: number;
  limit?: number;
  offset?: number;
  from_date?: string;
  to_date?: string;
  trace_id?: string;
  correlation_id?: string;
  errors_only?: boolean;
}

export const apiLogsService = {
  /**
   * Fetch API logs with filters
   */
  async fetchLogs(params: APILogsQueryParams = {}): Promise<APILogsResponse> {
    const queryParams = new URLSearchParams();

    if (params.supplier) queryParams.append("supplier", params.supplier);
    if (params.status) queryParams.append("status", params.status.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.from_date) queryParams.append("from_date", params.from_date);
    if (params.to_date) queryParams.append("to_date", params.to_date);
    if (params.trace_id) queryParams.append("trace_id", params.trace_id);
    if (params.correlation_id)
      queryParams.append("correlation_id", params.correlation_id);
    if (params.errors_only)
      queryParams.append("errors_only", params.errors_only.toString());

    const response = await apiClient.get<APILogsResponse>(
      `/admin/api-logs?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Fetch a single log by ID
   */
  async fetchLogById(id: string): Promise<APILogDetail> {
    const response = await apiClient.get<{ success: boolean; data: APILogDetail }>(
      `/admin/api-logs/${id}`
    );
    return response.data;
  },

  /**
   * Fetch supplier statistics
   */
  async fetchSupplierStats(
    supplier: string,
    fromDate?: string
  ): Promise<SupplierStats> {
    const queryParams = fromDate ? `?from_date=${fromDate}` : "";
    const response = await apiClient.get<{ success: boolean; data: SupplierStats }>(
      `/admin/api-logs/stats/${supplier}${queryParams}`
    );
    return response.data;
  },

  /**
   * Fetch recent error logs
   */
  async fetchErrorLogs(
    supplier?: string,
    limit: number = 50
  ): Promise<APILog[]> {
    const queryParams = new URLSearchParams();
    if (supplier) queryParams.append("supplier", supplier);
    queryParams.append("limit", limit.toString());

    const response = await apiClient.get<{ success: boolean; data: APILog[] }>(
      `/admin/api-logs/errors/recent?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Fetch logs by trace ID
   */
  async fetchLogsByTraceId(traceId: string): Promise<APILog[]> {
    const response = await apiClient.get<{ success: boolean; data: APILog[] }>(
      `/admin/api-logs/trace/${traceId}`
    );
    return response.data;
  },

  /**
   * Cleanup old logs
   */
  async cleanupLogs(): Promise<{ deleted_count: number; message: string }> {
    const response = await apiClient.post<{
      success: boolean;
      deleted_count: number;
      message: string;
    }>("/admin/api-logs/cleanup", {});
    return {
      deleted_count: response.deleted_count,
      message: response.message,
    };
  },
};
