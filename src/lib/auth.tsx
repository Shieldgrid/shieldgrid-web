/**
 * src/lib/auth.tsx
 *
 * Auth Context and in-memory JWT token handling.
 *
 * SECURITY NOTE:
 * For Phase 0 development convenience, the JWT token is stored in localStorage 
 * so session persists on refresh. For production (Phase 1+), consider migrating to HttpOnly cookies.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { JwtClaims } from './types';

interface AuthContextType {
  token: string | null;
  user: JwtClaims | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): JwtClaims | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read token from localStorage on initial load to persist session across refreshes
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt_token'));

  const user = useMemo(() => {
    if (!token) return null;
    const claims = parseJwt(token);
    if (claims && claims.exp * 1000 < Date.now()) {
      // Token expired
      localStorage.removeItem('jwt_token');
      return null;
    }
    return claims;
  }, [token]);

  const isAuthenticated = useMemo(() => {
    return !!token && !!user;
  }, [token, user]);

  const login = useCallback((newToken: string) => {
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      login,
      logout,
    }),
    [token, user, isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
