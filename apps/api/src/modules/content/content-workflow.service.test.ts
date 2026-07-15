import { describe, expect, it } from "vitest";
import { allowedTransitions } from "./content-workflow.service.js";
import { transitionContentSchema } from "./content-workflow.schema.js";

describe("workflow éditorial", () => {
  it("déclare uniquement les transitions métier autorisées", () => {
    expect(allowedTransitions.DRAFT).toEqual(["READY_FOR_REVIEW", "ARCHIVED"]);
    expect(allowedTransitions.READY_FOR_REVIEW).toEqual([
      "DRAFT",
      "APPROVED",
      "CHANGES_REQUESTED",
      "ARCHIVED",
    ]);
    expect(allowedTransitions.CHANGES_REQUESTED).toEqual(["DRAFT", "READY_FOR_REVIEW", "ARCHIVED"]);
    expect(allowedTransitions.APPROVED).toEqual(["SCHEDULED", "ARCHIVED"]);
    expect(allowedTransitions.SCHEDULED).toEqual(["APPROVED", "PUBLISHED", "ARCHIVED"]);
    expect(allowedTransitions.PUBLISHED).toEqual(["ARCHIVED"]);
    expect(allowedTransitions.ARCHIVED).toEqual([]);
  });

  it("refuse un statut inconnu", () => {
    expect(transitionContentSchema.safeParse({ to: "REJECTED" }).success).toBe(false);
  });
});
