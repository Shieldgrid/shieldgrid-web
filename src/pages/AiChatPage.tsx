import { useState, useRef, useEffect } from 'react';
import { fetchAlerts, lookupIoc } from '../lib/api';
import type { NormalizedAlert, ThreatIntelResult } from '../lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your SOC AI analyst. I can help you investigate alerts, look up threat intelligence, analyze IOCs, and recommend response actions. What would you like to investigate?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await processUserQuery(input);
      const assistantMessage: Message = { role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = { role: 'assistant', content: `Error: ${error.message}`, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function processUserQuery(query: string): Promise<string> {
    const lower = query.toLowerCase();

    // IOC lookup
    const iocMatch = query.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-fA-F0-9]{32,64}|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|CVE-\d{4}-\d+)\b/);
    if (iocMatch) {
      const ioc = iocMatch[1];
      const result: ThreatIntelResult = await lookupIoc(ioc);
      return formatThreatIntel(ioc, result);
    }

    // Alert analysis
    if (lower.includes('alert') || lower.includes('recent') || lower.includes('latest')) {
      const alerts = await fetchAlerts();
      return formatAlertsSummary(alerts.slice(0, 10));
    }

    // Severity filter
    if (lower.includes('critical') || lower.includes('high severity')) {
      const alerts = await fetchAlerts();
      const critical = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
      return formatAlertsSummary(critical.slice(0, 10));
    }

    // Help
    if (lower.includes('help') || lower.includes('what can')) {
      return `I can help you with:

🔍 **Threat Intelligence**
- Look up any IOC (IP, domain, hash, CVE) by typing it directly
- Example: "Check 192.168.1.100" or "Look up CVE-2024-3094"

📊 **Alert Analysis**
- "Show me recent alerts"
- "What critical alerts do we have?"
- "Analyze alert from web-server-1"

🎯 **Investigation**
- "Investigate suspicious activity on host X"
- "What IOCs are associated with this case?"

🛡️ **Response Recommendations**
- "What should I do about this malware alert?"
- "Recommend containment actions for this incident"

Just type your question and I'll help investigate!`;
    }

    // Default response with context
    return `I understand you're asking about: "${query}"

To help you effectively, try:
- **IOC lookup**: Type any IP, domain, hash, or CVE directly
- **Alert analysis**: "Show me recent alerts" or "What critical alerts exist?"
- **Help**: Type "help" to see all available commands

I'm connected to your Shieldgrid environment and can query real-time data from Wazuh, Velociraptor, and threat intelligence feeds.`;
  }

  function formatThreatIntel(ioc: string, result: ThreatIntelResult): string {
    const verdictEmoji = {
      malicious: '🔴',
      suspicious: '🟠',
      benign: '🟢',
      unknown: '⚪',
    }[result.verdict] || '⚪';

    let response = `## Threat Intelligence: ${ioc}\n\n`;
    response += `**Verdict**: ${verdictEmoji} ${result.verdict.toUpperCase()}\n`;
    response += `**Type**: ${result.ioc_type}\n`;
    response += `**Provider**: ${result.provider}\n`;

    if (result.score !== null && result.score !== undefined) {
      response += `**Score**: ${(result.score * 100).toFixed(1)}%\n`;
    }

    response += `**Cached**: ${result.cached ? 'Yes' : 'No'}\n`;

    if (result.verdict === 'malicious') {
      response += `\n### ⚠️ Recommendation\nThis IOC is classified as **malicious**. Consider:\n`;
      response += `- Blocking this IOC at the firewall level\n`;
      response += `- Creating a case for investigation\n`;
      response += `- Checking for related IOCs in your environment\n`;
    } else if (result.verdict === 'suspicious') {
      response += `\n### ⚡ Recommendation\nThis IOC is classified as **suspicious**. Consider:\n`;
      response += `- Monitoring for additional activity\n`;
      response += `- Enriching with additional threat intel sources\n`;
    }

    return response;
  }

  function formatAlertsSummary(alerts: NormalizedAlert[]): string {
    if (alerts.length === 0) return 'No alerts found matching your criteria.';

    let response = `## Recent Alerts (${alerts.length})\n\n`;

    const bySeverity = alerts.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    response += `**By Severity**:\n`;
    Object.entries(bySeverity).forEach(([sev, count]) => {
      response += `- ${sev}: ${count}\n`;
    });

    response += `\n**Latest Alerts**:\n`;
    alerts.slice(0, 5).forEach((a, i) => {
      response += `${i + 1}. [${a.severity.toUpperCase()}] ${a.source_id} from ${a.connector_id} (${new Date(a.timestamp).toLocaleString()})\n`;
    });

    return response;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-4 border-b border-[#1E3A5F]">
        <h1 className="text-xl font-bold text-white">AI Analyst Chat</h1>
        <p className="text-slate-400 text-sm">Ask questions, investigate alerts, and get response recommendations</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-[#4FD1FF] text-[#0B1B33]'
                : 'bg-[#132B4D] border border-[#1E3A5F] text-white'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#132B4D] border border-[#1E3A5F] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#4FD1FF] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#4FD1FF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#4FD1FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#1E3A5F]">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about alerts, IOCs, threats, or type 'help'..."
            className="flex-1 bg-[#132B4D] border border-[#1E3A5F] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#4FD1FF] transition-colors"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-[#4FD1FF] text-[#0B1B33] rounded-xl font-semibold hover:bg-[#4FD1FF]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
