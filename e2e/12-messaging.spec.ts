import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Tests E2E : Messagerie
 * ═══════════════════════════════════════════════════════════════
 */

test.describe("Messagerie — Routes protégées", () => {
  test("GET /api/messages sans auth retourne 401 ou 500", async ({ request }) => {
    const res = await request.get("/api/messages");
    expect([401, 500]).toContain(res.status());
  });

  test("POST /api/messages sans auth retourne 401 ou 500", async ({ request }) => {
    const res = await request.post("/api/messages", {
      data: {
        receiverId: "fake-user-id",
        content: "Message de test",
      },
    });
    expect([401, 500]).toContain(res.status());
  });
});
