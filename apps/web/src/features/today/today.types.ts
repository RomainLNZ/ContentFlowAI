export type RecommendationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RecommendationStatus = "NEW" | "VIEWED" | "ACCEPTED" | "DISMISSED" | "COMPLETED" | "EXPIRED";

export type DirectorRecommendation = {
  id: string;
  type: string;
  status: RecommendationStatus;
  priority: RecommendationPriority;
  confidence: number | string;
  title: string;
  summary: string;
  rationale: string;
  evidence: unknown;
  suggestedAction: unknown;
  campaignId: string | null;
  contentId: string | null;
  objectiveType: string | null;
  suggestedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type DirectorOverview = {
  analysis: {
    id: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    provider: string;
    model: string;
    createdAt: string;
    completedAt: string | null;
    errorCode: string | null;
  } | null;
  state: string;
  provider: string;
  topRecommendations: DirectorRecommendation[];
  priorities: Record<RecommendationPriority, number>;
  risks: DirectorRecommendation[];
  opportunities: DirectorRecommendation[];
  freshness: { state: "NONE" | "FRESH" | "STALE" | "EXPIRED"; ageSeconds: number | null };
};

export type RecommendationPage = {
  items: DirectorRecommendation[];
  total: number;
  page: number;
  pageSize: number;
};

export type PreparedDraft = {
  subject: string;
  angle: string;
  objective: string | null;
  audience: string | null;
  platform: "LINKEDIN";
  campaign: { id: string; name: string } | null;
  suggestedAt: string | null;
  context: string;
  recommendationId: string;
};
