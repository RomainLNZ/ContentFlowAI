import { useEffect, useState, type FormEvent } from "react";
import { Archive, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApplication } from "@/app/application-context";
import { apiRequest } from "@/lib/api-client";
import type { Campaign } from "@/features/calendar/calendar.types";

export function CampaignPage() {
  const { tenant } = useApplication();
  const [items, setItems] = useState<Campaign[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8B5CF6");
  function load() {
    if (tenant) void apiRequest<Campaign[]>("/v1/campaigns", {}, tenant).then(setItems);
  }
  useEffect(load, [tenant]);
  async function create(e: FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    await apiRequest(
      "/v1/campaigns",
      { method: "POST", body: JSON.stringify({ name, color, status: "ACTIVE" }) },
      tenant,
    );
    setName("");
    setCreating(false);
    load();
  }
  async function archive(id: string) {
    if (!tenant) return;
    await apiRequest(`/v1/campaigns/${id}/archive`, { method: "POST" }, tenant);
    load();
  }
  async function rename(item: Campaign) {
    if (!tenant) return;
    const nextName = window.prompt("Nouveau nom de la campagne", item.name)?.trim();
    if (!nextName || nextName === item.name) return;
    await apiRequest(
      `/v1/campaigns/${item.id}`,
      { method: "PUT", body: JSON.stringify({ name: nextName }) },
      tenant,
    );
    load();
  }
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-violet-400">Organisation</p>
            <h1 className="mt-2 text-4xl font-semibold">Campagnes</h1>
          </div>
          <button
            onClick={() => setCreating(!creating)}
            className="flex gap-2 rounded-xl bg-violet-500 px-4 py-3"
          >
            <Plus />
            Nouvelle campagne
          </button>
        </div>
        {creating && (
          <form
            onSubmit={(e) => void create(e)}
            className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la campagne"
              className="min-w-64 flex-1 rounded-xl border border-white/10 bg-black/20 px-4"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-12 w-14 rounded bg-transparent"
            />
            <button className="rounded-xl bg-violet-500 px-5">Créer</button>
          </form>
        )}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between">
                <span className="h-4 w-4 rounded-full" style={{ background: item.color }} />
                <div>
                  <button
                    onClick={() => void rename(item)}
                    aria-label="Modifier"
                    className="mr-3 text-zinc-500 hover:text-violet-300"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    onClick={() => void archive(item.id)}
                    aria-label="Archiver"
                    className="text-zinc-500 hover:text-red-300"
                  >
                    <Archive size={17} />
                  </button>
                </div>
              </div>
              <h2 className="mt-5 text-lg font-medium">{item.name}</h2>
              <p className="mt-2 text-sm text-zinc-500">
                {item._count?.contentItems || 0} contenu(s) · {item.status}
              </p>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
