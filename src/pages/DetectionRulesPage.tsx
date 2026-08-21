import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Code, 
  Tag, 
  Layers,
  Sparkles
} from 'lucide-react';
import { fetchDetectionRules, updateDetectionRule } from '../lib/api';
import type { DetectionRule, Severity } from '../lib/types';
import { EmptyState } from '../components/EmptyState';
import { ErrorDisplay } from '../components/ErrorDisplay';

export const DetectionRulesPage: React.FC = () => {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [connectorFilter, setConnectorFilter] = useState<string>('all');

  // Selected rule for detail / VQL inspection
  const [selectedRule, setSelectedRule] = useState<DetectionRule | null>(null);

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDetectionRules();
      setRules(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load detection rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleRule = async (rule: DetectionRule) => {
    try {
      const updated = await updateDetectionRule(rule.id, { enabled: !rule.enabled });
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedRule?.id === updated.id) {
        setSelectedRule(updated);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update rule state');
    }
  };

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            LOW
          </span>
        );
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rule_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mitre_techniques.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || r.severity === severityFilter;
    const matchesConnector = connectorFilter === 'all' || r.connector_id === connectorFilter;

    return matchesSearch && matchesSeverity && matchesConnector;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Detection Rules</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Real-time detection catalog with automated VQL & SIEM correlation logic
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRules}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorDisplay message={error} onRetry={loadRules} />}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rules by name, ID, or MITRE technique (e.g. T1003)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={connectorFilter}
            onChange={(e) => setConnectorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Connectors</option>
            <option value="velociraptor">Velociraptor</option>
            <option value="wazuh">Wazuh</option>
          </select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Rule ID</th>
                <th className="px-6 py-3.5">Name & Category</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">MITRE ATT&CK</th>
                <th className="px-6 py-3.5">Connector</th>
                <th className="px-6 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <EmptyState
                      icon={<Shield className="w-8 h-8 text-slate-500" />}
                      title="No detection rules found"
                      description="No rules match the selected filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          rule.enabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-600/30'
                        }`}
                      >
                        {rule.enabled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Disabled
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-indigo-400">
                      {rule.rule_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{rule.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Layers className="w-3 h-3 text-slate-500" />
                        {rule.category}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getSeverityBadge(rule.severity)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {rule.mitre_techniques.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-300 flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5 text-indigo-400" />
                            {tech}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 capitalize">
                      {rule.connector_id}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRule(rule)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <Code className="w-3.5 h-3.5 text-indigo-400" />
                        View Query
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rule Query Inspector Modal */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-indigo-400 font-bold">
                    {selectedRule.rule_id}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs uppercase font-mono text-slate-400">
                    {selectedRule.connector_id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedRule.name}
                </h3>
              </div>
              <div>{getSeverityBadge(selectedRule.severity)}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedRule.description}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4 text-indigo-400" />
                Detection Logic & Query Expression
              </label>
              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-64">
                {selectedRule.query_or_vql}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Tactics: {selectedRule.mitre_tactics.join(', ')}</span>
              </div>
              <button
                onClick={() => setSelectedRule(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
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
export default DetectionRulesPage;
