import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const screenshotDirectory = path.resolve("artifacts/demo-experience");

test.beforeAll(() => fs.mkdirSync(screenshotDirectory, { recursive: true }));

test("capture le parcours guidé de la Demo Experience", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/demo");

  await expect(page.getByText("Votre communication, enfin réunie au même endroit.")).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(screenshotDirectory, "01-accueil.png"), fullPage: true });

  await page.getByRole("button", { name: "Commencer", exact: true }).click();
  await expect(page.getByText("Commencez chaque journée avec les bonnes priorités.")).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(screenshotDirectory, "02-director.png"), fullPage: true });

  await page.getByRole("button", { name: /continuer/i }).click();
  await expect(page).toHaveURL(/\/app\/calendar$/);
  await expect(page.getByText("Visualisez un rythme éditorial vivant.")).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(screenshotDirectory, "03-calendrier.png"), fullPage: true });

  await page.getByRole("button", { name: /continuer/i }).click();
  await expect(page).toHaveURL(/\/app\/campaigns$/);
  await expect(page.getByText("Gardez chaque temps fort cohérent.")).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(screenshotDirectory, "04-campagnes.png"), fullPage: true });

  await page.getByRole("button", { name: /continuer/i }).click();
  await expect(page).toHaveURL(/\/app\/create$/);
  await expect(page.getByText("Passez d’une idée à trois angles exploitables.")).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(screenshotDirectory, "05-content-studio.png"), fullPage: true });

  await page.getByRole("button", { name: /continuer/i }).click();
  await expect(page).toHaveURL(/\/app\/content$/);
  await expect(page.getByText("Suivez chaque contenu, du brouillon à la publication.")).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(screenshotDirectory, "06-bibliotheque.png"), fullPage: true });

  await page.getByRole("button", { name: /continuer/i }).click();
  await expect(page.getByText("Vous venez de découvrir FlowPilot.")).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(screenshotDirectory, "07-fin-de-visite.png"), fullPage: true });
});
