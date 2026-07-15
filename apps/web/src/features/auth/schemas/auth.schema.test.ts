import { describe, expect, it } from "vitest";
import { emailSchema, passwordStrength, signInSchema, signUpSchema } from "./auth.schema";

describe("auth schemas", () => {
  it("normalise une adresse email", () => {
    expect(emailSchema.parse({ email: "  equipe@exemple.fr  " }).email).toBe("equipe@exemple.fr");
  });

  it("refuse un mot de passe trop court", () => {
    expect(signInSchema.safeParse({ email: "equipe@exemple.fr", password: "court" }).success).toBe(false);
  });

  it("exige le consentement explicite à l'inscription", () => {
    const result = signUpSchema.safeParse({
      fullName: "Marie Dupont",
      organizationName: "Horizon",
      email: "marie@horizon.fr",
      password: "mot-de-passe-solide",
      confirmPassword: "mot-de-passe-solide",
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("refuse deux mots de passe différents", () => {
    const result = signUpSchema.safeParse({
      fullName: "Marie Dupont",
      organizationName: "Horizon",
      email: "marie@horizon.fr",
      password: "MotDePasse123!",
      confirmPassword: "AutreMotDePasse123!",
      acceptTerms: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toContain("confirmPassword");
  });

  it("accepte le consentement coché et un mot de passe robuste", () => {
    expect(
      signUpSchema.safeParse({
        fullName: "Marie Dupont",
        organizationName: "Horizon",
        email: "marie@horizon.fr",
        password: "MotDePasse123!",
        confirmPassword: "MotDePasse123!",
        acceptTerms: true,
      }).success,
    ).toBe(true);
    expect(passwordStrength("MotDePasse123!").score).toBeGreaterThanOrEqual(3);
  });
});
