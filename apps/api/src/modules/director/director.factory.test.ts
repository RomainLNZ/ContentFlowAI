import { describe, expect, it } from "vitest";
import { createDirectorOrchestrator } from "./director.factory.js";
import { directorSnapshot } from "./director.test-fixture.js";

describe("createDirectorOrchestrator", () => {
  it("utilise automatiquement Mock en l’absence de clé OpenAI", async () => {
    const result = await createDirectorOrchestrator({ model: "mock-v1", timeoutMs: 30_000 }).execute(
      directorSnapshot(),
    );
    expect(result.provider).toBe("mock");
  });
});
