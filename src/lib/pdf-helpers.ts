import {
  renderToBuffer,
  DocumentProps,
} from "@react-pdf/renderer";
import { createElement, JSXElementConstructor, ReactElement } from "react";
import { prisma } from "@/lib/prisma";
import { Convocation } from "@/components/pdf/Convocation";
import { Facture } from "@/components/pdf/Facture";
import { EmargementIndividuel } from "@/components/pdf/EmargementIndividuel";
import { BonAccord } from "@/components/pdf/BonAccord";
import { formatDate } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

// Logo BYS Formation utilisé en fallback quand un centre n'a pas (encore) le sien.
const DEFAULT_LOGO_URL = `${APP_URL}/colored-logo.png`;

function toAbsolute(u: string | null | undefined): string | undefined {
  if (!u) return undefined;
  return u.startsWith("http") ? u : `${APP_URL}${u}`;
}

function logoOrDefault(u: string | null | undefined): string {
  return toAbsolute(u) ?? DEFAULT_LOGO_URL;
}

/**
 * Rend la convocation PDF d'une réservation comme Buffer Node.js prêt à être
 * attaché à un email Resend.
 */
export async function renderConvocationPdf(reservationIdOrNumero: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const reservation = await prisma.reservation.findFirst({
    where: { OR: [{ id: reservationIdOrNumero }, { numero: reservationIdOrNumero }] },
    include: {
      session: { include: { formation: { include: { centre: true } } } },
    },
  });
  if (!reservation) throw new Error(`Réservation introuvable: ${reservationIdOrNumero}`);

  const { session } = reservation;
  const { formation } = session;
  const centre = formation.centre;

  const data = {
    reservationNumero: reservation.numero,
    dateEmission: formatDate(reservation.createdAt),
    montant: reservation.montant,
    stagiaire: {
      civilite: reservation.civilite ?? "M.",
      prenom: reservation.prenom,
      nom: reservation.nom,
      adresse: reservation.adresse ?? undefined,
      codePostal: reservation.codePostal ?? undefined,
      ville: reservation.ville ?? undefined,
      numeroPermis: reservation.numeroPermis ?? undefined,
    },
    formation: {
      titre: formation.titre,
      type: formation.titre,
      duree: formation.duree,
      isQualiopi: formation.isQualiopi,
    },
    session: {
      dateDebut: formatDate(session.dateDebut),
      dateFin: formatDate(session.dateFin),
      horaires: "9h00 – 17h30",
    },
    centre: {
      nom: centre.nom,
      raisonSociale: centre.raisonSociale ?? undefined,
      siret: centre.siret ?? undefined,
      adresse: centre.adresse,
      codePostal: centre.codePostal,
      ville: centre.ville,
      telephone: centre.telephone ?? undefined,
      email: centre.email ?? undefined,
      numAgrement: centre.agrementNumber ?? undefined,
      logoUrl: logoOrDefault(centre.logo),
      signatureUrl: toAbsolute(centre.signatureUrl),
    },
  };

  const buffer = await renderToBuffer(
    createElement(Convocation, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  );

  return { buffer, filename: `convocation-${reservation.numero}.pdf` };
}

/**
 * Rend la facture PDF d'une réservation. Crée la facture en DB si elle n'existe
 * pas encore. Retourne le Buffer prêt à être attaché à un email Resend.
 */
export async function renderInvoicePdfFromReservation(reservationId: string): Promise<{
  buffer: Buffer;
  filename: string;
  invoiceNumero: string;
}> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      user: true,
      invoice: true,
      session: { include: { formation: { include: { centre: true } } } },
    },
  });
  if (!reservation) throw new Error(`Réservation introuvable: ${reservationId}`);

  let invoice = reservation.invoice;
  const centre = reservation.session.formation.centre;

  // Crée la facture si absente (1ère génération suite paiement)
  if (!invoice) {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const numero = `FAC-${year}-${String(count + 1).padStart(4, "0")}`;
    // TVA 0% : les stages de récup points sont exonérés (formation continue, art. 261-4-4° CGI).
    const montantHT = reservation.montant;
    const tva = 0;
    const montantTTC = montantHT;

    invoice = await prisma.invoice.create({
      data: {
        numero,
        type: "ELEVE",
        montantHT,
        tva,
        montantTTC,
        status: "PAYEE",
        userId: reservation.userId,
        centreId: centre.id,
        reservationId: reservation.id,
      },
    });
  }

  const formationTitre = reservation.session.formation.titre;
  const data = {
    numero: invoice.numero,
    dateEmission: formatDate(invoice.createdAt),
    dateEcheance: formatDate(invoice.createdAt),
    emetteur: {
      nom: centre.nom,
      raisonSociale: centre.raisonSociale ?? undefined,
      siret: centre.siret ?? undefined,
      tva: centre.tva ?? undefined,
      ape: centre.ape ?? undefined,
      adresse: centre.adresse,
      codePostal: centre.codePostal,
      ville: centre.ville,
      email: centre.email ?? undefined,
      telephone: centre.telephone ?? undefined,
      iban: centre.iban ?? undefined,
      bic: centre.bic ?? undefined,
      logoUrl: logoOrDefault(centre.logo),
      mentionsLegales: centre.mentionsLegales ?? undefined,
      cgv: centre.cgv ?? undefined,
    },
    client: {
      nom: reservation.user?.nom ?? reservation.nom,
      prenom: reservation.user?.prenom ?? reservation.prenom,
      email: reservation.user?.email ?? reservation.email,
      adresse: reservation.user?.adresse ?? reservation.adresse ?? undefined,
      codePostal: reservation.user?.codePostal ?? reservation.codePostal ?? undefined,
      ville: reservation.user?.ville ?? reservation.ville ?? undefined,
    },
    lignes: [
      {
        description: formationTitre,
        quantite: 1,
        prixUnitaire: invoice.montantHT,
        total: invoice.montantHT,
      },
    ],
    montantHT: invoice.montantHT,
    tva: invoice.tva,
    montantTTC: invoice.montantTTC,
    paiement: {
      reference: reservation.stripePaymentId ?? undefined,
      status: invoice.status === "PAYEE" ? "Payé" : invoice.status,
      methode: "Carte bancaire (Stripe)",
    },
  };

  const buffer = await renderToBuffer(
    createElement(Facture, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  );

  return { buffer, filename: `facture-${invoice.numero}.pdf`, invoiceNumero: invoice.numero };
}

/**
 * Rend la feuille d'émargement individuelle d'une réservation (PDF Buffer).
 * Reprend date, n° agrément, lieu, dates, horaires et formateur responsable.
 */
export async function renderIndividualEmargementPdf(reservationIdOrNumero: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const reservation = await prisma.reservation.findFirst({
    where: { OR: [{ id: reservationIdOrNumero }, { numero: reservationIdOrNumero }] },
    include: { session: { include: { formation: { include: { centre: true } } } } },
  });
  if (!reservation) throw new Error(`Réservation introuvable: ${reservationIdOrNumero}`);

  const { session } = reservation;
  const centre = session.formation.centre;

  const data = {
    reservationNumero: reservation.numero,
    dateEmission: formatDate(reservation.createdAt),
    stagiaire: {
      civilite: reservation.civilite ?? undefined,
      nom: reservation.nom,
      prenom: reservation.prenom,
      numeroPermis: reservation.numeroPermis ?? undefined,
    },
    formationTitre: session.formation.titre,
    jour1: formatDate(session.dateDebut),
    jour2: formatDate(session.dateFin),
    horaires: session.horaires ?? "9h00 – 12h30 / 13h30 – 17h00",
    formateurResponsable: session.formateurResponsable ?? undefined,
    centre: {
      nom: centre.nom,
      raisonSociale: centre.raisonSociale ?? undefined,
      adresse: centre.adresse,
      codePostal: centre.codePostal,
      ville: centre.ville,
      numAgrement: centre.agrementNumber ?? undefined,
      logoUrl: logoOrDefault(centre.logo),
      signatureUrl: toAbsolute(centre.signatureUrl),
    },
  };

  const buffer = await renderToBuffer(
    createElement(EmargementIndividuel, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  );

  return { buffer, filename: `emargement-${reservation.numero}.pdf` };
}

/**
 * Rend le PDF probant d'un bon d'accord accepté (avec horodatage + IP).
 */
export async function renderBonAccordPdf(documentId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { reservation: { include: { session: { include: { formation: { include: { centre: true } } } } } } },
  });
  if (!doc) throw new Error(`Document introuvable: ${documentId}`);

  const reservation = doc.reservation;
  const centre = reservation.session.formation.centre;

  const data = {
    titre: doc.nom,
    contenu: doc.contenu ?? "",
    reservationNumero: reservation.numero,
    stagiaire: { prenom: reservation.prenom, nom: reservation.nom },
    acceptation: {
      nom: doc.acceptedNom ?? `${reservation.prenom} ${reservation.nom}`,
      dateHeure: doc.acceptedAt
        ? doc.acceptedAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })
        : "—",
      ip: doc.acceptedIp ?? "inconnue",
    },
    centre: {
      nom: centre.nom,
      raisonSociale: centre.raisonSociale ?? undefined,
      adresse: centre.adresse,
      codePostal: centre.codePostal,
      ville: centre.ville,
      logoUrl: logoOrDefault(centre.logo),
    },
  };

  const buffer = await renderToBuffer(
    createElement(BonAccord, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  );

  return { buffer, filename: `bon-accord-${reservation.numero}.pdf` };
}
