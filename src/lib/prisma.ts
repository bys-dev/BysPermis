import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Clever Cloud injecte POSTGRESQL_ADDON_URI ; en local on utilise DATABASE_URL.
  const connectionString =
    process.env.DATABASE_URL ?? process.env.POSTGRESQL_ADDON_URI;
  if (!connectionString) {
    throw new Error("DATABASE_URL / POSTGRESQL_ADDON_URI is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new (PrismaClient as unknown as new (opts: { adapter: PrismaPg }) => PrismaClient)({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
