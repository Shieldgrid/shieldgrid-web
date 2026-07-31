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
