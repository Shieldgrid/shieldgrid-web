import { useEffect, useState, useCallback } from 'react';
import { fetchHealth } from '../lib/api';
import type { HealthResponse } from '../lib/types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';

export default function ConnectorsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch connector status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Connector Integrations</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              System connectivity, health status, and healthcheck telemetry for registered security connectors.
            </p>
          </div>
          <span
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-accent)',
              border: '1px solid var(--color-accent)',
            }}
          >
            Admin Gated Access ✓
          </span>
        </div>

        {error && <ErrorDisplay message={error} onRetry={loadHealth} />}

        {loading ? (
          <LoadingSkeleton count={3} height="6rem" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {(health?.connectors ?? []).map((conn) => {
              const statusColor =
                conn.status === 'healthy'
                  ? 'var(--color-success)'
                  : conn.status === 'degraded'
                  ? 'var(--color-warning)'
                  : 'var(--color-critical)';

              return (
                <div
                  key={conn.id}
                  style={{
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h3 style={{ textTransform: 'capitalize', margin: 0 }}>{conn.id}</h3>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#0B1B33',
                          background: statusColor,
                        }}
                      >
                        {conn.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      Ingests alert and endpoint telemetry directly into Shieldgrid Core.
                    </p>

                    {conn.reason && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'color-mix(in srgb, var(--color-critical) 10%, transparent)',
                          border: '1px solid var(--color-critical)',
                          color: 'var(--color-critical)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <strong>Diagnostic Reason:</strong> {conn.reason}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Status checked live via <code>/health</code>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
