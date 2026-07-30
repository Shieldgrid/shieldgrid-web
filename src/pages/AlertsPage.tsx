import { useEffect, useState, useMemo, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { fetchAlerts } from '../lib/api';
import type { NormalizedAlert, Severity } from '../lib/types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { EmptyState } from '../components/EmptyState';

export default function AlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [connectorFilter, setConnectorFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<NormalizedAlert | null>(null);

  const loadAlerts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlerts(token);
      setAlerts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Derived filter options
  const connectors = useMemo(() => {
    return Array.from(new Set(alerts.map((a) => a.connector_id)));
  }, [alerts]);

  // Client-side filtering
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (connectorFilter !== 'all' && alert.connector_id !== connectorFilter) return false;
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
      return true;
    });
  }, [alerts, connectorFilter, severityFilter, statusFilter]);

  const getSeverityBadgeColor = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return 'var(--color-critical)';
      case 'high':
        return 'var(--color-warning)';
      case 'medium':
        return '#FBBF24';
      case 'low':
        return 'var(--color-text-secondary)';
      default:
        return 'var(--color-accent)';
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Security Alert Queue</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Normalized alert stream from all connected SIEM & endpoint security sensors.
            </p>
          </div>
          <button
            onClick={loadAlerts}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh Alerts
          </button>
        </div>

        {error && <ErrorDisplay message={error} onRetry={loadAlerts} />}

        {/* Filter Controls */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            background: 'var(--color-bg-surface)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              Connector
            </label>
            <select
              value={connectorFilter}
              onChange={(e) => setConnectorFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Connectors</option>
              {connectors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton count={5} height="4.5rem" />
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            title="No Alerts Found"
            description="There are currently no alerts matching your filter criteria. Relax — or widen your filter settings."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedAlert ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
            {/* Alert List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredAlerts.map((alert) => {
                const isSelected = selectedAlert?.id === alert.id;
                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
                      border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'border 150ms ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: '#0B1B33',
                            background: getSeverityBadgeColor(alert.severity),
                          }}
                        >
                          {alert.severity}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {/* UNTRUSTED INPUT: Rendered strictly as text node */}
                          {alert.source}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        Connector: <strong style={{ color: 'var(--color-text-primary)' }}>{alert.connector_id}</strong> &bull; {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {alert.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alert Detail Drawer / Side Panel */}
            {selectedAlert && (
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'sticky',
                  top: '1rem',
                  height: 'fit-content',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3>Alert Details</h3>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
                  >
                    ×
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ALERT ID</div>
                  <code style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>{selectedAlert.id}</code>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>SOURCE</div>
                    {/* SECURITY: Plain text node */}
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{selectedAlert.source}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CONNECTOR</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{selectedAlert.connector_id}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                    RAW PAYLOAD (UNTRUSTED SENSOR INPUT)
                  </div>
                  {/* SECURITY REQUIREMENT (Ticket 6): Rendered as plain text pre tag, NEVER dangerouslySetInnerHTML */}
                  <pre
                    style={{
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                      overflowX: 'auto',
                      maxHeight: '240px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {JSON.stringify(selectedAlert.raw_payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  minWidth: '140px',
};
