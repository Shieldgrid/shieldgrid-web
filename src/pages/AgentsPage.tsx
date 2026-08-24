import { useState, useEffect } from 'react';
import { fetchUnifiedAgents, syncUnifiedAgents } from '../lib/api';
import type { UnifiedAgent } from '../lib/api';
import { Search, Monitor, Wifi, WifiOff, Server, RefreshCw, Zap } from 'lucide-react';

type AgentSource = 'all' | 'wazuh' | 'velociraptor';

export default function AgentsPage() {
  const [agents, setAgents] = useState<UnifiedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<AgentSource>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchUnifiedAgents();
        if (cancelled) return;
        setAgents(res.agents || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load agents');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleSyncAgents() {
    setSyncing(true);
    try {
      await syncUnifiedAgents();
      const res = await fetchUnifiedAgents();
      setAgents(res.agents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  }

  const filtered = agents.filter(a => {
    if (filter === 'wazuh' && !a.wazuh_id) return false;
    if (filter === 'velociraptor' && !a.velo_id) return false;
    
    if (statusFilter === 'active' && a.wazuh_status !== 'active' && a.velo_status !== 'active') return false;
    if (statusFilter === 'disconnected' && a.wazuh_status !== 'disconnected' && a.wazuh_status !== 'never_connected') return false;
    
    if (search) {
      const q = search.toLowerCase();
      if (!(a.hostname || '').toLowerCase().includes(q) && !(a.wazuh_ip || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const wazuhActive = agents.filter(a => a.wazuh_status === 'active').length;
  const wazuhDisconnected = agents.filter(a => a.wazuh_status === 'disconnected' || a.wazuh_status === 'never_connected').length;
  const veloActive = agents.filter(a => a.velo_status === 'active').length;

  if (error) {
    return (
      <div className="p-5 text-[11px] font-mono text-red-500">ERROR: {error}</div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#333340]">
        <div className="flex items-center gap-3">
          <Server size={14} className="text-gray-500" />
          <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">Agent Management</span>
          <span className="text-xs text-gray-500 font-mono">{agents.length} registered</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSyncAgents} disabled={syncing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-amber-500 bg-[#1E1E24] border border-amber-500/30 rounded-sm hover:bg-amber-500/10 transition-colors">
            <Zap size={10} className={syncing ? 'animate-spin' : ''} />SYNC AGENTS
          </button>
          <button onClick={() => { setLoading(true); window.location.reload(); }} disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-gray-400 bg-[#1E1E24] border border-[#333340] rounded-sm hover:bg-[#2a2a32] transition-colors">
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />REFRESH
          </button>
        </div>
      </div>

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

      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[#333340]">
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Source</span>
        <div className="flex gap-1">
          {(['all', 'wazuh', 'velociraptor'] as AgentSource[]).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors ${filter === s ? 'bg-slate-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1E1E24]'}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="w-px h-3 bg-[#333340]" />
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</span>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1E1E24] border border-[#333340] rounded-sm px-2 py-1 text-[11px] font-mono text-gray-300 focus:outline-none">
          <option value="all">ALL</option>
          <option value="active">ACTIVE</option>
          <option value="disconnected">DISCONNECTED</option>
        </select>
        <div className="w-px h-3 bg-[#333340]" />
        <div className="flex items-center gap-1.5 flex-1">
          <Search size={10} className="text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search hostname or IP..."
            className="bg-transparent text-[11px] font-mono text-gray-300 placeholder-gray-600 focus:outline-none flex-1" />
        </div>
        <span className="text-[10px] font-mono text-gray-600">{filtered.length} / {agents.length}</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#18181c] border-b border-[#333340]">
            <tr>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Hostname</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Wazuh Status</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Velo Status</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">IP</th>
              <th className="px-5 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">OS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252530]">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-[#1a1a22] transition-colors">
                <td className="px-5 py-2">
                  <div className="text-[12px] font-mono text-gray-200">{a.hostname}</div>
                  <div className="text-[10px] font-mono text-gray-600">ID: {a.id.slice(0, 8)}</div>
                </td>
                <td className="px-5 py-2">
                  {a.wazuh_id ? (
                    <div>
                      <StatusBadge status={a.wazuh_status} />
                      <div className="text-[9px] font-mono text-gray-600 mt-0.5">{a.wazuh_version}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-600">--</span>
                  )}
                </td>
                <td className="px-5 py-2">
                  {a.velo_id ? (
                    <div>
                      <StatusBadge status={a.velo_status} />
                      <div className="text-[9px] font-mono text-gray-600 mt-0.5">{a.velo_version}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-600">--</span>
                  )}
                </td>
                <td className="px-5 py-2 text-[11px] font-mono text-gray-400">{a.wazuh_ip || '--'}</td>
                <td className="px-5 py-2">
                  <div className="text-[11px] font-mono text-gray-300">{a.wazuh_os || '--'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="p-8 text-center text-[11px] text-gray-600 font-mono">NO AGENTS MATCH CURRENT FILTERS</div>
        )}
        {loading && (
          <div className="p-8 text-center text-[11px] text-gray-600 font-mono">LOADING AGENTS...</div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
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
      {labels[status] || (status || 'UNKNOWN').replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}
