import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().trim().email("Saisissez une adresse email valide."),
});

export const signInSchema = emailSchema.extend({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Indiquez votre nom complet.").max(120),
    organizationName: z.string().trim().min(2, "Indiquez le nom de l’organisation.").max(160),
    email: z.string().trim().email("Saisissez une adresse email valide."),
    password: z
      .string()
      .min(10, "Utilisez au moins 10 caractères.")
      .max(72, "Le mot de passe ne peut pas dépasser 72 caractères.")
      .regex(/[a-z]/, "Ajoutez au moins une lettre minuscule.")
      .regex(/[A-Z]/, "Ajoutez au moins une lettre majuscule.")
      .regex(/[0-9]/, "Ajoutez au moins un chiffre."),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((value) => value, "Vous devez accepter les conditions."),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Les deux mots de passe ne correspondent pas.",
      });
    }
  });

export function passwordStrength(password: string) {
  const checks = [
    password.length >= 10,
    password.length >= 14,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  if (!password) return { score: 0, label: "", color: "bg-zinc-800" };
  if (score <= 2) return { score: 1, label: "Faible", color: "bg-rose-500" };
  if (score === 3) return { score: 2, label: "Moyen", color: "bg-amber-400" };
  if (score === 4) return { score: 3, label: "Bon", color: "bg-emerald-400" };
  return { score: 4, label: "Excellent", color: "bg-emerald-300" };
}

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof emailSchema>;
