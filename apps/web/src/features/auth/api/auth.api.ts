import { supabase } from "@/lib/supabase";
import type { ForgotPasswordValues, SignInValues, SignUpValues } from "../schemas/auth.schema";
import { isSupabaseConfigured } from "@/lib/env";

function requireSupabaseConfiguration() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase Auth n’est pas configuré pour cet environnement.");
  }
}

export async function signIn(values: SignInValues) {
  requireSupabaseConfiguration();
  const { error } = await supabase.auth.signInWithPassword(values);
  if (error) throw error;
}

export async function signUp(values: SignUpValues) {
  requireSupabaseConfiguration();
  const { error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { full_name: values.fullName, organization_name: values.organizationName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function requestPasswordReset({ email }: ForgotPasswordValues) {
  requireSupabaseConfiguration();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}
