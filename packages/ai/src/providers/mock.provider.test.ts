import { z } from "zod";
import { describe, expect, it } from "vitest";
import { linkedInGenerationSchema } from "../agents/social-content-agent";
import { MockProvider } from "./mock.provider";

describe("MockProvider", () => {
  it("est toujours disponible et produit une sortie texte déterministe", async () => {
    const provider = new MockProvider();
    expect(await provider.isAvailable()).toBe(true);
    const request = {
      messages: [{ role: "user" as const, content: "Bonjour" }],
      settings: { model: "mock-v1" },
    };
    expect((await provider.generate(request)).content).toBe((await provider.generate(request)).content);
  });

  it("matérialise un schéma JSON structuré", async () => {
    const response = await new MockProvider().generate({
      messages: [],
      settings: { model: "mock-v1", responseFormat: "json" },
      structuredOutput: {
        name: "recommendation",
        schema: {
          type: "object",
          properties: {
            priority: { type: "string", enum: ["HIGH", "LOW"] },
            title: { type: "string" },
            evidence: { type: "array", items: { type: "string" }, minItems: 2 },
          },
          required: ["priority", "title", "evidence"],
        },
      },
    });
    expect(JSON.parse(response.content)).toEqual({
      priority: "HIGH",
      title: "Mock title",
      evidence: ["Mock evidence", "Mock evidence"],
    });
  });

  it("respecte le contrat structuré utilisé par la génération LinkedIn", async () => {
    const response = await new MockProvider().generate({
      messages: [],
      settings: { model: "mock-v1", responseFormat: "json" },
      structuredOutput: {
        name: "linkedin_content_variants",
        schema: z.toJSONSchema(linkedInGenerationSchema) as Readonly<Record<string, unknown>>,
      },
    });
    expect(linkedInGenerationSchema.safeParse(JSON.parse(response.content)).success).toBe(true);
  });
});
