import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Tests E2E : Documents & PDFs (convocations, contrats, factures, attestations)
 * ═══════════════════════════════════════════════════════════════
 */

test.describe("Documents — Routes protégées", () => {
  test("GET /api/convocation/[id] sans auth retourne 401 ou 500", async ({ request }) => {
    const res = await request.get("/api/convocation/fake-reservation-id");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/contrats/[id] sans auth retourne 401 ou 500", async ({ request }) => {
    const res = await request.get("/api/contrats/fake-reservation-id");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/invoices sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/invoices");
    expect(res.status()).toBe(401);
  });

  test("GET /api/attestations/[id] sans auth retourne 401 ou 500", async ({ request }) => {
    const res = await request.get("/api/attestations/fake-reservation-id");
    expect([401, 500]).toContain(res.status());
  });
});
