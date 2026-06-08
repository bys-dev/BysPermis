import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const centre = await prisma.centre.findFirst({
    where: { nom: { contains: "BYS Formation Osny", mode: "insensitive" } },
    select: { id: true, nom: true, ville: true },
  });
  if (!centre) throw new Error("BYS Formation Osny introuvable");

  const categorie = await prisma.categorie.findFirst({
    where: { nom: { contains: "récup", mode: "insensitive" } },
    select: { id: true, nom: true },
  });
  if (!categorie) throw new Error("Catégorie Récupération introuvable");

  // Helpers
  const today = new Date(2026, 5, 8); // 8 juin 2026 — point d'ancrage pour les dates de démo
  const day = (offset: number, h = 9) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    d.setHours(h, 0, 0, 0);
    return d;
  };

  // ── Sessions futures à ajouter sur la formation existante ──
  const existing = await prisma.formation.findUnique({
    where: { slug: "stage-recuperation-points-osny" },
    select: { id: true, titre: true },
  });
  if (existing) {
    const sessions = [
      { dateDebut: day(14, 9), dateFin: day(15, 17) }, // 22-23 juin
      { dateDebut: day(35, 9), dateFin: day(36, 17) }, // 13-14 juillet
    ];
    for (const s of sessions) {
      const exists = await prisma.session.findFirst({
        where: { formationId: existing.id, dateDebut: s.dateDebut },
        select: { id: true },
      });
      if (exists) {
        console.log(`  ↺ session ${s.dateDebut.toISOString().slice(0, 10)} déjà présente, skip`);
        continue;
      }
      await prisma.session.create({
        data: {
          formationId: existing.id, dateDebut: s.dateDebut, dateFin: s.dateFin,
          placesTotal: 20, placesRestantes: 20, status: "ACTIVE",
          horaires: "9h00 – 12h30 / 13h30 – 17h00",
        },
      });
      console.log(`  + session ${s.dateDebut.toISOString().slice(0, 10)} sur "${existing.titre}"`);
    }
  }

  // ── Formation 2 — Stage 48N (probatoire) ──
  await upsertFormation({
    slug: "stage-48n-probatoire-osny",
    titre: "Stage 48N — Permis probatoire",
    description:
      "Stage obligatoire pour les jeunes conducteurs (permis probatoire) ayant reçu une lettre 48N suite à une infraction entraînant la perte de 3 points ou plus. À effectuer dans un délai de 4 mois.",
    objectifs: "Récupérer 4 points. Régulariser la situation administrative. Comprendre les enjeux du permis probatoire.",
    programme: "Jour 1 : statut probatoire, infractions courantes, facteurs d'accident. Jour 2 : alcool/stupéfiants/téléphone, études de cas, bilan personnel.",
    prerequis: "Lettre 48N reçue. Permis en cours de validité (probatoire).",
    publicCible: "Conducteurs en permis probatoire ayant reçu une 48N.",
    prix: 220,
    stageType: "LETTRE_48N",
    pointsRecovered: 4,
    centreId: centre.id, centreNom: centre.nom, centreVille: centre.ville, categorieId: categorie.id,
    sessions: [
      { dateDebut: day(21, 9), dateFin: day(22, 17) }, // 29-30 juin
      { dateDebut: day(42, 9), dateFin: day(43, 17) }, // 20-21 juillet
    ],
  });

  // ── Formation 3 — Stage volontaire weekend ──
  await upsertFormation({
    slug: "stage-volontaire-weekend-osny",
    titre: "Stage volontaire — Weekend",
    description:
      "Stage de récupération de points en mode volontaire, organisé le weekend pour les actifs. 2 jours consécutifs (samedi-dimanche) pour récupérer jusqu'à 4 points sans empiéter sur la semaine de travail.",
    objectifs: "Récupérer jusqu'à 4 points avant que le solde ne devienne critique. Adopter une conduite plus responsable.",
    programme: "Samedi : accueil, infractions, vitesse, distances. Dimanche : alcool, vigilance, distracteurs, bilan.",
    prerequis: "Permis valide avec au moins 1 point. Pas de stage dans les 12 derniers mois.",
    publicCible: "Actifs souhaitant un stage en weekend.",
    prix: 245,
    stageType: "VOLONTAIRE",
    pointsRecovered: 4,
    centreId: centre.id, centreNom: centre.nom, centreVille: centre.ville, categorieId: categorie.id,
    sessions: [
      { dateDebut: day(27, 9), dateFin: day(28, 17) }, // sam 4 – dim 5 juillet
      { dateDebut: day(56, 9), dateFin: day(57, 17) }, // sam 2 – dim 3 août
    ],
  });

  console.log("\n✅ Pack démo Osny en place.");
}

async function upsertFormation(p: {
  slug: string; titre: string; description: string;
  objectifs: string; programme: string; prerequis: string; publicCible: string;
  prix: number; stageType: "VOLONTAIRE" | "LETTRE_48N" | "LETTRE_48SI" | "PROBATOIRE" | "JUDICIAIRE" | "COMPOSITION_PENALE";
  pointsRecovered: number;
  centreId: string; centreNom: string; centreVille: string; categorieId: string;
  sessions: { dateDebut: Date; dateFin: Date }[];
}) {
  const existing = await prisma.formation.findUnique({ where: { slug: p.slug }, select: { id: true, titre: true } });
  if (existing) {
    console.log(`  ↺ formation "${existing.titre}" déjà présente, skip création`);
    return;
  }
  const created = await prisma.formation.create({
    data: {
      centreId: p.centreId, categorieId: p.categorieId,
      titre: p.titre, slug: p.slug,
      description: p.description, objectifs: p.objectifs, programme: p.programme,
      prerequis: p.prerequis, publicCible: p.publicCible,
      duree: "2 jours (14 h)", prix: p.prix, modalite: "PRESENTIEL",
      lieu: `${p.centreNom} — ${p.centreVille}`,
      isQualiopi: true, isCPF: false, isActive: true,
      stageType: p.stageType, pointsRecovered: p.pointsRecovered,
      sessions: {
        create: p.sessions.map((s) => ({
          dateDebut: s.dateDebut, dateFin: s.dateFin,
          placesTotal: 20, placesRestantes: 20, status: "ACTIVE",
          horaires: "9h00 – 12h30 / 13h30 – 17h00",
        })),
      },
    },
    include: { sessions: true },
  });
  console.log(`  + formation "${created.titre}" — ${p.prix}€ — sessions: ${created.sessions.map((s) => s.dateDebut.toISOString().slice(0, 10)).join(", ")}`);
}

main().finally(() => prisma.$disconnect());
