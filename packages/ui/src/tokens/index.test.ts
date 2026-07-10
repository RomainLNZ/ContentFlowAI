import { describe, expect, it } from "vitest";
import { designTokens } from "./index";

describe("design tokens", () => {
  it("expose des fondations cohérentes et immuables par convention", () => {
    expect(designTokens.colors.background.canvas).toBe("#08090c");
    expect(designTokens.radius.full).toBe("9999px");
    expect(designTokens.motion.duration.fast).toBeLessThan(designTokens.motion.duration.slow);
  });
});
