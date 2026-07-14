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
      const item = await prisma.contentItem.create({
        data: {
          ...request.tenant,
          authorId: request.currentUser.id,
          title: parsed.data.title,
          body: parsed.data.body,
          status: parsed.data.status,
          ...(parsed.data.sourceVariantId ? { sourceVariantId: parsed.data.sourceVariantId } : {}),
          ...(parsed.data.objective ? { objective: parsed.data.objective } : {}),
          ...(parsed.data.tone ? { tone: parsed.data.tone } : {}),
          ...(parsed.data.targetAudience ? { targetAudience: parsed.data.targetAudience } : {}),
        },
      });
      response.status(201).json({ data: item });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", requirePermission(access, "content.read"), async (request, response, next) => {
    try {
      if (!request.tenant) throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
      const id = getContentId(request.params.id);
      const item = await prisma.contentItem.findFirst({
        where: { id, ...request.tenant },
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
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.objective ? { objective: parsed.data.objective } : {}),
        ...(parsed.data.tone ? { tone: parsed.data.tone } : {}),
        ...(parsed.data.targetAudience ? { targetAudience: parsed.data.targetAudience } : {}),
      };
      const result = await prisma.contentItem.updateMany({
        where: { id, ...request.tenant },
        data,
      });
      if (result.count === 0) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
      const item = await prisma.contentItem.findFirstOrThrow({
        where: { id, ...request.tenant },
      });
      response.json({ data: item });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/:id/archive",
    requirePermission(access, "content.delete"),
    async (request, response, next) => {
      try {
        if (!request.tenant) throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
        const id = getContentId(request.params.id);
        const result = await prisma.contentItem.updateMany({
          where: { id, ...request.tenant },
          data: { status: "ARCHIVED", archivedAt: new Date() },
        });
        if (result.count === 0) throw new HttpError(404, "CONTENT_NOT_FOUND", "Contenu introuvable.");
        response.json({ data: { archived: true } });
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
        const duplicate = await prisma.contentItem.create({
          data: {
            ...request.tenant,
            authorId: request.currentUser.id,
            sourceVariantId: source.sourceVariantId,
            type: source.type,
            platform: source.platform,
            title: `${source.title} — copie`,
            body: source.body,
            status: "DRAFT",
            objective: source.objective,
            tone: source.tone,
            targetAudience: source.targetAudience,
          },
        });
        response.status(201).json({ data: duplicate });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
