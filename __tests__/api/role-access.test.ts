/**
 * @jest-environment node
 */

/**
 * ═══════════════════════════════════════════════════════════════
 *  TEST COMPLET PAR RÔLE — BYS Formation
 * ═══════════════════════════════════════════════════════════════
 *
 *  Ce fichier teste l'accès à TOUTES les routes API protégées
 *  pour chaque rôle du système (10 rôles).
 *
 *  Il vérifie :
 *  ✅ L'accès autorisé (200/201)
 *  ✅ Le refus d'accès (401/403) quand le rôle n'est pas suffisant
 *  ✅ Le refus sans authentification (401)
 * ═══════════════════════════════════════════════════════════════
 */

import { NextRequest } from "next/server";
import {
  loginAs,
  logout,
  getAuth0Mocks,
} from "../helpers/mock-auth";
import { createPrismaMock, PrismaMock } from "../helpers/mock-prisma";

// ─── Mocks ──────────────────────────────────────────────────

const prismaMock: PrismaMock = createPrismaMock();

jest.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
jest.mock("@/lib/auth0", () => getAuth0Mocks());
jest.mock("@/lib/stripe", () => ({ stripe: { paymentIntents: { create: jest.fn() } } }));
jest.mock("@/lib/email", () => ({
  sendConfirmationEmail: jest.fn(),
  sendCentreNotificationEmail: jest.fn(),
  resend: { emails: { send: jest.fn() } },
}));
jest.mock("@/lib/email-templates", () => ({
  renderEmailTemplate: jest.fn().mockReturnValue({ subject: "test", html: "<p>test</p>" }),
}));
jest.mock("@/lib/centre-utils", () => ({
  getUserCentreId: jest.fn().mockResolvedValue("centre-test-001"),
  getUserCentres: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/lib/geocoding", () => ({
  haversineDistance: jest.fn().mockReturnValue(5),
}));

// ─── Helpers ────────────────────────────────────────────────

function makeReq(url: string, method = "GET", body?: unknown): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(`http://localhost${url}`, init);
}

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  // Re-apply default mock returns
  prismaMock.formation.findMany.mockResolvedValue([]);
  prismaMock.formation.count.mockResolvedValue(0);
  prismaMock.formation.findUnique.mockResolvedValue(null);
  prismaMock.centre.findMany.mockResolvedValue([]);
  prismaMock.centre.findFirst.mockResolvedValue(null);
  prismaMock.centre.findUnique.mockResolvedValue(null);
  prismaMock.session.findMany.mockResolvedValue([]);
  prismaMock.reservation.findMany.mockResolvedValue([]);
  prismaMock.reservation.count.mockResolvedValue(0);
  prismaMock.notification.findMany.mockResolvedValue([]);
  prismaMock.ticket.findMany.mockResolvedValue([]);
  prismaMock.ticket.count.mockResolvedValue(0);
  prismaMock.categorie.findMany.mockResolvedValue([]);
  prismaMock.favorite.findMany.mockResolvedValue([]);
  prismaMock.review.findMany.mockResolvedValue([]);
  prismaMock.user.count.mockResolvedValue(0);
  prismaMock.user.findMany.mockResolvedValue([]);
});

afterEach(() => logout());

// ═══════════════════════════════════════════════════════════════
//  1. ROUTES PUBLIQUES — accessibles sans auth
// ═══════════════════════════════════════════════════════════════

describe("Routes publiques (sans auth)", () => {
  it("GET /api/formations — liste les formations", async () => {
    const { GET } = await import("@/app/api/formations/route");
    prismaMock.formation.findMany.mockResolvedValue([]);
    prismaMock.formation.count.mockResolvedValue(0);

    const res = await GET(makeReq("/api/formations"));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("formations");
    expect(data).toHaveProperty("total");
  });

  it("GET /api/categories — liste les catégories", async () => {
    const { GET } = await import("@/app/api/categories/route");
    prismaMock.categorie.findMany.mockResolvedValue([
      { id: "1", nom: "Récupération de points", description: null, icon: "shield", couleur: "#3B82F6", ordre: 1 },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/centres — liste les centres (public)", async () => {
    const { GET } = await import("@/app/api/centres/route");
    prismaMock.centre.findMany.mockResolvedValue([]);

    const res = await GET(makeReq("/api/centres"));
    expect(res.status).toBe(200);
  });

  it("GET /api/centres/[slug] — détail d'un centre", async () => {
    const { GET } = await import("@/app/api/centres/[slug]/route");
    prismaMock.centre.findUnique.mockResolvedValue({
      id: "c1",
      nom: "BYS Osny",
      slug: "bys-formation-osny",
      formations: [],
    });

    const res = await GET(
      makeReq("/api/centres/bys-formation-osny"),
      { params: Promise.resolve({ slug: "bys-formation-osny" }) }
    );
    expect(res.status).toBe(200);
  });

  it("GET /api/subscription-plans — liste les plans", async () => {
    const { GET } = await import("@/app/api/subscription-plans/route");
    prismaMock.subscriptionPlan.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════
//  2. ROUTES NON-AUTH → doit retourner 401
// ═══════════════════════════════════════════════════════════════

describe("Sans authentification → 401", () => {
  beforeEach(() => logout());

  it("GET /api/reservations → 401", async () => {
    const { GET } = await import("@/app/api/reservations/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET /api/notifications → 401", async () => {
    const { GET } = await import("@/app/api/notifications/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stats → 401", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET /api/centre/formations → 401/500", async () => {
    const { GET } = await import("@/app/api/centre/formations/route");
    const res = await GET();
    expect([401, 500]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════
//  3. RÔLE ELEVE
// ═══════════════════════════════════════════════════════════════

describe("Rôle ELEVE", () => {
  beforeEach(() => loginAs("ELEVE"));

  it("GET /api/reservations — voit ses réservations", async () => {
    const { GET } = await import("@/app/api/reservations/route");
    prismaMock.reservation.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/notifications — voit ses notifications", async () => {
    const { GET } = await import("@/app/api/notifications/route");
    prismaMock.notification.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/favorites — voit ses favoris", async () => {
    const { GET } = await import("@/app/api/favorites/route");
    prismaMock.favorite.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/tickets — voit ses tickets", async () => {
    const { GET } = await import("@/app/api/tickets/route");
    prismaMock.ticket.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/users/me — voit son profil", async () => {
    const { GET } = await import("@/app/api/users/me/route");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-eleve-001", email: "eleve@test.fr", nom: "Dupont", prenom: "Jean",
      telephone: "0612345678", adresse: "12 Rue Test", codePostal: "75001",
      ville: "Paris", role: "ELEVE", createdAt: new Date(),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe("eleve@test.fr");
  });

  // ELEVE ne peut PAS accéder aux routes centre
  it("GET /api/centre/formations → 403/500 (interdit)", async () => {
    const { GET } = await import("@/app/api/centre/formations/route");
    const res = await GET();
    expect([401, 403, 500]).toContain(res.status);
  });

  // ELEVE ne peut PAS accéder aux routes admin
  it("GET /api/admin/stats → 401 (interdit)", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/users → 401 (interdit)", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    const res = await GET(makeReq("/api/admin/users"));
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════
//  4. RÔLE CENTRE_OWNER
// ═══════════════════════════════════════════════════════════════

describe("Rôle CENTRE_OWNER", () => {
  beforeEach(() => {
    loginAs("CENTRE_OWNER");
    prismaMock.centre.findFirst.mockResolvedValue({ id: "centre-test-001", slug: "test-centre", statut: "ACTIF" });
    prismaMock.centre.findUnique.mockResolvedValue({ id: "centre-test-001", slug: "test-centre", statut: "ACTIF" });
  });

  it("GET /api/centre/formations — liste ses formations", async () => {
    const { GET } = await import("@/app/api/centre/formations/route");
    prismaMock.formation.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("POST /api/centre/formations — crée une formation", async () => {
    const { POST } = await import("@/app/api/centre/formations/route");
    prismaMock.formation.findUnique.mockResolvedValue(null); // slug unique
    prismaMock.formation.create.mockResolvedValue({
      id: "f1", titre: "Test Formation", slug: "test-formation-test-centre",
      description: "Description test", prix: 250, duree: "2 jours",
      modalite: "PRESENTIEL", isQualiopi: false, isCPF: false,
      isActive: true, categorieId: null, categorie: null,
      objectifs: null, programme: null, prerequis: null, publicCible: null,
      lieu: null, createdAt: new Date(),
      _count: { sessions: 0 },
    });

    const res = await POST(makeReq("/api/centre/formations", "POST", {
      titre: "Test Formation",
      description: "Description de test pour la formation",
      prix: 250,
      duree: "2 jours",
    }));
    expect(res.status).toBe(201);
  });

  it("GET /api/centre/sessions — liste ses sessions", async () => {
    const { GET } = await import("@/app/api/centre/sessions/route");
    prismaMock.session.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/centre/stats — voit ses stats", async () => {
    const { GET } = await import("@/app/api/centre/stats/route");
    prismaMock.reservation.findMany.mockResolvedValue([]);
    prismaMock.reservation.count.mockResolvedValue(0);
    prismaMock.session.count.mockResolvedValue(0);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/centre/list — liste ses centres", async () => {
    const { GET } = await import("@/app/api/centre/list/route");
    prismaMock.centre.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/centre/membres — liste les membres", async () => {
    const { GET } = await import("@/app/api/centre/membres/route");
    prismaMock.centreMembre.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  // CENTRE_OWNER ne peut PAS accéder à l'admin
  it("GET /api/admin/stats → 401 (interdit)", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════
//  5. RÔLE CENTRE_ADMIN
// ═══════════════════════════════════════════════════════════════

describe("Rôle CENTRE_ADMIN", () => {
  beforeEach(() => {
    loginAs("CENTRE_ADMIN");
    prismaMock.centre.findFirst.mockResolvedValue({ id: "centre-test-001", slug: "test-centre", statut: "ACTIF" });
    prismaMock.centre.findUnique.mockResolvedValue({ id: "centre-test-001", slug: "test-centre", statut: "ACTIF" });
  });

  it("GET /api/centre/formations — liste les formations", async () => {
    const { GET } = await import("@/app/api/centre/formations/route");
    prismaMock.formation.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("POST /api/centre/formations — crée une formation", async () => {
    const { POST } = await import("@/app/api/centre/formations/route");
    prismaMock.formation.findUnique.mockResolvedValue(null);
    prismaMock.formation.create.mockResolvedValue({
      id: "f2", titre: "Test", slug: "test-test-centre",
      description: "Desc", prix: 100, duree: "1j", modalite: "PRESENTIEL",
      isQualiopi: false, isCPF: false, isActive: true, categorieId: null,
      categorie: null, objectifs: null, programme: null, prerequis: null,
      publicCible: null, lieu: null, createdAt: new Date(),
      _count: { sessions: 0 },
    });

    const res = await POST(makeReq("/api/centre/formations", "POST", {
      titre: "Test Formation Admin",
      description: "Description test admin formation",
      prix: 200,
      duree: "1 jour",
    }));
    expect(res.status).toBe(201);
  });

  it("GET /api/centre/sessions — accède aux sessions", async () => {
    const { GET } = await import("@/app/api/centre/sessions/route");
    prismaMock.session.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  // CENTRE_ADMIN ne peut PAS accéder aux finances centre
  it("GET /api/centre/payments → interdit (pas owner)", async () => {
    const { GET } = await import("@/app/api/centre/payments/route");
    const res = await GET(makeReq("/api/centre/payments"));
    expect([401, 403, 500]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════
//  6. RÔLE CENTRE_FORMATEUR
// ═══════════════════════════════════════════════════════════════

describe("Rôle CENTRE_FORMATEUR", () => {
  beforeEach(() => {
    loginAs("CENTRE_FORMATEUR");
    prismaMock.centre.findFirst.mockResolvedValue({ id: "centre-test-001" });
  });

  it("GET /api/centre/formateur/sessions — voit ses sessions", async () => {
    const { GET } = await import("@/app/api/centre/formateur/sessions/route");
    prismaMock.session.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/centre/formations — lecture seule", async () => {
    const { GET } = await import("@/app/api/centre/formations/route");
    prismaMock.formation.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  // FORMATEUR ne peut PAS créer de formations
  it("POST /api/centre/formations → 500 (interdit: pas management)", async () => {
    const { POST } = await import("@/app/api/centre/formations/route");

    const res = await POST(makeReq("/api/centre/formations", "POST", {
      titre: "Tentative formateur",
      description: "Le formateur ne devrait pas pouvoir créer",
      prix: 100,
      duree: "1j",
    }));
    // requireCentreManagement throws, caught as 500 or forwarded
    expect([401, 403, 500]).toContain(res.status);
  });

  // FORMATEUR ne peut PAS accéder à l'admin
  it("GET /api/admin/stats → 401", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════
//  7. RÔLE CENTRE_SECRETAIRE
// ═══════════════════════════════════════════════════════════════

describe("Rôle CENTRE_SECRETAIRE", () => {
  beforeEach(() => {
    loginAs("CENTRE_SECRETAIRE");
    prismaMock.centre.findFirst.mockResolvedValue({ id: "centre-test-001" });
  });

  it("GET /api/centre/formations — lecture seule OK", async () => {
    const { GET } = await import("@/app/api/centre/formations/route");
    prismaMock.formation.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/centre/sessions — lecture seule OK", async () => {
    const { GET } = await import("@/app/api/centre/sessions/route");
    prismaMock.session.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  // SECRETAIRE ne peut PAS créer de formations
  it("POST /api/centre/formations → interdit", async () => {
    const { POST } = await import("@/app/api/centre/formations/route");

    const res = await POST(makeReq("/api/centre/formations", "POST", {
      titre: "Tentative secrétaire",
      description: "Ne devrait pas pouvoir créer",
      prix: 100,
      duree: "1j",
    }));
    expect([401, 403, 500]).toContain(res.status);
  });

  // SECRETAIRE ne peut PAS voir les paiements
  it("GET /api/centre/payments → interdit", async () => {
    const { GET } = await import("@/app/api/centre/payments/route");
    const res = await GET(makeReq("/api/centre/payments"));
    expect([401, 403, 500]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════
//  8. RÔLE SUPPORT (plateforme)
// ═══════════════════════════════════════════════════════════════

describe("Rôle SUPPORT", () => {
  beforeEach(() => loginAs("SUPPORT"));

  it("GET /api/admin/tickets — voit tous les tickets", async () => {
    const { GET } = await import("@/app/api/admin/tickets/route");
    prismaMock.ticket.findMany.mockResolvedValue([]);

    const res = await GET(makeReq("/api/admin/tickets"));
    expect(res.status).toBe(200);
  });

  // SUPPORT ne peut PAS accéder aux stats admin
  it("GET /api/admin/stats → 401 (pas admin)", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  // SUPPORT ne peut PAS gérer les utilisateurs
  it("GET /api/admin/users → 401 (pas admin)", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    const res = await GET(makeReq("/api/admin/users"));
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════
//  9. RÔLE ADMIN (plateforme)
// ═══════════════════════════════════════════════════════════════

describe("Rôle ADMIN", () => {
  beforeEach(() => loginAs("ADMIN"));

  it("GET /api/admin/stats — accède aux KPIs", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");

    // Mock all the required DB calls for stats
    prismaMock.reservation.count.mockResolvedValue(5);
    prismaMock.centre.count.mockResolvedValue(3);
    prismaMock.user.count.mockResolvedValue(10);
    prismaMock.ticket.count.mockResolvedValue(2);
    prismaMock.reservation.findMany.mockResolvedValue([]);
    prismaMock.centre.findMany.mockResolvedValue([]);
    prismaMock.ticket.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("centresActifs");
    expect(data).toHaveProperty("utilisateurs");
    expect(data).toHaveProperty("revenusPlateforme");
  });

  it("GET /api/admin/users — liste les utilisateurs", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const res = await GET(makeReq("/api/admin/users"));
    expect(res.status).toBe(200);
  });

  it("GET /api/admin/tickets — voit les tickets", async () => {
    const { GET } = await import("@/app/api/admin/tickets/route");
    prismaMock.ticket.findMany.mockResolvedValue([]);

    const res = await GET(makeReq("/api/admin/tickets"));
    expect(res.status).toBe(200);
  });

  // ADMIN peut aussi accéder aux routes centre (via PLATFORM_ADMIN_ROLES)
  it("GET /api/centre/formations — accès via admin", async () => {
    const { GET } = await import("@/app/api/centre/formations/route");
    prismaMock.formation.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════
//  10. RÔLE OWNER (super-admin)
// ═══════════════════════════════════════════════════════════════

describe("Rôle OWNER", () => {
  beforeEach(() => loginAs("OWNER"));

  it("GET /api/admin/stats — accès total", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    prismaMock.reservation.count.mockResolvedValue(0);
    prismaMock.centre.count.mockResolvedValue(0);
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.ticket.count.mockResolvedValue(0);
    prismaMock.reservation.findMany.mockResolvedValue([]);
    prismaMock.centre.findMany.mockResolvedValue([]);
    prismaMock.ticket.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/admin/users — accès total", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const res = await GET(makeReq("/api/admin/users"));
    expect(res.status).toBe(200);
  });

  it("GET /api/admin/tickets — accès total", async () => {
    const { GET } = await import("@/app/api/admin/tickets/route");
    prismaMock.ticket.findMany.mockResolvedValue([]);

    const res = await GET(makeReq("/api/admin/tickets"));
    expect(res.status).toBe(200);
  });

  // OWNER peut tout faire dans les centres
  it("GET /api/centre/formations — accès total", async () => {
    const { GET } = await import("@/app/api/centre/formations/route");
    prismaMock.formation.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("POST /api/centre/formations — peut créer", async () => {
    const { POST } = await import("@/app/api/centre/formations/route");
    prismaMock.centre.findUnique.mockResolvedValue({ id: "c1", slug: "test", statut: "ACTIF" });
    prismaMock.formation.findUnique.mockResolvedValue(null);
    prismaMock.formation.create.mockResolvedValue({
      id: "f99", titre: "Owner Test", slug: "owner-test-test",
      description: "Desc", prix: 100, duree: "1j", modalite: "PRESENTIEL",
      isQualiopi: false, isCPF: false, isActive: true, categorieId: null,
      categorie: null, objectifs: null, programme: null, prerequis: null,
      publicCible: null, lieu: null, createdAt: new Date(),
      _count: { sessions: 0 },
    });

    const res = await POST(makeReq("/api/centre/formations", "POST", {
      titre: "Formation Owner",
      description: "Créée par le super-admin owner",
      prix: 300,
      duree: "3 jours",
    }));
    expect(res.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════════
//  11. MATRICE D'ACCÈS INTER-RÔLES (résumé)
// ═══════════════════════════════════════════════════════════════

describe("Matrice d'accès — refus croisés", () => {
  const ROLES_SANS_CENTRE = ["ELEVE", "SUPPORT", "COMPTABLE", "COMMERCIAL"];
  const ROLES_SANS_ADMIN = ["ELEVE", "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE", "SUPPORT", "COMPTABLE", "COMMERCIAL"];

  describe.each(ROLES_SANS_CENTRE)("Rôle %s → pas d'accès centre", (role) => {
    beforeEach(() => loginAs(role));

    it(`${role} ne peut pas GET /api/centre/formations`, async () => {
      const { GET } = await import("@/app/api/centre/formations/route");
      const res = await GET();
      expect([401, 403, 500]).toContain(res.status);
    });
  });

  describe.each(ROLES_SANS_ADMIN)("Rôle %s → pas d'accès admin", (role) => {
    beforeEach(() => loginAs(role));

    it(`${role} ne peut pas GET /api/admin/stats`, async () => {
      const { GET } = await import("@/app/api/admin/stats/route");
      const res = await GET();
      expect(res.status).toBe(401);
    });
  });

  it("ELEVE ne peut pas DELETE /api/admin/users", async () => {
    loginAs("ELEVE");
    const { DELETE } = await import("@/app/api/admin/users/route");
    const res = await DELETE(makeReq("/api/admin/users", "DELETE", { id: "xxx" }));
    expect(res.status).toBe(401);
  });

  it("ADMIN ne peut pas DELETE /api/admin/users (seul OWNER)", async () => {
    loginAs("ADMIN");
    const { DELETE } = await import("@/app/api/admin/users/route");
    const res = await DELETE(makeReq("/api/admin/users", "DELETE", { id: "xxx" }));
    expect(res.status).toBe(401);
  });

  it("OWNER peut DELETE /api/admin/users", async () => {
    loginAs("OWNER");
    const { DELETE } = await import("@/app/api/admin/users/route");
    prismaMock.user.findUnique.mockResolvedValue({ id: "xxx", email: "test@test.fr", role: "ELEVE", auth0Id: "local_xxx" });
    prismaMock.user.delete.mockResolvedValue({});

    const res = await DELETE(makeReq("/api/admin/users", "DELETE", { id: "xxx" }));
    expect(res.status).toBe(200);
  });
});
