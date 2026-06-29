/**
 * Corrige les centres visibles sur /centres : logos, profils incomplets.
 * Usage: npx tsx scripts/fix-marketplace-centres.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const BYS_LOGO = "/colored-logo.svg";

function dicebearLabel(label: string, color: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(label)}&backgroundColor=${color}&textColor=FFFFFF&fontWeight=700`;
}

const DEMO_LOGOS: Record<string, string> = {
  "conduite-plus-paris": dicebearLabel("CP Paris", "10B981"),
  "cfsr-lyon": dicebearLabel("CFSR Lyon", "DC2626"),
  "permis-express-marseille": dicebearLabel("PE Marseille", "F59E0B"),
  "allo-ecole-transport-78": dicebearLabel("AET 78", "6366F1"),
};

async function main() {
  console.log("\n=== Fix marketplace centres ===\n");

  const bys = await prisma.centre.updateMany({
    where: { nom: { contains: "BYS Formation", mode: "insensitive" } },
    data: { logo: BYS_LOGO },
  });
  console.log(`✓ Logos BYS corrigés (${bys.count})`);

  for (const [slug, logo] of Object.entries(DEMO_LOGOS)) {
    const r = await prisma.centre.updateMany({
      where: { slug },
      data: { logo },
    });
    if (r.count) console.log(`✓ Logo ${slug}`);
  }

  const brokenLogos = await prisma.centre.findMany({
    where: {
      OR: [
        { logo: { contains: "bys-permis.fr/colored-logo.png" } },
        { logo: { contains: "colored-logo.png" } },
      ],
    },
    select: { id: true, nom: true },
  });
  for (const c of brokenLogos) {
    const logo = c.nom.toLowerCase().includes("bys") ? BYS_LOGO : null;
    await prisma.centre.update({
      where: { id: c.id },
      data: logo ? { logo } : { logo: dicebearLabel(c.nom.slice(0, 12), "64748B") },
    });
    console.log(`✓ Logo réparé: ${c.nom}`);
  }

  const incomplete = await prisma.centre.findMany({
    where: {
      statut: "ACTIF",
      isActive: true,
      ville: "",
    },
    select: { id: true, nom: true },
  });
  for (const c of incomplete) {
    await prisma.centre.update({
      where: { id: c.id },
      data: { statut: "EN_ATTENTE", isActive: false },
    });
    console.log(`⊘ Masqué (ville manquante): ${c.nom}`);
  }

  const noFormations = await prisma.centre.findMany({
    where: {
      statut: "ACTIF",
      isActive: true,
      formations: { none: { isActive: true } },
    },
    select: { id: true, nom: true },
  });
  for (const c of noFormations) {
    await prisma.centre.update({
      where: { id: c.id },
      data: { statut: "EN_ATTENTE", isActive: false },
    });
    console.log(`⊘ Masqué (0 formation): ${c.nom}`);
  }

  const visible = await prisma.centre.count({
    where: {
      statut: "ACTIF",
      isActive: true,
      ville: { not: "" },
      formations: { some: { isActive: true } },
    },
  });
  console.log(`\n✅ ${visible} centre(s) visibles sur la marketplace\n`);
}

main().finally(() => prisma.$disconnect());
