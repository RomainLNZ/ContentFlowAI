import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Menu, Play, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/logo";

const features = [
  {
    n: "01",
    title: "Une stratégie qui ne dort jamais",
    text: "Votre copilote analyse votre rythme, vos objectifs et vos résultats pour décider de la prochaine action utile.",
  },
  {
    n: "02",
    title: "Un calendrier qui pense avec vous",
    text: "Les opportunités, temps forts et contenus sont organisés dans un planning vivant, jamais dans une liste figée.",
  },
  {
    n: "03",
    title: "Votre voix, amplifiée",
    text: "Chaque proposition respecte votre ton, vos convictions et les spécificités de chaque canal.",
  },
  {
    n: "04",
    title: "Des résultats enfin lisibles",
    text: "FlowPilot transforme vos signaux en décisions simples, sans jargon analytique.",
  },
];

function ProductDemo() {
  const [step, setStep] = useState(0);
  const labels = ["Brief du matin", "Planification", "Création"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.35, duration: 0.8 }}
      className="relative mx-auto mt-16 max-w-6xl [perspective:1200px]"
    >
      <div className="absolute -inset-10 -z-10 rounded-full bg-violet-500/20 blur-[100px]" />
      <div className="overflow-hidden rounded-[24px] border border-white/15 bg-[#0d0e14] p-2 shadow-[0_40px_100px_rgba(20,10,50,.45)]">
        <div className="flex h-10 items-center gap-2 border-b border-white/8 px-3 text-[11px] text-zinc-500">
          <i className="size-2 rounded-full bg-rose-400" />
          <i className="size-2 rounded-full bg-amber-300" />
          <i className="size-2 rounded-full bg-emerald-400" />
          <span className="ml-3">Atelier Horizon · Vue d’ensemble</span>
        </div>
        <div className="grid min-h-[430px] grid-cols-[150px_1fr] text-left sm:grid-cols-[190px_1fr]">
          <aside className="hidden border-r border-white/8 p-4 text-xs text-zinc-500 sm:block">
            <div className="mb-8 text-white">✦ FlowPilot</div>
            {["Mon brief", "Créer", "Planifier", "Mes contenus", "Mes résultats"].map((x, i) => (
              <button
                key={x}
                onClick={() => setStep(Math.min(i, 2))}
                className={`mb-1 block w-full rounded-lg px-3 py-2 text-left ${i === step ? "bg-white/8 text-white" : ""}`}
              >
                {x}
              </button>
            ))}
          </aside>
          <div className="p-4 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Lundi 10 juillet</p>
                <h3 className="mt-1 text-xl font-medium text-white">Bonjour Léa, voici l’essentiel.</h3>
              </div>
              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] text-violet-200">
                IA active
              </span>
            </div>
            <div className="mb-5 flex gap-2">
              {labels.map((x, i) => (
                <button
                  key={x}
                  onClick={() => setStep(i)}
                  className={`rounded-full px-3 py-1.5 text-[10px] transition ${i === step ? "bg-white text-black" : "bg-white/5 text-zinc-500"}`}
                >
                  {x}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid gap-4 lg:grid-cols-[1.4fr_.8fr]"
              >
                <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/15 to-fuchsia-400/5 p-5">
                  <div className="mb-4 flex items-center gap-2 text-xs text-violet-200">
                    <Sparkles className="size-4" />
                    Ma recommandation prioritaire
                  </div>
                  <p className="max-w-xl text-lg leading-7 text-white">
                    {step === 0
                      ? "Transformez le succès de votre atelier client en une série de 3 prises de parole cette semaine."
                      : step === 1
                        ? "J’ai réservé les meilleurs créneaux et équilibré vos sujets pour éviter la répétition."
                        : "Voici un premier post LinkedIn, fidèle à votre voix et prêt à être ajusté avec moi."}
                  </p>
                  <div className="mt-5 flex gap-2">
                    <button className="rounded-lg bg-white px-3 py-2 text-xs text-black">
                      {step === 2 ? "Ouvrir le brouillon" : "Voir mon plan"}
                    </button>
                    <button className="rounded-lg bg-white/7 px-3 py-2 text-xs text-zinc-300">
                      En parler avec l’IA
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[.03] p-4">
                  <p className="text-xs text-zinc-500">Votre semaine</p>
                  <div className="mt-4 flex h-24 items-end gap-2">
                    {[45, 72, 38, 88, 62].map((h, i) => (
                      <motion.i
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                        className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-fuchsia-300"
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-zinc-400">4 contenus planifiés · rythme optimal</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState(0);
  const { scrollYProgress } = useScroll();
  const navBorder = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  return (
    <main className="overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <motion.header
        style={{ borderColor: `color-mix(in srgb, var(--line) calc(${navBorder} * 100%), transparent)` }}
        className="fixed inset-x-0 top-0 z-50 border-b bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-xl"
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/">
            <Logo />
          </Link>
          <div className="hidden items-center gap-8 text-sm md:flex">
            {[
              ["Produit", "product"],
              ["Fonctionnalités", "features"],
              ["IA", "ai"],
              ["Tarifs", "pricing"],
            ].map(([x, id]) => (
              <a key={id} href={`#${id}`} className="fp-muted hover:text-[var(--ink)]">
                {x}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/sign-in" className="px-3 text-sm">
              Connexion
            </Link>
            <Link
              to="/sign-up"
              className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-[var(--canvas)]"
            >
              Commencer <ArrowRight className="ml-1 inline size-3" />
            </Link>
          </div>
          <button aria-label="Menu" className="md:hidden" onClick={() => setMenu(!menu)}>
            {menu ? <X /> : <Menu />}
          </button>
        </nav>
        <AnimatePresence>
          {menu && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-[var(--line)] p-5 md:hidden"
            >
              <div className="grid gap-4">
                {["Produit", "Fonctionnalités", "IA", "Tarifs"].map((x) => (
                  <a href={`#${x.toLowerCase()}`} onClick={() => setMenu(false)}>
                    {x}
                  </a>
                ))}
                <Link
                  to="/sign-up"
                  className="rounded-xl bg-[var(--ink)] p-3 text-center text-[var(--canvas)]"
                >
                  Commencer
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      <section id="product" className="relative px-5 pb-24 pt-36 text-center sm:pt-44">
        <div className="fp-grid absolute inset-0 -z-0 opacity-50" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-6 w-fit rounded-full border border-violet-500/20 bg-violet-500/8 px-4 py-2 text-xs font-medium text-violet-500"
          >
            <Sparkles className="mr-2 inline size-3" />
            Votre responsable communication IA est prêt
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-balance text-5xl font-medium leading-[.98] tracking-[-.055em] sm:text-7xl lg:text-[92px]"
          >
            Une présence qui compte.
            <br />
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-400 to-orange-300 bg-clip-text text-transparent">
              Sans y penser seul.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="fp-muted mx-auto mt-7 max-w-2xl text-lg leading-8"
          >
            FlowPilot observe, recommande et crée avec vous. Chaque matin, votre communication a déjà avancé.
          </motion.p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/sign-up"
              className="rounded-full bg-[var(--ink)] px-7 py-3.5 text-sm font-medium text-[var(--canvas)]"
            >
              Rencontrer mon copilote <ArrowRight className="ml-2 inline size-4" />
            </Link>
            <button className="rounded-full border border-[var(--line)] px-7 py-3.5 text-sm">
              <Play className="mr-2 inline size-4" />
              Voir comment il travaille
            </button>
          </div>
          <ProductDemo />
        </div>
      </section>
      <section id="features" className="mx-auto max-w-7xl px-5 py-24">
        <p className="text-xs uppercase tracking-[.2em] text-violet-500">Plus qu’un outil</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          <h2 className="text-4xl font-medium tracking-[-.04em] sm:text-6xl">
            Un membre de l’équipe
            <br />
            qui connaît déjà le brief.
          </h2>
          <p className="fp-muted max-w-lg text-lg leading-8">
            Il relie stratégie, création et performance pour vous proposer une action claire au bon moment.
          </p>
        </div>
        <div className="mt-16 grid border-l border-t border-[var(--line)] md:grid-cols-2">
          {features.map((f, i) => (
            <motion.article
              key={f.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border-b border-r border-[var(--line)] p-8 sm:p-10"
            >
              <span className="font-mono text-xs text-violet-500">{f.n}</span>
              <h3 className="mt-12 text-2xl font-medium">{f.title}</h3>
              <p className="fp-muted mt-3 max-w-md leading-7">{f.text}</p>
            </motion.article>
          ))}
        </div>
      </section>
      <section id="ai" className="bg-[#111018] px-5 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-violet-300">Intelligence contextuelle</p>
            <h2 className="mt-5 text-4xl font-medium tracking-[-.04em] sm:text-6xl">
              Il ne vous attend pas.
              <br />
              Il anticipe.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
              Objectifs, actualité, calendrier et performances deviennent une seule conversation continue.
            </p>
            {["Brief quotidien priorisé", "Recommandations expliquées", "Création fidèle à votre voix"].map(
              (x) => (
                <p className="mt-5 text-sm text-zinc-300">
                  <Check className="mr-3 inline size-4 text-violet-300" />
                  {x}
                </p>
              ),
            )}
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[.04] p-5 sm:p-8">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400">
                <Sparkles className="size-4" />
              </span>
              <div className="rounded-2xl rounded-tl-sm bg-white/7 p-4 text-sm leading-6 text-zinc-200">
                Votre annonce d’hier génère deux fois plus de conversations que d’habitude. Je vous conseille
                de prolonger ce signal avec un retour d’expérience demain matin.
              </div>
            </div>
            <div className="ml-12 mt-4 rounded-2xl border border-violet-400/15 bg-violet-400/8 p-4">
              <p className="text-xs text-violet-200">Brouillon préparé · LinkedIn</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Nous pensions annoncer une nouveauté. Vos réactions nous ont rappelé que le plus important
                était ailleurs…
              </p>
              <div className="mt-4 flex gap-2">
                <button className="rounded-lg bg-white px-3 py-2 text-xs text-black">
                  Continuer avec l’IA
                </button>
                <button className="rounded-lg bg-white/7 px-3 py-2 text-xs">Planifier</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="pricing" className="mx-auto max-w-7xl px-5 py-24 text-center">
        <p className="text-xs uppercase tracking-[.2em] text-violet-500">Tarifs simples</p>
        <h2 className="mt-4 text-4xl font-medium tracking-[-.04em] sm:text-6xl">
          Une communication ambitieuse,
          <br />
          sans équipe démesurée.
        </h2>
        <div className="mt-14 grid gap-4 text-left lg:grid-cols-3">
          {[
            { n: "Essentiel", p: "39 €", d: "Pour poser un rythme solide." },
            { n: "Équipe", p: "89 €", d: "Pour orchestrer plusieurs voix.", hot: true },
            { n: "Studio", p: "Sur mesure", d: "Pour les organisations exigeantes." },
          ].map((x) => (
            <div
              className={`rounded-3xl border p-7 ${x.hot ? "border-violet-400 bg-violet-500/8" : "border-[var(--line)] bg-[var(--surface)]"}`}
            >
              <div className="flex justify-between">
                <h3 className="text-xl font-medium">{x.n}</h3>
                {x.hot && (
                  <span className="rounded-full bg-violet-500 px-3 py-1 text-[10px] text-white">
                    Recommandé
                  </span>
                )}
              </div>
              <p className="fp-muted mt-2 text-sm">{x.d}</p>
              <p className="mt-8 text-4xl font-medium">
                {x.p}
                <small className="fp-muted text-sm font-normal">{x.p.includes("€") ? " / mois" : ""}</small>
              </p>
              <Link
                to="/sign-up"
                className="mt-8 block rounded-xl bg-[var(--ink)] p-3 text-center text-sm text-[var(--canvas)]"
              >
                Choisir {x.n}
              </Link>
              {["Copilote IA contextuel", "Calendrier intelligent", "Analyses et recommandations"].map(
                (y) => (
                  <p className="fp-muted mt-4 text-sm">
                    <Check className="mr-2 inline size-4" />
                    {y}
                  </p>
                ),
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-5 py-20">
        <h2 className="text-center text-4xl font-medium tracking-tight">Questions fréquentes</h2>
        <div className="mt-10 border-t border-[var(--line)]">
          {[
            "FlowPilot remplace-t-il une agence ?",
            "L’IA respectera-t-elle vraiment notre ton ?",
            "Puis-je tester avant de m’engager ?",
          ].map((q, i) => (
            <div className="border-b border-[var(--line)]">
              <button
                onClick={() => setFaq(faq === i ? -1 : i)}
                className="flex w-full items-center justify-between py-6 text-left font-medium"
              >
                {q}
                <motion.span animate={{ rotate: faq === i ? 180 : 0 }}>
                  <ChevronDown className="size-4" />
                </motion.span>
              </button>
              <AnimatePresence>
                {faq === i && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="fp-muted overflow-hidden pb-6 leading-7"
                  >
                    Non : il vous donne la continuité et la clarté d’un responsable communication au
                    quotidien. Votre expertise et vos partenaires restent au cœur des décisions.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-[var(--line)] px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="fp-muted text-xs">© 2026 FlowPilot · Your AI Communication Team.</p>
          <div className="flex gap-5 text-xs">
            <a href="#">Confidentialité</a>
            <a href="#">Conditions</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
