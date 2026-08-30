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

// Le géocodeur distant ne doit jamais être appelé dans un test : le
// référentiel communal local suffit pour les villes courantes.
jest.mock("@/lib/geocoding", () => ({
  haversineDistance: jest.fn(() => 0),
  geocodeAddress: jest.fn().mockResolvedValue(null),
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
    centre: {
      nom: "BYS Permis Osny",
      ville: "Osny",
      codePostal: "95520",
      slug: "bys-osny",
      stripeOnboardingDone: true,
      latitude: null,
      longitude: null,
    },
    categorie: { nom: "Récupération de points" },
    sessions: [],
    _count: { sessions: 3 },
  },
  {
    id: "form_2",
    titre: "Stage récupération de points - Paris 11ème",
    slug: "stage-recup-paris-11",
    prix: 280,
    duree: "2 jours",
    isQualiopi: true,
    isCPF: false,
    isActive: true,
    centre: {
      nom: "Conduite Plus Paris",
      ville: "Paris",
      codePostal: "75011",
      slug: "conduite-plus-paris",
      stripeOnboardingDone: true,
      latitude: 48.8566,
      longitude: 2.3522,
    },
    categorie: { nom: "Récupération de points" },
    sessions: [],
    _count: { sessions: 2 },
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
    const res = await GET(req);

    const data = await res.json();
    expect(data.formations).toHaveLength(1);
    expect(data.formations[0].centre.ville).toBe("Osny");
  });

  it("filtre par ville sans tenir compte des accents ni de la casse", async () => {
    // « recherche par ville » passait par un `contains` SQL, insensible à la
    // casse mais pas aux accents : « saint etienne » ne trouvait rien.
    const res = await GET(new NextRequest("http://localhost/api/formations?ville=OSNY"));
    const data = await res.json();
    expect(data.formations).toHaveLength(1);
  });

  it("trouve « recuperation » écrit sans accent", async () => {
    const res = await GET(new NextRequest("http://localhost/api/formations?q=recuperation"));
    const data = await res.json();
    expect(data.total).toBe(2);
  });

  it("n'invente pas de résultat pour un terme absent", async () => {
    const res = await GET(new NextRequest("http://localhost/api/formations?q=plomberie"));
    const data = await res.json();
    expect(data.total).toBe(0);
  });

  it("respecte la pagination (page + perPage)", async () => {
    // La pagination s'applique après le classement : découper en base
    // renverrait la deuxième page d'un ordre qui n'est pas celui affiché.
    const res = await GET(new NextRequest("http://localhost/api/formations?page=2&perPage=1"));

    const data = await res.json();
    expect(data.formations).toHaveLength(1);
    expect(data.total).toBe(2);
    expect(data.totalPages).toBe(2);
    expect(data.page).toBe(2);
  });

  it("trie par prix croissant sur l'ensemble des résultats", async () => {
    const res = await GET(new NextRequest("http://localhost/api/formations?tri=prix_asc"));
    const data = await res.json();
    expect(data.formations.map((f: { prix: number }) => f.prix)).toEqual([250, 280]);
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
