import { describe, expect, it } from "vitest";
import { createContentSchema, listContentSchema, updateContentSchema } from "./content.schema.js";

describe("content schemas", () => {
  it("crée un brouillon par défaut", () => {
    expect(createContentSchema.parse({ title: "Titre", body: "Contenu" }).status).toBe("DRAFT");
  });

  it("borne la pagination", () => {
    expect(listContentSchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });

  it("refuse une mise à jour générique qui ne contient qu’un statut", () => {
    expect(updateContentSchema.safeParse({ status: "APPROVED" }).success).toBe(false);
  });
});
