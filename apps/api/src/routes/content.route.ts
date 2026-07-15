import type { Prisma, PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { ServerEnv } from "@flowpilot/config";
import { HttpError } from "../lib/http-error.js";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/require-permission.js";
import { createTenantMiddleware } from "../middleware/resolve-tenant.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { AccessControlService } from "../modules/access-control/access-control.service.js";
import { PrismaPermissionRepository } from "../modules/access-control/prisma-permission.repository.js";
import {
  createContentSchema,
  listContentSchema,
  updateContentSchema,
} from "../modules/content/content.schema.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";
import { ContentWorkflowService } from "../modules/content/content-workflow.service.js";
import { ContentCollaborationService } from "../modules/content/content-collaboration.service.js";
import {
  assignContentSchema,
  calendarDateSchema,
  scheduleContentSchema,
  transitionContentSchema,
} from "../modules/content/content-workflow.schema.js";

function getContentId(value: string | string[] | undefined) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new HttpError(400, "CONTENT_ID_INVALID", "Identifiant de contenu invalide.");
  }
  return value;
}

export function createContentRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  const access = new AccessControlService(new PrismaPermissionRepository(prisma));
  const workflow = new ContentWorkflowService(prisma, access);
  const collaboration = new ContentCollaborationService(prisma);
  router.use(
    createAuthMiddleware(env),
    createUserSyncMiddleware(new UserSyncService(prisma)),
    createTenantMiddleware(prisma),
  );

  router.get("/", requirePermission(access, "content.read"), async (request, response, next) => {
    try {
      if (!request.tenant) throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
      const parsed = listContentSchema.safeParse(request.query);
      if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Filtres invalides.");
      const { q, status, objective, page, pageSize } = parsed.data;
      const where = {
        organizationId: request.tenant.organizationId,
        workspaceId: request.tenant.workspaceId,
        ...(status ? { status } : { status: { not: "ARCHIVED" as const } }),
        ...(objective ? { objective } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { body: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.contentItem.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.contentItem.count({ where }),
      ]);
      response.json({ data: { items, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requirePermission(access, "content.create"), async (request, response, next) => {
    try {
      if (!request.tenant || !request.currentUser)
        throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
      const parsed = createContentSchema.safeParse(request.body);
      if (!parsed.success)
        throw new HttpError(422, "VALIDATION_ERROR", "Contenu invalide.", parsed.error.flatten());
      if (parsed.data.sourceVariantId) {
        const source = await prisma.contentVariant.findFirst({
          where: { id: parsed.data.sourceVariantId, ...request.tenant },
          select: { id: true },
        });
        if (!source) throw new HttpError(404, "CONTENT_VARIANT_NOT_FOUND", "Variante introuvable.");
      }
      if (parsed.data.campaignId) {
        const campaign = await prisma.campaign.findFirst({
          where: { id: parsed.data.campaignId, ...request.tenant, status: { not: "ARCHIVED" } },
          select: { id: true },
        });
        if (!campaign) throw new HttpError(422, "CAMPAIGN_INVALID", "Campagne invalide.");
      }
      const item = await prisma.$transaction(async (transaction) => {
        const created = await transaction.contentItem.create({
          data: {
            ...request.tenant!,
            authorId: request.currentUser!.id,
            title: parsed.data.title,
            body: parsed.data.body,
            status: "DRAFT",
            ...(parsed.data.cta !== undefined ? { cta: parsed.data.cta } : {}),
            hashtags: parsed.data.hashtags,
            ...(parsed.data.sourceVariantId ? { sourceVariantId: parsed.data.sourceVariantId } : {}),
            ...(parsed.data.objective ? { objective: parsed.data.objective } : {}),
            ...(parsed.data.tone ? { tone: parsed.data.tone } : {}),
            ...(parsed.data.targetAudience ? { targetAudience: parsed.data.targetAudience } : {}),
            ...(parsed.data.campaignId ? { campaignId: parsed.data.campaignId } : {}),
          },
        });
        await transaction.auditLog.create({
          data: {
            ...request.tenant!,
            actorId: request.currentUser!.id,
            action: "content.created",
            entityType: "content",
            entityId: created.id,
            metadata: { title: created.title, status: created.status },
          },
        });
        return created;
      });
      response.status(201).json({ data: item });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", requirePermission(access, "content.read"), async (request, response, next) => {
    try {
      if (!request.tenant || !request.currentUser)
        throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
      const id = getContentId(request.params.id);
      const item = await prisma.contentItem.findFirst({
        where: { id, ...request.tenant },
        include: {
          author: { select: { id: true, fullName: true, avatarPath: true } },
          assignee: { select: { id: true, fullName: true, avatarPath: true } },
          reviewer: { select: { id: true, fullName: true, avatarPath: true } },
          approvedBy: { select: { id: true, fullName: true, avatarPath: true } },
          campaign: { select: { id: true, name: true, color: true } },
          _count: { select: { comments: { where: { deletedAt: null } } } },
        },
      });
      if (!item) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
      response.json({ data: item });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", requirePermission(access, "content.update"), async (request, response, next) => {
    try {
      if (!request.tenant) throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
      const parsed = updateContentSchema.safeParse(request.body);
      if (!parsed.success)
        throw new HttpError(422, "VALIDATION_ERROR", "Contenu invalide.", parsed.error.flatten());
      const id = getContentId(request.params.id);
      const data: Prisma.ContentItemUpdateManyMutationInput = {
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
        ...(parsed.data.body ? { body: parsed.data.body } : {}),
        ...(parsed.data.cta !== undefined ? { cta: parsed.data.cta } : {}),
        ...(parsed.data.hashtags !== undefined ? { hashtags: parsed.data.hashtags } : {}),
        ...(parsed.data.objective ? { objective: parsed.data.objective } : {}),
        ...(parsed.data.tone ? { tone: parsed.data.tone } : {}),
        ...(parsed.data.targetAudience ? { targetAudience: parsed.data.targetAudience } : {}),
        ...(parsed.data.campaignId !== undefined ? { campaignId: parsed.data.campaignId } : {}),
      };
      if (parsed.data.campaignId) {
        const campaign = await prisma.campaign.findFirst({
          where: { id: parsed.data.campaignId, ...request.tenant, status: { not: "ARCHIVED" } },
          select: { id: true },
        });
        if (!campaign) throw new HttpError(422, "CAMPAIGN_INVALID", "Campagne invalide.");
      }
      const item = await prisma.$transaction(async (transaction) => {
        const result = await transaction.contentItem.updateMany({ where: { id, ...request.tenant! }, data });
        if (result.count === 0) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
        await transaction.auditLog.create({
          data: {
            ...request.tenant!,
            actorId: request.currentUser!.id,
            action: "content.updated",
            entityType: "content",
            entityId: id,
            metadata: { fields: Object.keys(data) },
          },
        });
        return transaction.contentItem.findFirstOrThrow({ where: { id, ...request.tenant! } });
      });
      response.json({ data: item });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/:id/archive",
    requirePermission(access, "content.archive"),
    async (request, response, next) => {
      try {
        if (!request.tenant) throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
        const id = getContentId(request.params.id);
        if (!request.currentUser) throw new HttpError(401, "AUTH_REQUIRED", "Authentification requise.");
        const item = await workflow.transition({
          tenant: request.tenant,
          actorId: request.currentUser.id,
          contentId: id,
          to: "ARCHIVED",
        });
        response.json({ data: item });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/:id/duplicate",
    requirePermission(access, "content.create"),
    async (request, response, next) => {
      try {
        if (!request.tenant || !request.currentUser)
          throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
        const id = getContentId(request.params.id);
        const source = await prisma.contentItem.findFirst({
          where: { id, ...request.tenant },
        });
        if (!source) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
        const duplicate = await prisma.$transaction(async (transaction) => {
          const created = await transaction.contentItem.create({
            data: {
              ...request.tenant,
              authorId: request.currentUser!.id,
              sourceVariantId: source.sourceVariantId,
              type: source.type,
              platform: source.platform,
              title: `${source.title} — copie`,
              body: source.body,
              cta: source.cta,
              hashtags: source.hashtags,
              status: "DRAFT",
              objective: source.objective,
              tone: source.tone,
              targetAudience: source.targetAudience,
            },
          });
          await transaction.auditLog.create({
            data: {
              ...request.tenant!,
              actorId: request.currentUser!.id,
              action: "content.created",
              entityType: "content",
              entityId: created.id,
              metadata: { duplicatedFromId: source.id, status: "DRAFT" },
            },
          });
          return created;
        });
        response.status(201).json({ data: duplicate });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/:id/transitions",
    requirePermission(access, "content.read"),
    async (request, response, next) => {
      try {
        if (!request.tenant || !request.currentUser)
          throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
        const parsed = transitionContentSchema.safeParse(request.body);
        if (!parsed.success)
          throw new HttpError(422, "VALIDATION_ERROR", "Transition invalide.", parsed.error.flatten());
        const item = await workflow.transition({
          tenant: request.tenant,
          actorId: request.currentUser.id,
          contentId: getContentId(request.params.id),
          to: parsed.data.to,
          ...(parsed.data.reason !== undefined ? { reason: parsed.data.reason } : {}),
          ...(parsed.data.reviewerId !== undefined ? { reviewerId: parsed.data.reviewerId } : {}),
          ...(parsed.data.scheduledAt !== undefined ? { scheduledAt: parsed.data.scheduledAt } : {}),
          ...(parsed.data.publishedAt !== undefined ? { publishedAt: parsed.data.publishedAt } : {}),
          ...(parsed.data.timezone !== undefined ? { timezone: parsed.data.timezone } : {}),
        });
        response.json({ data: item });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/:id/schedule",
    requirePermission(access, "content.schedule"),
    async (request, response, next) => {
      try {
        if (!request.tenant || !request.currentUser)
          throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
        const parsed = scheduleContentSchema.safeParse(request.body);
        if (!parsed.success)
          throw new HttpError(422, "VALIDATION_ERROR", "Planification invalide.", parsed.error.flatten());
        const item = await workflow.transition({
          tenant: request.tenant,
          actorId: request.currentUser.id,
          contentId: getContentId(request.params.id),
          to: "SCHEDULED",
          ...parsed.data,
        });
        response.json({ data: item });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post("/:id/assign", requirePermission(access, "content.assign"), async (request, response, next) => {
    try {
      if (!request.tenant || !request.currentUser)
        throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
      const parsed = assignContentSchema.safeParse(request.body);
      if (!parsed.success)
        throw new HttpError(422, "VALIDATION_ERROR", "Assignation invalide.", parsed.error.flatten());
      const item = await collaboration.assign({
        tenant: request.tenant,
        actorId: request.currentUser.id,
        contentId: getContentId(request.params.id),
        ...(parsed.data.assigneeId !== undefined ? { assigneeId: parsed.data.assigneeId } : {}),
        ...(parsed.data.reviewerId !== undefined ? { reviewerId: parsed.data.reviewerId } : {}),
      });
      response.json({ data: item });
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    "/:id/calendar-date",
    requirePermission(access, "calendar.manage"),
    async (request, response, next) => {
      try {
        if (!request.tenant || !request.currentUser)
          throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
        const parsed = calendarDateSchema.safeParse(request.body);
        if (!parsed.success)
          throw new HttpError(422, "VALIDATION_ERROR", "Date éditoriale invalide.", parsed.error.flatten());
        const item = await collaboration.moveCalendarDate({
          tenant: request.tenant,
          actorId: request.currentUser.id,
          contentId: getContentId(request.params.id),
          ...parsed.data,
        });
        response.json({ data: item });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get("/:id/history", requirePermission(access, "content.read"), async (request, response, next) => {
    try {
      if (!request.tenant) throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
      const contentId = getContentId(request.params.id);
      const content = await prisma.contentItem.findFirst({
        where: { id: contentId, ...request.tenant },
        select: { id: true },
      });
      if (!content) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
      const history = await prisma.auditLog.findMany({
        where: {
          organizationId: request.tenant.organizationId,
          workspaceId: request.tenant.workspaceId,
          entityType: "content",
          entityId: contentId,
        },
        include: { actor: { select: { id: true, fullName: true, avatarPath: true } } },
        orderBy: { createdAt: "asc" },
      });
      response.json({ data: history.map((entry) => ({ ...entry, id: entry.id.toString() })) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
