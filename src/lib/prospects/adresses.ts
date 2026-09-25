/**
 * Lecture des adresses email collées à la main dans l'éditeur de campagne.
 *
 * Module pur (aucune dépendance serveur) : le même découpage sert à l'aperçu
 * immédiat côté client et à la validation côté serveur.
 */

/** Longueur maximale d'une adresse (RFC 5321). */
const LONGUEUR_MAX = 254;

const EMAIL_RE = /^[a-z0-9.!#$%&*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

/** Forme canonique d'une adresse : sans espaces ni `mailto:`, en minuscules. */
export function normaliserAdresse(brute: string): string {
  return brute
    .trim()
    .replace(/^mailto:/i, "")
    .replace(/^[("'[]+|[)"'\].,:;!?]+$/g, "")
    .toLowerCase();
}

export function estAdresseValide(adresse: string): boolean {
  return adresse.length <= LONGUEUR_MAX && EMAIL_RE.test(adresse) && !adresse.includes("..");
}

export interface AnalyseAdresses {
  /** Adresses valides, normalisées, sans doublon, dans l'ordre de saisie. */
  valides: string[];
  /** Morceaux contenant un « @ » mais qui ne forment pas une adresse. */
  invalides: string[];
  /** Adresses déjà saisies plus haut ou déjà présentes dans la campagne. */
  doublons: string[];
}

/**
 * Découpe un texte libre en adresses.
 *
 * Séparateurs acceptés : virgule, point-virgule, espaces et retours à la ligne.
 * La forme « Nom <adresse> » copiée depuis un client mail est comprise : le
 * nom est ignoré (tout morceau sans « @ » l'est), seule l'adresse est gardée.
 */
export function analyserAdresses(texte: string, dejaPresentes: Iterable<string> = []): AnalyseAdresses {
  const vues = new Set<string>();
  for (const a of dejaPresentes) vues.add(normaliserAdresse(a));

  const valides: string[] = [];
  const invalides: string[] = [];
  const doublons: string[] = [];

  const morceaux = texte.replace(/<([^<>]*)>/g, " $1 ").split(/[\s,;]+/);
  for (const morceau of morceaux) {
    if (!morceau.includes("@")) continue;
    const adresse = normaliserAdresse(morceau);
    if (!estAdresseValide(adresse)) {
      invalides.push(morceau.trim());
      continue;
    }
    if (vues.has(adresse)) {
      if (!doublons.includes(adresse)) doublons.push(adresse);
      continue;
    }
    vues.add(adresse);
    valides.push(adresse);
  }

  return { valides, invalides, doublons };
}
