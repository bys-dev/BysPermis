/**
 * Transcription des listes préfectorales de CSSR (centres de sensibilisation à
 * la sécurité routière) fournies en PDF, vers un jeu de données exploitable.
 *
 * Un même centre apparaît dans plusieurs départements (les réseaux nationaux
 * type Acti Route couvrent la France entière) : on saisit donc une ligne par
 * couple centre × département, fidèle à la source, et l'agrégation vers une
 * fiche prospect unique est faite par `build-xlsx.ts`.
 *
 * Règle de saisie : on ne renseigne un champ que si la source l'attribue sans
 * ambiguïté. Les tableaux PDF ont des cellules verticalement décalées ; en cas
 * de doute sur l'attribution d'un téléphone ou d'une adresse, on laisse vide
 * plutôt que de risquer une donnée fausse dans un fichier de démarchage.
 */

export interface CssrRow {
  /** Nom du centre tel qu'il figure sur la liste préfectorale. */
  nom: string;
  /** N° d'agrément préfectoral, format non normalisé d'un département à l'autre. */
  agrement?: string;
  email?: string;
  /** Téléphone principal ; les numéros secondaires vont dans `note`. */
  telephone?: string;
  siteWeb?: string;
  /** Adresse du siège / bureau (pas le lieu de stage). */
  adresse?: string;
  codePostal?: string;
  /** Ville du siège. */
  ville?: string;
  /** Département où le centre est agréé (code INSEE sur 2 ou 3 caractères). */
  dept: string;
  contactNom?: string;
  contactPrenom?: string;
  contactFonction?: string;
  /** Communes ou salles où les stages sont organisés. */
  lieux?: string;
  /** Fichier PDF d'origine. */
  sourcePdf: string;
  /** Date de mise à jour affichée sur la liste. */
  maj?: string;
  /** Réserve de saisie : ambiguïté, numéro secondaire, email tronqué… */
  note?: string;
}
