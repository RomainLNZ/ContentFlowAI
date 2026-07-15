import { MockProvider, type AiProvider, type ModelResponse } from "@flowpilot/ai";
import { describe, expect, it } from "vitest";
import { DirectorOrchestrator } from "./director-orchestrator.js";
import { directorSnapshot } from "./director.test-fixture.js";

describe("DirectorOrchestrator", () => {
  it("produit avec Mock des risques et opportunités réalistes et reproductibles", async () => {
    const director = new DirectorOrchestrator(new MockProvider(), "mock-v1");
    const first = await director.execute(directorSnapshot());
    const second = await director.execute(directorSnapshot());

    expect(first).toEqual(second);
    expect(first.provider).toBe("mock");
    expect(first.recommendations.length).toBeGreaterThanOrEqual(6);
    expect(first.risks.some(({ type }) => type === "EDITORIAL_GAP")).toBe(true);
    expect(first.opportunities.some(({ type }) => type === "OBJECTIVE_IMBALANCE")).toBe(true);
    expect(first.recommendations[0]?.priority).toBe("CRITICAL");
    expect(new Set(first.recommendations.map(({ deduplicationKey }) => deduplicationKey)).size).toBe(
      first.recommendations.length,
    );
  });

  it("refuse une référence métier absente du snapshot", async () => {
    const provider = staticProvider({
      ...validRecommendation(),
      campaignId: "campaign-foreign",
    });
    await expect(
      new DirectorOrchestrator(provider, "test").execute(directorSnapshot()),
    ).rejects.toMatchObject({ code: "GUARDRAIL_REJECTED" });
  });

  it("refuse un terme interdit par le Brand Profile", async () => {
    const provider = staticProvider({
      ...validRecommendation(),
      title: "Un résultat garanti",
    });
    await expect(
      new DirectorOrchestrator(provider, "test").execute(directorSnapshot()),
    ).rejects.toMatchObject({ code: "GUARDRAIL_REJECTED" });
  });
});

function validRecommendation() {
  return {
    kind: "RISK",
    type: "CADENCE_WARNING",
    priority: "HIGH",
    confidence: 0.9,
    title: "Rétablir la cadence",
    summary: "La cadence est inférieure à la cible.",
    rationale: "Le fait est présent dans le snapshot.",
    evidence: { facts: ["Cadence faible"], metrics: [{ label: "Cadence", value: "0.47" }] },
    suggestedAction: { kind: "REVIEW", label: "Examiner la cadence" },
    campaignId: null,
    contentId: null,
    objectiveType: null,
    suggestedAt: null,
    expiresAt: "2026-07-22T12:00:00.000Z",
  };
}

function staticProvider(recommendation: unknown): AiProvider {
  return {
    descriptor: {
      id: "static",
      displayName: "Static",
      capabilities: ["text", "json"],
      status: "available",
      configurationKeys: [],
    },
    isAvailable: async () => true,
    generate: async (): Promise<ModelResponse> => ({
      content: JSON.stringify({ recommendations: [recommendation] }),
      model: "static-v1",
      usage: { input: 0, output: 0, total: 0 },
    }),
  };
}
