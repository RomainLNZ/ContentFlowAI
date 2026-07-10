import { describe, expect, it } from "vitest";
import { FeatureFlagService } from "./feature-flag.service.js";
import type { FeatureFlagRepository, FeatureFlagSnapshot } from "./feature-flag.types.js";

const repository = (snapshot: FeatureFlagSnapshot | null): FeatureFlagRepository => ({
  getSnapshot: async () => snapshot,
});

describe("FeatureFlagService", () => {
  it("priorise une dérogation d'organisation active", async () => {
    const service = new FeatureFlagService(
      repository({
        defaultEnabled: false,
        planEntitlement: { enabled: false, configuration: null },
        organizationOverride: { enabled: true, configuration: { quota: 10 }, expiresAt: null },
      }),
    );
    await expect(service.evaluate("org", "ai.agents")).resolves.toEqual({
      enabled: true,
      source: "organization_override",
      configuration: { quota: 10 },
    });
  });

  it("ignore une dérogation expirée et utilise le plan", async () => {
    const service = new FeatureFlagService(
      repository({
        defaultEnabled: false,
        planEntitlement: { enabled: true, configuration: null },
        organizationOverride: { enabled: false, configuration: null, expiresAt: new Date("2025-01-01") },
      }),
    );
    await expect(service.evaluate("org", "analytics", new Date("2026-01-01"))).resolves.toMatchObject({
      enabled: true,
      source: "plan",
    });
  });
});
