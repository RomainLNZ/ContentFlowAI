import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useApplication } from "@/app/application-context";
import { apiRequest } from "@/lib/api-client";
import type { ContentItem } from "../content.types";

export function ContentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenant } = useApplication();
  const [item, setItem] = useState<ContentItem>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tenant && id) void apiRequest<ContentItem>(`/v1/content/${id}`, {}, tenant).then(setItem);
  }, [id, tenant]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!tenant || !item) return;
    const updated = await apiRequest<ContentItem>(
      `/v1/content/${item.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: item.title,
          body: item.body,
          status: item.status,
          tone: item.tone ?? undefined,
          targetAudience: item.targetAudience ?? undefined,
        }),
      },
      tenant,
    );
    setItem(updated);
    setSaved(true);
  }

  async function duplicate() {
    if (!tenant || !item) return;
    const copy = await apiRequest<ContentItem>(
      `/v1/content/${item.id}/duplicate`,
      { method: "POST" },
      tenant,
    );
    navigate(`/app/content/${copy.id}`);
  }

  async function archive() {
    if (!tenant || !item) return;
    await apiRequest(`/v1/content/${item.id}/archive`, { method: "POST" }, tenant);
    navigate("/app/content");
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-6 py-10">
        {!item ? (
          <p className="text-zinc-500">Chargement…</p>
        ) : (
          <form onSubmit={save} className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-semibold">Modifier le contenu</h1>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void duplicate()}
                  className="rounded-xl border border-white/10 px-4 py-2"
                >
                  Dupliquer
                </button>
                <button
                  type="button"
                  onClick={() => void archive()}
                  className="rounded-xl border border-red-400/20 px-4 py-2 text-red-300"
                >
                  Archiver
                </button>
              </div>
            </div>
            <label className="text-sm text-zinc-300">
              Titre
              <input
                value={item.title}
                onChange={(event) => {
                  setSaved(false);
                  setItem({ ...item, title: event.target.value });
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
              />
            </label>
            <label className="text-sm text-zinc-300">
              Publication
              <textarea
                value={item.body}
                onChange={(event) => {
                  setSaved(false);
                  setItem({ ...item, body: event.target.value });
                }}
                className="mt-2 min-h-96 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 leading-7"
              />
            </label>
            <label className="text-sm text-zinc-300">
              Statut
              <select
                value={item.status}
                onChange={(event) =>
                  setItem({ ...item, status: event.target.value as ContentItem["status"] })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#15151b] px-4 py-3"
              >
                <option value="DRAFT">Brouillon</option>
                <option value="READY_FOR_REVIEW">À relire</option>
              </select>
            </label>
            <button className="rounded-xl bg-violet-500 px-5 py-3 font-medium">Enregistrer</button>
            {saved && <p className="text-center text-sm text-emerald-300">Modifications enregistrées.</p>}
          </form>
        )}
      </main>
    </AppShell>
  );
}
