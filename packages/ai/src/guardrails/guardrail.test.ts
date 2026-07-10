import { describe, expect, it } from "vitest";
import { ForbiddenTermsGuardrail } from "./forbidden-terms.guardrail";
import { GuardrailPipeline } from "./guardrail";

describe("GuardrailPipeline", () => {
  it("bloque un contenu contenant un terme interdit", async () => {
    const pipeline = new GuardrailPipeline([new ForbiddenTermsGuardrail(["révolutionnaire"])]);
    const result = await pipeline.validate({
      stage: "output",
      content: "Une offre révolutionnaire",
      context: {
        organizationId: "org",
        workspaceId: "workspace",
        userId: "user",
        correlationId: "correlation",
        locale: "fr-FR",
      },
      metadata: {},
    });
    expect(result.accepted).toBe(false);
    expect(result.violations[0]?.category).toBe("forbidden_content");
  });
});
