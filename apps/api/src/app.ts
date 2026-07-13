import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { ServerEnv } from "@flowpilot/config";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { createHealthRouter } from "./routes/health.route.js";

export function createApp(env: ServerEnv) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(pinoHttp({ quietReqLogger: env.NODE_ENV === "test" }));
  app.use(helmet());
  app.use(
    cors({ origin: env.WEB_ORIGIN, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/health", createHealthRouter(env.APP_VERSION));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
