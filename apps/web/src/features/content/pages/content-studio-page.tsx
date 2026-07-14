import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useApplication } from "@/app/application-context";
import { apiRequest, ApiError } from "@/lib/api-client";
import type { ContentItem, ContentVariant } from "../content.types";

type AiStatus = { provider: string; configured: boolean; model: string };

export function ContentStudioPage() {
  const { tenant } = useApplication();
  const [status, setStatus] = useState<AiStatus>();
  const [brief, setBrief] = useState("");
  const [objective, setObjective] = useState("Développer la notoriété");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Clair, humain et expert");
  const [variants, setVariants] = useState<ContentVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [savedId, setSavedId] = useState<string>();

  useEffect(() => {
    void apiRequest<AiStatus>("/v1/ai/status")
      .then(setStatus)
      .catch(() => undefined);
  }, []);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!tenant) return;
    setLoading(true);
    setError(undefined);
    setSavedId(undefined);
    try {
      const result = await apiRequest<{ generationId: string; variants: ContentVariant[] }>(
        "/v1/ai/generate/linkedin",
        { method: "POST", body: JSON.stringify({ brief, objective, audience, tone }) },
        tenant,
      );
      setVariants(result.variants);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "La génération a échoué.");
    } finally {
      setLoading(false);
    }
  }

  async function save(variant: ContentVariant) {
    if (!tenant) return;
    const body = [variant.hook, variant.body, variant.cta, variant.hashtags.join(" ")]
      .filter(Boolean)
      .join("\n\n");
    const item = await apiRequest<ContentItem>(
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
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-violet-400">Content Studio</p>
          <h1 className="mt-2 text-4xl font-semibold">Créez votre prochaine publication LinkedIn</h1>
          <p className="mt-3 text-zinc-400">
            Trois angles cohérents avec votre marque, prêts à être retravaillés et sauvegardés.
          </p>
        </div>
        {status && !status.configured && (
          <div
            className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-200"
            role="status"
          >
            Le fournisseur IA n’est pas configuré. Ajoutez <code>OPENAI_API_KEY</code> côté API pour activer
            la génération. La gestion des brouillons reste disponible.
          </div>
        )}
        <form
          onSubmit={generate}
          className="mt-8 grid gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:grid-cols-2"
        >
          <Field label="Sujet et brief" value={brief} onChange={setBrief} multiline required />
          <div className="grid gap-5">
            <Field label="Objectif" value={objective} onChange={setObjective} required />
            <Field label="Public cible" value={audience} onChange={setAudience} required />
            <Field label="Ton" value={tone} onChange={setTone} required />
          </div>
          <button
            disabled={loading || status?.configured === false || !tenant}
            className="rounded-xl bg-violet-500 px-5 py-3 font-medium disabled:opacity-40 lg:col-span-2"
          >
            {loading ? "Génération en cours…" : "Générer 3 variantes"}
          </button>
        </form>
        {error && (
          <p className="mt-5 rounded-xl bg-red-500/10 p-4 text-red-300" role="alert">
            {error}
          </p>
        )}
        {savedId && (
          <p className="mt-5 rounded-xl bg-emerald-500/10 p-4 text-emerald-300">
            Brouillon sauvegardé.{" "}
            <Link className="underline" to={`/app/content/${savedId}`}>
              Ouvrir le contenu
            </Link>
          </p>
        )}
        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          {variants.map((variant) => (
            <article
              key={variant.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-xs font-semibold tracking-wide text-violet-400">
                {variant.style.replaceAll("_", " ")}
              </p>
              <h2 className="mt-3 text-lg font-medium">{variant.angle}</h2>
              <div className="mt-5 flex-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                {[variant.hook, variant.body, variant.cta, variant.hashtags.join(" ")].join("\n\n")}
              </div>
              {variant.warnings.length > 0 && (
                <p className="mt-4 text-xs text-amber-300">{variant.warnings.join(" · ")}</p>
              )}
              <button
                onClick={() => void save(variant)}
                className="mt-5 rounded-xl border border-violet-400/40 px-4 py-3 text-sm text-violet-200"
              >
                Sauvegarder comme brouillon
              </button>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  const classes =
    "mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-500";
  return (
    <label className="text-sm text-zinc-300">
      {label}
      {multiline ? (
        <textarea
          className={`${classes} min-h-44`}
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={classes}
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
