/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// ─── Mock Prisma ──────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
  prisma: {
    formation: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    centre: {
      findUnique: jest.fn(),
    },
  },
}));

// ─── Mock Auth0 ───────────────────────────────────────────
jest.mock("@/lib/auth0", () => ({
  requireCentre: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/formations/route";

const mockFormations = [
  {
    id: "form_1",
    titre: "Stage récupération de points",
    slug: "stage-recup-osny",
    prix: 250,
    duree: "2 jours",
    isQualiopi: true,
    isCPF: false,
    isActive: true,
    centre: { nom: "BYS Formation Osny", ville: "Osny", slug: "bys-osny", stripeOnboardingDone: true },
    categorie: { nom: "Récupération de points" },
    sessions: [],
    _count: { sessions: 3 },
  },
  {
    id: "form_2",
    titre: "FIMO Marchandises",
    slug: "fimo-osny",
    prix: 2900,
    duree: "140h",
    isQualiopi: true,
    isCPF: true,
    isActive: true,
    centre: { nom: "BYS Formation Osny", ville: "Osny", slug: "bys-osny", stripeOnboardingDone: true },
    categorie: { nom: "FIMO Marchandises" },
    sessions: [],
    _count: { sessions: 1 },
  },
];

describe("GET /api/formations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.formation.findMany as jest.Mock).mockResolvedValue(mockFormations);
    (prisma.formation.count as jest.Mock).mockResolvedValue(2);
  });

  it("retourne la liste des formations avec pagination", async () => {
    const req = new NextRequest("http://localhost/api/formations");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.formations).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
  });

  it("filtre par ville", async () => {
    const req = new NextRequest("http://localhost/api/formations?ville=Osny");
    await GET(req);

    expect(prisma.formation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({ lieu: expect.objectContaining({ contains: "Osny" }) }),
              ]),
            }),
          ]),
        }),
      })
    );
  });

  it("respecte la pagination (page + perPage)", async () => {
    const req = new NextRequest("http://localhost/api/formations?page=2&perPage=1");
    await GET(req);

    expect(prisma.formation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        take: 1,
      })
    );
  });

  it("retourne 200 même si la liste est vide", async () => {
    (prisma.formation.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.formation.count as jest.Mock).mockResolvedValue(0);

    const req = new NextRequest("http://localhost/api/formations");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.formations).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it("retourne 500 si Prisma échoue", async () => {
    (prisma.formation.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost/api/formations");
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
