import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ThreatIntelDrawer } from './ThreatIntelDrawer';
import logoSvg from '../assets/shieldgrid-logo-concept-a.svg';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [intelDrawerOpen, setIntelDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Alerts', path: '/alerts', icon: '⚡' },
    { label: 'Cases', path: '/cases', icon: '📁' },
    { label: 'Actions', path: '/actions', icon: '🛡️' },
    { label: 'Detection Rules', path: '/rules', icon: '🎯' },
    { label: 'MITRE Matrix', path: '/mitre', icon: '🗺️' },
    { label: '---' },
    { label: 'Threat Intel', path: '/threat-intel', icon: '🔍' },
    { label: 'SCA & Vulns', path: '/sca-vulnerabilities', icon: '🛡️' },
    { label: 'Agent Inventory', path: '/agents', icon: '🖥️' },
    { label: '---' },
    { label: 'AI Dashboard', path: '/ai', icon: '🧠' },
    { label: 'AI Chat', path: '/ai/chat', icon: '💬' },
    { label: 'Scheduler', path: '/scheduler', icon: '⏰' },
    { label: '---' },
    { label: 'Network Devices', path: '/network-connectors', icon: '🌐', role: 'admin' },
    { label: 'Notifications', path: '/notifications', icon: '🔔' },
    { label: 'Reports', path: '/reports', icon: '📊' },
    { label: 'Monitoring', path: '/monitoring', icon: '📈' },
    { label: '---' },
    { label: 'Connectors', path: '/connectors', icon: '🔌', role: 'admin' },
    { label: 'VQL Shell', path: '/velociraptor', icon: '🖥️', role: 'admin' },
    { label: 'Users', path: '/users', icon: '👥', role: 'admin' },
    { label: 'Audit Log', path: '/audit', icon: '📜', role: 'admin' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* ── Sidebar Navigation ───────────────────────────────────────────── */}
      <aside
        style={{
          width: '240px',
          background: 'var(--color-bg-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo Header */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={logoSvg} alt="Shieldgrid Logo" style={{ width: '32px', height: '32px' }} />
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Shieldgrid
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SOC Operations
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem', overflowY: 'auto' }}>
          {navItems.map((item, idx) => {
            if (item.label === '---') {
              return (
                <div key={`sep-${idx}`} style={{ height: '1px', background: 'var(--color-border)', margin: '0.375rem 0' }} />
              );
            }
            if (item.role && user?.role !== item.role) return null;
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: isActive ? '#0B1B33' : 'var(--color-text-secondary)',
                  background: isActive ? 'var(--color-accent)' : 'transparent',
                  transition: 'background 150ms ease, color 150ms ease',
                })}
              >
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Threat Intel Quick Action */}
        <div style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
          <button
            onClick={() => setIntelDrawerOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#818cf8',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>⚡</span> Threat Intel
          </button>
        </div>

        {/* User Info / Logout */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Logged in as <strong style={{ color: 'var(--color-text-primary)' }}>{user?.sub ? `${user.sub.slice(0, 8)}...` : 'User'}</strong>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)' }}>Role: {user?.role || 'operator'}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: '0.25rem',
              padding: '0.375rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>{children}</div>
      </main>

      {/* ── Threat Intelligence Drawer ───────────────────────────────────── */}
      <ThreatIntelDrawer
        isOpen={intelDrawerOpen}
        onClose={() => setIntelDrawerOpen(false)}
      />
    </div>
  );
};
