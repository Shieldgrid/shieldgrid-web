/**
 * src/lib/auth.tsx
 *
 * Auth Context and in-memory JWT token handling.
 *
 * SECURITY REQUIREMENT:
 * The JWT token is stored ONLY in memory (React state).
 * It is NEVER stored in localStorage or sessionStorage to prevent XSS session theft.
 * Page refreshes reset the session and require re-authentication.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { JwtClaims } from './types';
import { fetchMe, logoutApi } from './api';

interface AuthContextType {
  user: JwtClaims | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<JwtClaims | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const hydrateSession = useCallback(async () => {
    try {
      const claims = await fetchMe();
      setUser(claims);
    } catch {
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  const isAuthenticated = useMemo(() => {
    return !!user;
  }, [user]);

  const login = useCallback(async () => {
    await hydrateSession();
  }, [hydrateSession]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.warn("Logout api failed", e);
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      login,
      logout,
    }),
    [user, isAuthenticated, login, logout]
  );

  if (isInitializing) {
    return null; // Or a full screen loader
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
