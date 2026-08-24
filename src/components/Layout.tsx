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
  LogOut, Zap, Plug
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#121212' }}>
      {/* ── System Status Bar ────────────────────────────────────────────────── */}
      <div
        style={{
          height: '28px',
          background: '#1A1A22',
          borderBottom: '1px solid #333340',
          display: 'flex',
          alignItems: 'center',
          padding: '0 0.75rem',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          color: '#8A8A96',
          gap: '1.5rem',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span className="status-dot ok" /> SHIELDGRID v2.1.0
        </span>
        <span style={{ color: '#555560' }}>|</span>
        <span>DEPLOY: PRODUCTION</span>
        <span style={{ color: '#555560' }}>|</span>
        <span>DB: <span style={{ color: '#4CAF50' }}>CONNECTED</span></span>
        <span style={{ color: '#555560' }}>|</span>
        <span>WAZUH: <span style={{ color: getConnectorStatus('wazuh') === 'healthy' ? '#4CAF50' : '#D32F2F' }}>{getConnectorStatus('wazuh').toUpperCase()}</span></span>
        <span style={{ color: '#555560' }}>|</span>
        <span>VR: <span style={{ color: getConnectorStatus('velociraptor') === 'healthy' ? '#4CAF50' : '#D32F2F' }}>{getConnectorStatus('velociraptor').toUpperCase()}</span></span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#E5A93B', border: '1px solid #E5A93B', padding: '0 0.375rem', borderRadius: '2px' }}>
          RELEASE NOTES
        </span>
        <span style={{ color: '#555560' }}>|</span>
        <span>{formatTime(systemTime)} UTC</span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            background: '#1A1A22',
            borderRight: '1px solid #333340',
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
              borderBottom: '1px solid #333340',
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
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E0E0E0', letterSpacing: '0.02em' }}>
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
                background: 'transparent', border: '1px solid #333340',
                borderRadius: '2px', color: '#8A8A96', cursor: 'pointer',
                fontSize: '0.65rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6B7B99'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333340'; }}
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
                      background: '#333340',
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
                      color: isActive ? '#121212' : '#8A8A96',
                      background: isActive ? '#E0E0E0' : 'transparent',
                      transition: 'background 100ms, color 100ms',
                      whiteSpace: 'nowrap',
                      minHeight: '28px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(107,123,153,0.08)';
                        e.currentTarget.style.color = '#E0E0E0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#8A8A96';
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
                        background: '#2A2A32',
                        border: '1px solid #333340',
                        borderRadius: '2px',
                        fontSize: '0.75rem',
                        color: '#E0E0E0',
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
                border: '1px solid #333340',
                borderRadius: '2px',
                color: '#8A8A96',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6B7B99'; e.currentTarget.style.color = '#E0E0E0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333340'; e.currentTarget.style.color = '#8A8A96'; }}
            >
              <Search size={13} />
              {!collapsed && <span>INTEL LOOKUP</span>}
            </button>
          </div>

          {/* User / Logout */}
          <div style={{ padding: collapsed ? '0.5rem 0' : '0.5rem 0.75rem', borderTop: '1px solid #333340' }}>
            {collapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                <div
                  style={{
                    width: '24px', height: '24px', borderRadius: '2px',
                    background: '#2A2A32', border: '1px solid #333340',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 700, color: '#6B7B99',
                  }}
                  title={user?.sub || 'User'}
                >
                  {user?.sub ? user.sub.charAt(0).toUpperCase() : 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  style={{
                    width: '24px', height: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '1px solid #333340',
                    borderRadius: '2px', color: '#555560', cursor: 'pointer',
                  }}
                >
                  <LogOut size={11} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#555560' }}>
                  <span style={{ color: '#8A8A96' }}>USER:</span> {user?.sub ? user.sub.slice(0, 12) : 'operator'}
                  <span style={{ marginLeft: '0.5rem', color: '#6B7B99' }}>[{user?.role || 'operator'}]</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  style={{
                    width: '22px', height: '22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '1px solid #333340',
                    borderRadius: '2px', color: '#555560', cursor: 'pointer',
                  }}
                >
                  <LogOut size={11} />
                </button>
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
