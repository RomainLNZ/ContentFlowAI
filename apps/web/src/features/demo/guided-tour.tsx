import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, LogOut, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { leaveDemo } from "./demo-mode";

type TourStep = {
  title: string;
  description: string;
  path: string;
  target?: string;
  eyebrow: string;
};

const steps: TourStep[] = [
  {
    eyebrow: "Bienvenue chez Atelier Nova",
    title: "Votre communication, enfin réunie au même endroit.",
    description:
      "En moins de trois minutes, votre Director va vous montrer comment FlowPilot aide l’équipe à planifier, créer et suivre chaque prise de parole.",
    path: "/app",
  },
  {
    eyebrow: "Étape 1 · Director",
    title: "Commencez chaque journée avec les bonnes priorités.",
    description:
      "Le Director observe l’activité de l’espace, détecte les opportunités et transforme les signaux dispersés en prochaines actions concrètes.",
    path: "/app",
    target: '[data-tour="director"]',
  },
  {
    eyebrow: "Étape 2 · Calendrier",
    title: "Visualisez un rythme éditorial vivant.",
    description:
      "Publications planifiées, contenus validés et campagnes se répondent dans le même calendrier. Déplacez un contenu pour ajuster le planning.",
    path: "/app/calendar",
    target: '[data-tour="calendar"]',
  },
  {
    eyebrow: "Étape 3 · Campagnes",
    title: "Gardez chaque temps fort cohérent.",
    description:
      "Rentrée, recrutement et salon professionnel possèdent leur propre cap, leur couleur et leurs contenus associés.",
    path: "/app/campaigns",
    target: '[data-tour="campaigns"]',
  },
  {
    eyebrow: "Étape 4 · Content Studio",
    title: "Passez d’une idée à trois angles exploitables.",
    description:
      "Le Content Studio s’appuie sur le Brand Profile pour proposer des directions éditoriales distinctes, prêtes à devenir des brouillons.",
    path: "/app/create",
    target: '[data-tour="content-studio"]',
  },
  {
    eyebrow: "Étape 5 · Bibliothèque",
    title: "Suivez chaque contenu, du brouillon à la publication.",
    description:
      "Retrouvez le statut, la campagne, le responsable et les échanges de validation sans perdre le fil de l’histoire.",
    path: "/app/content",
    target: '[data-tour="content-library"]',
  },
  {
    eyebrow: "Visite terminée",
    title: "Vous venez de découvrir FlowPilot.",
    description:
      "Votre équipe peut maintenant donner un cap à sa communication, produire avec cohérence et avancer sans perdre de temps.",
    path: "/app/content",
  },
];

function navigate(path: string) {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function GuidedTour() {
  const [active, setActive] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const step = steps[stepIndex]!;
  const terminal = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!active) return;
    navigate(step.path);
    if (!step.target) return;
    let attempts = 0;
    let highlighted: HTMLElement | null = null;
    let previousStyle = "";
    const timer = window.setInterval(() => {
      attempts += 1;
      const target = document.querySelector<HTMLElement>(step.target!);
      if (!target && attempts < 30) return;
      window.clearInterval(timer);
      if (!target) return;
      highlighted = target;
      previousStyle = target.style.cssText;
      target.style.position = "relative";
      target.style.zIndex = "70";
      target.style.borderRadius = "24px";
      target.style.outline = "2px solid rgba(167, 139, 250, .9)";
      target.style.boxShadow = "0 0 0 9999px rgba(4, 5, 8, .72), 0 24px 90px rgba(0, 0, 0, .55)";
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }, 60);
    return () => {
      window.clearInterval(timer);
      if (highlighted) highlighted.style.cssText = previousStyle;
    };
  }, [active, reduceMotion, step]);

  function restart() {
    setActive(true);
    setStepIndex(0);
  }

  return (
    <>
      <div className="fixed right-4 top-4 z-[100] flex flex-wrap justify-end gap-2 sm:right-6 sm:top-5">
        <button
          type="button"
          onClick={restart}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#15161c]/95 px-3 text-xs font-medium text-zinc-200 shadow-xl backdrop-blur-xl transition hover:bg-[#20212a]"
        >
          <RotateCcw size={14} /> Recommencer la visite
        </button>
        <button
          type="button"
          onClick={() => leaveDemo("/")}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#15161c]/95 px-3 text-xs font-medium text-zinc-200 shadow-xl backdrop-blur-xl transition hover:bg-[#20212a]"
        >
          <LogOut size={14} /> Quitter la démo
        </button>
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={stepIndex}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={
              step.target
                ? "fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-xl sm:bottom-6"
                : "fixed inset-0 z-[90] grid place-items-center bg-[#07080b]/85 p-4 backdrop-blur-md"
            }
          >
            <section className="relative overflow-hidden rounded-3xl border border-violet-300/20 bg-[#14151b]/[.98] p-6 shadow-[0_30px_120px_rgba(0,0,0,.65)] sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-violet-500/15 blur-3xl" />
              {!terminal && (
                <button
                  type="button"
                  aria-label="Fermer la visite"
                  onClick={() => setActive(false)}
                  className="absolute right-4 top-4 z-10 rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={17} />
                </button>
              )}
              <span className="relative inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-violet-300">
                <Sparkles size={14} /> {step.eyebrow}
              </span>
              <h2 className="relative mt-4 max-w-lg text-2xl font-semibold tracking-[-.035em] text-white sm:text-3xl">
                {step.title}
              </h2>
              <p className="relative mt-4 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base">
                {step.description}
              </p>

              {terminal ? (
                <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => leaveDemo("/sign-up")}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-violet-100"
                  >
                    Créer mon espace <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => leaveDemo("/")}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-zinc-200 transition hover:bg-white/5"
                  >
                    Retour au site
                  </button>
                </div>
              ) : (
                <div className="relative mt-7 flex items-center justify-between gap-4">
                  <div className="flex gap-1.5" aria-label={`Étape ${stepIndex + 1} sur ${steps.length}`}>
                    {steps.map((item, index) => (
                      <span
                        key={item.eyebrow}
                        className={`h-1.5 rounded-full transition-all ${index === stepIndex ? "w-7 bg-violet-400" : "w-1.5 bg-white/15"}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {stepIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setStepIndex((current) => current - 1)}
                        className="grid size-11 place-items-center rounded-xl border border-white/10 text-zinc-300 transition hover:bg-white/5"
                        aria-label="Étape précédente"
                      >
                        <ArrowLeft size={17} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStepIndex((current) => Math.min(current + 1, steps.length - 1))}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white transition hover:bg-violet-400"
                    >
                      {stepIndex === 0 ? "Commencer" : "Continuer"} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
