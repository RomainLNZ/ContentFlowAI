import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { DirectorPreferenceService } from "./director-preference.service.js";

describe("DirectorPreferenceService", () => {
  const tenant = { organizationId: "org-a", workspaceId: "workspace-a" };

  it("retourne des préférences workspace-scoped par défaut", async () => {
    const prisma = { directorPreference: { findFirst: vi.fn().mockResolvedValue(null) } };
    const result = await new DirectorPreferenceService(prisma as unknown as PrismaClient).get(tenant);
    expect(prisma.directorPreference.findFirst).toHaveBeenCalledWith({ where: tenant });
    expect(result).toMatchObject({ ...tenant, timezone: "Europe/Paris", desiredWeeklyFrequency: 3 });
  });

  it("persiste les préférences et l’audit dans la même transaction", async () => {
    const input = {
      desiredWeeklyFrequency: 4,
      preferredWeekdays: [1, 3, 5],
      preferredHours: ["09:00"],
      timezone: "Europe/Paris",
      silenceThresholdDays: 6,
      maxDailyRecommendations: 5,
      notificationsEnabled: true,
      proactivityLevel: 2,
      disabledRecommendationTypes: [],
    };
    const transaction = {
      directorPreference: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "pref-a", ...tenant, ...input }),
        update: vi.fn(),
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: vi.fn((callback) => callback(transaction)) };
    await new DirectorPreferenceService(prisma as unknown as PrismaClient).update(tenant, "actor-a", input);
    expect(transaction.directorPreference.findFirst).toHaveBeenCalledWith({
      where: tenant,
      select: { id: true },
    });
    expect(transaction.directorPreference.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining(tenant),
      }),
    );
    expect(transaction.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "director.preferences_updated" }) }),
    );
  });
});
