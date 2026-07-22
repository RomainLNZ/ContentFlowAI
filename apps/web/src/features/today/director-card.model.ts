import type { DirectorRecommendation, RecommendationPriority } from "./today.types";

export type DirectorCardKind = "priority" | "opportunity" | "attention" | "insight";

export type DirectorCardModel = {
  recommendation: DirectorRecommendation;
  kind: DirectorCardKind;
  label: string;
  actionLabel: string;
  confidence: number;
};

const priorityWeight: Record<RecommendationPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function buildDirectorCards(recommendations: readonly DirectorRecommendation[]): DirectorCardModel[] {
  const unique = new Map<string, DirectorRecommendation>();

  for (const recommendation of recommendations) {
    if (["DISMISSED", "COMPLETED", "EXPIRED"].includes(recommendation.status)) continue;
    if (!unique.has(recommendation.id)) unique.set(recommendation.id, recommendation);
  }

  return [...unique.values()]
    .sort(
      (left, right) =>
        priorityWeight[right.priority] - priorityWeight[left.priority] ||
        Number(right.confidence) - Number(left.confidence),
    )
    .map((recommendation) => ({
      recommendation,
      kind: cardKind(recommendation),
      label: cardLabel(recommendation),
      actionLabel: suggestedActionLabel(recommendation),
      confidence: Math.round(Number(recommendation.confidence) * 100),
    }));
}

function cardKind(recommendation: DirectorRecommendation): DirectorCardKind {
  if (recommendation.type === "CONTENT_OPPORTUNITY") return "opportunity";
  if (["CALENDAR_SUGGESTION", "EDITORIAL_GAP", "CADENCE_WARNING"].includes(recommendation.type)) {
    return "attention";
  }
  if (recommendation.type.includes("RISK") || recommendation.type.includes("BLOCKER")) return "attention";
  if (recommendation.type === "CAMPAIGN_GAP" || ["CRITICAL", "HIGH"].includes(recommendation.priority)) {
    return "priority";
  }
  return "insight";
}

function cardLabel(recommendation: DirectorRecommendation) {
  const labels: Partial<Record<string, string>> = {
    CAMPAIGN_GAP: "Priorité",
    CONTENT_OPPORTUNITY: "Opportunité",
    CALENDAR_SUGGESTION: "Attention",
    EDITORIAL_GAP: "Attention",
    CADENCE_WARNING: "Attention",
    WORKFLOW_BLOCKER: "Validation",
    WORKFLOW_RISK: "Validation",
    OBJECTIVE_IMBALANCE: "Objectif",
    BRAND_PROFILE_INCOMPLETE: "Marque",
  };
  return labels[recommendation.type] ?? (recommendation.priority === "CRITICAL" ? "Urgent" : "Suggestion IA");
}

function suggestedActionLabel(recommendation: DirectorRecommendation) {
  if (
    recommendation.suggestedAction &&
    typeof recommendation.suggestedAction === "object" &&
    "label" in recommendation.suggestedAction &&
    typeof (recommendation.suggestedAction as { label?: unknown }).label === "string"
  ) {
    return (recommendation.suggestedAction as { label: string }).label;
  }
  if (recommendation.contentId) return "Voir le contenu";
  if (recommendation.campaignId) return "Voir la campagne";
  if (recommendation.type === "CALENDAR_SUGGESTION") return "Ouvrir le calendrier";
  if (["CONTENT_OPPORTUNITY", "OBJECTIVE_IMBALANCE"].includes(recommendation.type)) {
    return "Préparer un brouillon";
  }
  return "Traiter maintenant";
}
