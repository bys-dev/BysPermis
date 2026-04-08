import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Tests E2E : Nouvelles pages (blog, stages villes, maintenance, sitemap)
 * ═══════════════════════════════════════════════════════════════
 */

test.describe("Nouvelles pages — Chargement", () => {
  test("/blog retourne 200", async ({ page }) => {
    const res = await page.goto("/blog");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("/stages/paris retourne 200", async ({ page }) => {
    const res = await page.goto("/stages/paris");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("/stages/lyon retourne 200", async ({ page }) => {
    const res = await page.goto("/stages/lyon");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("/stages/marseille retourne 200", async ({ page }) => {
    const res = await page.goto("/stages/marseille");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("/maintenance retourne 200", async ({ page }) => {
    const res = await page.goto("/maintenance");
    expect(res?.status()).toBe(200);
  });

  test("/dashboard redirige (auth requise — 307 ou 200)", async ({ page }) => {
    const res = await page.goto("/dashboard");
    // Soit 307 redirect, soit la page redirige côté client
    expect(res?.status()).toBeLessThan(500);
  });

  test("/sitemap.xml retourne 200", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("<?xml");
  });

  test("/robots.txt retourne 200", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text.toLowerCase()).toContain("user-agent");
  });
});
