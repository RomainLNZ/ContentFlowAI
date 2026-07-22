import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Flame, Lightbulb, Sparkles, TrendingUp, TriangleAlert, X } from "lucide-react";
import type { DirectorCardKind, DirectorCardModel } from "../director-card.model";

type Props = {
  card: DirectorCardModel;
  featured?: boolean;
  busy?: boolean;
  index?: number;
  onDismiss: (id: string) => void;
  onAction: (card: DirectorCardModel) => void;
};

const treatments: Record<
  DirectorCardKind,
  { shell: string; accent: string; icon: typeof Flame; glow: string }
> = {
  priority: {
    shell: "border-orange-300/20 bg-[linear-gradient(145deg,rgba(251,146,60,.105),rgba(255,255,255,.025)_46%)]",
    accent: "text-orange-200",
    icon: Flame,
    glow: "bg-orange-400/20",
  },
  opportunity: {
    shell: "border-emerald-300/20 bg-[linear-gradient(145deg,rgba(52,211,153,.09),rgba(255,255,255,.025)_46%)]",
    accent: "text-emerald-200",
    icon: TrendingUp,
    glow: "bg-emerald-400/15",
  },
  attention: {
    shell: "border-amber-300/20 bg-[linear-gradient(145deg,rgba(251,191,36,.085),rgba(255,255,255,.025)_46%)]",
    accent: "text-amber-200",
    icon: TriangleAlert,
    glow: "bg-amber-300/15",
  },
  insight: {
    shell: "border-violet-300/20 bg-[linear-gradient(145deg,rgba(139,92,246,.11),rgba(255,255,255,.025)_46%)]",
    accent: "text-violet-200",
    icon: Lightbulb,
    glow: "bg-violet-400/20",
  },
};

export function RecommendationCard({ card, featured = false, busy = false, index = 0, onDismiss, onAction }: Props) {
  const reduceMotion = useReducedMotion();
  const treatment = treatments[card.kind];
  const Icon = treatment.icon;
  const { recommendation } = card;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: reduceMotion ? 0 : index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative isolate flex h-full flex-col overflow-hidden rounded-[26px] border shadow-[0_24px_80px_rgba(0,0,0,.22)] transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_30px_90px_rgba(0,0,0,.3)] ${featured ? "p-6 sm:p-8" : "p-5 sm:p-6"} ${treatment.shell}`}
    >
      <div className={`pointer-events-none absolute -right-16 -top-20 -z-10 size-52 rounded-full blur-3xl ${treatment.glow}`} />
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${treatment.accent}`}>
          <span className="grid size-8 place-items-center rounded-xl border border-current/15 bg-black/15">
            <Icon size={15} strokeWidth={1.8} />
          </span>
          {card.label}
        </div>
        <button
          type="button"
          aria-label="Ignorer cette recommandation"
          title="Ignorer"
          disabled={busy}
          onClick={() => onDismiss(recommendation.id)}
          className="fp-focus grid size-9 shrink-0 place-items-center rounded-xl text-zinc-500 opacity-70 transition hover:bg-white/[0.06] hover:text-zinc-200 hover:opacity-100 disabled:opacity-30"
        >
          <X size={15} />
        </button>
      </div>

      <div className={featured ? "mt-8 max-w-3xl" : "mt-6"}>
        <h2 className={`${featured ? "text-2xl sm:text-[32px] sm:leading-[1.15]" : "text-xl sm:text-2xl"} font-semibold tracking-[-0.035em] text-zinc-50`}>
          {recommendation.title}
        </h2>
        <p className={`${featured ? "mt-4 max-w-2xl text-base sm:text-lg" : "mt-3 text-sm sm:text-base"} leading-7 text-zinc-300`}>
          {recommendation.summary}
        </p>
      </div>

      <div className={`${featured ? "mt-8 sm:grid-cols-[1fr_auto]" : "mt-6"} mt-auto grid items-end gap-5 border-t border-white/[0.08] pt-5`}>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
            <Sparkles size={13} className="text-violet-300" /> Pourquoi maintenant
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{recommendation.rationale}</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(card)}
          className="fp-focus group/action inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-zinc-50 px-4 text-sm font-semibold text-zinc-950 shadow-[0_8px_24px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(0,0,0,.28)] disabled:cursor-wait disabled:opacity-50 sm:self-end"
        >
          {card.actionLabel}
          <ArrowUpRight size={15} className="transition-transform duration-300 group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" />
        </button>
      </div>
    </motion.article>
  );
}
