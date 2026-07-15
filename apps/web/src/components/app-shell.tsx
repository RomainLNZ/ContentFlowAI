import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useApplication } from "@/app/application-context";
import { NotificationCenter } from "@/features/notifications/notification-center";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { me } = useApplication();
  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100">
      <header className="border-b border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
          <Link to="/app" className="text-xl font-semibold">
            FlowPilot
          </Link>
          <nav className="flex flex-1 gap-5 text-sm text-zinc-400">
            <NavLink
              to="/app/create"
              className={({ isActive }) => (isActive ? "text-violet-300" : "hover:text-white")}
            >
              Créer
            </NavLink>
            <NavLink
              to="/app/content"
              className={({ isActive }) => (isActive ? "text-violet-300" : "hover:text-white")}
            >
              Mes contenus
            </NavLink>
            <NavLink
              to="/app/calendar"
              className={({ isActive }) => (isActive ? "text-violet-300" : "hover:text-white")}
            >
              Calendrier
            </NavLink>
            <NavLink
              to="/app/campaigns"
              className={({ isActive }) => (isActive ? "text-violet-300" : "hover:text-white")}
            >
              Campagnes
            </NavLink>
          </nav>
          <span className="hidden text-sm text-zinc-500 sm:block">{me?.user.fullName || me?.user.email}</span>
          <NotificationCenter />
          <button
            className="rounded-lg border border-white/10 px-3 py-2 text-sm"
            onClick={() => void supabase.auth.signOut().then(() => navigate("/sign-in"))}
          >
            Déconnexion
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
