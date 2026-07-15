import { z } from "zod";

const slug = z
  .string()
  .min(2, "L’identifiant URL est obligatoire.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez uniquement des minuscules, chiffres et tirets.");
const list = (message: string) =>
  z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string()).min(1, message).max(20, "Limitez cette liste à 20 éléments."));

export const onboardingStepSchemas = {
  1: z.object({
    organizationName: z.string().trim().min(2, "Le nom de l’organisation est obligatoire.").max(120),
    slug,
    websiteUrl: z
      .string()
      .trim()
      .refine(
        (value) => !value || z.string().url().safeParse(normalizeWebsite(value)).success,
        "Le site web est invalide.",
      ),
    industry: z.string().trim().min(1, "Veuillez sélectionner un secteur."),
  }),
  2: z.object({
    productsServices: list("Indiquez au moins un produit ou service."),
    targetAudiences: list("Indiquez au moins un public cible."),
  }),
  3: z.object({ tone: z.string().trim().min(2, "Le ton de communication est obligatoire.") }),
  4: z
    .object({
      objectives: z.array(z.string()).min(1, "Veuillez sélectionner au moins un objectif."),
      primaryObjective: z.string().min(1, "Veuillez choisir un objectif principal."),
    })
    .refine((value) => value.objectives.includes(value.primaryObjective), {
      path: ["primaryObjective"],
      message: "L’objectif principal doit faire partie des objectifs sélectionnés.",
    }),
} as const;

export function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
