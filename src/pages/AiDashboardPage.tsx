import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';

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

  const [endpoint, setEndpoint] = useState(readStored('ai_endpoint', defaultEndpoint));
  const [apiKey, setApiKey] = useState(readStored('ai_api_key', defaultApiKey));
  const [model, setModel] = useState(readStored('ai_model', defaultModel));
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [mcpStatus, setMcpStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mcpToolsRef = useRef<any[]>([]);

  useEffect(() => {
    // Test MCP REST connection and fetch tools
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
          }
        }));
        setMcpStatus('connected');
        console.log('MCP tools loaded via REST:', mcpToolsRef.current.length);
      } catch (err) {
        console.error('Failed to load MCP tools:', err);
        setMcpStatus('error');
      }
    };
    initMcp();
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('ai_endpoint', endpoint);
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_model', model);
    alert('Settings saved!');
  };

  const handleFetchModels = async () => {
    try {
      // Force proxy usage for api.ai.camer.digital to avoid CORS OPTIONS 401 errors
      const { baseUrl, isProxy } = resolveEndpoint(endpoint);
      if (!baseUrl) {
        alert('Please enter a valid API URL.');
        return;
      }
      try {
        new URL(baseUrl);
      } catch {
        alert(`Invalid API URL: "${baseUrl}"`);
        return;
      }
      const modelsUrl = buildModelsUrl(baseUrl, isProxy);
      
      const response = await fetch(modelsUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        setAvailableModels(data.data.map((m: any) => m.id));
        if (data.data.length > 0 && !model) {
          setModel(data.data[0].id);
        }
        alert('Models fetched successfully!');
      } else {
        alert('Could not parse models from response.');
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

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Force proxy usage for api.ai.camer.digital to avoid CORS OPTIONS 401 errors
      const { baseUrl } = resolveEndpoint(endpoint);
      if (!baseUrl) {
        throw new Error('Please enter a valid API URL in the AI Settings panel.');
      }
      try {
        new URL(baseUrl);
      } catch {
        throw new Error(`Invalid API URL: "${baseUrl}"`);
      }

      const openai = new OpenAI({
        baseURL: baseUrl,
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, 
      });

      const tools = mcpToolsRef.current;
      let currentMessages: any[] = [...messages, userMessage];

      // Agent loop
      while (true) {
        const response = await openai.chat.completions.create({
          model: model || 'gpt-4o',
          messages: currentMessages,
          tools: tools.length > 0 ? tools : undefined,
        });

        const msg = response.choices[0].message;
        currentMessages.push(msg);
        setMessages([...currentMessages]);

        // Check if there are tool calls
        if (!msg.tool_calls || msg.tool_calls.length === 0) {
          break; // No more tool calls, we are done
        }

        // Execute tools via REST
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

  return (
    <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 4rem)' }}>
      {/* Settings Panel */}
      <div style={{ width: '300px', background: 'var(--color-bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>AI Settings</h2>

        {/* MCP status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: mcpStatus === 'connected' ? '#4ade80' : mcpStatus === 'error' ? '#f87171' : '#fbbf24' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          MCP: {mcpStatus === 'connected' ? `Connected (${mcpToolsRef.current.length} tools)` : mcpStatus === 'error' ? 'Error — MCP server down' : 'Connecting...'}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Adapter/API URL</label>
          <input 
            type="text" 
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Model</label>
          {availableModels.length > 0 ? (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
            >
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input 
              type="text" 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o"
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
            />
          )}
          <button 
            onClick={handleFetchModels}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--color-accent)', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '0.75rem', marginTop: '0.25rem' }}
          >
            Fetch Models
          </button>
        </div>

        <button 
          onClick={handleSaveSettings}
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-accent)', color: '#0B1B33', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: '1rem' }}
        >
          Save Settings
        </button>
      </div>

      {/* Chat Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-base)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>AI Assistant</h2>
        </div>
        
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, idx) => {
            if (msg.role === 'tool' || msg.tool_calls) return null; // hide raw tool data
            return (
              <div key={idx} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-bg-base)',
                color: msg.role === 'user' ? '#0B1B33' : 'var(--color-text-primary)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                maxWidth: '80%',
                border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  {msg.role}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          {isProcessing && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--color-text-secondary)', padding: '1rem' }}>
              AI is thinking...
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-base)', display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about your alerts, cases, or connectors..."
            style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontSize: '1rem' }}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isProcessing}
            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-accent)', color: '#0B1B33', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: isProcessing ? 0.7 : 1 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
