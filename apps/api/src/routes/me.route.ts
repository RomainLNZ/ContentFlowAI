import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { ServerEnv } from "@flowpilot/config";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";
import { HttpError } from "../lib/http-error.js";

export function createMeRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  router.use(createAuthMiddleware(env), createUserSyncMiddleware(new UserSyncService(prisma)));

  router.get("/", async (request, response, next) => {
    try {
      if (!request.currentUser) throw new HttpError(401, "AUTH_REQUIRED", "Authentification requise.");
      const memberships = await prisma.organizationMembership.findMany({
        where: { userId: request.currentUser.id, status: "ACTIVE", organization: { archivedAt: null } },
        select: {
          role: { select: { key: true, name: true } },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              workspaces: {
                where: {
                  archivedAt: null,
                  memberships: { some: { userId: request.currentUser.id, status: "ACTIVE" } },
                },
                select: { id: true, name: true, slug: true, isDefault: true },
                orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
              },
            },
          },
        },
      });

      response.json({
        data: {
          user: {
            id: request.currentUser.id,
            supabaseAuthId: request.currentUser.supabaseAuthId,
            email: request.currentUser.email,
            fullName: request.currentUser.fullName,
            onboardingDone: request.currentUser.onboardingDone,
          },
          memberships,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
