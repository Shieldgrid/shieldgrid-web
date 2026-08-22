/**
 * src/pages/VelociraptorPage.tsx
 *
 * Velociraptor VQL Shell — a terminal-style interface for running VQL queries
 * against the Velociraptor server (server scope), plus a browsable artifact
 * list and quick-start templates.
 *
 * Gated to admins: arbitrary VQL can read any server-side data, so every
 * execution is audit-logged by the core API.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { fetchVeloArtifacts, fetchVeloClients, runVqlQuery } from '../lib/api';
import type { VqlArtifact, VqlClient, VqlQueryResponse } from '../lib/types';

const TEMPLATES = [
  {
    label: 'List clients',
    vql: "SELECT client_id, os_info.hostname AS hostname, os_info.system AS os, os_info.architecture AS arch, client_version, last_seen_at FROM clients()",
  },
  {
    label: 'Server info',
    vql: 'SELECT * FROM info()',
  },
  {
    label: 'Processes (local)',
    vql: 'SELECT * FROM Artifact.Linux.Sys.Pslist()',
  },
  {
    label: 'Flows (per client)',
    vql: 'SELECT flow_id, client_id, state FROM flows(client_id="")',
  },
];

type ShellOs = 'auto' | 'linux' | 'windows' | 'macos';

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
  // Stateful='N' forces one-shot execution: the interactive session (Stateful=Y)
  // would otherwise hold the flow until the session timeout.
  return `SELECT * FROM Artifact.${artifact}(Command='${escapeVqlString(command)}', Stateful='N')`;
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function VelociraptorPage() {
  const [clients, setClients] = useState<VqlClient[]>([]);
  const [artifacts, setArtifacts] = useState<VqlArtifact[]>([]);
  const [artifactsLoading, setArtifactsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vql, setVql] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<VqlQueryResponse | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [artifactFilter, setArtifactFilter] = useState('');

  // Quick shell (remote command runner) state.
  const [shellOs, setShellOs] = useState<ShellOs>('auto');
  const [shellCmd, setShellCmd] = useState('');
  const [winShell, setWinShell] = useState<'cmd' | 'powershell'>('cmd');

  // Command history for the shell (Up/Down arrows).
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  const execute = useCallback(
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
      execute(vql);
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

  const runShellCommand = useCallback(() => {
    if (!selectedClient) {
      setError('Select a client to run shell commands.');
      return;
    }
    if (!shellCmd.trim()) return;
    if (!shellArtifact) {
      setError(
        effectiveOs === 'macos'
          ? 'No shell artifact for macOS in this Velociraptor build (Linux.Sys.* / Windows.System.* only).'
          : 'No shell artifact for the selected platform.'
      );
      return;
    }
    const query = buildShellQuery(shellArtifact, shellCmd);
    setVql(query);
    void execute(query);
  }, [selectedClient, shellCmd, shellArtifact, effectiveOs, execute]);

  const insertArtifact = (name: string) => {
    setVql(`SELECT * FROM Artifact.${name}()`);
    inputRef.current?.focus();
  };

  const insertTemplate = (template: string) => {
    setVql(template);
    inputRef.current?.focus();
  };

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Velociraptor VQL Shell</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Run VQL queries against the Velociraptor server. Enter runs, Shift+Enter is a new line, ↑/↓ browses history.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
              }}
            >
              Server + Client Scope
            </span>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-warning)',
                border: '1px solid var(--color-warning)',
              }}
            >
              Admin Gated
            </span>
          </div>
        </div>

        {error && <ErrorDisplay message={error} onRetry={() => { setError(null); loadData(); }} />}

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* ── Artifact Browser ─────────────────────────────────────────────── */}
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              maxHeight: '70vh',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Artifacts</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
                Click to insert a query. {artifacts.length} available.
              </p>
            </div>
            <input
              type="text"
              placeholder="Filter artifacts…"
              value={artifactFilter}
              onChange={(e) => setArtifactFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
              }}
            />
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
              {artifactsLoading ? (
                <LoadingSkeleton count={8} height="1.5rem" />
              ) : filteredArtifacts.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>No artifacts match.</p>
              ) : (
                filteredArtifacts.map((a) => (
                  <button
                    key={a.name}
                    onClick={() => insertArtifact(a.name)}
                    title={a.description ?? a.name}
                    style={{
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-bg-base)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {a.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Shell ───────────────────────────────────────────────────────── */}
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {/* Template chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => insertTemplate(t.vql)}
                  style={{
                    padding: '0.25rem 0.625rem',
                    fontSize: '0.72rem',
                    borderRadius: '999px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Client scope selector (metadata / dispatch hint) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
              <label style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                Client scope
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.375rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-base)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                }}
              >
                <option value="">— server scope —</option>
                {clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.hostname ?? c.client_id} ({c.os ?? '?'}) {c.client_id}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Quick Shell (remote command runner) ─────────────────────────── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Quick Shell</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: shellArtifact ? 'var(--color-accent)' : 'var(--color-warning)',
                    fontFamily: 'monospace',
                  }}
                >
                  {shellArtifact ?? (effectiveOs === 'macos' ? 'no macOS shell artifact' : 'select a client')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>OS</label>
                {(['auto', 'linux', 'windows', 'macos'] as ShellOs[]).map((os) => (
                  <button
                    key={os}
                    onClick={() => setShellOs(os)}
                    style={{
                      padding: '0.2rem 0.625rem',
                      fontSize: '0.72rem',
                      borderRadius: '999px',
                      border: '1px solid var(--color-border)',
                      background: shellOs === os ? 'var(--color-accent)' : 'var(--color-bg-base)',
                      color: shellOs === os ? '#0B1B33' : 'var(--color-text-secondary)',
                      fontWeight: shellOs === os ? 700 : 500,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {os}
                  </button>
                ))}
              </div>

              {effectiveOs === 'windows' && (
                <select
                  value={winShell}
                  onChange={(e) => setWinShell(e.target.value as 'cmd' | 'powershell')}
                  style={{
                    padding: '0.375rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                  }}
                >
                  <option value="cmd">Cmd — Windows.System.CmdShell</option>
                  <option value="powershell">PowerShell — Windows.System.PowerShell</option>
                </select>
              )}

              {effectiveOs !== 'macos' && (
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {SHELL_QUICK_COMMANDS[effectiveOs === 'windows' ? 'windows' : 'linux'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setShellCmd(c)}
                      style={{
                        padding: '0.2rem 0.625rem',
                        fontSize: '0.72rem',
                        borderRadius: '999px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-base)',
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={shellCmd}
                  onChange={(e) => setShellCmd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runShellCommand();
                  }}
                  placeholder={effectiveOs === 'windows' ? 'e.g. whoami /all' : 'e.g. id && hostname'}
                  spellCheck={false}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={runShellCommand}
                  disabled={running || !shellCmd.trim() || !shellArtifact || !selectedClient}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: '#0B1B33',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: running || !shellCmd.trim() || !shellArtifact || !selectedClient ? 'not-allowed' : 'pointer',
                    opacity: running || !shellCmd.trim() || !shellArtifact || !selectedClient ? 0.55 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Run on client
                </button>
              </div>

              {effectiveOs === 'macos' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', margin: 0 }}>
                  Velociraptor 0.77 ships no macOS shell artifact (Linux.Sys.* and Windows.System.* only). Use the artifact browser for generic collection.
                </p>
              )}
            </div>

            {/* Query input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                ref={inputRef}
                value={vql}
                onChange={(e) => setVql(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={"SELECT * FROM clients()"}
                rows={3}
                spellCheck={false}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-base)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => execute(vql)}
                    disabled={running || !vql.trim()}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'var(--color-accent)',
                      color: '#0B1B33',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: running ? 'progress' : 'pointer',
                      opacity: running || !vql.trim() ? 0.6 : 1,
                    }}
                  >
                    {running ? 'Running…' : '▶ Run Query'}
                  </button>
                  <button
                    onClick={() => setViewMode(viewMode === 'table' ? 'json' : 'table')}
                    disabled={!result || result.rows.length === 0}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'transparent',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    View: {viewMode === 'table' ? 'JSON' : 'Table'}
                  </button>
                </div>
                {result && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    {result.rows.length} row{result.rows.length === 1 ? '' : 's'} · {result.elapsed_ms} ms
                    {result.truncated ? ' · truncated at 500' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Results */}
            <div
              ref={resultsRef}
              style={{
                minHeight: '280px',
                maxHeight: '60vh',
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-bg-base)',
              }}
            >
              {!result && !running && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace', padding: '1rem', margin: 0 }}>
                  No results yet — run a query above, or click an artifact.
                </p>
              )}
              {running && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace', padding: '1rem', margin: 0 }}>
                  Executing…
                </p>
              )}
              {result && result.rows.length === 0 && !running && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace', padding: '1rem', margin: 0 }}>
                  Query returned 0 rows.
                </p>
              )}
              {result && result.rows.length > 0 && viewMode === 'table' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'monospace', minWidth: '100%' }}>
                    <thead>
                      <tr>
                        {columns.map((c) => (
                          <th
                            key={c}
                            style={{
                              textAlign: 'left',
                              padding: '0.5rem 0.75rem',
                              borderBottom: '1px solid var(--color-border)',
                              color: 'var(--color-accent)',
                              whiteSpace: 'nowrap',
                              position: 'sticky',
                              top: 0,
                              background: 'var(--color-bg-base)',
                            }}
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {columns.map((c) => (
                            <td
                              key={c}
                              style={{
                                padding: '0.375rem 0.75rem',
                                borderBottom: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)',
                                maxWidth: '320px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {renderCell(row[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {result && result.rows.length > 0 && viewMode === 'json' && (
                <pre
                  style={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {JSON.stringify(result.rows, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
