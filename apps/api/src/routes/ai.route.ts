import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { ServerEnv } from "@flowpilot/config";
import { AiCoreError } from "@flowpilot/ai";
import { HttpError } from "../lib/http-error.js";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { createTenantMiddleware } from "../middleware/resolve-tenant.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { requirePermission } from "../middleware/require-permission.js";
import { AccessControlService } from "../modules/access-control/access-control.service.js";
import { PrismaPermissionRepository } from "../modules/access-control/prisma-permission.repository.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";
import { LinkedInGenerationService } from "../modules/ai/linkedin-generation.service.js";
import { linkedInGenerationRequestSchema } from "../modules/ai/linkedin-generation.schema.js";

export function createAiRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  const service = new LinkedInGenerationService(prisma, {
    ...(env.OPENAI_API_KEY ? { apiKey: env.OPENAI_API_KEY } : {}),
    model: env.OPENAI_MODEL,
    timeoutMs: env.OPENAI_TIMEOUT_MS,
  });
  const accessControl = new AccessControlService(new PrismaPermissionRepository(prisma));

  router.use(createAuthMiddleware(env), createUserSyncMiddleware(new UserSyncService(prisma)));
  router.get("/status", (_request, response) => {
    response.json({
      data: {
        provider: "openai",
        configured: service.isConfigured(),
        model: env.OPENAI_MODEL,
      },
    });
  });

  router.post(
    "/generate/linkedin",
    createTenantMiddleware(prisma),
    requirePermission(accessControl, "ai.use"),
    async (request, response, next) => {
      try {
        if (!request.currentUser || !request.tenant) {
          throw new HttpError(401, "AUTH_REQUIRED", "Authentification requise.");
        }
        const parsed = linkedInGenerationRequestSchema.safeParse(request.body);
        if (!parsed.success) {
          throw new HttpError(
            422,
            "VALIDATION_ERROR",
            "Brief de génération invalide.",
            parsed.error.flatten(),
          );
        }
        const result = await service.generate(
          {
            ...request.tenant,
            userId: request.currentUser.id,
            correlationId: String(request.id),
            locale: request.currentUser.locale,
          },
          parsed.data,
        );
        response.status(201).json({ data: result });
      } catch (error) {
        if (error instanceof AiCoreError) {
          const status =
            error.code === "PROVIDER_UNAVAILABLE"
              ? 503
              : error.code === "PROVIDER_TIMEOUT"
                ? 504
                : error.code === "GUARDRAIL_REJECTED"
                  ? 422
                  : 502;
          next(new HttpError(status, error.code, error.message));
          return;
        }
        next(error);
      }
    },
  );

  return router;
}
