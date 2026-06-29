/**
 * Pack de recette complet — session réelle du 18-19 juin 2026 (BYS Cergy).
 * Usage: npx tsx scripts/seed-recette-juin-2026.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const RECETTE_TAG = "RECETTE-JUIN-2026";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://bys-permis.vercel.app";
const LOGO_PNG = "/colored-logo.svg";

// 18 juin 2026 (date du jour de recette)
const RECETTE_DATE = new Date(2026, 5, 18, 10, 0, 0);
const SESSION_DEBUT = new Date(2026, 5, 18, 9, 0, 0);
const SESSION_FIN = new Date(2026, 5, 19, 17, 0, 0);

const RESA_CONFIRMEE = "RES-RECETTE-18JUN-001";
const RESA_TERMINEE = "RES-RECETTE-18JUN-002";
const RESA_CONFIRMEE_2 = "RES-RECETTE-18JUN-003";

const ELEVE_CONFIRMEE = "marie.durand@outlook.fr";
const ELEVE_TERMINEE = "karim.bouaziz@gmail.com";
const ELEVE_CONFIRMEE_2 = "alexandre.petit@orange.fr";

function tvaFromTTC(ttc: number) {
  const ht = Math.round((ttc / 1.2) * 100) / 100;
  const tva = Math.round((ttc - ht) * 100) / 100;
  return { ht, tva, ttc };
}

async function main() {
  console.log(`\n=== Seed recette ${RECETTE_TAG} — ${SESSION_DEBUT.toISOString().slice(0, 10)} ===\n`);

  const centre = await prisma.centre.findUnique({
    where: { slug: "bys-formation-cergy" },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!centre) throw new Error("Centre BYS Cergy introuvable — lancez npm run db:seed");

  let formation = await prisma.formation.findUnique({
    where: { slug: "stage-recuperation-points-cergy" },
  });

  if (!formation) {
    const categorie =
      (await prisma.categorie.findFirst({
        where: { nom: { contains: "récup", mode: "insensitive" } },
      })) ??
      (await prisma.categorie.create({
        data: { nom: "Récupération de points", slug: "recuperation-points", ordre: 1 },
      }));

    formation = await prisma.formation.create({
      data: {
        centreId: centre.id,
        categorieId: categorie.id,
        titre: "Stage de récupération de points - Cergy",
        slug: "stage-recuperation-points-cergy",
        description:
          "Stage agréé préfecture Val-d'Oise — recette juin 2026. Récupérez jusqu'à 4 points en 2 jours.",
        objectifs: "Récupérer jusqu'à 4 points. Adopter une conduite responsable.",
        programme:
          "Jour 1 (18 juin) : accueil, accidentologie, vitesse. Jour 2 (19 juin) : alcool, vigilance, bilan.",
        prerequis: "Permis valide. Pas de stage < 12 mois.",
        publicCible: "Conducteurs Val-d'Oise",
        duree: "2 jours",
        prix: 240,
        modalite: "PRESENTIEL",
        lieu: "5 Place des Merveilles, 95800 Cergy",
        isQualiopi: true,
        isCPF: false,
        isActive: true,
        stageType: "VOLONTAIRE",
        pointsRecovered: 4,
      },
    });
    console.log("✓ Formation Cergy créée (base non seedée)");
  }

  await prisma.centre.update({
    where: { id: centre.id },
    data: {
      statut: "ACTIF",
      isActive: true,
      raisonSociale: "BYS Formation SAS",
      siret: "98751238100011",
      tva: "FR12987512381",
      ape: "8559A",
      iban: "FR76 3000 4000 0300 0000 0000 189",
      bic: "BNPAFRPPXXX",
      nomResponsable: "Philippe Lambert",
      agrementNumber: "95-2024-REC-001",
      agrementDepartement: "95",
      logo: LOGO_PNG,
      signatureUrl: LOGO_PNG,
      mentionsLegales:
        "BYS Formation SAS — SIRET 987 512 381 00011 — Document de recette juin 2026.",
      cgv: "CGV recette juin 2026 — annulation gratuite jusqu'à J-7.",
      presentationHtml:
        "<p>Centre BYS Formation Cergy — session de recette <strong>juin 2026</strong>. Agréé préfecture Val-d'Oise.</p>",
    },
  });
  console.log("✓ Centre Cergy enrichi (logo, cachet, mentions légales juin 2026)");

  let session = await prisma.session.findFirst({
    where: {
      formationId: formation.id,
      dateDebut: SESSION_DEBUT,
    },
  });

  if (!session) {
    session = await prisma.session.create({
      data: {
        formationId: formation.id,
        dateDebut: SESSION_DEBUT,
        dateFin: SESSION_FIN,
        placesTotal: 16,
        placesRestantes: 13,
        status: "ACTIVE",
        formateurResponsable: "Miguel Garcia (BAFM)",
        horaires: `9h00 – 12h30 / 13h30 – 17h00 — ${RECETTE_TAG}`,
      },
    });
    console.log(`✓ Session créée ${SESSION_DEBUT.toISOString().slice(0, 10)} → ${SESSION_FIN.toISOString().slice(0, 10)}`);
  } else {
    session = await prisma.session.update({
      where: { id: session.id },
      data: {
        dateFin: SESSION_FIN,
        placesTotal: 16,
        placesRestantes: 13,
        status: "ACTIVE",
        formateurResponsable: "Miguel Garcia (BAFM)",
        horaires: `9h00 – 12h30 / 13h30 – 17h00 — ${RECETTE_TAG}`,
      },
    });
    console.log(`↺ Session recette mise à jour (${session.id.slice(0, 8)}…)`);
  }

  const eleve1 = await prisma.user.findUnique({ where: { email: ELEVE_CONFIRMEE } });
  const eleve2 = await prisma.user.findUnique({ where: { email: ELEVE_TERMINEE } });
  const eleve3 = await prisma.user.findUnique({ where: { email: ELEVE_CONFIRMEE_2 } });
  if (!eleve1 || !eleve2 || !eleve3) {
    throw new Error(
      `Élèves démo introuvables (${ELEVE_CONFIRMEE}, ${ELEVE_TERMINEE}, ${ELEVE_CONFIRMEE_2}) — lancez npm run db:seed`,
    );
  }

  const baseResa = {
    montant: 240,
    commissionMontant: 24,
    civilite: "Mme",
    telephone: "06 00 00 00 00",
    adresse: "12 Rue de la Recette",
    codePostal: "95800",
    ville: "Cergy",
    numeroPermis: "95REC2026",
    casStage: 1,
    attestationPasStage12Mois: true,
    attestationPermisValide: true,
    attestationLe: RECETTE_DATE,
    stripePaymentId: "pi_recette_juin_2026_demo",
    sessionId: session.id,
  };

  const r1 = await prisma.reservation.upsert({
    where: { numero: RESA_CONFIRMEE },
    create: {
      ...baseResa,
      numero: RESA_CONFIRMEE,
      status: "CONFIRMEE",
      nom: "Durand",
      prenom: "Marie",
      email: ELEVE_CONFIRMEE,
      userId: eleve1.id,
      createdAt: RECETTE_DATE,
    },
    update: {
      status: "CONFIRMEE",
      sessionId: session.id,
      attestationLe: RECETTE_DATE,
      createdAt: RECETTE_DATE,
    },
  });

  const r2 = await prisma.reservation.upsert({
    where: { numero: RESA_TERMINEE },
    create: {
      ...baseResa,
      numero: RESA_TERMINEE,
      status: "TERMINEE",
      civilite: "M.",
      nom: "Bouaziz",
      prenom: "Karim",
      email: ELEVE_TERMINEE,
      userId: eleve2.id,
      createdAt: RECETTE_DATE,
    },
    update: {
      status: "TERMINEE",
      sessionId: session.id,
      attestationLe: RECETTE_DATE,
      createdAt: RECETTE_DATE,
    },
  });

  const r3 = await prisma.reservation.upsert({
    where: { numero: RESA_CONFIRMEE_2 },
    create: {
      ...baseResa,
      numero: RESA_CONFIRMEE_2,
      status: "CONFIRMEE",
      civilite: "M.",
      nom: "Petit",
      prenom: "Alexandre",
      email: ELEVE_CONFIRMEE_2,
      userId: eleve3.id,
      createdAt: RECETTE_DATE,
    },
    update: {
      status: "CONFIRMEE",
      sessionId: session.id,
      attestationLe: RECETTE_DATE,
      createdAt: RECETTE_DATE,
    },
  });
  console.log("✓ 3 réservations recette (1 TERMINEE, 2 CONFIRMEE)");

  for (const [resa, num, uid] of [
    [r1, "FAC-RECETTE-2026-001", eleve1.id],
    [r2, "FAC-RECETTE-2026-002", eleve2.id],
    [r3, "FAC-RECETTE-2026-003", eleve3.id],
  ] as const) {
    const { ht, tva, ttc } = tvaFromTTC(resa.montant);
    await prisma.invoice.upsert({
      where: { numero: num },
      create: {
        numero: num,
        type: "ELEVE",
        montantHT: ht,
        tva,
        montantTTC: ttc,
        status: "PAYEE",
        userId: uid,
        centreId: centre.id,
        reservationId: resa.id,
        createdAt: RECETTE_DATE,
      },
      update: {
        status: "PAYEE",
        reservationId: resa.id,
        createdAt: RECETTE_DATE,
      },
    });
  }
  console.log("✓ 3 factures FAC-RECETTE-2026-00x");

  const tplBon = await prisma.centreDocumentTemplate.upsert({
    where: { id: `recette-bon-${centre.id}` },
    create: {
      id: `recette-bon-${centre.id}`,
      centreId: centre.id,
      nom: "Bon d'accord — recette juin 2026",
      kind: "BON_ACCORD",
      requiresAck: true,
      autoSend: true,
      actif: true,
      ordre: 1,
      contenu:
        "Je soussigné(e) déclare avoir pris connaissance du règlement intérieur et du programme du stage BYS Formation Cergy. Session de recette — juin 2026. Lu et approuvé.",
    },
    update: { actif: true, contenu: "Je soussigné(e) déclare avoir pris connaissance du règlement intérieur — recette juin 2026." },
  });

  const tplReg = await prisma.centreDocumentTemplate.upsert({
    where: { id: `recette-reg-${centre.id}` },
    create: {
      id: `recette-reg-${centre.id}`,
      centreId: centre.id,
      nom: "Règlement intérieur — juin 2026",
      kind: "REGLEMENT",
      requiresAck: false,
      autoSend: true,
      actif: true,
      ordre: 2,
      contenu:
        "Règlement intérieur BYS Formation Cergy — version recette juin 2026. Horaires : 9h-17h30. Tenue correcte exigée. Téléphones en silencieux.",
    },
    update: { actif: true },
  });
  console.log("✓ Modèles documents centre (bon d'accord + règlement)");

  async function upsertDoc(
    reservationId: string,
    kind: "BON_ACCORD" | "REGLEMENT" | "EMARGEMENT" | "PIECE_IDENTITE",
    nom: string,
    extra: Record<string, unknown> = {},
  ) {
    const existing = await prisma.document.findFirst({
      where: { reservationId, kind, nom },
    });
    if (existing) {
      return prisma.document.update({
        where: { id: existing.id },
        data: extra,
      });
    }
    return prisma.document.create({
      data: {
        reservationId,
        centreId: centre.id,
        kind,
        direction: kind === "PIECE_IDENTITE" ? "ELEVE_VERS_CENTRE" : "CENTRE_VERS_ELEVE",
        nom,
        status: "ENVOYE",
        ...extra,
      },
    });
  }

  await upsertDoc(r1.id, "BON_ACCORD", "Bon d'accord — recette juin 2026", {
    templateId: tplBon.id,
    requiresAck: true,
    contenu: tplBon.contenu,
    status: "ENVOYE",
  });

  await upsertDoc(r1.id, "REGLEMENT", "Règlement intérieur — juin 2026", {
    templateId: tplReg.id,
    contenu: tplReg.contenu,
    status: "LU",
  });

  const bonAccepte = await upsertDoc(r2.id, "BON_ACCORD", "Bon d'accord signé — juin 2026", {
    templateId: tplBon.id,
    requiresAck: true,
    contenu: tplBon.contenu,
    status: "ACCEPTE",
    acceptedAt: RECETTE_DATE,
    acceptedNom: "Karim Bouaziz",
    acceptedIp: "127.0.0.1",
  });

  await upsertDoc(r2.id, "EMARGEMENT", "Émargement individuel — juin 2026", {
    status: "ACCEPTE",
    contenu: `Présent les 18 et 19 juin 2026 — ${RECETTE_TAG}`,
  });

  await upsertDoc(r2.id, "PIECE_IDENTITE", "CNI placeholder — juin 2026", {
    direction: "ELEVE_VERS_CENTRE",
    description: "Image placeholder recette — juin 2026",
    contenu: "[Placeholder] Carte nationale d'identité — document de démonstration juin 2026.",
    status: "ENVOYE",
  });

  await upsertDoc(r3.id, "BON_ACCORD", "Bon d'accord — recette juin 2026", {
    templateId: tplBon.id,
    requiresAck: true,
    contenu: tplBon.contenu,
    status: "ENVOYE",
  });

  console.log("✓ Documents échange (bon d'accord, règlement, émargement, CNI placeholder)");

  console.log(`
=== Pack recette prêt ===

Session   : 18-19 juin 2026 — ${formation.titre}
Centre    : ${centre.nom} (/centres/${centre.slug})
SessionId : ${session.id}

Réservations :
  • ${RESA_CONFIRMEE}  CONFIRMEE  → ${ELEVE_CONFIRMEE}
  • ${RESA_TERMINEE}   TERMINEE   → ${ELEVE_TERMINEE} (bon signé ${RECETTE_DATE.toLocaleDateString("fr-FR")})
  • ${RESA_CONFIRMEE_2}  CONFIRMEE  → ${ELEVE_CONFIRMEE_2}

Factures : FAC-RECETTE-2026-001 à 003

Vérifier les PDF :
  npm run verify:recette

Guide manuel :
  RECETTE_JUIN_2026.md
`);
}

main()
  .catch((e) => {
    console.error("ERREUR:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
