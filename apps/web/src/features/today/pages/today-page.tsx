import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays, FilePenLine, FolderKanban, RefreshCw, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApplication } from "@/app/application-context";
import { useDataTransport } from "@/app/data-transport-context";
import { AppShell } from "@/components/app-shell";
import { DataTransportError } from "@/lib/data-transport";
import { RecommendationCard } from "../components/recommendation-card";
import { TodaySkeleton } from "../components/today-skeleton";
import {
  acceptRecommendation,
  dismissRecommendation,
  getDirectorOverview,
  getRecentRecommendations,
  markRecommendationViewed,
  prepareRecommendationDraft,
  runDirectorAnalysis,
} from "../today.api";
import type { DirectorRecommendation } from "../today.types";

export function TodayPage() {
  const { me, tenant } = useApplication();
  const transport = useDataTransport();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const queryKey = ["director-overview", tenant?.organizationId, tenant?.workspaceId];
  const recentKey = ["director-recommendations", tenant?.organizationId, tenant?.workspaceId];

  const overview = useQuery({
    queryKey,
    queryFn: () => getDirectorOverview(transport, tenant!),
    enabled: Boolean(tenant),
    refetchInterval: ({ state }) => (state.data?.state === "RUNNING" ? 2_500 : false),
  });
  const recent = useQuery({
    queryKey: recentKey,
    queryFn: () => getRecentRecommendations(transport, tenant!),
    enabled: Boolean(tenant),
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: recentKey }),
    ]);
  const run = useMutation({ mutationFn: () => runDirectorAnalysis(transport, tenant!), onSuccess: refresh });
  const view = useMutation({
    mutationFn: (id: string) => markRecommendationViewed(transport, tenant!, id),
    onSuccess: refresh,
  });
  const accept = useMutation({
    mutationFn: (id: string) => acceptRecommendation(transport, tenant!, id),
    onSuccess: refresh,
  });
  const dismiss = useMutation({
    mutationFn: (id: string) => dismissRecommendation(transport, tenant!, id),
    onSuccess: refresh,
  });
  const prepare = useMutation({
    mutationFn: (id: string) => prepareRecommendationDraft(transport, tenant!, id),
    onSuccess: (draft) => navigate("/app/create", { state: { preparedDraft: draft } }),
  });

  function action(recommendation: DirectorRecommendation) {
    if (recommendation.status === "NEW") view.mutate(recommendation.id);
    if (recommendation.contentId) return navigate(`/app/content/${recommendation.contentId}`);
    if (recommendation.campaignId) return navigate("/app/campaigns");
    if (recommendation.type === "CALENDAR_SUGGESTION") return navigate("/app/calendar");
    if (["CONTENT_OPPORTUNITY", "OBJECTIVE_IMBALANCE"].includes(recommendation.type)) {
      prepare.mutate(recommendation.id);
      return;
    }
    accept.mutate(recommendation.id);
  }

  const busyId =
    (accept.isPending && accept.variables) ||
    (dismiss.isPending && dismiss.variables) ||
    (prepare.isPending && prepare.variables);
  const firstName = me?.user.fullName?.trim().split(/\s+/)[0];
  const data = overview.data;

  return (
    <AppShell>
      <main className="relative isolate mx-auto max-w-7xl overflow-hidden px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <motion.header
          data-tour="director"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end"
        >
          <div>
            <p className="text-sm font-medium text-violet-300">
              Aujourd’hui{firstName ? `, ${firstName}` : ""}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Voici ce qui mérite votre attention.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Votre Director a priorisé les prochains gestes utiles à votre communication.
            </p>
          </div>
          <button
            type="button"
            disabled={run.isPending || data?.state === "RUNNING" || !tenant}
            onClick={() => run.mutate()}
            className="fp-focus inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50 md:self-auto"
          >
            <RefreshCw
              size={16}
              className={run.isPending || data?.state === "RUNNING" ? "animate-spin" : ""}
            />
            {data?.state === "RUNNING" ? "Analyse en cours…" : "Actualiser l’analyse"}
          </button>
        </motion.header>

        {overview.isLoading ? (
          <TodaySkeleton />
        ) : overview.isError ? (
          <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
        ) : !data?.analysis && data?.state !== "RUNNING" ? (
          <EmptyState busy={run.isPending} onRun={() => run.mutate()} />
        ) : data?.state === "RUNNING" && !data.topRecommendations.length ? (
          <TodaySkeleton label="Le Director examine votre espace…" />
        ) : (
          <>
            <section aria-labelledby="priorities-title" className="mt-12">
              <SectionHeading
                id="priorities-title"
                eyebrow="Votre cap"
                title="Les trois priorités du jour"
                detail={freshnessLabel(data?.freshness.state, data?.freshness.ageSeconds)}
              />
              <div className="mt-6 grid gap-5">
                {data?.topRecommendations.slice(0, 3).map((recommendation, index) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    rank={index + 1}
                    busy={busyId === recommendation.id}
                    onView={({ id }) => view.mutate(id)}
                    onAccept={({ id }) => accept.mutate(id)}
                    onDismiss={({ id }) => dismiss.mutate(id)}
                    onAction={action}
                  />
                ))}
              </div>
            </section>

            <div className="mt-16 grid gap-12 lg:grid-cols-2">
              <RecommendationSection
                id="opportunities-title"
                eyebrow="À saisir"
                title="Opportunités"
                empty="Aucune opportunité urgente. Votre plan est cohérent."
                items={data?.opportunities ?? []}
                busyId={busyId}
                onView={(id) => view.mutate(id)}
                onAccept={(id) => accept.mutate(id)}
                onDismiss={(id) => dismiss.mutate(id)}
                onAction={action}
              />
              <RecommendationSection
                id="risks-title"
                eyebrow="À surveiller"
                title="Risques"
                empty="Aucun risque significatif détecté aujourd’hui."
                items={data?.risks ?? []}
                busyId={busyId}
                onView={(id) => view.mutate(id)}
                onAccept={(id) => accept.mutate(id)}
                onDismiss={(id) => dismiss.mutate(id)}
                onAction={action}
              />
            </div>

            <section aria-labelledby="recent-title" className="mt-16">
              <SectionHeading id="recent-title" eyebrow="Historique" title="Recommandations récentes" />
              <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                {(recent.data?.items ?? []).slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => action(item)}
                    className="fp-focus flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                  >
                    <span className="size-2 shrink-0 rounded-full bg-violet-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-zinc-100">{item.title}</span>
                      <span className="mt-1 block truncate text-sm text-zinc-500">{item.summary}</span>
                    </span>
                    <span className="hidden text-xs uppercase tracking-wider text-zinc-500 sm:block">
                      {Math.round(Number(item.confidence) * 100)}% confiance
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-zinc-500" />
                  </button>
                ))}
                {!recent.isLoading && !recent.data?.items.length && (
                  <p className="px-5 py-8 text-sm text-zinc-500">Aucune recommandation récente.</p>
                )}
              </div>
            </section>

            <QuickActions onRefresh={() => run.mutate()} busy={run.isPending} />
          </>
        )}
      </main>
    </AppShell>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  detail,
}: {
  id: string;
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          {title}
        </h2>
      </div>
      {detail && <p className="text-sm text-zinc-500">{detail}</p>}
    </div>
  );
}

type RecommendationSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  empty: string;
  items: DirectorRecommendation[];
  busyId?: string | false;
  onView: (id: string) => void;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onAction: (item: DirectorRecommendation) => void;
};

function RecommendationSection({
  id,
  eyebrow,
  title,
  empty,
  items,
  busyId,
  onView,
  onAccept,
  onDismiss,
  onAction,
}: RecommendationSectionProps) {
  return (
    <section aria-labelledby={id}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-5 space-y-4">
        {items.slice(0, 3).map((item) => (
          <RecommendationCard
            key={item.id}
            recommendation={item}
            compact
            busy={busyId === item.id}
            onView={({ id: recommendationId }) => onView(recommendationId)}
            onAccept={({ id: recommendationId }) => onAccept(recommendationId)}
            onDismiss={({ id: recommendationId }) => onDismiss(recommendationId)}
            onAction={onAction}
          />
        ))}
        {!items.length && (
          <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">
            {empty}
          </p>
        )}
      </div>
    </section>
  );
}

function QuickActions({ onRefresh, busy }: { onRefresh: () => void; busy: boolean }) {
  const actions = [
    { to: "/app/create", label: "Créer un contenu", icon: FilePenLine },
    { to: "/app/calendar", label: "Planifier la semaine", icon: CalendarDays },
    { to: "/app/campaigns", label: "Voir les campagnes", icon: FolderKanban },
  ];
  return (
    <section aria-labelledby="quick-actions-title" className="mt-16 border-t border-white/10 pt-10">
      <SectionHeading id="quick-actions-title" eyebrow="Passer à l’action" title="Actions rapides" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="fp-focus flex min-h-24 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 font-medium transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
          >
            <span>{label}</span>
            <Icon size={19} className="text-violet-300" />
          </Link>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={onRefresh}
          className="fp-focus flex min-h-24 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left font-medium transition hover:-translate-y-0.5 hover:bg-white/[0.06] disabled:opacity-50"
        >
          <span>Relancer le Director</span>
          <Sparkles size={19} className="text-violet-300" />
        </button>
      </div>
    </section>
  );
}

function EmptyState({ busy, onRun }: { busy: boolean; onRun: () => void }) {
  return (
    <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center sm:px-12">
      <Sparkles className="mx-auto text-violet-300" />
      <h2 className="mt-5 text-2xl font-semibold">Votre première analyse est prête à commencer.</h2>
      <p className="mx-auto mt-3 max-w-xl text-zinc-400">
        Le Director étudiera uniquement les faits de votre espace pour faire ressortir vos prochaines
        priorités.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onRun}
        className="fp-focus mt-7 rounded-xl bg-zinc-50 px-5 py-3 font-semibold text-zinc-950 disabled:opacity-50"
      >
        {busy ? "Analyse en cours…" : "Analyser mon espace"}
      </button>
    </section>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const disabled = error instanceof DataTransportError && error.code === "DIRECTOR_DISABLED";
  return (
    <section role="alert" className="mt-12 rounded-3xl border border-rose-400/20 bg-rose-400/[0.06] p-8">
      <h2 className="text-xl font-semibold">
        {disabled
          ? "Le Director n’est pas activé pour cet espace."
          : "Le Director n’a pas pu charger votre briefing."}
      </h2>
      <p className="mt-2 text-sm text-zinc-400">{error.message}</p>
      {!disabled && (
        <button
          type="button"
          onClick={onRetry}
          className="fp-focus mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm"
        >
          Réessayer
        </button>
      )}
    </section>
  );
}

function freshnessLabel(state?: string, ageSeconds?: number | null) {
  if (state === "NONE") return "Aucune analyse disponible";
  if (ageSeconds == null) return undefined;
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 1) return "Analyse mise à jour à l’instant";
  if (minutes < 60) return `Analyse mise à jour il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Analyse mise à jour il y a ${hours} h`;
}
