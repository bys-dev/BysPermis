/**
 * @jest-environment node
 */

// ─── Mocks ────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
  prisma: {
    document: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    invoice: {
      updateMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    reservation: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/storage", () => ({
  uploadFile: jest.fn(),
}));

// NB : @/lib/pdf-helpers est déjà remplacé par __tests__/helpers/pdf-helpers.mock.ts
// via le moduleNameMapper de jest.config — un jest.mock() local serait ignoré.

import { archiveFacture, archiveReservationPdf } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";

const mockDocument = prisma.document as unknown as {
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};
const mockInvoice = prisma.invoice as unknown as { updateMany: jest.Mock };
const mockReservation = prisma.reservation as unknown as { findUnique: jest.Mock };

/** Réservation minimale acceptée par renderInvoicePdfFromReservation. */
function reservationFixture() {
  return {
    id: "res_1",
    numero: "RES-1",
    montant: 230,
    nom: "Dupont",
    prenom: "Jean",
    email: "jean@test.fr",
    adresse: "1 rue A",
    codePostal: "95000",
    ville: "Cergy",
    stripePaymentId: "pi_1",
    userId: "user_1",
    user: {
      nom: "Dupont",
      prenom: "Jean",
      email: "jean@test.fr",
      adresse: null,
      codePostal: null,
      ville: null,
    },
    // Facture déjà présente → pas de création dans le helper
    invoice: {
      numero: "FAC-2026-0001",
      createdAt: new Date("2026-05-01"),
      montantHT: 230,
      tva: 0,
      montantTTC: 230,
      status: "PAYEE",
    },
    session: {
      formation: {
        titre: "Stage de récupération de points",
        centre: {
          id: "centre_1",
          nom: "BYS Osny",
          raisonSociale: null,
          siret: null,
          tva: null,
          ape: null,
          adresse: "2 rue B",
          codePostal: "95520",
          ville: "Osny",
          email: null,
          telephone: null,
          iban: null,
          bic: null,
          logo: null,
          signatureUrl: null,
          mentionsLegales: null,
          cgv: null,
        },
      },
    },
  };
}
const mockUpload = uploadFile as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("archiveReservationPdf", () => {
  const base = {
    reservationId: "res_1",
    centreId: "centre_1",
    kind: "CONVOCATION" as const,
    nom: "Convocation de stage",
    filename: "convocation-RES-1.pdf",
    buffer: Buffer.from("pdf"),
  };

  it("n'uploade pas si le document est déjà archivé (idempotence)", async () => {
    mockDocument.findFirst.mockResolvedValue({
      id: "doc_1",
      blobUrl: "https://storage/convocation.pdf",
    });

    const result = await archiveReservationPdf(base);

    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockDocument.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      url: "https://storage/convocation.pdf",
      documentId: "doc_1",
      created: false,
    });
  });

  it("complète un Document existant dépourvu de blobUrl (cas émargement legacy)", async () => {
    mockDocument.findFirst.mockResolvedValue({ id: "doc_2", blobUrl: null });
    mockUpload.mockResolvedValue({ url: "https://storage/new.pdf", storage: "cellar" });

    const result = await archiveReservationPdf(base);

    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockDocument.create).not.toHaveBeenCalled();
    expect(mockDocument.update).toHaveBeenCalledWith({
      where: { id: "doc_2" },
      data: expect.objectContaining({
        blobUrl: "https://storage/new.pdf",
        mimeType: "application/pdf",
      }),
    });
    expect(result.created).toBe(false);
    expect(result.url).toBe("https://storage/new.pdf");
  });

  it("crée le Document et uploade quand rien n'existe", async () => {
    mockDocument.findFirst.mockResolvedValue(null);
    mockUpload.mockResolvedValue({ url: "https://storage/conv.pdf", storage: "cellar" });
    mockDocument.create.mockResolvedValue({ id: "doc_3" });

    const result = await archiveReservationPdf(base);

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        pathPrefix: "reservations/res_1/archive",
        contentType: "application/pdf",
      }),
    );
    expect(result).toEqual({
      url: "https://storage/conv.pdf",
      documentId: "doc_3",
      created: true,
    });
  });

  it("assainit le nom de fichier (accents et espaces)", async () => {
    mockDocument.findFirst.mockResolvedValue(null);
    mockUpload.mockResolvedValue({ url: "https://storage/x.pdf", storage: "local" });
    mockDocument.create.mockResolvedValue({ id: "doc_4" });

    await archiveReservationPdf({ ...base, filename: "émargement du 5 mai.pdf" });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "emargement-du-5-mai.pdf" }),
    );
  });
});

describe("archiveFacture", () => {
  it("renseigne Invoice.pdfUrl seulement quand il est encore vide", async () => {
    mockReservation.findUnique.mockResolvedValue(reservationFixture());
    mockDocument.findFirst.mockResolvedValue(null);
    mockUpload.mockResolvedValue({ url: "https://storage/fac.pdf", storage: "cellar" });
    mockDocument.create.mockResolvedValue({ id: "doc_fac" });

    const result = await archiveFacture("res_1", "centre_1");

    expect(mockInvoice.updateMany).toHaveBeenCalledWith({
      where: { reservationId: "res_1", pdfUrl: null },
      data: { pdfUrl: "https://storage/fac.pdf" },
    });
    expect(result.url).toBe("https://storage/fac.pdf");
  });

  it("n'échoue pas si la mise à jour de la facture casse (archivage prioritaire)", async () => {
    mockReservation.findUnique.mockResolvedValue(reservationFixture());
    mockDocument.findFirst.mockResolvedValue(null);
    mockUpload.mockResolvedValue({ url: "https://storage/fac2.pdf", storage: "cellar" });
    mockDocument.create.mockResolvedValue({ id: "doc_fac2" });
    mockInvoice.updateMany.mockRejectedValue(new Error("DB down"));

    await expect(archiveFacture("res_1")).resolves.toMatchObject({
      url: "https://storage/fac2.pdf",
    });
  });
});
