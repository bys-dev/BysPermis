import { test, expect } from "@playwright/test";

/**
 * Tests du tunnel de réservation (sans paiement réel).
 * Nécessite qu'au moins une session active existe en DB.
 */
test.describe("Tunnel de réservation", () => {
  let sessionId: string | null = null;

  test.beforeAll(async ({ request }) => {
    // Récupérer une session active pour les tests
    const res = await request.get("/api/sessions");
    if (res.status() === 200) {
      const sessions = await res.json();
      if (sessions.length > 0) sessionId = sessions[0].id;
    }
  });

  test("page /reserver/[id]/donnees se charge", async ({ page }) => {
    if (!sessionId) {
      test.skip(true, "Aucune session active en base de données");
      return;
    }

    await page.goto(`/reserver/${sessionId}/donnees`);
    await page.waitForLoadState("networkidle");

    // Soit la page se charge (utilisateur connecté), soit redirige vers /connexion
    const url = page.url();
    expect(url).toMatch(/donnees|connexion|login/);
  });

  test("page /reserver/[id]/connexion se charge", async ({ page }) => {
    if (!sessionId) {
      test.skip(true, "Aucune session active en base de données");
      return;
    }

    await page.goto(`/reserver/${sessionId}/connexion`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/500/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("page donnees affiche les infos de la session", async ({ page }) => {
    if (!sessionId) {
      test.skip(true, "Aucune session active en base de données");
      return;
    }

    await page.goto(`/reserver/${sessionId}/donnees`);
    await page.waitForLoadState("networkidle");

    // Si connecté : formulaire visible. Sinon : page de connexion
    const isLoginPage = page.url().includes("connexion") || page.url().includes("login");
    if (!isLoginPage) {
      // Formulaire de données stagiaire
      await expect(page.getByLabel(/nom/i)).toBeVisible();
    }
  });
});
