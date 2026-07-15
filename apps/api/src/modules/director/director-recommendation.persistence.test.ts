import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { DirectorRecommendationPersistenceService } from "./director-recommendation.persistence.js";
import type { DirectorRecommendationOutput } from "./director.schema.js";

describe("DirectorRecommendationPersistenceService", () => {
  it("vérifie le tenant de l’analyse et persiste avec une clé tenant-scoped", async () => {
    const transaction = {
      directorAnalysis: { findFirst: vi.fn().mockResolvedValue({ id: "analysis-a" }) },
      directorRecommendation: { upsert: vi.fn().mockResolvedValue({ id: "recommendation-a" }) },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(transaction)),
    } as unknown as PrismaClient;
    const tenant = { organizationId: "org-a", workspaceId: "workspace-a" };
    await new DirectorRecommendationPersistenceService(prisma).persist(tenant, "analysis-a", [
      recommendation(),
    ]);

    expect(transaction.directorAnalysis.findFirst).toHaveBeenCalledWith({
      where: { id: "analysis-a", ...tenant },
      select: { id: true },
    });
    expect(transaction.directorRecommendation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId_workspaceId_deduplicationKey: {
            ...tenant,
            deduplicationKey: "CADENCE_WARNING:none:none:none-retablir",
          },
        },
        create: expect.objectContaining(tenant),
      }),
    );
  });

  it("refuse une analyse appartenant à un autre tenant", async () => {
    const transaction = {
      directorAnalysis: { findFirst: vi.fn().mockResolvedValue(null) },
      directorRecommendation: { upsert: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(transaction)),
    } as unknown as PrismaClient;

    await expect(
      new DirectorRecommendationPersistenceService(prisma).persist(
        { organizationId: "org-a", workspaceId: "workspace-a" },
        "analysis-foreign",
        [recommendation()],
      ),
    ).rejects.toMatchObject({ code: "DIRECTOR_ANALYSIS_NOT_FOUND" });
    expect(transaction.directorRecommendation.upsert).not.toHaveBeenCalled();
  });
});

function recommendation(): DirectorRecommendationOutput {
  return {
    kind: "RISK",
    type: "CADENCE_WARNING",
    priority: "HIGH",
    confidence: 0.9,
    title: "Rétablir la cadence",
    summary: "Cadence insuffisante",
    rationale: "Fait déterministe",
    evidence: { facts: ["Cadence faible"], metrics: [] },
    suggestedAction: { kind: "REVIEW", label: "Examiner" },
    campaignId: null,
    contentId: null,
    objectiveType: null,
    suggestedAt: null,
    expiresAt: null,
    deduplicationKey: "CADENCE_WARNING:none:none:none-retablir",
  };
}
