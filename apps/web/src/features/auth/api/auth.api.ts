import { supabase } from "@/lib/supabase";
import {
  signUpSchema,
  type ForgotPasswordValues,
  type SignInValues,
  type SignUpValues,
} from "../schemas/auth.schema";
import { isSupabaseConfigured } from "@/lib/env";

function requireSupabaseConfiguration() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase Auth n’est pas configuré pour cet environnement.");
  }
}

export function authErrorMessage(error: unknown, action: "sign-in" | "sign-up") {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "over_email_send_rate_limit") {
    return "Trop d’emails de confirmation ont été demandés. Patientez quelques minutes avant de réessayer.";
  }
  if (code === "user_already_exists") return "Un compte existe déjà avec cette adresse email.";
  if (code === "invalid_credentials") return "Email ou mot de passe incorrect.";
  return action === "sign-up"
    ? "La création du compte a échoué. Vérifiez vos informations puis réessayez."
    : "Connexion impossible. Vérifiez vos identifiants.";
}

export async function signIn(values: SignInValues) {
  requireSupabaseConfiguration();
  const { error } = await supabase.auth.signInWithPassword(values);
  if (error) throw error;
}

export async function signUp(values: SignUpValues) {
  requireSupabaseConfiguration();
  const validated = signUpSchema.parse(values);
  const { error } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
    options: {
      data: { full_name: validated.fullName, organization_name: validated.organizationName },
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
