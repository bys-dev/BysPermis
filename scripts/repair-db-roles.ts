/**
 * Répare les rôles en base Prisma pour les comptes démo (prod / recette).
 * Usage : npx tsx scripts/repair-db-roles.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEMO_ACCOUNT_ROLES } from "../src/lib/demo-account-roles";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL manquant");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Réparation des rôles en base…\n");

  for (const [email, role] of Object.entries(DEMO_ACCOUNT_ROLES)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`⚠️  ${email} — absent de la base`);
      continue;
    }
    if (user.role === role) {
      console.log(`✓  ${email} — déjà ${role}`);
      continue;
    }
    await prisma.user.update({
      where: { email },
      data: { role },
    });
    console.log(`✅ ${email} : ${user.role} → ${role}`);
  }

  console.log("\nTerminé.");
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
