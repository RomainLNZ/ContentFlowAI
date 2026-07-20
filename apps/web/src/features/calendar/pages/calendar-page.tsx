/* eslint-disable react-hooks/exhaustive-deps -- calendar reloads are keyed by explicit tenant, period and filter primitives */
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, MessageSquare, Plus, Search, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApplication } from "@/app/application-context";
import { useDataTransport } from "@/app/data-transport-context";
import type { CalendarItem, Campaign, ContentStatus } from "../calendar.types";

type View = "month" | "week" | "list";
const DAY = 86_400_000;
const statuses: Array<{ value: ContentStatus; label: string; color: string }> = [
  { value: "DRAFT", label: "Brouillon", color: "bg-zinc-400" },
  { value: "READY_FOR_REVIEW", label: "À valider", color: "bg-amber-400" },
  { value: "CHANGES_REQUESTED", label: "Corrections", color: "bg-rose-400" },
  { value: "APPROVED", label: "Validé", color: "bg-emerald-400" },
  { value: "SCHEDULED", label: "Planifié", color: "bg-violet-400" },
  { value: "PUBLISHED", label: "Publié", color: "bg-sky-400" },
  { value: "ARCHIVED", label: "Archivé", color: "bg-zinc-600" },
];

const startDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date: Date, count: number) => new Date(date.getTime() + count * DAY);
const startWeek = (date: Date) => addDays(startDay(date), -((date.getDay() + 6) % 7));
const statusInfo = (status: ContentStatus) => statuses.find((item) => item.value === status)!;

function rangeFor(anchor: Date, view: View) {
  if (view === "month") {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const from = startWeek(first);
    return { from, to: addDays(from, 42) };
  }
  if (view === "week") {
    const from = startWeek(anchor);
    return { from, to: addDays(from, 7) };
  }
  const from = startDay(anchor);
  return { from: addDays(from, -15), to: addDays(from, 45) };
}

export function CalendarPage() {
  const { tenant } = useApplication();
  const transport = useDataTransport();
  const [view, setView] = useState<View>(
    () => (localStorage.getItem("flowpilot-calendar-view") as View) || "month",
  );
  const [anchor, setAnchor] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CalendarItem>();
  const [quickDate, setQuickDate] = useState<Date>();
  const range = useMemo(() => rangeFor(anchor, view), [anchor, view]);

  async function load() {
    if (!tenant) return;
    setLoading(true);
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString(), view });
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (campaignId) params.set("campaignId", campaignId);
    const result = await transport.request<{ items: CalendarItem[] }>(`/v1/calendar?${params}`, {}, tenant);
    setItems(result.items);
    setLoading(false);
  }

  useEffect(() => {
    if (!tenant) return;
    void transport.request<Campaign[]>("/v1/campaigns", {}, tenant).then(setCampaigns);
  }, [tenant, transport]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
    // The timestamp dependencies intentionally track period boundaries.
  }, [tenant, range.from.getTime(), range.to.getTime(), view, query, status, campaignId]);

  function changeView(next: View) {
    setView(next);
    localStorage.setItem("flowpilot-calendar-view", next);
  }
  function navigate(direction: number) {
    setAnchor(
      view === "month"
        ? new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1)
        : addDays(anchor, direction * (view === "week" ? 7 : 30)),
    );
  }
  async function move(item: CalendarItem, date: Date) {
    if (!tenant) return;
    const previous = items;
    const old = item.scheduledAt ? new Date(item.scheduledAt) : new Date();
    const scheduledAt = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      old.getHours() || 9,
      old.getMinutes(),
    ).toISOString();
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, scheduledAt } : entry)));
    try {
      await transport.request(
        `/v1/content/${item.id}/calendar-date`,
        {
          method: "PATCH",
          body: JSON.stringify({ scheduledAt, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
        },
        tenant,
      );
    } catch {
      setItems(previous);
    }
  }

  const title =
    view === "month"
      ? anchor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : `${range.from.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${addDays(range.to, -1).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
  const days = Array.from(
    { length: Math.round((range.to.getTime() - range.from.getTime()) / DAY) },
    (_, index) => addDays(range.from, index),
  );

  return (
    <AppShell>
      <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-400">Planning éditorial</p>
            <h1 className="mt-1 text-3xl font-semibold capitalize sm:text-4xl">{title}</h1>
          </div>
          <button
            onClick={() => setQuickDate(new Date())}
            className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 font-medium hover:bg-violet-400"
          >
            <Plus size={18} />
            Créer
          </button>
        </header>
        <section
          data-tour="calendar"
          className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/20"
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
            <button
              aria-label="Période précédente"
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 hover:bg-white/10"
            >
              <ChevronLeft />
            </button>
            <button
              aria-label="Période suivante"
              onClick={() => navigate(1)}
              className="rounded-lg p-2 hover:bg-white/10"
            >
              <ChevronRight />
            </button>
            <button
              onClick={() => setAnchor(new Date())}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm"
            >
              Aujourd’hui
            </button>
            <div className="ml-auto flex rounded-xl bg-black/30 p-1">
              {(["month", "week", "list"] as View[]).map((value) => (
                <button
                  key={value}
                  onClick={() => changeView(value)}
                  className={`rounded-lg px-3 py-2 text-sm ${view === value ? "bg-white/10 text-white" : "text-zinc-500"}`}
                >
                  {value === "month" ? "Mois" : value === "week" ? "Semaine" : "Liste"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
            <label className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
              <Search size={16} className="text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un contenu…"
                className="w-full bg-transparent py-2.5 outline-none"
              />
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#15151b] px-3"
            >
              <option value="">Tous les statuts</option>
              {statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#15151b] px-3"
            >
              <option value="">Toutes les campagnes</option>
              {campaigns.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <CalendarSkeleton />
          ) : view === "list" ? (
            <ListView items={items} onSelect={setSelected} />
          ) : (
            <GridView
              days={days}
              items={items}
              view={view}
              onMove={move}
              onSelect={setSelected}
              onCreate={setQuickDate}
            />
          )}
        </section>
      </main>
      {selected && (
        <DetailPanel
          item={selected}
          onClose={() => setSelected(undefined)}
          onMove={(date) => void move(selected, date)}
        />
      )}{" "}
      {quickDate && (
        <QuickCreate
          date={quickDate}
          campaigns={campaigns}
          onClose={() => setQuickDate(undefined)}
          onCreated={() => {
            setQuickDate(undefined);
            void load();
          }}
        />
      )}
    </AppShell>
  );
}

function ContentCard({ item, onSelect }: { item: CalendarItem; onSelect: (item: CalendarItem) => void }) {
  const info = statusInfo(item.status);
  return (
    <button
      draggable
      onDragStart={(event: DragEvent<HTMLButtonElement>) =>
        event.dataTransfer.setData("text/content-id", item.id)
      }
      onClick={() => onSelect(item)}
      className="group w-full rounded-lg border border-white/10 bg-[#15161c] p-2 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-violet-400/30 motion-reduce:transform-none"
    >
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
        <i className={`h-1.5 w-1.5 rounded-full ${info.color}`} />
        {info.label}
      </span>
      <strong className="mt-1 block line-clamp-2 text-xs font-medium">{item.title}</strong>
      <span className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
        <span>{item.campaign?.name || item.author.fullName || "Sans auteur"}</span>
        {item._count.comments > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare size={10} />
            {item._count.comments}
          </span>
        )}
      </span>
    </button>
  );
}

function GridView({
  days,
  items,
  view,
  onMove,
  onSelect,
  onCreate,
}: {
  days: Date[];
  items: CalendarItem[];
  view: View;
  onMove: (item: CalendarItem, date: Date) => Promise<void>;
  onSelect: (item: CalendarItem) => void;
  onCreate: (date: Date) => void;
}) {
  return (
    <div>
      <div className="hidden grid-cols-7 border-b border-white/10 text-center text-xs uppercase tracking-wider text-zinc-600 sm:grid">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div className="py-2" key={day}>
            {day}
          </div>
        ))}
      </div>
      <div
        className={`grid ${view === "week" ? "grid-cols-1 sm:grid-cols-7" : "grid-cols-1 sm:grid-cols-7"}`}
      >
        {days.map((day) => {
          const dayItems = items.filter(
            (item) => item.scheduledAt && isoDay(new Date(item.scheduledAt)) === isoDay(day),
          );
          const isToday = isoDay(day) === isoDay(new Date());
          return (
            <section
              key={day.toISOString()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const item = items.find((entry) => entry.id === e.dataTransfer.getData("text/content-id"));
                if (item) void onMove(item, day);
              }}
              className={`min-h-36 border-b border-r border-white/[0.07] p-2 ${view === "week" ? "sm:min-h-[34rem]" : "sm:min-h-36"}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs ${isToday ? "bg-violet-500 text-white" : "text-zinc-500"}`}
                >
                  {day.getDate()}
                </span>
                <button
                  aria-label={`Créer le ${day.toLocaleDateString("fr-FR")}`}
                  onClick={() => onCreate(day)}
                  className="rounded p-1 text-zinc-700 hover:bg-white/10 hover:text-white"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="mt-2 grid gap-1.5">
                {dayItems.map((item) => (
                  <ContentCard key={item.id} item={item} onSelect={onSelect} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ items, onSelect }: { items: CalendarItem[]; onSelect: (item: CalendarItem) => void }) {
  return (
    <div className="divide-y divide-white/[0.07]">
      {items.length ? (
        items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="flex w-full items-center gap-4 p-4 text-left hover:bg-white/[0.03]"
          >
            <span className={`h-2 w-2 rounded-full ${statusInfo(item.status).color}`} />
            <span className="w-28 text-sm text-zinc-500">
              {item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString("fr-FR") : "Sans date"}
            </span>
            <strong className="flex-1 text-sm">{item.title}</strong>
            <span className="hidden text-xs text-zinc-500 sm:block">{item.campaign?.name}</span>
          </button>
        ))
      ) : (
        <Empty />
      )}
    </div>
  );
}
function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-px bg-white/5 p-px sm:grid-cols-7">
      {Array.from({ length: 21 }, (_, i) => (
        <div key={i} className="h-36 animate-pulse bg-[#101116] p-3">
          <div className="h-3 w-8 rounded bg-white/5" />
          <div className="mt-6 h-12 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
function Empty() {
  return (
    <div className="grid min-h-64 place-items-center text-center text-zinc-500">
      <div>
        <CalendarDays className="mx-auto mb-3" />
        <p>Aucun contenu sur cette période.</p>
      </div>
    </div>
  );
}

function DetailPanel({
  item,
  onClose,
  onMove,
}: {
  item: CalendarItem;
  onClose: () => void;
  onMove: (date: Date) => void;
}) {
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-white/10 bg-[#0d0e12] p-6 shadow-2xl">
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-4 rounded-lg p-2 hover:bg-white/10"
      >
        <X />
      </button>
      <p className="text-sm text-violet-400">{item.platform}</p>
      <h2 className="mt-3 pr-10 text-2xl font-semibold">{item.title}</h2>
      <div className="mt-6 grid gap-4 text-sm">
        <p>
          <span className="text-zinc-500">Statut · </span>
          {statusInfo(item.status).label}
        </p>
        <p>
          <span className="text-zinc-500">Auteur · </span>
          {item.author.fullName}
        </p>
        <p>
          <span className="text-zinc-500">Responsable · </span>
          {item.assignee?.fullName || "Non assigné"}
        </p>
        <p>
          <span className="text-zinc-500">Campagne · </span>
          {item.campaign?.name || "Aucune"}
        </p>
        <label className="text-zinc-500">
          Déplacer vers
          <input
            type="date"
            value={item.scheduledAt ? isoDay(new Date(item.scheduledAt)) : ""}
            onChange={(e) => e.target.value && onMove(new Date(`${e.target.value}T12:00:00`))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white"
          />
        </label>
      </div>
      <Link
        to={`/app/content/${item.id}`}
        className="mt-8 block rounded-xl bg-violet-500 px-4 py-3 text-center font-medium"
      >
        Ouvrir l’éditeur
      </Link>
    </aside>
  );
}

function QuickCreate({
  date,
  campaigns,
  onClose,
  onCreated,
}: {
  date: Date;
  campaigns: Campaign[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { tenant } = useApplication();
  const transport = useDataTransport();
  const [title, setTitle] = useState("");
  const [campaignId, setCampaignId] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    const item = await transport.request<{ id: string }>(
      "/v1/content",
      { method: "POST", body: JSON.stringify({ title, body: title, campaignId: campaignId || undefined }) },
      tenant,
    );
    await transport.request(
      `/v1/content/${item.id}/calendar-date`,
      {
        method: "PATCH",
        body: JSON.stringify({
          scheduledAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      },
      tenant,
    );
    onCreated();
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121319] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Créer le {date.toLocaleDateString("fr-FR")}</h2>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </div>
        <label className="mt-6 block text-sm text-zinc-400">
          Titre
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white"
          />
        </label>
        <label className="mt-4 block text-sm text-zinc-400">
          Campagne
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#191a20] px-4 py-3 text-white"
          >
            <option value="">Aucune</option>
            {campaigns.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button className="mt-6 w-full rounded-xl bg-violet-500 px-4 py-3 font-medium">
          Créer le brouillon
        </button>
      </form>
    </div>
  );
}
