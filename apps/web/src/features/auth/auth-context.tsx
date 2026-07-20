/* eslint-disable react-refresh/only-export-components -- provider and hook form one public auth context */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Authentication, AuthSession, AuthUser } from "@/lib/authentication";

export type AuthState = {
  loading: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthState | null>(null);
const AuthenticationContext = createContext<Authentication | null>(null);

export function AuthProvider({ children, authentication }: { children: ReactNode; authentication: Authentication }) {
  const [state, setState] = useState<AuthState>({
    loading: authentication.configured,
    session: null,
    user: null,
  });

  useEffect(() => {
    if (!authentication.configured) {
      return;
    }
    let active = true;
    void authentication.getSession().then((session) => {
      if (active) setState({ loading: false, session, user: session?.user ?? null });
    });
    const unsubscribe = authentication.onAuthStateChange((session) => {
      setState({ loading: false, session, user: session?.user ?? null });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [authentication]);

  const value = useMemo(() => state, [state]);
  return (
    <AuthenticationContext.Provider value={authentication}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </AuthenticationContext.Provider>
  );
}

export function useAuthentication() {
  const context = useContext(AuthenticationContext);
  if (!context) throw new Error("useAuthentication doit être utilisé dans AuthProvider");
  return context;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return context;
}
