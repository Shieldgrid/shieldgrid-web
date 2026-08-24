import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';
import type { VqlClient } from '../lib/types';
import { Search, Monitor, Wifi, WifiOff, Server, RefreshCw } from 'lucide-react';

interface WazuhAgent {
  id: string;
  name: string;
  ip?: string | null;
  status?: string | null;
  os_name?: string | null;
  os_version?: string | null;
  version?: string | null;
  last_seen?: string | null;
  groups?: string[];
}

type AgentSource = 'all' | 'wazuh' | 'velociraptor';

export default function AgentsPage() {
  const [wazuhAgents, setWazuhAgents] = useState<WazuhAgent[]>([]);
  const [veloClients, setVeloClients] = useState<VqlClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AgentSource>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadAgents(); }, []);

  async function loadAgents() {
    setLoading(true);
    try {
      const wazuhP = fetch(`${API_BASE_URL}/api/v1/wazuh/agents`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { agents: [] })
        .catch(() => ({ agents: [] }));

      const veloP = fetch(`${API_BASE_URL}/api/v1/velociraptor/clients`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { rows: [] })
        .catch(() => ({ rows: [] }));

      const [wazuhRes, veloRes] = await Promise.all([wazuhP, veloP]);
      setWazuhAgents(wazuhRes.agents || []);
      setVeloClients(veloRes.rows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const allAgents = [
    ...wazuhAgents.map(a => ({
      id: a.id,
      name: a.name,
      ip: a.ip,
      status: a.status || 'unknown',
      os: a.os_name || 'Unknown',
      version: a.version || '',
      lastSeen: a.last_seen || '',
      source: 'wazuh' as const,
      groups: a.groups || [],
    })),
    ...veloClients.map(c => ({
      id: c.client_id,
      name: c.hostname || c.client_id,
      ip: null,
      status: 'active',
      os: c.os || 'Unknown',
      version: c.client_version || '',
      lastSeen: c.last_seen_at ? new Date(c.last_seen_at * 1000).toISOString() : '',
      source: 'velociraptor' as const,
      groups: [],
    })),
  ];

  const filtered = allAgents.filter(a => {
    if (filter !== 'all' && a.source !== filter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const wazuhActive = wazuhAgents.filter(a => a.status === 'active').length;
  const wazuhDisconnected = wazuhAgents.filter(a => a.status === 'disconnected').length;
  const veloActive = veloClients.length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#333340]">
        <div className="flex items-center gap-3">
          <Server size={14} className="text-gray-500" />
          <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">Agent Management</span>
          <span className="text-xs text-gray-500 font-mono">{allAgents.length} registered</span>
        </div>
        <button
          onClick={loadAgents}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-gray-400 bg-[#1E1E24] border border-[#333340] rounded-sm hover:bg-[#2a2a32] transition-colors"
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          REFRESH
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 px-5 py-2.5 border-b border-[#333340] bg-[#18181c]">
        <div className="flex items-center gap-2">
          <Wifi size={10} className="text-emerald-500" />
          <span className="text-xs font-mono text-gray-300">{wazuhActive}</span>
          <span className="text-[10px] text-gray-500 uppercase">Wazuh Active</span>
        </div>
        <div className="w-px h-3 bg-[#333340]" />
        <div className="flex items-center gap-2">
          <WifiOff size={10} className="text-red-500" />
          <span className="text-xs font-mono text-gray-300">{wazuhDisconnected}</span>
          <span className="text-[10px] text-gray-500 uppercase">Disconnected</span>
        </div>
        <div className="w-px h-3 bg-[#333340]" />
        <div className="flex items-center gap-2">
          <Monitor size={10} className="text-slate-400" />
          <span className="text-xs font-mono text-gray-300">{veloActive}</span>
          <span className="text-[10px] text-gray-500 uppercase">Velociraptor</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[#333340]">
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Source</span>
        <div className="flex gap-1">
          {(['all', 'wazuh', 'velociraptor'] as AgentSource[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors ${
                filter === s
                  ? 'bg-slate-600 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#1E1E24]'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="w-px h-3 bg-[#333340]" />
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1E1E24] border border-[#333340] rounded-sm px-2 py-1 text-[11px] font-mono text-gray-300 focus:outline-none"
        >
          <option value="all">ALL</option>
          <option value="active">ACTIVE</option>
          <option value="disconnected">DISCONNECTED</option>
          <option value="pending">PENDING</option>
        </select>
        <div className="w-px h-3 bg-[#333340]" />
        <div className="flex items-center gap-1.5 flex-1">
          <Search size={10} className="text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="bg-transparent text-[11px] font-mono text-gray-300 placeholder-gray-600 focus:outline-none flex-1"
          />
        </div>
        <span className="text-[10px] font-mono text-gray-600">
          {filtered.length} / {allAgents.length}
        </span>
      </div>

      {/* Agent Table */}
      <div>
        <table className="w-full">
          <thead className="sticky top-0 bg-[#18181c] border-b border-[#333340]">
            <tr>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Agent</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">IP</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">OS</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Version</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252530]">
            {filtered.map((a) => (
              <tr key={`${a.source}-${a.id}`} className="hover:bg-[#1a1a22] transition-colors">
                <td className="px-5 py-2">
                  <div className="text-[12px] font-mono text-gray-200">{a.name}</div>
                  <div className="text-[10px] font-mono text-gray-600">{a.id}</div>
                </td>
                <td className="px-5 py-2 text-[11px] font-mono text-gray-400">
                  {a.ip || '--'}
                </td>
                <td className="px-5 py-2">
                  <div className="text-[11px] font-mono text-gray-300">{a.os}</div>
                  {a.os !== 'Unknown' && (
                    <div className="text-[10px] font-mono text-gray-600">{a.version}</div>
                  )}
                </td>
                <td className="px-5 py-2 text-[10px] font-mono text-gray-500">
                  {a.version || '--'}
                </td>
                <td className="px-5 py-2">
                  <span className={`text-[10px] font-medium uppercase ${
                    a.source === 'wazuh' ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {a.source}
                  </span>
                </td>
                <td className="px-5 py-2">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-5 py-2 text-[10px] font-mono text-gray-500">
                  {a.lastSeen ? new Date(a.lastSeen).toLocaleString() : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="flex items-center justify-center py-12 text-[11px] text-gray-600 font-mono">
            NO AGENTS MATCH CURRENT FILTERS
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-12 text-[11px] text-gray-600 font-mono">
            LOADING AGENTS...
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'text-emerald-500',
    disconnected: 'text-red-500',
    pending: 'text-amber-500',
    never_connected: 'text-gray-500',
  };
  const labels: Record<string, string> = {
    active: 'ACTIVE',
    disconnected: 'OFFLINE',
    pending: 'PENDING',
    never_connected: 'NEVER',
  };
  return (
    <span className={`text-[10px] font-mono font-medium ${colors[status] || 'text-gray-500'}`}>
      {labels[status] || status?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
    </span>
  );
}
