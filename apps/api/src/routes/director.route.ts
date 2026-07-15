import type { PrismaClient } from "@prisma/client";
import type { ServerEnv } from "@flowpilot/config";
import { Router, type Request, type RequestHandler } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/require-permission.js";
import { createTenantMiddleware } from "../middleware/resolve-tenant.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { AccessControlService } from "../modules/access-control/access-control.service.js";
import { PrismaPermissionRepository } from "../modules/access-control/prisma-permission.repository.js";
import { ContentCreationService } from "../modules/content/content-creation.service.js";
import {
  completeRecommendationSchema,
  createDraftFromRecommendationSchema,
  directorPreferenceSchema,
  dismissRecommendationSchema,
  feedbackSchema,
  recommendationListSchema,
} from "../modules/director/director-api.schema.js";
import { DirectorAnalysisService } from "../modules/director/director-analysis.service.js";
import { createDirectorOrchestrator } from "../modules/director/director.factory.js";
import { DirectorPreferenceService } from "../modules/director/director-preference.service.js";
import { DirectorRecommendationPersistenceService } from "../modules/director/director-recommendation.persistence.js";
import { DirectorRecommendationService } from "../modules/director/director-recommendation.service.js";
import { FeatureFlagService } from "../modules/feature-flags/feature-flag.service.js";
import { PrismaFeatureFlagRepository } from "../modules/feature-flags/prisma-feature-flag.repository.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";
import { WorkspaceIntelligenceService } from "../modules/workspace-intelligence/workspace-intelligence.service.js";

const idSchema = z.string().uuid();

export function createDirectorRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  const access = new AccessControlService(new PrismaPermissionRepository(prisma));
  const featureFlags = new FeatureFlagService(new PrismaFeatureFlagRepository(prisma));
  const intelligence = new WorkspaceIntelligenceService(prisma);
  const providerId = env.OPENAI_API_KEY ? "openai" : "mock";
  const director = createDirectorOrchestrator({
    ...(env.OPENAI_API_KEY ? { openAiApiKey: env.OPENAI_API_KEY } : {}),
    model: env.OPENAI_MODEL,
    timeoutMs: env.OPENAI_TIMEOUT_MS,
  });
  const persistence = new DirectorRecommendationPersistenceService(prisma);
  const analysis = new DirectorAnalysisService(
    prisma,
    featureFlags,
    intelligence,
    director,
    persistence,
    providerId,
    env.OPENAI_MODEL,
  );
  const recommendations = new DirectorRecommendationService(
    prisma,
    intelligence,
    new ContentCreationService(prisma),
    providerId,
  );
  const preferences = new DirectorPreferenceService(prisma);

  router.use(
    createAuthMiddleware(env),
    createUserSyncMiddleware(new UserSyncService(prisma)),
    createTenantMiddleware(prisma),
  );

  router.get("/overview", requirePermission(access, "director.read"), async (req, res, next) => {
    try {
      res.json({ data: await recommendations.overview(req.tenant!) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/analyses", requirePermission(access, "director.run"), async (req, res, next) => {
    try {
      const result = await analysis.runManual(req.tenant!, req.currentUser!.id);
      res.status(result.reused ? 200 : 201).json({ data: result });
    } catch (error) {
      next(error);
    }
  });

  router.get("/analyses/:id", requirePermission(access, "director.read"), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      const item = await recommendations.getAnalysis(req.tenant!, id);
      if (!item) throw new HttpError(404, "DIRECTOR_ANALYSIS_NOT_FOUND", "Analyse introuvable.");
      res.json({ data: item });
    } catch (error) {
      next(error);
    }
  });

  router.get("/recommendations", requirePermission(access, "director.read"), async (req, res, next) => {
    try {
      const parsed = recommendationListSchema.safeParse(req.query);
      if (!parsed.success) throw validationError(parsed.error);
      res.json({ data: await recommendations.list(req.tenant!, parsed.data) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/recommendations/:id", requirePermission(access, "director.read"), async (req, res, next) => {
    try {
      res.json({ data: await recommendations.get(req.tenant!, parseId(req.params.id)) });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/recommendations/:id/view",
    requirePermission(access, "director.read"),
    actionHandler((req) => recommendations.view(req.tenant!, req.currentUser!.id, parseId(req.params.id))),
  );
  router.post(
    "/recommendations/:id/accept",
    requirePermission(access, "director.act"),
    actionHandler((req) => recommendations.accept(req.tenant!, req.currentUser!.id, parseId(req.params.id))),
  );
  router.post(
    "/recommendations/:id/dismiss",
    requirePermission(access, "director.act"),
    async (req, res, next) => {
      try {
        const parsed = dismissRecommendationSchema.safeParse(req.body);
        if (!parsed.success) throw validationError(parsed.error);
        res.json({
          data: await recommendations.dismiss(
            req.tenant!,
            req.currentUser!.id,
            parseId(req.params.id),
            parsed.data.reason,
            parsed.data.comment,
          ),
        });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    "/recommendations/:id/complete",
    requirePermission(access, "director.manage"),
    async (req, res, next) => {
      try {
        const parsed = completeRecommendationSchema.safeParse(req.body);
        if (!parsed.success) throw validationError(parsed.error);
        res.json({
          data: await recommendations.complete(req.tenant!, req.currentUser!.id, parseId(req.params.id)),
        });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    "/recommendations/:id/feedback",
    requirePermission(access, "director.read"),
    async (req, res, next) => {
      try {
        const parsed = feedbackSchema.safeParse(req.body);
        if (!parsed.success) throw validationError(parsed.error);
        res.json({
          data: await recommendations.feedback(
            req.tenant!,
            req.currentUser!.id,
            parseId(req.params.id),
            parsed.data,
          ),
        });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    "/recommendations/:id/prepare-draft",
    requirePermission(access, "director.act"),
    async (req, res, next) => {
      try {
        res.json({ data: await recommendations.prepareDraft(req.tenant!, parseId(req.params.id)) });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    "/recommendations/:id/create-draft",
    requirePermission(access, "director.act"),
    requirePermission(access, "content.create"),
    async (req, res, next) => {
      try {
        const parsed = createDraftFromRecommendationSchema.safeParse(req.body);
        if (!parsed.success) throw validationError(parsed.error);
        const input = {
          title: parsed.data.title,
          body: parsed.data.body,
          hashtags: parsed.data.hashtags,
          ...(parsed.data.cta !== undefined ? { cta: parsed.data.cta } : {}),
          ...(parsed.data.tone !== undefined ? { tone: parsed.data.tone } : {}),
          ...(parsed.data.targetAudience !== undefined ? { targetAudience: parsed.data.targetAudience } : {}),
        };
        const result = await recommendations.createDraft(
          req.tenant!,
          req.currentUser!.id,
          parseId(req.params.id),
          input,
        );
        res.status(result.reused ? 200 : 201).json({ data: result });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get("/preferences", requirePermission(access, "director.read"), async (req, res, next) => {
    try {
      res.json({ data: await preferences.get(req.tenant!) });
    } catch (error) {
      next(error);
    }
  });
  router.put("/preferences", requirePermission(access, "director.configure"), async (req, res, next) => {
    try {
      const parsed = directorPreferenceSchema.safeParse(req.body);
      if (!parsed.success) throw validationError(parsed.error);
      res.json({ data: await preferences.update(req.tenant!, req.currentUser!.id, parsed.data) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function parseId(value: string | string[] | undefined) {
  const parsed = idSchema.safeParse(value);
  if (!parsed.success) throw new HttpError(400, "DIRECTOR_ID_INVALID", "Identifiant invalide.");
  return parsed.data;
}

function validationError(error: z.ZodError) {
  return new HttpError(422, "VALIDATION_ERROR", "Données Director invalides.", error.flatten());
}

function actionHandler(handler: (request: Request) => Promise<unknown>): RequestHandler {
  return async (req, res, next) => {
    try {
      res.json({ data: await handler(req) });
    } catch (error) {
      next(error);
    }
  };
}
