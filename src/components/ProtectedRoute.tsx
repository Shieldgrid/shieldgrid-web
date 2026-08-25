import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-critical)' }}>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--color-text-[var(--sys-text-secondary)])', marginTop: '0.5rem' }}>
          This section requires administrative privileges (role: {requireRole}).
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
