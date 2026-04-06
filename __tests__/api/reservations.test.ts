/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
  prisma: {
    reservation: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/auth0", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/stripe", () => ({
  stripe: {
    paymentIntents: {
      retrieve: jest.fn(),
    },
  },
}));

jest.mock("@/lib/email", () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendCentreNotificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { GET, POST } from "@/app/api/reservations/route";

const mockUser = { id: "user_1", email: "test@test.com", role: "ELEVE", nom: "Dupont", prenom: "Jean" };

const mockReservation = {
  id: "resa_1",
  numero: "BYS-2026-AB12",
  userId: "user_1",
  sessionId: "sess_1",
  status: "CONFIRMEE",
  montant: 250,
  commissionMontant: 25,
  stripePaymentId: "pi_test",
  createdAt: new Date("2026-03-10"),
  session: {
    dateDebut: new Date("2026-04-01T09:00:00"),
    dateFin: new Date("2026-04-02T17:00:00"),
    placesRestantes: 8,
    formation: {
      titre: "Stage récupération de points",
      slug: "stage-recup-osny",
      prix: 250,
      lieu: "Osny",
      duree: "2 jours",
      centre: { nom: "BYS Formation Osny", ville: "Osny" },
    },
  },
};

describe("GET /api/reservations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
  });

  it("retourne les réservations de l'utilisateur connecté", async () => {
    (prisma.reservation.findMany as jest.Mock).mockResolvedValue([mockReservation]);

    const req = new NextRequest("http://localhost/api/reservations");
    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].numero).toBe("BYS-2026-AB12");
  });

  it("retourne 401 si non authentifié", async () => {
    (requireAuth as jest.Mock).mockRejectedValue(new Error("Non authentifié"));

    const req = new NextRequest("http://localhost/api/reservations");
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("retourne un tableau vide si aucune réservation", async () => {
    (prisma.reservation.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/reservations");
    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(0);
  });
});

describe("POST /api/reservations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
  });

  it("retourne 400 si sessionId manquant", async () => {
    const req = new NextRequest("http://localhost/api/reservations", {
      method: "POST",
      body: JSON.stringify({
        nom: "Dupont",
        prenom: "Jean",
        email: "test@test.com",
        telephone: "0601020304",
        stripePaymentIntentId: "pi_test123",
        // sessionId manquant
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retourne 400 si email invalide", async () => {
    const req = new NextRequest("http://localhost/api/reservations", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "sess_1",
        nom: "Dupont",
        prenom: "Jean",
        email: "email-invalide",
        telephone: "0601020304",
        stripePaymentIntentId: "pi_test123",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
