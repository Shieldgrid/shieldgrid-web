import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { fetchCases, createCase } from '../lib/api';
import type { Case } from '../lib/types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { EmptyState } from '../components/EmptyState';

export default function CasesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const loadCases = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCases();
      setCases(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !newTitle.trim()) return;

    setCreating(true);
    try {
      await createCase({ title: newTitle.trim() });
      setNewTitle('');
      setShowCreateModal(false);
      await loadCases();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Incident Cases</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Track investigations, assign tasks, and link security evidence.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'var(--color-accent)',
              color: '#0B1B33',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            + Create New Case
          </button>
        </div>

        {error && <ErrorDisplay message={error} onRetry={loadCases} />}

        {/* Content */}
        {loading ? (
          <LoadingSkeleton count={4} height="5rem" />
        ) : cases.length === 0 ? (
          <EmptyState
            title="No Active Incident Cases"
            description="Your incident queue is clean! When suspicious activity is detected in the Alert queue, escalate it by opening a new investigation case."
            actionLabel="+ Open First Case"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'border 150ms ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {c.title}
                    </span>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#0B1B33',
                        background: c.status === 'Open' ? 'var(--color-warning)' : 'var(--color-success)',
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    ID: <code style={{ color: 'var(--color-accent)' }}>{c.id}</code> &bull; Created: {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Assigned: <strong style={{ color: 'var(--color-text-primary)' }}>{c.assigned_to ? `${c.assigned_to.slice(0, 8)}...` : 'Unassigned'}</strong>
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-accent)' }}>View Case →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Creating Case */}
        {showCreateModal && (
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
                maxWidth: '460px',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
              }}
            >
              <h3 style={{ marginBottom: '1rem' }}>Open New Incident Case</h3>
              <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                    Case Title / Summary
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suspicious SSH Login Attempts on Server-02"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
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
                    type="submit"
                    disabled={creating}
                    style={{
                      padding: '0.5rem 1.25rem',
                      background: 'var(--color-accent)',
                      color: '#0B1B33',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      cursor: creating ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {creating ? 'Creating...' : 'Create Case'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
