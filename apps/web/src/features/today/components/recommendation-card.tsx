import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  FilePenLine,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import type { DirectorRecommendation } from "../today.types";

type Props = {
  recommendation: DirectorRecommendation;
  rank?: number;
  compact?: boolean;
  busy?: boolean;
  onView: (recommendation: DirectorRecommendation) => void;
  onAccept: (recommendation: DirectorRecommendation) => void;
  onDismiss: (recommendation: DirectorRecommendation) => void;
  onAction: (recommendation: DirectorRecommendation) => void;
};

const priorityStyle = {
  CRITICAL: "border-rose-400/30 bg-rose-400/[0.08] text-rose-200",
  HIGH: "border-amber-400/25 bg-amber-400/[0.07] text-amber-200",
  MEDIUM: "border-violet-400/20 bg-violet-400/[0.06] text-violet-200",
  LOW: "border-sky-400/20 bg-sky-400/[0.05] text-sky-200",
} as const;

export function RecommendationCard({
  recommendation,
  rank,
  compact = false,
  busy = false,
  onView,
  onAccept,
  onDismiss,
  onAction,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const facts = evidenceFacts(recommendation.evidence);
  const confidence = Math.round(Number(recommendation.confidence) * 100);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && recommendation.status === "NEW") onView(recommendation);
  }

  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-3xl border p-5 shadow-[0_18px_70px_rgba(0,0,0,.24)] backdrop-blur-xl sm:p-6 ${priorityStyle[recommendation.priority]}`}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="flex items-start gap-4">
        <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/20">
          {rank ? <span className="font-mono text-sm">0{rank}</span> : icon(recommendation.type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] opacity-75">
            <span>{priorityLabel(recommendation.priority)}</span>
            <span aria-hidden="true">·</span>
            <span>{typeLabel(recommendation.type)}</span>
            {recommendation.status === "ACCEPTED" && (
              <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-300">Acceptée</span>
            )}
          </div>
          <h3
            className={`${compact ? "mt-2 text-lg" : "mt-3 text-xl sm:text-2xl"} font-semibold tracking-[-0.02em] text-zinc-50`}
          >
            {recommendation.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
            {recommendation.summary}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(recommendation)}
          className="fp-focus inline-flex min-h-10 items-center gap-2 rounded-xl bg-zinc-50 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50"
        >
          {actionIcon(recommendation)}
          {actionLabel(recommendation)}
          <ArrowRight size={15} />
        </button>
        {recommendation.status !== "ACCEPTED" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAccept(recommendation)}
            className="fp-focus inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            <Check size={15} /> Accepter
          </button>
        )}
        <button
          type="button"
          aria-expanded={expanded}
          onClick={toggle}
          className="fp-focus ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm text-zinc-300 hover:bg-white/[0.06]"
        >
          Pourquoi ?
          <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          aria-label="Ignorer cette recommandation"
          title="Ignorer"
          disabled={busy}
          onClick={() => onDismiss(recommendation)}
          className="fp-focus grid size-10 place-items-center rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 disabled:opacity-50"
        >
          <X size={16} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Ce que le Director a observé
                </p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                  {(facts.length ? facts : [recommendation.rationale]).map((fact) => (
                    <li key={fact} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current opacity-60" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-w-40 rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Confiance</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-100">{confidence}%</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <div className="h-full rounded-full bg-current" style={{ width: `${confidence}%` }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function evidenceFacts(evidence: unknown): string[] {
  if (!evidence || typeof evidence !== "object" || !("facts" in evidence)) return [];
  const facts = (evidence as { facts?: unknown }).facts;
  return Array.isArray(facts) ? facts.filter((fact): fact is string => typeof fact === "string") : [];
}

function priorityLabel(priority: DirectorRecommendation["priority"]) {
  return { CRITICAL: "Urgent", HIGH: "Prioritaire", MEDIUM: "À considérer", LOW: "À explorer" }[priority];
}

function typeLabel(type: string) {
  return (
    (
      {
        EDITORIAL_GAP: "Silence éditorial",
        CAMPAIGN_GAP: "Campagne",
        OBJECTIVE_IMBALANCE: "Objectif",
        CADENCE_WARNING: "Cadence",
        WORKFLOW_BLOCKER: "Workflow",
        BRAND_PROFILE_INCOMPLETE: "Marque",
        CONTENT_OPPORTUNITY: "Opportunité",
        CALENDAR_SUGGESTION: "Calendrier",
      } as Record<string, string>
    )[type] ?? "Director"
  );
}

function icon(type: string) {
  if (["EDITORIAL_GAP", "CADENCE_WARNING", "WORKFLOW_BLOCKER", "CAMPAIGN_GAP"].includes(type))
    return <CircleAlert size={18} />;
  if (type === "CALENDAR_SUGGESTION") return <CalendarDays size={18} />;
  return <Lightbulb size={18} />;
}

function actionIcon(recommendation: DirectorRecommendation) {
  if (recommendation.type === "CALENDAR_SUGGESTION") return <CalendarDays size={16} />;
  if (["CONTENT_OPPORTUNITY", "OBJECTIVE_IMBALANCE"].includes(recommendation.type))
    return <FilePenLine size={16} />;
  return <Sparkles size={16} />;
}

function actionLabel(recommendation: DirectorRecommendation) {
  if (recommendation.contentId) return "Voir le contenu";
  if (recommendation.campaignId) return "Voir la campagne";
  if (recommendation.type === "CALENDAR_SUGGESTION") return "Ouvrir le calendrier";
  if (["CONTENT_OPPORTUNITY", "OBJECTIVE_IMBALANCE"].includes(recommendation.type))
    return "Préparer un brouillon";
  return "Traiter maintenant";
}
