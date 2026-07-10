import { describe, expect, it } from "vitest";
import { declareKnownProviders } from "./manifests";
import { ProviderRegistry } from "./provider-registry";

describe("ProviderRegistry", () => {
  it("déclare les six fournisseurs prévus sans les considérer configurés", () => {
    const registry = new ProviderRegistry();
    declareKnownProviders(registry);
    expect(registry.list().map(({ id }) => id)).toEqual([
      "openai",
      "anthropic",
      "google-gemini",
      "mistral",
      "deepseek",
      "ollama",
    ]);
    expect(registry.has("openai")).toBe(false);
  });
});
