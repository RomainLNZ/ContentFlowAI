import type { Authentication } from "@/lib/authentication";
import {
  signUpSchema,
  type ForgotPasswordValues,
  type SignInValues,
  type SignUpValues,
} from "../schemas/auth.schema";

function requireAuthenticationConfiguration(authentication: Authentication) {
  if (!authentication.configured) {
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

export async function signIn(authentication: Authentication, values: SignInValues) {
  requireAuthenticationConfiguration(authentication);
  await authentication.signInWithPassword(values);
}

export async function signUp(authentication: Authentication, values: SignUpValues) {
  requireAuthenticationConfiguration(authentication);
  const validated = signUpSchema.parse(values);
  await authentication.signUp({
    email: validated.email,
    password: validated.password,
    fullName: validated.fullName,
    organizationName: validated.organizationName,
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  });
}

export async function requestPasswordReset(authentication: Authentication, { email }: ForgotPasswordValues) {
  requireAuthenticationConfiguration(authentication);
  await authentication.requestPasswordReset(email, `${window.location.origin}/reset-password`);
}
