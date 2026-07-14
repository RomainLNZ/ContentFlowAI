import { describe, expect, it } from "vitest";
import { createContentSchema, listContentSchema } from "./content.schema.js";

describe("content schemas", () => {
  it("crée un brouillon par défaut", () => {
    expect(createContentSchema.parse({ title: "Titre", body: "Contenu" }).status).toBe("DRAFT");
  });

  it("borne la pagination", () => {
    expect(listContentSchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
});
