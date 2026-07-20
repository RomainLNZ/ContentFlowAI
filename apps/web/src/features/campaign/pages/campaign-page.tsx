import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Archive, Flag, Layers3, Pencil, Plus, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  EmptyState,
  Input,
  Skeleton,
  SkeletonGroup,
  StatusBadge,
  Surface,
  useToast,
} from "@flowpilot/ui";
import { useApplication } from "@/app/application-context";
import { useDataTransport } from "@/app/data-transport-context";
import { AppShell } from "@/components/app-shell";
import type { Campaign } from "@/features/calendar/calendar.types";

export function CampaignPage() {
  const { tenant } = useApplication();
  const transport = useDataTransport();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<Campaign[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8B5CF6");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [renaming, setRenaming] = useState<Campaign>();
  const [renameValue, setRenameValue] = useState("");

  function load() {
    if (!tenant) return;
    setLoading(true);
    setError(undefined);
    void transport.request<Campaign[]>("/v1/campaigns", {}, tenant)
      .then(setItems)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Impossible de charger les campagnes."),
      )
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    if (!tenant) return;
    void transport.request<Campaign[]>("/v1/campaigns", {}, tenant)
      .then(setItems)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Impossible de charger les campagnes."),
      )
      .finally(() => setLoading(false));
  }, [tenant, transport]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!tenant || submitting) return;
    setSubmitting(true);
    try {
      await transport.request(
        "/v1/campaigns",
        { method: "POST", body: JSON.stringify({ name, color, status: "ACTIVE" }) },
        tenant,
      );
      setName("");
      setCreating(false);
      toast({
        title: "Campagne créée",
        description: "Elle est prête à accueillir vos prochains contenus.",
        tone: "success",
      });
      load();
    } catch (cause) {
      toast({
        title: "Création impossible",
        description: cause instanceof Error ? cause.message : "Réessayez dans quelques instants.",
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function archive(id: string) {
    if (!tenant) return;
    try {
      await transport.request(`/v1/campaigns/${id}/archive`, { method: "POST" }, tenant);
      toast({
        title: "Campagne archivée",
        description: "Ses contenus restent disponibles dans votre bibliothèque.",
      });
      load();
    } catch (cause) {
      toast({
        title: "Archivage impossible",
        description: cause instanceof Error ? cause.message : undefined,
        tone: "danger",
      });
    }
  }

  function openRename(item: Campaign) {
    setRenaming(item);
    setRenameValue(item.name);
  }

  async function rename(event: FormEvent) {
    event.preventDefault();
    if (!tenant || !renaming || !renameValue.trim() || renameValue.trim() === renaming.name) return;
    setSubmitting(true);
    try {
      await transport.request(
        `/v1/campaigns/${renaming.id}`,
        { method: "PUT", body: JSON.stringify({ name: renameValue.trim() }) },
        tenant,
      );
      setRenaming(undefined);
      toast({ title: "Nom mis à jour", tone: "success" });
      load();
    } catch (cause) {
      toast({
        title: "Modification impossible",
        description: cause instanceof Error ? cause.message : undefined,
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-400">
              Organisation éditoriale
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] text-white sm:text-5xl">
              Campagnes
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Regroupez les contenus d’un lancement, d’un événement ou d’un temps fort pour garder un cap
              cohérent.
            </p>
          </div>
          <Button
            onClick={() => setCreating((value) => !value)}
            aria-expanded={creating}
            className="self-start sm:self-auto"
          >
            {creating ? <X size={17} /> : <Plus size={17} />}
            {creating ? "Fermer" : "Nouvelle campagne"}
          </Button>
        </header>

        <AnimatePresence initial={false}>
          {creating && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Surface className="mt-7 rounded-2xl bg-gradient-to-br from-violet-500/[.08] to-white/[.025] p-5 shadow-[0_18px_60px_rgba(0,0,0,.18)] sm:p-6">
                <form onSubmit={create} className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                  <label className="text-sm font-medium text-zinc-200">
                    Nom de la campagne
                    <Input
                      autoFocus
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex. Lancement de l’offre Horizon"
                      className="mt-2 border-white/10 bg-black/20"
                    />
                    <span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">
                      Choisissez un nom que toute l’équipe identifiera immédiatement.
                    </span>
                  </label>
                  <label className="text-sm font-medium text-zinc-200">
                    Couleur
                    <span className="mt-2 flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3">
                      <input
                        aria-label="Couleur de la campagne"
                        type="color"
                        value={color}
                        onChange={(event) => setColor(event.target.value)}
                        className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-xs text-zinc-400">{color.toUpperCase()}</span>
                    </span>
                  </label>
                  <Button type="submit" disabled={submitting || !name.trim()}>
                    {submitting ? "Création…" : "Créer la campagne"}
                  </Button>
                </form>
              </Surface>
            </motion.div>
          )}
        </AnimatePresence>

        <section data-tour="campaigns" className="mt-8">
          {loading ? (
            <CampaignSkeleton />
          ) : error ? (
            <EmptyState
              icon={<Flag size={21} />}
              eyebrow="Connexion interrompue"
              title="Vos campagnes ne sont pas disponibles"
              description={error}
              benefit="Aucune donnée n’a été modifiée."
              primaryAction={<Button onClick={load}>Réessayer</Button>}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<CampaignIllustration />}
              eyebrow="Votre stratégie"
              title="Donnez un fil rouge à vos prochaines prises de parole"
              description="Une campagne rassemble les contenus liés à un lancement, un événement ou une période importante."
              benefit="Le Director peut ainsi détecter les sujets insuffisamment couverts et mieux répartir vos messages."
              primaryAction={
                <Button onClick={() => setCreating(true)}>
                  <Plus size={17} /> Créer ma première campagne
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <motion.article
                  key={item.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.25) }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[.09] bg-gradient-to-br from-white/[.055] to-white/[.025] p-5 shadow-[0_18px_55px_rgba(0,0,0,.16)] transition hover:-translate-y-1 hover:border-white/[.16] motion-reduce:transform-none"
                >
                  <div
                    className="absolute inset-x-5 top-0 h-px opacity-80"
                    style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-black/20">
                      <span
                        className="size-3 rounded-full shadow-[0_0_18px_currentColor]"
                        style={{ backgroundColor: item.color, color: item.color }}
                      />
                    </span>
                    <div className="flex opacity-70 transition group-hover:opacity-100">
                      <button
                        onClick={() => openRename(item)}
                        aria-label={`Renommer ${item.name}`}
                        className="fp-focus grid size-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/[.07] hover:text-violet-300"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => void archive(item.id)}
                        aria-label={`Archiver ${item.name}`}
                        className="fp-focus grid size-9 place-items-center rounded-lg text-zinc-400 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </div>
                  <h2 className="mt-7 text-lg font-semibold tracking-tight text-zinc-100">{item.name}</h2>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <StatusBadge tone="success" dot>
                      Active
                    </StatusBadge>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Layers3 size={14} /> {item._count?.contentItems ?? 0} contenu
                      {(item._count?.contentItems ?? 0) > 1 ? "s" : ""}
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Dialog
        open={Boolean(renaming)}
        onOpenChange={(open) => {
          if (!open) setRenaming(undefined);
        }}
        title="Renommer la campagne"
        description="Ce nom sera utilisé dans le calendrier et sur les contenus associés."
        size="sm"
      >
        <form onSubmit={rename} className="space-y-5">
          <label className="text-sm font-medium">
            Nouveau nom
            <Input
              autoFocus
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder="Nom de la campagne"
              className="mt-2"
            />
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setRenaming(undefined)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting || !renameValue.trim()}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}

function CampaignSkeleton() {
  return (
    <SkeletonGroup label="Chargement des campagnes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
          <Skeleton className="size-10" />
          <Skeleton className="mt-7 h-5 w-2/3" />
          <div className="mt-5 flex justify-between">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

function CampaignIllustration() {
  return (
    <span className="relative block size-7" aria-hidden="true">
      <span className="absolute left-0 top-1 size-4 rounded-full bg-violet-400/80" />
      <span className="absolute bottom-0 right-0 size-4 rounded-full border border-violet-300 bg-[#171922]" />
    </span>
  );
}
