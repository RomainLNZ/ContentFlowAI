import { z } from "zod";

export const directorRecommendationSchema = z.object({
  kind: z.enum(["RISK", "OPPORTUNITY", "ACTION"]),
  type: z.enum([
    "EDITORIAL_GAP",
    "CAMPAIGN_GAP",
    "OBJECTIVE_IMBALANCE",
    "CADENCE_WARNING",
    "WORKFLOW_BLOCKER",
    "BRAND_PROFILE_INCOMPLETE",
    "CONTENT_OPPORTUNITY",
    "CALENDAR_SUGGESTION",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  confidence: z.number().min(0).max(1),
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(500),
  rationale: z.string().min(1).max(1_000),
  evidence: z.object({
    facts: z.array(z.string().min(1).max(300)).max(10),
    metrics: z
      .array(z.object({ label: z.string().min(1).max(80), value: z.string().min(1).max(80) }))
      .max(10),
  }),
  suggestedAction: z.object({
    kind: z.enum(["REVIEW", "PLAN", "COMPLETE_PROFILE", "UNBLOCK_WORKFLOW", "CREATE_DRAFT"]),
    label: z.string().min(1).max(160),
  }),
  campaignId: z.string().nullable(),
  contentId: z.string().nullable(),
  objectiveType: z
    .enum([
      "AWARENESS",
      "RECRUITMENT",
      "LEAD_GENERATION",
      "EMPLOYER_BRAND",
      "EXPERTISE",
      "TRAFFIC",
      "INSTITUTIONAL",
    ])
    .nullable(),
  suggestedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
});

export const directorOutputSchema = z.object({
  recommendations: z.array(directorRecommendationSchema).max(20),
});

export type DirectorRecommendationOutput = z.infer<typeof directorRecommendationSchema> & {
  deduplicationKey: string;
};

export type DirectorResult = {
  provider: string;
  model: string;
  recommendations: readonly DirectorRecommendationOutput[];
  priorities: Readonly<Record<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL", number>>;
  risks: readonly DirectorRecommendationOutput[];
  opportunities: readonly DirectorRecommendationOutput[];
};
