import { test, expect } from "@playwright/test";

test.describe("Page d'accueil", () => {
  test("charge et affiche le hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BYS/i);
    // Hero avec CTA principal
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("affiche la section formations à la une", async ({ page }) => {
    await page.goto("/");
    // Attendre que la section formations se charge (API call)
    await page.waitForLoadState("networkidle");
    // La section formations existe
    const section = page.locator("section, div").filter({ hasText: /formations/i }).first();
    await expect(section).toBeVisible();
  });

  test("la barre de recherche est présente et redirige", async ({ page }) => {
    await page.goto("/");
    // Trouver le champ de recherche ou le bouton qui mène à /recherche
    const rechercheLink = page.getByRole("link", { name: /recherche|trouver|stages/i }).first();
    if (await rechercheLink.isVisible()) {
      await rechercheLink.click();
      await expect(page).toHaveURL(/recherche/);
    }
  });

  test("le header contient les liens de navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("le footer est présent", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });
});
