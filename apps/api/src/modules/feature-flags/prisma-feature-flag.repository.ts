import type { PrismaClient } from "@prisma/client";
import type { FeatureFlagRepository, FeatureFlagSnapshot } from "./feature-flag.types.js";

export class PrismaFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getSnapshot(organizationId: string, flagKey: string): Promise<FeatureFlagSnapshot | null> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: flagKey },
      select: {
        id: true,
        defaultEnabled: true,
        organizationOverrides: {
          where: { organizationId },
          select: { enabled: true, configuration: true, expiresAt: true },
          take: 1,
        },
      },
    });
    if (!flag) return null;

    const billing = await this.prisma.billingAccount.findUnique({
      where: { organizationId },
      select: {
        plan: {
          select: {
            features: {
              where: { featureFlagId: flag.id },
              select: { enabled: true, configuration: true },
              take: 1,
            },
          },
        },
      },
    });
    return {
      defaultEnabled: flag.defaultEnabled,
      organizationOverride: flag.organizationOverrides[0] ?? null,
      planEntitlement: billing?.plan?.features[0] ?? null,
    };
  }
}
