import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/env";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<"loading" | "authenticated" | "anonymous">(() =>
    !isSupabaseConfigured
      ? localStorage.getItem("fp-demo-session") === "true"
        ? "authenticated"
        : "anonymous"
      : "loading",
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState(data.session ? "authenticated" : "anonymous");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setState(session ? "authenticated" : "anonymous"),
    );
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (state === "loading")
    return (
      <main className="grid min-h-screen place-items-center bg-[#08090c] text-sm text-zinc-500" role="status">
        Ouverture de votre espace…
      </main>
    );
  if (state === "anonymous") return <Navigate to="/sign-in" state={{ from: location }} replace />;
  return children;
}
