import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, "ROUTE_NOT_FOUND", `Route inconnue : ${request.method} ${request.path}`));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  void _next;
  const httpError =
    error instanceof HttpError
      ? error
      : new HttpError(500, "INTERNAL_ERROR", "Une erreur interne est survenue.");
  if (httpError.status >= 500) request.log?.error({ err: error }, "Unhandled API error");

  response.status(httpError.status).json({
    error: {
      code: httpError.code,
      message: httpError.message,
      ...(httpError.details === undefined ? {} : { details: httpError.details }),
    },
    requestId: request.id,
  });
};
