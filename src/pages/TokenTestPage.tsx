/**
 * src/pages/TokenTestPage.tsx
 *
 * Design token & typography validation page.
 * Used to verify Ticket 2 acceptance criteria: npm run dev shows a base
 * layout/typography test page styled with the approved design tokens.
 *
 * Remove or replace with /dashboard redirect once Ticket 4 is complete.
 */

export default function TokenTestPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-[var(--sys-bg-base)])', padding: '2rem' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="13" stroke="var(--color-accent)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="3" fill="var(--color-accent)" />
            <line x1="14" y1="1" x2="14" y2="7" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="21" x2="14" y2="27" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="1" y1="14" x2="7" y2="14" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="21" y1="14" x2="27" y2="14" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4.1" y1="4.1" x2="8.6" y2="8.6" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="19.4" y1="19.4" x2="23.9" y2="23.9" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="23.9" y1="4.1" x2="19.4" y2="8.6" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="8.6" y1="19.4" x2="4.1" y2="23.9" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>
          <h1 style={{ color: 'var(--color-text-[var(--sys-text-primary)])', fontSize: '1.5rem', fontWeight: 700 }}>
            Shieldgrid
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-[var(--sys-text-secondary)])', fontSize: '0.875rem' }}>
          Design token validation — Ticket 2 ✓
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>

        {/* ── Palette ──────────────────────────────────────────────────── */}
        <Card title="Colour Palette">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { name: 'bg-[var(--sys-bg-base)]', value: '#0B1B33', label: 'Background Base' },
              { name: 'bg-[var(--sys-bg-surface)]', value: '#132B4D', label: 'Surface Level 1' },
              { name: 'bg-[var(--sys-bg-elevated)]', value: '#1A3560', label: 'Elevated Surface' },
              { name: 'accent', value: '#4FD1FF', label: 'Accent (Cyan)' },
              { name: 'warning', value: '#FF9F1C', label: 'Warning (Orange)' },
              { name: 'critical', value: '#E71D36', label: 'Critical (Red)' },
              { name: 'success', value: '#22D3A5', label: 'Success (Teal)' },
            ].map(({ value, label }) => (
              <div key={value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-sm)',
                  background: value, border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
                }} />
                <div>
                  <p style={{ color: 'var(--color-text-[var(--sys-text-primary)])', fontSize: '0.875rem', fontWeight: 500 }}>{label}</p>
                  <code style={{ color: 'var(--color-text-[var(--sys-text-secondary)])', fontSize: '0.75rem' }}>{value}</code>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Typography ───────────────────────────────────────────────── */}
        <Card title="Typography Scale">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ color: 'var(--color-text-[var(--sys-text-muted)])', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Inter — Display</p>
              <h1>Critical Alert Detected</h1>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-[var(--sys-text-muted)])', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Inter — H2</p>
              <h2>Open Cases (12)</h2>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-[var(--sys-text-muted)])', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Inter — Body</p>
              <p>Connector Wazuh is reporting degraded health. Last check: 2 minutes ago.</p>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-[var(--sys-text-muted)])', fontSize: '0.75rem', marginBottom: '0.25rem' }}>JetBrains Mono — Code/Payload</p>
              <code style={{ color: 'var(--color-accent)', display: 'block' }}>
                {`{"rule_id": "5502", "level": 12, "agent": "web-01"}`}
              </code>
            </div>
          </div>
        </Card>

        {/* ── Status Badges ────────────────────────────────────────────── */}
        <Card title="Status Indicators">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <StatusRow label="Wazuh" status="healthy" />
            <StatusRow label="Velociraptor" status="degraded" reason="connection timeout" />
            <StatusRow label="Graylog" status="down" reason="TLS handshake failed" />
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Badge color="var(--color-critical)">Critical</Badge>
            <Badge color="var(--color-warning)">High</Badge>
            <Badge color="#FBBF24">Medium</Badge>
            <Badge color="var(--color-text-[var(--sys-text-secondary)])">Low</Badge>
            <Badge color="var(--color-success)">Resolved</Badge>
          </div>
        </Card>

        {/* ── Surface Levels ───────────────────────────────────────────── */}
        <Card title="Surface Levels">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-[var(--sys-bg-base)])', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-[var(--sys-text-secondary)])', fontSize: '0.875rem' }}>bg-[var(--sys-bg-base)] (#0B1B33)</p>
            </div>
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-[var(--sys-bg-surface)])', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-[var(--sys-text-secondary)])', fontSize: '0.875rem' }}>bg-[var(--sys-bg-surface)] (#132B4D)</p>
            </div>
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-[var(--sys-bg-elevated)])', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-[var(--sys-text-secondary)])', fontSize: '0.875rem' }}>bg-[var(--sys-bg-elevated)] (#1A3560)</p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}

// ── Small components local to this test page ─────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-bg-[var(--sys-bg-surface)])',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      padding: '1.5rem',
    }}>
      <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-text-[var(--sys-text-primary)])' }}>{title}</h3>
      {children}
    </div>
  );
}

function StatusRow({ label, status, reason }: { label: string; status: 'healthy' | 'degraded' | 'down'; reason?: string }) {
  const colors = { healthy: 'var(--color-success)', degraded: 'var(--color-warning)', down: 'var(--color-critical)' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[status], flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ color: 'var(--color-text-[var(--sys-text-primary)])', fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
        {reason && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-[var(--sys-text-muted)])', marginTop: '0.125rem' }}>{reason}</p>}
      </div>
      <span style={{ fontSize: '0.75rem', color: colors[status], fontWeight: 500, textTransform: 'capitalize' }}>{status}</span>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      padding: '0.25rem 0.625rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: '#0B1B33',
      background: color,
      letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  );
}
