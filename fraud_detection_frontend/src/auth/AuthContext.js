import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getStoredAuth, loginWithCredentials, logout as clearAuth } from "./auth";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * Provides authentication state (simple localStorage-backed session).
   */
  const [session, setSession] = useState(() => getStoredAuth());

  const login = useCallback((email, password) => {
    const s = loginWithCredentials(email, password);
    setSession(s);
    return s;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session),
      session,
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /**
   * Hook to access auth state and actions.
   * @returns {{isAuthenticated: boolean, session: any, login: Function, logout: Function}}
   */
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}
