import type { NextFunction, Request, Response } from "express";
import type { UserSyncService } from "../modules/users/user-sync.service.js";
import { HttpError } from "../lib/http-error.js";

export function createUserSyncMiddleware(service: UserSyncService) {
  return async function syncUser(request: Request, _response: Response, next: NextFunction) {
    try {
      if (!request.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentification requise.");
      request.currentUser = await service.sync({
        supabaseAuthId: request.auth.supabaseUserId,
        ...(request.auth.email ? { email: request.auth.email } : {}),
        ...(request.auth.fullName ? { fullName: request.auth.fullName } : {}),
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}
