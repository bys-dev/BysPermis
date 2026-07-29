/**
 * Champs importables d'un prospect + reconnaissance automatique des colonnes.
 *
 * Les fichiers de prospection viennent de sources hétérogènes (listes
 * préfectorales, exports annuaire, fichiers bricolés à la main) : les en-têtes
 * ne sont jamais normalisés. On mappe donc chaque colonne du fichier vers un
 * champ `Prospect` à partir d'une liste d'alias, en comparant des libellés
 * normalisés (minuscules, sans accents, sans ponctuation).
 */

/** Champs de `Prospect` alimentables par un import de fichier. */
export const PROSPECT_FIELDS = [
  "nom",
  "raisonSociale",
  "siret",
  "agrementNumber",
  "agrementDepartement",
  "email",
  "telephone",
  "siteWeb",
  "adresse",
  "codePostal",
  "ville",
  "departement",
  "contactNom",
  "contactPrenom",
  "contactFonction",
  "notesInternes",
  "source",
] as const;

export type ProspectField = (typeof PROSPECT_FIELDS)[number];

/** Seul champ réellement obligatoire : sans nom, la ligne est inexploitable. */
export const REQUIRED_FIELDS: ProspectField[] = ["nom"];

/** Libellés lisibles pour l'UI de mappage. */
export const FIELD_LABELS: Record<ProspectField, string> = {
  nom: "Nom du centre",
  raisonSociale: "Raison sociale",
  siret: "SIRET",
  agrementNumber: "N° d'agrément",
  agrementDepartement: "Département d'agrément",
  email: "Email",
  telephone: "Téléphone",
  siteWeb: "Site web",
  adresse: "Adresse",
  codePostal: "Code postal",
  ville: "Ville",
  departement: "Département",
  contactNom: "Nom du contact",
  contactPrenom: "Prénom du contact",
  contactFonction: "Fonction du contact",
  notesInternes: "Notes internes",
  source: "Source",
};

/**
 * Alias d'en-têtes par champ, sous forme normalisée (cf. `normalizeHeader`).
 * L'ordre compte : le premier alias qui matche gagne, et les champs sont testés
 * dans l'ordre de `PROSPECT_FIELDS` — d'où les alias les plus spécifiques
 * placés sur les champs les plus spécifiques (ex. « departement agrement »
 * appartient à `agrementDepartement`, pas à `departement`).
 */
const FIELD_ALIASES: Record<ProspectField, string[]> = {
  nom: [
    "nom",
    "nom du centre",
    "nom centre",
    "centre",
    "nom commercial",
    "denomination",
    "designation",
    "etablissement",
    "organisme",
    "structure",
    "nom de l organisme",
  ],
  raisonSociale: [
    "raison sociale",
    "raisonsociale",
    "societe",
    "nom juridique",
    "denomination sociale",
  ],
  siret: ["siret", "n siret", "numero siret", "no siret", "siren", "n siren"],
  agrementNumber: [
    "agrement",
    "n agrement",
    "no agrement",
    "numero agrement",
    "numero d agrement",
    "n d agrement",
    "numero d autorisation",
    "reference agrement",
  ],
  agrementDepartement: [
    "departement agrement",
    "departement d agrement",
    "dept agrement",
    "departement de delivrance",
  ],
  email: [
    "email",
    "e mail",
    "mail",
    "courriel",
    "adresse email",
    "adresse mail",
    "adresse electronique",
    "mail contact",
    "email contact",
  ],
  telephone: [
    "telephone",
    "tel",
    "tel fixe",
    "telephone fixe",
    "numero de telephone",
    "n telephone",
    "portable",
    "mobile",
    "gsm",
  ],
  siteWeb: ["site web", "siteweb", "site", "site internet", "url", "www", "page web"],
  adresse: [
    "adresse",
    "adresse postale",
    "rue",
    "voie",
    "numero et rue",
    "adresse du centre",
    "adresse 1",
  ],
  codePostal: ["code postal", "codepostal", "cp", "c p", "code post", "zip"],
  ville: ["ville", "commune", "localite", "ville commune", "lieu"],
  departement: ["departement", "dept", "dep", "n departement", "no departement", "departement num"],
  contactNom: [
    "contact",
    "nom contact",
    "nom du contact",
    "nom responsable",
    "nom du responsable",
    "responsable",
    "gerant",
    "dirigeant",
    "interlocuteur",
    "representant",
    "representant legal",
  ],
  contactPrenom: ["prenom", "prenom contact", "prenom du contact", "prenom responsable"],
  contactFonction: ["fonction", "qualite", "poste", "titre", "role"],
  notesInternes: ["notes", "note", "commentaire", "commentaires", "observations", "remarques", "info"],
  source: ["source", "origine", "provenance"],
};

/**
 * Normalise un en-tête pour la comparaison : minuscules, accents retirés,
 * ponctuation et séparateurs ramenés à des espaces simples.
 * « N° d'Agrément » → « n d agrement »
 */
export function normalizeHeader(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export type ColumnMapping = Record<string, ProspectField | null>;

/**
 * Devine la correspondance colonne → champ pour un jeu d'en-têtes.
 *
 * Deux passes : d'abord les égalités exactes sur un alias (fiables), ensuite
 * les correspondances partielles (l'en-tête contient l'alias ou inversement).
 * Un champ déjà attribué n'est pas réutilisé — la première colonne gagne, ce
 * qui évite qu'une colonne « Email 2 » écrase « Email ».
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const taken = new Set<ProspectField>();
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));

  for (const { raw } of normalized) mapping[raw] = null;

  // Passe 1 — égalité exacte sur un alias.
  for (const { raw, norm } of normalized) {
    if (!norm) continue;
    for (const field of PROSPECT_FIELDS) {
      if (taken.has(field)) continue;
      if (FIELD_ALIASES[field].includes(norm)) {
        mapping[raw] = field;
        taken.add(field);
        break;
      }
    }
  }

  // Passe 2 — correspondance partielle sur les colonnes encore libres.
  for (const { raw, norm } of normalized) {
    if (mapping[raw] || !norm) continue;
    for (const field of PROSPECT_FIELDS) {
      if (taken.has(field)) continue;
      const hit = FIELD_ALIASES[field].some(
        (alias) => alias.length >= 3 && (norm.includes(alias) || alias.includes(norm)),
      );
      if (hit) {
        mapping[raw] = field;
        taken.add(field);
        break;
      }
    }
  }

  return mapping;
}
