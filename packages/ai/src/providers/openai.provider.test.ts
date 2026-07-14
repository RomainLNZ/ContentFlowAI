import { describe, expect, it } from "vitest";
import { OpenAiProvider } from "./openai.provider";

describe("OpenAiProvider", () => {
  it("reste indisponible sans clé et ne réalise aucun appel réseau", async () => {
    const provider = new OpenAiProvider({});
    await expect(provider.isAvailable()).resolves.toBe(false);
    await expect(
      provider.generate({
        messages: [{ role: "user", content: "Test" }],
        settings: { model: "test-model" },
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
  });
});
