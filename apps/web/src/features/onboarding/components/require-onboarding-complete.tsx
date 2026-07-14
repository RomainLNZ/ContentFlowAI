import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useApplication } from "@/app/application-context";

export function RequireOnboardingComplete({ children }: { children: ReactNode }) {
  const { me, loading } = useApplication();
  if (loading || !me) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08090c] text-zinc-400">
        Chargement de votre espace…
      </main>
    );
  }
  if (!me.user.onboardingDone) return <Navigate to="/onboarding" replace />;
  return children;
}
