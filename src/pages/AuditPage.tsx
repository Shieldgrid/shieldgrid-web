import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { fetchAuditLogs } from '../lib/api';
import type { AuditLog } from '../lib/types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { EmptyState } from '../components/EmptyState';

export default function AuditPage() {
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>System Audit Trail</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Immutable record of administrative, authentication, and case management actions.
            </p>
          </div>
          <button
            onClick={loadLogs}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh Audit Log
          </button>
        </div>

        {error && <ErrorDisplay message={error} onRetry={loadLogs} />}

        {loading ? (
          <LoadingSkeleton count={5} height="3.5rem" />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Audit Entries Found"
            description="No audit events have been recorded yet. Perform actions like logging in or updating cases to generate audit records."
          />
        ) : (
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-secondary)' }}>TIMESTAMP</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-secondary)' }}>ACTION</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-secondary)' }}>ACTOR ID</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-secondary)' }}>TARGET</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'var(--color-bg-elevated)',
                          color: 'var(--color-accent)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-primary)' }}>
                      {log.actor_id ? <code style={{ fontSize: '0.8rem' }}>{log.actor_id}</code> : 'System'}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-primary)' }}>
                      <code style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{log.target}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}
