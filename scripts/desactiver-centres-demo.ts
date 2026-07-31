/**
 * Retire de la vitrine publique les centres présents en base qui ne sont pas de
 * vrais partenaires (données de démonstration et noms repris des listes
 * préfectorales). Aucune suppression : l'opération est réversible.
 *
 * Deux champs conditionnent la visibilité publique, et il faut les deux :
 *   - `isActive`  — filtré par /api/centres, /api/formations, la recherche…
 *   - `statut`    — seul filtre de /api/formations/suggestions, qui ne regarde
 *                   pas `isActive` : ne basculer que `isActive` laisserait donc
 *                   les centres remonter dans l'autocomplétion.
 *
 * Usage :
 *   npx tsx --env-file=.env scripts/desactiver-centres-demo.ts            # aperçu
 *   npx tsx --env-file=.env scripts/desactiver-centres-demo.ts --appliquer
 *   npx tsx --env-file=.env scripts/desactiver-centres-demo.ts --reactiver
 */

import { prisma } from "@/lib/prisma";

async function main() {
  const appliquer = process.argv.includes("--appliquer");
  const reactiver = process.argv.includes("--reactiver");

  if (reactiver) {
    const res = await prisma.centre.updateMany({
      where: { statut: "SUSPENDU", isActive: false },
      data: { statut: "ACTIF", isActive: true },
    });
    console.log(`Centres réactivés : ${res.count}`);
    return;
  }

  // Un centre rattaché à un compte propriétaire réel ne doit pas être masqué à
  // l'aveugle : on ne touche que ceux sans réservation, qui sont par
  // construction les fiches de démonstration.
  const cibles = await prisma.centre.findMany({
    where: {
      isActive: true,
      formations: { none: { sessions: { some: { reservations: { some: {} } } } } },
    },
    select: { id: true, nom: true, ville: true },
    orderBy: { nom: "asc" },
  });

  const proteges = await prisma.centre.count({
    where: { isActive: true, formations: { some: { sessions: { some: { reservations: { some: {} } } } } } },
  });

  console.log(`Centres à masquer          : ${cibles.length}`);
  console.log(`Centres conservés (avec réservation) : ${proteges}`);
  console.log(cibles.slice(0, 10).map((c) => `  - ${c.nom} (${c.ville})`).join("\n"));
  if (cibles.length > 10) console.log(`  … et ${cibles.length - 10} autres`);

  if (!appliquer) {
    console.log("\nAperçu uniquement. Relancer avec --appliquer pour exécuter.");
    return;
  }

  const res = await prisma.centre.updateMany({
    where: { id: { in: cibles.map((c) => c.id) } },
    data: { statut: "SUSPENDU", isActive: false },
  });
  console.log(`\nCentres masqués : ${res.count}`);

  const restants = await prisma.centre.count({ where: { statut: "ACTIF", isActive: true } });
  console.log(`Centres encore visibles publiquement : ${restants}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
