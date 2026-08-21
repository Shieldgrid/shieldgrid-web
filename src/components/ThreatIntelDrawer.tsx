import React, { useState, useEffect } from 'react';
import { X, Search, ShieldAlert, ShieldCheck, HelpCircle, Loader2, Database, Zap } from 'lucide-react';
import { lookupIoc } from '../lib/api';
import type { ThreatIntelResult, ThreatVerdict } from '../lib/types';

interface ThreatIntelDrawerProps {
  initialIoc?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatIntelDrawer: React.FC<ThreatIntelDrawerProps> = ({
  initialIoc,
  isOpen,
  onClose,
}) => {
  const [iocInput, setIocInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThreatIntelResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialIoc) {
      setIocInput(initialIoc);
      handleLookup(initialIoc);
    }
  }, [initialIoc]);

  const handleLookup = async (targetIoc?: string) => {
    const val = (targetIoc ?? iocInput).trim();
    if (!val) return;

    setLoading(true);
    setError(null);
    try {
      const data = await lookupIoc(val);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getVerdictBadge = (verdict: ThreatVerdict) => {
    switch (verdict) {
      case 'malicious':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> Malicious
          </span>
        );
      case 'suspicious':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> Suspicious
          </span>
        );
      case 'benign':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Benign
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <HelpCircle className="w-3.5 h-3.5" /> Unknown / Unchecked
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Shieldgrid Threat Intelligence</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={iocInput}
                onChange={(e) => setIocInput(e.target.value)}
                placeholder="Enter IP, Hash, Domain, URL, or CVE (e.g. CVE-2023-38606)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !iocInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Enrich
            </button>
          </form>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Verdict Summary Card */}
              <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                      {result.ioc_type}
                    </span>
                    <h3 className="text-base font-mono font-medium text-white break-all">
                      {result.ioc_value}
                    </h3>
                  </div>
                  <div>{getVerdictBadge(result.verdict)}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Provider:</span>
                    <p className="text-slate-200 font-medium capitalize mt-0.5">{result.provider}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Score:</span>
                    <p className="text-slate-200 font-medium mt-0.5">
                      {result.score !== null && result.score !== undefined
                        ? (result.score * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Source Cache:</span>
                    <p className="text-slate-200 font-medium mt-0.5">
                      {result.cached ? 'PostgreSQL Cache (Hit)' : 'Live API Query'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Checked At:</span>
                    <p className="text-slate-200 font-medium mt-0.5">
                      {new Date(result.checked_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Raw Intelligence Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  Provider Intelligence Details
                </h4>
                <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-96">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
              <Zap className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Search any IP, Domain, Hash, or CVE to inspect threat scores and verdicts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
