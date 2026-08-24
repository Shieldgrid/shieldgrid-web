/**
 * src/lib/api.ts
 *
 * Typed fetch wrapper for all shieldgrid-core API endpoints.
 */

import type {
  HealthResponse,
  NormalizedAlert,
  AlertStatus,
  Case,
  CreateCaseRequest,
  UpdateCaseRequest,
  LinkAlertRequest,
  AuditLog,
  ActionRequest,
  ActionResult,
  VqlClient,
  VqlArtifact,
  VqlQueryRequest,
  VqlQueryResponse,
  IngestJob,
} from './types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let onUnauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorizedCallback = handler;
}

async function apiFetch<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, query } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method,
    headers,
    credentials: 'include', // Automatically send HttpOnly cookies
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    throw new ApiError(401, 'Unauthorized or session expired');
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new ApiError(response.status, `API Error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ── Auth Endpoint ────────────────────────────────────────────────────────────

export async function loginApi(email: string, password: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function fetchMe(): Promise<import('./types').JwtClaims> {
  return apiFetch<import('./types').JwtClaims>('/api/v1/auth/me');
}

export async function logoutApi(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/v1/auth/logout', {
    method: 'POST',
  });
}

export async function refreshSession(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/v1/auth/refresh');
}

// ── Health / Connectors Endpoint ─────────────────────────────────────────────

export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health');
}

// ── Alerts Endpoints ─────────────────────────────────────────────────────────

export async function fetchAlerts(since?: string): Promise<NormalizedAlert[]> {
  const query = since ? { since } : undefined;
  return apiFetch<NormalizedAlert[]>('/api/v1/alerts', { query });
}

export async function updateAlertStatus(id: string, status: AlertStatus): Promise<NormalizedAlert> {
  return apiFetch<NormalizedAlert>(`/api/v1/alerts/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}

// ── Ingest Jobs Endpoints ─────────────────────────────────────────────────────

export async function fetchJobs(): Promise<IngestJob[]> {
  return apiFetch<IngestJob[]>('/api/v1/jobs');
}

// ── Cases Endpoints ──────────────────────────────────────────────────────────

export async function fetchCases(): Promise<Case[]> {
  return apiFetch<Case[]>('/api/v1/cases');
}

export async function createCase(payload: CreateCaseRequest): Promise<Case> {
  return apiFetch<Case>('/api/v1/cases', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchCase(id: string): Promise<Case> {
  return apiFetch<Case>(`/api/v1/cases/${id}`);
}

export async function updateCase(id: string, payload: UpdateCaseRequest): Promise<Case> {
  return apiFetch<Case>(`/api/v1/cases/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function fetchCaseAlerts(id: string): Promise<string[]> {
  return apiFetch<string[]>(`/api/v1/cases/${id}/alerts`);
}

export async function attachCaseAlert(id: string, alertId: string): Promise<void> {
  const payload: LinkAlertRequest = { alert_id: alertId };
  return apiFetch<void>(`/api/v1/cases/${id}/alerts`, {
    method: 'POST',
    body: payload,
  });
}

export async function detachCaseAlert(id: string, alertId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/cases/${id}/alerts/${alertId}`, {
    method: 'DELETE',
  });
}

// ── Audit Logs Endpoint ──────────────────────────────────────────────────────

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>('/api/v1/audit');
}

// ── Case Actions Endpoints ────────────────────────────────────────────────────

export async function executeAction(
  caseId: string,
  payload: ActionRequest
): Promise<ActionResult> {
  return apiFetch<ActionResult>(`/api/v1/cases/${caseId}/actions`, {
    method: 'POST',
    body: payload,
  });
}

export async function fetchCaseActions(caseId: string): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>(`/api/v1/cases/${caseId}/actions`);
}

// ── Velociraptor VQL Shell Endpoints ──────────────────────────────────────────

export interface VqlListResponse<T> {
  rows: T[];
  truncated?: boolean;
  elapsed_ms: number;
}

export async function fetchVeloClients(): Promise<VqlListResponse<VqlClient>> {
  return apiFetch<VqlListResponse<VqlClient>>('/api/v1/velociraptor/clients');
}

export async function fetchVeloArtifacts(): Promise<VqlListResponse<VqlArtifact>> {
  return apiFetch<VqlListResponse<VqlArtifact>>('/api/v1/velociraptor/artifacts');
}

export async function runVqlQuery(payload: VqlQueryRequest): Promise<VqlQueryResponse> {
  return apiFetch<VqlQueryResponse>('/api/v1/velociraptor/query', {
    method: 'POST',
    body: payload,
  });
}

// ── Threat Intelligence Endpoints ─────────────────────────────────────────────

export async function lookupIoc(ioc: string): Promise<import('./types').ThreatIntelResult> {
  return apiFetch<import('./types').ThreatIntelResult>('/api/v1/threat-intel/lookup', {
    query: { ioc },
  });
}

export async function enrichIocs(iocs: string[]): Promise<import('./types').EnrichIocsResponse> {
  return apiFetch<import('./types').EnrichIocsResponse>('/api/v1/threat-intel/enrich', {
    method: 'POST',
    body: { iocs },
  });
}

export async function lookupEpss(cve: string): Promise<import('./types').ThreatIntelResult> {
  return apiFetch<import('./types').ThreatIntelResult>(`/api/v1/threat-intel/epss/${encodeURIComponent(cve)}`);
}

// ── Shieldgrid Actions Endpoints ──────────────────────────────────────────────

export async function fetchActionTemplates(): Promise<import('./types').ActionTemplate[]> {
  return apiFetch<import('./types').ActionTemplate[]>('/api/v1/actions/templates');
}

export async function executeShieldgridAction(
  payload: import('./types').ExecuteActionPayload
): Promise<import('./types').ActionExecution> {
  return apiFetch<import('./types').ActionExecution>('/api/v1/actions/execute', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchActionExecutions(limit = 50): Promise<import('./types').ActionExecution[]> {
  return apiFetch<import('./types').ActionExecution[]>('/api/v1/actions/executions', {
    query: { limit: limit.toString() },
  });
}

export async function fetchActionExecutionDetail(id: string): Promise<import('./types').ActionExecution> {
  return apiFetch<import('./types').ActionExecution>(`/api/v1/actions/executions/${id}`);
}

// ── Detection Rules & MITRE ATT&CK Endpoints ──────────────────────────────────

export async function fetchDetectionRules(): Promise<import('./types').DetectionRule[]> {
  return apiFetch<import('./types').DetectionRule[]>('/api/v1/rules');
}

export async function updateDetectionRule(
  id: string,
  payload: { enabled?: boolean; severity?: string }
): Promise<import('./types').DetectionRule> {
  return apiFetch<import('./types').DetectionRule>(`/api/v1/rules/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function fetchMitreTactics(): Promise<import('./types').MitreTactic[]> {
  return apiFetch<import('./types').MitreTactic[]>('/api/v1/mitre/tactics');
}

export async function fetchMitreMatrix(): Promise<import('./types').MitreMatrixResponse> {
  return apiFetch<import('./types').MitreMatrixResponse>('/api/v1/mitre/matrix');
}

// ── AI Analyst Endpoints ──────────────────────────────────────────────────────

export async function fetchSecurityPostureSummary(): Promise<import('./types').SecurityPostureSummary> {
  return apiFetch<import('./types').SecurityPostureSummary>('/api/v1/ai/summary');
}

export async function runAiTriage(payload: {
  alert_id?: string;
  case_id?: string;
  ioc?: string;
}): Promise<import('./types').TriageReport> {
  return apiFetch<import('./types').TriageReport>('/api/v1/ai/triage', {
    method: 'POST',
    body: payload,
  });
}

// ── Scheduler Endpoints ──────────────────────────────────────────────────────

export async function fetchSchedules(): Promise<import('./types').Schedule[]> {
  const res = await apiFetch<{ schedules: import('./types').Schedule[] }>('/api/v1/scheduler/schedules');
  return res.schedules || [];
}

export async function createSchedule(payload: import('./types').CreateSchedulePayload): Promise<import('./types').Schedule> {
  return apiFetch<import('./types').Schedule>('/api/v1/scheduler/schedules', {
    method: 'POST',
    body: payload,
  });
}

// ── Network Connectors Endpoints ─────────────────────────────────────────────

export async function fetchNetworkConnectors(): Promise<import('./types').NetworkConnector[]> {
  return apiFetch<import('./types').NetworkConnector[]>('/api/v1/network-connectors');
}

export async function createNetworkConnector(payload: import('./types').CreateNetworkConnectorPayload): Promise<import('./types').NetworkConnector> {
  return apiFetch<import('./types').NetworkConnector>('/api/v1/network-connectors', {
    method: 'POST',
    body: payload,
  });
}

// ── Notifications Endpoints ──────────────────────────────────────────────────

export async function fetchNotificationChannels(): Promise<import('./types').NotificationChannel[]> {
  return apiFetch<import('./types').NotificationChannel[]>('/api/v1/notifications/channels');
}

export async function fetchNotificationRules(): Promise<import('./types').NotificationRule[]> {
  return apiFetch<import('./types').NotificationRule[]>('/api/v1/notifications/rules');
}

export async function sendNotification(payload: import('./types').SendNotificationPayload): Promise<import('./types').NotificationLog> {
  return apiFetch<import('./types').NotificationLog>('/api/v1/notifications/send', {
    method: 'POST',
    body: payload,
  });
}

// ── Monitoring Endpoints ─────────────────────────────────────────────────────

export async function fetchSystemHealth(): Promise<import('./types').SystemHealth> {
  return apiFetch<import('./types').SystemHealth>('/api/v1/monitoring/health');
}

export async function fetchPerformanceDashboard(): Promise<import('./types').PerformanceDashboard> {
  return apiFetch<import('./types').PerformanceDashboard>('/api/v1/monitoring/dashboard');
}




