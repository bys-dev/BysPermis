import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as unknown as new (opts: { adapter: typeof adapter }) => InstanceType<typeof PrismaClient>)({ adapter });

async function main() {
  const users = await (prisma as unknown as { user: { findMany: (args: unknown) => Promise<Array<{ email: string; role: string; auth0Id: string }>> } }).user.findMany({
    select: { email: true, role: true, auth0Id: true },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  console.log("=== UTILISATEURS EN BASE ===");
  for (const u of users) {
    const isReal = !u.auth0Id.startsWith("local_");
    console.log(`${u.role.padEnd(20)} ${u.email.padEnd(35)} ${isReal ? "AUTH0" : "LOCAL"}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
