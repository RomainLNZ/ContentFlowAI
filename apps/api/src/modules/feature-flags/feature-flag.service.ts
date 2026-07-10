import type { FeatureFlagDecision, FeatureFlagRepository } from "./feature-flag.types.js";

export class FeatureFlagService {
  constructor(private readonly repository: FeatureFlagRepository) {}

  async evaluate(organizationId: string, flagKey: string, now = new Date()): Promise<FeatureFlagDecision> {
    const snapshot = await this.repository.getSnapshot(organizationId, flagKey);
    if (!snapshot) return { enabled: false, source: "default", configuration: null };

    const override = snapshot.organizationOverride;
    if (override && (!override.expiresAt || override.expiresAt > now)) {
      return {
        enabled: override.enabled,
        source: "organization_override",
        configuration: override.configuration,
      };
    }
    if (snapshot.planEntitlement) {
      return {
        enabled: snapshot.planEntitlement.enabled,
        source: "plan",
        configuration: snapshot.planEntitlement.configuration,
      };
    }
    return { enabled: snapshot.defaultEnabled, source: "default", configuration: null };
  }
}
