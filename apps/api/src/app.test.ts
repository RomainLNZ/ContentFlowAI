import request from "supertest";
import { describe, expect, it } from "vitest";
import type { ServerEnv } from "@communicationos/config";
import { createApp } from "./app.js";

const testEnv: ServerEnv = {
  NODE_ENV: "test",
  PORT: 3001,
  APP_VERSION: "test",
  WEB_ORIGIN: "http://localhost:5173",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key-that-is-long-enough",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-that-is-long-enough",
};

describe("API", () => {
  it("expose un endpoint de santé versionné", async () => {
    const response = await request(createApp(testEnv)).get("/api/health").expect(200);
    expect(response.body.data).toMatchObject({
      status: "ok",
      service: "communicationos-api",
      version: "test",
    });
  });

  it("retourne une erreur structurée sur une route inconnue", async () => {
    const response = await request(createApp(testEnv)).get("/api/inconnue").expect(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
