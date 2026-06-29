import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;

async function main() {
  const centres = await prisma.centre.findMany({
    where: { agrementNumber: { not: null }, statut: "EN_ATTENTE" },
    select: { id: true, nom: true, ville: true, slug: true, user: { select: { email: true } } },
    take: 40,
    orderBy: { createdAt: "asc" },
  });

  console.log("Centres à activer:", centres.length);

  for (const c of centres) {
    await prisma.centre.update({
      where: { id: c.id },
      data: { statut: "ACTIF", isActive: true },
    });

    const existing = await prisma.formation.findFirst({ where: { centreId: c.id } });
    if (!existing) {
      await prisma.formation.create({
        data: {
          centreId: c.id,
          titre: "Stage de récupération de points",
          slug: c.slug + "-recup-points",
          description:
            "Stage agréé Ministère de l'Intérieur — récupération de 4 points sur le permis. 2 jours en présentiel.",
          duree: "2 jours",
          prix: 24900,
          modalite: "PRESENTIEL",
          isActive: true,
          isQualiopi: false,
          stageType: "VOLONTAIRE",
          pointsRecovered: 4,
        },
      });
      console.log("  Formation créée pour", c.nom);
    } else {
      await prisma.formation.update({ where: { id: existing.id }, data: { isActive: true } });
      console.log("  Formation activée pour", c.nom);
    }

    console.log(`✅ ${c.nom} (${c.ville}) — ${c.user?.email}`);
  }

  console.log("\n=== COMPTE TEST ===");
  if (centres[0]?.user?.email) {
    console.log("Email   :", centres[0].user.email);
    console.log("Password: BYS2026!");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
