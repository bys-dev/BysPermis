import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Tests E2E : API Admin (routes protégées)
 * ═══════════════════════════════════════════════════════════════
 */

test.describe("API Admin — Sans authentification", () => {
  test("GET /api/admin/stats sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/stats");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/users sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/users");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/centres sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/centres");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/tickets sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/tickets");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/settings sans auth retourne 401 ou 500", async ({ request }) => {
    const res = await request.get("/api/admin/settings");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/admin/revenus sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/revenus");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/analytics sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/analytics");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/promo sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/promo");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/payments sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/payments");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/moderation sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/admin/moderation");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/exports?type=centres sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/admin/exports?type=centres");
    expect([401, 500]).toContain(res.status());
  });
});
