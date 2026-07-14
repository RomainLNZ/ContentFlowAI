import { describe, expect, it } from "vitest";
import { completeOnboardingSchema } from "./onboarding.schema.js";

const valid = {
  organization: { name: "FlowPilot Test", slug: "flowpilot-test" },
  workspace: {},
  brandProfile: { productsServices: ["Conseil"], targetAudiences: ["PME"] },
  objectives: [{ type: "AWARENESS", isPrimary: true }],
};

describe("completeOnboardingSchema", () => {
  it("accepte un onboarding minimal et applique les valeurs par défaut", () => {
    const parsed = completeOnboardingSchema.parse(valid);
    expect(parsed.workspace).toEqual({ name: "Principal", slug: "principal" });
    expect(parsed.organization.primaryLanguage).toBe("fr");
  });

  it("exige exactement un objectif principal", () => {
    const parsed = completeOnboardingSchema.safeParse({
      ...valid,
      objectives: [
        { type: "AWARENESS", isPrimary: true },
        { type: "EXPERTISE", isPrimary: true },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});
