import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { fetchVeloArtifacts, fetchVeloClients, runVqlQuery } from '../lib/api';
import type { VqlArtifact, VqlClient, VqlQueryResponse } from '../lib/types';
import { Terminal, Code2, Play, Search, Monitor, Box, Command, Shield, Server, FileJson, Table, ChevronRight, History, RefreshCw } from 'lucide-react';

const TEMPLATES = [
  { label: 'List clients', vql: "SELECT client_id, os_info.hostname AS hostname, os_info.system AS os, os_info.architecture AS arch, client_version, last_seen_at FROM clients()" },
  { label: 'Server info', vql: 'SELECT * FROM info()' },
  { label: 'Processes (local)', vql: 'SELECT * FROM Artifact.Linux.Sys.Pslist()' },
  { label: 'Flows (per client)', vql: 'SELECT flow_id, client_id, state FROM flows(client_id="")' },
];

type ShellOs = 'auto' | 'linux' | 'windows' | 'macos';
type Tab = 'vql' | 'shell';

const LINUX_SHELL_ARTIFACT = 'Linux.Sys.BashShell';
const WINDOWS_SHELL_ARTIFACTS = {
  cmd: 'Windows.System.CmdShell',
  powershell: 'Windows.System.PowerShell',
} as const;

const SHELL_QUICK_COMMANDS: Record<'linux' | 'windows', string[]> = {
  linux: ['id', 'whoami', 'hostname', 'uname -a', 'ip addr', 'uptime', 'ps aux', 'ss -tlnp'],
  windows: ['whoami', 'hostname', 'ipconfig /all', 'systeminfo', 'net user'],
};

function detectOs(client: VqlClient | null): 'linux' | 'windows' | 'macos' | 'unknown' {
  const os = (client?.os ?? '').toLowerCase();
  if (os.includes('win')) return 'windows';
  if (os.includes('darwin') || os.includes('mac')) return 'macos';
  if (os.includes('linux')) return 'linux';
  return 'unknown';
}

function escapeVqlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildShellQuery(artifact: string, command: string): string {
  return `SELECT * FROM Artifact.${artifact}(Command='${escapeVqlString(command)}', Stateful='N')`;
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function VelociraptorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('vql');

  // Data state
  const [clients, setClients] = useState<VqlClient[]>([]);
  const [artifacts, setArtifacts] = useState<VqlArtifact[]>([]);
  const [artifactsLoading, setArtifactsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // VQL Studio state
  const [vql, setVql] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<VqlQueryResponse | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [artifactFilter, setArtifactFilter] = useState('');

  // Quick Shell state
  const [shellOs, setShellOs] = useState<ShellOs>('auto');
  const [shellCmd, setShellCmd] = useState('');
  const [winShell, setWinShell] = useState<'cmd' | 'powershell'>('cmd');
  const [shellRunning, setShellRunning] = useState(false);
  const [shellResult, setShellResult] = useState<VqlQueryResponse | null>(null);

  // History state
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shellInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const shellResultsRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [clientRes, artifactRes] = await Promise.all([
        fetchVeloClients(),
        fetchVeloArtifacts(),
      ]);
      setClients(clientRes.rows);
      setArtifacts(artifactRes.rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Velociraptor data');
    } finally {
      setArtifactsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
    }
  }, [result]);

  useEffect(() => {
    if (shellResult && shellResultsRef.current) {
      shellResultsRef.current.scrollTop = shellResultsRef.current.scrollHeight;
    }
  }, [shellResult]);

  const columns = useMemo(() => {
    if (!result) return [];
    const cols = new Set<string>();
    for (const row of result.rows) {
      for (const key of Object.keys(row)) cols.add(key);
    }
    return Array.from(cols);
  }, [result]);

  const filteredArtifacts = useMemo(() => {
    const q = artifactFilter.toLowerCase();
    if (!q) return artifacts.slice(0, 300);
    return artifacts.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 300);
  }, [artifacts, artifactFilter]);

  const selectedClientObj = useMemo(
    () => clients.find((c) => c.client_id === selectedClient) ?? null,
    [clients, selectedClient]
  );

  const effectiveOs = useMemo(
    () => (shellOs === 'auto' ? detectOs(selectedClientObj) : shellOs),
    [shellOs, selectedClientObj]
  );

  const shellArtifact = useMemo(() => {
    if (effectiveOs === 'linux') return LINUX_SHELL_ARTIFACT;
    if (effectiveOs === 'windows') return WINDOWS_SHELL_ARTIFACTS[winShell];
    return null;
  }, [effectiveOs, winShell]);

  const executeVql = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || running) return;

      setRunning(true);
      setError(null);
      setResult(null);
      setHistory((prev) => (prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]));
      setHistoryIdx(-1);

      try {
        const res = await runVqlQuery({
          vql: trimmed,
          client_id: selectedClient || null,
        });
        setResult(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Query failed');
      } finally {
        setRunning(false);
      }
    },
    [running, selectedClient]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeVql(vql);
    } else if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault();
      const next = historyIdx < 0 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(next);
      setVql(history[next]);
    } else if (e.key === 'ArrowDown' && historyIdx >= 0) {
      e.preventDefault();
      if (historyIdx === history.length - 1) {
        setHistoryIdx(-1);
        setVql('');
      } else {
        const next = historyIdx + 1;
        setHistoryIdx(next);
        setVql(history[next]);
      }
    }
  };

  const runShellCommand = useCallback(async () => {
    if (!selectedClient) {
      setError('Select a client to run shell commands.');
      return;
    }
    if (!shellCmd.trim() || shellRunning) return;
    if (!shellArtifact) {
      setError(effectiveOs === 'macos' ? 'No shell artifact for macOS.' : 'No shell artifact for platform.');
      return;
    }
    
    setShellRunning(true);
    setShellResult(null);
    setError(null);
    
    try {
      const query = buildShellQuery(shellArtifact, shellCmd);
      const res = await runVqlQuery({ vql: query, client_id: selectedClient });
      setShellResult(res);
      setShellCmd(''); // clear on success
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Command failed');
    } finally {
      setShellRunning(false);
    }
  }, [selectedClient, shellCmd, shellArtifact, effectiveOs, shellRunning]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--sys-bg-base)]">
      
      {/* Header Area */}
      <div className="flex-none px-6 py-4 border-b border-[var(--sys-border)] bg-[var(--sys-bg-surface)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-100 m-0">Velociraptor Shell</h1>
              <p className="text-sm font-mono text-[var(--sys-text-muted)] mt-0.5 tracking-wide uppercase">Advanced Endpoint Query Interface</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 tracking-wider">
              <Server size={12} />
              SERVER + CLIENT SCOPE
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex-none mx-6 mt-4">
          <ErrorDisplay message={error} onRetry={() => { setError(null); loadData(); }} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex-none px-6 mt-4 border-b border-[var(--sys-border)]">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('vql')}
            className={`pb-3 text-base font-semibold transition-colors relative ${activeTab === 'vql' ? 'text-emerald-400' : 'text-[var(--sys-text-muted)] hover:text-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <Code2 size={16} />
              VQL Studio
            </div>
            {activeTab === 'vql' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
          </button>
          
          <button
            onClick={() => setActiveTab('shell')}
            className={`pb-3 text-base font-semibold transition-colors relative ${activeTab === 'shell' ? 'text-amber-400' : 'text-[var(--sys-text-muted)] hover:text-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <Terminal size={16} />
              Quick Shell
            </div>
            {activeTab === 'shell' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'vql' && (
          <div className="flex h-full p-6 gap-6">
            
            {/* Artifact Browser Sidebar */}
            <div className="w-80 flex flex-col bg-[var(--sys-bg-surface)] border border-[var(--sys-border)] rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-[var(--sys-border)] bg-[var(--sys-bg-surface)]">
                <h2 className="text-base font-bold text-gray-200 flex items-center gap-2">
                  <Box size={14} className="text-emerald-500" />
                  Artifact Browser
                </h2>
                <div className="mt-3 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sys-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Filter artifacts..."
                    value={artifactFilter}
                    onChange={(e) => setArtifactFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[var(--sys-bg-base)] border border-[var(--sys-border)] rounded-md text-sm font-mono text-gray-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[var(--sys-border)] scrollbar-track-transparent">
                {artifactsLoading ? (
                  <div className="p-2"><LoadingSkeleton count={8} height="24px" /></div>
                ) : filteredArtifacts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-[var(--sys-text-muted)] font-mono">No artifacts found</div>
                ) : (
                  filteredArtifacts.map((a) => (
                    <button
                      key={a.name}
                      onClick={() => {
                        setVql(`SELECT * FROM Artifact.${a.name}()`);
                        inputRef.current?.focus();
                      }}
                      title={a.description ?? a.name}
                      className="w-full text-left px-3 py-1.5 text-sm font-mono text-[var(--sys-text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors truncate"
                    >
                      {a.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* VQL Editor & Results */}
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--sys-bg-surface)] border border-[var(--sys-border)] rounded-xl overflow-hidden shadow-xl">
              
              {/* Editor Toolbar */}
              <div className="flex items-center justify-between p-3 border-b border-[var(--sys-border)] bg-[var(--sys-bg-surface)]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Monitor size={14} className="text-[var(--sys-text-muted)]" />
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="bg-[var(--sys-bg-base)] border border-[var(--sys-border)] rounded-md px-2 py-1 text-sm font-mono text-gray-300 focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="">— Server Scope —</option>
                      {clients.map((c) => (
                        <option key={c.client_id} value={c.client_id}>
                          {c.hostname ?? c.client_id} ({c.os ?? '?'})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="h-4 w-px bg-[var(--sys-border)]" />
                  
                  <div className="flex gap-2">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => { setVql(t.vql); inputRef.current?.focus(); }}
                        className="px-2 py-1 text-xs font-medium tracking-wide text-[var(--sys-text-secondary)] hover:text-emerald-400 bg-[var(--sys-bg-elevated)] hover:bg-[var(--sys-bg-base)] rounded transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {result && (
                    <span className="text-xs font-mono text-[var(--sys-text-muted)] flex items-center gap-1">
                      <History size={12} />
                      {result.rows.length} rows · {result.elapsed_ms}ms
                      {result.truncated && ' (trunc)'}
                    </span>
                  )}
                  <div className="flex bg-[var(--sys-bg-base)] border border-[var(--sys-border)] rounded-md overflow-hidden">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 flex items-center gap-1.5 text-xs font-bold tracking-wider transition-colors ${viewMode === 'table' ? 'bg-slate-700 text-[var(--sys-text-primary)]' : 'text-[var(--sys-text-muted)] hover:text-gray-300'}`}
                    >
                      <Table size={12} /> TABLE
                    </button>
                    <button
                      onClick={() => setViewMode('json')}
                      className={`px-3 py-1 flex items-center gap-1.5 text-xs font-bold tracking-wider transition-colors ${viewMode === 'json' ? 'bg-slate-700 text-[var(--sys-text-primary)]' : 'text-[var(--sys-text-muted)] hover:text-gray-300'}`}
                    >
                      <FileJson size={12} /> JSON
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className="relative border-b border-[var(--sys-border)]">
                <textarea
                  ref={inputRef}
                  value={vql}
                  onChange={(e) => setVql(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="SELECT * FROM clients()&#10;-- Press Enter to run, Shift+Enter for newline, ↑/↓ for history"
                  className="w-full p-4 bg-[var(--sys-bg-base)] text-base font-mono text-emerald-300 placeholder-gray-600 focus:outline-none resize-none h-32"
                  spellCheck={false}
                />
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={() => executeVql(vql)}
                    disabled={running || !vql.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[var(--sys-border)] disabled:text-[var(--sys-text-muted)] text-[var(--sys-bg-base)] text-sm font-bold rounded shadow-lg transition-all"
                  >
                    {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} className="fill-current" />}
                    {running ? 'EXECUTING...' : 'RUN QUERY'}
                  </button>
                </div>
              </div>

              {/* Results */}
              <div ref={resultsRef} className="flex-1 overflow-auto bg-[var(--sys-bg-surface)] p-4 relative">
                {!result && !running && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-mono text-sm flex-col gap-2">
                    <Code2 size={32} className="opacity-50" />
                    Awaiting Query Execution
                  </div>
                )}
                
                {result && result.rows.length === 0 && !running && (
                  <div className="text-[var(--sys-text-muted)] font-mono text-sm">Query executed successfully (0 rows returned)</div>
                )}

                {result && result.rows.length > 0 && viewMode === 'table' && (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[var(--sys-bg-surface)] shadow-md z-10">
                      <tr>
                        {columns.map((c) => (
                          <th key={c} className="px-4 py-2 text-xs font-bold text-emerald-500 uppercase tracking-wider border-b border-[var(--sys-border)] whitespace-nowrap">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--sys-border)]">
                      {result.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-[var(--sys-bg-surface)] transition-colors group">
                          {columns.map((c) => (
                            <td key={c} className="px-4 py-2 text-sm font-mono text-gray-300 max-w-xs truncate group-hover:text-gray-100">
                              {renderCell(row[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {result && result.rows.length > 0 && viewMode === 'json' && (
                  <pre className="text-sm font-mono text-emerald-400/90 whitespace-pre-wrap word-break-all">
                    {JSON.stringify(result.rows, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shell' && (
          <div className="h-full p-6 flex justify-center">
            <div className="w-full max-w-4xl flex flex-col bg-[var(--sys-bg-surface)] border border-[var(--sys-border)] rounded-xl overflow-hidden shadow-2xl">
              
              {/* Terminal Header */}
              <div className="flex items-center justify-between p-4 bg-[var(--sys-bg-surface)] border-b border-[var(--sys-border)]">
                <div className="flex items-center gap-3">
                  <Terminal size={18} className="text-amber-500" />
                  <div>
                    <h2 className="text-base font-bold text-gray-200">Interactive Remote Shell</h2>
                    <p className="text-xs font-mono text-[var(--sys-text-muted)] uppercase">Execute commands directly on endpoint</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--sys-text-muted)] uppercase">Target</span>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="bg-[var(--sys-bg-base)] border border-[var(--sys-border)] rounded-md px-3 py-1.5 text-sm font-mono text-amber-500 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="" disabled>Select Endpoint...</option>
                      {clients.map((c) => (
                        <option key={c.client_id} value={c.client_id}>
                          {c.hostname ?? c.client_id}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="h-6 w-px bg-[var(--sys-border)]" />
                  
                  <div className="flex bg-[var(--sys-bg-base)] border border-[var(--sys-border)] p-1 rounded-md">
                    {(['auto', 'linux', 'windows', 'macos'] as ShellOs[]).map((os) => (
                      <button
                        key={os}
                        onClick={() => setShellOs(os)}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded transition-colors ${shellOs === os ? 'bg-amber-500 text-[#0F0F13]' : 'text-[var(--sys-text-muted)] hover:text-gray-300'}`}
                      >
                        {os}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="flex-1 flex flex-col bg-[#0A0A0C] p-4 relative font-mono text-[13px]">
                
                {/* Warning / Status */}
                <div className="mb-4 flex items-start gap-2 text-amber-500/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-sm">
                  <Command size={14} className="mt-0.5 shrink-0" />
                  <div>
                    Warning: Commands execute as SYSTEM/root. All actions are logged and audited.
                    {effectiveOs === 'macos' && (
                      <span className="block mt-1 text-red-400">Error: No macOS shell artifact available in this deployment.</span>
                    )}
                  </div>
                </div>

                {/* Quick commands */}
                {effectiveOs !== 'macos' && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {SHELL_QUICK_COMMANDS[effectiveOs === 'windows' ? 'windows' : 'linux'].map((c) => (
                      <button
                        key={c}
                        onClick={() => { setShellCmd(c); shellInputRef.current?.focus(); }}
                        className="px-2.5 py-1 bg-[var(--sys-bg-surface)] border border-[var(--sys-border)] hover:border-amber-500/50 text-[var(--sys-text-secondary)] hover:text-amber-400 rounded text-sm transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {/* Terminal output */}
                <div ref={shellResultsRef} className="flex-1 overflow-y-auto mb-4 text-gray-300 whitespace-pre-wrap">
                  {shellResult && shellResult.rows.map((row, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="text-[var(--sys-text-muted)] mb-1">[{selectedClientObj?.hostname ?? selectedClient}] $ {(row as any).Command ?? 'Output:'}</div>
                      <div className="text-gray-200">{(row as any).Stdout}</div>
                      {(row as any).Stderr && <div className="text-red-400 mt-1">{(row as any).Stderr}</div>}
                    </div>
                  ))}
                  {shellRunning && <div className="text-amber-400 animate-pulse">Executing command on remote endpoint...</div>}
                </div>

                {/* Terminal Input */}
                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-[var(--sys-border)]">
                  <ChevronRight size={16} className="text-amber-500 shrink-0" />
                  <input
                    ref={shellInputRef}
                    type="text"
                    value={shellCmd}
                    onChange={(e) => setShellCmd(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') runShellCommand();
                    }}
                    placeholder={!selectedClient ? 'Select a client first...' : 'Enter shell command...'}
                    disabled={!selectedClient || shellRunning || effectiveOs === 'macos'}
                    className="flex-1 bg-transparent text-amber-100 placeholder-gray-600 focus:outline-none disabled:opacity-50"
                    spellCheck={false}
                  />
                  
                  {effectiveOs === 'windows' && (
                    <select
                      value={winShell}
                      onChange={(e) => setWinShell(e.target.value as 'cmd' | 'powershell')}
                      className="bg-[var(--sys-bg-surface)] border border-[var(--sys-border)] rounded px-2 py-1 text-xs text-[var(--sys-text-secondary)] focus:outline-none"
                    >
                      <option value="cmd">CMD</option>
                      <option value="powershell">PS</option>
                    </select>
                  )}
                  
                  <button
                    onClick={runShellCommand}
                    disabled={!shellCmd.trim() || !selectedClient || shellRunning || effectiveOs === 'macos'}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-[var(--sys-border)] disabled:text-[var(--sys-text-muted)] text-[var(--sys-bg-base)] text-sm font-bold rounded transition-all"
                  >
                    SEND
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
