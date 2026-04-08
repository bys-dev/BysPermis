import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Tests E2E : Système de blog / articles
 * ═══════════════════════════════════════════════════════════════
 */

test.describe("Blog — API articles", () => {
  test("GET /api/articles retourne les articles publiés", async ({ request }) => {
    const res = await request.get("/api/articles");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("articles");
    expect(data).toHaveProperty("total");
    expect(data.total).toBeGreaterThan(0);
    expect(data.articles.length).toBeGreaterThan(0);
  });

  test("GET /api/articles retourne les champs corrects (titre, slug, extrait, categorie)", async ({ request }) => {
    const res = await request.get("/api/articles");
    const data = await res.json();
    const article = data.articles[0];

    expect(article).toHaveProperty("titre");
    expect(article).toHaveProperty("slug");
    expect(article).toHaveProperty("extrait");
    expect(article).toHaveProperty("categorie");
    expect(typeof article.titre).toBe("string");
    expect(typeof article.slug).toBe("string");
  });

  test("GET /api/articles?categorie=conseils filtre correctement", async ({ request }) => {
    const res = await request.get("/api/articles?categorie=conseils");
    expect(res.status()).toBe(200);
    const data = await res.json();

    for (const article of data.articles) {
      expect(article.categorie).toBe("conseils");
    }
  });

  test("GET /api/articles/[slug] retourne le détail d'un article", async ({ request }) => {
    // Récupérer un slug réel
    const listRes = await request.get("/api/articles");
    const listData = await listRes.json();
    const slug = listData.articles[0]?.slug;
    if (!slug) return test.skip();

    const res = await request.get(`/api/articles/${slug}`);
    expect(res.status()).toBe(200);
    const article = await res.json();
    expect(article).toHaveProperty("titre");
    expect(article).toHaveProperty("contenu");
    expect(article.slug).toBe(slug);
  });

  test("GET /api/articles/slug-inexistant retourne 404", async ({ request }) => {
    const res = await request.get("/api/articles/slug-qui-nexiste-vraiment-pas");
    expect(res.status()).toBe(404);
  });
});

test.describe("Blog — Pages", () => {
  test("/blog se charge et affiche des articles", async ({ page }) => {
    const res = await page.goto("/blog");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("/blog/[slug] se charge et affiche le contenu", async ({ page, request }) => {
    const res = await request.get("/api/articles");
    const data = await res.json();
    const slug = data.articles[0]?.slug;
    if (!slug) return test.skip();

    const pageRes = await page.goto(`/blog/${slug}`);
    expect(pageRes?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });
});
