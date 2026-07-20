import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { DataTransportError } from "@/lib/data-transport";
import { useApplication } from "@/app/application-context";
import { useDataTransport } from "@/app/data-transport-context";
import { useAuth } from "@/features/auth/auth-context";
import { normalizeWebsite, onboardingStepSchemas } from "../onboarding.schema";

const objectiveOptions = [
  ["AWARENESS", "Notoriété"],
  ["LEAD_GENERATION", "Génération de leads"],
  ["EXPERTISE", "Expertise"],
  ["RECRUITMENT", "Recrutement"],
  ["EMPLOYER_BRAND", "Marque employeur"],
  ["TRAFFIC", "Trafic"],
  ["INSTITUTIONAL", "Communication institutionnelle"],
] as const;

const industries = [
  "Agence de communication",
  "Conseil",
  "Commerce et e-commerce",
  "Éducation",
  "Finance et assurance",
  "Immobilier",
  "Industrie",
  "Média et culture",
  "Santé",
  "Services aux entreprises",
  "Technologie et SaaS",
  "Tourisme et loisirs",
];
const valueSuggestions = ["Innovation", "Transparence", "Excellence", "Proximité", "Impact", "Audace"];

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
  const transport = useDataTransport();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(initialDraft);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (me?.user.onboardingDone) {
      navigate("/app", { replace: true });
      return;
    }
    void transport.request<{ currentStep: number; draft: unknown }>("/v1/onboarding")
      .then((progress) => {
        setStep(progress.currentStep);
        const organizationFromSignup =
          typeof user?.user_metadata.organization_name === "string"
            ? user.user_metadata.organization_name
            : "";
        if (progress.draft && typeof progress.draft === "object") {
          const saved = progress.draft as Partial<Draft>;
          const organizationName = saved.organizationName || organizationFromSignup;
          setDraft({
            ...initialDraft,
            ...saved,
            organizationName,
            slug: saved.slug || slugify(organizationName),
          });
        }
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [me?.user.onboardingDone, navigate, transport, user?.user_metadata.organization_name]);

  const update = <Key extends keyof Draft>(key: Key, value: Draft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  function validateStep(targetStep: 1 | 2 | 3 | 4) {
    const result = onboardingStepSchemas[targetStep].safeParse(draft);
    if (result.success) {
      setFieldErrors({});
      return true;
    }
    const errors = Object.fromEntries(
      result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
    );
    setFieldErrors(errors);
    setError(result.error.issues[0]?.message ?? "Vérifiez les champs indiqués.");
    if (import.meta.env.DEV) console.warn("Onboarding frontend validation failed", result.error.issues);
    return false;
  }

  async function goToStep(nextStep: number) {
    if (saving || submitting || (nextStep > step && !validateStep(step as 1 | 2 | 3 | 4))) return;
    setSaving(true);
    setError(undefined);
    try {
      await transport.request("/v1/onboarding", {
        method: "PUT",
        body: JSON.stringify({ currentStep: nextStep, draft }),
      });
      setStep(nextStep);
      setFieldErrors({});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’enregistrer cette étape.");
    } finally {
      setSaving(false);
    }
  }

  async function complete(event: FormEvent) {
    event.preventDefault();
    if (submitting || saving) return;
    for (const targetStep of [1, 2, 3, 4] as const) {
      if (!validateStep(targetStep)) {
        setStep(targetStep);
        return;
      }
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await transport.request("/v1/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({
          organization: {
            name: draft.organizationName,
            slug: draft.slug || slugify(draft.organizationName),
            ...(draft.websiteUrl ? { websiteUrl: normalizeWebsite(draft.websiteUrl) } : {}),
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
      if (cause instanceof DataTransportError) {
        setError(cause.message);
        const details = cause.details as { fields?: Array<{ field: string; message: string }> } | undefined;
        if (details?.fields) {
          const pathMap: Record<string, keyof Draft> = {
            "organization.name": "organizationName",
            "organization.slug": "slug",
            "organization.websiteUrl": "websiteUrl",
            "organization.industry": "industry",
            "brandProfile.productsServices": "productsServices",
            "brandProfile.targetAudiences": "targetAudiences",
            objectives: "objectives",
          };
          setFieldErrors(
            Object.fromEntries(
              details.fields.map((item) => [pathMap[item.field] ?? item.field, item.message]),
            ),
          );
        }
        if (import.meta.env.DEV) console.warn("Onboarding backend validation failed", cause.details);
      } else setError("La création de votre espace a échoué. Réessayez dans quelques instants.");
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
        <div className="flex items-center justify-between text-sm font-medium">
          <p className="text-violet-400">Étape {step} sur 4</p>
          <span className="text-zinc-500">{step * 25}%</span>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
          role="progressbar"
          aria-label="Progression de la configuration"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={step * 25}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-300 transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${step * 25}%` }}
          />
        </div>
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
                placeholder="Ex. Atelier Horizon"
                error={fieldErrors.organizationName}
              />
              <Field
                label="Identifiant URL"
                value={draft.slug}
                onChange={(value) => update("slug", slugify(value))}
                required
                placeholder="atelier-horizon"
                help={`Aperçu : flowpilot.app/${draft.slug || "mon-espace"}`}
                error={fieldErrors.slug}
              />
              <Field
                label="Site web"
                value={draft.websiteUrl}
                onChange={(value) => update("websiteUrl", value)}
                type="url"
                placeholder="https://atelier-horizon.fr"
                help="Vous pouvez aussi saisir atelier-horizon.fr, le protocole sera ajouté automatiquement."
                error={fieldErrors.websiteUrl}
              />
              <Field
                label="Secteur"
                value={draft.industry}
                onChange={(value) => update("industry", value)}
                placeholder="Rechercher un secteur…"
                list="industry-options"
                error={fieldErrors.industry}
              />
              <datalist id="industry-options">
                {industries.map((industry) => (
                  <option key={industry} value={industry} />
                ))}
              </datalist>
              <Field
                label="Description"
                value={draft.description}
                onChange={(value) => update("description", value)}
                multiline
                placeholder="Décrivez brièvement votre activité et ce qui vous distingue."
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
                placeholder="Ex. Nous aidons les PME à rendre leur communication plus claire, cohérente et utile."
                help="Une phrase simple suffit : pour qui travaillez-vous, et quel changement apportez-vous ?"
              />
              <Field
                label="Valeurs (séparées par des virgules)"
                value={draft.values}
                onChange={(value) => update("values", value)}
                placeholder="Innovation, transparence, proximité"
              />
              <div className="-mt-2 flex flex-wrap gap-2">
                {valueSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      const values = splitList(draft.values);
                      if (!values.includes(suggestion)) update("values", [...values, suggestion].join(", "));
                    }}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 hover:border-violet-400/40 hover:text-violet-200"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
              <Field
                label="Produits et services"
                value={draft.productsServices}
                onChange={(value) => update("productsServices", value)}
                required
                placeholder="Ex. Conseil éditorial, production de contenu"
                help="Séparez plusieurs éléments par des virgules."
                error={fieldErrors.productsServices}
              />
              <Field
                label="Publics cibles"
                value={draft.targetAudiences}
                onChange={(value) => update("targetAudiences", value)}
                required
                placeholder="Ex. Dirigeants de PME, responsables marketing"
                help="Séparez plusieurs publics par des virgules."
                error={fieldErrors.targetAudiences}
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
                placeholder="Ex. Clair, humain et expert"
                error={fieldErrors.tone}
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
              {(fieldErrors.objectives || draft.objectives.length === 0) && (
                <p role="alert" className="text-sm text-rose-400">
                  {fieldErrors.objectives || "Veuillez sélectionner au moins un objectif."}
                </p>
              )}
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
              disabled={saving || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void goToStep(step + 1)}
            >
              {saving && <LoaderCircle className="size-4 animate-spin" />} Continuer
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || saving || draft.objectives.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <LoaderCircle className="size-4 animate-spin" />}
              {submitting ? "Création de votre espace…" : "Créer mon espace"}
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
  placeholder,
  help,
  error,
  list,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
  help?: string;
  error?: string;
  list?: string;
}) {
  const classes =
    "mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-500";
  return (
    <label className="text-sm text-zinc-300">
      <span className="font-medium">{label}</span>
      {multiline ? (
        <textarea
          className={classes}
          value={value}
          required={required}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={classes}
          value={value}
          required={required}
          type={type}
          placeholder={placeholder}
          list={list}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {help && <span className="mt-1.5 block text-xs leading-5 text-zinc-500">{help}</span>}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-rose-400">
          {error}
        </span>
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
