import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApplication } from "@/app/application-context";
import { NotificationCenter } from "@/features/notifications/notification-center";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { me } = useApplication();
  return (
    <div data-theme="dark" className="min-h-screen bg-[#08090c] text-zinc-100">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link to="/app" className="text-xl font-semibold">
            FlowPilot
          </Link>
          <nav
            aria-label="Navigation principale"
            className="order-3 flex w-full gap-5 overflow-x-auto text-sm text-zinc-400 sm:order-none sm:w-auto sm:flex-1"
          >
            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 whitespace-nowrap py-1 ${isActive ? "text-violet-300" : "hover:text-white"}`
              }
            >
              <Home size={15} /> Aujourd’hui
            </NavLink>
            <NavLink
              to="/app/create"
              className={({ isActive }) =>
                `whitespace-nowrap py-1 ${isActive ? "text-violet-300" : "hover:text-white"}`
              }
            >
              Créer
            </NavLink>
            <NavLink
              to="/app/content"
              className={({ isActive }) =>
                `whitespace-nowrap py-1 ${isActive ? "text-violet-300" : "hover:text-white"}`
              }
            >
              Mes contenus
            </NavLink>
            <NavLink
              to="/app/calendar"
              className={({ isActive }) =>
                `whitespace-nowrap py-1 ${isActive ? "text-violet-300" : "hover:text-white"}`
              }
            >
              Calendrier
            </NavLink>
            <NavLink
              to="/app/campaigns"
              className={({ isActive }) =>
                `whitespace-nowrap py-1 ${isActive ? "text-violet-300" : "hover:text-white"}`
              }
            >
              Campagnes
            </NavLink>
          </nav>
          <span className="hidden text-sm text-zinc-500 lg:block">{me?.user.fullName || me?.user.email}</span>
          <NotificationCenter />
          <button
            className="rounded-lg border border-white/10 px-3 py-2 text-sm transition hover:bg-white/[0.05]"
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
