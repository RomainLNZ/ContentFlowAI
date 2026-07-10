import { describe, expect, it } from "vitest";
import { InMemoryPromptSource, PromptManager } from "./prompt-manager";

const source = new InMemoryPromptSource([
  {
    key: "core.task",
    version: 1,
    description: "Test",
    system: "Marque : {{brand}}",
    user: "Tâche : {{task}}",
    requiredVariables: ["brand", "task"],
  },
]);

describe("PromptManager", () => {
  it("rend une version explicite avec toutes ses variables", async () => {
    const manager = new PromptManager(source);
    await expect(
      manager.render("core.task", { brand: "Horizon", task: "Créer un post" }, 1),
    ).resolves.toMatchObject({ system: "Marque : Horizon", user: "Tâche : Créer un post", version: 1 });
  });

  it("refuse une variable obligatoire absente", async () => {
    const manager = new PromptManager(source);
    await expect(manager.render("core.task", { brand: "Horizon" }, 1)).rejects.toThrow("task");
  });
});
