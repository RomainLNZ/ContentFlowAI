import { describe, expect, it } from "vitest";
import {
  completeRecommendationSchema,
  createDraftFromRecommendationSchema,
  directorPreferenceSchema,
  dismissRecommendationSchema,
  feedbackSchema,
  recommendationListSchema,
} from "./director-api.schema.js";

describe("schémas API Director", () => {
  it("valide filtres et pagination bornée", () => {
    expect(recommendationListSchema.parse({ page: "2", pageSize: "25", priority: "HIGH" })).toMatchObject({
      page: 2,
      pageSize: 25,
      priority: "HIGH",
    });
    expect(recommendationListSchema.safeParse({ pageSize: 101 }).success).toBe(false);
    expect(recommendationListSchema.safeParse({ from: "2026-08-01", to: "2026-07-01" }).success).toBe(false);
  });

  it("exige une raison de dismissal et une confirmation de complétion", () => {
    expect(dismissRecommendationSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(completeRecommendationSchema.safeParse({ confirmed: false }).success).toBe(false);
    expect(completeRecommendationSchema.safeParse({ confirmed: true }).success).toBe(true);
  });

  it("borne les préférences et valide le fuseau horaire", () => {
    const valid = {
      desiredWeeklyFrequency: 3,
      preferredWeekdays: [1, 3, 5],
      preferredHours: ["09:00", "14:30"],
      timezone: "Europe/Paris",
      silenceThresholdDays: 7,
      maxDailyRecommendations: 5,
      notificationsEnabled: true,
      proactivityLevel: 2,
      disabledRecommendationTypes: ["CADENCE_WARNING"],
    };
    expect(directorPreferenceSchema.safeParse(valid).success).toBe(true);
    expect(directorPreferenceSchema.safeParse({ ...valid, timezone: "Mars/Olympus" }).success).toBe(false);
    expect(directorPreferenceSchema.safeParse({ ...valid, preferredWeekdays: [1, 1] }).success).toBe(false);
  });

  it("valide feedback et confirmation explicite du brouillon", () => {
    expect(feedbackSchema.safeParse({ value: "HELPFUL", reason: "RELEVANT" }).success).toBe(true);
    expect(feedbackSchema.safeParse({ value: "MAYBE" }).success).toBe(false);
    expect(
      createDraftFromRecommendationSchema.safeParse({ confirmed: false, title: "Sujet", body: "Texte" })
        .success,
    ).toBe(false);
  });
});
