import type { PrismaClient } from "@prisma/client";
import type { ServerEnv } from "@flowpilot/config";
import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { createTenantMiddleware } from "../middleware/resolve-tenant.js";
import { requirePermission } from "../middleware/require-permission.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";
import { AccessControlService } from "../modules/access-control/access-control.service.js";
import { PrismaPermissionRepository } from "../modules/access-control/prisma-permission.repository.js";
import { CommentService } from "../modules/comment/comment.service.js";
import { commentBodySchema, updateCommentSchema } from "../modules/comment/comment.schema.js";

const uuid = (value: unknown) => {
  const parsed = z.string().uuid().safeParse(value);
  if (!parsed.success) throw new HttpError(400, "ID_INVALID", "Identifiant invalide.");
  return parsed.data;
};

export function createCommentRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router({ mergeParams: true });
  const access = new AccessControlService(new PrismaPermissionRepository(prisma));
  const service = new CommentService(prisma);
  router.use(
    createAuthMiddleware(env),
    createUserSyncMiddleware(new UserSyncService(prisma)),
    createTenantMiddleware(prisma),
  );
  router.get("/", requirePermission(access, "comment.read"), async (req, res, next) => {
    try {
      res.json({ data: await service.list(req.tenant!, uuid(req.params.id)) });
    } catch (e) {
      next(e);
    }
  });
  router.post("/", requirePermission(access, "comment.create"), async (req, res, next) => {
    try {
      const parsed = commentBodySchema.safeParse(req.body);
      if (!parsed.success)
        throw new HttpError(422, "VALIDATION_ERROR", "Commentaire invalide.", parsed.error.flatten());
      res.status(201).json({
        data: await service.create(
          req.tenant!,
          req.currentUser!.id,
          uuid(req.params.id),
          parsed.data.body,
          parsed.data.mentionedUserIds,
        ),
      });
    } catch (e) {
      next(e);
    }
  });
  router.put("/:commentId", requirePermission(access, "comment.update"), async (req, res, next) => {
    try {
      const parsed = updateCommentSchema.safeParse(req.body);
      if (!parsed.success)
        throw new HttpError(422, "VALIDATION_ERROR", "Commentaire invalide.", parsed.error.flatten());
      res.json({
        data: await service.update(
          req.tenant!,
          req.currentUser!.id,
          uuid(req.params.id),
          uuid(req.params.commentId),
          parsed.data.body,
        ),
      });
    } catch (e) {
      next(e);
    }
  });
  router.delete("/:commentId", requirePermission(access, "comment.update"), async (req, res, next) => {
    try {
      const canDeleteAny = await access.can(
        { userId: req.currentUser!.id, ...req.tenant! },
        "comment.delete",
      );
      res.json({
        data: await service.remove(
          req.tenant!,
          req.currentUser!.id,
          uuid(req.params.id),
          uuid(req.params.commentId),
          canDeleteAny,
        ),
      });
    } catch (e) {
      next(e);
    }
  });
  return router;
}
