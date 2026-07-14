import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth-context";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { loading, session } = useAuth();

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-[#08090c] text-sm text-zinc-500" role="status">
        Ouverture de votre espace…
      </main>
    );
  if (!session) return <Navigate to="/sign-in" state={{ from: location }} replace />;
  return children;
}
