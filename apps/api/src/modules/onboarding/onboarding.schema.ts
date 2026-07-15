import { z } from "zod";

const slugSchema = z
  .string()
  .min(2, "L’identifiant URL doit contenir au moins 2 caractères.")
  .max(60, "L’identifiant URL ne peut pas dépasser 60 caractères.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "L’identifiant URL doit utiliser des minuscules, chiffres et tirets.");

export const saveOnboardingSchema = z.object({
  currentStep: z.number().int().min(1).max(5),
  draft: z.record(z.string(), z.unknown()),
});

export const completeOnboardingSchema = z.object({
  organization: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Le nom de l’organisation est obligatoire.")
      .max(120, "Le nom de l’organisation ne peut pas dépasser 120 caractères."),
    slug: slugSchema,
    websiteUrl: z
      .string()
      .url("Le site web est invalide. Utilisez une adresse complète, par exemple https://exemple.fr.")
      .optional(),
    industry: z.string().trim().max(120).optional(),
    description: z.string().trim().max(1200).optional(),
    mission: z.string().trim().max(1200).optional(),
    countryCode: z.string().trim().length(2).toUpperCase().optional(),
    primaryLanguage: z.string().trim().min(2).max(10).default("fr"),
    values: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
    communicationTone: z.string().trim().max(240).optional(),
    forbiddenWords: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    favoriteExpressions: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  }),
  workspace: z.object({
    name: z.string().trim().min(2).max(120).default("Principal"),
    slug: slugSchema.default("principal"),
  }),
  brandProfile: z.object({
    productsServices: z
      .array(z.string().trim().min(1).max(160))
      .min(1, "Indiquez au moins un produit ou service.")
      .max(20),
    targetAudiences: z
      .array(z.string().trim().min(1).max(160))
      .min(1, "Indiquez au moins un public cible.")
      .max(20),
    formalityLevel: z.enum(["CASUAL", "BALANCED", "FORMAL"]).default("BALANCED"),
    emojiUsage: z.enum(["NONE", "LIGHT", "MODERATE"]).default("LIGHT"),
  }),
  objectives: z
    .array(
      z.object({
        type: z.enum([
          "AWARENESS",
          "RECRUITMENT",
          "LEAD_GENERATION",
          "EMPLOYER_BRAND",
          "EXPERTISE",
          "TRAFFIC",
          "INSTITUTIONAL",
        ]),
        isPrimary: z.boolean().default(false),
      }),
    )
    .min(1, "Veuillez sélectionner au moins un objectif.")
    .max(7)
    .refine((items) => new Set(items.map(({ type }) => type)).size === items.length, {
      message: "Les objectifs doivent être uniques.",
    })
    .refine((items) => items.filter(({ isPrimary }) => isPrimary).length === 1, {
      message: "Un objectif principal unique est requis.",
    }),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
