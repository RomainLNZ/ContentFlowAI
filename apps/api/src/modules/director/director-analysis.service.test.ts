import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { DirectorAnalysisService } from "./director-analysis.service.js";
import { directorSnapshot } from "./director.test-fixture.js";

const tenant = { organizationId: "org-a", workspaceId: "workspace-a" };
const now = new Date("2026-07-15T12:00:00.000Z");

function setup(overrides?: { enabled?: boolean; running?: object | null; directorError?: Error }) {
  const analysis = {
    id: "analysis-a",
    ...tenant,
    status: "RUNNING",
    createdAt: now,
  };
  const transaction = {
    directorAnalysis: {
      create: vi.fn().mockResolvedValue(analysis),
      update: vi.fn().mockResolvedValue({ ...analysis, status: "COMPLETED", completedAt: now }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    notification: {
      create: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    workspaceMembership: { findMany: vi.fn().mockResolvedValue([]) },
  };
  const prismaMock = {
    workspace: { findFirst: vi.fn().mockResolvedValue({ id: tenant.workspaceId }) },
    directorAnalysis: {
      findFirst: vi.fn().mockResolvedValue(overrides?.running ?? null),
      findFirstOrThrow: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: vi.fn((callback) => callback(transaction)),
  };
  const prisma = prismaMock as unknown as PrismaClient;
  const featureFlags = { evaluate: vi.fn().mockResolvedValue({ enabled: overrides?.enabled ?? true }) };
  const intelligence = { buildSnapshot: vi.fn().mockResolvedValue(directorSnapshot()) };
  const result = {
    provider: "mock",
    model: "mock-v1",
    recommendations: [{ priority: "HIGH" }],
    priorities: { LOW: 0, MEDIUM: 0, HIGH: 1, CRITICAL: 0 },
    risks: [{}],
    opportunities: [],
  };
  const director = {
    execute: overrides?.directorError
      ? vi.fn().mockRejectedValue(overrides.directorError)
      : vi.fn().mockResolvedValue(result),
  };
  const persistence = { persist: vi.fn().mockResolvedValue([]) };
  const service = new DirectorAnalysisService(
    prisma,
    featureFlags as never,
    intelligence as never,
    director as never,
    persistence as never,
    "mock",
    "mock-v1",
    { now: () => now },
  );
  return { service, prisma: prismaMock, transaction, featureFlags, intelligence, director, persistence };
}

describe("DirectorAnalysisService", () => {
  it("refuse l’analyse lorsque le feature flag est désactivé", async () => {
    const { service, prisma } = setup({ enabled: false });
    await expect(service.runManual(tenant, "actor-a")).rejects.toMatchObject({ code: "DIRECTOR_DISABLED" });
    expect(prisma.workspace.findFirst).not.toHaveBeenCalled();
  });

  it("retourne l’analyse RUNNING existante lors d’un double lancement", async () => {
    const running = { id: "running-a", status: "RUNNING" };
    const { service, transaction, intelligence } = setup({ running });
    await expect(service.runManual(tenant, "actor-a")).resolves.toEqual({ analysis: running, reused: true });
    expect(transaction.directorAnalysis.create).not.toHaveBeenCalled();
    expect(intelligence.buildSnapshot).not.toHaveBeenCalled();
  });

  it("construit le snapshot, exécute le Mock et termine l’analyse sans données sensibles", async () => {
    const { service, prisma, transaction, intelligence, persistence } = setup();
    const response = await service.runManual(tenant, "actor-a");
    expect(response.reused).toBe(false);
    expect(prisma.workspace.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: tenant.workspaceId,
          organizationId: tenant.organizationId,
        }),
      }),
    );
    expect(intelligence.buildSnapshot).toHaveBeenCalledWith(tenant);
    expect(persistence.persist).toHaveBeenCalledWith(tenant, "analysis-a", expect.any(Array));
    const update = transaction.directorAnalysis.update.mock.calls[0]?.[0].data;
    expect(JSON.stringify(update)).not.toContain("body");
    expect(update.status).toBe("COMPLETED");
    expect(transaction.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "DIRECTOR_ANALYSIS_COMPLETED" }) }),
    );
  });

  it("marque l’analyse FAILED si le Director échoue", async () => {
    const { service, prisma } = setup({ directorError: new Error("provider failure") });
    await expect(service.runManual(tenant, "actor-a")).rejects.toThrow("provider failure");
    expect(prisma.directorAnalysis.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }),
    );
  });
});
