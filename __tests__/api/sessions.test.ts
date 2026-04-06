/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    formation: {
      findFirst: jest.fn(),
    },
    centre: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth0", () => ({
  requireCentre: jest.fn(),
}));

jest.mock("@/lib/centre-utils", () => ({
  getUserCentreId: jest.fn().mockResolvedValue("centre_1"),
}));

import { prisma } from "@/lib/prisma";
import { GET as getById } from "@/app/api/sessions/[id]/route";
import { GET as getSessions, POST as postSession } from "@/app/api/sessions/route";
import { requireCentre } from "@/lib/auth0";

const mockSession = {
  id: "sess_1",
  dateDebut: new Date("2026-04-01T09:00:00"),
  dateFin: new Date("2026-04-02T17:00:00"),
  placesRestantes: 8,
  placesTotal: 15,
  status: "ACTIVE",
  formation: {
    titre: "Stage récupération de points",
    duree: "2 jours",
    prix: 250,
    isQualiopi: true,
    isCPF: false,
    centre: {
      nom: "BYS Formation Osny",
      ville: "Osny",
      adresse: "Bât. 7, 9 Chaussée Jules César",
      codePostal: "95520",
      telephone: "01 34 25 67 89",
    },
  },
};

describe("GET /api/sessions/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retourne les données de la session", async () => {
    (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

    const req = new NextRequest("http://localhost/api/sessions/sess_1");
    const res = await getById(req, { params: Promise.resolve({ id: "sess_1" }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("sess_1");
    expect(data.formation.titre).toBe("Stage récupération de points");
    expect(data.prix).toBe(250);
    expect(data.centre).toBe("BYS Formation Osny");
  });

  it("retourne 404 si session introuvable", async () => {
    (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/sessions/unknown");
    const res = await getById(req, { params: Promise.resolve({ id: "unknown" }) });

    expect(res.status).toBe(404);
  });

  it("retourne 500 si erreur Prisma", async () => {
    (prisma.session.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost/api/sessions/sess_1");
    const res = await getById(req, { params: Promise.resolve({ id: "sess_1" }) });

    expect(res.status).toBe(500);
  });
});

describe("GET /api/sessions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retourne les sessions actives à venir", async () => {
    (prisma.session.findMany as jest.Mock).mockResolvedValue([mockSession]);

    const req = new NextRequest("http://localhost/api/sessions");
    const res = await getSessions(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
  });

  it("filtre par formationId", async () => {
    (prisma.session.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/sessions?formationId=form_1");
    await getSessions(req);

    expect(prisma.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ formationId: "form_1" }),
      })
    );
  });
});

describe("POST /api/sessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireCentre as jest.Mock).mockResolvedValue({ id: "user_1" });
    (prisma.centre.findUnique as jest.Mock).mockResolvedValue({ id: "centre_1" });
    (prisma.formation.findFirst as jest.Mock).mockResolvedValue({ id: "form_1", centreId: "centre_1" });
    (prisma.session.create as jest.Mock).mockResolvedValue({ ...mockSession, id: "sess_new" });
  });

  it("crée une session avec données valides", async () => {
    const req = new NextRequest("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        formationId: "form_1",
        dateDebut: "2026-05-01T09:00:00.000Z",
        dateFin: "2026-05-02T17:00:00.000Z",
        placesTotal: 12,
      }),
    });

    const res = await postSession(req);
    expect(res.status).toBe(201);
  });

  it("retourne 400 si placesTotal manquant", async () => {
    const req = new NextRequest("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        formationId: "form_1",
        dateDebut: "2026-05-01T09:00:00.000Z",
        dateFin: "2026-05-02T17:00:00.000Z",
      }),
    });

    const res = await postSession(req);
    expect(res.status).toBe(400);
  });
});
