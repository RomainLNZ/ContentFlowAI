import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useApplication } from "@/app/application-context";

export function DashboardPage() {
  const { me } = useApplication();
  const organization = me?.memberships[0]?.organization;
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-6 py-14">
        <p className="text-sm font-medium text-violet-400">{organization?.name ?? "Votre espace"}</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">
          Votre équipe de communication IA est prête.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-zinc-400">
          Transformez un brief en trois publications LinkedIn alignées avec votre marque, puis gérez vos
          brouillons sans quitter FlowPilot.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/app/create" className="rounded-xl bg-violet-500 px-6 py-3 font-medium">
            Créer une publication
          </Link>
          <Link to="/app/content" className="rounded-xl border border-white/10 px-6 py-3">
            Voir mes contenus
          </Link>
        </div>
        <section className="mt-16 grid gap-5 md:grid-cols-3">
          {[
            ["01", "Décrivez votre idée"],
            ["02", "Choisissez une variante"],
            ["03", "Peaufinez votre brouillon"],
          ].map(([number, label]) => (
            <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-sm text-violet-400">{number}</span>
              <h2 className="mt-8 text-xl font-medium">{label}</h2>
            </div>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
