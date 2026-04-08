import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Tests E2E : API Centre (routes protégées)
 * ═══════════════════════════════════════════════════════════════
 */

test.describe("API Centre — Sans authentification", () => {
  test("GET /api/centre/stats sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/stats");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/formations sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/formations");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/sessions sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/sessions");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/membres sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/membres");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/payments sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/payments");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/exports?type=reservations sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/exports?type=reservations");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/email-templates sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/email-templates");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/promo sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/promo");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/contrats sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/contrats");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/completion sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/completion");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/centre/list sans auth retourne 401/500", async ({ request }) => {
    const res = await request.get("/api/centre/list");
    expect([401, 500]).toContain(res.status());
  });
});
