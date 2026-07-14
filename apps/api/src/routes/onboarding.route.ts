import type { Prisma, PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { ServerEnv } from "@flowpilot/config";
import { HttpError } from "../lib/http-error.js";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";
import { completeOnboardingSchema, saveOnboardingSchema } from "../modules/onboarding/onboarding.schema.js";
import { OnboardingService } from "../modules/onboarding/onboarding.service.js";

export function createOnboardingRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  const service = new OnboardingService(prisma);
  router.use(createAuthMiddleware(env), createUserSyncMiddleware(new UserSyncService(prisma)));

  router.get("/", async (request, response, next) => {
    try {
      if (!request.currentUser) throw new HttpError(401, "AUTH_REQUIRED", "Authentification requise.");
      response.json({ data: await service.getProgress(request.currentUser.id) });
    } catch (error) {
      next(error);
    }
  });

  router.put("/", async (request, response, next) => {
    try {
      if (!request.currentUser) throw new HttpError(401, "AUTH_REQUIRED", "Authentification requise.");
      const parsed = saveOnboardingSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          "Progression d’onboarding invalide.",
          parsed.error.flatten(),
        );
      }
      response.json({
        data: await service.saveProgress(
          request.currentUser.id,
          parsed.data.currentStep,
          parsed.data.draft as Prisma.InputJsonValue,
        ),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/complete", async (request, response, next) => {
    try {
      if (!request.currentUser) throw new HttpError(401, "AUTH_REQUIRED", "Authentification requise.");
      const parsed = completeOnboardingSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          "Données d’onboarding invalides.",
          parsed.error.flatten(),
        );
      }
      response.status(201).json({ data: await service.complete(request.currentUser.id, parsed.data) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
