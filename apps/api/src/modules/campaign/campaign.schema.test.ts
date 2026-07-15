import { describe, expect, it } from "vitest";
import { createCampaignSchema } from "./campaign.schema.js";

describe("createCampaignSchema", () => {
  it("refuse une campagne dont la fin précède le début", () => {
    expect(
      createCampaignSchema.safeParse({ name: "Sprint", startDate: "2026-08-01", endDate: "2026-07-01" })
        .success,
    ).toBe(false);
  });
});
