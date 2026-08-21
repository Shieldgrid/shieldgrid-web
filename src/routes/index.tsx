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

import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import AlertsPage from '../pages/AlertsPage';
import CasesPage from '../pages/CasesPage';
import CaseDetailPage from '../pages/CaseDetailPage';
import ConnectorsPage from '../pages/ConnectorsPage';
import AuditPage from '../pages/AuditPage';
import AiDashboardPage from '../pages/AiDashboardPage';
import AiChatPage from '../pages/AiChatPage';
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

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <CasesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <CaseDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/connectors"
        element={
          <ProtectedRoute requireRole="admin">
            <ConnectorsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit"
        element={
          <ProtectedRoute requireRole="admin">
            <AuditPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai"
        element={
          <ProtectedRoute>
            <AiDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/velociraptor"
        element={
          <ProtectedRoute requireRole="admin">
            <VelociraptorPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/actions"
        element={
          <ProtectedRoute>
            <ShieldgridActionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rules"
        element={
          <ProtectedRoute>
            <DetectionRulesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mitre"
        element={
          <ProtectedRoute>
            <MitreMatrixPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/scheduler"
        element={
          <ProtectedRoute>
            <SchedulerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/network-connectors"
        element={
          <ProtectedRoute requireRole="admin">
            <NetworkConnectorsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/monitoring"
        element={
          <ProtectedRoute>
            <MonitoringPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/threat-intel"
        element={
          <ProtectedRoute>
            <ThreatIntelPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sca-vulnerabilities"
        element={
          <ProtectedRoute>
            <ScaVulnerabilitiesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requireRole="admin">
            <UserManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agents"
        element={
          <ProtectedRoute>
            <AgentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/chat"
        element={
          <ProtectedRoute>
            <AiChatPage />
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
