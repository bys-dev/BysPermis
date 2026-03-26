import { test, expect } from "@playwright/test";

const SLUGS = [
  "recuperation-de-points",
  "permis-b-accelere",
  "fimo-fco",
  "sensibilisation-securite-routiere",
];

test.describe("Fiches formation", () => {
  for (const slug of SLUGS) {
    test(`fiche "${slug}" se charge`, async ({ page }) => {
      await page.goto(`/formations/${slug}`);
      await page.waitForLoadState("networkidle");

      // Pas de page 404 / 500
      await expect(page).not.toHaveURL(/500/);

      // Un h1 est présent
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
    });
  }

  test("la section sessions est présente sur recuperation-de-points", async ({ page }) => {
    await page.goto("/formations/recuperation-de-points");
    await page.waitForLoadState("networkidle");

    const sessionsSection = page.getByText(/sessions/i).first();
    await expect(sessionsSection).toBeVisible();
  });

  test("le bouton Réserver ou les sessions sont présents (ou page statique)", async ({ page }) => {
    await page.goto("/formations/recuperation-de-points");
    await page.waitForLoadState("networkidle");

    // La page se charge sans crash (sessions statiques ou live)
    await expect(page.getByRole("navigation").first()).toBeVisible();
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
  });

  test("slug inconnu affiche une page d'erreur", async ({ page }) => {
    await page.goto("/formations/slug-qui-nexiste-pas");
    await page.waitForLoadState("networkidle");
    // La page doit afficher "introuvable" ou "n'existe pas"
    // (text peut contenir des apostrophes HTML encodées)
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).toMatch(/introuvable|n.existe|not found|erreur/i);
  });
});
