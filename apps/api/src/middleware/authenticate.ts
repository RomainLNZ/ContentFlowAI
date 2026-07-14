import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { ServerEnv } from "@flowpilot/config";
import { HttpError } from "../lib/http-error.js";

export function createAuthMiddleware(env: ServerEnv) {
  const issuer = `${env.SUPABASE_URL}/auth/v1`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

  return async function authenticate(request: Request, _response: Response, next: NextFunction) {
    try {
      const authorization = request.header("authorization");
      const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
      if (!token) throw new HttpError(401, "AUTH_TOKEN_MISSING", "Authentification requise.");

      const { payload } = await jwtVerify(token, jwks, { issuer, audience: "authenticated" });
      if (!payload.sub) throw new HttpError(401, "AUTH_TOKEN_INVALID", "Jeton invalide.");

      const userMetadata =
        payload.user_metadata && typeof payload.user_metadata === "object"
          ? (payload.user_metadata as Record<string, unknown>)
          : undefined;
      const fullName = userMetadata?.full_name;
      request.auth = {
        supabaseUserId: payload.sub,
        ...(typeof payload.email === "string" ? { email: payload.email } : {}),
        ...(typeof fullName === "string" ? { fullName } : {}),
      };
      next();
    } catch (error) {
      next(
        error instanceof HttpError
          ? error
          : new HttpError(401, "AUTH_TOKEN_INVALID", "Jeton invalide ou expiré."),
      );
    }
  };
}
