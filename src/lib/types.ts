/**
 * src/lib/types.ts
 *
 * Domain types matching shieldgrid-core API schema exactly.
 */

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'closed';

export interface NormalizedAlert {
  id: string;
  connector_id: string;
  severity: Severity;
  source: string;
  timestamp: string;
  raw_payload: Record<string, unknown> | unknown;
  status: AlertStatus;
}

export interface Case {
  id: string;
  title: string;
  status: string;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCaseRequest {
  title: string;
}

export interface UpdateCaseRequest {
  status?: string;
  assigned_to?: string | null;
}

export interface LinkAlertRequest {
  alert_id: string;
}

export interface ConnectorHealthEntry {
  id: string;
  status: 'healthy' | 'degraded' | 'down';
  reason?: string;
}

export interface HealthResponse {
  status: string;
  connectors: ConnectorHealthEntry[];
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  target: string;
  timestamp: string;
}

export interface JwtClaims {
  sub: string;
  role: string;
  exp: number;
}

// ── Response Actions ─────────────────────────────────────────────────────────

export interface ActionRequest {
  connector_id: string;
  action_type: 'isolate' | 'unisolate';
  target_id: string;
}

export type ActionStatus = 'success' | 'failure' | 'timeout';

export interface ActionResult {
  status: ActionStatus;
  detail: string;
  timestamp: string;
}
