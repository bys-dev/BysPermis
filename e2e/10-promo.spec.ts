import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Tests E2E : Codes promo
 * ═══════════════════════════════════════════════════════════════
 */

test.describe("Codes promo — Validation", () => {
  test("POST /api/promo/validate avec code valide BIENVENUE10 retourne valid=true et une réduction", async ({ request }) => {
    const res = await request.post("/api/promo/validate", {
      data: { code: "BIENVENUE10", montant: 250 },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.reduction).toBeGreaterThan(0);
    expect(data.nouveauMontant).toBeLessThan(250);
    expect(data.type).toBe("POURCENTAGE");
  });

  test("POST /api/promo/validate avec code invalide retourne valid=false", async ({ request }) => {
    const res = await request.post("/api/promo/validate", {
      data: { code: "CODECOMPLETEMENTINVALIDE", montant: 100 },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
  });

  test("POST /api/promo/validate avec données invalides retourne 400", async ({ request }) => {
    const res = await request.post("/api/promo/validate", {
      data: { code: "", montant: -10 },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/promo/validate avec code STAGE20 vérifie le montant minimum", async ({ request }) => {
    // STAGE20 a un minAchat de 200€ — tester avec montant insuffisant
    const res = await request.post("/api/promo/validate", {
      data: { code: "STAGE20", montant: 50 },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain("minimum");

    // Tester avec montant suffisant
    const res2 = await request.post("/api/promo/validate", {
      data: { code: "STAGE20", montant: 250 },
    });
    const data2 = await res2.json();
    expect(data2.valid).toBe(true);
    expect(data2.reduction).toBe(20);
  });

  test("GET /api/admin/promo sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/promo");
    expect(res.status()).toBe(401);
  });
});
