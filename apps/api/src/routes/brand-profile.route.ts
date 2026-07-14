import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import type { ServerEnv } from "@flowpilot/config";
import { HttpError } from "../lib/http-error.js";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/require-permission.js";
import { createTenantMiddleware } from "../middleware/resolve-tenant.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { AccessControlService } from "../modules/access-control/access-control.service.js";
import { PrismaPermissionRepository } from "../modules/access-control/prisma-permission.repository.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";

const updateSchema = z.object({
  productsServices: z.array(z.string().trim().min(1).max(160)).max(20),
  targetAudiences: z.array(z.string().trim().min(1).max(160)).max(20),
  formalityLevel: z.enum(["CASUAL", "BALANCED", "FORMAL"]),
  emojiUsage: z.enum(["NONE", "LIGHT", "MODERATE"]),
});

export function createBrandProfileRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  const access = new AccessControlService(new PrismaPermissionRepository(prisma));
  router.use(
    createAuthMiddleware(env),
    createUserSyncMiddleware(new UserSyncService(prisma)),
    createTenantMiddleware(prisma),
  );

  router.get("/", requirePermission(access, "organization.read"), async (request, response, next) => {
    try {
      if (!request.tenant) throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
      const profile = await prisma.brandProfile.findFirst({ where: request.tenant });
      if (!profile) throw new HttpError(404, "BRAND_PROFILE_NOT_FOUND", "Profil de marque introuvable.");
      response.json({ data: profile });
    } catch (error) {
      next(error);
    }
  });

  router.put("/", requirePermission(access, "organization.update"), async (request, response, next) => {
    try {
      if (!request.tenant) throw new HttpError(400, "TENANT_CONTEXT_REQUIRED", "Contexte requis.");
      const parsed = updateSchema.safeParse(request.body);
      if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Profil de marque invalide.");
      const result = await prisma.brandProfile.updateMany({ where: request.tenant, data: parsed.data });
      if (result.count === 0)
        throw new HttpError(404, "BRAND_PROFILE_NOT_FOUND", "Profil de marque introuvable.");
      response.json({ data: await prisma.brandProfile.findFirstOrThrow({ where: request.tenant }) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
