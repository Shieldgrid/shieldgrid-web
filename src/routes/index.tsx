/**
 * src/routes/index.tsx
 *
 * Router configuration with AuthProvider and ProtectedRoute gating.
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../lib/auth';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { setUnauthorizedHandler } from '../lib/api';

import { Layout } from '../components/Layout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import AlertsPage from '../pages/AlertsPage';
import CasesPage from '../pages/CasesPage';
import CaseDetailPage from '../pages/CaseDetailPage';
import ConnectorsPage from '../pages/ConnectorsPage';
import AuditPage from '../pages/AuditPage';
import AiDashboardPage from '../pages/AiDashboardPage';
import VelociraptorPage from '../pages/VelociraptorPage';
import ShieldgridActionsPage from '../pages/ShieldgridActionsPage';
import DetectionRulesPage from '../pages/DetectionRulesPage';
import MitreMatrixPage from '../pages/MitreMatrixPage';
import SchedulerPage from '../pages/SchedulerPage';
import NetworkConnectorsPage from '../pages/NetworkConnectorsPage';
import NotificationsPage from '../pages/NotificationsPage';
import MonitoringPage from '../pages/MonitoringPage';
import ThreatIntelPage from '../pages/ThreatIntelPage';
import ScaVulnerabilitiesPage from '../pages/ScaVulnerabilitiesPage';
import ReportsPage from '../pages/ReportsPage';
import UserManagementPage from '../pages/UserManagementPage';
import AgentsPage from '../pages/AgentsPage';

function RouteConfig() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Centralized 401 response handler
    setUnauthorizedHandler(() => {
      logout();
      navigate('/login');
    });
  }, [logout, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* All protected routes are wrapped in Layout for consistent sidebar */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><DashboardPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Layout><AlertsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <Layout><CasesPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <Layout><CaseDetailPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/connectors"
        element={
          <ProtectedRoute requireRole="admin">
            <Layout><ConnectorsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit"
        element={
          <ProtectedRoute requireRole="admin">
            <Layout><AuditPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai"
        element={
          <ProtectedRoute>
            <Layout><AiDashboardPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/velociraptor"
        element={
          <ProtectedRoute requireRole="admin">
            <Layout><VelociraptorPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/actions"
        element={
          <ProtectedRoute>
            <Layout><ShieldgridActionsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/rules"
        element={
          <ProtectedRoute>
            <Layout><DetectionRulesPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mitre"
        element={
          <ProtectedRoute>
            <Layout><MitreMatrixPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/scheduler"
        element={
          <ProtectedRoute>
            <Layout><SchedulerPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/network-connectors"
        element={
          <ProtectedRoute requireRole="admin">
            <Layout><NetworkConnectorsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout><NotificationsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/monitoring"
        element={
          <ProtectedRoute>
            <Layout><MonitoringPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/threat-intel"
        element={
          <ProtectedRoute>
            <Layout><ThreatIntelPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sca-vulnerabilities"
        element={
          <ProtectedRoute>
            <Layout><ScaVulnerabilitiesPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout><ReportsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requireRole="admin">
            <Layout><UserManagementPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/agents"
        element={
          <ProtectedRoute>
            <Layout><AgentsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteConfig />
      </BrowserRouter>
    </AuthProvider>
  );
}
