import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20),
});

const parsed = envSchema.safeParse(import.meta.env);

export const env = parsed.success
  ? parsed.data
  : {
      VITE_API_URL: "http://localhost:3001/api",
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_ANON_KEY: "development-placeholder-anon-key",
    };

export const isSupabaseConfigured = parsed.success;
