import { z } from "zod";

const recommendationType = z.enum([
  "EDITORIAL_GAP",
  "CAMPAIGN_GAP",
  "OBJECTIVE_IMBALANCE",
  "CADENCE_WARNING",
  "WORKFLOW_BLOCKER",
  "BRAND_PROFILE_INCOMPLETE",
  "CONTENT_OPPORTUNITY",
  "CALENDAR_SUGGESTION",
]);

export const recommendationListSchema = z
  .object({
    status: z.enum(["NEW", "VIEWED", "ACCEPTED", "DISMISSED", "COMPLETED", "EXPIRED"]).optional(),
    type: recommendationType.optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    campaignId: z.string().uuid().optional(),
    contentId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(({ from, to }) => !from || !to || from <= to, { message: "La période est invalide." });

export const dismissRecommendationSchema = z.object({
  reason: z.string().trim().min(2).max(120),
  comment: z.string().trim().max(1_000).optional(),
});

export const completeRecommendationSchema = z.object({ confirmed: z.literal(true) });

export const feedbackSchema = z.object({
  value: z.enum(["HELPFUL", "NOT_HELPFUL"]),
  reason: z.enum(["RELEVANT", "ACTIONABLE", "INACCURATE", "TOO_LATE", "NOT_RELEVANT"]).optional(),
  comment: z.string().trim().max(1_000).optional(),
});

const validTimezone = (timezone: string) => {
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
};

export const directorPreferenceSchema = z.object({
  desiredWeeklyFrequency: z.number().int().min(0).max(21),
  preferredWeekdays: z
    .array(z.number().int().min(1).max(7))
    .max(7)
    .refine((items) => new Set(items).size === items.length),
  preferredHours: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).max(12),
  timezone: z.string().min(1).max(100).refine(validTimezone, "Fuseau horaire invalide."),
  silenceThresholdDays: z.number().int().min(1).max(90),
  maxDailyRecommendations: z.number().int().min(1).max(20),
  notificationsEnabled: z.boolean(),
  proactivityLevel: z.number().int().min(0).max(3),
  disabledRecommendationTypes: z
    .array(recommendationType)
    .max(8)
    .refine((items) => new Set(items).size === items.length),
});

export const createDraftFromRecommendationSchema = z.object({
  confirmed: z.literal(true),
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(1).max(10_000),
  cta: z.string().trim().max(500).nullable().optional(),
  hashtags: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  tone: z.string().trim().max(100).optional(),
  targetAudience: z.string().trim().max(200).optional(),
});

export { recommendationType };
