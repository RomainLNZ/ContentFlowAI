import "dotenv/config";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = new PrismaClient();
const screenshotDirectory = path.resolve("artifacts/beta-polish-lot-2");

test("captures réelles des écrans Beta Polish Lot 2", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `flowpilot.visual.${suffix}@example.com`;
  const password = "FlowPilot-Visual-2026!";
  const organizationName = "Atelier Horizon";
  const slug = `atelier-horizon-${suffix}`;
  let authUserId: string | undefined;

  try {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Léa Martin", organization_name: organizationName },
    });
    expect(created.error).toBeNull();
    authUserId = created.data.user?.id;

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/sign-in");
    await page.getByLabel("Email professionnel").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(/\/onboarding$/);

    await page.getByLabel("Nom de l’organisation").fill(organizationName);
    await page.getByLabel("Identifiant URL").fill(slug);
    await page.getByLabel("Site web").fill("atelier-horizon.fr");
    await page.getByLabel("Secteur").fill("Conseil");
    await page
      .getByLabel("Description")
      .fill("Cabinet de conseil qui aide les PME à rendre leur stratégie plus lisible.");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page
      .getByLabel("Mission")
      .fill("Donner aux dirigeants la clarté nécessaire pour prendre de meilleures décisions.");
    await page.getByLabel(/Valeurs/).fill("Clarté, Exigence, Proximité");
    await page.getByLabel("Produits et services").fill("Conseil stratégique, Ateliers dirigeants");
    await page.getByLabel("Publics cibles").fill("Dirigeants de PME, Responsables marketing");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByLabel("Ton de communication").fill("Clair, humain et expert");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByRole("button", { name: "Créer mon espace" }).click();
    await page.waitForURL(/\/app$/);

    await page.goto("/app/campaigns");
    await page.getByRole("button", { name: "Nouvelle campagne" }).click();
    await page.getByLabel("Nom de la campagne").fill("Lancement Offre Horizon");
    await page.getByRole("button", { name: "Créer la campagne" }).click();
    await expect(page.getByText("Lancement Offre Horizon")).toBeVisible();
    await page.getByRole("button", { name: "Nouvelle campagne" }).click();
    await page.getByLabel("Nom de la campagne").fill("Été des dirigeants");
    await page.getByLabel("Couleur de la campagne").fill("#14b8a6");
    await page.getByRole("button", { name: "Créer la campagne" }).click();
    await expect(page.getByText("Été des dirigeants")).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDirectory, "campagnes.png"), fullPage: true });

    await page.goto("/app/create");
    await page
      .getByLabel("Sujet et brief")
      .fill(
        "Nous ouvrons un nouvel atelier destiné aux dirigeants de PME qui veulent clarifier leur stratégie avant la rentrée. Les places sont limitées, mais le message doit rester utile et non commercial.",
      );
    await page.getByLabel("Objectif").fill("Faire connaître le nouvel atelier");
    await page.getByLabel("Public cible").fill("Dirigeants de PME de 10 à 50 salariés");
    await page.getByRole("button", { name: "Proposer trois angles" }).click();
    await expect(page.getByRole("button", { name: "Sauvegarder comme brouillon" }).first()).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({ path: path.join(screenshotDirectory, "content-studio.png"), fullPage: true });
    await page.getByRole("button", { name: "Sauvegarder comme brouillon" }).first().click();
    await expect(page.getByText("Brouillon sauvegardé dans votre bibliothèque.")).toBeVisible();

    await page.goto("/app/content");
    await expect(page.locator("article, a").filter({ hasText: "Brouillon" }).first()).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDirectory, "mes-contenus.png"), fullPage: true });
  } finally {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const organization = await prisma.organization.findUnique({ where: { slug } });
        if (organization) await prisma.organization.delete({ where: { id: organization.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    } catch (cleanupError) {
      console.warn("La base de recette n’a pas pu être nettoyée automatiquement.", cleanupError);
    }
    if (authUserId) await admin.auth.admin.deleteUser(authUserId);
  }
});

test.afterAll(async () => prisma.$disconnect());
