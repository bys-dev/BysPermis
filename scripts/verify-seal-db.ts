/**
 * Vérifie colonnes DB + helpers cachet PDF.
 * Usage: npx tsx scripts/verify-seal-db.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  resolveCentreSealUrl,
  resolveCentreLogoUrl,
  isPdfSafeImageUrl,
} from "../src/lib/pdf-branding";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL non défini");
const adapter = new PrismaPg({ connectionString });
const prisma = new (PrismaClient as unknown as new (opts: { adapter: PrismaPg }) => PrismaClient)({
  adapter,
});

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function testPdfBranding() {
  const blobPng =
    "https://abc123.public.blob.vercel-storage.com/centres/x/signature-123.png";
  assert(resolveCentreSealUrl(blobPng) === blobPng, "blob PNG doit être résolu");
  assert(resolveCentreSealUrl(null) === undefined, "null → undefined");
  assert(resolveCentreSealUrl("") === undefined, "vide → undefined");
  assert(
    resolveCentreSealUrl("https://example.com/seal.svg") === undefined,
    "SVG rejeté"
  );
  const relative = resolveCentreSealUrl("/uploads/centres/abc/seal.png");
  assert(relative !== undefined && relative.includes("seal.png"), "chemin relatif résolu");
  assert(isPdfSafeImageUrl(blobPng), "blob URL safe");
  assert(!isPdfSafeImageUrl("https://x.com/a.svg"), "svg unsafe");
  assert(resolveCentreLogoUrl(blobPng) === blobPng, "logo même logique que cachet");
  console.log("✓ Helpers pdf-branding OK");
}

async function testDb() {
  const cols = await prisma.$queryRaw<
    { column_name: string; data_type: string; is_nullable: string }[]
  >`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'centres'
      AND column_name IN ('signatureUrl', 'nomResponsable', 'logo', 'bannerImage')
    ORDER BY column_name
  `;

  const names = cols.map((c) => c.column_name);
  for (const required of ["signatureUrl", "nomResponsable", "logo"]) {
    assert(names.includes(required), `Colonne manquante: ${required}`);
  }
  console.log("✓ Colonnes DB présentes:", names.join(", "));

  const sample = await prisma.centre.findMany({
    select: {
      id: true,
      nom: true,
      signatureUrl: true,
      nomResponsable: true,
      logo: true,
    },
    take: 3,
  });
  console.log("✓ Lecture Prisma OK — échantillon:", JSON.stringify(sample, null, 2));

  const [withSeal, total] = await Promise.all([
    prisma.centre.count({ where: { signatureUrl: { not: null } } }),
    prisma.centre.count(),
  ]);
  console.log(`✓ Centres avec cachet: ${withSeal} / ${total}`);

  if (sample[0]) {
    const id = sample[0].id;
    const before = sample[0].signatureUrl;
    const beforeNom = sample[0].nomResponsable;
    const testUrl = "https://test.example.com/seal-test.png";
    await prisma.centre.update({
      where: { id },
      data: { signatureUrl: testUrl, nomResponsable: "Test Responsable" },
    });
    const updated = await prisma.centre.findUnique({
      where: { id },
      select: { signatureUrl: true, nomResponsable: true },
    });
    assert(updated?.signatureUrl === testUrl, "Écriture signatureUrl échouée");
    assert(updated?.nomResponsable === "Test Responsable", "Écriture nomResponsable échouée");
    await prisma.centre.update({
      where: { id },
      data: { signatureUrl: before, nomResponsable: beforeNom },
    });
    console.log("✓ Écriture / restauration signatureUrl + nomResponsable OK");
  }
}

async function main() {
  testPdfBranding();
  await testDb();
  console.log("\n=== Toutes les vérifications cachet numérique OK ===");
}

main()
  .catch((e) => {
    console.error("\n✗ ÉCHEC:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
