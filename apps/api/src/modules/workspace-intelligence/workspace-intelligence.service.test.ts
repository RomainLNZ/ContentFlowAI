import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceIntelligenceService } from "./workspace-intelligence.service.js";

const tenant = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  workspaceId: "22222222-2222-4222-8222-222222222222",
};

function prismaMock() {
  return {
    organization: {
      findFirstOrThrow: vi.fn().mockResolvedValue({
        name: "Tenant A",
        websiteUrl: null,
        industry: null,
        description: null,
        mission: null,
        values: [],
        communicationTone: null,
        forbiddenWords: [],
        favoriteExpressions: [],
      }),
    },
    brandProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    directorPreference: { findFirst: vi.fn().mockResolvedValue(null) },
    communicationObjective: { findMany: vi.fn().mockResolvedValue([]) },
    campaign: { findMany: vi.fn().mockResolvedValue([]) },
    contentItem: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

describe("WorkspaceIntelligenceService", () => {
  it("applique organizationId et workspaceId à toutes les lectures workspace-scoped", async () => {
    const prisma = prismaMock();
    await new WorkspaceIntelligenceService(prisma as unknown as PrismaClient, {
      now: () => new Date("2026-07-15T12:00:00.000Z"),
    }).buildSnapshot(tenant);

    expect(prisma.organization.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: tenant.organizationId,
          workspaces: { some: { id: tenant.workspaceId, archivedAt: null } },
        }),
      }),
    );
    for (const repository of [
      prisma.brandProfile.findFirst,
      prisma.directorPreference.findFirst,
      prisma.communicationObjective.findMany,
      prisma.campaign.findMany,
      prisma.contentItem.findMany,
    ]) {
      expect(repository).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(tenant),
        }),
      );
    }
  });

  it("ne sélectionne jamais le corps complet d’un contenu", async () => {
    const prisma = prismaMock();
    await new WorkspaceIntelligenceService(prisma as unknown as PrismaClient, {
      now: () => new Date("2026-07-15T12:00:00.000Z"),
    }).buildSnapshot(tenant);
    const query = prisma.contentItem.findMany.mock.calls[0]?.[0];
    expect(query.select).not.toHaveProperty("body");
    expect(query.select).not.toHaveProperty("cta");
    expect(query.select).not.toHaveProperty("hashtags");
  });

  it("ne mélange pas les identifiants de deux tenants successifs", async () => {
    const prisma = prismaMock();
    const service = new WorkspaceIntelligenceService(prisma as unknown as PrismaClient, {
      now: () => new Date("2026-07-15T12:00:00.000Z"),
    });
    const tenantB = {
      organizationId: "33333333-3333-4333-8333-333333333333",
      workspaceId: "44444444-4444-4444-8444-444444444444",
    };

    const first = await service.buildSnapshot(tenant);
    const second = await service.buildSnapshot(tenantB);

    expect(first).toMatchObject(tenant);
    expect(second).toMatchObject(tenantB);
    expect(prisma.contentItem.findMany.mock.calls[0]?.[0].where).toEqual(tenant);
    expect(prisma.contentItem.findMany.mock.calls[1]?.[0].where).toEqual(tenantB);
  });
});
