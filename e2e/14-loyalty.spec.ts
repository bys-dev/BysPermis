import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Tests E2E : Fidélité & Parrainage
 * ═══════════════════════════════════════════════════════════════
 */

test.describe("Fidélité & Parrainage — Routes protégées", () => {
  test("GET /api/loyalty sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/loyalty");
    expect(res.status()).toBe(401);
  });

  test("GET /api/referral sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/referral");
    expect(res.status()).toBe(401);
  });
});
