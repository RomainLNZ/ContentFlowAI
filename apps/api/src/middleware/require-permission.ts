import type { NextFunction, Request, Response } from "express";
import type { AccessControlService } from "../modules/access-control/access-control.service.js";
import { HttpError } from "../lib/http-error.js";

export function requirePermission(service: AccessControlService, permissionKey: string) {
  return async function checkPermission(request: Request, _response: Response, next: NextFunction) {
    try {
      if (!request.currentUser || !request.tenant) {
        throw new HttpError(401, "AUTH_REQUIRED", "Authentification requise.");
      }
      await service.require(
        {
          userId: request.currentUser.id,
          organizationId: request.tenant.organizationId,
          workspaceId: request.tenant.workspaceId,
        },
        permissionKey,
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}
