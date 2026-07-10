import { supabase } from "@/lib/supabase";
import type { ForgotPasswordValues, SignInValues, SignUpValues } from "../schemas/auth.schema";

export async function signIn(values: SignInValues) {
  const { error } = await supabase.auth.signInWithPassword(values);
  if (error) throw error;
}

export async function signUp(values: SignUpValues) {
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
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}
