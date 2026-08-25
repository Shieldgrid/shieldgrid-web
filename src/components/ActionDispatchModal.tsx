import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { fetchActionTemplates, executeShieldgridAction } from '../lib/api';
import type { ActionTemplate, ActionExecution } from '../lib/types';

interface ActionDispatchModalProps {
  initialTemplateName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ActionDispatchModal: React.FC<ActionDispatchModalProps> = ({
  initialTemplateName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplate | null>(null);
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState('endpoint');
  const [paramInputs, setParamInputs] = useState<Record<string, string>>({});
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<ActionExecution | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchActionTemplates()
        .then((data) => {
          setTemplates(data);
          if (initialTemplateName) {
            const found = data.find((t) => t.name === initialTemplateName);
            if (found) setSelectedTemplate(found);
          } else if (data.length > 0 && !selectedTemplate) {
            setSelectedTemplate(data[0]);
          }
        })
        .catch((err) => setError(err.message));
    }
  }, [isOpen, initialTemplateName]);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (!selectedTemplate || !targetId.trim()) return;
    setDispatching(true);
    setError(null);
    try {
      const res = await executeShieldgridAction({
        template_name: selectedTemplate.name,
        target_id: targetId.trim(),
        target_type: targetType,
        params: paramInputs,
      });
      setDispatchResult(res);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action dispatch failed');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--sys-text-primary)]">
              {dispatchResult ? 'Action Execution Result' : 'Dispatch Shieldgrid Action'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {dispatchResult
                ? `Dispatched ${selectedTemplate?.display_name || 'Action'}`
                : 'Targeted containment & active incident remediation'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[var(--sys-text-primary)] text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {!dispatchResult ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">
                Action Template
              </label>
              <select
                value={selectedTemplate?.name || ''}
                onChange={(e) => {
                  const t = templates.find((x) => x.name === e.target.value);
                  setSelectedTemplate(t || null);
                  setParamInputs({});
                }}
                className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {templates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.display_name} ({t.provider})
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                {selectedTemplate.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Target Type
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="endpoint">Endpoint Host</option>
                  <option value="user">User Account</option>
                  <option value="ip">IP Address</option>
                  <option value="process">Process PID</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Target Identifier *
                </label>
                <input
                  type="text"
                  placeholder="e.g. host-01, client_123, 192.168.1.50"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {selectedTemplate?.params_schema &&
              Object.keys(selectedTemplate.params_schema).length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-indigo-400 uppercase">
                    Template Parameters
                  </label>
                  {Object.entries(selectedTemplate.params_schema).map(
                    ([paramKey, paramVal]: [string, any]) => (
                      <div key={paramKey}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-300">{paramKey}</span>
                          <span className="text-slate-500">{paramVal?.description || ''}</span>
                        </div>
                        <input
                          type="text"
                          placeholder={paramVal?.default || `Enter ${paramKey}`}
                          value={paramInputs[paramKey] || ''}
                          onChange={(e) =>
                            setParamInputs({ ...paramInputs, [paramKey]: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )
                  )}
                </div>
              )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={dispatching || !targetId.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-[var(--sys-text-primary)] text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Play className={`w-4 h-4 ${dispatching ? 'animate-spin' : ''}`} />
                {dispatching ? 'Dispatching...' : 'Dispatch Action'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Execution Status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    dispatchResult.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : dispatchResult.status === 'failed'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {dispatchResult.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {dispatchResult.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                  {dispatchResult.status === 'running' && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  {dispatchResult.status.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-slate-300">
                <span className="font-semibold text-slate-400">Execution ID:</span>{' '}
                <span className="font-mono text-indigo-400">{dispatchResult.id}</span>
              </div>

              {dispatchResult.output && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">
                    Execution Output
                  </label>
                  <pre className="p-3 bg-slate-900 rounded border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48">
                    {dispatchResult.output}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--sys-text-primary)] text-sm font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
