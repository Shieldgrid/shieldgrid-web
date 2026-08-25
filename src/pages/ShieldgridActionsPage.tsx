import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Server,
  FileCode,
  Search,
  Filter
} from 'lucide-react';
import { fetchActionTemplates, fetchActionExecutions, executeShieldgridAction } from '../lib/api';
import type { ActionTemplate, ActionExecution } from '../lib/types';
import { EmptyState } from '../components/EmptyState';
import { ErrorDisplay } from '../components/ErrorDisplay';

export const ShieldgridActionsPage: React.FC = () => {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [executions, setExecutions] = useState<ActionExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dispatch modal state
  const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplate | null>(null);
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState('endpoint');
  const [paramInputs, setParamInputs] = useState<Record<string, string>>({});
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<ActionExecution | null>(null);

  // Filter & Search
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');

  // Execution detail drawer
  const [selectedExecution, setSelectedExecution] = useState<ActionExecution | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tmplData, execData] = await Promise.all([
        fetchActionTemplates(),
        fetchActionExecutions(100),
      ]);
      setTemplates(tmplData);
      setExecutions(execData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDispatch = (tmpl: ActionTemplate) => {
    setSelectedTemplate(tmpl);
    setTargetId('');
    setParamInputs({});
    setDispatchResult(null);
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !targetId.trim()) return;

    setDispatching(true);
    try {
      const res = await executeShieldgridAction({
        template_name: selectedTemplate.name,
        target_id: targetId.trim(),
        target_type: targetType,
        params: paramInputs,
      });
      setDispatchResult(res);
      // Reload executions list
      const updatedExecs = await fetchActionExecutions(100);
      setExecutions(updatedExecs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action execution failed');
    } finally {
      setDispatching(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesSearch =
      t.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'critical':
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            {risk.toUpperCase()}
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'running':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Running
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--sys-text-primary)] tracking-tight">Shieldgrid Actions</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Automated and analyst-orchestrated active response, containment, and forensic collection
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorDisplay message={error} onRetry={loadData} />}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Action Catalog ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Execution History ({executions.length})
        </button>
      </div>

      {/* Action Catalog View */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search actions by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                <option value="containment">Containment</option>
                <option value="remediation">Remediation</option>
                <option value="forensics">Forensics</option>
                <option value="network">Network</option>
              </select>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <EmptyState
              icon={<Zap className="w-8 h-8 text-slate-500" />}
              title="No action templates found"
              description="No action templates match the filter criteria."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-indigo-400 font-mono font-medium">
                          {template.category}
                        </span>
                        <h3 className="text-base font-semibold text-[var(--sys-text-primary)] group-hover:text-indigo-300 transition-colors mt-0.5">
                          {template.display_name}
                        </h3>
                      </div>
                      <div>{getRiskBadge(template.risk_level)}</div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {template.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <Server className="w-3.5 h-3.5" />
                      <span>Provider: {template.provider}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">
                      {template.name}
                    </span>
                    <button
                      onClick={() => handleOpenDispatch(template)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[var(--sys-text-primary)] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Dispatch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Execution History View */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Target</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Initiated By</th>
                  <th className="px-6 py-3.5">Started</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                {executions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-sans">
                      No actions executed yet.
                    </td>
                  </tr>
                ) : (
                  executions.map((exec) => (
                    <tr key={exec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[var(--sys-text-primary)] font-sans">
                        {exec.template_name}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <span className="text-slate-500 text-[10px] uppercase mr-1">
                          {exec.target_type}:
                        </span>
                        {exec.target_id}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(exec.status)}</td>
                      <td className="px-6 py-4 text-slate-400 font-sans">{exec.initiated_by}</td>
                      <td className="px-6 py-4 text-slate-400 font-sans">
                        {new Date(exec.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedExecution(exec)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispatch Action Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-mono text-indigo-400">
                  {selectedTemplate.category}
                </span>
                <h3 className="text-lg font-bold text-[var(--sys-text-primary)] mt-0.5">
                  {selectedTemplate.display_name}
                </h3>
              </div>
              <div>{getRiskBadge(selectedTemplate.risk_level)}</div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedTemplate.description}
            </p>

            <form onSubmit={handleExecute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Identifier (Client ID / Hostname / IP) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C.123456789 or 192.168.1.50"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-[var(--sys-text-primary)] placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Type
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-[var(--sys-text-primary)] focus:outline-none focus:border-indigo-500"
                >
                  <option value="endpoint">Endpoint / Host</option>
                  <option value="agent">Wazuh Agent</option>
                  <option value="ip">IP Address</option>
                  <option value="user">User Account</option>
                </select>
              </div>

              {/* Dynamic schema inputs if needed */}
              {selectedTemplate.name === 'terminate_process' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Process Name or PID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. powershell.exe or 4128"
                    value={paramInputs['name'] || ''}
                    onChange={(e) => setParamInputs({ ...paramInputs, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-[var(--sys-text-primary)] placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {selectedTemplate.name === 'quarantine_file' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    File Absolute Path
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="C:\\Windows\\Temp\\malware.exe"
                    value={paramInputs['path'] || ''}
                    onChange={(e) => setParamInputs({ ...paramInputs, path: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-[var(--sys-text-primary)] placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {dispatchResult && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Action Dispatched Successfully</strong>
                    <span className="font-mono mt-0.5 block">{dispatchResult.output}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={dispatching || !targetId.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-[var(--sys-text-primary)] text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  {dispatching && <Clock className="w-4 h-4 animate-spin" />}
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execution Output Drawer / Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--sys-text-primary)]">
                  Execution Output: {selectedExecution.template_name}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Target: {selectedExecution.target_id} | Status: {selectedExecution.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                className="text-slate-400 hover:text-[var(--sys-text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Execution Log Output
              </label>
              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-80">
                {selectedExecution.output || selectedExecution.error || 'No output recorded'}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedExecution(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShieldgridActionsPage;
