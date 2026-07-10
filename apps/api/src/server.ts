import dotenv from "dotenv";
import { parseServerEnv } from "@communicationos/config";
import { createApp } from "./app.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });
const env = parseServerEnv(process.env);
const app = createApp(env);
const server = app.listen(env.PORT, () => {
  console.info(`CommunicationOS API listening on http://localhost:${env.PORT}`);
});

const shutdown = (signal: string) => {
  console.info(`${signal} received, closing HTTP server`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
