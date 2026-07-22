import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const screenshotDirectory = path.resolve("artifacts/marketing-branding");

test.beforeAll(() => fs.mkdirSync(screenshotDirectory, { recursive: true }));

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`capture la landing complète en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Les bonnes actions/i })).toBeVisible();
    await page.waitForTimeout(900);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.75) {
        window.scrollTo(0, y);
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      path: path.join(screenshotDirectory, `landing-${viewport.name}.png`),
      fullPage: true,
    });
  });
}
