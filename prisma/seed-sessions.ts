/**
 * seed-sessions.ts
 * Crée 3 sessions futures pour chaque formation des centres agréés seedés.
 * Idempotent : skip si la formation a déjà des sessions.
 *
 * Usage : npx tsx prisma/seed-sessions.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;

// Génère les prochains samedis à partir de la date donnée
function nextSaturdays(from: Date, count: number): Date[] {
  const results: Date[] = [];
  const d = new Date(from);
  // Avancer jusqu'au prochain samedi
  const dayOfWeek = d.getDay(); // 0=dim, 6=sam
  const daysToSat = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
  d.setDate(d.getDate() + daysToSat);
  for (let i = 0; i < count; i++) {
    results.push(new Date(d));
    d.setDate(d.getDate() + 14); // toutes les 2 semaines
  }
  return results;
}

async function main() {
  // Récupère toutes les formations des centres agréés (seedés)
  const formations = await prisma.formation.findMany({
    where: {
      isActive: true,
      centre: { agrementNumber: { not: null }, statut: "ACTIF" },
    },
    select: {
      id: true,
      titre: true,
      prix: true,
      centre: { select: { nom: true, ville: true } },
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n${formations.length} formations trouvées.\n`);

  let created = 0;
  let skipped = 0;

  const startFrom = new Date("2026-07-05"); // Premier samedi disponible
  const saturdays = nextSaturdays(startFrom, 8); // Pool de 8 samedis

  for (let i = 0; i < formations.length; i++) {
    const f = formations[i];

    if (f._count.sessions > 0) {
      console.log(`  [SKIP] ${f.centre.nom} — déjà ${f._count.sessions} session(s)`);
      skipped++;
      continue;
    }

    // Étaler les sessions : chaque centre commence sur un samedi différent
    // pour éviter que tous les centres aient les mêmes dates
    const offset = i % saturdays.length;
    const sessionDates = [
      saturdays[offset % saturdays.length],
      saturdays[(offset + 2) % saturdays.length],
      saturdays[(offset + 4) % saturdays.length],
    ];

    for (const samedi of sessionDates) {
      const dateDebut = new Date(samedi);
      dateDebut.setHours(9, 0, 0, 0);

      const dateFin = new Date(samedi);
      dateFin.setDate(dateFin.getDate() + 1); // Dimanche
      dateFin.setHours(17, 30, 0, 0);

      await prisma.session.create({
        data: {
          formationId: f.id,
          dateDebut,
          dateFin,
          placesTotal: 20,
          placesRestantes: 20,
          status: "ACTIVE",
          horaires: "Samedi 9h00–12h30 / 13h30–17h00 · Dimanche 9h00–12h30 / 13h30–17h30",
        },
      });
    }

    console.log(
      `✅ ${f.centre.nom} (${f.centre.ville}) — 3 sessions créées (${sessionDates.map((d) => d.toLocaleDateString("fr-FR")).join(", ")})`
    );
    created += 3;
  }

  console.log(`
═══════════════════════════════════════════════════
  Sessions créées : ${created}
  Formations skip : ${skipped}
═══════════════════════════════════════════════════
`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
