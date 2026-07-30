/**
 * src/lib/api.ts
 *
 * Typed fetch wrapper for all shieldgrid-core API endpoints.
 */

import type {
  HealthResponse,
  NormalizedAlert,
  Case,
  CreateCaseRequest,
  UpdateCaseRequest,
  LinkAlertRequest,
  AuditLog,
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

// ── Health / Connectors Endpoint ─────────────────────────────────────────────

export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health');
}

// ── Alerts Endpoints ─────────────────────────────────────────────────────────

export async function fetchAlerts(since?: string): Promise<NormalizedAlert[]> {
  const query = since ? { since } : undefined;
  return apiFetch<NormalizedAlert[]>('/api/v1/alerts', { query });
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
