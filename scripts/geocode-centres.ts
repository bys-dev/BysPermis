/**
 * Rattrapage des coordonnées manquantes des centres.
 *
 * `/api/centres` géocode à la création et à la modification, mais les fiches
 * importées ou injectées directement en base sont antérieures à ce filet. Or un
 * centre sans latitude/longitude est absent de tout classement par distance :
 * il n'apparaît ni dans la recherche « autour de moi », ni en tête des pages
 * ville. Autrement dit, invisible là où l'internaute cherche.
 *
 * Usage :
 *   npx tsx scripts/geocode-centres.ts              # applique
 *   npx tsx scripts/geocode-centres.ts --dry-run    # simule
 *   npx tsx scripts/geocode-centres.ts --tous       # re-géocode aussi les fiches déjà pourvues
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { geocodeAddress } from "../src/lib/geocoding";
import { getVille, slugifyVille } from "../src/lib/seo/geo-data";

/** L'API Adresse est gratuite et sans clé : on l'interroge sans la saturer. */
const PAUSE_MS = 120;

const dryRun = process.argv.includes("--dry-run");
const tous = process.argv.includes("--tous");

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Requêtes successives, de la plus précise à la plus large. Une adresse mal
 * saisie ne doit pas faire perdre la commune : à l'échelle d'un rayon de
 * recherche, le centre-ville reste une approximation utile.
 */
function requetes(centre: {
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
}): string[] {
  const { adresse, codePostal, ville } = centre;
  const essais = [
    adresse && codePostal && ville ? `${adresse}, ${codePostal} ${ville}` : null,
    adresse && ville ? `${adresse}, ${ville}` : null,
    codePostal && ville ? `${codePostal} ${ville}` : null,
    ville,
    codePostal,
  ];
  return [...new Set(essais.filter((e): e is string => Boolean(e?.trim())))];
}

async function main() {
  const centres = await prisma.centre.findMany({
    where: tous ? {} : { OR: [{ latitude: null }, { longitude: null }] },
    select: { id: true, nom: true, adresse: true, codePostal: true, ville: true },
    orderBy: { nom: "asc" },
  });

  console.log(
    `${centres.length} centre(s) à traiter${dryRun ? " (simulation)" : ""}.\n`,
  );

  let geocodes = 0;
  let parReferentiel = 0;
  const echecs: string[] = [];

  for (const centre of centres) {
    let coords: { lat: number; lng: number } | null = null;
    let source = "";

    for (const requete of requetes(centre)) {
      coords = await geocodeAddress(requete);
      if (coords) {
        source = requete;
        break;
      }
      await pause(PAUSE_MS);
    }

    // Dernier recours : la commune du référentiel local. Moins précis qu'une
    // adresse, mais sans commune mesure avec l'absence totale de coordonnées.
    if (!coords && centre.ville) {
      const reference = getVille(slugifyVille(centre.ville));
      if (reference) {
        coords = { lat: reference.lat, lng: reference.lng };
        source = `référentiel (${reference.nom})`;
        parReferentiel++;
      }
    } else if (coords) {
      geocodes++;
    }

    if (!coords) {
      echecs.push(`${centre.nom} — ${centre.adresse ?? "?"}, ${centre.codePostal ?? "?"} ${centre.ville ?? "?"}`);
      console.log(`  ✗ ${centre.nom}`);
      continue;
    }

    if (!dryRun) {
      await prisma.centre.update({
        where: { id: centre.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      });
    }
    console.log(`  ✓ ${centre.nom} → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}  [${source}]`);

    await pause(PAUSE_MS);
  }

  console.log(
    `\n${geocodes} géocodé(s) par adresse, ${parReferentiel} par le référentiel communal, ` +
      `${echecs.length} en échec.`,
  );
  if (echecs.length > 0) {
    console.log("\nFiches restées sans coordonnées (adresse à corriger) :");
    echecs.forEach((e) => console.log(`  - ${e}`));
  }
  if (dryRun) console.log("\nSimulation : aucune écriture en base.");
}

main().finally(() => prisma.$disconnect());
