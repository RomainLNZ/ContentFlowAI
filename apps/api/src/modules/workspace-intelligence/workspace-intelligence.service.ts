import type { PrismaClient } from "@prisma/client";
import {
  WorkspaceIntelligenceSnapshotBuilder,
  type IntelligenceClock,
  systemIntelligenceClock,
} from "./workspace-intelligence.builder.js";
import type {
  WorkspaceIntelligenceSnapshot,
  WorkspaceIntelligenceSource,
  WorkspaceTenant,
} from "./workspace-intelligence.types.js";

export class WorkspaceIntelligenceService {
  private readonly builder: WorkspaceIntelligenceSnapshotBuilder;

  constructor(
    private readonly prisma: PrismaClient,
    clock: IntelligenceClock = systemIntelligenceClock,
  ) {
    this.builder = new WorkspaceIntelligenceSnapshotBuilder(clock);
  }

  async buildSnapshot(tenant: WorkspaceTenant): Promise<WorkspaceIntelligenceSnapshot> {
    const tenantWhere = { organizationId: tenant.organizationId, workspaceId: tenant.workspaceId };
    const [organization, brandProfile, preference, objectives, campaigns, contents] = await Promise.all([
      this.prisma.organization.findFirstOrThrow({
        where: {
          id: tenant.organizationId,
          archivedAt: null,
          workspaces: { some: { id: tenant.workspaceId, archivedAt: null } },
        },
        select: {
          name: true,
          websiteUrl: true,
          industry: true,
          description: true,
          mission: true,
          values: true,
          communicationTone: true,
          forbiddenWords: true,
          favoriteExpressions: true,
        },
      }),
      this.prisma.brandProfile.findFirst({
        where: tenantWhere,
        select: { productsServices: true, targetAudiences: true },
      }),
      this.prisma.directorPreference.findFirst({
        where: tenantWhere,
        select: { desiredWeeklyFrequency: true, silenceThresholdDays: true },
      }),
      this.prisma.communicationObjective.findMany({
        where: tenantWhere,
        select: { type: true, isPrimary: true },
        orderBy: { type: "asc" },
      }),
      this.prisma.campaign.findMany({
        where: { ...tenantWhere, archivedAt: null },
        select: { id: true, name: true, status: true, startDate: true, endDate: true },
        orderBy: { id: "asc" },
      }),
      this.prisma.contentItem.findMany({
        where: tenantWhere,
        select: {
          id: true,
          status: true,
          platform: true,
          objective: true,
          campaignId: true,
          scheduledAt: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { id: "asc" },
      }),
    ]);

    const source: WorkspaceIntelligenceSource = {
      organization,
      brandProfile,
      preference,
      objectives,
      campaigns,
      contents,
    };
    return this.builder.build(tenant, source);
  }
}
