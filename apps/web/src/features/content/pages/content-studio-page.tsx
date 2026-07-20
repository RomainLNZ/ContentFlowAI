import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, FilePenLine, Lightbulb, Share2, Sparkles, WandSparkles } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Button,
  EmptyState,
  Input,
  Skeleton,
  SkeletonGroup,
  StatusBadge,
  Surface,
  Textarea,
  useToast,
} from "@flowpilot/ui";
import { useApplication } from "@/app/application-context";
import { useDataTransport } from "@/app/data-transport-context";
import { AppShell } from "@/components/app-shell";
import { DataTransportError } from "@/lib/data-transport";
import type { PreparedDraft } from "@/features/today/today.types";
import type { ContentItem, ContentVariant } from "../content.types";

type AiStatus = { provider: string; configured: boolean; model: string };

export function ContentStudioPage() {
  const { tenant } = useApplication();
  const transport = useDataTransport();
  const location = useLocation();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const preparedDraft = (location.state as { preparedDraft?: PreparedDraft } | null)?.preparedDraft;
  const [status, setStatus] = useState<AiStatus>();
  const [brief, setBrief] = useState(preparedDraft?.context ?? "");
  const [objective, setObjective] = useState(preparedDraft?.objective ?? "Développer la notoriété");
  const [audience, setAudience] = useState(preparedDraft?.audience ?? "");
  const [tone, setTone] = useState("Clair, humain et expert");
  const [variants, setVariants] = useState<ContentVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [savedId, setSavedId] = useState<string>();
  const [savingVariant, setSavingVariant] = useState<string>();

  useEffect(() => {
    void transport.request<AiStatus>("/v1/ai/status")
      .then(setStatus)
      .catch(() => undefined);
  }, [transport]);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!tenant || loading) return;
    setLoading(true);
    setError(undefined);
    setSavedId(undefined);
    try {
      const result = await transport.request<{ generationId: string; variants: ContentVariant[] }>(
        "/v1/ai/generate/linkedin",
        { method: "POST", body: JSON.stringify({ brief, objective, audience, tone }) },
        tenant,
      );
      setVariants(result.variants);
    } catch (cause) {
      setError(cause instanceof DataTransportError ? cause.message : "La génération a échoué.");
    } finally {
      setLoading(false);
    }
  }

  async function save(variant: ContentVariant) {
    if (!tenant || savingVariant) return;
    setSavingVariant(variant.id);
    const body = [variant.hook, variant.body, variant.cta, variant.hashtags.join(" ")]
      .filter(Boolean)
      .join("\n\n");
    try {
      const item = await transport.request<ContentItem>(
        "/v1/content",
        {
          method: "POST",
          body: JSON.stringify({
            title: variant.angle.slice(0, 200),
            body,
            sourceVariantId: variant.id,
            tone,
            targetAudience: audience,
          }),
        },
        tenant,
      );
      setSavedId(item.id);
      toast({
        title: "Brouillon sauvegardé",
        description: "Vous pouvez maintenant le relire, l’assigner ou le planifier.",
        tone: "success",
      });
    } catch (cause) {
      toast({
        title: "Sauvegarde impossible",
        description: cause instanceof Error ? cause.message : "Réessayez dans quelques instants.",
        tone: "danger",
      });
    } finally {
      setSavingVariant(undefined);
    }
  }

  const canGenerate = Boolean(
    tenant &&
    brief.trim() &&
    objective.trim() &&
    audience.trim() &&
    tone.trim() &&
    status?.configured !== false,
  );

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <header className="border-b border-white/10 pb-9">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="brand" dot>
              Content Studio
            </StatusBadge>
            <StatusBadge tone="neutral">
              <Share2 size={12} /> LinkedIn
            </StatusBadge>
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.045em] text-white sm:text-5xl">
            Transformez une idée en publication prête à travailler
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Donnez le contexte essentiel. FlowPilot vous proposera trois angles distincts, alignés avec votre
            objectif et votre public.
          </p>
        </header>

        {preparedDraft && (
          <div
            role="status"
            className="mt-7 flex items-start gap-3 rounded-2xl border border-violet-400/20 bg-violet-400/[.08] p-4 text-sm text-violet-100"
          >
            <Sparkles size={18} className="mt-0.5 shrink-0 text-violet-300" />
            <div>
              <strong>Brief préparé par le Director</strong>
              <p className="mt-1 leading-6 text-violet-200/70">
                Les faits de la recommandation ont été repris. Vous restez libre de modifier chaque champ
                avant la génération.
              </p>
            </div>
          </div>
        )}
        {status && !status.configured && (
          <div
            className="mt-7 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-200"
            role="status"
          >
            <strong>Génération temporairement indisponible.</strong> La gestion de vos brouillons reste
            accessible pendant la configuration du fournisseur IA.
          </div>
        )}

        <Surface className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-white/[.055] to-white/[.025] shadow-[0_22px_80px_rgba(0,0,0,.22)]">
          <form onSubmit={generate} className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="border-b border-white/[.08] p-5 sm:p-7 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Lightbulb size={17} />
                </span>
                <div>
                  <h2 className="font-semibold text-zinc-100">L’idée à développer</h2>
                  <p className="text-xs text-zinc-500">Le contexte qui rendra la proposition juste.</p>
                </div>
              </div>
              <Field
                label="Sujet et brief"
                help="Précisez le message, le contexte et ce que votre lecteur doit retenir."
              >
                <Textarea
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  required
                  placeholder="Ex. Nous lançons un atelier pour aider les dirigeants de PME à structurer leur communication. Je veux annoncer l’ouverture des inscriptions sans adopter un ton trop commercial."
                  className="min-h-52 border-white/10 bg-black/20"
                />
              </Field>
              <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                <Check size={13} className="text-emerald-400" /> Un brief précis produit des angles plus
                différents et plus exploitables.
              </p>
            </div>
            <div className="grid content-start gap-5 p-5 sm:p-7">
              <div>
                <h2 className="font-semibold text-zinc-100">Le cadre éditorial</h2>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Ces repères guident la formulation sans remplacer votre Brand Profile.
                </p>
              </div>
              <Field label="Objectif" help="Le résultat attendu de cette prise de parole.">
                <Input
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  required
                  placeholder="Ex. Faire connaître la nouvelle offre"
                  className="border-white/10 bg-black/20"
                />
              </Field>
              <Field label="Public cible" help="La personne à laquelle ce contenu doit parler en priorité.">
                <Input
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  required
                  placeholder="Ex. Dirigeants de PME de 10 à 50 salariés"
                  className="border-white/10 bg-black/20"
                />
              </Field>
              <Field label="Ton" help="Décrivez l’impression que le texte doit laisser.">
                <Input
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  required
                  placeholder="Ex. Direct, rassurant et concret"
                  className="border-white/10 bg-black/20"
                />
              </Field>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/[.08] bg-black/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:col-span-2">
              <p className="text-xs leading-5 text-zinc-500">
                Aucune publication n’est créée ou planifiée sans votre validation.
              </p>
              <Button type="submit" size="lg" disabled={loading || !canGenerate} className="shrink-0">
                {loading ? (
                  <>
                    <WandSparkles size={17} className="animate-pulse" /> Création des angles…
                  </>
                ) : (
                  <>
                    <WandSparkles size={17} /> Proposer trois angles
                  </>
                )}
              </Button>
            </div>
          </form>
        </Surface>

        {error && (
          <p
            className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] p-4 text-sm text-rose-200"
            role="alert"
          >
            {error}
          </p>
        )}
        {savedId && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] p-4 text-sm text-emerald-200">
            <span className="flex items-center gap-2">
              <Check size={17} /> Brouillon sauvegardé dans votre bibliothèque.
            </span>
            <Link
              className="fp-focus inline-flex items-center gap-1 font-semibold underline underline-offset-4"
              to={`/app/content/${savedId}`}
            >
              Ouvrir le contenu <ArrowRight size={14} />
            </Link>
          </div>
        )}

        <section className="mt-12" aria-labelledby="angles-title">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-400">Propositions</p>
            <h2 id="angles-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Trois directions pour votre message
            </h2>
          </div>
          <div className="mt-6">
            {loading ? (
              <VariantSkeleton />
            ) : variants.length === 0 ? (
              <EmptyState
                icon={<FilePenLine size={21} />}
                title="Vos trois angles apparaîtront ici"
                description="Commencez par décrire votre idée et le public que vous souhaitez toucher."
                benefit="Vous pourrez comparer les approches avant de choisir celle qui mérite de devenir un brouillon."
                className="bg-white/[.015]"
              />
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                {variants.map((variant, index) => (
                  <motion.article
                    key={variant.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group flex flex-col rounded-3xl border border-white/[.09] bg-gradient-to-b from-white/[.055] to-white/[.025] p-5 shadow-[0_18px_60px_rgba(0,0,0,.16)] transition hover:-translate-y-1 hover:border-violet-400/25 motion-reduce:transform-none"
                  >
                    <StatusBadge tone={index === 0 ? "brand" : "neutral"}>
                      {styleLabel(variant.style)}
                    </StatusBadge>
                    <h3 className="mt-4 text-lg font-semibold leading-7 text-zinc-100">{variant.angle}</h3>
                    <div className="mt-5 flex-1 whitespace-pre-wrap border-t border-white/[.08] pt-5 text-sm leading-6 text-zinc-300">
                      {[variant.hook, variant.body, variant.cta, variant.hashtags.join(" ")].join("\n\n")}
                    </div>
                    {variant.warnings.length > 0 && (
                      <p className="mt-4 rounded-xl bg-amber-400/[.07] p-3 text-xs leading-5 text-amber-300">
                        {variant.warnings.join(" · ")}
                      </p>
                    )}
                    <Button
                      variant="secondary"
                      disabled={Boolean(savingVariant)}
                      onClick={() => void save(variant)}
                      className="mt-5"
                    >
                      {savingVariant === variant.id ? "Sauvegarde…" : "Sauvegarder comme brouillon"}
                    </Button>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Field({ label, help, children }: { label: string; help: string; children: ReactNode }) {
  return (
    <label className="mt-5 block text-sm font-medium text-zinc-200">
      <span>{label}</span>
      <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">{help}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function VariantSkeleton() {
  return (
    <SkeletonGroup label="Création de trois propositions" className="grid gap-5 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-3xl border border-white/[.07] bg-white/[.025] p-5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="mt-5 h-5 w-4/5" />
          <Skeleton className="mt-7 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-8 h-11 w-full" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

function styleLabel(style: ContentVariant["style"]) {
  return {
    DIRECT_CONCISE: "Direct et concis",
    EXPERT_EDUCATIONAL: "Expert et pédagogique",
    HUMAN_ENGAGING: "Humain et engageant",
  }[style];
}
