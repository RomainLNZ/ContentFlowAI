import { describe, expect, it } from "vitest";
import { normalizeWebsite, onboardingStepSchemas } from "./onboarding.schema";

describe("validation onboarding frontend", () => {
  it("normalise un site sans protocole", () => {
    expect(normalizeWebsite("flowpilot.app")).toBe("https://flowpilot.app");
    expect(
      onboardingStepSchemas[1].safeParse({
        organizationName: "FlowPilot",
        slug: "flowpilot",
        websiteUrl: "flowpilot.app",
        industry: "Technologie et SaaS",
      }).success,
    ).toBe(true);
  });

  it("retourne une erreur contextualisée pour les objectifs", () => {
    const result = onboardingStepSchemas[4].safeParse({ objectives: [], primaryObjective: "" });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.message).toBe("Veuillez sélectionner au moins un objectif.");
  });
});
