import { z } from "zod";

const slugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug doit utiliser des minuscules, chiffres et tirets.");

export const saveOnboardingSchema = z.object({
  currentStep: z.number().int().min(1).max(5),
  draft: z.record(z.string(), z.unknown()),
});

export const completeOnboardingSchema = z.object({
  organization: z.object({
    name: z.string().trim().min(2).max(120),
    slug: slugSchema,
    websiteUrl: z.string().url().optional(),
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
    productsServices: z.array(z.string().trim().min(1).max(160)).min(1).max(20),
    targetAudiences: z.array(z.string().trim().min(1).max(160)).min(1).max(20),
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
    .min(1)
    .max(7)
    .refine((items) => new Set(items.map(({ type }) => type)).size === items.length, {
      message: "Les objectifs doivent être uniques.",
    })
    .refine((items) => items.filter(({ isPrimary }) => isPrimary).length === 1, {
      message: "Un objectif principal unique est requis.",
    }),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
