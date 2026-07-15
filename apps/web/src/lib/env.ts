import { z } from "zod";

const apiEnvSchema = z.object({
  VITE_API_URL: z.string().url(),
});

const supabaseEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20),
});

const apiParsed = apiEnvSchema.safeParse(import.meta.env);
const supabaseParsed = supabaseEnvSchema.safeParse(import.meta.env);

export const env = {
  VITE_API_URL: apiParsed.success ? apiParsed.data.VITE_API_URL : "http://localhost:3001/api",
  VITE_SUPABASE_URL: supabaseParsed.success
    ? supabaseParsed.data.VITE_SUPABASE_URL
    : "http://127.0.0.1:54321",
  VITE_SUPABASE_ANON_KEY: supabaseParsed.success
    ? supabaseParsed.data.VITE_SUPABASE_ANON_KEY
    : "development-placeholder-anon-key",
};

export const isSupabaseConfigured = supabaseParsed.success;
