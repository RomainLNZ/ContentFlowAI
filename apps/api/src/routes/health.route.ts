import { Router } from "express";
import type { HealthStatus } from "@flowpilot/types";

export function createHealthRouter(version: string) {
  const router = Router();
  router.get("/", (_request, response) => {
    const health: HealthStatus = {
      status: "ok",
      service: "flowpilot-api",
      version,
      timestamp: new Date().toISOString(),
    };
    response.json({ data: health });
  });
  return router;
}
