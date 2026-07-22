import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, ChevronDown, CirclePlay, Menu, Sparkles, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/logo";

const productViews = [
  {
    eyebrow: "01 · Director IA",
    title: "Vous arrivez le matin. Vos priorités sont déjà claires.",
    text: "Le Director analyse le contexte de votre espace et transforme les signaux dispersés en prochaines actions expliquées.",
    image: "/marketing/director.png",
    alt: "Le Director IA de FlowPilot présente les priorités du jour",
  },
  {
    eyebrow: "02 · Calendrier",
    title: "Vous organisez votre semaine en un regard.",
    text: "Contenus planifiés, statuts et campagnes se retrouvent dans un calendrier éditorial commun.",
    image: "/marketing/calendrier.png",
    alt: "Le calendrier éditorial de FlowPilot",
  },
  {
    eyebrow: "03 · Campagnes",
    title: "Chaque temps fort conserve son cap.",
    text: "Regroupez les contenus d’un lancement, d’un recrutement ou d’un événement pour garder la production alignée.",
    image: "/marketing/campagnes.png",
    alt: "La vue des campagnes dans FlowPilot",
  },
  {
    eyebrow: "04 · Content Studio",
    title: "Votre brief devient un contenu à travailler.",
    text: "FlowPilot utilise votre objectif, votre public et votre cadre éditorial pour proposer trois directions que vous restez libre d’affiner.",
    image: "/marketing/content-studio.png",
    alt: "Le Content Studio de FlowPilot",
  },
  {
    eyebrow: "05 · Bibliothèque",
    title: "Vous retrouvez tout, du brouillon à la publication.",
    text: "Idées, contenus à valider et publications planifiées restent réunis avec leur statut et leur historique.",
    image: "/marketing/bibliotheque.png",
    alt: "La bibliothèque de contenus de FlowPilot",
  },
];

const plans = [
  {
    name: "Essentiel",
    audience: "Pour structurer sa communication sans multiplier les outils.",
    promise: "Passez d’une idée à un rythme éditorial clair.",
    price: "39 €",
    features: [
      "Calendrier éditorial",
      "Bibliothèque de contenus",
      "Création assistée à partir d’un brief",
      "Suivi des contenus jusqu’à la publication",
    ],
  },
  {
    name: "Équipe",
    audience: "Pour aligner les personnes qui planifient, créent et valident.",
    promise: "Pilotez la communication à plusieurs depuis un même espace.",
    price: "89 €",
    recommended: true,
    features: [
      "Tout le parcours Essentiel",
      "Director IA et recommandations quotidiennes",
      "Organisation par campagnes",
      "Assignation, relecture et commentaires",
    ],
  },
  {
    name: "Studio",
    audience: "Pour orchestrer une production éditoriale plus dense.",
    promise: "Reliez campagnes, calendrier et production dans une vue complète.",
    price: "Sur mesure",
    features: [
      "Tout le parcours Équipe",
      "Pilotage de plusieurs campagnes",
      "Vue consolidée des contenus et statuts",
      "Cadre de travail partagé pour les contributeurs",
    ],
  },
];

const comparisonRows = [
  ["Calendrier éditorial", true, true, true],
  ["Bibliothèque de contenus", true, true, true],
  ["Création assistée", true, true, true],
  ["Director IA", false, true, true],
  ["Campagnes", false, true, true],
  ["Assignation, relecture et commentaires", false, true, true],
  ["Pilotage de plusieurs campagnes", false, false, true],
  ["Vue consolidée de la production", false, false, true],
] as const;

const faqs = [
  {
    q: "Pourquoi utiliser FlowPilot plutôt que ChatGPT ?",
    a: "ChatGPT répond à une demande ponctuelle. FlowPilot relie votre marque, vos objectifs, vos campagnes, votre calendrier et vos contenus. Il ne se contente pas de rédiger : il recommande la prochaine action et conserve l’organisation du travail.",
  },
  {
    q: "Comment fonctionne le Director IA ?",
    a: "Le Director analyse le contexte présent dans votre espace pour faire émerger des recommandations quotidiennes. Chaque recommandation est expliquée et vous restez libre de l’accepter, de la reporter ou de l’ignorer.",
  },
  {
    q: "FlowPilot publie-t-il automatiquement ?",
    a: "Non. FlowPilot vous aide à analyser, créer et planifier, mais ne publie jamais à votre place. La validation finale reste toujours entre vos mains.",
  },
  {
    q: "Puis-je travailler en équipe ?",
    a: "Oui. Vous pouvez assigner les contenus, organiser la relecture et centraliser les commentaires tout en partageant le même calendrier et les mêmes campagnes.",
  },
  {
    q: "Puis-je tester gratuitement ?",
    a: "Oui. La démo interactive est accessible sans inscription et utilise un espace fictif complet.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "L’accès à votre espace est authentifié et les données sont isolées par organisation et espace de travail. La démo utilise exclusivement des données fictives.",
  },
];

const sectionClass = "marketing-section px-5 py-24 sm:py-32 lg:py-40";
const eyebrowClass = "text-xs font-medium uppercase tracking-[.18em] text-violet-600";
const h2Class = "text-balance text-4xl font-medium leading-[1.02] tracking-[-.045em] sm:text-5xl lg:text-6xl";
const bodyClass = "text-lg leading-8 text-[var(--muted)]";

function DemoLink({ children, className }: { children: ReactNode; className: string }) {
  return (
    <a href="/demo" className={`marketing-link ${className}`}>
      {children}
    </a>
  );
}

function DemoCta({ inverse = false }: { inverse?: boolean }) {
  return (
    <DemoLink
      className={`marketing-primary-cta group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium ${inverse ? "bg-white text-zinc-950 hover:bg-zinc-100" : "bg-[var(--ink)] text-[var(--canvas)] hover:bg-violet-700 hover:text-white"}`}
    >
      Découvrir la démo interactive
      <ArrowRight className="size-4 transition-transform duration-500 ease-out group-hover:translate-x-1" />
    </DemoLink>
  );
}

function ProductShot({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="marketing-product-shot overflow-hidden rounded-3xl border border-black/10 bg-[#0b0c10] shadow-[0_28px_80px_rgba(17,12,35,.18)]">
      <img
        src={src}
        alt={alt}
        width="1440"
        height="900"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className="aspect-[16/10] w-full object-cover object-top"
      />
    </div>
  );
}

function ProductSection({ view, index }: { view: (typeof productViews)[number]; index: number }) {
  return (
    <section className={`${sectionClass} border-t border-[var(--line)]`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mx-auto max-w-7xl"
      >
        <div className="max-w-3xl">
          <p className={eyebrowClass}>{view.eyebrow}</p>
          <h2 className={`${h2Class} mt-5`}>{view.title}</h2>
          <p className={`${bodyClass} mt-6 max-w-2xl`}>{view.text}</p>
        </div>
        <div className="mt-12">
          <ProductShot src={view.image} alt={view.alt} priority={index === 0} />
        </div>
      </motion.div>
    </section>
  );
}

const headerLinks = [
  ["Produit", "product"],
  ["Différences", "difference"],
  ["Fonctionnement", "product"],
  ["Tarifs", "pricing"],
  ["FAQ", "faq"],
] as const;

function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Produit");
  const { scrollYProgress } = useScroll();
  const borderOpacity = useTransform(scrollYProgress, [0, 0.04], [0, 1]);

  return (
    <motion.header
      style={{ borderColor: `color-mix(in srgb, var(--line) calc(${borderOpacity} * 100%), transparent)` }}
      className="marketing-header fixed inset-x-0 top-0 z-50 border-b bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-xl"
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto grid h-20 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-6 sm:px-8 lg:px-10"
      >
        <Link to="/" aria-label="FlowPilot, accueil" className="justify-self-start">
          <Logo />
        </Link>

        <div
          className="hidden items-center justify-center whitespace-nowrap text-[13px] lg:flex"
          style={{ columnGap: "40px" }}
        >
          {headerLinks.map(([label, id]) => (
            <a
              key={label}
              href={`#${id}`}
              aria-current={activeLink === label ? "page" : undefined}
              onClick={() => setActiveLink(label)}
              className={`marketing-nav-link border-b py-2 ${activeLink === label ? "border-violet-600 text-violet-700" : "border-transparent text-[var(--muted)] hover:border-violet-400/70 hover:text-[var(--ink)]"}`}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="hidden items-center justify-self-end gap-3 whitespace-nowrap lg:flex">
          <Link
            to="/sign-in"
            className="rounded-full px-3 py-2 text-sm transition-colors duration-200 hover:bg-[var(--surface-2)] hover:text-violet-700"
          >
            Connexion
          </Link>
          <DemoLink className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--canvas)] transition-colors duration-200 hover:bg-violet-700 hover:text-white">
            Découvrir la démo
          </DemoLink>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          className="col-start-3 justify-self-end rounded-lg p-2 transition-colors hover:bg-[var(--surface-2)] lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-[var(--line)] bg-[var(--canvas)] px-6 sm:px-8 lg:hidden"
          >
            <div className="grid gap-2 py-5">
              {headerLinks.map(([label, id]) => (
                <a
                  key={label}
                  href={`#${id}`}
                  aria-current={activeLink === label ? "page" : undefined}
                  className={`rounded-lg px-3 py-2.5 transition-colors ${activeLink === label ? "bg-violet-500/10 text-violet-700" : "hover:bg-[var(--surface-2)]"}`}
                  onClick={() => {
                    setActiveLink(label);
                    setMenuOpen(false);
                  }}
                >
                  {label}
                </a>
              ))}
              <DemoLink className="rounded-xl bg-[var(--ink)] p-3 text-center text-[var(--canvas)]">
                Découvrir la démo interactive
              </DemoLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="marketing-page overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <MarketingHeader />

      <section className="marketing-hero px-5 pb-24 pt-36 text-center sm:pb-32 lg:pb-40">
        <div className="mx-auto max-w-7xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${eyebrowClass} mx-auto`}
          >
            Le copilote de votre communication
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mx-auto mt-6 max-w-5xl text-balance text-5xl font-medium leading-[.96] tracking-[-.055em] sm:text-7xl lg:text-[80px]"
          >
            Les bonnes actions.
            <br />
            <span className="marketing-gradient-text text-violet-600">Planifiées au bon moment.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.14 }}
            className={`${bodyClass} mx-auto mt-7 max-w-3xl`}
          >
            FlowPilot n’est pas un générateur de texte. C’est le copilote qui analyse, recommande, planifie,
            aide à créer et garde toute votre communication organisée.
          </motion.p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <DemoCta />
            <a
              href="#product"
              className="marketing-secondary-cta group inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line)] px-6 text-sm font-medium hover:bg-[var(--surface)]"
            >
              <CirclePlay className="mr-2 size-4 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-[6deg]" />
              Voir le produit
            </a>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Sans inscription · Données fictives · Visite guidée
          </p>
          <div className="marketing-product-stage mt-12">
            <ProductShot src="/marketing/director.png" alt="Le Director IA de FlowPilot" priority />
          </div>
        </div>
      </section>

      <section
        id="difference"
        className={`${sectionClass} marketing-difference border-y border-[var(--line)] bg-[var(--surface)]`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className={eyebrowClass}>La différence FlowPilot</p>
            <h2 className={`${h2Class} mt-5`}>Pourquoi FlowPilot plutôt qu’un simple assistant IA&nbsp;?</h2>
            <p className={`${bodyClass} mt-6 max-w-2xl`}>
              Un assistant attend votre question. FlowPilot comprend votre environnement et vous aide à
              piloter la suite.
            </p>
          </div>
          <div className="marketing-feature-panel mt-14 grid overflow-hidden rounded-3xl border border-[var(--line)] md:grid-cols-2 md:divide-x md:divide-[var(--line)]">
            <div className="p-7 sm:p-10">
              <p className="text-sm font-medium text-[var(--muted)]">Assistant IA généraliste</p>
              <h3 className="mt-3 text-2xl font-medium tracking-[-.025em]">Une réponse à la fois.</h3>
              <div className="mt-8 grid gap-4">
                {[
                  "Répond à une question",
                  "Génère un texte à la demande",
                  "Dépend du contexte que vous lui redonnez",
                ].map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm leading-6 text-[var(--muted)]">
                    <X className="size-4 shrink-0" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="border-t border-[var(--line)] p-7 sm:p-10 md:border-t-0">
              <p className="text-sm font-medium text-violet-600">FlowPilot</p>
              <h3 className="mt-3 text-2xl font-medium tracking-[-.025em]">Une continuité au quotidien.</h3>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  "Connaît votre entreprise",
                  "Connaît vos campagnes",
                  "Connaît votre calendrier",
                  "Connaît votre marque",
                  "Connaît vos objectifs",
                  "Recommande quoi faire",
                  "Garde tout organisé",
                ].map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm leading-6">
                    <Check className="size-4 shrink-0 text-violet-600" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="product">
        {productViews.map((view, index) => (
          <ProductSection key={view.eyebrow} view={view} index={index} />
        ))}
      </div>

      <section id="team" className={`${sectionClass} marketing-dark-section border-y border-[var(--line)] bg-[#101014] text-white`}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[.18em] text-violet-300">
                Pensé pour le quotidien
              </p>
              <h2 className={`${h2Class} mt-5`}>Toute l’équipe communication dans le même espace.</h2>
            </div>
            <p className="text-lg leading-8 text-zinc-300">
              Le Director donne le cap. Le calendrier organise. Les campagnes structurent. Le Studio prépare.
              La validation aligne. La bibliothèque conserve.
            </p>
          </div>
          <div className="mt-14 grid border-y border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {["Director IA", "Calendrier", "Campagnes", "Création", "Validation", "Bibliothèque"].map(
              (item, index) => (
                <div
                  key={item}
                  className="flex min-h-24 items-center gap-4 border-b border-white/10 px-2 py-6 last:border-b-0 sm:px-6 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-r lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-last-child(-n+3)]:border-b-0"
                >
                  <span className="font-mono text-xs text-zinc-500">0{index + 1}</span>
                  <span className="font-medium">{item}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="marketing-cta-panel mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-3xl bg-[var(--ink)] p-8 text-[var(--canvas)] sm:p-12 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[.18em] text-violet-300">
              Voir le produit en situation
            </p>
            <h2 className={`${h2Class} mt-4 max-w-3xl`}>
              Explorez FlowPilot avec une équipe fictive complète.
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Director, calendrier, campagnes, Studio et bibliothèque — sans créer de compte.
            </p>
          </div>
          <DemoCta inverse />
        </div>
      </section>

      <section id="pricing" className={sectionClass}>
        <div className="mx-auto max-w-7xl text-center">
          <p className={eyebrowClass}>Choisir selon votre organisation</p>
          <h2 className={`${h2Class} mt-5`}>
            Un même cap.
            <br />
            Trois niveaux d’organisation.
          </h2>
          <div className="mt-14 grid gap-5 text-left lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`marketing-pricing-card relative flex flex-col rounded-3xl border p-7 ${plan.recommended ? "border-violet-400 bg-violet-500/[.06]" : "border-[var(--line)] bg-[var(--surface)]"}`}
              >
                {plan.recommended && (
                  <span className="absolute right-6 top-6 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                    Recommandé
                  </span>
                )}
                <p className={eyebrowClass}>{plan.name}</p>
                <h3 className="mt-5 min-h-14 text-2xl font-medium leading-7">{plan.promise}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--muted)]">{plan.audience}</p>
                <p className="mt-8 text-4xl font-medium">
                  {plan.price}
                  <small className="text-sm font-normal text-[var(--muted)]">
                    {plan.price.includes("€") ? " / mois" : ""}
                  </small>
                </p>
                <div className="my-7 h-px bg-[var(--line)]" />
                <div className="flex-1">
                  {plan.features.map((feature) => (
                    <p key={feature} className="mt-4 flex gap-3 text-sm leading-6 text-[var(--muted)]">
                      <Check className="mt-1 size-4 shrink-0 text-violet-600" />
                      {feature}
                    </p>
                  ))}
                </div>
                <Link
                  to="/sign-up"
                  className={`mt-8 block min-h-12 rounded-xl px-4 py-3.5 text-center text-sm font-medium ${plan.recommended ? "bg-violet-600 text-white" : "bg-[var(--ink)] text-[var(--canvas)]"}`}
                >
                  Choisir {plan.name}
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-16 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-left">
            <div className="border-b border-[var(--line)] p-7 sm:p-8">
              <p className={eyebrowClass}>Vue détaillée</p>
              <h3 className="mt-2 text-2xl font-medium">Comparer les offres</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[43%]" />
                  <col className="w-[19%]" />
                  <col className="w-[19%]" />
                  <col className="w-[19%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                    <th className="px-7 py-5 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                      Fonctionnalités
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.name}
                        className={`border-l border-[var(--line)] px-4 py-5 text-center font-medium ${plan.recommended ? "bg-violet-500/[.07] text-violet-600" : ""}`}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(([label, ...values], rowIndex) => (
                    <tr
                      key={label}
                      className={`border-b border-[var(--line)] last:border-0 ${rowIndex % 2 ? "bg-[var(--surface-2)]/30" : ""}`}
                    >
                      <th scope="row" className="px-7 py-4 text-left font-normal leading-6">
                        {label}
                      </th>
                      {values.map((value, index) => (
                        <td
                          key={index}
                          className={`border-l border-[var(--line)] px-4 py-4 text-center ${index === 1 ? "bg-violet-500/[.035]" : ""}`}
                        >
                          {value ? (
                            <span className="inline-grid size-7 place-items-center rounded-full bg-violet-500/10">
                              <Check className="size-3.5 text-violet-600" />
                            </span>
                          ) : (
                            <span className="text-[var(--muted)]">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-[var(--line)] px-6 py-3 text-xs text-[var(--muted)] sm:hidden">
              Faites glisser horizontalement pour comparer.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className={`${sectionClass} border-t border-[var(--line)]`}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className={eyebrowClass}>Questions fréquentes</p>
            <h2 className={`${h2Class} mt-5`}>Ce qu’il faut savoir avant de commencer.</h2>
          </div>
          <div className="mt-14 grid gap-3">
            {faqs.map((item, index) => (
              <motion.div
                key={item.q}
                layout
                className={`marketing-faq-card overflow-hidden rounded-2xl border transition-colors ${openFaq === index ? "border-violet-400/30 bg-[var(--surface)]" : "border-[var(--line)] hover:bg-[var(--surface)]"}`}
              >
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="group flex w-full items-center justify-between gap-5 px-5 py-5 text-left font-medium sm:px-7 sm:py-6"
                >
                  <span className="leading-6">{item.q}</span>
                  <motion.span
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.22 }}
                    className={`grid size-8 shrink-0 place-items-center rounded-full ${openFaq === index ? "bg-violet-600 text-white" : "bg-[var(--surface-2)] text-[var(--muted)]"}`}
                  >
                    <ChevronDown className="size-3.5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-[var(--line)] px-5 pb-6 pt-5 leading-7 text-[var(--muted)] sm:px-7 sm:pb-7">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionClass} border-t border-[var(--line)] text-center`}>
        <div className="mx-auto max-w-3xl">
          <Sparkles className="mx-auto size-6 text-violet-600" />
          <h2 className={`${h2Class} mt-6`}>
            Ne lisez pas une promesse.
            <br />
            Essayez le produit.
          </h2>
          <p className={`${bodyClass} mx-auto mt-6 max-w-xl`}>
            Découvrez comment FlowPilot analyse, recommande, planifie et organise.
          </p>
          <div className="mt-9">
            <DemoCta />
          </div>
        </div>
      </section>
      <footer className="border-t border-[var(--line)] px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="text-xs text-[var(--muted)]">
            © 2026 FlowPilot · Votre communication, guidée au quotidien.
          </p>
          <div className="flex gap-5 text-xs">
            <a href="#">Confidentialité</a>
            <a href="#">Conditions</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
