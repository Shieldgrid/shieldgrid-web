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
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const sidebarWidth = collapsed ? '64px' : '240px';

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
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          background: 'var(--color-bg-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 200ms ease, min-width 200ms ease',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo Header + Toggle */}
        <div
          style={{
            padding: collapsed ? '1rem 0' : '1.25rem 1.25rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            minHeight: '64px',
          }}
        >
          {collapsed ? (
            <div
              style={{
                width: '32px',
                height: '32px',
                flexShrink: 0,
              }}
            >
              <img src={logoSvg} alt="SG" style={{ width: '32px', height: '32px' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={logoSvg} alt="Shieldgrid Logo" style={{ width: '32px', height: '32px', flexShrink: 0 }} />
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>
                  Shieldgrid
                </h2>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  SOC Operations
                </span>
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: '28px',
              height: '28px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              transition: 'background 150ms ease, color 150ms ease',
              marginLeft: collapsed ? 0 : undefined,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
              e.currentTarget.style.color = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        {/* Nav Links */}
        <nav
          style={{
            padding: collapsed ? '0.75rem 0' : '1rem 0.75rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.125rem',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {navItems.map((item, idx) => {
            if (item.label === '---') {
              return (
                <div
                  key={`sep-${idx}`}
                  style={{
                    height: '1px',
                    background: 'var(--color-border)',
                    margin: collapsed ? '0.375rem 8px' : '0.375rem 0',
                  }}
                />
              );
            }
            if (item.role && user?.role !== item.role) return null;

            const isActive = location.pathname === item.path;

            return (
              <div
                key={item.path}
                style={{ position: 'relative' }}
                onMouseEnter={() => collapsed && setHoveredItem(item.path!)}
                onMouseLeave={() => collapsed && setHoveredItem(null)}
              >
                <NavLink
                  to={item.path!}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    padding: collapsed ? '0.5rem' : '0.5rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: isActive ? '#0B1B33' : 'var(--color-text-secondary)',
                    background: isActive ? 'var(--color-accent)' : 'transparent',
                    transition: 'background 150ms ease, color 150ms ease',
                    whiteSpace: 'nowrap',
                    minWidth: collapsed ? '40px' : undefined,
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0, width: '20px', textAlign: 'center' }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>

                {/* Tooltip for collapsed mode */}
                {collapsed && hoveredItem === item.path && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 'calc(100% + 8px)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '0.375rem 0.625rem',
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 50,
                      pointerEvents: 'none',
                    }}
                  >
                    {item.icon} {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Threat Intel Quick Action */}
        {!collapsed ? (
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
        ) : (
          <div style={{ padding: '0 0.5rem 0.5rem 0.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setIntelDrawerOpen(true)}
              title="Threat Intel"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#818cf8',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              ⚡
            </button>
          </div>
        )}

        {/* User Info / Logout */}
        {!collapsed ? (
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
        ) : (
          <div style={{ padding: '0.75rem 0', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(99,102,241,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--color-accent)',
              }}
              title={user?.sub || 'User'}
            >
              {user?.sub ? user.sub.charAt(0).toUpperCase() : 'U'}
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              🚪
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}>
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
