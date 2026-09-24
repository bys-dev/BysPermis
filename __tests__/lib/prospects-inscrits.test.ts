/**
 * @jest-environment node
 */

// ─── Mocks ────────────────────────────────────────────────────
// `jest.mock` est hissé au-dessus des imports : la fabrique doit être
// autonome, on récupère ensuite le double via l'import du module mocké.
jest.mock("@/lib/prisma", () => ({
  prisma: {
    prospect: { findMany: jest.fn(), update: jest.fn() },
    campaignRecipient: { updateMany: jest.fn() },
    centre: { findMany: jest.fn() },
    partnerLead: { findMany: jest.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  marquerProspectsInscrits,
  rapprocherProspectsInscrits,
  normaliserEmail,
  normaliserSiret,
  MOTIF_COMPTE_CREE,
} from "@/lib/prospects/inscrits";

const prismaMock = prisma as unknown as {
  prospect: { findMany: jest.Mock; update: jest.Mock };
  campaignRecipient: { updateMany: jest.Mock };
  centre: { findMany: jest.Mock };
  partnerLead: { findMany: jest.Mock };
};

const fiche = (over: Record<string, unknown> = {}) => ({
  id: "p1",
  email: "contact@centre.fr",
  siret: null,
  statut: "RELANCE",
  inscritAt: null,
  centreId: null,
  partnerLeadId: null,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.prospect.findMany.mockResolvedValue([]);
  prismaMock.prospect.update.mockResolvedValue({});
  prismaMock.campaignRecipient.updateMany.mockResolvedValue({ count: 0 });
  prismaMock.centre.findMany.mockResolvedValue([]);
  prismaMock.partnerLead.findMany.mockResolvedValue([]);
});

// ─── Normalisation ────────────────────────────────────────────

describe("normalisation des identifiants", () => {
  it("ignore la casse et les espaces des emails, rejette ce qui n'en est pas un", () => {
    expect(normaliserEmail("  Contact@Centre.FR ")).toBe("contact@centre.fr");
    expect(normaliserEmail("")).toBeNull();
    expect(normaliserEmail(null)).toBeNull();
    expect(normaliserEmail("pas-un-email")).toBeNull();
  });

  it("ne garde que les chiffres du SIRET et refuse les valeurs trop courtes", () => {
    expect(normaliserSiret("123 456 789 00012")).toBe("12345678900012");
    expect(normaliserSiret("123456789")).toBe("123456789");
    expect(normaliserSiret("1234")).toBeNull();
    expect(normaliserSiret(undefined)).toBeNull();
  });
});

// ─── Voie immédiate ───────────────────────────────────────────

describe("marquerProspectsInscrits", () => {
  it("ne touche à rien sans identifiant exploitable", async () => {
    const res = await marquerProspectsInscrits({ emails: [null, ""], sirets: ["12"] });
    expect(res).toEqual({ marques: 0 });
    expect(prismaMock.prospect.findMany).not.toHaveBeenCalled();
  });

  it("cherche par email (casse ignorée) et par SIRET, sans jamais toucher un désabonné", async () => {
    await marquerProspectsInscrits({
      emails: ["Contact@Centre.FR", "gerant@centre.fr"],
      sirets: ["123 456 789 00012"],
      centreId: "c1",
    });

    expect(prismaMock.prospect.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: { in: ["contact@centre.fr", "gerant@centre.fr"], mode: "insensitive" } },
          { siret: { in: ["12345678900012"] } },
        ],
        statut: { not: "DESABONNE" },
      },
      select: expect.any(Object),
    });
  });

  it("passe la fiche en INSCRIT, la rattache au centre et annule ses envois en attente", async () => {
    prismaMock.prospect.findMany.mockResolvedValueOnce([fiche()]);

    const res = await marquerProspectsInscrits({ emails: ["contact@centre.fr"], centreId: "c1" });

    expect(res).toEqual({ marques: 1 });
    expect(prismaMock.prospect.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { statut: "INSCRIT", inscritAt: expect.any(Date), centreId: "c1" },
    });
    expect(prismaMock.campaignRecipient.updateMany).toHaveBeenCalledWith({
      where: { prospectId: { in: ["p1"] }, status: "EN_ATTENTE" },
      data: { status: "IGNORE", error: MOTIF_COMPTE_CREE },
    });
  });

  it("conserve la date de première détection et le centre déjà rattaché", async () => {
    const premiere = new Date("2026-09-01T10:00:00Z");
    prismaMock.prospect.findMany.mockResolvedValueOnce([
      fiche({ statut: "A_CONTACTER", inscritAt: premiere, centreId: "ancien" }),
    ]);

    await marquerProspectsInscrits({ emails: ["contact@centre.fr"], centreId: "nouveau" });

    expect(prismaMock.prospect.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { statut: "INSCRIT", inscritAt: premiere },
    });
  });

  it("ne rattache une demande partenaire qu'à une seule fiche (contrainte unique)", async () => {
    prismaMock.prospect.findMany
      // candidats
      .mockResolvedValueOnce([fiche({ id: "p1" }), fiche({ id: "p2", email: null, siret: "12345678900012" })])
      // demandes déjà rattachées
      .mockResolvedValueOnce([]);

    await marquerProspectsInscrits({
      emails: ["contact@centre.fr"],
      sirets: ["12345678900012"],
      partnerLeadId: "lead1",
    });

    const appels = prismaMock.prospect.update.mock.calls.map((c) => c[0]);
    expect(appels).toHaveLength(2);
    expect(appels[0].data).toMatchObject({ statut: "INSCRIT", partnerLeadId: "lead1" });
    expect(appels[1].data).toMatchObject({ statut: "INSCRIT" });
    expect(appels[1].data).not.toHaveProperty("partnerLeadId");
  });

  it("ne rattache pas une demande déjà liée à une autre fiche", async () => {
    prismaMock.prospect.findMany
      .mockResolvedValueOnce([fiche()])
      .mockResolvedValueOnce([{ partnerLeadId: "lead1" }]);

    await marquerProspectsInscrits({ emails: ["contact@centre.fr"], partnerLeadId: "lead1" });

    expect(prismaMock.prospect.update.mock.calls[0][0].data).not.toHaveProperty("partnerLeadId");
  });
});

// ─── Voie périodique ──────────────────────────────────────────

describe("rapprocherProspectsInscrits", () => {
  it("ne lit pas le fichier quand aucun compte n'existe", async () => {
    const res = await rapprocherProspectsInscrits();
    expect(res).toEqual({ marques: 0 });
    expect(prismaMock.prospect.findMany).not.toHaveBeenCalled();
  });

  it("ne réévalue que les fiches jamais rapprochées, hors désabonnés", async () => {
    prismaMock.centre.findMany.mockResolvedValueOnce([
      { id: "c1", email: "Contact@Centre.fr", siret: "123 456 789 00012", user: { email: "gerant@centre.fr" } },
    ]);

    await rapprocherProspectsInscrits();

    expect(prismaMock.prospect.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: { in: ["contact@centre.fr", "gerant@centre.fr"], mode: "insensitive" } },
          { siret: { in: ["12345678900012"] } },
        ],
        inscritAt: null,
        statut: { not: "DESABONNE" },
      },
      select: expect.any(Object),
    });
  });

  it("rattache chaque fiche au bon compte : le centre prime sur la demande partenaire", async () => {
    prismaMock.centre.findMany.mockResolvedValueOnce([
      { id: "c1", email: null, siret: "12345678900012", user: { email: "gerant@centre.fr" } },
    ]);
    prismaMock.partnerLead.findMany.mockResolvedValueOnce([
      { id: "lead1", email: "gerant@centre.fr", contactEmail: "autre@centre.fr", siret: null },
    ]);
    prismaMock.prospect.findMany
      .mockResolvedValueOnce([
        fiche({ id: "p1", email: "GERANT@centre.fr" }), // email du compte → centre (pas la demande)
        fiche({ id: "p2", email: null, siret: "12345678900012" }), // SIRET → centre
        fiche({ id: "p3", email: "autre@centre.fr" }), // seulement la demande
      ])
      .mockResolvedValueOnce([]);

    const res = await rapprocherProspectsInscrits();

    expect(res).toEqual({ marques: 3 });
    const parId = Object.fromEntries(prismaMock.prospect.update.mock.calls.map((c) => [c[0].where.id, c[0].data]));
    expect(parId.p1).toMatchObject({ statut: "INSCRIT", centreId: "c1" });
    expect(parId.p1).not.toHaveProperty("partnerLeadId");
    expect(parId.p2).toMatchObject({ statut: "INSCRIT", centreId: "c1" });
    expect(parId.p3).toMatchObject({ statut: "INSCRIT", partnerLeadId: "lead1" });
    expect(parId.p3).not.toHaveProperty("centreId");
    expect(prismaMock.campaignRecipient.updateMany).toHaveBeenCalledWith({
      where: { prospectId: { in: ["p1", "p2", "p3"] }, status: "EN_ATTENTE" },
      data: { status: "IGNORE", error: MOTIF_COMPTE_CREE },
    });
  });

  it("n'écrit rien quand aucune fiche ne correspond", async () => {
    prismaMock.centre.findMany.mockResolvedValueOnce([
      { id: "c1", email: "x@y.fr", siret: null, user: { email: "x@y.fr" } },
    ]);

    const res = await rapprocherProspectsInscrits();

    expect(res).toEqual({ marques: 0 });
    expect(prismaMock.prospect.update).not.toHaveBeenCalled();
    expect(prismaMock.campaignRecipient.updateMany).not.toHaveBeenCalled();
  });
});
