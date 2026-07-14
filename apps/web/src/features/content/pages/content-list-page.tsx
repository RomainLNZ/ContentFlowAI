import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useApplication } from "@/app/application-context";
import { apiRequest } from "@/lib/api-client";
import type { ContentItem } from "../content.types";

export function ContentListPage() {
  const { tenant } = useApplication();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (status) query.set("status", status);
    const timeout = window.setTimeout(() => {
      void apiRequest<{ items: ContentItem[] }>(`/v1/content?${query}`, {}, tenant)
        .then((result) => setItems(result.items))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [q, status, tenant]);

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-violet-400">Bibliothèque</p>
            <h1 className="mt-2 text-4xl font-semibold">Mes contenus</h1>
          </div>
          <Link to="/app/create" className="rounded-xl bg-violet-500 px-5 py-3 font-medium">
            Créer un contenu
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <input
            aria-label="Rechercher"
            placeholder="Rechercher dans les titres et contenus…"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="min-w-72 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
          />
          <select
            aria-label="Statut"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#15151b] px-4 py-3"
          >
            <option value="">Actifs</option>
            <option value="DRAFT">Brouillons</option>
            <option value="READY_FOR_REVIEW">À relire</option>
            <option value="ARCHIVED">Archivés</option>
          </select>
        </div>
        <section className="mt-8 grid gap-4">
          {loading && <p className="text-zinc-500">Chargement…</p>}
          {!loading && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-zinc-400">
              Aucun contenu ne correspond à vos filtres.
            </div>
          )}
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/app/content/${item.id}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-400/30"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-medium">{item.title}</h2>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">{item.status}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{item.body}</p>
              <p className="mt-4 text-xs text-zinc-600">
                Modifié le {new Date(item.updatedAt).toLocaleDateString("fr-FR")}
              </p>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
