import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { 
  Bot, 
  Send, 
  Settings, 
  Sparkles, 
  ShieldAlert, 
  Activity, 
  Layers, 
  ShieldCheck, 
  ChevronRight, 
  Wrench, 
  Search,
  Zap,
  Play
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
  if (trimmed.startsWith('/')) {
    return `${window.location.origin}${trimmed}`;
  }
  return trimmed.replace(/\/+$/, '');
}

function resolveEndpoint(raw: string): { baseUrl: string; isProxy: boolean } {
  const isProxy = raw.includes('api.ai.camer.digital') || raw.trim().startsWith('/');
  return { baseUrl: normalizeEndpoint(isProxy ? '/ai-api' : raw), isProxy };
}

function buildModelsUrl(baseUrl: string, isProxy: boolean): string {
  if (baseUrl.endsWith('/v1')) return `${baseUrl}/models`;
  return isProxy ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
}

export default function AiDashboardPage() {
  const defaultEndpoint = import.meta.env.VITE_AI_ENDPOINT || 'http://localhost:11434/v1';
  const defaultApiKey = import.meta.env.VITE_AI_API_KEY || 'dummy-key';
  const defaultModel = import.meta.env.VITE_AI_MODEL || 'gpt-4o';

  // Config State
  const [endpoint, setEndpoint] = useState(readStored('ai_endpoint', defaultEndpoint));
  const [apiKey, setApiKey] = useState(readStored('ai_api_key', defaultApiKey));
  const [model, setModel] = useState(readStored('ai_model', defaultModel));
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [mcpStatus, setMcpStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Security Posture Summary State
  const [posture, setPosture] = useState<SecurityPostureSummary | null>(null);
  const [loadingPosture, setLoadingPosture] = useState(true);

  // Autonomous Triage State
  const [triageTarget, setTriageTarget] = useState('');
  const [triageReport, setTriageReport] = useState<TriageReport | null>(null);
  const [triaging, setTriaging] = useState(false);
  const [dispatchTemplate, setDispatchTemplate] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Array<{ role: string; content: string; toolCalls?: any[] }>>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mcpToolsRef = useRef<any[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Posture Summary
    fetchSecurityPostureSummary()
      .then(setPosture)
      .catch(console.error)
      .finally(() => setLoadingPosture(false));

    // Connect to MCP REST tools
    const initMcp = async () => {
      try {
        const resp = await fetch(`${MCP_BASE}/rest/tools`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        mcpToolsRef.current = (data.tools || []).map((t: any) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema,
          },
        }));
        setMcpStatus('connected');
      } catch (err) {
        console.error('Failed to load MCP tools:', err);
        setMcpStatus('error');
      }
    };
    initMcp();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

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
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        setAvailableModels(data.data.map((m: any) => m.id));
        if (data.data.length > 0 && !model) {
          setModel(data.data[0].id);
        }
      }
    } catch (err: any) {
      alert(`Failed to fetch models: ${err.message}`);
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
    return data.content?.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n') || '';
  };

  const handleRunTriage = async () => {
    if (!triageTarget.trim()) return;
    setTriaging(true);
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(triageTarget.trim());
      const payload = isUuid
        ? { alert_id: triageTarget.trim() }
        : { ioc: triageTarget.trim() };

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
      const openai = new OpenAI({
        baseURL: baseUrl,
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

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

        if (!msg.tool_calls || msg.tool_calls.length === 0) {
          break;
        }

        for (const tc of msg.tool_calls as any[]) {
          const args = JSON.parse(tc.function.arguments || '{}');
          const resultText = await callMcpTool(tc.function.name, args);
          currentMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.function.name,
            content: resultText,
          });
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
      case 'MALICIOUS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">MALICIOUS</span>;
      case 'SUSPICIOUS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">SUSPICIOUS</span>;
      case 'INFORMATIONAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">INFORMATIONAL</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">BENIGN</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Shieldgrid AI Analyst</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Autonomous threat triage, MITRE correlation, and active response orchestration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                mcpStatus === 'connected' ? 'bg-emerald-400' : mcpStatus === 'error' ? 'bg-red-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-medium">
              MCP: {mcpStatus === 'connected' ? `Connected (${mcpToolsRef.current.length} tools)` : 'Connecting...'}
            </span>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            AI Settings
          </button>
        </div>
      </div>

      {/* Security Posture Banner */}
      {posture && !loadingPosture && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Open Alerts
            </div>
            <div className="text-2xl font-bold text-white">{posture.open_alerts_count}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Activity className="w-4 h-4 text-red-400" /> Critical Incidents
            </div>
            <div className="text-2xl font-bold text-red-400">{posture.critical_alerts_count}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Layers className="w-4 h-4 text-indigo-400" /> Active Cases
            </div>
            <div className="text-2xl font-bold text-white">{posture.active_cases_count}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Zap className="w-4 h-4 text-emerald-400" /> Actions Dispatched
            </div>
            <div className="text-2xl font-bold text-emerald-400">{posture.executed_actions_count}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Threat Intel Hits
            </div>
            <div className="text-2xl font-bold text-blue-400">{posture.high_risk_iocs_cached}</div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Triage & Actions, Right AI Copilot Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Autonomous Triage */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Triage Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Autonomous Incident Triage
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Input an Alert UUID, IP, domain, hash, or CVE to calculate composite risk scores and generate response playbooks.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.1 or alert UUID..."
                  value={triageTarget}
                  onChange={(e) => setTriageTarget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunTriage()}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                onClick={handleRunTriage}
                disabled={triaging || !triageTarget.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Play className={`w-4 h-4 ${triaging ? 'animate-spin' : ''}`} />
                Triage
              </button>
            </div>

            {/* Triage Report Results */}
            {triageReport && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Verdict:</span>
                    {getVerdictBadge(triageReport.verdict)}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Risk Score: </span>
                    <span className="text-sm font-bold font-mono text-white">
                      {triageReport.risk_score}/100
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      triageReport.risk_score >= 80
                        ? 'bg-red-500'
                        : triageReport.risk_score >= 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${triageReport.risk_score}%` }}
                  />
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {triageReport.summary}
                </p>

                {triageReport.mitre_techniques.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase">
                      Detected MITRE Techniques
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {triageReport.mitre_techniques.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-indigo-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Response Actions */}
                {triageReport.recommended_actions.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-amber-400 uppercase flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Recommended Containment Actions
                    </label>
                    <div className="space-y-2">
                      {triageReport.recommended_actions.map((act, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-950 border border-amber-500/30 rounded-lg flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{act.display_name}</div>
                            <div className="text-[11px] text-slate-400">{act.description}</div>
                          </div>
                          <button
                            onClick={() => setDispatchTemplate(act.template_name)}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg transition-colors border border-amber-500/30 whitespace-nowrap"
                          >
                            Dispatch
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

        {/* Right Column: AI Copilot Chat */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Shieldgrid Interactive SOC Assistant</h3>
                <span className="text-[11px] text-slate-400 font-mono">Model: {model}</span>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Bot className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="text-sm font-semibold text-slate-300">Ready to investigate</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Ask questions about active alerts, triage investigations, lookup threat intel, or trigger automated response actions.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => {
              if (msg.role === 'tool') {
                return (
                  <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                      <Wrench className="w-3.5 h-3.5" />
                      Tool Output
                    </div>
                    <pre className="overflow-x-auto max-h-32 text-[11px] text-slate-300">
                      {msg.content}
                    </pre>
                  </div>
                );
              }

              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3.5 text-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="text-[10px] font-semibold tracking-wider uppercase opacity-60 mb-1">
                      {isUser ? 'SOC Analyst' : 'Shieldgrid AI'}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>AI is analyzing telemetry and querying MCP tools...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Shieldgrid (e.g., 'What are the most critical alerts right now?')..."
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !input.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center font-semibold"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">AI Endpoint Settings</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Adapter / API URL</label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Model Name</label>
                {availableModels.length > 0 ? (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  />
                )}
                <button
                  onClick={handleFetchModels}
                  className="mt-2 text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3" /> Fetch available models
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
              >
                Save
              </button>
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
