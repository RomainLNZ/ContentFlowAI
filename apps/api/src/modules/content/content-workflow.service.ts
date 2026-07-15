import type { ContentStatus, Prisma, PrismaClient } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import type { AccessControlService } from "../access-control/access-control.service.js";

type Tenant = { organizationId: string; workspaceId: string };
type Transaction = Prisma.TransactionClient;

const transitionPermission: Partial<Record<ContentStatus, string>> = {
  READY_FOR_REVIEW: "content.submit_review",
  CHANGES_REQUESTED: "content.request_changes",
  APPROVED: "content.approve",
  SCHEDULED: "content.schedule",
  PUBLISHED: "content.publish_status",
  ARCHIVED: "content.archive",
};

const allowedTransitions: Record<ContentStatus, readonly ContentStatus[]> = {
  DRAFT: ["READY_FOR_REVIEW", "ARCHIVED"],
  READY_FOR_REVIEW: ["DRAFT", "APPROVED", "CHANGES_REQUESTED", "ARCHIVED"],
  CHANGES_REQUESTED: ["DRAFT", "READY_FOR_REVIEW", "ARCHIVED"],
  APPROVED: ["SCHEDULED", "ARCHIVED"],
  SCHEDULED: ["APPROVED", "PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

export class ContentWorkflowService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly access: AccessControlService,
  ) {}

  async transition(input: {
    tenant: Tenant;
    actorId: string;
    contentId: string;
    to: ContentStatus;
    reason?: string;
    reviewerId?: string;
    scheduledAt?: Date;
    timezone?: string;
    publishedAt?: Date;
  }) {
    const content = await this.prisma.contentItem.findFirst({
      where: { id: input.contentId, ...input.tenant },
      select: { id: true, authorId: true, assigneeId: true, reviewerId: true, status: true },
    });
    if (!content) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
    if (!allowedTransitions[content.status].includes(input.to)) {
      throw new HttpError(409, "CONTENT_TRANSITION_NOT_ALLOWED", "Transition de statut interdite.", {
        from: content.status,
        to: input.to,
      });
    }

    const permission =
      input.to === "DRAFT" && content.status === "READY_FOR_REVIEW"
        ? "content.withdraw_review"
        : input.to === "DRAFT"
          ? "content.update"
          : input.to === "APPROVED" && content.status === "SCHEDULED"
            ? "content.schedule"
            : transitionPermission[input.to];
    const isAuthorWithdrawal =
      content.status === "READY_FOR_REVIEW" && input.to === "DRAFT" && content.authorId === input.actorId;
    if (!isAuthorWithdrawal && permission) {
      await this.access.require({ userId: input.actorId, ...input.tenant }, permission);
    }
    if (input.to === "CHANGES_REQUESTED" && !input.reason?.trim()) {
      throw new HttpError(422, "CHANGE_REASON_REQUIRED", "Une raison de correction est requise.");
    }
    if (input.to === "SCHEDULED" && !input.scheduledAt) {
      throw new HttpError(422, "SCHEDULE_DATE_REQUIRED", "Une date de planification est requise.");
    }

    return this.prisma.$transaction(async (transaction) => {
      if (input.reviewerId) await this.requireWorkspaceMember(transaction, input.tenant, input.reviewerId);
      const now = new Date();
      const data: Prisma.ContentItemUpdateManyMutationInput = {
        status: input.to,
        ...(input.to === "READY_FOR_REVIEW"
          ? { approvalRequestedAt: now, reviewerId: input.reviewerId ?? content.reviewerId }
          : {}),
        ...(input.to === "APPROVED" ? { approvedAt: now, approvedById: input.actorId } : {}),
        ...(input.to === "CHANGES_REQUESTED" ? { approvedAt: null, approvedById: null } : {}),
        ...(input.to === "SCHEDULED"
          ? { scheduledAt: input.scheduledAt, timezone: input.timezone ?? "Europe/Paris" }
          : {}),
        ...(input.to === "PUBLISHED" ? { publishedAt: input.publishedAt ?? now } : {}),
        ...(input.to === "ARCHIVED" ? { archivedAt: now } : {}),
      };
      const updated = await transaction.contentItem.updateMany({
        where: { id: content.id, ...input.tenant, status: content.status },
        data,
      });
      if (updated.count !== 1) {
        throw new HttpError(409, "CONTENT_CONCURRENT_UPDATE", "Le contenu a été modifié entre-temps.");
      }
      await transaction.auditLog.create({
        data: {
          organizationId: input.tenant.organizationId,
          workspaceId: input.tenant.workspaceId,
          actorId: input.actorId,
          action: this.auditAction(input.to),
          entityType: "content",
          entityId: content.id,
          metadata: {
            from: content.status,
            to: input.to,
            ...(input.reason ? { reason: input.reason.trim() } : {}),
            ...(input.scheduledAt ? { scheduledAt: input.scheduledAt.toISOString() } : {}),
          },
        },
      });
      await this.createTransitionNotification(transaction, input, content);
      return transaction.contentItem.findFirstOrThrow({ where: { id: content.id, ...input.tenant } });
    });
  }

  private async requireWorkspaceMember(transaction: Transaction, tenant: Tenant, userId: string) {
    const membership = await transaction.workspaceMembership.findFirst({
      where: {
        workspaceId: tenant.workspaceId,
        userId,
        status: "ACTIVE",
        workspace: { organizationId: tenant.organizationId },
      },
      select: { userId: true },
    });
    if (!membership) throw new HttpError(422, "WORKSPACE_MEMBER_INVALID", "Membre du workspace invalide.");
  }

  private auditAction(status: ContentStatus) {
    return {
      READY_FOR_REVIEW: "content.review_requested",
      CHANGES_REQUESTED: "content.changes_requested",
      APPROVED: "content.approved",
      SCHEDULED: "content.scheduled",
      PUBLISHED: "content.published",
      ARCHIVED: "content.archived",
      DRAFT: "content.status_changed",
    }[status];
  }

  private async createTransitionNotification(
    transaction: Transaction,
    input: Parameters<ContentWorkflowService["transition"]>[0],
    content: { authorId: string; assigneeId: string | null; reviewerId: string | null },
  ) {
    const config = {
      READY_FOR_REVIEW: {
        type: "REVIEW_REQUESTED" as const,
        recipient: input.reviewerId ?? content.reviewerId,
      },
      CHANGES_REQUESTED: { type: "CHANGES_REQUESTED" as const, recipient: content.authorId },
      APPROVED: { type: "CONTENT_APPROVED" as const, recipient: content.authorId },
      SCHEDULED: { type: "CONTENT_SCHEDULED" as const, recipient: content.assigneeId ?? content.authorId },
    }[input.to as "READY_FOR_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "SCHEDULED"];
    if (!config?.recipient || config.recipient === input.actorId) return;
    await transaction.notification.create({
      data: {
        ...input.tenant,
        recipientId: config.recipient,
        actorId: input.actorId,
        contentId: input.contentId,
        type: config.type,
        payload: input.reason ? { reason: input.reason.trim() } : {},
      },
    });
  }
}

export { allowedTransitions };
