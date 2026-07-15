import type { PrismaClient } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";

type Tenant = { organizationId: string; workspaceId: string };

export class CommentService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(tenant: Tenant, contentId: string) {
    await this.requireContent(tenant, contentId);
    return this.prisma.contentComment.findMany({
      where: { ...tenant, contentId },
      include: { author: { select: { id: true, fullName: true, avatarPath: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(tenant: Tenant, actorId: string, contentId: string, body: string, mentionedUserIds: string[]) {
    return this.prisma.$transaction(async (transaction) => {
      const content = await transaction.contentItem.findFirst({
        where: { id: contentId, ...tenant },
        select: { id: true, authorId: true, assigneeId: true },
      });
      if (!content) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
      if (mentionedUserIds.length) {
        const count = await transaction.workspaceMembership.count({
          where: {
            workspaceId: tenant.workspaceId,
            userId: { in: [...new Set(mentionedUserIds)] },
            status: "ACTIVE",
            workspace: { organizationId: tenant.organizationId },
          },
        });
        if (count !== new Set(mentionedUserIds).size)
          throw new HttpError(422, "WORKSPACE_MEMBER_INVALID", "Mention invalide.");
      }
      const comment = await transaction.contentComment.create({
        data: { ...tenant, contentId, authorId: actorId, body, mentionedUserIds },
      });
      await transaction.auditLog.create({
        data: {
          ...tenant,
          actorId,
          action: "content.comment_added",
          entityType: "content",
          entityId: contentId,
          metadata: { commentId: comment.id },
        },
      });
      const recipients = [
        ...new Set(
          [content.authorId, content.assigneeId, ...mentionedUserIds].filter(
            (value): value is string => Boolean(value) && value !== actorId,
          ),
        ),
      ];
      if (recipients.length)
        await transaction.notification.createMany({
          data: recipients.map((recipientId) => ({
            ...tenant,
            recipientId,
            actorId,
            contentId,
            type: "COMMENT_ADDED" as const,
            payload: { commentId: comment.id },
          })),
        });
      return comment;
    });
  }

  async update(tenant: Tenant, actorId: string, contentId: string, commentId: string, body: string) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.contentComment.updateMany({
        where: { id: commentId, contentId, authorId: actorId, deletedAt: null, ...tenant },
        data: { body },
      });
      if (!result.count)
        throw new HttpError(404, "COMMENT_NOT_FOUND", "Commentaire introuvable ou non modifiable.");
      await transaction.auditLog.create({
        data: {
          ...tenant,
          actorId,
          action: "content.comment_updated",
          entityType: "content",
          entityId: contentId,
          metadata: { commentId },
        },
      });
      return transaction.contentComment.findFirstOrThrow({ where: { id: commentId, contentId, ...tenant } });
    });
  }

  async remove(tenant: Tenant, actorId: string, contentId: string, commentId: string, canDeleteAny: boolean) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.contentComment.updateMany({
        where: { id: commentId, contentId, ...tenant, ...(canDeleteAny ? {} : { authorId: actorId }) },
        data: { body: "", mentionedUserIds: [], deletedAt: new Date() },
      });
      if (!result.count)
        throw new HttpError(404, "COMMENT_NOT_FOUND", "Commentaire introuvable ou non supprimable.");
      await transaction.auditLog.create({
        data: {
          ...tenant,
          actorId,
          action: "content.comment_deleted",
          entityType: "content",
          entityId: contentId,
          metadata: { commentId },
        },
      });
      return { deleted: true };
    });
  }

  private async requireContent(tenant: Tenant, contentId: string) {
    const content = await this.prisma.contentItem.findFirst({
      where: { id: contentId, ...tenant },
      select: { id: true },
    });
    if (!content) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
  }
}
