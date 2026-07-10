export type FeatureFlagSnapshot = {
  defaultEnabled: boolean;
  planEntitlement: { enabled: boolean; configuration: unknown } | null;
  organizationOverride: { enabled: boolean; configuration: unknown; expiresAt: Date | null } | null;
};

export type FeatureFlagDecision = {
  enabled: boolean;
  source: "organization_override" | "plan" | "default";
  configuration: unknown;
};

export interface FeatureFlagRepository {
  getSnapshot(organizationId: string, flagKey: string): Promise<FeatureFlagSnapshot | null>;
}
