/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
  prisma: {
    promoCode: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/promo/validate/route";

// ─── Helper ───────────────────────────────────────────────────
function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/promo/validate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Promo code de reference ──────────────────────────────────
const now = new Date();
const yesterday = new Date(now.getTime() - 86400000);
const tomorrow = new Date(now.getTime() + 86400000);
const lastWeek = new Date(now.getTime() - 7 * 86400000);

const basePromo = {
  id: "promo_1",
  code: "PROMO20",
  type: "POURCENTAGE",
  valeur: 20,
  isActive: true,
  dateDebut: lastWeek,
  dateFin: tomorrow,
  maxUtilisations: 100,
  utilisations: 5,
  minAchat: null,
  description: "20% de reduction",
};

// ─────────────────────────────────────────────────────────────
//  Tests — POST /api/promo/validate
// ─────────────────────────────────────────────────────────────

describe("POST /api/promo/validate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Code valide (pourcentage) ───────────────────────────
  it("retourne la reduction correcte pour un code pourcentage valide", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(basePromo);

    const res = await POST(makeReq({ code: "PROMO20", montant: 250 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.reduction).toBe(50); // 20% de 250
    expect(data.nouveauMontant).toBe(200); // 250 - 50
    expect(data.type).toBe("POURCENTAGE");
  });

  // ─── Code valide (montant fixe) ──────────────────────────
  it("retourne la reduction correcte pour un code montant fixe", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      code: "MOINS30",
      type: "MONTANT_FIXE",
      valeur: 30,
    });

    const res = await POST(makeReq({ code: "MOINS30", montant: 250 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.reduction).toBe(30);
    expect(data.nouveauMontant).toBe(220);
  });

  // ─── Montant fixe > montant de l'achat ───────────────────
  it("plafonne la reduction au montant de l'achat pour un code fixe", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      type: "MONTANT_FIXE",
      valeur: 500,
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 200 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.reduction).toBe(200); // Min(500, 200)
    expect(data.nouveauMontant).toBe(0);
  });

  // ─── Code introuvable ────────────────────────────────────
  it("retourne valid=false si le code n'existe pas", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(makeReq({ code: "INEXISTANT", montant: 250 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain("introuvable");
  });

  // ─── Code inactif ────────────────────────────────────────
  it("rejette un code inactif", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      isActive: false,
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 250 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain("plus actif");
  });

  // ─── Code expire ─────────────────────────────────────────
  it("rejette un code expire (dateFin dans le passe)", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      dateFin: yesterday,
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 250 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain("expiré");
  });

  // ─── Code pas encore valide ──────────────────────────────
  it("rejette un code pas encore valide (dateDebut dans le futur)", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      dateDebut: tomorrow,
      dateFin: new Date(now.getTime() + 30 * 86400000),
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 250 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain("pas encore valide");
  });

  // ─── Max utilisations atteint ────────────────────────────
  it("rejette un code qui a atteint le nombre maximum d'utilisations", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      maxUtilisations: 10,
      utilisations: 10,
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 250 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain("maximum");
  });

  // ─── Max utilisations null (illimite) ────────────────────
  it("accepte un code avec maxUtilisations null (illimite)", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      maxUtilisations: null,
      utilisations: 9999,
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 250 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(true);
  });

  // ─── Montant minimum non atteint ─────────────────────────
  it("rejette si le montant est inferieur au minimum d'achat", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      minAchat: 300,
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 200 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain("300");
  });

  // ─── Montant minimum respecte ────────────────────────────
  it("accepte si le montant depasse le minimum d'achat", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      minAchat: 200,
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 250 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(true);
  });

  // ─── Donnees invalides ───────────────────────────────────
  it("retourne 400 si le code est manquant", async () => {
    const res = await POST(makeReq({ montant: 250 }));
    expect(res.status).toBe(400);
  });

  it("retourne 400 si le montant est manquant", async () => {
    const res = await POST(makeReq({ code: "PROMO20" }));
    expect(res.status).toBe(400);
  });

  it("retourne 400 si le montant est negatif", async () => {
    const res = await POST(makeReq({ code: "PROMO20", montant: -10 }));
    expect(res.status).toBe(400);
  });

  it("retourne 400 si le montant est zero", async () => {
    const res = await POST(makeReq({ code: "PROMO20", montant: 0 }));
    expect(res.status).toBe(400);
  });

  // ─── Conversion en majuscules ────────────────────────────
  it("convertit le code en majuscules avant la recherche", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(basePromo);

    await POST(makeReq({ code: "promo20", montant: 250 }));

    expect(prisma.promoCode.findUnique).toHaveBeenCalledWith({
      where: { code: "PROMO20" },
    });
  });

  // ─── Erreur serveur ──────────────────────────────────────
  it("retourne 500 si Prisma echoue", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    const res = await POST(makeReq({ code: "PROMO20", montant: 250 }));
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain("Erreur serveur");
  });

  // ─── Precision du calcul pourcentage ─────────────────────
  it("arrondit correctement les reductions en pourcentage", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      valeur: 15, // 15%
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 333 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.reduction).toBe(49.95); // 333 * 0.15 = 49.95
    expect(data.nouveauMontant).toBe(283.05);
  });

  // ─── Description fallback ────────────────────────────────
  it("utilise une description par defaut si le promo code n'en a pas", async () => {
    (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
      ...basePromo,
      description: null,
    });

    const res = await POST(makeReq({ code: "PROMO20", montant: 250 }));
    const data = await res.json();

    expect(data.valid).toBe(true);
    expect(data.description).toContain("PROMO20");
  });
});
