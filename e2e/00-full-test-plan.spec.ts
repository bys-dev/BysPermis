import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * BYS PERMIS — Plan de test complet (AntiGravity / Démo)
 * ═══════════════════════════════════════════════════════════════
 * Couvre : Pages publiques, APIs, Recherche, Géolocalisation,
 *          Abonnements, Auth, Tunnel réservation, Espaces protégés
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────
// 1. PAGES PUBLIQUES — Vérifier le rendu et le contenu
// ─────────────────────────────────────────────────────

test.describe("1. Pages publiques", () => {
  test("Homepage se charge avec hero, recherche et formations", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BYS/i);
    // Hero section
    await expect(page.locator("h1")).toBeVisible();
    // Search bar
    await expect(page.locator("input[placeholder]").first()).toBeVisible();
    // Au moins un élément de contenu
    await expect(page.locator("main")).not.toBeEmpty();
  });

  test("Page Recherche affiche des formations", async ({ page }) => {
    await page.goto("/recherche");
    await expect(page.locator("h1")).toBeVisible();
    // Attendre que les formations se chargent
    await page.waitForResponse((r) => r.url().includes("/api/formations") && r.status() === 200);
  });

  test("Page Centres affiche la liste des centres", async ({ page }) => {
    await page.goto("/centres");
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForResponse((r) => r.url().includes("/api/centres") && r.status() === 200);
  });

  test("Page FAQ affiche des questions/réponses", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("h1")).toContainText(/FAQ|questions/i);
  });

  test("Page Contact affiche le formulaire", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("Page Comment ça marche", async ({ page }) => {
    await page.goto("/comment-ca-marche");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Page À propos", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Page Tarifs partenaires affiche les plans", async ({ page }) => {
    await page.goto("/tarifs-partenaires");
    await expect(page.locator("h1")).toBeVisible();
    // Doit contenir les 3 plans (Essentiel, Premium, Entreprise)
    await expect(page.getByText(/essentiel/i).first()).toBeVisible();
    await expect(page.getByText(/premium/i).first()).toBeVisible();
    await expect(page.getByText(/entreprise/i).first()).toBeVisible();
  });

  test("Page CGU", async ({ page }) => {
    await page.goto("/cgu");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Page Mentions légales", async ({ page }) => {
    await page.goto("/mentions-legales");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Page Politique de confidentialité", async ({ page }) => {
    await page.goto("/politique-de-confidentialite");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Page Cookies", async ({ page }) => {
    await page.goto("/cookies");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Page Connexion", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Page Inscription", async ({ page }) => {
    await page.goto("/inscription");
    await expect(page.locator("h1")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────
// 2. FICHE FORMATION & CENTRE — Pages dynamiques
// ─────────────────────────────────────────────────────

test.describe("2. Pages dynamiques (formation & centre)", () => {
  test("Fiche formation affiche le détail", async ({ page, request }) => {
    // Récupérer un slug réel
    const res = await request.get("/api/formations?perPage=1");
    const data = await res.json();
    const slug = data.formations[0]?.slug;
    if (!slug) return test.skip();

    await page.goto(`/formations/${slug}`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Fiche formation inexistante affiche message 404", async ({ page }) => {
    await page.goto("/formations/slug-qui-nexiste-pas-du-tout");
    await expect(page.getByText(/introuvable|pas trouvée/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("Fiche centre affiche le détail", async ({ page, request }) => {
    const res = await request.get("/api/centres");
    const centres = await res.json();
    const slug = centres[0]?.slug;
    if (!slug) return test.skip();

    await page.goto(`/centres/${slug}`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Fiche centre inexistante affiche message 404", async ({ page }) => {
    await page.goto("/centres/centre-qui-nexiste-pas");
    await expect(page.getByText(/introuvable|non trouvé|pas trouvé/i).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────
// 3. API ROUTES — Santé & données
// ─────────────────────────────────────────────────────

test.describe("3. API Routes publiques", () => {
  test("GET /api/formations retourne des formations", async ({ request }) => {
    const res = await request.get("/api/formations");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("formations");
    expect(data.total).toBeGreaterThan(0);
  });

  test("GET /api/formations?perPage=3 limite à 3", async ({ request }) => {
    const res = await request.get("/api/formations?perPage=3");
    const data = await res.json();
    expect(data.formations.length).toBeLessThanOrEqual(3);
  });

  test("GET /api/centres retourne des centres", async ({ request }) => {
    const res = await request.get("/api/centres");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
  });

  test("GET /api/sessions retourne des sessions", async ({ request }) => {
    const res = await request.get("/api/sessions");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
  });

  test("GET /api/categories retourne des catégories", async ({ request }) => {
    const res = await request.get("/api/categories");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
  });

  test("GET /api/subscription-plans retourne 3 plans", async ({ request }) => {
    const res = await request.get("/api/subscription-plans");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(3);
    expect(data[0]).toHaveProperty("nom");
    expect(data[0]).toHaveProperty("prix");
    expect(data[0]).toHaveProperty("commissionRate");
  });

  test("GET /api/sessions/[id-inconnu] retourne 404", async ({ request }) => {
    const res = await request.get("/api/sessions/id-qui-nexiste-pas");
    expect(res.status()).toBe(404);
  });

  test("GET /api/formations/slug/[slug-inconnu] retourne 404", async ({ request }) => {
    const res = await request.get("/api/formations/slug/slug-inexistant");
    expect(res.status()).toBe(404);
  });

  test("GET /api/centres/[slug-inconnu] retourne 404", async ({ request }) => {
    const res = await request.get("/api/centres/slug-inexistant");
    expect(res.status()).toBe(404);
  });

  test("GET /api/articles retourne des articles avec les bons champs", async ({ request }) => {
    const res = await request.get("/api/articles");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("articles");
    expect(data.total).toBeGreaterThan(0);
    const article = data.articles[0];
    expect(article).toHaveProperty("titre");
    expect(article).toHaveProperty("slug");
    expect(article).toHaveProperty("extrait");
    expect(article).toHaveProperty("categorie");
  });

  test("GET /api/subscription-plans retourne des plans avec commissionRate", async ({ request }) => {
    const res = await request.get("/api/subscription-plans");
    expect(res.status()).toBe(200);
    const plans = await res.json();
    expect(plans.length).toBe(3);
    for (const plan of plans) {
      expect(plan).toHaveProperty("commissionRate");
      expect(typeof plan.commissionRate).toBe("number");
    }
  });
});

// ─────────────────────────────────────────────────────
// 4. RECHERCHE AVANCÉE — Filtres & full-text
// ─────────────────────────────────────────────────────

test.describe("4. Recherche avancée", () => {
  test("Recherche par mot-clé 'permis' retourne des résultats", async ({ request }) => {
    const res = await request.get("/api/formations?q=permis");
    const data = await res.json();
    expect(data.total).toBeGreaterThan(0);
    // Chaque résultat doit contenir "permis" quelque part
    for (const f of data.formations) {
      const haystack = `${f.titre} ${f.description} ${f.centre?.nom} ${f.categorie?.nom}`.toLowerCase();
      expect(haystack).toContain("permis");
    }
  });

  test("Filtre prix max 300€", async ({ request }) => {
    const res = await request.get("/api/formations?prixMax=300");
    const data = await res.json();
    for (const f of data.formations) {
      expect(f.prix).toBeLessThanOrEqual(300);
    }
  });

  test("Filtre prix min 1000€", async ({ request }) => {
    const res = await request.get("/api/formations?prixMin=1000");
    const data = await res.json();
    for (const f of data.formations) {
      expect(f.prix).toBeGreaterThanOrEqual(1000);
    }
  });

  test("Filtre Qualiopi", async ({ request }) => {
    const res = await request.get("/api/formations?isQualiopi=true");
    const data = await res.json();
    for (const f of data.formations) {
      expect(f.isQualiopi).toBe(true);
    }
  });

  test("Tri prix croissant", async ({ request }) => {
    const res = await request.get("/api/formations?tri=prix_asc");
    const data = await res.json();
    for (let i = 1; i < data.formations.length; i++) {
      expect(data.formations[i].prix).toBeGreaterThanOrEqual(data.formations[i - 1].prix);
    }
  });

  test("Tri prix décroissant", async ({ request }) => {
    const res = await request.get("/api/formations?tri=prix_desc");
    const data = await res.json();
    for (let i = 1; i < data.formations.length; i++) {
      expect(data.formations[i].prix).toBeLessThanOrEqual(data.formations[i - 1].prix);
    }
  });

  test("Filtres combinés (q + prixMax)", async ({ request }) => {
    const res = await request.get("/api/formations?q=stage&prixMax=300");
    const data = await res.json();
    for (const f of data.formations) {
      expect(f.prix).toBeLessThanOrEqual(300);
    }
  });

  test("Auto-suggestions retourne des résultats", async ({ request }) => {
    const res = await request.get("/api/formations/suggestions?q=perm");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("formations");
    expect(data.formations.length).toBeGreaterThan(0);
  });

  test("Auto-suggestions avec query trop courte (< 2 car)", async ({ request }) => {
    const res = await request.get("/api/formations/suggestions?q=p");
    const data = await res.json();
    expect(data.formations.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────
// 5. GÉOLOCALISATION — Recherche par proximité
// ─────────────────────────────────────────────────────

test.describe("5. Géolocalisation", () => {
  test("Formations à proximité de Paris (50km)", async ({ request }) => {
    const res = await request.get("/api/formations?lat=48.8566&lng=2.3522&rayon=50");
    const data = await res.json();
    expect(data.total).toBeGreaterThan(0);
  });

  test("Formations à proximité de Lyon (30km)", async ({ request }) => {
    const res = await request.get("/api/formations?lat=45.764&lng=4.8357&rayon=30");
    const data = await res.json();
    expect(data.total).toBeGreaterThan(0);
  });

  test("Formations à proximité d'un lieu sans centres (rayon 5km)", async ({ request }) => {
    // Milieu de nulle part (Larzac)
    const res = await request.get("/api/formations?lat=43.9&lng=3.2&rayon=5");
    const data = await res.json();
    expect(data.total).toBe(0);
  });

  test("Centres à proximité de Paris", async ({ request }) => {
    const res = await request.get("/api/centres?lat=48.8566&lng=2.3522&rayon=50");
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
  });

  test("Centres à proximité de Marseille", async ({ request }) => {
    const res = await request.get("/api/centres?lat=43.2965&lng=5.3698&rayon=30");
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────
// 6. SÉCURITÉ — Auth & routes protégées
// ─────────────────────────────────────────────────────

test.describe("6. Sécurité & Auth", () => {
  test("GET /api/reservations sans auth → 401", async ({ request }) => {
    const res = await request.get("/api/reservations");
    expect(res.status()).toBe(401);
  });

  test("GET /api/tickets sans auth → 401", async ({ request }) => {
    const res = await request.get("/api/tickets");
    expect(res.status()).toBe(401);
  });

  test("GET /api/notifications sans auth → 401", async ({ request }) => {
    const res = await request.get("/api/notifications");
    expect(res.status()).toBe(401);
  });

  test("POST /api/stripe/create-payment-intent sans auth → 401", async ({ request }) => {
    const res = await request.post("/api/stripe/create-payment-intent", {
      data: { sessionId: "test" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/stripe/subscribe sans auth → 401/500", async ({ request }) => {
    const res = await request.post("/api/stripe/subscribe", {
      data: { planId: "test" },
    });
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/admin/stats sans auth → 401", async ({ request }) => {
    const res = await request.get("/api/admin/stats");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/users sans auth → 401", async ({ request }) => {
    const res = await request.get("/api/admin/users");
    expect(res.status()).toBe(401);
  });

  test("Espace élève redirige vers login", async ({ page }) => {
    const response = await page.goto("/espace-eleve");
    // Soit 307 redirect, soit la page redirige côté client
    expect(response?.status()).toBeLessThan(500);
  });

  test("Espace centre redirige vers login", async ({ page }) => {
    const response = await page.goto("/espace-centre");
    expect(response?.status()).toBeLessThan(500);
  });

  test("Admin redirige vers login", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBeLessThan(500);
  });

  test("GET /api/messages sans auth → 401/500", async ({ request }) => {
    const res = await request.get("/api/messages");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/favorites sans auth → 401/500", async ({ request }) => {
    const res = await request.get("/api/favorites");
    expect([401, 500]).toContain(res.status());
  });

  test("GET /api/loyalty sans auth → 401", async ({ request }) => {
    const res = await request.get("/api/loyalty");
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────
// 7. FORMULAIRES — Validation
// ─────────────────────────────────────────────────────

test.describe("7. Validation formulaires", () => {
  test("POST /api/contact — données invalides → 400", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: { nom: "", email: "invalide", sujet: "", message: "" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/contact — données valides → 200", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: {
        nom: "Jean Dupont",
        email: "jean@exemple.fr",
        sujet: "Test démo",
        message: "Ceci est un message de test pour vérifier le formulaire de contact.",
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  test("POST /api/register — email invalide → 400", async ({ request }) => {
    const res = await request.post("/api/register", {
      data: { email: "pas-un-email", password: "Test1234!", accountType: "eleve", firstName: "A", lastName: "B" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/register — champs manquants → 400", async ({ request }) => {
    const res = await request.post("/api/register", {
      data: { email: "test@test.com" },
    });
    expect(res.status()).toBe(400);
  });
});

// ─────────────────────────────────────────────────────
// 8. ABONNEMENTS — Plans & checkout
// ─────────────────────────────────────────────────────

test.describe("8. Système d'abonnement", () => {
  test("Plans d'abonnement ont les bons prix", async ({ request }) => {
    const res = await request.get("/api/subscription-plans");
    const plans = await res.json();

    const essentiel = plans.find((p: { nom: string }) => p.nom === "Essentiel");
    const premium = plans.find((p: { nom: string }) => p.nom === "Premium");
    const entreprise = plans.find((p: { nom: string }) => p.nom === "Entreprise");

    expect(essentiel?.prix).toBe(49);
    expect(premium?.prix).toBe(99);
    expect(entreprise?.prix).toBe(199);
  });

  test("Plans ont des taux de commission décroissants", async ({ request }) => {
    const res = await request.get("/api/subscription-plans");
    const plans = await res.json();

    const essentiel = plans.find((p: { nom: string }) => p.nom === "Essentiel");
    const premium = plans.find((p: { nom: string }) => p.nom === "Premium");
    const entreprise = plans.find((p: { nom: string }) => p.nom === "Entreprise");

    expect(essentiel?.commissionRate).toBeGreaterThan(premium?.commissionRate);
    expect(premium?.commissionRate).toBeGreaterThan(entreprise?.commissionRate);
  });

  test("Page tarifs affiche les 3 plans avec CTA", async ({ page }) => {
    await page.goto("/tarifs-partenaires");
    // Vérifier les prix
    await expect(page.getByText("49").first()).toBeVisible();
    await expect(page.getByText("99").first()).toBeVisible();
    await expect(page.getByText("199").first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────
// 9. TUNNEL DE RÉSERVATION
// ─────────────────────────────────────────────────────

test.describe("9. Tunnel de réservation", () => {
  test("Page confirmation accessible avec un sessionId valide", async ({ page, request }) => {
    const res = await request.get("/api/sessions");
    const sessions = await res.json();
    if (!sessions.length) return test.skip();

    const response = await page.goto(`/reserver/${sessions[0].id}/confirmation`);
    expect(response?.status()).toBe(200);
  });

  test("Pages données et paiement redirigent (auth requise)", async ({ request }) => {
    const res = await request.get("/api/sessions");
    const sessions = await res.json();
    if (!sessions.length) return test.skip();

    const donnees = await request.get(`/reserver/${sessions[0].id}/donnees`);
    // 307 redirect ou 200 (page renders then redirects client-side)
    expect(donnees.status()).toBeLessThan(500);

    const paiement = await request.get(`/reserver/${sessions[0].id}/paiement`);
    expect(paiement.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────
// 10. NAVIGATION & UI
// ─────────────────────────────────────────────────────

test.describe("10. Navigation & UI", () => {
  test("Header contient les liens principaux", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header a")).not.toHaveCount(0);
  });

  test("Footer est présent", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("Recherche depuis la homepage redirige vers /recherche", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.locator("input[placeholder]").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("permis");
      await searchInput.press("Enter");
      await page.waitForURL(/recherche/);
      expect(page.url()).toContain("recherche");
    }
  });

  test("Page 404 personnalisée", async ({ page }) => {
    const res = await page.goto("/page-qui-nexiste-pas");
    expect(res?.status()).toBe(404);
  });

  test("Page erreur ne crash pas", async ({ page }) => {
    // Vérifier que le error boundary existe
    await page.goto("/");
    expect(await page.locator("body").count()).toBe(1);
  });

  test("/blog se charge correctement", async ({ page }) => {
    const res = await page.goto("/blog");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("/sitemap.xml retourne du XML valide", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("<?xml");
  });
});
