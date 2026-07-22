import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApplication } from "@/app/application-context";
import { useDataTransport } from "@/app/data-transport-context";
import { AppShell } from "@/components/app-shell";
import { DataTransportError } from "@/lib/data-transport";
import { RecommendationCard } from "../components/recommendation-card";
import { TodaySkeleton } from "../components/today-skeleton";
import { buildDirectorCards, type DirectorCardModel } from "../director-card.model";
import {
  acceptRecommendation,
  dismissRecommendation,
  getDirectorOverview,
  markRecommendationViewed,
  prepareRecommendationDraft,
  runDirectorAnalysis,
} from "../today.api";

export function TodayPage() {
  const { me, tenant } = useApplication();
  const transport = useDataTransport();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const queryKey = ["director-overview", tenant?.organizationId, tenant?.workspaceId];

  const overview = useQuery({
    queryKey,
    queryFn: () => getDirectorOverview(transport, tenant!),
    enabled: Boolean(tenant),
    refetchInterval: ({ state }) => (state.data?.state === "RUNNING" ? 2_500 : false),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });
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

  function action(card: DirectorCardModel) {
    const recommendation = card.recommendation;
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

  const data = overview.data;
  const cards = buildDirectorCards([
    ...(data?.topRecommendations ?? []),
    ...(data?.risks ?? []),
    ...(data?.opportunities ?? []),
  ]);
  const busyId =
    (accept.isPending && accept.variables) ||
    (dismiss.isPending && dismiss.variables) ||
    (prepare.isPending && prepare.variables);
  const firstName = me?.user.fullName?.trim().split(/\s+/)[0];

  return (
    <AppShell>
      <main className="relative isolate mx-auto min-h-[calc(100vh-65px)] max-w-6xl overflow-hidden px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[32rem] w-[54rem] -translate-x-1/2 rounded-full bg-violet-600/[0.075] blur-[110px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[32rem] bg-[linear-gradient(rgba(255,255,255,.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

        <motion.header
          data-tour="director"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-between gap-8 md:flex-row md:items-start"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-40" />
                <span className="relative inline-flex size-2 rounded-full bg-violet-400" />
              </span>
              Director IA
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
              Bonjour{firstName ? ` ${firstName}` : ""}.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
              {cards.length
                ? `Aujourd’hui, voici ${countLabel(Math.min(cards.length, 3))} ayant le plus d’impact.`
                : "Votre espace ne demande aucune intervention immédiate."}
            </p>
          </div>
          <button
            type="button"
            disabled={run.isPending || data?.state === "RUNNING" || !tenant}
            onClick={() => run.mutate()}
            className="fp-focus inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-medium text-zinc-300 transition duration-300 hover:border-white/15 hover:bg-white/[0.075] hover:text-white disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCw size={15} className={run.isPending || data?.state === "RUNNING" ? "animate-spin" : ""} />
            {data?.state === "RUNNING" ? "Analyse en cours…" : "Actualiser l’analyse"}
          </button>
        </motion.header>

        {overview.isLoading ? (
          <TodaySkeleton />
        ) : overview.isError ? (
          <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
        ) : !data?.analysis && data?.state !== "RUNNING" ? (
          <FirstAnalysisState busy={run.isPending} onRun={() => run.mutate()} />
        ) : data?.state === "RUNNING" && !cards.length ? (
          <TodaySkeleton label="Le Director examine votre espace…" />
        ) : cards.length ? (
          <>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-white/[0.07] py-3 text-xs text-zinc-500">
              <span>{freshnessLabel(data?.freshness.state, data?.freshness.ageSeconds)}</span>
              <span className="hidden size-1 rounded-full bg-zinc-700 sm:block" />
              <span>{cards.length} signal{cards.length > 1 ? "s" : ""} utile{cards.length > 1 ? "s" : ""}</span>
              <span className="hidden size-1 rounded-full bg-zinc-700 sm:block" />
              <span>Classés par impact et urgence</span>
            </div>

            <section aria-label="Actions prioritaires" className="mt-8">
              <RecommendationCard
                card={cards[0]!}
                featured
                busy={busyId === cards[0]!.recommendation.id}
                onDismiss={(id) => dismiss.mutate(id)}
                onAction={action}
              />
              {cards.length > 1 && (
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {cards.slice(1, 3).map((card, index) => (
                    <RecommendationCard
                      key={card.recommendation.id}
                      card={card}
                      index={index + 1}
                      busy={busyId === card.recommendation.id}
                      onDismiss={(id) => dismiss.mutate(id)}
                      onAction={action}
                    />
                  ))}
                </div>
              )}
            </section>

            {cards.length > 3 && (
              <section aria-labelledby="other-signals" className="mt-14 border-t border-white/[0.07] pt-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">À garder en vue</p>
                <h2 id="other-signals" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
                  Signaux secondaires
                </h2>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {cards.slice(3, 5).map((card, index) => (
                    <RecommendationCard
                      key={card.recommendation.id}
                      card={card}
                      index={index + 3}
                      busy={busyId === card.recommendation.id}
                      onDismiss={(id) => dismiss.mutate(id)}
                      onAction={action}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <ClearState onRefresh={() => run.mutate()} busy={run.isPending} />
        )}
      </main>
    </AppShell>
  );
}

function FirstAnalysisState({ busy, onRun }: { busy: boolean; onRun: () => void }) {
  return (
    <section className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.025] px-6 py-16 text-center shadow-[0_24px_80px_rgba(0,0,0,.2)] sm:px-12">
      <Sparkles className="mx-auto text-violet-300" />
      <h2 className="mt-5 text-2xl font-semibold">Votre première analyse est prête.</h2>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
        Le Director étudiera les faits de votre espace et fera ressortir uniquement les actions utiles.
      </p>
      <button type="button" disabled={busy} onClick={onRun} className="fp-focus mt-7 rounded-xl bg-zinc-50 px-5 py-3 font-semibold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-50">
        {busy ? "Analyse en cours…" : "Analyser mon espace"}
      </button>
    </section>
  );
}

function ClearState({ busy, onRefresh }: { busy: boolean; onRefresh: () => void }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-12 rounded-[28px] border border-emerald-300/15 bg-emerald-300/[0.035] px-6 py-16 text-center shadow-[0_24px_80px_rgba(0,0,0,.2)] sm:px-12">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-200">
        <CheckCircle2 size={21} />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-50">Tout est sous contrôle.</h2>
      <p className="mx-auto mt-3 max-w-lg leading-7 text-zinc-400">
        Aucun signal ne nécessite votre attention pour le moment. Le Director continue de surveiller votre espace.
      </p>
      <button type="button" disabled={busy} onClick={onRefresh} className="fp-focus mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium transition hover:bg-white/[0.08] disabled:opacity-50">
        <RefreshCw size={15} /> Relancer l’analyse
      </button>
    </motion.section>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const disabled = error instanceof DataTransportError && error.code === "DIRECTOR_DISABLED";
  return (
    <section role="alert" className="mt-12 rounded-3xl border border-rose-400/20 bg-rose-400/[0.06] p-8">
      <h2 className="text-xl font-semibold">{disabled ? "Le Director n’est pas activé pour cet espace." : "Le Director n’a pas pu charger votre briefing."}</h2>
      <p className="mt-2 text-sm text-zinc-400">{error.message}</p>
      {!disabled && <button type="button" onClick={onRetry} className="fp-focus mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm">Réessayer</button>}
    </section>
  );
}

function countLabel(count: number) {
  if (count === 1) return "l’action";
  if (count === 2) return "les deux actions";
  return "les trois actions";
}

function freshnessLabel(state?: string, ageSeconds?: number | null) {
  if (state === "NONE") return "Aucune analyse disponible";
  if (ageSeconds == null) return "Analyse disponible";
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 1) return "Mis à jour à l’instant";
  if (minutes < 60) return `Mis à jour il y a ${minutes} min`;
  return `Mis à jour il y a ${Math.floor(minutes / 60)} h`;
}
