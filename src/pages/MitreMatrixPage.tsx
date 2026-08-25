import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Info
} from 'lucide-react';
import { fetchMitreMatrix } from '../lib/api';
import type { MitreMatrixResponse, MitreTechnique, MitreTactic } from '../lib/types';
import { EmptyState } from '../components/EmptyState';
import { ErrorDisplay } from '../components/ErrorDisplay';

export const MitreMatrixPage: React.FC = () => {
  const [matrixData, setMatrixData] = useState<MitreMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected technique for detailed inspector
  const [selectedTechnique, setSelectedTechnique] = useState<{
    technique: MitreTechnique;
    tactic: MitreTactic;
  } | null>(null);

  const loadMatrix = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMitreMatrix();
      setMatrixData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load MITRE ATT&CK Matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Grid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--sys-text-primary)] tracking-tight">MITRE ATT&CK Enterprise Matrix</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Tactics, techniques, and real-time detection coverage across the cyber kill chain
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMatrix}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorDisplay message={error} onRetry={loadMatrix} />}

      {/* Metrics Banner */}
      {matrixData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--sys-text-primary)]">{matrixData.columns.length}</div>
              <div className="text-xs text-slate-400 font-medium">Enterprise Tactics</div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--sys-text-primary)]">{matrixData.total_techniques}</div>
              <div className="text-xs text-slate-400 font-medium">Mapped Techniques</div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {matrixData.total_active_detections}
              </div>
              <div className="text-xs text-slate-400 font-medium">Active Detections</div>
            </div>
          </div>
        </div>
      )}

      {/* 14-Column Matrix Visualizer */}
      {!matrixData && !loading && (
        <EmptyState
          icon={<Grid className="w-8 h-8 text-slate-500" />}
          title="No matrix data available"
          description="Unable to load MITRE ATT&CK Matrix records."
        />
      )}

      {matrixData && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-[1400px]">
            {matrixData.columns.map((col) => (
              <div
                key={col.tactic.id}
                className="flex-1 min-w-[200px] flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-md"
              >
                {/* Column Header */}
                <div className="p-3 bg-slate-950/80 border-b border-slate-800">
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold block">
                    {col.tactic.id}
                  </span>
                  <h3 className="text-xs font-bold text-[var(--sys-text-primary)] truncate" title={col.tactic.name}>
                    {col.tactic.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {col.techniques.length} techniques
                  </span>
                </div>

                {/* Technique Cards */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                  {col.techniques.length === 0 ? (
                    <div className="text-[11px] text-slate-600 italic text-center py-6">
                      No techniques
                    </div>
                  ) : (
                    col.techniques.map((tech) => (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTechnique({ technique: tech, tactic: col.tactic })}
                        className="p-2.5 bg-slate-950/90 border border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-800/40 rounded-lg cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-indigo-400 group-hover:text-indigo-300">
                            {tech.id}
                          </span>
                          {tech.detection_count > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {tech.detection_count}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-medium text-slate-200 group-hover:text-[var(--sys-text-primary)] line-clamp-2 leading-snug">
                          {tech.name}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technique Inspector Modal */}
      {selectedTechnique && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-indigo-400 font-bold">
                    {selectedTechnique.technique.id}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedTechnique.tactic.name} ({selectedTechnique.tactic.id})
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--sys-text-primary)] mt-1">
                  {selectedTechnique.technique.name}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {selectedTechnique.technique.detection_count} Active Detections
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Technique Description
              </label>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
                {selectedTechnique.technique.description}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTechnique(null)}
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
export default MitreMatrixPage;
