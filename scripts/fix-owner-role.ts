import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as unknown as new (opts: { adapter: typeof adapter }) => InstanceType<typeof PrismaClient>)({ adapter });

async function main() {
  // Passer bysandrys95@gmail.com en OWNER
  const updated = await (prisma as unknown as { user: { update: (args: unknown) => Promise<{ email: string; role: string }> } }).user.update({
    where: { email: "bysandrys95@gmail.com" },
    data: { role: "OWNER" },
    select: { email: true, role: true },
  });
  console.log(`✅ ${updated.email} → ${updated.role}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
