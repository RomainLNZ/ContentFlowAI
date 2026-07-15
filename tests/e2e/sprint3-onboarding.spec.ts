import "dotenv/config";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = new PrismaClient();

test.afterAll(async () => prisma.$disconnect());

test("compte, onboarding, persistance, déconnexion et reconnexion", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `flowpilot.e2e.${suffix}@example.com`;
  const password = "FlowPilot-E2E-2026!";
  const organizationName = `FlowPilot E2E ${suffix}`;
  const slug = `flowpilot-e2e-${suffix}`.toLowerCase();
  const authRequests: string[] = [];
  const authFailures: string[] = [];
  let signupRateLimited = false;
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/")) authRequests.push(request.url());
  });
  page.on("requestfailed", (request) => {
    if (request.url().includes("/auth/v1/")) authFailures.push(request.failure()?.errorText ?? "unknown");
  });

  await test.step("création réelle du compte depuis l’interface", async () => {
    await page.goto("/sign-up");
    await page.getByLabel("Nom complet").fill("Recette Sprint Trois");
    await page.getByLabel("Nom de l’organisation").fill(organizationName);
    await page.getByLabel("Email professionnel").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByLabel("Confirmer le mot de passe").fill(password);
    await page.getByLabel(/J’accepte les conditions/).check();
    const signupResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/auth/v1/signup"),
      { timeout: 45_000 },
    );
    await page.getByRole("button", { name: "Créer mon espace" }).click();
    const signupResponse = await signupResponsePromise;
    if (signupResponse.status() === 429) {
      const payload = (await signupResponse.json()) as { code?: string };
      expect(payload.code).toBe("over_email_send_rate_limit");
      signupRateLimited = true;
      await expect(page.getByRole("alert")).toContainText("Trop d’emails de confirmation");
    } else {
      expect(signupResponse.status(), await signupResponse.text()).toBeLessThan(400);
      await expect(page.getByRole("heading", { name: "Vérifiez votre messagerie" })).toBeVisible({
        timeout: 30_000,
      });
    }
    expect(authRequests.some((url) => url.includes("/auth/v1/signup"))).toBe(true);
    expect(authFailures).toEqual([]);
  });

  await test.step("confirmation réelle du compte de test", async () => {
    if (signupRateLimited) {
      const creation = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Recette Sprint Trois", organization_name: organizationName },
      });
      expect(creation.error).toBeNull();
    }
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    expect(error).toBeNull();
    const authUser = data.users.find((user) => user.email === email);
    expect(authUser).toBeTruthy();
    if (!authUser?.email_confirmed_at) {
      const confirmation = await admin.auth.admin.updateUserById(authUser!.id, { email_confirm: true });
      expect(confirmation.error).toBeNull();
    }
  });

  await test.step("connexion et onboarding complet", async () => {
    await page.goto("/sign-in");
    await page.getByLabel("Email professionnel").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(/\/onboarding$/);

    await page.getByLabel("Nom de l’organisation").fill(organizationName);
    await page.getByLabel("Identifiant URL").fill(slug);
    await page.getByLabel("Site web").fill("flowpilot.app");
    await page.getByLabel("Secteur").fill("Technologie et SaaS");
    await page.getByLabel("Description").fill("Organisation de recette fonctionnelle Sprint 3.");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText("Étape 2 sur 4")).toBeVisible();

    await page.getByLabel("Mission").fill("Valider réellement le parcours éditorial de bout en bout.");
    await page.getByLabel(/Valeurs/).fill("Clarté, Fiabilité, Impact");
    await page.getByLabel("Produits et services").fill("Planification éditoriale, Validation de contenus");
    await page.getByLabel("Publics cibles").fill("Équipes communication, PME");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText("Étape 3 sur 4")).toBeVisible();

    await page.getByLabel("Ton de communication").fill("Clair, humain et expert");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText("Étape 4 sur 4")).toBeVisible();
    await page.getByRole("button", { name: "Créer mon espace" }).click();
    await page.waitForURL(/\/app$/);
    await expect(page.getByText(organizationName)).toBeVisible();
  });

  await test.step("organisation et workspace persistés dans PostgreSQL", async () => {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizationMemberships: { include: { organization: { include: { workspaces: true } } } },
        workspaceMemberships: { include: { workspace: true } },
      },
    });
    expect(user?.onboardingDone).toBe(true);
    expect(user?.organizationMemberships[0]?.organization.name).toBe(organizationName);
    expect(user?.organizationMemberships[0]?.organization.slug).toBe(slug);
    expect(user?.organizationMemberships[0]?.organization.workspaces[0]?.name).toBe("Principal");
    expect(user?.workspaceMemberships[0]?.status).toBe("ACTIVE");
  });

  await test.step("rafraîchissement, déconnexion et reconnexion", async () => {
    await page.reload();
    await expect(page.getByText(organizationName)).toBeVisible();
    await page.getByRole("button", { name: "Déconnexion" }).click();
    await page.waitForURL(/\/sign-in$/);
    await page.getByLabel("Email professionnel").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(/\/app$/);
    await expect(page.getByText(organizationName)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Votre équipe de communication IA est prête/ }),
    ).toBeVisible();
  });
});
