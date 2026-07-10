import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { ServerEnv } from "@communicationos/config";
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

      request.auth = {
        userId: payload.sub,
        ...(typeof payload.email === "string" ? { email: payload.email } : {}),
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
