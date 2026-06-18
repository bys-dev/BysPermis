/**
 * Test rendu PDF convocation avec/sans cachet.
 * Usage: npx tsx scripts/verify-seal-pdf.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { renderConvocationPdf } from "../src/lib/pdf-helpers";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL non défini");
const adapter = new PrismaPg({ connectionString });
const prisma = new (PrismaClient as unknown as new (opts: { adapter: PrismaPg }) => PrismaClient)({
  adapter,
});

async function main() {
  const reservation = await prisma.reservation.findFirst({
    where: { status: { in: ["CONFIRMEE", "TERMINEE", "EN_ATTENTE"] } },
    select: { id: true, numero: true },
    orderBy: { createdAt: "desc" },
  });
  if (!reservation) throw new Error("Aucune réservation en base pour tester");

  console.log(`Test PDF convocation — réservation ${reservation.numero}`);

  const { buffer, filename } = await renderConvocationPdf(reservation.id);
  if (!buffer?.length) throw new Error("Buffer PDF vide");
  if (!buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) {
    throw new Error("Le buffer n'est pas un PDF valide");
  }
  console.log(`✓ PDF généré sans erreur (${buffer.length} octets) — ${filename}`);

  const full = await prisma.reservation.findUnique({
    where: { id: reservation.id },
    include: { session: { include: { formation: { include: { centre: true } } } } },
  });
  const centre = full?.session.formation.centre;
  if (!centre) {
    console.log("⚠ Centre introuvable via réservation, skip test avec cachet");
    return;
  }

  const testSeal = "https://test.example.com/cachet-demo.png";
  const prevSeal = centre.signatureUrl;
  await prisma.centre.update({
    where: { id: centre.id },
    data: { signatureUrl: testSeal },
  });

  try {
    const { buffer: buf2 } = await renderConvocationPdf(reservation.id);
    if (!buf2?.length) throw new Error("Buffer PDF avec cachet vide");
    console.log(`✓ PDF avec cachet simulé OK (${buf2.length} octets)`);
  } finally {
    await prisma.centre.update({
      where: { id: centre.id },
      data: { signatureUrl: prevSeal },
    });
  }

  console.log("\n=== Génération PDF convocation OK ===");
}

main()
  .catch((e) => {
    console.error("\n✗ ÉCHEC PDF:", e instanceof Error ? e.message : e);
    if (e instanceof Error && e.stack) console.error(e.stack);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
