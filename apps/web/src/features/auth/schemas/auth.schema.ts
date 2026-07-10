import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().trim().email("Saisissez une adresse email valide."),
});

export const signInSchema = emailSchema.extend({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, "Indiquez votre nom complet."),
  organizationName: z.string().trim().min(2, "Indiquez le nom de votre entreprise."),
  acceptTerms: z.literal(true, { error: "Vous devez accepter les conditions." }),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof emailSchema>;
