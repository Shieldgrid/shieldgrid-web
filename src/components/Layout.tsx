import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { fetchHealth } from '../lib/api';
import type { HealthResponse } from '../lib/types';
import { ThreatIntelDrawer } from './ThreatIntelDrawer';
import logoSvg from '../assets/shieldgrid-logo-concept-a.svg';
import {
  LayoutDashboard, AlertTriangle, FolderOpen, Shield, Crosshair,
  Map, Search, Monitor, Brain, Clock, Globe, Bell, FileText,
  Activity, Terminal, Users, ScrollText, ChevronLeft, ChevronRight,
  LogOut, Zap, Plug, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [intelDrawerOpen, setIntelDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [systemTime, setSystemTime] = useState(new Date());
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadHealth = () => fetchHealth().then(setHealth).catch(() => {});
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getConnectorStatus = (id: string) => {
    const c = health?.connectors.find(c => c.id === id);
    return c?.status || 'unknown';
  };

  const sidebarWidth = collapsed ? '48px' : '200px';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Alerts', path: '/alerts', icon: AlertTriangle },
    { label: 'Cases', path: '/cases', icon: FolderOpen },
    { label: 'Actions', path: '/actions', icon: Zap },
    { label: 'Detection Rules', path: '/rules', icon: Crosshair },
    { label: 'MITRE Matrix', path: '/mitre', icon: Map },
    { sep: true },
    { label: 'Threat Intel', path: '/threat-intel', icon: Search },
    { label: 'SCA & Vulns', path: '/sca-vulnerabilities', icon: Shield },
    { label: 'Agent Inventory', path: '/agents', icon: Monitor },
    { sep: true },
    { label: 'AI Analyst', path: '/ai', icon: Brain },
    { label: 'Scheduler', path: '/scheduler', icon: Clock },
    { sep: true },
    { label: 'Network Devices', path: '/network-connectors', icon: Globe, role: 'admin' },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Monitoring', path: '/monitoring', icon: Activity },
    { sep: true },
    { label: 'Connectors', path: '/connectors', icon: Plug, role: 'admin' },
    { label: 'VQL Shell', path: '/velociraptor', icon: Terminal, role: 'admin' },
    { label: 'Users', path: '/users', icon: Users, role: 'admin' },
    { label: 'Audit Log', path: '/audit', icon: ScrollText, role: 'admin' },
  ];

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--sys-bg-base)' }}>
      {/* ── System Status Bar ────────────────────────────────────────────────── */}
      <div
        style={{
          height: '28px',
          background: 'var(--sys-bg-surface)',
          borderBottom: '1px solid var(--sys-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 0.75rem',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--sys-text-secondary)',
          gap: '1.5rem',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span className="status-dot ok" /> SHIELDGRID v1.0.0-beta
        </span>
        <span style={{ color: 'var(--sys-text-muted)' }}>|</span>
        <span>DEPLOY: PRODUCTION</span>
        <span style={{ color: 'var(--sys-text-muted)' }}>|</span>
        <span>DB: <span style={{ color: 'var(--color-success)' }}>CONNECTED</span></span>
        <span style={{ color: 'var(--sys-text-muted)' }}>|</span>
        <span>WAZUH: <span style={{ color: getConnectorStatus('wazuh') === 'healthy' ? 'var(--color-success)' : 'var(--color-critical)' }}>{getConnectorStatus('wazuh').toUpperCase()}</span></span>
        <span style={{ color: 'var(--sys-text-muted)' }}>|</span>
        <span>VR: <span style={{ color: getConnectorStatus('velociraptor') === 'healthy' ? 'var(--color-success)' : 'var(--color-critical)' }}>{getConnectorStatus('velociraptor').toUpperCase()}</span></span>
        <div style={{ flex: 1 }} />
        <span style={{ color: 'var(--color-warning)', border: '1px solid var(--color-warning)', padding: '0 0.375rem', borderRadius: '2px' }}>
          RELEASE NOTES
        </span>
        <span style={{ color: 'var(--sys-text-muted)' }}>|</span>
        <span>{formatTime(systemTime)} UTC</span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            background: 'var(--sys-bg-surface)',
            borderRight: '1px solid var(--sys-border)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 150ms ease, min-width 150ms ease',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <div
            style={{
              padding: collapsed ? '0.625rem 0' : '0.625rem 0.75rem',
              borderBottom: '1px solid var(--sys-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              height: '40px',
            }}
          >
            {collapsed ? (
              <img src={logoSvg} alt="SG" style={{ width: '20px', height: '20px' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={logoSvg} alt="Shieldgrid" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sys-text-primary)', letterSpacing: '0.02em' }}>
                  SHIELDGRID
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand' : 'Collapse'}
              style={{
                width: '22px', height: '22px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: '1px solid var(--sys-border)',
                borderRadius: '2px', color: 'var(--sys-text-secondary)', cursor: 'pointer',
                fontSize: '0.65rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--sys-border)'; }}
            >
              {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
          </div>

          {/* Nav Links */}
          <nav
            style={{
              padding: collapsed ? '0.375rem 0' : '0.375rem 0.5rem',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {navItems.map((item, idx) => {
              if ('sep' in item && item.sep) {
                return (
                  <div
                    key={`sep-${idx}`}
                    style={{
                      height: '1px',
                      background: 'var(--sys-border)',
                      margin: collapsed ? '0.25rem 6px' : '0.25rem 0',
                    }}
                  />
                );
              }
              if ('role' in item && item.role && user?.role !== item.role) return null;

              const navItem = item as { label: string; path: string; icon: any };
              const Icon = navItem.icon;
              const isActive = location.pathname === navItem.path;

              return (
                <div
                  key={navItem.path}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => collapsed && setHoveredItem(navItem.path)}
                  onMouseLeave={() => collapsed && setHoveredItem(null)}
                >
                  <NavLink
                    to={navItem.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: '0.5rem',
                      padding: collapsed ? '0.375rem' : '0.375rem 0.625rem',
                      borderRadius: '2px',
                      textDecoration: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--sys-bg-base)' : 'var(--sys-text-secondary)',
                      background: isActive ? 'var(--sys-text-primary)' : 'transparent',
                      transition: 'background 100ms, color 100ms',
                      whiteSpace: 'nowrap',
                      minHeight: '28px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(107,123,153,0.08)';
                        e.currentTarget.style.color = 'var(--sys-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--sys-text-secondary)';
                      }
                    }}
                    title={collapsed ? navItem.label : undefined}
                  >
                    <Icon size={14} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>{navItem.label}</span>}
                  </NavLink>

                  {collapsed && hoveredItem === navItem.path && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 'calc(100% + 6px)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '0.25rem 0.5rem',
                        background: 'var(--sys-bg-elevated)',
                        border: '1px solid var(--sys-border)',
                        borderRadius: '2px',
                        fontSize: '0.75rem',
                        color: 'var(--sys-text-primary)',
                        whiteSpace: 'nowrap',
                        zIndex: 50,
                        pointerEvents: 'none',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {navItem.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Threat Intel Quick Access */}
          <div style={{ padding: collapsed ? '0 0.375rem 0.375rem' : '0 0.5rem 0.5rem' }}>
            <button
              onClick={() => setIntelDrawerOpen(true)}
              title="Threat Intelligence"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'center',
                gap: '0.375rem',
                padding: collapsed ? '0.375rem' : '0.375rem',
                background: 'transparent',
                border: '1px solid var(--sys-border)',
                borderRadius: '2px',
                color: 'var(--sys-text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--sys-text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--sys-border)'; e.currentTarget.style.color = 'var(--sys-text-secondary)'; }}
            >
              <Search size={13} />
              {!collapsed && <span>INTEL LOOKUP</span>}
            </button>
          </div>

          {/* User / Logout */}
          <div style={{ padding: collapsed ? '0.5rem 0' : '0.5rem 0.75rem', borderTop: '1px solid var(--sys-border)' }}>
            {collapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                <div
                  style={{
                    width: '24px', height: '24px', borderRadius: '2px',
                    background: 'var(--sys-bg-elevated)', border: '1px solid var(--sys-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-accent)',
                  }}
                  title={user?.sub || 'User'}
                >
                  {user?.sub ? user.sub.charAt(0).toUpperCase() : 'U'}
                </div>
                <button
                  onClick={toggleTheme}
                  title="Toggle Theme"
                  style={{
                    width: '24px', height: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '1px solid var(--sys-border)',
                    borderRadius: '2px', color: 'var(--sys-text-muted)', cursor: 'pointer',
                  }}
                >
                  {theme === 'dark' ? <Sun size={11} /> : <Moon size={11} />}
                </button>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  style={{
                    width: '24px', height: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '1px solid var(--sys-border)',
                    borderRadius: '2px', color: 'var(--sys-text-muted)', cursor: 'pointer',
                  }}
                >
                  <LogOut size={11} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--sys-text-muted)' }}>
                  <span style={{ color: 'var(--sys-text-secondary)' }}>USER:</span> {user?.sub ? user.sub.slice(0, 12) : 'operator'}
                  <span style={{ marginLeft: '0.5rem', color: 'var(--color-accent)' }}>[{user?.role || 'operator'}]</span>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    onClick={toggleTheme}
                    title="Toggle Theme"
                    style={{
                      width: '22px', height: '22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', border: '1px solid var(--sys-border)',
                      borderRadius: '2px', color: 'var(--sys-text-muted)', cursor: 'pointer',
                    }}
                  >
                    {theme === 'dark' ? <Sun size={11} /> : <Moon size={11} />}
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    style={{
                      width: '22px', height: '22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', border: '1px solid var(--sys-border)',
                      borderRadius: '2px', color: 'var(--sys-text-muted)', cursor: 'pointer',
                    }}
                  >
                    <LogOut size={11} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content Area ────────────────────────────────────────── */}
        <main style={{ flex: 1, padding: '1rem', overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* ── Threat Intelligence Drawer ───────────────────────────────────── */}
      <ThreatIntelDrawer
        isOpen={intelDrawerOpen}
        onClose={() => setIntelDrawerOpen(false)}
      />
    </div>
  );
};
