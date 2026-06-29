/**
 * fix-prix.ts — Corrige le prix des formations seedées : 24900 centimes → 249 euros
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;

async function main() {
  // Toutes les formations avec prix >= 1000 (clairement en centimes) et titre = Stage de récupération
  const wrongPrix = await prisma.formation.findMany({
    where: { prix: { gte: 1000 } },
    select: { id: true, titre: true, prix: true, centre: { select: { nom: true } } },
  });

  console.log(`Formations avec prix >= 1000 : ${wrongPrix.length}`);

  for (const f of wrongPrix) {
    const correct = Math.round(f.prix / 100);
    await prisma.formation.update({ where: { id: f.id }, data: { prix: correct } });
    console.log(`  ✅ ${f.centre.nom} — ${f.prix} → ${correct} €`);
  }

  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
