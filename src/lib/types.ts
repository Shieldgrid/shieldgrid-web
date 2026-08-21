/**
 * src/lib/types.ts
 *
 * Domain types matching shieldgrid-core API schema exactly.
 */

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'closed';

export interface NormalizedAlert {
  id: string;
  source_id: string;
  connector_id: string;
  severity: Severity;
  source: string;
  timestamp: string;
  raw_payload: Record<string, unknown> | unknown;
  status: AlertStatus;
}

export interface UpdateAlertRequest {
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

// ── Ingest Jobs ───────────────────────────────────────────────────────────────

export interface IngestJob {
  id: string;
  connector_id: string;
  name: string;
  interval_minutes: number;
  enabled: boolean;
  last_run_at?: string | null;
  last_status?: string | null;
  last_error?: string | null;
  last_watermark?: string | null;
  next_run_at?: string | null;
  created_at: string;
  updated_at: string;
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

// ── Velociraptor VQL Shell ────────────────────────────────────────────────────

export interface VqlClient {
  client_id: string;
  hostname?: string | null;
  os?: string | null;
  arch?: string | null;
  client_version?: string | null;
  last_seen_at?: number | null;
}

export interface VqlArtifact {
  name: string;
  description?: string | null;
}

export interface VqlQueryRequest {
  vql: string;
  client_id?: string | null;
}

export interface VqlQueryResponse {
  rows: Record<string, unknown>[];
  truncated: boolean;
  elapsed_ms: number;
  error?: string | null;
}

// ── Threat Intelligence & Enrichment ──────────────────────────────────────────

export type IocType = 'ip' | 'domain' | 'hash' | 'cve' | 'url';
export type ThreatVerdict = 'benign' | 'suspicious' | 'malicious' | 'unknown';

export interface ThreatIntelResult {
  id?: string | null;
  ioc_type: IocType;
  ioc_value: string;
  provider: string;
  verdict: ThreatVerdict;
  score?: number | null;
  details: Record<string, unknown>;
  cached: boolean;
  checked_at: string;
}

export interface EnrichIocsRequest {
  iocs: string[];
}

export interface EnrichIocsResponse {
  count: number;
  results: ThreatIntelResult[];
}

// ── Shieldgrid Actions & Active Response ──────────────────────────────────────

export interface ActionTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: 'containment' | 'remediation' | 'forensics' | 'network' | string;
  provider: 'velociraptor' | 'wazuh' | 'generic' | string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  params_schema: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ActionExecution {
  id: string;
  template_id?: string | null;
  template_name: string;
  target_id: string;
  target_type: string;
  initiated_by: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | string;
  params: Record<string, unknown>;
  output?: string | null;
  error?: string | null;
  case_id?: string | null;
  alert_id?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface ExecuteActionPayload {
  template_name: string;
  target_id: string;
  target_type?: string;
  params?: Record<string, unknown>;
  case_id?: string;
  alert_id?: string;
}

// ── Detection Rules & MITRE ATT&CK ───────────────────────────────────────────

export interface MitreTactic {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tactic_id: string;
  description: string;
  detection_count: number;
}

export interface DetectionRule {
  id: string;
  rule_id: string;
  name: string;
  description: string;
  severity: Severity;
  enabled: boolean;
  category: string;
  connector_id: string;
  query_or_vql: string;
  mitre_tactics: string[];
  mitre_techniques: string[];
  created_at: string;
  updated_at: string;
}

export interface MitreTacticMatrixColumn {
  tactic: MitreTactic;
  techniques: MitreTechnique[];
}

export interface MitreMatrixResponse {
  columns: MitreTacticMatrixColumn[];
  total_techniques: number;
  total_active_detections: number;
}

// ── AI Analyst Types ─────────────────────────────────────────────────────────

export interface RecommendedAction {
  template_name: string;
  display_name: string;
  description: string;
  risk_level: string;
  target_id: string;
  target_type: string;
}

export interface TriageReport {
  id: string;
  generated_at: string;
  risk_score: number;
  verdict: 'MALICIOUS' | 'SUSPICIOUS' | 'BENIGN' | 'INFORMATIONAL' | string;
  summary: string;
  iocs_analyzed: ThreatIntelResult[];
  mitre_tactics: string[];
  mitre_techniques: string[];
  recommended_actions: RecommendedAction[];
}

export interface SecurityPostureSummary {
  open_alerts_count: number;
  critical_alerts_count: number;
  active_cases_count: number;
  executed_actions_count: number;
  high_risk_iocs_cached: number;
  top_threat_summary: string;
}

// ── Scheduler Types ─────────────────────────────────────────────────────────

export interface Schedule {
  id: string;
  name: string;
  description: string;
  connector_id: string;
  action_type: string;
  target_id?: string | null;
  trigger: Record<string, unknown>;
  params: Record<string, unknown>;
  enabled: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSchedulePayload {
  name: string;
  connector_id: string;
  action_type: string;
  trigger: Record<string, unknown>;
  params?: Record<string, unknown>;
}

// ── Network Connector Types ─────────────────────────────────────────────────

export interface NetworkConnector {
  id: string;
  name: string;
  device_type: string;
  ip_address: string;
  syslog_port: number;
  syslog_protocol: string;
  enabled: boolean;
  last_seen_at?: string | null;
  alert_count: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateNetworkConnectorPayload {
  name: string;
  device_type: string;
  ip_address: string;
  syslog_port?: number;
  syslog_protocol?: string;
}

// ── Notification Types ──────────────────────────────────────────────────────

export interface NotificationChannel {
  id: string;
  name: string;
  channel_type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channel_id: string;
  trigger_type: string;
  conditions: Record<string, unknown>;
  template: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  channel_id: string;
  status: string;
  recipient: string;
  subject?: string | null;
  message: string;
  error?: string | null;
  sent_at: string;
}

export interface SendNotificationPayload {
  channel_id: string;
  recipient: string;
  subject?: string;
  message: string;
}

// ── Monitoring Types ────────────────────────────────────────────────────────

export interface SystemHealth {
  status: string;
  timestamp: string;
  connectors: Array<{
    id: string;
    name: string;
    status: string;
    response_time_ms?: number;
    details?: string | null;
  }>;
  database: { status: string };
  metrics: {
    alerts_last_hour: number;
    alerts_last_24h: number;
    cases_last_hour: number;
    cases_last_24h: number;
    actions_last_hour: number;
    actions_last_24h: number;
  };
}

export interface PerformanceDashboard {
  system_health: SystemHealth;
  ingestion_rate: {
    alerts_per_minute: number;
    alerts_per_hour: number;
    alerts_per_day: number;
  };
  top_alert_sources: Array<{ source: string; count: number }>;
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}





