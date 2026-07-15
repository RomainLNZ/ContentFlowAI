import type { PrismaClient } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";

const uuid = z.string().uuid();

export function createTenantMiddleware(prisma: PrismaClient) {
  return async function resolveTenant(request: Request, _response: Response, next: NextFunction) {
    try {
      if (!request.currentUser) throw new HttpError(401, "AUTH_REQUIRED", "Authentification requise.");

      const organizationId = uuid.safeParse(request.header("x-organization-id"));
      const workspaceId = uuid.safeParse(request.header("x-workspace-id"));
      if (!organizationId.success || !workspaceId.success) {
        throw new HttpError(
          400,
          "TENANT_CONTEXT_REQUIRED",
          "Les identifiants d’organisation et de workspace sont requis.",
        );
      }

      const membership = await prisma.organizationMembership.findFirst({
        where: {
          organizationId: organizationId.data,
          userId: request.currentUser.id,
          status: "ACTIVE",
          organization: { archivedAt: null },
        },
        select: { organizationId: true },
      });
      if (!membership) {
        throw new HttpError(403, "TENANT_ACCESS_DENIED", "Accès refusé à cette organisation.");
      }

      const workspaceMembership = await prisma.workspaceMembership.findFirst({
        where: {
          workspaceId: workspaceId.data,
          userId: request.currentUser.id,
          status: "ACTIVE",
          workspace: { organizationId: organizationId.data, archivedAt: null },
        },
        select: { workspaceId: true },
      });
      if (!workspaceMembership) {
        throw new HttpError(403, "TENANT_ACCESS_DENIED", "Workspace invalide pour cette organisation.");
      }

      request.tenant = { organizationId: organizationId.data, workspaceId: workspaceMembership.workspaceId };
      next();
    } catch (error) {
      next(error);
    }
  };
}
