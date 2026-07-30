import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { fetchCase, updateCase, fetchCaseAlerts, attachCaseAlert, detachCaseAlert, fetchAlerts } from '../lib/api';
import type { Case, NormalizedAlert } from '../lib/types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [attachedAlertIds, setAttachedAlertIds] = useState<string[]>([]);
  const [allAlerts, setAllAlerts] = useState<NormalizedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attach modal state
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedAlertToAttach, setSelectedAlertToAttach] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadCaseDetails = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const [c, alertIds, alertsList] = await Promise.all([
        fetchCase(token, id),
        fetchCaseAlerts(token, id),
        fetchAlerts(token).catch(() => []),
      ]);
      setCaseData(c);
      setAttachedAlertIds(alertIds);
      setAllAlerts(alertsList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    loadCaseDetails();
  }, [loadCaseDetails]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!token || !id || !caseData) return;
    setActionLoading(true);
    try {
      const updated = await updateCase(token, id, { status: newStatus });
      setCaseData(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update case status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignToSelf = async () => {
    if (!token || !id || !caseData || !user?.sub) return;
    setActionLoading(true);
    try {
      const updated = await updateCase(token, id, { assigned_to: user.sub });
      setCaseData(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to assign case');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttachAlert = async () => {
    if (!token || !id || !selectedAlertToAttach) return;
    setActionLoading(true);
    try {
      await attachCaseAlert(token, id, selectedAlertToAttach);
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
    if (!token || !id) return;
    setActionLoading(true);
    try {
      await detachCaseAlert(token, id, alertId);
      await loadCaseDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to detach alert');
    } finally {
      setActionLoading(false);
    }
  };

  const attachedAlertObjects = allAlerts.filter((a) => attachedAlertIds.includes(a.id));
  const unattachedAlerts = allAlerts.filter((a) => !attachedAlertIds.includes(a.id));

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
                  <h3>Linked Alerts & Telemetry Evidence ({attachedAlertIds.length})</h3>
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

        {/* Modal for Linking Alert */}
        {showAttachModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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
