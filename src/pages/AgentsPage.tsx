import { useState, useEffect } from 'react';
import { fetchVeloClients } from '../lib/api';
import type { VqlClient } from '../lib/types';

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
  void loading;
  const [filter, setFilter] = useState<AgentSource>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadAgents(); }, []);

  async function loadAgents() {
    try {
      const [wazuhRes, veloRes] = await Promise.all([
        fetch('/api/v1/wazuh/agents', { credentials: 'include' })
          .then(r => r.ok ? r.json() : { agents: [] })
          .catch(() => ({ agents: [] })),
        fetchVeloClients().catch(() => ({ rows: [] })),
      ]);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Management</h1>
        <p className="text-slate-400 text-sm mt-1">Unified view of all endpoints across Wazuh and Velociraptor</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#22D3A5]">{wazuhActive}</div>
          <div className="text-sm text-slate-400">Wazuh Active</div>
        </div>
        <div className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#E71D36]">{wazuhDisconnected}</div>
          <div className="text-sm text-slate-400">Wazuh Disconnected</div>
        </div>
        <div className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#4FD1FF]">{veloActive}</div>
          <div className="text-sm text-slate-400">Velociraptor Clients</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          {(['all', 'wazuh', 'velociraptor'] as AgentSource[]).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-[#4FD1FF] text-[#0B1B33]' : 'bg-[#132B4D] text-slate-300 border border-[#1E3A5F] hover:border-[#4FD1FF]/30'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#132B4D] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-sm text-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="disconnected">Disconnected</option>
          <option value="pending">Pending</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents..."
          className="bg-[#132B4D] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4FD1FF] flex-1" />
      </div>

      {/* Agent Table */}
      <div className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0B1B33]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Agent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">OS</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E3A5F]">
            {filtered.map((a) => (
              <tr key={`${a.source}-${a.id}`} className="hover:bg-[#1A3560] transition-colors">
                <td className="px-4 py-3">
                  <div className="text-white text-sm font-medium">{a.name}</div>
                  <div className="text-slate-500 text-xs">{a.id}</div>
                </td>
                <td className="px-4 py-3 text-slate-300 text-sm">{a.os}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    a.source === 'wazuh' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {a.source}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">
                  {a.lastSeen ? new Date(a.lastSeen).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">No agents found</div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    disconnected: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    never_connected: 'bg-slate-500/20 text-slate-400',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-slate-500/20 text-slate-400'}`}>
      {status?.replace('_', ' ') || 'unknown'}
    </span>
  );
}
