import type { PrismaClient } from "@prisma/client";
import type { ServerEnv } from "@flowpilot/config";
import { Router } from "express";
import { HttpError } from "../lib/http-error.js";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { createTenantMiddleware } from "../middleware/resolve-tenant.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { requirePermission } from "../middleware/require-permission.js";
import { AccessControlService } from "../modules/access-control/access-control.service.js";
import { PrismaPermissionRepository } from "../modules/access-control/prisma-permission.repository.js";
import { CalendarService } from "../modules/calendar/calendar.service.js";
import { calendarQuerySchema } from "../modules/calendar/calendar.schema.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";

export function createCalendarRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  const access = new AccessControlService(new PrismaPermissionRepository(prisma));
  const service = new CalendarService(prisma);
  router.use(
    createAuthMiddleware(env),
    createUserSyncMiddleware(new UserSyncService(prisma)),
    createTenantMiddleware(prisma),
  );
  router.get("/", requirePermission(access, "calendar.read"), async (req, res, next) => {
    try {
      const parsed = calendarQuerySchema.safeParse(req.query);
      if (!parsed.success)
        throw new HttpError(422, "VALIDATION_ERROR", "Filtres calendrier invalides.", parsed.error.flatten());
      res.json({
        data: {
          items: await service.list(req.tenant!, parsed.data),
          from: parsed.data.from,
          to: parsed.data.to,
        },
      });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
