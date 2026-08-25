import { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import OpenAI from 'openai';
import {
  Send, Settings, Search, Activity,
  ChevronRight, Wrench, Play, Terminal
} from 'lucide-react';
import { fetchSecurityPostureSummary, runAiTriage } from '../lib/api';
import type { SecurityPostureSummary, TriageReport } from '../lib/types';
import { ActionDispatchModal } from '../components/ActionDispatchModal';

const MCP_BASE = 'http://localhost:3001';

function readStored(key: string, fallback: string): string {
  const value = localStorage.getItem(key);
  return value && !['undefined', 'null'].includes(value.trim()) ? value : fallback;
}

function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return `${window.location.origin}${trimmed}`;
  return trimmed.replace(/[\/]+$/g, '');
}

function resolveEndpoint(raw: string): { baseUrl: string; isProxy: boolean } {
  const isProxy = raw.includes('api.ai.camer.digital') || raw.trim().startsWith('/');
  return { baseUrl: normalizeEndpoint(isProxy ? '/ai-api' : raw), isProxy };
}

function buildModelsUrl(baseUrl: string, isProxy: boolean): string {
  if (baseUrl.endsWith('/v1')) return `${baseUrl}/models`;
  return isProxy ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
}

// ── Tool Output Formatting (no emojis, industrial style) ─────────────────────

function formatToolOutput(raw: string): string {
  try {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\\n?/, '').replace(/\\n?```$/, '');
    }
    const data = JSON.parse(cleaned);

    // Wazuh agents
    if (data?.agents && data?.summary) {
      const { agents, summary } = data;
      let md = `### Wazuh Agents\n\n`;
      md += `| Status | Count |\n|--------|-------|\n`;
      md += `| Active | ${summary.active} |\n`;
      md += `| Disconnected | ${summary.disconnected} |\n`;
      md += `| Never Connected | ${summary.never_connected} |\n`;
      md += `| Pending | ${summary.pending} |\n`;
      md += `| **Total** | **${summary.total}** |\n\n`;
      if (agents.length > 0) {
        md += `| ID | Name | OS | Version | Status |\n|----|------|----|---------|--------|\n`;
        agents.forEach((a: any) => {
          md += `| \`${a.id}\` | ${a.name} | ${a.os_name || 'N/A'} | ${a.version || 'N/A'} | ${a.status} |\n`;
        });
      }
      if (data.elapsed_ms) md += `\n*Query: ${data.elapsed_ms}ms*\n`;
      return md;
    }

    // Alerts
    if (Array.isArray(data) && data.length > 0 && data[0]?.connector_id && data[0]?.severity) {
      let md = `### Alerts (${data.length})\n\n`;
      const bySev: Record<string, number> = {};
      data.forEach((a: any) => { bySev[a.severity] = (bySev[a.severity] || 0) + 1; });
      md += `| Severity | Count |\n|----------|-------|\n`;
      Object.entries(bySev).forEach(([s, c]) => { md += `| ${s} | ${c} |\n`; });
      md += `\n**Latest ${Math.min(5, data.length)}:**\n\n`;
      data.slice(0, 5).forEach((a: any, i: number) => {
        const desc = a.raw_payload?.rule?.description || a.raw_payload?.full_log?.slice(0, 80) || '';
        md += `${i + 1}. **${a.severity}** -- ${a.source} via ${a.connector_id}\n`;
        if (desc) md += `   > ${desc}\n`;
        md += `   *${new Date(a.timestamp).toLocaleString()}*\n\n`;
      });
      return md;
    }

    // Action templates
    if (Array.isArray(data) && data.length > 0 && data[0]?.params_schema && data[0]?.category) {
      let md = `### Response Actions (${data.length})\n\n`;
      md += `| Action | Category | Risk | Provider |\n|--------|----------|------|----------|\n`;
      data.forEach((t: any) => { md += `| ${t.display_name} | ${t.category} | ${t.risk_level} | ${t.provider} |\n`; });
      return md;
    }

    // Cases
    if (Array.isArray(data) && data.length > 0 && data[0]?.title !== undefined && data[0]?.status !== undefined) {
      let md = `### Cases (${data.length})\n\n`;
      md += `| Title | Status | Created |\n|-------|--------|----------|\n`;
      data.forEach((c: any) => { md += `| ${c.title} | ${c.status} | ${new Date(c.created_at).toLocaleDateString()} |\n`; });
      return md;
    }

    // Detection rules
    if (Array.isArray(data) && data.length > 0 && data[0]?.query_or_vql !== undefined) {
      let md = `### Detection Rules (${data.length})\n\n`;
      md += `| Rule | Severity | Category |\n|------|----------|----------|\n`;
      data.forEach((r: any) => { md += `| ${r.name} | ${r.severity} | ${r.category} |\n`; });
      return md;
    }

    // Health
    if (data?.status && data?.connectors) {
      let md = `### System Health -- ${data.status}\n\n`;
      if (data.connectors) {
        md += `| Connector | Status |\n|-----------|--------|\n`;
        data.connectors.forEach((c: any) => { md += `| ${c.id || c.name} | ${c.status} |\n`; });
      }
      return md;
    }

    // MITRE
    if (data?.columns && data?.total_techniques !== undefined) {
      let md = `### MITRE ATT&CK Matrix\n\n**${data.total_techniques}** techniques | **${data.total_active_detections}** detections\n\n`;
      data.columns.forEach((col: any) => {
        if (col.techniques?.length > 0) {
          md += `**${col.tactic.name}**\n`;
          col.techniques.forEach((t: any) => { md += `- \`${t.id}\` ${t.name} -- ${t.detection_count} detections\n`; });
          md += `\n`;
        }
      });
      return md;
    }

    // Agents array
    if (Array.isArray(data) && data.length > 0 && data[0]?.status !== undefined && data[0]?.os_name !== undefined) {
      let md = `### Agents (${data.length})\n\n`;
      md += `| ID | Name | OS | Status |\n|----|------|----|--------|\n`;
      data.forEach((a: any) => { md += `| \`${a.id}\` | ${a.name} | ${a.os_name || 'N/A'} | ${a.status} |\n`; });
      return md;
    }

    // Generic object
    if (!Array.isArray(data) && typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length <= 12) {
        let md = `| Field | Value |\n|-------|-------|\n`;
        keys.forEach(k => {
          const val = typeof data[k] === 'object' ? JSON.stringify(data[k]).slice(0, 100) : String(data[k]);
          md += `| ${k} | ${val} |\n`;
        });
        return md;
      }
    }

    return `\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 2000)}\n\`\`\``;
  } catch {
    return raw;
  }
}

function ToolOutputBlock({ raw }: { raw: string }) {
  const [expanded, setExpanded] = useState(false);
  const formatted = formatToolOutput(raw);
  const lineCount = raw.split('\\n').length;
  const shouldCollapse = lineCount > 15;

  return (
    <div style={{ border: '1px solid var(--sys-border)', borderRadius: '2px', overflow: 'hidden', background: 'var(--sys-bg-base)' }}>
      <button
        onClick={() => shouldCollapse && setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.375rem 0.625rem', fontSize: '0.85rem', color: 'var(--sys-text-muted)',
          background: 'transparent', border: 'none', cursor: shouldCollapse ? 'pointer' : 'default',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Wrench size={11} style={{ color: 'var(--color-accent)' }} />
          TOOL OUTPUT
          {!expanded && shouldCollapse && <span style={{ color: '#444' }}>({lineCount} lines)</span>}
        </span>
        {shouldCollapse && <span>{expanded ? '[COLLAPSE]' : '[EXPAND]'}</span>}
      </button>
      {(expanded || !shouldCollapse) && (
        <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--sys-border)' }} className="prose prose-invert prose-sm max-w-none">
          <Markdown>{formatted}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function AiDashboardPage() {
  const defaultEndpoint = import.meta.env.VITE_AI_ENDPOINT || 'http://localhost:11434/v1';
  const defaultApiKey = import.meta.env.VITE_AI_API_KEY || 'dummy-key';
  const defaultModel = import.meta.env.VITE_AI_MODEL || 'gpt-4o';

  const [endpoint, setEndpoint] = useState(readStored('ai_endpoint', defaultEndpoint));
  const [apiKey, setApiKey] = useState(readStored('ai_api_key', defaultApiKey));
  const [model, setModel] = useState(readStored('ai_model', defaultModel));
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [mcpStatus, setMcpStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  const [posture, setPosture] = useState<SecurityPostureSummary | null>(null);
  const [loadingPosture, setLoadingPosture] = useState(true);

  const [triageTarget, setTriageTarget] = useState('');
  const [triageReport, setTriageReport] = useState<TriageReport | null>(null);
  const [triaging, setTriaging] = useState(false);
  const [dispatchTemplate, setDispatchTemplate] = useState<string | null>(null);
  const [triageOpen, setTriageOpen] = useState(true);

  const [messages, setMessages] = useState<Array<{ role: string; content: string; toolCalls?: any[] }>>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mcpToolsRef = useRef<any[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSecurityPostureSummary()
      .then(setPosture)
      .catch(console.error)
      .finally(() => setLoadingPosture(false));

    const initMcp = async () => {
      try {
        const resp = await fetch(`${MCP_BASE}/rest/tools`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        mcpToolsRef.current = (data.tools || []).map((t: any) => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.inputSchema },
        }));
        setMcpStatus('connected');
      } catch (err) {
        console.error('Failed to load MCP tools:', err);
        setMcpStatus('error');
      }
    };
    initMcp();
  }, []);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isProcessing]);

  const handleSaveSettings = () => {
    localStorage.setItem('ai_endpoint', endpoint);
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_model', model);
    setShowSettings(false);
  };

  const handleFetchModels = async () => {
    try {
      const { baseUrl, isProxy } = resolveEndpoint(endpoint);
      if (!baseUrl) return;
      const modelsUrl = buildModelsUrl(baseUrl, isProxy);
      const response = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data?.data && Array.isArray(data.data)) {
        setAvailableModels(data.data.map((m: any) => m.id));
        if (data.data.length > 0 && !model) setModel(data.data[0].id);
      }
    } catch (err: any) {
      alert(`Model fetch failed: ${err.message}`);
    }
  };

  const callMcpTool = async (name: string, args: any): Promise<string> => {
    const resp = await fetch(`${MCP_BASE}/rest/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, arguments: args }),
    });
    const data = await resp.json();
    if (data.isError) return `Error: ${data.content?.[0]?.text || 'Unknown error'}`;
    return data.content?.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\\n') || '';
  };

  const handleRunTriage = async () => {
    if (!triageTarget.trim()) return;
    setTriaging(true);
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(triageTarget.trim());
      const payload = isUuid ? { alert_id: triageTarget.trim() } : { ioc: triageTarget.trim() };
      const report = await runAiTriage(payload);
      setTriageReport(report);
    } catch (err: any) {
      alert(`Triage failed: ${err.message}`);
    } finally {
      setTriaging(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const { baseUrl } = resolveEndpoint(endpoint);
      const openai = new OpenAI({ baseURL: baseUrl, apiKey, dangerouslyAllowBrowser: true });
      const tools = mcpToolsRef.current;
      let currentMessages: any[] = [...messages, userMessage];

      while (true) {
        const response = await openai.chat.completions.create({
          model: model || 'gpt-4o',
          messages: currentMessages,
          tools: tools.length > 0 ? tools : undefined,
        });
        const msg = response.choices[0].message;
        currentMessages.push(msg);
        setMessages([...currentMessages]);
        if (!msg.tool_calls || msg.tool_calls.length === 0) break;
        for (const tc of msg.tool_calls as any[]) {
          const args = JSON.parse(tc.function.arguments || '{}');
          const resultText = await callMcpTool(tc.function.name, args);
          currentMessages.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: resultText });
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict.toUpperCase()) {
      case 'MALICIOUS': return <span className="badge badge-critical">MALICIOUS</span>;
      case 'SUSPICIOUS': return <span className="badge badge-high">SUSPICIOUS</span>;
      case 'INFORMATIONAL': return <span className="badge badge-info">INFO</span>;
      default: return <span className="badge badge-success">BENIGN</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 28px)', overflow: 'hidden' }}>
      {/* ── Top Bar: Posture + Controls ───────────────────────────────────── */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--sys-border)' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={16} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sys-text-primary)', fontFamily: 'var(--font-mono)' }}>AI ANALYST</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>// AUTONOMOUS TRIAGE | MITRE | ACTIVE RESPONSE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {/* Triage Toggle */}
            <button
              onClick={() => setTriageOpen(!triageOpen)}
              className="btn"
              style={{ fontFamily: 'var(--font-mono)', borderColor: triageOpen ? 'var(--color-warning)' : undefined, color: triageOpen ? 'var(--color-warning)' : undefined }}
            >
              <Search size={12} /> TRIAGE {triageOpen ? 'ON' : 'OFF'}
            </button>
            {/* MCP Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'var(--sys-bg-surface)', border: '1px solid var(--sys-border)', borderRadius: '2px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              <span className={`status-dot ${mcpStatus === 'connected' ? 'ok' : mcpStatus === 'error' ? 'error' : 'warn'}`} />
              <span style={{ color: 'var(--sys-text-secondary)' }}>{mcpStatus === 'connected' ? `${mcpToolsRef.current.length} TOOLS` : 'OFFLINE'}</span>
            </div>
            {/* Posture (compact inline) */}
            {posture && !loadingPosture && (
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-muted)' }}>
                <span><span style={{ color: 'var(--color-warning)' }}>{posture.open_alerts_count}</span> ALERTS</span>
                <span><span style={{ color: 'var(--color-critical)' }}>{posture.critical_alerts_count}</span> CRIT</span>
                <span><span style={{ color: 'var(--sys-text-secondary)' }}>{posture.active_cases_count}</span> CASES</span>
                <span><span style={{ color: 'var(--color-success)' }}>{posture.executed_actions_count}</span> ACTIONS</span>
              </div>
            )}
            <button onClick={() => setShowSettings(!showSettings)} className="btn" style={{ fontFamily: 'var(--font-mono)' }}>
              <Settings size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Area: Triage Sidebar + Full-Screen Chat ──────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Triage Sidebar (collapsible) */}
        {triageOpen && (
          <div style={{ width: '320px', minWidth: '320px', borderRight: '1px solid var(--sys-border)', background: 'var(--sys-bg-surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Sidebar Header */}
            <div style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--sys-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-muted)', textTransform: 'uppercase' }}>AUTONOMOUS TRIAGE</span>
              <button onClick={() => setTriageOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--sys-text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>X</button>
            </div>

            {/* Triage Input */}
            <div style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--sys-border)' }}>
              <p style={{ fontSize: '0.75rem', color: '#444', fontFamily: 'var(--font-mono)', margin: '0 0 0.375rem' }}>
                UUID, IP, DOMAIN, HASH, CVE
              </p>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={11} style={{ position: 'absolute', left: '0.375rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                  <input
                    type="text"
                    placeholder="192.168.1.1"
                    value={triageTarget}
                    onChange={(e) => setTriageTarget(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunTriage()}
                    className="input"
                    style={{ width: '100%', paddingLeft: '1.5rem', fontSize: '0.75rem' }}
                  />
                </div>
                <button onClick={handleRunTriage} disabled={triaging || !triageTarget.trim()} className="btn btn-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '0.375rem 0.5rem' }}>
                  <Play size={11} className={triaging ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Triage Results (scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.625rem' }}>
              {!triageReport && !triaging && (
                <div style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
                  <Search size={20} style={{ color: 'var(--sys-border)', marginBottom: '0.375rem' }} />
                  <p style={{ fontSize: '0.8rem', color: '#444', fontFamily: 'var(--font-mono)' }}>AWAITING INPUT</p>
                </div>
              )}

              {triaging && (
                <div style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
                  <Activity size={16} className="animate-pulse" style={{ color: 'var(--color-accent)', marginBottom: '0.375rem' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>ANALYZING...</p>
                </div>
              )}

              {triageReport && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Verdict + Score */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#444' }}>VERDICT</span>
                      {getVerdictBadge(triageReport.verdict)}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--sys-text-primary)' }}>
                      {triageReport.risk_score}<span style={{ fontSize: '0.75rem', color: 'var(--sys-text-muted)' }}>/100</span>
                    </span>
                  </div>

                  {/* Score bar */}
                  <div style={{ width: '100%', height: '3px', background: 'var(--sys-bg-base)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      background: triageReport.risk_score >= 80 ? 'var(--color-critical)' : triageReport.risk_score >= 50 ? 'var(--color-warning)' : 'var(--color-success)',
                      width: `${triageReport.risk_score}%`, transition: 'width 500ms',
                    }} />
                  </div>

                  {/* Summary */}
                  <div style={{ padding: '0.375rem 0.5rem', background: 'var(--sys-bg-base)', border: '1px solid var(--sys-border)', borderRadius: '2px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--sys-text-secondary)', fontFamily: 'var(--font-mono)', margin: 0, lineHeight: 1.5 }}>{triageReport.summary}</p>
                  </div>

                  {/* MITRE */}
                  {triageReport.mitre_techniques.length > 0 && (
                    <div>
                      <label style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#444', display: 'block', marginBottom: '0.25rem' }}>MITRE</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {triageReport.mitre_techniques.map((tech) => (
                          <span key={tech} style={{ padding: '0.125rem 0.375rem', background: 'var(--sys-bg-base)', border: '1px solid var(--sys-border)', borderRadius: '2px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {triageReport.recommended_actions.length > 0 && (
                    <div>
                      <label style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--color-warning)', display: 'block', marginBottom: '0.25rem' }}>ACTIONS</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {triageReport.recommended_actions.map((act, idx) => (
                          <div key={idx} style={{ padding: '0.375rem 0.5rem', background: 'var(--sys-bg-base)', border: '1px solid var(--sys-border)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--sys-text-primary)' }}>{act.display_name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#444', fontFamily: 'var(--font-mono)' }}>{act.description}</div>
                            </div>
                            <button onClick={() => setDispatchTemplate(act.template_name)} style={{ background: 'none', border: '1px solid var(--color-warning)', color: 'var(--color-warning)', padding: '0.125rem 0.375rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                              DISPATCH
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Full-Screen AI Chat ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--sys-bg-base)' }}>
          {/* Chat Header */}
          <div style={{ flexShrink: 0, padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--sys-border)', background: 'var(--sys-bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Terminal size={14} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-secondary)' }}>SOC ASSISTANT</span>
              <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#444' }}>// MODEL: {model}</span>
            </div>
            <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#444' }}>{messages.length} MESSAGES</span>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, padding: '1rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <Terminal size={48} style={{ color: '#222', marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--sys-text-muted)', fontWeight: 600, margin: '0 0 0.375rem', fontFamily: 'var(--font-mono)' }}>SYSTEM READY</h4>
                <p style={{ fontSize: '0.75rem', color: '#444', fontFamily: 'var(--font-mono)', maxWidth: '400px', lineHeight: 1.6 }}>
                  Query alerts, triage threats, lookup intel, or trigger response actions.
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem', justifyContent: 'center' }}>
                  {['Show critical alerts', 'List Wazuh agents', 'Check system health', 'Triage this environment'].map((q) => (
                    <button key={q} onClick={() => { setInput(q); }} style={{ padding: '0.25rem 0.625rem', background: 'var(--sys-bg-surface)', border: '1px solid var(--sys-border)', borderRadius: '2px', color: 'var(--color-accent)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              if (msg.role === 'tool') return <ToolOutputBlock key={idx} raw={msg.content} />;
              const isUser = msg.role === 'user';
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%', padding: '0.625rem 0.875rem', borderRadius: '2px',
                    background: isUser ? 'var(--sys-bg-elevated)' : 'var(--sys-bg-surface)',
                    border: '1px solid var(--sys-border)', fontSize: '0.8125rem', lineHeight: 1.6,
                  }}>
                    <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#444', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {isUser ? 'SOC_ANALYST' : 'SG_AI'}
                    </div>
                    {!isUser ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--sys-text-primary)', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-muted)' }}>
                <Activity size={12} className="animate-pulse" style={{ color: 'var(--color-accent)' }} />
                PROCESSING // QUERYING MCP TOOLS...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input (full width) */}
          <div style={{ flexShrink: 0, padding: '0.625rem 1rem', borderTop: '1px solid var(--sys-border)', display: 'flex', gap: '0.5rem', background: 'var(--sys-bg-surface)' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Enter command..."
              className="input"
              style={{ flex: 1, fontSize: '0.8125rem' }}
            />
            <button onClick={handleSendMessage} disabled={isProcessing || !input.trim()} className="btn btn-primary">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="panel-header">
              <span className="panel-title">AI ENDPOINT CONFIGURATION</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>ENDPOINT URL</label>
                <input type="text" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="input" style={{ width: '100%', marginTop: '0.125rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>API KEY</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="input" style={{ width: '100%', marginTop: '0.125rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--sys-text-muted)', fontFamily: 'var(--font-mono)' }}>MODEL</label>
                {availableModels.length > 0 ? (
                  <select value={model} onChange={(e) => setModel(e.target.value)} className="input" style={{ width: '100%', marginTop: '0.125rem' }}>
                    {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="input" style={{ width: '100%', marginTop: '0.125rem' }} />
                )}
                <button onClick={handleFetchModels} style={{ marginTop: '0.25rem', background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ChevronRight size={10} /> FETCH MODELS
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem', paddingTop: '0.5rem', borderTop: '1px solid var(--sys-border)' }}>
              <button onClick={() => setShowSettings(false)} className="btn">CANCEL</button>
              <button onClick={handleSaveSettings} className="btn btn-primary">SAVE</button>
            </div>
          </div>
        </div>
      )}

      {/* Action Dispatch Modal */}
      {dispatchTemplate && (
        <ActionDispatchModal
          initialTemplateName={dispatchTemplate}
          isOpen={true}
          onClose={() => setDispatchTemplate(null)}
          onSuccess={() => {
            setDispatchTemplate(null);
            fetchSecurityPostureSummary().then(setPosture);
          }}
        />
      )}
    </div>
  );
}


