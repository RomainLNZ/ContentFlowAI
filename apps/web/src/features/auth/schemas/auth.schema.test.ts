import { describe, expect, it } from "vitest";
import { emailSchema, signInSchema, signUpSchema } from "./auth.schema";

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
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
  });
});
