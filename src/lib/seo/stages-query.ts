/**
 * Requête commune aux pages SEO locales (`/stages/[ville]`,
 * `/stages/departement/[dept]`).
 *
 * Principe : on ne filtre pas en base sur le libellé de commune. Le champ
 * `Centre.ville` est saisi librement par les centres — « St-Étienne »,
 * « SAINT ETIENNE », « Saint-Etienne » désignent la même ville et un `equals`
 * en manquerait la plupart. On récupère donc les sessions réservables, puis on
 * classe par distance réelle, ce qui a un second bénéfice : une page ville sans
 * centre sur place propose les sessions des communes voisines au lieu d'être
 * une page vide (qui serait à la fois inutile pour l'internaute et traitée en
 * soft 404 par Google).
 */

import { prisma } from "@/lib/prisma";
import {
  deptFromCodePostal,
  distanceKm,
  getVille,
  slugifyVille,
  type Ville,
} from "./geo-data";

export interface SessionResume {
  id: string;
  dateDebut: Date;
  dateFin: Date;
  placesRestantes: number;
}

export interface FormationProche {
  id: string;
  titre: string;
  slug: string;
  description: string;
  prix: number;
  duree: string;
  isCPF: boolean;
  centre: {
    nom: string;
    slug: string;
    ville: string;
    codePostal: string;
    adresse: string;
    latitude: number | null;
    longitude: number | null;
  };
  sessions: SessionResume[];
  /** Département déduit du code postal du centre. */
  dept: string | null;
  /** Distance au point de référence, en km. `null` si non calculable. */
  distanceKm: number | null;
  /** Le centre est-il dans la commune de référence ? */
  memeVille: boolean;
}

/** Plafond de sécurité : au-delà, la page n'affiche plus rien de pertinent. */
const MAX_FORMATIONS = 300;

/**
 * Mémoïsation courte de la requête.
 *
 * Les 240 pages villes et 101 pages départements sont prérendues au build et
 * posent toutes exactement la même question à la base. Comme `next.config`
 * force `cpus: 1`, elles sont générées dans un seul processus : un cache de
 * module suffit à ramener 341 requêtes à une seule.
 *
 * Le même cache absorbe au passage les rafales de revalidation ISR en
 * production. La fenêtre est délibérément courte — 60 s — parce que la donnée
 * porte des places restantes : au-delà, on afficherait des sessions complètes.
 */
const TTL_MS = 60_000;
let cache: { at: number; promise: ReturnType<typeof queryFormations> } | null = null;

function queryFormations() {
  return prisma.formation.findMany({
    where: {
      isActive: true,
      centre: { isActive: true, statut: "ACTIF" },
      sessions: {
        some: { status: "ACTIVE", dateDebut: { gte: new Date() }, placesRestantes: { gt: 0 } },
      },
    },
    select: {
      id: true,
      titre: true,
      slug: true,
      description: true,
      prix: true,
      duree: true,
      isCPF: true,
      centre: {
        select: {
          nom: true,
          slug: true,
          ville: true,
          codePostal: true,
          adresse: true,
          latitude: true,
          longitude: true,
        },
      },
      sessions: {
        where: { status: "ACTIVE", dateDebut: { gte: new Date() }, placesRestantes: { gt: 0 } },
        orderBy: { dateDebut: "asc" },
        take: 3,
        select: { id: true, dateDebut: true, dateFin: true, placesRestantes: true },
      },
    },
    take: MAX_FORMATIONS,
  });
}

function fetchFormationsReservables() {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.promise;

  const promise = queryFormations();
  cache = { at: now, promise };
  // Une requête en échec ne doit pas rester en cache pendant toute la fenêtre :
  // sinon un incident réseau d'une seconde viderait les pages pendant 60 s.
  promise.catch(() => {
    if (cache?.promise === promise) cache = null;
  });
  return promise;
}

/**
 * Coordonnées du centre : celles saisies si disponibles, sinon celles de sa
 * commune dans le référentiel. Sans l'un ni l'autre, la distance est inconnue
 * et le résultat est relégué en fin de liste plutôt qu'exclu.
 */
function coordsDuCentre(centre: {
  ville: string;
  latitude: number | null;
  longitude: number | null;
}): { lat: number; lng: number } | null {
  if (centre.latitude != null && centre.longitude != null) {
    return { lat: centre.latitude, lng: centre.longitude };
  }
  const ref = getVille(slugifyVille(centre.ville));
  return ref ? { lat: ref.lat, lng: ref.lng } : null;
}

/**
 * Formations réservables classées par proximité d'une ville.
 * Retourne toujours une liste (vide si la base est indisponible au build).
 */
export async function formationsAutourDe(
  ville: Ville,
  opts: { rayonKm?: number; limite?: number } = {},
): Promise<FormationProche[]> {
  const rayon = opts.rayonKm ?? 80;
  const limite = opts.limite ?? 20;

  let rows: Awaited<ReturnType<typeof fetchFormationsReservables>>;
  try {
    rows = await fetchFormationsReservables();
  } catch {
    return []; // base indisponible pendant le build
  }

  const villeSlug = ville.slug;

  return rows
    .map((f) => {
      const coords = coordsDuCentre(f.centre);
      const d = coords ? distanceKm(ville, coords) : null;
      return {
        ...f,
        dept: deptFromCodePostal(f.centre.codePostal),
        distanceKm: d === null ? null : Math.round(d),
        memeVille: slugifyVille(f.centre.ville) === villeSlug,
      };
    })
    .filter((f) => f.memeVille || f.distanceKm === null || f.distanceKm <= rayon)
    .sort((a, b) => {
      if (a.memeVille !== b.memeVille) return a.memeVille ? -1 : 1;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return a.prix - b.prix;
    })
    .slice(0, limite);
}

/** Formations réservables d'un département, complétées par les alentours. */
export async function formationsDuDepartement(
  code: string,
  centreGeo: { lat: number; lng: number },
  opts: { rayonKm?: number; limite?: number } = {},
): Promise<FormationProche[]> {
  const rayon = opts.rayonKm ?? 100;
  const limite = opts.limite ?? 30;

  let rows: Awaited<ReturnType<typeof fetchFormationsReservables>>;
  try {
    rows = await fetchFormationsReservables();
  } catch {
    return [];
  }

  return rows
    .map((f) => {
      const coords = coordsDuCentre(f.centre);
      const d = coords ? distanceKm(centreGeo, coords) : null;
      const dept = deptFromCodePostal(f.centre.codePostal);
      return {
        ...f,
        dept,
        distanceKm: d === null ? null : Math.round(d),
        memeVille: dept === code, // ici : « même département »
      };
    })
    .filter((f) => f.memeVille || (f.distanceKm !== null && f.distanceKm <= rayon))
    .sort((a, b) => {
      if (a.memeVille !== b.memeVille) return a.memeVille ? -1 : 1;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, limite);
}

/** Fourchette de prix observée, pour l'AggregateOffer et l'affichage. */
export function fourchettePrix(
  formations: FormationProche[],
): { min: number; max: number; count: number } | null {
  if (formations.length === 0) return null;
  const prix = formations.map((f) => f.prix);
  return { min: Math.min(...prix), max: Math.max(...prix), count: prix.length };
}
