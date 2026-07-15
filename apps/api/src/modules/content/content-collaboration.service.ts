import type { Prisma, PrismaClient } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";

type Tenant = { organizationId: string; workspaceId: string };

export class ContentCollaborationService {
  constructor(private readonly prisma: PrismaClient) {}

  async assign(input: {
    tenant: Tenant;
    actorId: string;
    contentId: string;
    assigneeId?: string | null;
    reviewerId?: string | null;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const content = await transaction.contentItem.findFirst({
        where: { id: input.contentId, ...input.tenant },
        select: { id: true, assigneeId: true, reviewerId: true },
      });
      if (!content) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
      const memberIds = [input.assigneeId, input.reviewerId].filter((id): id is string => Boolean(id));
      if (memberIds.length) {
        const memberships = await transaction.workspaceMembership.count({
          where: {
            workspaceId: input.tenant.workspaceId,
            userId: { in: memberIds },
            status: "ACTIVE",
            workspace: { organizationId: input.tenant.organizationId },
          },
        });
        if (memberships !== new Set(memberIds).size) {
          throw new HttpError(422, "WORKSPACE_MEMBER_INVALID", "Membre du workspace invalide.");
        }
      }
      await transaction.contentItem.updateMany({
        where: { id: content.id, ...input.tenant },
        data: {
          ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
          ...(input.reviewerId !== undefined ? { reviewerId: input.reviewerId } : {}),
        },
      });
      const metadata: Prisma.InputJsonObject = {
        ...(input.assigneeId !== undefined
          ? { assigneeId: { from: content.assigneeId, to: input.assigneeId } }
          : {}),
        ...(input.reviewerId !== undefined
          ? { reviewerId: { from: content.reviewerId, to: input.reviewerId } }
          : {}),
      };
      await transaction.auditLog.create({
        data: {
          ...input.tenant,
          actorId: input.actorId,
          action: "content.assigned",
          entityType: "content",
          entityId: content.id,
          metadata,
        },
      });
      if (input.assigneeId && input.assigneeId !== input.actorId && input.assigneeId !== content.assigneeId) {
        await transaction.notification.create({
          data: {
            ...input.tenant,
            recipientId: input.assigneeId,
            actorId: input.actorId,
            contentId: content.id,
            type: "CONTENT_ASSIGNED",
            payload: {},
          },
        });
      }
      return transaction.contentItem.findFirstOrThrow({ where: { id: content.id, ...input.tenant } });
    });
  }

  async moveCalendarDate(input: {
    tenant: Tenant;
    actorId: string;
    contentId: string;
    scheduledAt: Date | null;
    timezone: string;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const content = await transaction.contentItem.findFirst({
        where: { id: input.contentId, ...input.tenant },
        select: { id: true, scheduledAt: true },
      });
      if (!content) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
      await transaction.contentItem.updateMany({
        where: { id: content.id, ...input.tenant },
        data: { scheduledAt: input.scheduledAt, timezone: input.timezone },
      });
      await transaction.auditLog.create({
        data: {
          ...input.tenant,
          actorId: input.actorId,
          action: "content.calendar_moved",
          entityType: "content",
          entityId: content.id,
          metadata: {
            from: content.scheduledAt?.toISOString() ?? null,
            to: input.scheduledAt?.toISOString() ?? null,
            timezone: input.timezone,
          },
        },
      });
      return transaction.contentItem.findFirstOrThrow({ where: { id: content.id, ...input.tenant } });
    });
  }
}
