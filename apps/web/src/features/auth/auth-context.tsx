/* eslint-disable react-refresh/only-export-components -- provider and hook form one public auth context */
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/env";

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: isSupabaseConfigured,
    session: null,
    user: null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ loading: false, session: data.session, user: data.session?.user ?? null });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ loading: false, session, user: session?.user ?? null });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return context;
}
