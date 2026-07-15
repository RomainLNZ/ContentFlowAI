import type { DirectorRecommendationType, PrismaClient } from "@prisma/client";

type Tenant = { organizationId: string; workspaceId: string };
export type DirectorPreferenceInput = {
  desiredWeeklyFrequency: number;
  preferredWeekdays: number[];
  preferredHours: string[];
  timezone: string;
  silenceThresholdDays: number;
  maxDailyRecommendations: number;
  notificationsEnabled: boolean;
  proactivityLevel: number;
  disabledRecommendationTypes: DirectorRecommendationType[];
};

const defaults: DirectorPreferenceInput = {
  desiredWeeklyFrequency: 3,
  preferredWeekdays: [1, 2, 3, 4, 5],
  preferredHours: ["09:00"],
  timezone: "Europe/Paris",
  silenceThresholdDays: 7,
  maxDailyRecommendations: 5,
  notificationsEnabled: true,
  proactivityLevel: 2,
  disabledRecommendationTypes: [],
};

export class DirectorPreferenceService {
  constructor(private readonly prisma: PrismaClient) {}

  async get(tenant: Tenant) {
    return (await this.prisma.directorPreference.findFirst({ where: tenant })) ?? { ...tenant, ...defaults };
  }

  update(tenant: Tenant, actorId: string, input: DirectorPreferenceInput) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.directorPreference.findFirst({
        where: tenant,
        select: { id: true },
      });
      const preference = existing
        ? await transaction.directorPreference.update({ where: { id: existing.id }, data: input })
        : await transaction.directorPreference.create({ data: { ...tenant, ...input } });
      await transaction.auditLog.create({
        data: {
          ...tenant,
          actorId,
          action: "director.preferences_updated",
          entityType: "director_preference",
          entityId: preference.id,
          metadata: { fields: Object.keys(input) },
        },
      });
      return preference;
    });
  }
}
