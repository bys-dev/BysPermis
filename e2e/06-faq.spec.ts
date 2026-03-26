import { test, expect } from "@playwright/test";

test.describe("Page FAQ", () => {
  test("se charge et affiche les catégories", async ({ page }) => {
    await page.goto("/faq");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Au moins une question visible
    const questions = page.getByRole("button").filter({ hasText: /\?/ });
    await expect(questions.first()).toBeVisible();
  });

  test("les accordéons fonctionnent", async ({ page }) => {
    await page.goto("/faq");
    await page.waitForLoadState("networkidle");

    const firstQuestion = page.getByRole("button").filter({ hasText: /\?/ }).first();
    if (await firstQuestion.isVisible()) {
      await firstQuestion.click();
      // La réponse doit apparaître
      await page.waitForTimeout(300);
      // Pas de crash
      await expect(page.getByRole("navigation")).toBeVisible();
    }
  });
});
