import { supabase } from "@/lib/supabase";
import type { ForgotPasswordValues, SignInValues, SignUpValues } from "../schemas/auth.schema";
import { isSupabaseConfigured } from "@/lib/env";

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 850));

export async function signIn(values: SignInValues) {
  if (!isSupabaseConfigured) { await mockDelay(); localStorage.setItem("cos-demo-session", "true"); return; }
  const { error } = await supabase.auth.signInWithPassword(values);
  if (error) throw error;
}

export async function signUp(values: SignUpValues) {
  if (!isSupabaseConfigured) { await mockDelay(); return; }
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
  if (!isSupabaseConfigured) { await mockDelay(); return; }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}
