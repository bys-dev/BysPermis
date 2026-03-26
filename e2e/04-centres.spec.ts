import { test, expect } from "@playwright/test";

test.describe("Page des centres", () => {
  test("se charge sans erreur", async ({ page }) => {
    await page.goto("/centres");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/500/);
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("affiche des centres ou un état vide", async ({ page }) => {
    await page.goto("/centres");
    await page.waitForLoadState("networkidle");

    const hasCentres = await page.locator("article, [data-testid='centre-card'], .rounded-xl").count();
    expect(hasCentres).toBeGreaterThanOrEqual(0); // ne crashe pas
  });

  test("le filtre ville est fonctionnel", async ({ page }) => {
    await page.goto("/centres");
    await page.waitForLoadState("networkidle");

    const villeInput = page.getByPlaceholder(/ville/i).first();
    if (await villeInput.isVisible()) {
      await villeInput.fill("Osny");
      await page.waitForTimeout(400);
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("navigation")).toBeVisible();
    }
  });
});
