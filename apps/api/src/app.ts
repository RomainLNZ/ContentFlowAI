import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { ServerEnv } from "@flowpilot/config";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { createHealthRouter } from "./routes/health.route.js";
import { createMeRouter } from "./routes/me.route.js";
import { createOnboardingRouter } from "./routes/onboarding.route.js";
import { createAiRouter } from "./routes/ai.route.js";
import { createContentRouter } from "./routes/content.route.js";
import { createBrandProfileRouter } from "./routes/brand-profile.route.js";
import { createCampaignRouter } from "./routes/campaign.route.js";
import { createCommentRouter } from "./routes/comment.route.js";
import { createCalendarRouter } from "./routes/calendar.route.js";
import { createWorkspaceMemberRouter } from "./routes/workspace-member.route.js";
import { createNotificationRouter } from "./routes/notification.route.js";
import { prisma } from "./lib/prisma.js";

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
  app.use("/api/v1/me", createMeRouter(env, prisma));
  app.use("/api/v1/onboarding", createOnboardingRouter(env, prisma));
  app.use("/api/v1/ai", createAiRouter(env, prisma));
  app.use("/api/v1/content", createContentRouter(env, prisma));
  app.use("/api/v1/content/:id/comments", createCommentRouter(env, prisma));
  app.use("/api/v1/campaigns", createCampaignRouter(env, prisma));
  app.use("/api/v1/calendar", createCalendarRouter(env, prisma));
  app.use("/api/v1/workspace-members", createWorkspaceMemberRouter(env, prisma));
  app.use("/api/v1/notifications", createNotificationRouter(env, prisma));
  app.use("/api/v1/brand-profile", createBrandProfileRouter(env, prisma));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
