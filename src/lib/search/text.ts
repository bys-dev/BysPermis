/**
 * Normalisation du texte pour la recherche de stages.
 *
 * PostgreSQL en `mode: "insensitive"` ignore la casse mais **pas** les accents :
 * `contains: "recuperation"` ne trouve pas « récupération ». Sur un site dont la
 * requête principale est justement « stage récupération de points », et que la
 * moitié des visiteurs tape sans accent depuis un mobile, le filtre renvoyait
 * zéro résultat.
 *
 * On règle le problème côté application plutôt qu'avec l'extension `unaccent` :
 * le catalogue tient en quelques centaines de lignes, la base reste portable, et
 * cela permet en prime un vrai classement par pertinence — impossible à obtenir
 * avec un simple `LIKE`.
 */

/** Mots vides : présents dans presque tous les titres, ils ne discriminent rien. */
const MOTS_VIDES = new Set([
  "de", "du", "des", "le", "la", "les", "un", "une", "et", "en", "a", "au", "aux",
  "sur", "pour", "par", "dans", "chez", "mon", "ma", "mes", "je", "veux",
  "stage", "stages", // le site ne vend que ça : le mot ne distingue aucun résultat
]);

/**
 * Minuscules, sans accents, ponctuation réduite à des espaces.
 * « Saint-Étienne » et « saint etienne » donnent la même chaîne.
 */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    // Retire les diacritiques combinants laissés par la décomposition NFD.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // L'apostrophe typographique et le tiret séparent des mots : « L'Aumône »,
    // « Saint-Ouen » doivent se découper comme s'ils étaient espacés.
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Découpe une requête en termes significatifs.
 * Les mots vides sont écartés, sauf si la requête n'est composée que de ceux-ci.
 */
export function termes(requete: string): string[] {
  const bruts = normaliser(requete).split(" ").filter(Boolean);
  const utiles = bruts.filter((t) => t.length > 1 && !MOTS_VIDES.has(t));
  return utiles.length > 0 ? utiles : bruts;
}

/** Un champ indexable et le poids de ses correspondances. */
export interface ChampPondere {
  valeur: string | null | undefined;
  poids: number;
}

/**
 * Score de pertinence d'un document pour une requête.
 *
 * Trois niveaux de correspondance, du plus au moins fort :
 *   - champ égal au terme          → poids × 3
 *   - champ commençant par le terme → poids × 2   (« cerg » → « Cergy »)
 *   - terme contenu dans le champ   → poids × 1
 *
 * Renvoie `0` si un seul des termes n'est trouvé nulle part : une recherche
 * « stage cergy » ne doit pas remonter tous les stages parce que « stage »
 * correspond. C'est un ET, pas un OU.
 */
export function scoreTexte(champs: ChampPondere[], termesRecherche: string[]): number {
  if (termesRecherche.length === 0) return 0;

  const normalises = champs
    .filter((c) => c.valeur)
    .map((c) => ({ texte: normaliser(c.valeur as string), poids: c.poids }));

  let total = 0;

  for (const terme of termesRecherche) {
    let meilleur = 0;
    for (const champ of normalises) {
      if (!champ.texte.includes(terme)) continue;
      const mots = champ.texte.split(" ");
      const facteur = mots.includes(terme) ? 3 : mots.some((m) => m.startsWith(terme)) ? 2 : 1;
      meilleur = Math.max(meilleur, champ.poids * facteur);
    }
    if (meilleur === 0) return 0; // terme absent : le document ne correspond pas
    total += meilleur;
  }

  return total;
}

/** Deux libellés de commune désignent-ils la même ville ? */
export function memeVille(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normaliser(a) === normaliser(b);
}
