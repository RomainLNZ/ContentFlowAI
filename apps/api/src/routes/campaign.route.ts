import type { PrismaClient } from "@prisma/client";
import type { ServerEnv } from "@flowpilot/config";
import { Router } from "express";
import { HttpError } from "../lib/http-error.js";
import { createAuthMiddleware } from "../middleware/authenticate.js";
import { createUserSyncMiddleware } from "../middleware/sync-user.js";
import { createTenantMiddleware } from "../middleware/resolve-tenant.js";
import { requirePermission } from "../middleware/require-permission.js";
import { UserSyncService } from "../modules/users/user-sync.service.js";
import { AccessControlService } from "../modules/access-control/access-control.service.js";
import { PrismaPermissionRepository } from "../modules/access-control/prisma-permission.repository.js";
import { CampaignService } from "../modules/campaign/campaign.service.js";
import {
  createCampaignSchema,
  listCampaignSchema,
  updateCampaignSchema,
} from "../modules/campaign/campaign.schema.js";

const id = (value: unknown) => {
  const parsed = z.string().uuid().safeParse(value);
  if (!parsed.success) throw new HttpError(400, "CAMPAIGN_ID_INVALID", "Identifiant invalide.");
  return parsed.data;
};
import { z } from "zod";

export function createCampaignRouter(env: ServerEnv, prisma: PrismaClient) {
  const router = Router();
  const access = new AccessControlService(new PrismaPermissionRepository(prisma));
  const service = new CampaignService(prisma);
  router.use(
    createAuthMiddleware(env),
    createUserSyncMiddleware(new UserSyncService(prisma)),
    createTenantMiddleware(prisma),
  );
  router.get("/", requirePermission(access, "campaign.read"), async (req, res, next) => {
    try {
      const parsed = listCampaignSchema.safeParse(req.query);
      if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Filtres invalides.");
      res.json({ data: await service.list(req.tenant!, parsed.data) });
    } catch (e) {
      next(e);
    }
  });
  router.post("/", requirePermission(access, "campaign.create"), async (req, res, next) => {
    try {
      const parsed = createCampaignSchema.safeParse(req.body);
      if (!parsed.success)
        throw new HttpError(422, "VALIDATION_ERROR", "Campagne invalide.", parsed.error.flatten());
      res.status(201).json({ data: await service.create(req.tenant!, req.currentUser!.id, parsed.data) });
    } catch (e) {
      next(e);
    }
  });
  router.get("/:id", requirePermission(access, "campaign.read"), async (req, res, next) => {
    try {
      res.json({ data: await service.get(req.tenant!, id(req.params.id)) });
    } catch (e) {
      next(e);
    }
  });
  router.put("/:id", requirePermission(access, "campaign.update"), async (req, res, next) => {
    try {
      const parsed = updateCampaignSchema.safeParse(req.body);
      if (!parsed.success)
        throw new HttpError(422, "VALIDATION_ERROR", "Campagne invalide.", parsed.error.flatten());
      res.json({
        data: await service.update(req.tenant!, req.currentUser!.id, id(req.params.id), parsed.data),
      });
    } catch (e) {
      next(e);
    }
  });
  router.post("/:id/archive", requirePermission(access, "campaign.archive"), async (req, res, next) => {
    try {
      res.json({ data: await service.archive(req.tenant!, req.currentUser!.id, id(req.params.id)) });
    } catch (e) {
      next(e);
    }
  });
  return router;
}
