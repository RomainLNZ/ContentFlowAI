import dotenv from "dotenv";
import { parseServerEnv } from "@flowpilot/config";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });
const env = parseServerEnv(process.env);
const app = createApp(env);
const server = app.listen(env.PORT, () => {
  console.info(`FlowPilot API listening on http://localhost:${env.PORT}`);
});

const shutdown = (signal: string) => {
  console.info(`${signal} received, closing HTTP server`);
  server.close(async (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
