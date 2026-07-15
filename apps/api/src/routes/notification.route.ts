import type { PrismaClient } from "@prisma/client";
import type { ServerEnv } from "@flowpilot/config";
import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { createTenantMiddleware } from "../middleware/resolve-tenant.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { requirePermission } from "../middleware/require-permission.js";
import { AccessControlService } from "../modules/access-control/access-control.service.js";
import { PrismaPermissionRepository } from "../modules/access-control/prisma-permission.repository.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";

export function createNotificationRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  const access = new AccessControlService(new PrismaPermissionRepository(prisma));
  router.use(
    createAuthMiddleware(env),
    createUserSyncMiddleware(new UserSyncService(prisma)),
    createTenantMiddleware(prisma),
    requirePermission(access, "notification.read"),
  );
  router.get("/", async (req, res, next) => {
    try {
      const items = await prisma.notification.findMany({
        where: { ...req.tenant!, recipientId: req.currentUser!.id },
        include: {
          actor: { select: { id: true, fullName: true } },
          content: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      res.json({ data: { items, unread: items.filter((item) => !item.readAt).length } });
    } catch (e) {
      next(e);
    }
  });
  router.post("/read-all", async (req, res, next) => {
    try {
      await prisma.notification.updateMany({
        where: { ...req.tenant!, recipientId: req.currentUser!.id, readAt: null },
        data: { readAt: new Date() },
      });
      res.json({ data: { read: true } });
    } catch (e) {
      next(e);
    }
  });
  router.post("/:id/read", async (req, res, next) => {
    try {
      const parsed = z.string().uuid().safeParse(req.params.id);
      if (!parsed.success) throw new HttpError(400, "NOTIFICATION_ID_INVALID", "Identifiant invalide.");
      const result = await prisma.notification.updateMany({
        where: { id: parsed.data, ...req.tenant!, recipientId: req.currentUser!.id },
        data: { readAt: new Date() },
      });
      if (!result.count) throw new HttpError(404, "NOTIFICATION_NOT_FOUND", "Notification introuvable.");
      res.json({ data: { read: true } });
    } catch (e) {
      next(e);
    }
  });
  return router;
}
