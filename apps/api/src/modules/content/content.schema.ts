import { z } from "zod";

const objective = z.enum([
  "AWARENESS",
  "RECRUITMENT",
  "LEAD_GENERATION",
  "EMPLOYER_BRAND",
  "EXPERTISE",
  "TRAFFIC",
  "INSTITUTIONAL",
]);

export const createContentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(30_000),
  sourceVariantId: z.string().uuid().optional(),
  cta: z.string().trim().max(2_000).optional(),
  hashtags: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  status: z.literal("DRAFT").default("DRAFT"),
  campaignId: z.string().uuid().nullable().optional(),
  objective: objective.optional(),
  tone: z.string().trim().max(240).optional(),
  targetAudience: z.string().trim().max(500).optional(),
});

export const updateContentSchema = createContentSchema
  .omit({ sourceVariantId: true, status: true })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Au moins un champ est requis.");

export const listContentSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z
    .enum([
      "DRAFT",
      "READY_FOR_REVIEW",
      "CHANGES_REQUESTED",
      "APPROVED",
      "SCHEDULED",
      "PUBLISHED",
      "ARCHIVED",
    ])
    .optional(),
  objective: objective.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
