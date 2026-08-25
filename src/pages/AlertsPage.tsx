import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { fetchAlerts, updateAlertStatus } from '../lib/api';
import type { NormalizedAlert, AlertStatus } from '../lib/types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { EmptyState } from '../components/EmptyState';
import { RefreshCw, X, Filter } from 'lucide-react';

export default function AlertsPage() {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [connectorFilter, setConnectorFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<NormalizedAlert | null>(null);

  const loadAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const changeStatus = useCallback(async (alert: NormalizedAlert, status: AlertStatus) => {
    try {
      const updated = await updateAlertStatus(alert.id, status);
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelectedAlert(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update alert status');
    }
  }, []);

  const connectors = useMemo(() => Array.from(new Set(alerts.map((a) => a.connector_id))), [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (connectorFilter !== 'all' && alert.connector_id !== connectorFilter) return false;
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
      return true;
    });
  }, [alerts, connectorFilter, severityFilter, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sys-text-primary)', margin: 0 }}>Security Alert Queue</h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', margin: '0.25rem 0 0' }}>
            NORMALIZED ALERT STREAM // ALL CONNECTED SENSORS
          </p>
        </div>
        <button onClick={loadAlerts} className="btn" style={{ fontFamily: 'var(--font-mono)' }}>
          <RefreshCw size={12} /> REFRESH
        </button>
      </div>

      {error && <ErrorDisplay message={error} onRetry={loadAlerts} />}

      {/* Filter Controls */}
      <div className="panel" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--sys-text-muted)' }}>
          <Filter size={12} />
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>FILTERS</span>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.125rem' }}>CONNECTOR</label>
          <select value={connectorFilter} onChange={(e) => setConnectorFilter(e.target.value)} className="input" style={{ minWidth: '120px' }}>
            <option value="all">ALL</option>
            {connectors.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.125rem' }}>SEVERITY</label>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="input" style={{ minWidth: '120px' }}>
            <option value="all">ALL</option>
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
            <option value="info">INFO</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.125rem' }}>STATUS</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input" style={{ minWidth: '120px' }}>
            <option value="all">ALL</option>
            <option value="open">OPEN</option>
            <option value="acknowledged">ACKNOWLEDGED</option>
            <option value="closed">CLOSED</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-muted)' }}>
          {filteredAlerts.length} / {alerts.length} RECORDS
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton count={5} height="3rem" />
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          title="No Alerts Found"
          description="No alerts match current filter criteria."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedAlert ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
          {/* Alert List */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SEV</th>
                  <th>SOURCE</th>
                  <th>CONNECTOR</th>
                  <th>STATUS</th>
                  <th>TIME</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => {
                  const isSelected = selectedAlert?.id === alert.id;
                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(107,123,153,0.1)' : undefined,
                      }}
                    >
                      <td><SeverityBadge severity={alert.severity} /></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{alert.source}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--sys-text-secondary)' }}>{alert.connector_id}</td>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: alert.status === 'open' ? 'var(--color-warning)' : 'var(--sys-text-muted)', textTransform: 'uppercase' }}>
                          {alert.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--sys-text-muted)' }}>
                        {new Date(alert.timestamp).toLocaleString('en-US', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Alert Detail Panel */}
          {selectedAlert && (
            <div className="panel" style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--sys-border)' }}>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-muted)', textTransform: 'uppercase' }}>ALERT DETAIL</span>
                <button onClick={() => setSelectedAlert(null)} style={{ background: 'none', border: 'none', color: 'var(--sys-text-muted)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <FieldBlock label="ALERT ID" value={selectedAlert.id} mono />
                <FieldBlock label="SEVERITY" value={selectedAlert.severity.toUpperCase()} />
                <FieldBlock label="SOURCE" value={selectedAlert.source} />
                <FieldBlock label="CONNECTOR" value={selectedAlert.connector_id} />
              </div>

              <div>
                <label style={{ fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '0.125rem' }}>STATUS</label>
                <select
                  value={selectedAlert.status}
                  onChange={(e) => changeStatus(selectedAlert, e.target.value as AlertStatus)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="open">OPEN</option>
                  <option value="acknowledged">ACKNOWLEDGED</option>
                  <option value="closed">CLOSED</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '0.25rem' }}>RAW PAYLOAD</label>
                <pre style={{
                  background: 'var(--sys-bg-base)', border: '1px solid var(--sys-border)',
                  padding: '0.5rem', borderRadius: '2px',
                  fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                  color: 'var(--sys-text-secondary)', overflowX: 'auto', maxHeight: '300px',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0,
                }}>
                  {JSON.stringify(selectedAlert.raw_payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls: Record<string, string> = {
    critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium',
    low: 'badge-low', info: 'badge-info',
  };
  return <span className={`badge ${cls[severity] || 'badge-info'}`}>{severity.toUpperCase().slice(0, 4)}</span>;
}

function FieldBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.125rem' }}>{label}</div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--sys-text-primary)', fontFamily: mono ? 'var(--font-mono)' : undefined, wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}
