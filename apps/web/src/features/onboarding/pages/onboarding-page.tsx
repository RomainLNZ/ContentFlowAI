import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useApplication } from "@/app/application-context";

const objectiveOptions = [
  ["AWARENESS", "Notoriété"],
  ["LEAD_GENERATION", "Génération de leads"],
  ["EXPERTISE", "Expertise"],
  ["RECRUITMENT", "Recrutement"],
  ["EMPLOYER_BRAND", "Marque employeur"],
  ["TRAFFIC", "Trafic"],
  ["INSTITUTIONAL", "Communication institutionnelle"],
] as const;

type Draft = {
  organizationName: string;
  slug: string;
  websiteUrl: string;
  industry: string;
  description: string;
  mission: string;
  values: string;
  tone: string;
  forbiddenWords: string;
  favoriteExpressions: string;
  productsServices: string;
  targetAudiences: string;
  formalityLevel: "CASUAL" | "BALANCED" | "FORMAL";
  emojiUsage: "NONE" | "LIGHT" | "MODERATE";
  objectives: string[];
  primaryObjective: string;
};

const initialDraft: Draft = {
  organizationName: "",
  slug: "",
  websiteUrl: "",
  industry: "",
  description: "",
  mission: "",
  values: "",
  tone: "Clair, humain et expert",
  forbiddenWords: "",
  favoriteExpressions: "",
  productsServices: "",
  targetAudiences: "",
  formalityLevel: "BALANCED",
  emojiUsage: "LIGHT",
  objectives: ["AWARENESS"],
  primaryObjective: "AWARENESS",
};

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export function OnboardingPage() {
  const navigate = useNavigate();
  const { me, refresh } = useApplication();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(initialDraft);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (me?.user.onboardingDone) {
      navigate("/app", { replace: true });
      return;
    }
    void apiRequest<{ currentStep: number; draft: unknown }>("/v1/onboarding")
      .then((progress) => {
        setStep(progress.currentStep);
        if (progress.draft && typeof progress.draft === "object") {
          setDraft({ ...initialDraft, ...(progress.draft as Partial<Draft>) });
        }
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [me?.user.onboardingDone, navigate]);

  const update = <Key extends keyof Draft>(key: Key, value: Draft[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function goToStep(nextStep: number) {
    setError(undefined);
    await apiRequest("/v1/onboarding", {
      method: "PUT",
      body: JSON.stringify({ currentStep: nextStep, draft }),
    });
    setStep(nextStep);
  }

  async function complete(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      await apiRequest("/v1/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({
          organization: {
            name: draft.organizationName,
            slug: draft.slug || slugify(draft.organizationName),
            ...(draft.websiteUrl ? { websiteUrl: draft.websiteUrl } : {}),
            ...(draft.industry ? { industry: draft.industry } : {}),
            ...(draft.description ? { description: draft.description } : {}),
            ...(draft.mission ? { mission: draft.mission } : {}),
            primaryLanguage: "fr",
            values: splitList(draft.values),
            communicationTone: draft.tone,
            forbiddenWords: splitList(draft.forbiddenWords),
            favoriteExpressions: splitList(draft.favoriteExpressions),
          },
          workspace: { name: "Principal", slug: "principal" },
          brandProfile: {
            productsServices: splitList(draft.productsServices),
            targetAudiences: splitList(draft.targetAudiences),
            formalityLevel: draft.formalityLevel,
            emojiUsage: draft.emojiUsage,
          },
          objectives: draft.objectives.map((type) => ({
            type,
            isPrimary: type === draft.primaryObjective,
          })),
        }),
      });
      await refresh();
      navigate("/app", { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "La création de votre espace a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-[#08090c] text-zinc-400">
        Reprise de votre configuration…
      </main>
    );

  return (
    <main className="min-h-screen bg-[#08090c] px-6 py-12 text-zinc-100">
      <form
        onSubmit={complete}
        className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl"
      >
        <p className="text-sm font-medium text-violet-400">Étape {step} sur 4</p>
        <h1 className="mt-2 text-3xl font-semibold">Configurons votre équipe de communication IA</h1>
        <div className="mt-8 grid gap-5">
          {step === 1 && (
            <>
              <Field
                label="Nom de l’organisation"
                value={draft.organizationName}
                onChange={(value) => {
                  update("organizationName", value);
                  if (!draft.slug) update("slug", slugify(value));
                }}
                required
              />
              <Field
                label="Identifiant URL"
                value={draft.slug}
                onChange={(value) => update("slug", slugify(value))}
                required
              />
              <Field
                label="Site web"
                value={draft.websiteUrl}
                onChange={(value) => update("websiteUrl", value)}
                type="url"
              />
              <Field label="Secteur" value={draft.industry} onChange={(value) => update("industry", value)} />
              <Field
                label="Description"
                value={draft.description}
                onChange={(value) => update("description", value)}
                multiline
              />
            </>
          )}
          {step === 2 && (
            <>
              <Field
                label="Mission"
                value={draft.mission}
                onChange={(value) => update("mission", value)}
                multiline
              />
              <Field
                label="Valeurs (séparées par des virgules)"
                value={draft.values}
                onChange={(value) => update("values", value)}
              />
              <Field
                label="Produits et services"
                value={draft.productsServices}
                onChange={(value) => update("productsServices", value)}
                required
              />
              <Field
                label="Publics cibles"
                value={draft.targetAudiences}
                onChange={(value) => update("targetAudiences", value)}
                required
              />
            </>
          )}
          {step === 3 && (
            <>
              <Field
                label="Ton de communication"
                value={draft.tone}
                onChange={(value) => update("tone", value)}
                required
              />
              <Field
                label="Mots interdits"
                value={draft.forbiddenWords}
                onChange={(value) => update("forbiddenWords", value)}
              />
              <Field
                label="Expressions favorites"
                value={draft.favoriteExpressions}
                onChange={(value) => update("favoriteExpressions", value)}
              />
              <Select
                label="Niveau de formalité"
                value={draft.formalityLevel}
                onChange={(value) => update("formalityLevel", value as Draft["formalityLevel"])}
                options={[
                  ["CASUAL", "Décontracté"],
                  ["BALANCED", "Équilibré"],
                  ["FORMAL", "Formel"],
                ]}
              />
              <Select
                label="Usage des emojis"
                value={draft.emojiUsage}
                onChange={(value) => update("emojiUsage", value as Draft["emojiUsage"])}
                options={[
                  ["NONE", "Aucun"],
                  ["LIGHT", "Léger"],
                  ["MODERATE", "Modéré"],
                ]}
              />
            </>
          )}
          {step === 4 && (
            <fieldset className="grid gap-3">
              <legend className="mb-2 font-medium">Objectifs de communication</legend>
              {objectiveOptions.map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
                  <input
                    type="checkbox"
                    checked={draft.objectives.includes(value)}
                    onChange={(event) => {
                      const objectives = event.target.checked
                        ? [...draft.objectives, value]
                        : draft.objectives.filter((item) => item !== value);
                      update("objectives", objectives);
                      if (!objectives.includes(draft.primaryObjective) && objectives[0])
                        update("primaryObjective", objectives[0]);
                    }}
                  />
                  <span className="flex-1">{label}</span>
                  {draft.objectives.includes(value) && (
                    <input
                      type="radio"
                      name="primary"
                      aria-label={`${label}, objectif principal`}
                      checked={draft.primaryObjective === value}
                      onChange={() => update("primaryObjective", value)}
                    />
                  )}
                </label>
              ))}
            </fieldset>
          )}
        </div>
        {error && (
          <p className="mt-6 rounded-xl bg-red-500/10 p-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            className="rounded-xl border border-white/15 px-5 py-3 disabled:opacity-40"
            disabled={step === 1}
            onClick={() => void goToStep(step - 1)}
          >
            Retour
          </button>
          {step < 4 ? (
            <button
              type="button"
              className="rounded-xl bg-violet-500 px-5 py-3 font-medium text-white"
              onClick={() => void goToStep(step + 1)}
            >
              Continuer
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || draft.objectives.length === 0}
              className="rounded-xl bg-violet-500 px-5 py-3 font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Création…" : "Créer mon espace"}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  type?: string;
}) {
  const classes =
    "mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-500";
  return (
    <label className="text-sm text-zinc-300">
      {label}
      {multiline ? (
        <textarea
          className={classes}
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={classes}
          value={value}
          required={required}
          type={type}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <label className="text-sm text-zinc-300">
      {label}
      <select
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#15151b] px-4 py-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
