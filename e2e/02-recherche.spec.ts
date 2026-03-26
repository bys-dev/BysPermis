import { test, expect } from "@playwright/test";

test.describe("Page de recherche", () => {
  test("se charge sans erreur", async ({ page }) => {
    await page.goto("/recherche");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/500|error/);
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("affiche des résultats ou un message vide", async ({ page }) => {
    await page.goto("/recherche");
    await page.waitForLoadState("networkidle");
    // Soit des cartes de formations, soit un message "aucun résultat"
    const hasCards = await page.locator("a[href*='/reserver'], a[href*='/formations/']").count();
    const hasEmpty = await page.getByText(/aucun|aucune|pas de résultat/i).isVisible().catch(() => false);
    expect(hasCards > 0 || hasEmpty).toBeTruthy();
  });

  test("le filtre par ville fonctionne", async ({ page }) => {
    await page.goto("/recherche");
    await page.waitForLoadState("networkidle");

    const villeInput = page.getByPlaceholder(/ville/i).first();
    if (await villeInput.isVisible()) {
      await villeInput.fill("Osny");
      await page.waitForTimeout(400); // debounce
      await page.waitForLoadState("networkidle");
      // Pas de crash
      await expect(page.getByRole("navigation")).toBeVisible();
    }
  });

  test("les cartes de formation ont un lien vers la réservation ou la fiche", async ({ page }) => {
    await page.goto("/recherche");
    await page.waitForLoadState("networkidle");

    const cards = page.locator("a[href*='/reserver'], a[href*='/formations/']");
    const count = await cards.count();
    if (count > 0) {
      const href = await cards.first().getAttribute("href");
      expect(href).toMatch(/\/(reserver|formations)\//);
    }
  });
});
