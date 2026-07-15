import type { PrismaClient } from "@prisma/client";
import type { ServerEnv } from "@flowpilot/config";
import { Router } from "express";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { createTenantMiddleware } from "../middleware/resolve-tenant.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { requirePermission } from "../middleware/require-permission.js";
import { AccessControlService } from "../modules/access-control/access-control.service.js";
import { PrismaPermissionRepository } from "../modules/access-control/prisma-permission.repository.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";

export function createWorkspaceMemberRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  const access = new AccessControlService(new PrismaPermissionRepository(prisma));
  router.use(
    createAuthMiddleware(env),
    createUserSyncMiddleware(new UserSyncService(prisma)),
    createTenantMiddleware(prisma),
  );
  router.get("/", requirePermission(access, "member.read"), async (req, res, next) => {
    try {
      const memberships = await prisma.workspaceMembership.findMany({
        where: {
          workspaceId: req.tenant!.workspaceId,
          status: "ACTIVE",
          workspace: { organizationId: req.tenant!.organizationId },
        },
        select: {
          user: { select: { id: true, fullName: true, email: true, avatarPath: true } },
          role: { select: { key: true, name: true } },
        },
        orderBy: { user: { fullName: "asc" } },
      });
      res.json({ data: memberships });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
