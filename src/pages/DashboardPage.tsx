import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { fetchHealth, fetchAlerts, fetchCases, fetchJobs, fetchSecurityPostureSummary } from '../lib/api';
import type { HealthResponse, NormalizedAlert, Case, IngestJob, SecurityPostureSummary } from '../lib/types';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SOC Operations Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time status of your security infrastructure</p>
        </div>
        <button onClick={loadData} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-20 mb-3"></div>
              <div className="h-8 bg-slate-700 rounded w-16 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Alerts"
              value={alerts.length}
              subtitle={`${criticalAlerts} critical · ${highAlerts} high`}
              color={criticalAlerts > 0 ? '#E71D36' : '#4FD1FF'}
              icon="⚡"
              onClick={() => navigate('/alerts')}
            />
            <MetricCard
              title="Open Cases"
              value={openCases}
              subtitle={`${cases.length} total cases`}
              color="#FF9F1C"
              icon="📁"
              onClick={() => navigate('/cases')}
            />
            <MetricCard
              title="Connectors"
              value={`${healthyConnectors}/${totalConnectors}`}
              subtitle="Healthy / Total"
              color="#22D3A5"
              icon="🔌"
              onClick={() => navigate('/connectors')}
            />
            <MetricCard
              title="Ingest Jobs"
              value={jobs.filter(j => j.enabled).length}
              subtitle={`${jobs.length} total configured`}
              color="#4FD1FF"
              icon="🔄"
              onClick={() => navigate('/scheduler')}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <QuickAction icon="🎯" label="AI Triage" color="#4FD1FF" onClick={() => navigate('/ai')} />
              <QuickAction icon="🔍" label="Threat Intel" color="#818CF8" onClick={() => navigate('/threat-intel')} />
              <QuickAction icon="🛡️" label="Response Actions" color="#22D3A5" onClick={() => navigate('/actions')} />
              <QuickAction icon="📋" label="Detection Rules" color="#FF9F1C" onClick={() => navigate('/rules')} />
              <QuickAction icon="🗺️" label="MITRE Matrix" color="#F472B6" onClick={() => navigate('/mitre')} />
              <QuickAction icon="📊" label="Monitoring" color="#22D3A5" onClick={() => navigate('/monitoring')} />
              <QuickAction icon="🤖" label="AI Chat" color="#C084FC" onClick={() => navigate('/ai-chat')} />
              <QuickAction icon="👥" label="Agents" color="#38BDF8" onClick={() => navigate('/agents')} />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Alerts */}
            <div className="lg:col-span-2 bg-[#132B4D] border border-[#1E3A5F] rounded-xl">
              <div className="flex items-center justify-between p-5 border-b border-[#1E3A5F]">
                <h3 className="text-white font-semibold">Recent Alerts</h3>
                <button onClick={() => navigate('/alerts')} className="text-[#4FD1FF] text-sm hover:underline">View All</button>
              </div>
              <div className="divide-y divide-[#1E3A5F]">
                {alerts.slice(0, 8).map(alert => (
                  <div key={alert.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#1A3560] transition-colors">
                    <div className="flex items-center gap-3">
                      <SeverityBadge severity={alert.severity} />
                      <div>
                        <div className="text-white text-sm font-medium">{alert.source_id}</div>
                        <div className="text-slate-400 text-xs">{alert.connector_id} · {alert.source}</div>
                      </div>
                    </div>
                    <div className="text-slate-500 text-xs">{new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="px-5 py-8 text-center text-slate-500">No alerts</div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Security Posture */}
              {posture && (
                <div className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4">Security Posture</h3>
                  <div className="space-y-3">
                    <PostureRow label="Open Alerts" value={posture.open_alerts_count} color="#4FD1FF" />
                    <PostureRow label="Critical" value={posture.critical_alerts_count} color="#E71D36" />
                    <PostureRow label="Active Cases" value={posture.active_cases_count} color="#FF9F1C" />
                    <PostureRow label="Actions Executed" value={posture.executed_actions_count} color="#22D3A5" />
                    <PostureRow label="High Risk IOCs" value={posture.high_risk_iocs_cached} color="#C084FC" />
                  </div>
                  {posture.top_threat_summary && (
                    <div className="mt-4 p-3 bg-[#0B1B33] rounded-lg">
                      <p className="text-slate-400 text-xs">{posture.top_threat_summary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Open Cases */}
              <div className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl">
                <div className="flex items-center justify-between p-5 border-b border-[#1E3A5F]">
                  <h3 className="text-white font-semibold">Open Cases</h3>
                  <button onClick={() => navigate('/cases')} className="text-[#4FD1FF] text-sm hover:underline">View All</button>
                </div>
                <div className="divide-y divide-[#1E3A5F]">
                  {cases.filter(c => c.status.toLowerCase() === 'open').slice(0, 5).map(c => (
                    <div key={c.id} className="px-5 py-3 hover:bg-[#1A3560] transition-colors cursor-pointer" onClick={() => navigate(`/cases/${c.id}`)}>
                      <div className="text-white text-sm font-medium">{c.title}</div>
                      <div className="text-slate-500 text-xs mt-1">{new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {cases.filter(c => c.status.toLowerCase() === 'open').length === 0 && (
                    <div className="px-5 py-6 text-center text-slate-500 text-sm">No open cases</div>
                  )}
                </div>
              </div>

              {/* Connector Health */}
              <div className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Connectors</h3>
                <div className="space-y-2">
                  {health?.connectors.map(conn => (
                    <div key={conn.id} className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm capitalize">{conn.id}</span>
                      <StatusDot status={conn.status} />
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

function MetricCard({ title, value, subtitle, color, icon, onClick }: {
  title: string; value: string | number; subtitle: string; color: string; icon: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl p-5 text-left hover:border-[#4FD1FF]/30 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-slate-500 text-xs mt-1">{subtitle}</div>
    </button>
  );
}

function QuickAction({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:scale-105" style={{ borderColor: color + '40', background: color + '10', color }}>
      <span>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-blue-500/20 text-blue-400',
    info: 'bg-slate-500/20 text-slate-400',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'healthy' ? 'bg-green-400' : status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-slate-400 text-xs capitalize">{status}</span>
    </div>
  );
}

function PostureRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}
