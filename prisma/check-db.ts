import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;

async function main() {
  const [users, centres, formations, sessions, reservations, categories, faq, notifications] = await Promise.all([
    (prisma as any).user.count(),
    (prisma as any).centre.count(),
    (prisma as any).formation.count(),
    (prisma as any).session.count(),
    (prisma as any).reservation.count(),
    (prisma as any).categorie.count(),
    (prisma as any).faqItem.count(),
    (prisma as any).notification.count(),
  ]);
  console.log("=== ÉTAT DE LA BASE DE DONNÉES ===");
  console.log(`  Users:         ${users}`);
  console.log(`  Centres:       ${centres}`);
  console.log(`  Formations:    ${formations}`);
  console.log(`  Sessions:      ${sessions}`);
  console.log(`  Reservations:  ${reservations}`);
  console.log(`  Categories:    ${categories}`);
  console.log(`  FAQ:           ${faq}`);
  console.log(`  Notifications: ${notifications}`);
  console.log("=================================");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await (prisma as any).$disconnect(); });
