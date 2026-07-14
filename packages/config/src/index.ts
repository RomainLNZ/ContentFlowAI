import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(10).optional(),
);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  APP_VERSION: z.string().default("0.1.0"),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  OPENAI_API_KEY: optionalSecret,
  OPENAI_MODEL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).default("gpt-5.1"),
  ),
  OPENAI_TIMEOUT_MS: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(1_000).max(120_000).default(30_000),
  ),
  RESEND_API_KEY: optionalSecret,
  STRIPE_SECRET_KEY: optionalSecret,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export const parseServerEnv = (environment: NodeJS.ProcessEnv): ServerEnv =>
  serverEnvSchema.parse(environment);
