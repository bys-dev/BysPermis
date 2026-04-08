import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Tests E2E : Favoris
 * ═══════════════════════════════════════════════════════════════
 */

test.describe("Favoris — Routes protégées", () => {
  test("GET /api/favorites sans auth retourne 401 ou 500", async ({ request }) => {
    const res = await request.get("/api/favorites");
    expect([401, 500]).toContain(res.status());
  });

  test("POST /api/favorites sans auth retourne 401 ou 500", async ({ request }) => {
    const res = await request.post("/api/favorites", {
      data: {
        formationId: "fake-formation-id",
      },
    });
    expect([401, 500]).toContain(res.status());
  });
});
