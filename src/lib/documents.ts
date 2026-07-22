import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";
import {
  renderAttestationPdf,
  renderConvocationPdf,
  renderIndividualEmargementPdf,
  renderInvoicePdfFromReservation,
} from "@/lib/pdf-helpers";

/**
 * Archivage des documents transactionnels.
 *
 * Avant : convocation / facture / attestation / émargement étaient re-rendus à
 * chaque téléchargement et jamais persistés — aucune trace serveur immuable, et
 * un `Document` d'émargement créé avec `blobUrl` null (donc non re-téléchargeable).
 *
 * Ici : on rend le PDF une fois, on le pousse dans le storage (Cellar / Blob /
 * local) et on enregistre l'URL dans `Document.blobUrl` (+ `Invoice.pdfUrl` pour
 * les factures).
 *
 * Toutes les fonctions sont IDEMPOTENTES : si le document est déjà archivé, elles
 * retournent l'URL existante sans re-uploader. C'est ce qui permet au webhook
 * Stripe de rejouer le pipeline sans créer de doublons.
 */

/** Types de documents produits par la plateforme et archivables. */
export type ArchivableKind = "CONVOCATION" | "FACTURE" | "ATTESTATION" | "EMARGEMENT";

export interface ArchivedDocument {
  url: string;
  documentId: string;
  /** false si le document était déjà archivé (aucun upload effectué). */
  created: boolean;
}

/** Nettoie un nom de fichier pour un usage en clé de stockage. */
function safeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritiques combinantes
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Upload un PDF déjà rendu et enregistre/complète le `Document` correspondant.
 * Si un Document de ce `kind` existe déjà avec un `blobUrl`, ne fait rien.
 */
export async function archiveReservationPdf(opts: {
  reservationId: string;
  centreId?: string | null;
  kind: ArchivableKind;
  nom: string;
  filename: string;
  buffer: Buffer;
  description?: string;
}): Promise<ArchivedDocument> {
  const { reservationId, centreId, kind, nom, buffer, description } = opts;

  const existing = await prisma.document.findFirst({
    where: { reservationId, kind, direction: "CENTRE_VERS_ELEVE" },
    select: { id: true, blobUrl: true },
  });

  // Déjà archivé → on ne re-uploade pas.
  if (existing?.blobUrl) {
    return { url: existing.blobUrl, documentId: existing.id, created: false };
  }

  const { url } = await uploadFile({
    pathPrefix: `reservations/${reservationId}/archive`,
    filename: safeFilename(opts.filename),
    contentType: "application/pdf",
    buffer,
  });

  // Document créé mais sans fichier (cas historique de l'émargement) → on complète.
  if (existing) {
    await prisma.document.update({
      where: { id: existing.id },
      data: { blobUrl: url, mimeType: "application/pdf", taille: buffer.length },
    });
    return { url, documentId: existing.id, created: false };
  }

  const document = await prisma.document.create({
    data: {
      kind,
      direction: "CENTRE_VERS_ELEVE",
      nom,
      description,
      blobUrl: url,
      mimeType: "application/pdf",
      taille: buffer.length,
      status: "ENVOYE",
      reservationId,
      centreId: centreId ?? undefined,
    },
  });

  return { url, documentId: document.id, created: true };
}

/**
 * Archive la facture d'une réservation et renseigne `Invoice.pdfUrl`
 * (jusqu'ici déclaré au schéma mais jamais rempli).
 */
export async function archiveFacture(
  reservationId: string,
  centreId?: string | null,
): Promise<ArchivedDocument & { buffer: Buffer; filename: string }> {
  const pdf = await renderInvoicePdfFromReservation(reservationId);

  const archived = await archiveReservationPdf({
    reservationId,
    centreId,
    kind: "FACTURE",
    nom: `Facture ${pdf.invoiceNumero}`,
    filename: pdf.filename,
    buffer: pdf.buffer,
  });

  // Renseigne l'URL sur la facture elle-même (best-effort : l'archivage prime).
  try {
    await prisma.invoice.updateMany({
      where: { reservationId, pdfUrl: null },
      data: { pdfUrl: archived.url },
    });
  } catch (err) {
    console.error("[documents.archiveFacture] maj Invoice.pdfUrl:", err);
  }

  return { ...archived, buffer: pdf.buffer, filename: pdf.filename };
}

/** Archive la convocation d'une réservation. */
export async function archiveConvocation(
  reservationId: string,
  centreId?: string | null,
): Promise<ArchivedDocument & { buffer: Buffer; filename: string }> {
  const pdf = await renderConvocationPdf(reservationId);

  const archived = await archiveReservationPdf({
    reservationId,
    centreId,
    kind: "CONVOCATION",
    nom: "Convocation de stage",
    filename: pdf.filename,
    buffer: pdf.buffer,
  });

  return { ...archived, buffer: pdf.buffer, filename: pdf.filename };
}

/**
 * Archive l'attestation de suivi de stage (Annexe I).
 * À n'appeler que sur une réservation TERMINEE.
 */
export async function archiveAttestation(
  reservationId: string,
  centreId?: string | null,
): Promise<ArchivedDocument & { buffer: Buffer; filename: string }> {
  const pdf = await renderAttestationPdf(reservationId);

  const archived = await archiveReservationPdf({
    reservationId,
    centreId,
    kind: "ATTESTATION",
    nom: `Attestation de suivi de stage ${pdf.numeroAttestation}`,
    filename: pdf.filename,
    buffer: pdf.buffer,
  });

  return { ...archived, buffer: pdf.buffer, filename: pdf.filename };
}

/** Archive la feuille d'émargement individuelle. */
export async function archiveEmargement(
  reservationId: string,
  centreId?: string | null,
): Promise<ArchivedDocument & { buffer: Buffer; filename: string }> {
  const pdf = await renderIndividualEmargementPdf(reservationId);

  const archived = await archiveReservationPdf({
    reservationId,
    centreId,
    kind: "EMARGEMENT",
    nom: "Feuille d'émargement",
    filename: pdf.filename,
    buffer: pdf.buffer,
  });

  return { ...archived, buffer: pdf.buffer, filename: pdf.filename };
}
