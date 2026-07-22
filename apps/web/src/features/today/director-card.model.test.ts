import { describe, expect, it } from "vitest";
import type { DirectorRecommendation } from "./today.types";
import { buildDirectorCards } from "./director-card.model";

function recommendation(overrides: Partial<DirectorRecommendation>): DirectorRecommendation {
  return {
    id: "recommendation",
    type: "CONTENT_OPPORTUNITY",
    status: "NEW",
    priority: "MEDIUM",
    confidence: 0.8,
    title: "Titre",
    summary: "Résumé",
    rationale: "Raison",
    evidence: {},
    suggestedAction: null,
    campaignId: null,
    contentId: null,
    objectiveType: null,
    suggestedAt: null,
    expiresAt: null,
    createdAt: "2026-07-22T08:00:00.000Z",
    ...overrides,
  };
}

describe("buildDirectorCards", () => {
  it("classe les signaux par impact et expose leur action existante", () => {
    const cards = buildDirectorCards([
      recommendation({ id: "opportunity", suggestedAction: { label: "Générer une idée" } }),
      recommendation({ id: "critical", type: "CAMPAIGN_GAP", priority: "CRITICAL", confidence: 0.7 }),
    ]);

    expect(cards.map((card) => card.recommendation.id)).toEqual(["critical", "opportunity"]);
    expect(cards[0]?.kind).toBe("priority");
    expect(cards[1]).toMatchObject({ kind: "opportunity", actionLabel: "Générer une idée" });
  });

  it("ignore les recommandations terminées et déduplique les listes de l’overview", () => {
    const active = recommendation({ id: "active" });
    const cards = buildDirectorCards([
      active,
      active,
      recommendation({ id: "done", status: "COMPLETED" }),
      recommendation({ id: "dismissed", status: "DISMISSED" }),
    ]);

    expect(cards).toHaveLength(1);
    expect(cards[0]?.recommendation.id).toBe("active");
  });
});
