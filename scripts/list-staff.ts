import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const total = await prisma.user.count();
  const eleves = await prisma.user.count({ where: { role: "ELEVE" } });
  console.log(`TOTAL: ${total} | ELEVE: ${eleves} | non-ELEVE: ${total - eleves}\n`);

  const staff = await prisma.user.findMany({
    where: { role: { not: "ELEVE" } },
    select: { prenom: true, nom: true, email: true, role: true },
    orderBy: { role: "asc" },
  });
  console.log("=== COMPTES NON-ELEVE ===");
  for (const u of staff) console.log(`[${u.role}] ${u.prenom} ${u.nom} — ${u.email}`);
}

main().finally(() => prisma.$disconnect());
