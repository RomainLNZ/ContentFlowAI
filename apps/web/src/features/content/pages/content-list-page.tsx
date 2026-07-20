import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FilePenLine, FileText, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  EmptyState,
  Input,
  Select,
  Skeleton,
  SkeletonGroup,
  StatusBadge,
  Surface,
} from "@flowpilot/ui";
import { useApplication } from "@/app/application-context";
import { useDataTransport } from "@/app/data-transport-context";
import { AppShell } from "@/components/app-shell";
import type { ContentItem } from "../content.types";

const statuses = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  READY_FOR_REVIEW: { label: "À valider", tone: "warning" },
  CHANGES_REQUESTED: { label: "Corrections demandées", tone: "danger" },
  APPROVED: { label: "Validé", tone: "success" },
  SCHEDULED: { label: "Planifié", tone: "info" },
  PUBLISHED: { label: "Publié", tone: "brand" },
  ARCHIVED: { label: "Archivé", tone: "neutral" },
} as const;

export function ContentListPage() {
  const { tenant } = useApplication();
  const transport = useDataTransport();
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!tenant) return;
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (status) query.set("status", status);
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(undefined);
      void transport.request<{ items: ContentItem[] }>(`/v1/content?${query}`, {}, tenant)
        .then((result) => setItems(result.items))
        .catch((cause: unknown) =>
          setError(cause instanceof Error ? cause.message : "Impossible de charger vos contenus."),
        )
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [q, status, tenant, transport]);

  const filtered = Boolean(q || status);
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-400">
              Bibliothèque éditoriale
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] text-white sm:text-5xl">
              Mes contenus
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Retrouvez vos idées, brouillons et publications dans un espace unique, du premier angle à la
              validation.
            </p>
          </div>
          <Link
            to="/app/create"
            className="fp-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 shadow-[0_8px_30px_rgba(255,255,255,.08)] transition hover:-translate-y-0.5 hover:bg-zinc-100 motion-reduce:transform-none"
          >
            <FilePenLine size={17} /> Créer un contenu
          </Link>
        </header>

        <Surface className="mt-8 rounded-2xl bg-white/[.035] p-3 shadow-none">
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Rechercher dans les contenus</span>
              <Search
                aria-hidden="true"
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Rechercher un titre, une idée ou un passage…"
                className="border-white/10 bg-black/20 pl-10"
              />
            </label>
            <label className="flex items-center gap-2">
              <SlidersHorizontal aria-hidden="true" size={16} className="hidden text-zinc-500 md:block" />
              <span className="sr-only">Filtrer par statut</span>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full border-white/10 bg-[#15161c] md:w-52"
              >
                <option value="">Tous les contenus actifs</option>
                <option value="DRAFT">Brouillons</option>
                <option value="READY_FOR_REVIEW">À valider</option>
                <option value="CHANGES_REQUESTED">Corrections demandées</option>
                <option value="APPROVED">Validés</option>
                <option value="SCHEDULED">Planifiés</option>
                <option value="PUBLISHED">Publiés</option>
                <option value="ARCHIVED">Archivés</option>
              </Select>
            </label>
          </div>
        </Surface>

        <section data-tour="content-library" className="mt-7" aria-live="polite">
          {loading ? (
            <ContentListSkeleton />
          ) : error ? (
            <EmptyState
              icon={<FileText size={21} />}
              eyebrow="Connexion interrompue"
              title="Vos contenus ne sont pas disponibles"
              description={error}
              benefit="Vos données sont conservées. Vous pouvez relancer le chargement sans risque."
              primaryAction={<Button onClick={() => window.location.reload()}>Réessayer</Button>}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={filtered ? <Search size={21} /> : <FilePenLine size={21} />}
              eyebrow={filtered ? "Aucun résultat" : "Votre bibliothèque"}
              title={
                filtered
                  ? "Aucun contenu ne correspond à cette recherche"
                  : "Votre première idée peut commencer ici"
              }
              description={
                filtered
                  ? "Modifiez vos mots-clés ou retirez le filtre pour retrouver le reste de votre bibliothèque."
                  : "Les brouillons créés par votre équipe ou préparés depuis une recommandation apparaîtront ici."
              }
              benefit={
                filtered
                  ? "Vos contenus sont peut-être simplement masqués par les filtres actifs."
                  : "Centraliser vos contenus aide le Director à comprendre votre rythme et éviter les répétitions."
              }
              primaryAction={
                filtered ? (
                  <Button
                    onClick={() => {
                      setQ("");
                      setStatus("");
                    }}
                  >
                    Effacer les filtres
                  </Button>
                ) : (
                  <Button onClick={() => window.location.assign("/app/create")}>
                    Créer mon premier contenu
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-3">
              {items.map((item, index) => {
                const statusInfo = statuses[item.status];
                return (
                  <motion.div
                    key={item.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.035, 0.2) }}
                  >
                    <Link
                      to={`/app/content/${item.id}`}
                      className="fp-focus group grid gap-4 rounded-2xl border border-white/[.09] bg-gradient-to-br from-white/[.05] to-white/[.025] p-5 shadow-[0_14px_45px_rgba(0,0,0,.14)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/25 hover:bg-white/[.06] motion-reduce:transform-none sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="truncate font-semibold text-zinc-100">{item.title}</h2>
                          <StatusBadge tone={statusInfo.tone} dot>
                            {statusInfo.label}
                          </StatusBadge>
                        </div>
                        <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-zinc-400">
                          {item.body || "Ce brouillon ne contient pas encore de texte."}
                        </p>
                        <p className="mt-3 text-xs text-zinc-600">
                          Modifié le{" "}
                          {new Date(item.updatedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <ArrowRight
                        size={17}
                        className="hidden text-zinc-600 transition group-hover:translate-x-1 group-hover:text-violet-300 motion-reduce:transform-none sm:block"
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}

function ContentListSkeleton() {
  return (
    <SkeletonGroup label="Chargement de vos contenus" className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
          <div className="flex gap-3">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-full max-w-3xl" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-5 h-3 w-32" />
        </div>
      ))}
    </SkeletonGroup>
  );
}
