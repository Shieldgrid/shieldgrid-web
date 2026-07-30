import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { loginApi } from '../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@shieldgrid.internal');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginApi(email, password);
      login(res.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-base)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
        }}
      >
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none" style={{ margin: '0 auto 0.75rem' }}>
            <circle cx="14" cy="14" r="13" stroke="var(--color-accent)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="3" fill="var(--color-accent)" />
            <line x1="14" y1="1" x2="14" y2="7" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="21" x2="14" y2="27" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="1" y1="14" x2="7" y2="14" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="21" y1="14" x2="27" y2="14" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Shieldgrid</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            SOC Operations Platform
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--color-critical) 15%, transparent)',
              border: '1px solid var(--color-critical)',
              color: 'var(--color-critical)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent)',
              color: '#0B1B33',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
