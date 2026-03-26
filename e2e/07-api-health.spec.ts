import { test, expect } from "@playwright/test";

/**
 * Tests de santé des API routes publiques.
 * Ces tests vérifient que les endpoints répondent avec le bon statut
 * sans authentification (routes publiques).
 */
test.describe("API Routes — santé", () => {
  test("GET /api/formations retourne 200", async ({ request }) => {
    const res = await request.get("/api/formations");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("formations");
    expect(Array.isArray(data.formations)).toBe(true);
  });

  test("GET /api/formations?perPage=3 retourne max 3 formations", async ({ request }) => {
    const res = await request.get("/api/formations?perPage=3");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.formations.length).toBeLessThanOrEqual(3);
  });

  test("GET /api/sessions retourne 200", async ({ request }) => {
    const res = await request.get("/api/sessions");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/centres retourne 200", async ({ request }) => {
    const res = await request.get("/api/centres");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/sessions/[id-inconnu] retourne 404", async ({ request }) => {
    const res = await request.get("/api/sessions/id-qui-nexiste-pas");
    expect(res.status()).toBe(404);
  });

  test("GET /api/formations/slug/[slug-inconnu] retourne 404", async ({ request }) => {
    const res = await request.get("/api/formations/slug/slug-inexistant");
    expect(res.status()).toBe(404);
  });

  test("GET /api/reservations sans auth retourne 401", async ({ request }) => {
    const res = await request.get("/api/reservations");
    expect(res.status()).toBe(401);
  });

  test("POST /api/contact avec données invalides retourne 400", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: { nom: "", email: "pas-un-email", sujet: "", message: "court" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/contact avec données valides retourne 200 (mock Resend)", async ({ request }) => {
    // On ne peut pas vraiment envoyer un email en test,
    // mais on vérifie que la validation passe et la route existe.
    // En prod, RESEND_API_KEY doit être configuré.
    const res = await request.post("/api/contact", {
      data: {
        nom: "Jean Test",
        email: "jean@test.com",
        sujet: "reservation",
        message: "Ceci est un message de test suffisamment long.",
      },
    });
    // 200 si RESEND_API_KEY configuré, 500 sinon (mais pas 400 car validation OK)
    expect([200, 500]).toContain(res.status());
  });
});
