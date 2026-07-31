import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { fetchHealth, fetchAlerts, fetchCases, fetchJobs } from '../lib/api';
import type { HealthResponse, NormalizedAlert, Case, IngestJob } from '../lib/types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [jobs, setJobs] = useState<IngestJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [hRes, aRes, cRes, jRes] = await Promise.all([
        fetchHealth(),
        fetchAlerts().catch(() => []),
        fetchCases().catch(() => []),
        fetchJobs().catch(() => []),
      ]);
      setHealth(hRes);
      setAlerts(aRes);
      setCases(cRes);
      setJobs(jRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const openCasesCount = cases.filter((c) => c.status.toLowerCase() === 'open').length;
  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length;
  const enabledJobs = jobs.filter((j) => j.enabled);
  const lastIngestAt = enabledJobs
    .map((j) => j.last_run_at)
    .filter((t): t is string => !!t)
    .map((t) => new Date(t).getTime())
    .sort((a, b) => b - a)[0];
  const lastIngestLabel = lastIngestAt
    ? `Last ingest ${relativeTime(lastIngestAt)}`
    : 'Awaiting first ingest';

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Page Title */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>SOC Operational Overview</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Real-time status of integrated security tools and incident queues.
          </p>
        </div>

        {error && <ErrorDisplay message={error} onRetry={loadDashboardData} />}

        {loading ? (
          <LoadingSkeleton count={3} height="6rem" />
        ) : (
          <>
            {/* Top Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <MetricCard
                title="Active Connectors"
                value={health?.connectors.length ?? 0}
                subtitle={`${health?.connectors.filter((c) => c.status === 'healthy').length ?? 0} Healthy`}
                color="var(--color-accent)"
              />
              <MetricCard
                title="Total Merged Alerts"
                value={alerts.length}
                subtitle={`${criticalAlertsCount} High/Critical`}
                color={criticalAlertsCount > 0 ? 'var(--color-critical)' : 'var(--color-accent)'}
              />
              <MetricCard
                title="Open Cases"
                value={openCasesCount}
                subtitle={`${cases.length} Total Cases`}
                color="var(--color-warning)"
              />
              <MetricCard
                title="Scheduled Ingest Jobs"
                value={enabledJobs.length}
                subtitle={lastIngestLabel}
                color="var(--color-success)"
              />
            </div>

            {/* Signature Element: Core Orbit Node Visualization */}
            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <h3 style={{ marginBottom: '0.5rem', alignSelf: 'flex-start' }}>
                System Telemetry Orbit (Live Node Graph)
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', alignSelf: 'flex-start', marginBottom: '2rem' }}>
                Central point visualization of registered connectors feeding telemetry into Shieldgrid Core.
              </p>

              {/* Orbit Canvas */}
              <div
                style={{
                  position: 'relative',
                  width: '320px',
                  height: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Outer Ring */}
                <div
                  style={{
                    position: 'absolute',
                    width: '260px',
                    height: '260px',
                    borderRadius: '50%',
                    border: '1px dashed var(--color-border)',
                  }}
                />

                {/* Central Shieldgrid Core Node */}
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--color-bg-base)',
                    border: '2px solid var(--color-accent)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    boxShadow: '0 0 20px color-mix(in srgb, var(--color-accent) 30%, transparent)',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    CORE
                  </span>
                </div>

                {/* Connector Nodes in Orbit */}
                {(health?.connectors ?? []).map((conn, idx, arr) => {
                  const total = arr.length || 1;
                  const angle = (idx * (360 / total) - 90) * (Math.PI / 180);
                  const radius = 130;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  const statusColors = {
                    healthy: 'var(--color-success)',
                    degraded: 'var(--color-warning)',
                    down: 'var(--color-critical)',
                  };
                  const color = statusColors[conn.status] || 'var(--color-text-secondary)';

                  return (
                    <React.Fragment key={conn.id}>
                      {/* Connecting Beam */}
                      <svg
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                        }}
                      >
                        <line
                          x1="160"
                          y1="160"
                          x2={160 + x}
                          y2={160 + y}
                          stroke={color}
                          strokeWidth="1.5"
                          strokeDasharray={conn.status === 'down' ? '4,4' : 'none'}
                          opacity="0.6"
                        />
                      </svg>

                      {/* Node Bubble */}
                      <div
                        style={{
                          position: 'absolute',
                          transform: `translate(${x}px, ${y}px)`,
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: 'var(--color-bg-base)',
                          border: `2px solid ${color}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 20,
                          cursor: 'pointer',
                          boxShadow: `0 0 12px color-mix(in srgb, ${color} 40%, transparent)`,
                        }}
                        title={`${conn.id}: ${conn.status}${conn.reason ? ` (${conn.reason})` : ''}`}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                          {conn.id}
                        </span>
                        <span style={{ fontSize: '0.6rem', color, fontWeight: 600 }}>
                          {conn.status}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Connector Health Table */}
            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ marginBottom: '1rem' }}>Connector Status Detail</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {health?.connectors.map((conn) => (
                  <div
                    key={conn.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <strong style={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>{conn.id} Connector</strong>
                      {conn.reason && (
                        <p style={{ color: 'var(--color-critical)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                          Reason: {conn.reason}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#0B1B33',
                        background:
                          conn.status === 'healthy'
                            ? 'var(--color-success)'
                            : conn.status === 'degraded'
                            ? 'var(--color-warning)'
                            : 'var(--color-critical)',
                      }}
                    >
                      {conn.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function MetricCard({ title, value, subtitle, color }: { title: string; value: number; subtitle: string; color: string }) {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>{title}</p>
      <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color, margin: '0.25rem 0' }}>{value}</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: 0 }}>{subtitle}</p>
    </div>
  );
}

function relativeTime(timestampMs: number): string {
  const seconds = Math.max(1, Math.floor((Date.now() - timestampMs) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
