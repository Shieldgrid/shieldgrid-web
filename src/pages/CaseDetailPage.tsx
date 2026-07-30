import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import {
  fetchCase,
  updateCase,
  fetchCaseAlerts,
  attachCaseAlert,
  detachCaseAlert,
  fetchAlerts,
  executeAction,
  fetchCaseActions,
} from '../lib/api';
import type { Case, NormalizedAlert, ActionResult, AuditLog } from '../lib/types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [attachedAlertIds, setAttachedAlertIds] = useState<string[]>([]);
  const [allAlerts, setAllAlerts] = useState<NormalizedAlert[]>([]);
  const [actionHistory, setActionHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attach modal state
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedAlertToAttach, setSelectedAlertToAttach] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Response action modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'isolate' | 'unisolate'>('isolate');
  const [targetId, setTargetId] = useState('');
  const [connectorId] = useState('velociraptor');
  const [actionExecuting, setActionExecuting] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const loadCaseDetails = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    setLoading(true);
    setError(null);
    try {
      const [c, alertIds, alertsList, history] = await Promise.all([
        fetchCase(id),
        fetchCaseAlerts(id),
        fetchAlerts().catch(() => []),
        fetchCaseActions(id).catch(() => []),
      ]);
      setCaseData(c);
      setAttachedAlertIds(alertIds);
      setAllAlerts(alertsList);
      setActionHistory(history);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    loadCaseDetails();
  }, [loadCaseDetails]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!isAuthenticated || !id || !caseData) return;
    setActionLoading(true);
    try {
      const updated = await updateCase(id, { status: newStatus });
      setCaseData(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update case status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignToSelf = async () => {
    if (!isAuthenticated || !id || !caseData || !user?.sub) return;
    setActionLoading(true);
    try {
      const updated = await updateCase(id, { assigned_to: user.sub });
      setCaseData(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to assign case');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttachAlert = async () => {
    if (!isAuthenticated || !id || !selectedAlertToAttach) return;
    setActionLoading(true);
    try {
      await attachCaseAlert(id, selectedAlertToAttach);
      setShowAttachModal(false);
      setSelectedAlertToAttach('');
      await loadCaseDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to attach alert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDetachAlert = async (alertId: string) => {
    if (!isAuthenticated || !id) return;
    setActionLoading(true);
    try {
      await detachCaseAlert(id, alertId);
      await loadCaseDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to detach alert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!id || !targetId.trim()) return;
    setActionExecuting(true);
    setActionResult(null);
    try {
      const result = await executeAction(id, {
        connector_id: connectorId,
        action_type: actionType,
        target_id: targetId.trim(),
      });
      setActionResult(result);
      // Refresh action history
      const history = await fetchCaseActions(id).catch(() => []);
      setActionHistory(history);
    } catch (err: unknown) {
      setActionResult({
        success: false,
        detail: err instanceof Error ? err.message : 'Request failed',
        is_timeout: false,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setActionExecuting(false);
    }
  };

  const openActionModal = (type: 'isolate' | 'unisolate') => {
    setActionType(type);
    setTargetId('');
    setActionResult(null);
    setShowActionModal(true);
  };

  const attachedAlertObjects = allAlerts.filter((a) => attachedAlertIds.includes(a.id));
  const unattachedAlerts = allAlerts.filter((a) => !attachedAlertIds.includes(a.id));

  const availableClientIds = Array.from(new Set(
    attachedAlertObjects
      .filter((a) => a.connector_id === 'velociraptor')
      .map((a) => (a.raw_payload as any)?.client_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  ));

  const getActionBadge = (action: string) => {
    if (action === 'action_success') return { label: 'SUCCESS', color: 'var(--color-accent)' };
    if (action === 'action_timeout') return { label: 'TIMEOUT', color: '#f59e0b' };
    if (action === 'action_failure') return { label: 'FAILED', color: 'var(--color-critical)' };
    if (action === 'action_request') return { label: 'REQUESTED', color: 'var(--color-text-muted)' };
    return { label: action.toUpperCase(), color: 'var(--color-text-muted)' };
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Navigation back button */}
        <div>
          <button
            onClick={() => navigate('/cases')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: 0,
            }}
          >
            ← Back to Cases
          </button>
        </div>

        {error && <ErrorDisplay message={error} onRetry={loadCaseDetails} />}

        {loading ? (
          <LoadingSkeleton count={3} height="6rem" />
        ) : !caseData ? (
          <ErrorDisplay message="Case not found" />
        ) : (
          <>
            {/* Header Card */}
            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                  CASE ID: <code style={{ color: 'var(--color-accent)' }}>{caseData.id}</code>
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{caseData.title}</h1>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                  Created: {new Date(caseData.created_at).toLocaleString()} &bull; Last Updated: {new Date(caseData.updated_at).toLocaleString()}
                </div>
              </div>

              {/* Status & Assign Controls */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                    STATUS
                  </label>
                  <select
                    value={caseData.status}
                    disabled={actionLoading}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                    ASSIGNED TO
                  </label>
                  {caseData.assigned_to ? (
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      {caseData.assigned_to.slice(0, 8)}...
                    </span>
                  ) : (
                    <button
                      onClick={handleAssignToSelf}
                      disabled={actionLoading}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: 'var(--color-accent)',
                        color: '#0B1B33',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Assign to Me
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Response Actions Section ──────────────────────────────── */}
            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                    <h3 style={{ margin: 0 }}>Response Actions</h3>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                    Execute network isolation actions against an endpoint via Velociraptor. Requires Admin role.
                    <br/>
                    {availableClientIds.length === 0 && (
                      <span style={{ color: 'var(--color-critical)' }}>
                        (Requires an attached Velociraptor alert containing a client_id to enable actions)
                      </span>
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    id="btn-isolate-endpoint"
                    disabled={availableClientIds.length === 0}
                    onClick={() => {
                      setTargetId(availableClientIds[0] || '');
                      openActionModal('isolate');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(239,68,68,0.1)',
                      color: 'var(--color-critical)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: availableClientIds.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: availableClientIds.length === 0 ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => availableClientIds.length > 0 && (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                    onMouseLeave={(e) => availableClientIds.length > 0 && (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  >
                    ⛔ Isolate Endpoint
                  </button>
                  <button
                    id="btn-unisolate-endpoint"
                    disabled={availableClientIds.length === 0}
                    onClick={() => {
                      setTargetId(availableClientIds[0] || '');
                      openActionModal('unisolate');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(16,185,129,0.1)',
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.4)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: availableClientIds.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: availableClientIds.length === 0 ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => availableClientIds.length > 0 && (e.currentTarget.style.background = 'rgba(16,185,129,0.2)')}
                    onMouseLeave={(e) => availableClientIds.length > 0 && (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
                  >
                    ✅ Unisolate Endpoint
                  </button>
                </div>
              </div>

              {/* Action History */}
              {actionHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                    ACTION HISTORY ({actionHistory.length})
                  </div>
                  {actionHistory.map((log) => {
                    const badge = getActionBadge(log.action);
                    return (
                      <div
                        key={log.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-base)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            background: `${badge.color}20`,
                            color: badge.color,
                            border: `1px solid ${badge.color}50`,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {badge.label}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <code style={{ color: 'var(--color-text-secondary)', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                            {log.target}
                          </code>
                        </div>
                        <span style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap', fontSize: '0.72rem', flexShrink: 0 }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.875rem', margin: 0 }}>
                  No response actions have been executed for this case yet.
                </p>
              )}
            </div>

            {/* Linked Evidence & Alerts Section */}
            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Linked Alerts &amp; Telemetry Evidence ({attachedAlertIds.length})</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    Alerts attached to this case for evidence analysis.
                  </p>
                </div>
                <button
                  onClick={() => setShowAttachModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--color-accent)',
                    color: '#0B1B33',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  + Link Alert
                </button>
              </div>

              {attachedAlertIds.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                  No alerts currently linked to this case. Click "+ Link Alert" to attach evidence from sensor queue.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {attachedAlertIds.map((alertId) => {
                    const obj = attachedAlertObjects.find((a) => a.id === alertId);
                    return (
                      <div
                        key={alertId}
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-base)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <code style={{ color: 'var(--color-accent)', fontSize: '0.85rem' }}>{alertId}</code>
                            {obj && (
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                                ({obj.connector_id} &bull; {obj.source})
                              </span>
                            )}
                          </div>
                          {obj && (
                            <pre
                              style={{
                                marginTop: '0.5rem',
                                background: 'var(--color-bg-surface)',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                color: 'var(--color-text-secondary)',
                                overflowX: 'auto',
                                maxHeight: '100px',
                              }}
                            >
                              {/* SECURITY: Rendered plain text */}
                              {JSON.stringify(obj.raw_payload, null, 2)}
                            </pre>
                          )}
                        </div>
                        <button
                          onClick={() => handleDetachAlert(alertId)}
                          disabled={actionLoading}
                          style={{
                            padding: '0.375rem 0.75rem',
                            background: 'transparent',
                            border: '1px solid var(--color-critical)',
                            color: 'var(--color-critical)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Detach
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Response Action Modal ─────────────────────────────────────── */}
        {showActionModal && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(11, 27, 51, 0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                background: 'var(--color-bg-surface)',
                border: `1px solid ${actionType === 'isolate' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {/* Modal header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{actionType === 'isolate' ? '⛔' : '✅'}</span>
                  <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                    {actionType === 'isolate' ? 'Isolate Endpoint' : 'Unisolate Endpoint'}
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {actionType === 'isolate'
                    ? 'This will apply nftables network quarantine rules via Velociraptor, cutting off all traffic except DNS and Velociraptor server access.'
                    : 'This will remove the nftables quarantine rules via Velociraptor, restoring full network access.'}
                </p>
              </div>

              {/* Warning banner */}
              {actionType === 'isolate' && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    color: '#f59e0b',
                  }}
                >
                  ⚠️ <strong>High-impact action.</strong> This will drop all network connections to the target. However, it can be instantly reversed by executing the Unisolate action from this same menu.
                </div>
              )}

              {/* Target input */}
              <div>
                <label
                  htmlFor="action-target-id"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem' }}
                >
                  Target Velociraptor Client ID
                </label>
                <select
                  id="action-target-id"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  disabled={actionExecuting}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                >
                  {availableClientIds.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Connector: <code>{connectorId}</code>
                </div>
              </div>

              {/* Result feedback */}
              {actionExecuting && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    color: '#a5b4fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  Executing — polling Velociraptor for flow status (up to 30s)…
                </div>
              )}

              {actionResult && (
                <div
                  style={{
                    padding: '0.875rem 1rem',
                    background: actionResult.success
                      ? 'rgba(16,185,129,0.08)'
                      : actionResult.is_timeout
                      ? 'rgba(245,158,11,0.08)'
                      : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${actionResult.success ? 'rgba(16,185,129,0.3)' : actionResult.is_timeout ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{
                    fontWeight: 700,
                    color: actionResult.success ? '#10b981' : actionResult.is_timeout ? '#f59e0b' : 'var(--color-critical)',
                    marginBottom: '0.25rem',
                  }}>
                    {actionResult.success ? '✅ Success' : actionResult.is_timeout ? '⏱ Timeout — Outcome Unknown' : '❌ Failed'}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>{actionResult.detail}</div>
                  {actionResult.is_timeout && (
                    <div style={{ marginTop: '0.375rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      The action was dispatched but the endpoint did not confirm within 30s. It may still complete. Verify manually in Velociraptor.
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setShowActionModal(false); setActionResult(null); }}
                  disabled={actionExecuting}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-secondary)',
                    cursor: actionExecuting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionResult ? 'Close' : 'Cancel'}
                </button>
                {!actionResult && (
                  <button
                    id={`btn-confirm-${actionType}`}
                    type="button"
                    disabled={!targetId.trim() || actionExecuting}
                    onClick={handleExecuteAction}
                    style={{
                      padding: '0.5rem 1.25rem',
                      background: actionType === 'isolate' ? 'var(--color-critical)' : '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: !targetId.trim() || actionExecuting ? 'not-allowed' : 'pointer',
                      opacity: !targetId.trim() || actionExecuting ? 0.6 : 1,
                    }}
                  >
                    {actionExecuting
                      ? 'Executing…'
                      : actionType === 'isolate'
                      ? 'Confirm Isolate'
                      : 'Confirm Unisolate'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal for Linking Alert */}
        {showAttachModal && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(11, 27, 51, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '500px',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
              }}
            >
              <h3 style={{ marginBottom: '1rem' }}>Attach Alert to Case</h3>
              {unattachedAlerts.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  No unlinked alerts available in the queue.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                      Select Alert to Attach
                    </label>
                    <select
                      value={selectedAlertToAttach}
                      onChange={(e) => setSelectedAlertToAttach(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="">-- Choose an Alert --</option>
                      {unattachedAlerts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.connector_id} | {a.severity.toUpperCase()} | {a.source} ({a.id.slice(0, 8)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowAttachModal(false)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedAlertToAttach || actionLoading}
                      onClick={handleAttachAlert}
                      style={{
                        padding: '0.5rem 1.25rem',
                        background: 'var(--color-accent)',
                        color: '#0B1B33',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700,
                        cursor: selectedAlertToAttach && !actionLoading ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {actionLoading ? 'Attaching...' : 'Attach Alert'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
