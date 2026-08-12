/**
 * Classement des résultats de recherche de stages.
 *
 * Le filtrage dur (centre actif, session à venir avec des places, fourchette de
 * prix) reste en base. Le classement, lui, se fait ici : trier par pertinence
 * suppose de pondérer plusieurs signaux, et trier « par date » suppose de
 * regarder la date de la *prochaine session* — une relation, qu'un `orderBy`
 * Prisma ne sait pas atteindre. Le catalogue se compte en centaines de lignes,
 * l'opération est donc négligeable.
 */

import {
  deptFromCodePostal,
  distanceKm,
  getVille,
  slugifyVille,
  VILLES,
} from "@/lib/seo/geo-data";
import { memeVille, normaliser, scoreTexte } from "./text";

export type Tri = "pertinence" | "prix_asc" | "prix_desc" | "date";

export const TRIS: Tri[] = ["pertinence", "prix_asc", "prix_desc", "date"];

export function estTri(valeur: string | null | undefined): valeur is Tri {
  return TRIS.includes(valeur as Tri);
}

export interface CentreRecherche {
  nom: string;
  ville: string;
  codePostal?: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface FormationRecherche {
  titre: string;
  description?: string | null;
  prix: number;
  lieu?: string | null;
  centre: CentreRecherche;
  categorie?: { nom: string } | null;
  sessions: Array<{ dateDebut: Date | string }>;
}

export interface Coordonnees {
  lat: number;
  lng: number;
}

/**
 * Coordonnées d'un centre.
 *
 * Beaucoup de fiches n'ont pas de latitude/longitude — la saisie ne les impose
 * pas. Plutôt que d'exclure ces centres de toute recherche géographique (ce qui
 * les rendait purement invisibles), on retombe sur les coordonnées de leur
 * commune dans le référentiel : à l'échelle d'un rayon de 25 km, l'écart entre
 * le centre-ville et l'adresse exacte est sans conséquence.
 */
export function coordsCentre(centre: CentreRecherche): Coordonnees | null {
  if (centre.latitude != null && centre.longitude != null) {
    return { lat: centre.latitude, lng: centre.longitude };
  }
  const reference = getVille(slugifyVille(centre.ville ?? ""));
  return reference ? { lat: reference.lat, lng: reference.lng } : null;
}

/**
 * Coordonnées d'un lieu saisi (ville ou code postal), depuis le seul
 * référentiel local — sans appel réseau. L'appelant se rabat sur le géocodeur
 * uniquement en cas d'échec, ce qui évite un aller-retour HTTP sur les
 * recherches courantes.
 */
export function resoudreLieu(saisie: string): Coordonnees | null {
  const brut = saisie.trim();
  if (!brut) return null;

  const parCodePostal = /^\d{4,5}$/.test(brut);
  if (parCodePostal) {
    const reference = villeParCodePostal(brut);
    return reference ? { lat: reference.lat, lng: reference.lng } : null;
  }

  const reference = getVille(slugifyVille(brut));
  return reference ? { lat: reference.lat, lng: reference.lng } : null;
}

function villeParCodePostal(cp: string) {
  const exact = VILLES.find((v) => v.cp === cp);
  if (exact) return exact;
  // Code postal inconnu : la préfecture du département reste une approximation
  // acceptable pour amorcer un rayon de recherche.
  const dept = deptFromCodePostal(cp);
  return dept ? VILLES.filter((v) => v.dept === dept).sort((a, b) => b.pop - a.pop)[0] : undefined;
}

/** Date de la prochaine session, en millisecondes. `null` si aucune. */
function prochaineSession(formation: FormationRecherche): number | null {
  let plusTot: number | null = null;
  for (const session of formation.sessions) {
    const ms = new Date(session.dateDebut).getTime();
    if (Number.isNaN(ms)) continue;
    if (plusTot === null || ms < plusTot) plusTot = ms;
  }
  return plusTot;
}

/**
 * BYS exploite la marketplace : ses propres sessions passent devant à
 * pertinence égale. Le tri par prix ou par date, lui, n'est jamais faussé —
 * l'internaute qui demande « le moins cher » doit obtenir le moins cher.
 */
function estBys(centre: CentreRecherche): boolean {
  return normaliser(centre.nom).includes("bys");
}

export interface OptionsClassement {
  /** Termes de la requête libre, déjà normalisés (cf. `termes()`). */
  termesRecherche?: string[];
  /** Point de référence du calcul de distance. */
  origine?: Coordonnees | null;
  /** Commune saisie, pour rattraper les centres sans coordonnées. */
  villeRecherchee?: string | null;
  rayonKm?: number;
  tri?: Tri;
}

export interface Classement<T> {
  resultats: Array<T & { distance: number | null }>;
  /**
   * Le rayon demandé ne ramenait rien : les résultats renvoyés sont les plus
   * proches au-delà de ce rayon. L'interface doit le dire à l'internaute plutôt
   * que d'afficher une page vide.
   */
  elargi: boolean;
}

/**
 * Filtre et ordonne les formations.
 *
 * Une recherche géographique qui ne ramène rien dans le rayon demandé n'est pas
 * traitée comme un échec : on élargit et on signale l'élargissement. Une page
 * « aucun résultat » sur un site de réservation est presque toujours une
 * occasion manquée — le stage suivant est souvent à 30 km.
 */
export function classerFormations<T extends FormationRecherche>(
  formations: T[],
  options: OptionsClassement = {},
): Classement<T> {
  const termesRecherche = options.termesRecherche ?? [];
  const origine = options.origine ?? null;
  const rayon = options.rayonKm ?? 25;
  const tri = options.tri ?? "pertinence";

  const enrichies = formations.map((formation) => {
    const coords = coordsCentre(formation.centre);
    const distance =
      origine && coords ? Math.round(distanceKm(origine, coords) * 10) / 10 : null;

    return {
      formation,
      distance,
      score: termesRecherche.length
        ? scoreTexte(
            [
              { valeur: formation.centre.ville, poids: 6 },
              { valeur: formation.centre.nom, poids: 5 },
              { valeur: formation.titre, poids: 4 },
              { valeur: formation.lieu, poids: 3 },
              { valeur: formation.categorie?.nom, poids: 2 },
              { valeur: formation.description, poids: 1 },
            ],
            termesRecherche,
          )
        : 0,
      dateMs: prochaineSession(formation),
      bys: estBys(formation.centre),
      surPlace: memeVille(formation.centre.ville, options.villeRecherchee),
    };
  });

  // Un terme de recherche non trouvé écarte la formation : c'est un ET.
  const pertinentes = termesRecherche.length
    ? enrichies.filter((e) => e.score > 0)
    : enrichies;

  // Commune saisie mais introuvable dans le référentiel et non géocodable : sans
  // point de référence, elle reste un filtre textuel. Sinon une recherche
  // « Trifouillis » renverrait le catalogue entier.
  const communeRecherchee = options.villeRecherchee?.trim();
  const filtreCommune = !origine && communeRecherchee ? normaliser(communeRecherchee) : null;
  const situees = filtreCommune
    ? pertinentes.filter(
        (e) =>
          normaliser(e.formation.centre.ville ?? "").includes(filtreCommune) ||
          normaliser(e.formation.lieu ?? "").includes(filtreCommune),
      )
    : pertinentes;

  const dansLeRayon = origine
    ? situees.filter((e) => e.surPlace || (e.distance !== null && e.distance <= rayon))
    : situees;

  // Rien dans le rayon : on rend les plus proches plutôt qu'une page vide.
  const elargi = origine !== null && dansLeRayon.length === 0 && situees.length > 0;
  const retenues = elargi
    ? [...situees].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : dansLeRayon;

  const ordonnees = [...retenues].sort((a, b) => {
    switch (tri) {
      case "prix_asc":
        return a.formation.prix - b.formation.prix || compareDistance(a, b);
      case "prix_desc":
        return b.formation.prix - a.formation.prix || compareDistance(a, b);
      case "date":
        return compareDate(a, b) || compareDistance(a, b);
      case "pertinence":
      default: {
        if (a.bys !== b.bys) return a.bys ? -1 : 1;
        if (a.surPlace !== b.surPlace) return a.surPlace ? -1 : 1;
        if (b.score !== a.score) return b.score - a.score;
        return compareDistance(a, b) || compareDate(a, b);
      }
    }
  });

  return {
    resultats: ordonnees.map((e) => ({ ...e.formation, distance: e.distance })),
    elargi,
  };
}

function compareDistance(a: { distance: number | null }, b: { distance: number | null }): number {
  // Une distance inconnue ne doit jamais passer devant une distance connue.
  if (a.distance === null && b.distance === null) return 0;
  if (a.distance === null) return 1;
  if (b.distance === null) return -1;
  return a.distance - b.distance;
}

function compareDate(a: { dateMs: number | null }, b: { dateMs: number | null }): number {
  if (a.dateMs === null && b.dateMs === null) return 0;
  if (a.dateMs === null) return 1;
  if (b.dateMs === null) return -1;
  return a.dateMs - b.dateMs;
}
