import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { ContentCreationService } from "../content/content-creation.service.js";
import { DirectorRecommendationService } from "./director-recommendation.service.js";
import { directorSnapshot } from "./director.test-fixture.js";

const tenant = { organizationId: "org-a", workspaceId: "workspace-a" };
const now = new Date("2026-07-15T12:00:00.000Z");

function recommendation(status = "NEW", overrides: Record<string, unknown> = {}) {
  return {
    id: "recommendation-a",
    analysisId: "analysis-a",
    type: "CADENCE_WARNING",
    status,
    priority: "HIGH",
    confidence: 0.9,
    title: "Rétablir la cadence",
    summary: "Cadence insuffisante",
    rationale: "La cadence observée est faible",
    evidence: { facts: ["Cadence faible"], metrics: [] },
    suggestedAction: { kind: "CREATE_DRAFT", label: "Préparer" },
    campaignId: null,
    contentId: null,
    objectiveType: "AWARENESS",
    suggestedAt: now,
    expiresAt: null,
    actedAt: null,
    dismissedAt: null,
    dismissalReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function serviceWithTransaction(current = recommendation()) {
  const transaction = {
    directorRecommendation: {
      findFirst: vi.fn().mockResolvedValue(current),
      findFirstOrThrow: vi.fn().mockResolvedValue(current),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue(current),
    },
    recommendationFeedback: { upsert: vi.fn().mockResolvedValue({ id: "feedback-a" }) },
    auditLog: { create: vi.fn().mockResolvedValue({}), createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    campaign: { findFirst: vi.fn().mockResolvedValue({ id: "campaign-a" }) },
    contentItem: { findFirst: vi.fn().mockResolvedValue(null) },
    notification: { create: vi.fn().mockResolvedValue({}) },
  };
  const prismaMock = {
    $transaction: vi.fn((callback) => callback(transaction)),
    directorAnalysis: { findFirst: vi.fn() },
    directorRecommendation: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
  };
  const contentCreation = {
    createDraftInTransaction: vi
      .fn()
      .mockResolvedValue({ id: "content-new", title: "Sujet", status: "DRAFT" }),
  };
  const service = new DirectorRecommendationService(
    prismaMock as unknown as PrismaClient,
    { buildSnapshot: vi.fn().mockResolvedValue(directorSnapshot()) },
    contentCreation as unknown as ContentCreationService,
    "mock",
    { now: () => now },
  );
  return { service, prismaMock, transaction, contentCreation };
}

describe("DirectorRecommendationService", () => {
  it("filtre et pagine avec le tenant courant", async () => {
    const { service, prismaMock } = serviceWithTransaction();
    prismaMock.directorRecommendation.findMany.mockResolvedValue([recommendation()]);
    prismaMock.directorRecommendation.count.mockResolvedValue(1);
    const result = await service.list(tenant, { priority: "HIGH", page: 2, pageSize: 10 });
    expect(result).toMatchObject({ total: 1, page: 2, pageSize: 10 });
    expect(prismaMock.directorRecommendation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ...tenant, priority: "HIGH" }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it("construit un overview borné à trois recommandations", async () => {
    const { service, prismaMock } = serviceWithTransaction();
    prismaMock.directorAnalysis.findFirst.mockResolvedValue({
      id: "analysis-a",
      status: "COMPLETED",
      provider: "mock",
      completedAt: now,
    });
    prismaMock.directorRecommendation.findMany.mockResolvedValue([
      recommendation("NEW", { id: "1", priority: "LOW" }),
      recommendation("NEW", { id: "2", priority: "CRITICAL" }),
      recommendation("NEW", { id: "3", priority: "HIGH" }),
      recommendation("NEW", { id: "4", priority: "MEDIUM" }),
    ]);
    const overview = await service.overview(tenant);
    expect(overview.topRecommendations).toHaveLength(3);
    expect(overview.topRecommendations[0]?.priority).toBe("CRITICAL");
    expect(overview.provider).toBe("mock");
    expect(JSON.stringify(overview)).not.toContain("body");
  });

  it("rend accept, dismiss et complete idempotents", async () => {
    const accepted = serviceWithTransaction(recommendation("ACCEPTED"));
    await accepted.service.accept(tenant, "actor-a", "recommendation-a");
    expect(accepted.transaction.directorRecommendation.updateMany).not.toHaveBeenCalled();
    expect(accepted.transaction.auditLog.create).not.toHaveBeenCalled();

    const dismissed = serviceWithTransaction(recommendation("DISMISSED"));
    await dismissed.service.dismiss(tenant, "actor-a", "recommendation-a", "NOT_RELEVANT");
    expect(dismissed.transaction.directorRecommendation.updateMany).not.toHaveBeenCalled();

    const completed = serviceWithTransaction(recommendation("COMPLETED"));
    await completed.service.complete(tenant, "actor-a", "recommendation-a");
    expect(completed.transaction.directorRecommendation.updateMany).not.toHaveBeenCalled();
  });

  it("upsert un feedback unique et audite seulement les métadonnées utiles", async () => {
    const { service, transaction } = serviceWithTransaction();
    await service.feedback(tenant, "actor-a", "recommendation-a", { value: "HELPFUL", reason: "RELEVANT" });
    expect(transaction.recommendationFeedback.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recommendationId_userId: { recommendationId: "recommendation-a", userId: "actor-a" } },
      }),
    );
    expect(JSON.stringify(transaction.auditLog.create.mock.calls)).not.toContain("body");
  });

  it("prépare un formulaire sans créer de contenu", async () => {
    const { service, prismaMock, contentCreation } = serviceWithTransaction();
    prismaMock.directorRecommendation.findFirst.mockResolvedValue(recommendation());
    const form = await service.prepareDraft(tenant, "recommendation-a");
    expect(form).toMatchObject({
      objective: "AWARENESS",
      platform: "LINKEDIN",
      recommendationId: "recommendation-a",
    });
    expect(contentCreation.createDraftInTransaction).not.toHaveBeenCalled();
  });

  it("crée uniquement un DRAFT confirmé et lie la recommandation dans une transaction", async () => {
    const { service, transaction, contentCreation } = serviceWithTransaction(
      recommendation("NEW", { analysis: { triggeredById: "other-user" } }),
    );
    const result = await service.createDraft(tenant, "actor-a", "recommendation-a", {
      title: "Sujet",
      body: "Corps volontaire",
      hashtags: [],
    });
    expect(result).toMatchObject({ reused: false, content: { status: "DRAFT" } });
    expect(contentCreation.createDraftInTransaction).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({ tenant, actorId: "actor-a", title: "Sujet" }),
    );
    expect(transaction.auditLog.createMany).toHaveBeenCalled();
    expect(JSON.stringify(transaction.auditLog.createMany.mock.calls)).not.toContain("Corps volontaire");
  });

  it("retourne le brouillon existant en cas de double clic", async () => {
    const { service, transaction, contentCreation } = serviceWithTransaction(
      recommendation("COMPLETED", { contentId: "content-existing", analysis: { triggeredById: null } }),
    );
    transaction.contentItem.findFirst.mockResolvedValue({
      id: "content-existing",
      title: "Sujet",
      status: "DRAFT",
    });
    const result = await service.createDraft(tenant, "actor-a", "recommendation-a", {
      title: "Sujet",
      body: "Texte",
      hashtags: [],
    });
    expect(result).toMatchObject({ reused: true, content: { id: "content-existing", status: "DRAFT" } });
    expect(contentCreation.createDraftInTransaction).not.toHaveBeenCalled();
  });
});
