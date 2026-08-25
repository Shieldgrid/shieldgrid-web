import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { fetchHealth, fetchAlerts, fetchCases, fetchJobs, fetchSecurityPostureSummary } from '../lib/api';
import type { HealthResponse, NormalizedAlert, Case, IngestJob, SecurityPostureSummary } from '../lib/types';
import {
  Crosshair, Search, Shield,
  Map, Activity, Brain, Users, RefreshCw, ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [jobs, setJobs] = useState<IngestJob[]>([]);
  const [posture, setPosture] = useState<SecurityPostureSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [hRes, aRes, cRes, jRes, pRes] = await Promise.all([
        fetchHealth(),
        fetchAlerts().catch(() => []),
        fetchCases().catch(() => []),
        fetchJobs().catch(() => []),
        fetchSecurityPostureSummary().catch(() => null),
      ]);
      setHealth(hRes);
      setAlerts(aRes);
      setCases(cRes);
      setJobs(jRes);
      setPosture(pRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCases = cases.filter(c => c.status.toLowerCase() === 'open').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;
  const healthyConnectors = health?.connectors.filter(c => c.status === 'healthy').length ?? 0;
  const totalConnectors = health?.connectors.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sys-text-primary)', margin: 0 }}>
            SOC Operations Overview
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', margin: '0.25rem 0 0' }}>
            SYSTEM STATUS // REAL-TIME INFRASTRUCTURE MONITORING
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.625rem', background: 'var(--sys-bg-surface)',
            border: '1px solid var(--sys-border)', borderRadius: '2px',
            color: 'var(--sys-text-secondary)', fontSize: '0.75rem', cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <RefreshCw size={12} /> REFRESH
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: 'var(--sys-bg-surface)', border: '1px solid var(--sys-border)', borderRadius: '2px', padding: '0.75rem', opacity: 0.5 }}>
              <div style={{ height: '10px', background: 'var(--sys-bg-elevated)', borderRadius: '2px', width: '60px', marginBottom: '0.5rem' }} />
              <div style={{ height: '20px', background: 'var(--sys-bg-elevated)', borderRadius: '2px', width: '40px' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <MetricCard
              title="ALERTS"
              value={alerts.length}
              subtitle={`${criticalAlerts} critical | ${highAlerts} high`}
              accentColor={criticalAlerts > 0 ? 'var(--color-critical)' : 'var(--color-accent)'}
              onClick={() => navigate('/alerts')}
            />
            <MetricCard
              title="CASES"
              value={openCases}
              subtitle={`${cases.length} total | ${openCases} open`}
              accentColor="var(--color-warning)"
              onClick={() => navigate('/cases')}
            />
            <MetricCard
              title="CONNECTORS"
              value={`${healthyConnectors}/${totalConnectors}`}
              subtitle="healthy / total"
              accentColor={healthyConnectors === totalConnectors ? 'var(--color-success)' : 'var(--color-critical)'}
              onClick={() => navigate('/connectors')}
            />
            <MetricCard
              title="INGEST JOBS"
              value={jobs.filter(j => j.enabled).length}
              subtitle={`${jobs.length} configured`}
              accentColor="var(--color-accent)"
              onClick={() => navigate('/scheduler')}
            />
          </div>

          {/* Quick Actions */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">QUICK ACTIONS</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              <QuickAction label="AI Triage" icon={Brain} onClick={() => navigate('/ai')} />
              <QuickAction label="Threat Intel" icon={Search} onClick={() => navigate('/threat-intel')} />
              <QuickAction label="Response" icon={Shield} onClick={() => navigate('/actions')} />
              <QuickAction label="Rules" icon={Crosshair} onClick={() => navigate('/rules')} />
              <QuickAction label="MITRE" icon={Map} onClick={() => navigate('/mitre')} />
              <QuickAction label="Monitoring" icon={Activity} onClick={() => navigate('/monitoring')} />
              <QuickAction label="Agents" icon={Users} onClick={() => navigate('/agents')} />
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            {/* Recent Alerts */}
            <div className="panel" style={{ padding: 0 }}>
              <div className="panel-header" style={{ padding: '0.5rem 0.75rem' }}>
                <span className="panel-title">RECENT ALERTS</span>
                <button
                  onClick={() => navigate('/alerts')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  VIEW ALL <ChevronRight size={10} />
                </button>
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>SEVERITY</th>
                      <th>SOURCE</th>
                      <th>CONNECTOR</th>
                      <th>TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.slice(0, 8).map(alert => (
                      <tr key={alert.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/alerts')}>
                        <td><SeverityBadge severity={alert.severity} /></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{alert.source}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--sys-text-secondary)' }}>{alert.connector_id}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--sys-text-muted)' }}>
                          {new Date(alert.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                        </td>
                      </tr>
                    ))}
                    {alerts.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--sys-text-muted)', padding: '1.5rem' }}>NO ALERTS</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Security Posture */}
              {posture && (
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">SECURITY POSTURE</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <PostureRow label="Open Alerts" value={posture.open_alerts_count} />
                    <PostureRow label="Critical" value={posture.critical_alerts_count} accent="var(--color-critical)" />
                    <PostureRow label="Active Cases" value={posture.active_cases_count} />
                    <PostureRow label="Actions Executed" value={posture.executed_actions_count} accent="var(--color-success)" />
                    <PostureRow label="High Risk IOCs" value={posture.high_risk_iocs_cached} accent="var(--color-warning)" />
                  </div>
                  {posture.top_threat_summary && (
                    <div style={{ marginTop: '0.5rem', padding: '0.375rem 0.5rem', background: 'var(--sys-bg-base)', border: '1px solid var(--sys-border)', borderRadius: '2px' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--sys-text-secondary)', fontFamily: 'var(--font-mono)', margin: 0 }}>{posture.top_threat_summary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Open Cases */}
              <div className="panel" style={{ padding: 0 }}>
                <div className="panel-header" style={{ padding: '0.5rem 0.75rem' }}>
                  <span className="panel-title">OPEN CASES</span>
                  <button
                    onClick={() => navigate('/cases')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    VIEW ALL <ChevronRight size={10} />
                  </button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {cases.filter(c => c.status.toLowerCase() === 'open').slice(0, 5).map(c => (
                    <div
                      key={c.id}
                      style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--sys-bg-elevated)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107,123,153,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--sys-text-primary)' }}>{c.title}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.125rem' }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <ChevronRight size={12} style={{ color: 'var(--sys-text-muted)' }} />
                    </div>
                  ))}
                  {cases.filter(c => c.status.toLowerCase() === 'open').length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--sys-text-muted)', fontSize: '0.75rem' }}>NO OPEN CASES</div>
                  )}
                </div>
              </div>

              {/* Connector Health */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">CONNECTOR HEALTH</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {health?.connectors.map(conn => (
                    <div key={conn.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                      <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-primary)', textTransform: 'uppercase' }}>{conn.id}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className={`status-dot ${conn.status === 'healthy' ? 'ok' : conn.status === 'degraded' ? 'warn' : 'error'}`} />
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-secondary)' }}>{conn.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, subtitle, accentColor, onClick }: {
  title: string; value: string | number; subtitle: string; accentColor: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--sys-bg-surface)', border: '1px solid var(--sys-border)', borderRadius: '2px',
        padding: '0.625rem 0.75rem', textAlign: 'left', cursor: 'pointer',
        transition: 'border-color 100ms',
        display: 'flex', flexDirection: 'column', gap: '0.25rem',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--sys-border)'; }}
    >
      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </span>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: accentColor, lineHeight: 1 }}>
        {value}
      </div>
      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-muted)' }}>
        {subtitle}
      </span>
    </button>
  );
}

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.375rem 0.625rem', background: 'transparent',
        border: '1px solid var(--sys-border)', borderRadius: '2px',
        color: 'var(--sys-text-secondary)', fontSize: '0.75rem', cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        transition: 'border-color 100ms, color 100ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--sys-text-primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--sys-border)'; e.currentTarget.style.color = 'var(--sys-text-secondary)'; }}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls: Record<string, string> = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    info: 'badge-info',
  };
  return <span className={`badge ${cls[severity] || 'badge-info'}`}>{severity.toUpperCase()}</span>;
}

function PostureRow({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.125rem 0' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--sys-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: accent || 'var(--sys-text-primary)' }}>{value}</span>
    </div>
  );
}
