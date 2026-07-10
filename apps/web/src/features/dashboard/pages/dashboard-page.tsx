import { Logo } from "@/components/brand/logo";
import { Button } from "@communicationos/ui";
import { supabase } from "@/lib/supabase";

export function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#08090c] p-6 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <Button variant="secondary" size="sm" onClick={() => void supabase.auth.signOut()}>
          Se déconnecter
        </Button>
      </header>
      <section className="mx-auto mt-20 max-w-7xl">
        <p className="text-xs uppercase tracking-[.2em] text-violet-400">Socle validé</p>
        <h1 className="mt-4 max-w-2xl text-5xl font-medium tracking-[-.04em]">
          Votre espace de communication est prêt.
        </h1>
        <p className="mt-5 text-zinc-500">
          Le dashboard métier sera développé lors de la prochaine fonctionnalité validée.
        </p>
      </section>
    </main>
  );
}
