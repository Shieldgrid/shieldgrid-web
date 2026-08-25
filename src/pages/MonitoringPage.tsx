import { useState, useEffect } from 'react';
import { fetchSystemHealth, fetchPerformanceDashboard } from '../lib/api';
import type { SystemHealth, PerformanceDashboard } from '../lib/types';

export default function MonitoringPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [dashboard, setDashboard] = useState<PerformanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [healthData, dashboardData] = await Promise.all([fetchSystemHealth(), fetchPerformanceDashboard()]);
      setHealth(healthData);
      setDashboard(dashboardData);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  if (loading) return <div className="p-8 text-[var(--sys-text-secondary)]">Loading monitoring data...</div>;

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-900/30';
      case 'degraded': return 'text-yellow-400 bg-yellow-900/30';
      case 'down': case 'unhealthy': return 'text-red-400 bg-red-900/30';
      default: return 'text-[var(--sys-text-secondary)] bg-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">System Monitoring</h1>
        <button onClick={loadData} className="px-4 py-2 bg-gray-700 text-[var(--sys-text-primary)] rounded hover:bg-gray-600">Refresh</button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300">{error}</div>}

      {/* System Health Overview */}
      {health && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--sys-text-primary)] mb-4">System Health</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(health.status)}`}>
                {health.status.toUpperCase()}
              </span>
              <span className="text-[var(--sys-text-secondary)] text-sm">Last checked: {new Date(health.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {health.connectors.map((c) => (
              <div key={c.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--sys-text-primary)] font-medium">{c.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${statusColor(c.status)}`}>{c.status}</span>
                </div>
                {c.response_time_ms !== undefined && (
                  <div className="text-sm text-[var(--sys-text-secondary)]">Response: {c.response_time_ms}ms</div>
                )}
                {c.details && <div className="text-sm text-red-400 mt-1">{c.details}</div>}
              </div>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-[var(--sys-text-secondary)]">Database: <span className={statusColor(health.database.status)}>{health.database.status}</span></div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {dashboard && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--sys-text-primary)] mb-4">Performance Metrics</h2>

          {/* Ingestion Rate */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{dashboard.ingestion_rate.alerts_per_minute.toFixed(1)}</div>
              <div className="text-sm text-[var(--sys-text-secondary)] mt-1">Alerts/min</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{dashboard.ingestion_rate.alerts_per_hour.toFixed(0)}</div>
              <div className="text-sm text-[var(--sys-text-secondary)] mt-1">Alerts/hour</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{dashboard.ingestion_rate.alerts_per_day.toFixed(0)}</div>
              <div className="text-sm text-[var(--sys-text-secondary)] mt-1">Alerts/24h</div>
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Critical', value: dashboard.severity_distribution.critical, color: 'text-red-400' },
              { label: 'High', value: dashboard.severity_distribution.high, color: 'text-orange-400' },
              { label: 'Medium', value: dashboard.severity_distribution.medium, color: 'text-yellow-400' },
              { label: 'Low', value: dashboard.severity_distribution.low, color: 'text-blue-400' },
              { label: 'Info', value: dashboard.severity_distribution.info, color: 'text-[var(--sys-text-secondary)]' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-[var(--sys-text-secondary)] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Top Sources */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-[var(--sys-text-primary)] font-semibold mb-3">Top Alert Sources (24h)</h3>
            <div className="space-y-2">
              {dashboard.top_alert_sources.map((s) => (
                <div key={s.source} className="flex items-center justify-between">
                  <span className="text-gray-300">{s.source}</span>
                  <span className="text-blue-400 font-medium">{s.count}</span>
                </div>
              ))}
              {dashboard.top_alert_sources.length === 0 && <div className="text-[var(--sys-text-muted)] text-sm">No alert sources in last 24h</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
