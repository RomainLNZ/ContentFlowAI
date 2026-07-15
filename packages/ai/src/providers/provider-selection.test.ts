import { describe, expect, it } from "vitest";
import { selectAiProvider } from "./provider-selection";

describe("selectAiProvider", () => {
  it("sélectionne Mock sans clé OpenAI", () => {
    expect(selectAiProvider({}).descriptor.id).toBe("mock");
  });

  it("sélectionne OpenAI lorsqu’une clé est fournie", () => {
    expect(selectAiProvider({ openAiApiKey: "test-key" }).descriptor.id).toBe("openai");
  });
});
