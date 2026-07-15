/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- route changes intentionally reload the collaborative editor panels */
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Archive, Copy, MessageSquare, Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApplication } from "@/app/application-context";
import { apiRequest } from "@/lib/api-client";
import type { Campaign } from "@/features/calendar/calendar.types";
import type { ContentItem } from "../content.types";

type Member = { user: { id: string; fullName: string; email: string }; role: { name: string } };
type Comment = {
  id: string;
  body: string;
  deletedAt: string | null;
  createdAt: string;
  author: { fullName: string };
};
type History = {
  id: string;
  action: string;
  metadata: unknown;
  createdAt: string;
  actor: { fullName: string } | null;
};

const statusLabel: Record<ContentItem["status"], string> = {
  DRAFT: "Brouillon",
  READY_FOR_REVIEW: "À valider",
  CHANGES_REQUESTED: "Corrections demandées",
  APPROVED: "Validé",
  SCHEDULED: "Planifié",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export function ContentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenant } = useApplication();
  const [item, setItem] = useState<ContentItem>();
  const [members, setMembers] = useState<Member[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);
  async function load() {
    if (!tenant || !id) return;
    const [content, memberData, campaignData, commentData, historyData] = await Promise.all([
      apiRequest<ContentItem>(`/v1/content/${id}`, {}, tenant),
      apiRequest<Member[]>("/v1/workspace-members", {}, tenant),
      apiRequest<Campaign[]>("/v1/campaigns", {}, tenant),
      apiRequest<Comment[]>(`/v1/content/${id}/comments`, {}, tenant),
      apiRequest<History[]>(`/v1/content/${id}/history`, {}, tenant),
    ]);
    setItem(content);
    setMembers(memberData);
    setCampaigns(campaignData);
    setComments(commentData);
    setHistory(historyData);
  }
  useEffect(() => {
    void load();
  }, [id, tenant]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!tenant || !item) return;
    const updated = await apiRequest<ContentItem>(
      `/v1/content/${item.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: item.title,
          body: item.body,
          cta: item.cta || undefined,
          hashtags: item.hashtags,
          campaignId: item.campaignId || null,
        }),
      },
      tenant,
    );
    setItem({ ...item, ...updated });
    setSaved(true);
  }
  async function transition(to: ContentItem["status"], extra: object = {}) {
    if (!tenant || !item) return;
    const updated = await apiRequest<ContentItem>(
      `/v1/content/${item.id}/transitions`,
      { method: "POST", body: JSON.stringify({ to, ...extra }) },
      tenant,
    );
    setItem(updated);
    await load();
  }
  async function assign(field: "assigneeId" | "reviewerId", value: string) {
    if (!tenant || !item) return;
    const updated = await apiRequest<ContentItem>(
      `/v1/content/${item.id}/assign`,
      { method: "POST", body: JSON.stringify({ [field]: value || null }) },
      tenant,
    );
    setItem({ ...item, ...updated });
  }
  async function moveDate(value: string) {
    if (!tenant || !item) return;
    const scheduledAt = value ? new Date(value).toISOString() : null;
    const updated = await apiRequest<ContentItem>(
      `/v1/content/${item.id}/calendar-date`,
      {
        method: "PATCH",
        body: JSON.stringify({
          scheduledAt,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      },
      tenant,
    );
    setItem({ ...item, ...updated });
  }
  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!tenant || !item || !comment.trim()) return;
    await apiRequest(
      `/v1/content/${item.id}/comments`,
      { method: "POST", body: JSON.stringify({ body: comment, mentionedUserIds: [] }) },
      tenant,
    );
    setComment("");
    await load();
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
    await transition("ARCHIVED");
    navigate("/app/content");
  }
  if (!item)
    return (
      <AppShell>
        <main className="mx-auto max-w-6xl px-6 py-10 text-zinc-500">Chargement de l’éditeur…</main>
      </AppShell>
    );
  const actions = workflowActions(item.status);
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
              {statusLabel[item.status]}
            </span>
            <h1 className="mt-3 text-3xl font-semibold">Éditeur de contenu</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void duplicate()}
              className="flex gap-2 rounded-xl border border-white/10 px-3 py-2"
            >
              <Copy size={17} />
              Dupliquer
            </button>
            {item.status !== "ARCHIVED" && (
              <button
                onClick={() => void archive()}
                className="rounded-xl border border-red-400/20 p-2 text-red-300"
              >
                <Archive size={18} />
              </button>
            )}
          </div>
        </header>
        <div className="mt-6 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.to}
              onClick={() => {
                if (action.to === "CHANGES_REQUESTED") {
                  const reason = window.prompt("Raison des corrections demandées");
                  if (reason) void transition(action.to, { reason });
                } else if (action.to === "SCHEDULED") {
                  if (!item.scheduledAt) return;
                  void transition(action.to, { scheduledAt: item.scheduledAt, timezone: item.timezone });
                } else
                  void transition(
                    action.to,
                    item.reviewerId && action.to === "READY_FOR_REVIEW"
                      ? { reviewerId: item.reviewerId }
                      : {},
                  );
              }}
              className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium"
            >
              {action.label}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <form
            onSubmit={(e) => void save(e)}
            className="grid gap-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5"
          >
            <Field label="Titre">
              <input
                value={item.title}
                onChange={(e) => {
                  setSaved(false);
                  setItem({ ...item, title: e.target.value });
                }}
                className="input"
              />
            </Field>
            <Field label="Publication">
              <textarea
                value={item.body}
                onChange={(e) => {
                  setSaved(false);
                  setItem({ ...item, body: e.target.value });
                }}
                className="input min-h-80 leading-7"
              />
            </Field>
            <Field label="CTA">
              <input
                value={item.cta || ""}
                onChange={(e) => setItem({ ...item, cta: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Hashtags">
              <input
                value={item.hashtags.join(" ")}
                onChange={(e) => setItem({ ...item, hashtags: e.target.value.split(/\s+/).filter(Boolean) })}
                placeholder="#communication #marque"
                className="input"
              />
            </Field>
            <button className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-medium">
              <Save size={18} />
              Enregistrer
            </button>
            {saved && <p className="text-center text-sm text-emerald-300">Modifications enregistrées.</p>}
          </form>
          <aside className="grid content-start gap-4">
            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <h2 className="font-medium">Planification</h2>
              <Field label="Date éditoriale">
                <input
                  type="datetime-local"
                  value={item.scheduledAt ? localDate(item.scheduledAt) : ""}
                  onChange={(e) => void moveDate(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Campagne">
                <select
                  value={item.campaignId || ""}
                  onChange={(e) => setItem({ ...item, campaignId: e.target.value || null })}
                  className="input bg-[#18191f]"
                >
                  <option value="">Aucune</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Responsable">
                <select
                  value={item.assigneeId || ""}
                  onChange={(e) => void assign("assigneeId", e.target.value)}
                  className="input bg-[#18191f]"
                >
                  <option value="">Non assigné</option>
                  {members.map(({ user }) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName || user.email}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Validateur">
                <select
                  value={item.reviewerId || ""}
                  onChange={(e) => void assign("reviewerId", e.target.value)}
                  className="input bg-[#18191f]"
                >
                  <option value="">Non assigné</option>
                  {members.map(({ user }) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName || user.email}
                    </option>
                  ))}
                </select>
              </Field>
            </section>
          </aside>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="flex items-center gap-2 font-medium">
              <MessageSquare size={18} />
              Commentaires ({comments.filter((c) => !c.deletedAt).length})
            </h2>
            <div className="mt-4 grid max-h-96 gap-3 overflow-auto">
              {comments.length ? (
                comments.map((entry) => (
                  <article key={entry.id} className="rounded-xl bg-white/[0.04] p-3">
                    <strong className="text-sm">{entry.author.fullName}</strong>
                    <p className="mt-1 text-sm text-zinc-300">
                      {entry.deletedAt ? "Commentaire supprimé" : entry.body}
                    </p>
                    <small className="text-zinc-600">
                      {new Date(entry.createdAt).toLocaleString("fr-FR")}
                    </small>
                  </article>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Aucun commentaire.</p>
              )}
            </div>
            <form onSubmit={(e) => void addComment(e)} className="mt-4 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajouter un commentaire…"
                className="input flex-1"
              />
              <button className="rounded-xl bg-violet-500 px-4">Envoyer</button>
            </form>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Historique immuable</h2>
            <div className="mt-4 grid max-h-[30rem] gap-4 overflow-auto border-l border-white/10 pl-4">
              {history.map((entry) => (
                <article key={entry.id}>
                  <strong className="text-sm">{historyLabel(entry.action)}</strong>
                  <p className="text-xs text-zinc-500">
                    {entry.actor?.fullName || "Système"} · {new Date(entry.createdAt).toLocaleString("fr-FR")}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block text-sm text-zinc-400">
      {label}
      {children}
    </label>
  );
}
function localDate(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function workflowActions(status: ContentItem["status"]) {
  return (
    {
      DRAFT: [{ to: "READY_FOR_REVIEW", label: "Demander une validation" }],
      READY_FOR_REVIEW: [
        { to: "APPROVED", label: "Approuver" },
        { to: "CHANGES_REQUESTED", label: "Demander des corrections" },
        { to: "DRAFT", label: "Retirer de la validation" },
      ],
      CHANGES_REQUESTED: [
        { to: "DRAFT", label: "Repasser en brouillon" },
        { to: "READY_FOR_REVIEW", label: "Resoumettre" },
      ],
      APPROVED: [{ to: "SCHEDULED", label: "Valider la planification" }],
      SCHEDULED: [
        { to: "PUBLISHED", label: "Marquer comme publié" },
        { to: "APPROVED", label: "Déplanifier" },
      ],
      PUBLISHED: [],
      ARCHIVED: [],
    } as Record<ContentItem["status"], Array<{ to: ContentItem["status"]; label: string }>>
  )[status];
}
function historyLabel(action: string) {
  return (
    (
      {
        "content.created": "Contenu créé",
        "content.updated": "Contenu modifié",
        "content.review_requested": "Validation demandée",
        "content.approved": "Contenu approuvé",
        "content.changes_requested": "Corrections demandées",
        "content.scheduled": "Planification validée",
        "content.calendar_moved": "Date éditoriale modifiée",
        "content.assigned": "Assignation modifiée",
        "content.comment_added": "Commentaire ajouté",
        "content.comment_updated": "Commentaire modifié",
        "content.comment_deleted": "Commentaire supprimé",
        "content.archived": "Contenu archivé",
      } as Record<string, string>
    )[action] ?? action
  );
}
