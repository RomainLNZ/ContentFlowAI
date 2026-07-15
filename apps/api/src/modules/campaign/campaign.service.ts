import type { CampaignStatus, Prisma, PrismaClient } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";

type Tenant = { organizationId: string; workspaceId: string };
type CampaignData = {
  name?: string | undefined;
  description?: string | null | undefined;
  objective?: string | null | undefined;
  startDate?: Date | null | undefined;
  endDate?: Date | null | undefined;
  status?: Exclude<CampaignStatus, "ARCHIVED"> | undefined;
  color?: string | undefined;
};

export class CampaignService {
  constructor(private readonly prisma: PrismaClient) {}

  list(tenant: Tenant, filters: { status?: CampaignStatus | undefined; q?: string | undefined }) {
    return this.prisma.campaign.findMany({
      where: {
        ...tenant,
        ...(filters.status ? { status: filters.status } : { status: { not: "ARCHIVED" } }),
        ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" } } : {}),
      },
      include: { _count: { select: { contentItems: true } } },
      orderBy: [{ startDate: "asc" }, { name: "asc" }],
    });
  }

  async get(tenant: Tenant, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, ...tenant },
      include: { _count: { select: { contentItems: true } } },
    });
    if (!campaign) throw new HttpError(404, "CAMPAIGN_NOT_FOUND", "Campagne introuvable.");
    return campaign;
  }

  create(tenant: Tenant, actorId: string, data: CampaignData & { name: string }) {
    return this.prisma.$transaction(async (transaction) => {
      const campaign = await transaction.campaign.create({
        data: {
          ...tenant,
          createdById: actorId,
          name: data.name,
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.objective !== undefined ? { objective: data.objective } : {}),
          ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
          ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.color ? { color: data.color } : {}),
        },
      });
      await transaction.auditLog.create({
        data: {
          ...tenant,
          actorId,
          action: "campaign.created",
          entityType: "campaign",
          entityId: campaign.id,
          metadata: { name: campaign.name, status: campaign.status },
        },
      });
      return campaign;
    });
  }

  async update(tenant: Tenant, actorId: string, id: string, data: CampaignData) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.campaign.findFirst({
        where: { id, ...tenant },
        select: { id: true },
      });
      if (!current) throw new HttpError(404, "CAMPAIGN_NOT_FOUND", "Campagne introuvable.");
      const updateData: Prisma.CampaignUpdateInput = {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.objective !== undefined ? { objective: data.objective } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
      };
      await transaction.campaign.updateMany({ where: { id, ...tenant }, data: updateData });
      const campaign = await transaction.campaign.findFirstOrThrow({ where: { id, ...tenant } });
      await transaction.auditLog.create({
        data: {
          ...tenant,
          actorId,
          action: "campaign.updated",
          entityType: "campaign",
          entityId: id,
          metadata: { fields: Object.keys(updateData) },
        },
      });
      return campaign;
    });
  }

  async archive(tenant: Tenant, actorId: string, id: string) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.campaign.updateMany({
        where: { id, ...tenant, status: { not: "ARCHIVED" } },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
      if (!result.count) throw new HttpError(404, "CAMPAIGN_NOT_FOUND", "Campagne introuvable.");
      await transaction.auditLog.create({
        data: {
          ...tenant,
          actorId,
          action: "campaign.archived",
          entityType: "campaign",
          entityId: id,
          metadata: {},
        },
      });
      return { archived: true };
    });
  }
}
