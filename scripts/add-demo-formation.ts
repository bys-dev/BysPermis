import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const SLUG = "stage-recuperation-points-test-bys-demo";

async function main() {
  const centre = await prisma.centre.findFirst({
    where: { nom: { contains: "BYS Formation", mode: "insensitive" }, statut: "ACTIF" },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, ville: true },
  });
  if (!centre) throw new Error("Centre BYS Formation introuvable");

  const categorie = await prisma.categorie.findFirst({
    where: { nom: { contains: "récup", mode: "insensitive" } },
    select: { id: true, nom: true },
  });

  const existing = await prisma.formation.findUnique({ where: { slug: SLUG } });
  if (existing) {
    console.log("Formation test déjà présente:", existing.id, "/", SLUG);
    return;
  }

  const now = new Date();
  const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 9, 0, 0);
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15, 17, 0, 0);

  const formation = await prisma.formation.create({
    data: {
      centreId: centre.id,
      categorieId: categorie?.id ?? null,
      titre: "Stage de récupération de points - Test démo",
      slug: SLUG,
      description:
        "Formation de démonstration BYS Formation. Stage de sensibilisation à la sécurité routière sur 2 jours (14 h) permettant de récupérer jusqu'à 4 points.",
      objectifs: "Récupérer jusqu'à 4 points. Comprendre les causes des infractions. Adopter une conduite responsable.",
      programme: "Jour 1 : accueil, analyse des infractions, vitesse et distances. Jour 2 : alcool/stupéfiants, vigilance, bilan.",
      prerequis: "Permis de conduire en cours de validité, au moins 1 point.",
      publicCible: "Conducteurs souhaitant récupérer des points (stage volontaire).",
      duree: "2 jours (14 h)",
      prix: 230,
      modalite: "PRESENTIEL",
      lieu: `${centre.nom} — ${centre.ville}`,
      isQualiopi: true,
      isCPF: false,
      isActive: true,
      stageType: "VOLONTAIRE",
      pointsRecovered: 4,
      sessions: {
        create: [
          { dateDebut: d1, dateFin: d2, placesTotal: 20, placesRestantes: 20, status: "ACTIVE", horaires: "9h00 – 12h30 / 13h30 – 17h00" },
        ],
      },
    },
    include: { sessions: true },
  });

  console.log("✅ Formation test créée:");
  console.log("  centre:", centre.nom, centre.ville);
  console.log("  categorie:", categorie?.nom ?? "(aucune)");
  console.log("  id:", formation.id, "| slug:", formation.slug);
  console.log("  sessions:", formation.sessions.map((s) => `${s.dateDebut.toISOString().slice(0, 10)} (${s.placesRestantes}/${s.placesTotal})`));
}

main().finally(() => prisma.$disconnect());
