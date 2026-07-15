import { describe, expect, it } from "vitest";
import { calendarQuerySchema } from "./calendar.schema.js";

describe("calendarQuerySchema", () => {
  it("accepte une période bornée et des filtres séparés par virgule", () => {
    const result = calendarQuerySchema.parse({
      from: "2026-07-01",
      to: "2026-08-01",
      status: "DRAFT,APPROVED",
    });
    expect(result.status).toEqual(["DRAFT", "APPROVED"]);
  });

  it("refuse une fenêtre supérieure à 93 jours", () => {
    expect(calendarQuerySchema.safeParse({ from: "2026-01-01", to: "2026-06-01" }).success).toBe(false);
  });
});
