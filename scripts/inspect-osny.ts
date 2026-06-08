import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const centre = await prisma.centre.findFirst({
    where: { nom: { contains: "BYS Formation Osny", mode: "insensitive" } },
    select: {
      id: true, nom: true, ville: true, statut: true, slug: true,
      stripeAccountId: true, stripeOnboardingDone: true,
      formations: {
        select: {
          id: true, titre: true, slug: true, prix: true, isActive: true,
          stageType: true,
          sessions: { select: { id: true, dateDebut: true, dateFin: true, placesTotal: true, placesRestantes: true, status: true } },
        },
      },
    },
  });

  if (!centre) { console.log("BYS Formation Osny introuvable"); return; }
  console.log("Centre:", centre.nom, centre.ville, "| statut:", centre.statut, "| slug:", centre.slug);
  console.log("Stripe account:", centre.stripeAccountId ?? "—", "| onboarding done:", centre.stripeOnboardingDone);
  console.log("\nFormations:", centre.formations.length);
  for (const f of centre.formations) {
    console.log(`- "${f.titre}" (${f.prix}€, ${f.stageType}, active=${f.isActive}) slug=${f.slug}`);
    for (const s of f.sessions) {
      console.log(`    session ${s.dateDebut.toISOString().slice(0,10)} → ${s.dateFin.toISOString().slice(0,10)} | ${s.placesRestantes}/${s.placesTotal} | ${s.status}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
