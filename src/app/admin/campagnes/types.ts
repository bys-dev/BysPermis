/**
 * Types partagés par les écrans de prospection (éditeur de campagne, sélecteur
 * de destinataires, bibliothèque de modèles).
 *
 * Volontairement dupliqués depuis `lib/prospects` plutôt qu'importés : ces
 * modules tirent Prisma et Resend, qui n'ont rien à faire dans un bundle client.
 */

export type Statut =
  | "NOUVEAU"
  | "A_CONTACTER"
  | "CONTACTE"
  | "RELANCE"
  | "INTERESSE"
  | "INSCRIT"
  | "REFUSE"
  | "INJOIGNABLE"
  | "DESABONNE";

/** Cf. `AudienceMode` côté serveur. */
export type ModeCiblage = "FILTRE" | "SELECTION";

/**
 * Plafond de la sélection nominative — doit rester aligné sur `MAX_SELECTION`
 * de `lib/prospects/audience-schema.ts`, qui fait foi à l'enregistrement.
 * Au-delà, le ciblage par critères est de toute façon plus adapté.
 */
export const MAX_SELECTION = 2000;

export interface AudienceFilter {
  mode?: ModeCiblage;
  prospectIds?: string[];
  statuts?: Statut[];
  departements?: string[];
  sources?: string[];
  importIds?: string[];
  exclureDejaContactes?: boolean;
  exclureCampagneIds?: string[];
  recherche?: string;
}

export interface CampagneForm {
  id?: string;
  nom: string;
  sujet: string;
  contenu: string;
  fromName: string;
  replyTo: string;
  filtre: AudienceFilter;
}

export interface Variable {
  key: string;
  label: string;
  example: string;
}

export interface Modele {
  id: string;
  slug: string | null;
  nom: string;
  moment: string | null;
  objectif: string | null;
  sujet: string;
  contenu: string;
  fromName: string | null;
  replyTo: string | null;
  filtreSuggere: AudienceFilter | null;
  delaiJours: number | null;
  ordre: number;
  isArchive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { prenom: string; nom: string } | null;
}

/** Une ligne de la liste nominative des destinataires. */
export interface Destinataire {
  id: string;
  nom: string;
  raisonSociale: string | null;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  codePostal: string | null;
  departement: string | null;
  contactNom: string | null;
  contactPrenom: string | null;
  statut: Statut;
  nbEmailsEnvoyes: number;
  lastContactedAt: string | null;
}

export interface Facettes {
  departements: { valeur: string; nb: number }[];
  sources: { valeur: string; nb: number }[];
}

export const STATUTS_CIBLABLES: { value: Statut; label: string }[] = [
  { value: "NOUVEAU", label: "Nouveau" },
  { value: "A_CONTACTER", label: "À contacter" },
  { value: "CONTACTE", label: "Contacté" },
  { value: "RELANCE", label: "Relancé" },
  { value: "INTERESSE", label: "Intéressé" },
  { value: "REFUSE", label: "Refusé" },
];

export const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500";
