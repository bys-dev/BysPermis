/**
 * Vérifie la génération de tous les PDF du pack recette juin 2026.
 * Usage: npx tsx scripts/verify-recette-documents.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { createElement, JSXElementConstructor, ReactElement } from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { prisma } from "../src/lib/prisma";
import {
  renderConvocationPdf,
  renderInvoicePdfFromReservation,
  renderIndividualEmargementPdf,
  renderBonAccordPdf,
} from "../src/lib/pdf-helpers";
import { Contrat } from "../src/components/pdf/Contrat";
import { Attestation } from "../src/components/pdf/Attestation";
import { Emargement } from "../src/components/pdf/Emargement";
import { formatDate } from "../src/lib/utils";
import { resolveCentreLogoUrl, resolveCentreSealUrl } from "../src/lib/pdf-branding";

const RECETTE_TAG = "RECETTE-JUIN-2026";
const OUT_DIR = path.join(process.cwd(), "recette-output-juin-2026");
const RESA_TERMINEE = "RES-RECETTE-18JUN-002";
const RESA_CONFIRMEE = "RES-RECETTE-18JUN-001";

type Row = {
  document: string;
  endpoint: string;
  reservation: string;
  statut: "OK" | "KO" | "SKIP";
  tailleKo: string;
  images: string;
  dateDoc: string;
  note: string;
};

const rows: Row[] = [];

function isPdf(buf: Buffer) {
  return buf.length > 4 && buf.subarray(0, 4).equals(Buffer.from("%PDF"));
}

async function checkPdf(
  document: string,
  endpoint: string,
  reservation: string,
  filename: string,
  gen: () => Promise<{ buffer: Buffer; filename?: string }>,
  images: string,
  dateDoc: string,
) {
  try {
    const { buffer } = await gen();
    if (!isPdf(buffer)) throw new Error("Buffer invalide (pas un PDF)");
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, filename), buffer);
    rows.push({
      document,
      endpoint,
      reservation,
      statut: "OK",
      tailleKo: `${Math.round(buffer.length / 1024)} Ko`,
      images,
      dateDoc,
      note: `Généré → recette-output-juin-2026/${filename}`,
    });
    console.log(`✓ ${document} (${Math.round(buffer.length / 1024)} Ko)`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    rows.push({
      document,
      endpoint,
      reservation,
      statut: "KO",
      tailleKo: "—",
      images,
      dateDoc,
      note: msg,
    });
    console.error(`✗ ${document}: ${msg}`);
  }
}

async function renderContratPdf(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      session: { include: { formation: { include: { centre: true } } } },
      user: true,
      invoice: true,
    },
  });
  if (!reservation) throw new Error("Réservation introuvable");
  const { session } = reservation;
  const centre = session.formation.centre;
  const year = new Date().getFullYear();
  const data = {
    numeroContrat: `BYS-CTR-${year}-${reservation.numero}`,
    dateEmission: formatDate(reservation.createdAt),
    organisme: {
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
      logoUrl: resolveCentreLogoUrl(centre.logo),
      signatureUrl: resolveCentreSealUrl(centre.signatureUrl),
      nomResponsable: centre.nomResponsable ?? undefined,
      mentionsLegales: centre.mentionsLegales ?? undefined,
      cgv: centre.cgv ?? undefined,
    },
    stagiaire: {
      civilite: reservation.civilite ?? undefined,
      prenom: reservation.prenom,
      nom: reservation.nom,
      adresse: reservation.adresse ?? undefined,
      codePostal: reservation.codePostal ?? undefined,
      ville: reservation.ville ?? undefined,
      email: reservation.email,
      telephone: reservation.telephone,
    },
    formation: {
      titre: session.formation.titre,
      objectifs: session.formation.objectifs ?? undefined,
      programme: session.formation.programme ?? undefined,
      duree: session.formation.duree,
      modalite: session.formation.modalite,
      lieu: session.formation.lieu ?? `${centre.adresse}, ${centre.codePostal} ${centre.ville}`,
    },
    session: {
      dateDebut: formatDate(session.dateDebut),
      dateFin: formatDate(session.dateFin),
    },
    conditions: {
      prixTTC: reservation.montant,
      tvaNote: "TVA non applicable (art. 261.4.4° du CGI)",
      modeReglement: "Carte bancaire via Stripe",
      datePaiement: formatDate(reservation.createdAt),
      refTransaction: reservation.stripePaymentId ?? undefined,
    },
  };
  const buffer = await renderToBuffer(
    createElement(Contrat, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>,
  );
  return { buffer, filename: `contrat-${reservation.numero}.pdf` };
}

async function renderAttestationPdf(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { session: { include: { formation: { include: { centre: true } } } } },
  });
  if (!reservation) throw new Error("Réservation introuvable");
  const { session } = reservation;
  const centre = session.formation.centre;
  const numeroAttestation = `ATT-${new Date().getFullYear()}-${reservation.numero}`;
  const data = {
    numeroAttestation,
    dateDelivrance: formatDate(new Date()),
    stagiaire: {
      civilite: reservation.civilite ?? undefined,
      prenom: reservation.prenom,
      nom: reservation.nom,
      adresse: reservation.adresse ?? undefined,
      codePostal: reservation.codePostal ?? undefined,
      ville: reservation.ville ?? undefined,
    },
    formation: {
      titre: session.formation.titre,
      duree: session.formation.duree,
      objectifs: session.formation.objectifs ?? undefined,
      modalite: session.formation.modalite,
    },
    session: {
      dateDebut: formatDate(session.dateDebut),
      dateFin: formatDate(session.dateFin),
      lieu: session.formation.lieu ?? `${centre.adresse}, ${centre.codePostal} ${centre.ville}`,
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
      logoUrl: resolveCentreLogoUrl(centre.logo),
      signatureUrl: resolveCentreSealUrl(centre.signatureUrl),
      nomResponsable: centre.nomResponsable ?? undefined,
    },
    verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://bys-permis.vercel.app"}/verification/${numeroAttestation}`,
  };
  const buffer = await renderToBuffer(
    createElement(Attestation, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>,
  );
  return { buffer, filename: `attestation-${reservation.numero}.pdf` };
}

async function renderCollectiveEmargement(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      formation: { include: { centre: true } },
      reservations: {
        where: { status: { in: ["CONFIRMEE", "TERMINEE"] } },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      },
    },
  });
  if (!session) throw new Error("Session introuvable");
  const centre = session.formation.centre;
  const stagiaires = session.reservations.map((r) => ({
    civilite: r.civilite ?? undefined,
    nom: r.nom,
    prenom: r.prenom,
    numeroPermis: r.numeroPermis ?? undefined,
  }));
  const lignesVierges = Math.max(2, session.placesTotal - stagiaires.length);
  const data = {
    formationTitre: session.formation.titre,
    jour1: formatDate(session.dateDebut),
    jour2: formatDate(session.dateFin),
    horaires: session.horaires ?? "9h00 – 12h30 / 13h30 – 17h00",
    centre: {
      nom: centre.nom,
      raisonSociale: centre.raisonSociale ?? undefined,
      adresse: centre.adresse,
      codePostal: centre.codePostal,
      ville: centre.ville,
      numAgrement: centre.agrementNumber ?? undefined,
      logoUrl: resolveCentreLogoUrl(centre.logo),
      signatureUrl: resolveCentreSealUrl(centre.signatureUrl),
      nomResponsable: centre.nomResponsable ?? undefined,
    },
    formateurResponsable: session.formateurResponsable ?? undefined,
    stagiaires,
    lignesVierges,
  };
  const buffer = await renderToBuffer(
    createElement(Emargement, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>,
  );
  return { buffer, filename: `emargement-collectif-${session.id.slice(0, 8)}.pdf` };
}

function writeReport() {
  const ok = rows.filter((r) => r.statut === "OK").length;
  const ko = rows.filter((r) => r.statut === "KO").length;
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const md = `# Compte rendu recette documents — juin 2026

> Généré automatiquement le **${today}** — tag \`${RECETTE_TAG}\`
> Résultat : **${ok}/${rows.length} OK**${ko ? ` — ${ko} échec(s)` : ""}

## Session de test

| Élément | Valeur |
|---------|--------|
| Centre | BYS Formation Cergy |
| Dates | **18 – 19 juin 2026** |
| Résa CONFIRMEE | \`${RESA_CONFIRMEE}\` — marie.durand@outlook.fr |
| Résa TERMINEE | \`${RESA_TERMINEE}\` — karim.bouaziz@gmail.com |
| Mot de passe démo | \`DemoByspermis2026!\` |

## Tableau documents PDF

| Document | API / route | Réservation | Statut | Taille | Images / cachet | Date sur doc | Note |
|----------|-------------|-------------|--------|--------|-----------------|--------------|------|
${rows.map((r) => `| ${r.document} | \`${r.endpoint}\` | ${r.reservation} | **${r.statut}** | ${r.tailleKo} | ${r.images} | ${r.dateDoc} | ${r.note} |`).join("\n")}

## Vérification manuelle (après déploiement)

| # | Action | URL | OK |
|---|--------|-----|----|
| 1 | Convocation PDF (connecté élève) | \`/api/convocation/${RESA_CONFIRMEE}\` | ☐ |
| 2 | Contrat PDF | \`/api/contrats/${RESA_CONFIRMEE}\` | ☐ |
| 3 | Facture PDF | via facture liée à la résa | ☐ |
| 4 | Attestation (TERMINEE) | \`/api/attestations/{id}\` | ☐ |
| 5 | Émargement individuel | \`/api/emargement/${RESA_TERMINEE}\` | ☐ |
| 6 | Émargement collectif (centre) | \`/api/centre/sessions/{sessionId}/emargement\` | ☐ |
| 7 | Bon d'accord signé | espace élève → Documents | ☐ |
| 8 | Règlement juin 2026 | espace élève → Documents | ☐ |
| 9 | CNI placeholder | texte « juin 2026 » (pas d'image réelle) | ☐ |

## Images & placeholders

| Élément | Valeur recette |
|---------|----------------|
| Logo centre | PNG BYS (\`colored-logo.png\`) |
| Cachet / signature | Même PNG placeholder |
| Photo CNI élève | Texte placeholder — **juin 2026** |
| Dates documents | **18 juin 2026** (date de recette) |

## Commentaire recette (à remplir)

| Critère | Note / commentaire |
|---------|-------------------|
| Lisibilité PDF | |
| Logo & cachet visibles | |
| Dates correctes (juin 2026) | |
| Mentions légales centre | |
| Parcours élève complet | |
| Parcours centre (émargement) | |

---
*Fichiers PDF locaux : dossier \`recette-output-juin-2026/\`*
`;

  fs.writeFileSync(path.join(process.cwd(), "RECETTE_JUIN_2026_RESULT.md"), md);
  console.log(`\n→ Rapport écrit : RECETTE_JUIN_2026_RESULT.md`);
  console.log(`→ PDFs locaux : ${OUT_DIR}/`);
}

async function main() {
  console.log(`\n=== Vérification documents ${RECETTE_TAG} ===\n`);

  const session = await prisma.session.findFirst({
    where: { horaires: { contains: RECETTE_TAG } },
    include: {
      reservations: { where: { numero: { startsWith: "RES-RECETTE" } } },
      formation: { include: { centre: true } },
    },
  });

  if (!session?.reservations.length) {
    console.error("Pack recette absent — lancez : npm run seed:recette");
    process.exit(1);
  }

  const rConf = session.reservations.find((r) => r.numero === RESA_CONFIRMEE);
  const rTerm = session.reservations.find((r) => r.numero === RESA_TERMINEE);
  if (!rConf || !rTerm) throw new Error("Réservations recette introuvables");

  const centre = session.formation.centre;
  const imgNote = centre.logo?.includes("colored-logo") ? "Logo PNG BYS + cachet placeholder" : "Logo centre";
  const dateDoc = formatDate(session.dateDebut);

  const bonDoc = await prisma.document.findFirst({
    where: { reservationId: rTerm.id, kind: "BON_ACCORD", status: "ACCEPTE" },
  });

  await checkPdf(
    "Convocation",
    `GET /api/convocation/[id]`,
    RESA_CONFIRMEE,
    "convocation.pdf",
    () => renderConvocationPdf(rConf.id),
    imgNote,
    dateDoc,
  );

  await checkPdf(
    "Contrat de formation",
    `GET /api/contrats/[id]`,
    RESA_CONFIRMEE,
    "contrat.pdf",
    () => renderContratPdf(rConf.id),
    imgNote,
    formatDate(rConf.createdAt),
  );

  await checkPdf(
    "Facture élève",
    `GET /api/invoices/[id]`,
    RESA_CONFIRMEE,
    "facture.pdf",
    () => renderInvoicePdfFromReservation(rConf.id),
    imgNote,
    formatDate(rConf.createdAt),
  );

  await checkPdf(
    "Attestation de fin de stage",
    `GET /api/attestations/[id]`,
    RESA_TERMINEE,
    "attestation.pdf",
    () => renderAttestationPdf(rTerm.id),
    imgNote + " + QR vérif",
    formatDate(new Date()),
  );

  await checkPdf(
    "Émargement individuel",
    `GET /api/emargement/[id]`,
    RESA_TERMINEE,
    "emargement-individuel.pdf",
    () => renderIndividualEmargementPdf(rTerm.id),
    imgNote,
    dateDoc,
  );

  await checkPdf(
    "Émargement collectif",
    `GET /api/centre/sessions/[id]/emargement`,
    "session recette",
    "emargement-collectif.pdf",
    () => renderCollectiveEmargement(session.id),
    imgNote,
    dateDoc,
  );

  if (bonDoc) {
    await checkPdf(
      "Bon d'accord signé",
      `POST accept → PDF`,
      RESA_TERMINEE,
      "bon-accord-signe.pdf",
      () => renderBonAccordPdf(bonDoc.id),
      "Signature texte — juin 2026",
      bonDoc.acceptedAt ? formatDate(bonDoc.acceptedAt) : dateDoc,
    );
  } else {
    rows.push({
      document: "Bon d'accord signé",
      endpoint: "—",
      reservation: RESA_TERMINEE,
      statut: "SKIP",
      tailleKo: "—",
      images: "—",
      dateDoc: "—",
      note: "Document accepté introuvable",
    });
  }

  writeReport();

  const failed = rows.filter((r) => r.statut === "KO");
  if (failed.length) process.exit(1);
}

main()
  .catch((e) => {
    console.error("ERREUR:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
