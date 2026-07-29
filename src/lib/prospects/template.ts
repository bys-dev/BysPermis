/**
 * Rendu dynamique des emails de campagne.
 *
 * Le staff rédige un seul message contenant des variables `{{nom}}`,
 * `{{ville}}`… et chaque prospect reçoit une version personnalisée. Deux
 * garde-fous importants :
 *
 *  1. Les valeurs viennent de fichiers importés, donc non fiables : elles sont
 *     échappées avant injection dans le HTML.
 *  2. Un placeholder inconnu n'est jamais envoyé tel quel (« Bonjour {{prenom}} »
 *     dans la boîte du prospect) : il est remplacé par sa valeur de repli, et
 *     signalé à la prévisualisation.
 *
 * Le pied de page (identité de l'expéditeur + lien de désinscription) est ajouté
 * systématiquement : le démarchage B2B se fait sur la base de l'opposition, ce
 * qui impose un moyen de refus simple et fonctionnel.
 */

import { escapeHtml } from "@/lib/utils";

const APP_URL = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

/** Prospect minimal nécessaire au rendu — évite de dépendre du type Prisma complet. */
export interface TemplateProspect {
  nom: string;
  raisonSociale?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  departement?: string | null;
  email?: string | null;
  telephone?: string | null;
  siteWeb?: string | null;
  agrementNumber?: string | null;
  contactNom?: string | null;
  contactPrenom?: string | null;
  contactFonction?: string | null;
  unsubscribeToken: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  example: string;
}

/** Catalogue exposé à l'éditeur de campagne (insertion en un clic). */
export const PROSPECT_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: "nom", label: "Nom du centre", example: "Centre Auto Formation" },
  { key: "raisonSociale", label: "Raison sociale", example: "AUTO FORMATION SARL" },
  { key: "ville", label: "Ville", example: "Cergy" },
  { key: "codePostal", label: "Code postal", example: "95000" },
  { key: "departement", label: "Département", example: "95" },
  { key: "contactNom", label: "Nom du contact", example: "Dupont" },
  { key: "contactPrenom", label: "Prénom du contact", example: "Marc" },
  { key: "contactFonction", label: "Fonction du contact", example: "Gérant" },
  { key: "salutation", label: "Salutation auto", example: "Bonjour Marc Dupont," },
  { key: "telephone", label: "Téléphone", example: "01 23 45 67 89" },
  { key: "siteWeb", label: "Site web", example: "https://exemple.fr" },
  { key: "agrementNumber", label: "N° d'agrément", example: "R 21 095 0001 0" },
  { key: "lienInscription", label: "Lien vers le formulaire partenaire", example: `${APP_URL}/devenir-partenaire` },
  { key: "lienSite", label: "Lien vers le site", example: APP_URL },
  { key: "lienDesinscription", label: "Lien de désinscription", example: `${APP_URL}/desabonnement/…` },
];

export function unsubscribeUrl(token: string): string {
  return `${APP_URL}/desabonnement/${token}`;
}

/**
 * Construit le dictionnaire de variables d'un prospect.
 * Les valeurs absentes deviennent une chaîne vide : c'est la syntaxe de repli
 * `{{ville|votre secteur}}` qui gère élégamment les fiches incomplètes.
 */
export function buildProspectVariables(prospect: TemplateProspect): Record<string, string> {
  const prenom = (prospect.contactPrenom ?? "").trim();
  const nomContact = (prospect.contactNom ?? "").trim();
  const identite = [prenom, nomContact].filter(Boolean).join(" ");

  return {
    nom: prospect.nom ?? "",
    raisonSociale: prospect.raisonSociale ?? "",
    ville: prospect.ville ?? "",
    codePostal: prospect.codePostal ?? "",
    departement: prospect.departement ?? "",
    contactNom: nomContact,
    contactPrenom: prenom,
    contactFonction: prospect.contactFonction ?? "",
    // Sans interlocuteur identifié, on reste sur un « Bonjour, » neutre plutôt
    // qu'un « Bonjour , » disgracieux.
    salutation: identite ? `Bonjour ${identite},` : "Bonjour,",
    telephone: prospect.telephone ?? "",
    siteWeb: prospect.siteWeb ?? "",
    agrementNumber: prospect.agrementNumber ?? "",
    email: prospect.email ?? "",
    lienInscription: `${APP_URL}/devenir-partenaire`,
    lienSite: APP_URL,
    lienDesinscription: unsubscribeUrl(prospect.unsubscribeToken),
  };
}

/** Placeholder : `{{cle}}` ou `{{cle|valeur de repli}}`. */
const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*(?:\|([^}]*))?\}\}/g;

export interface RenderResult {
  output: string;
  /** Variables employées dans le texte mais absentes du catalogue. */
  unknown: string[];
  /** Variables connues mais vides pour ce prospect et sans repli. */
  empty: string[];
}

/**
 * Remplace les placeholders d'un texte.
 * `escape: true` pour le corps HTML, `false` pour l'objet (texte brut).
 */
export function renderTemplate(
  text: string,
  variables: Record<string, string>,
  opts: { escape?: boolean } = {},
): RenderResult {
  const escapeValues = opts.escape ?? true;
  const unknown = new Set<string>();
  const empty = new Set<string>();

  const output = text.replace(PLACEHOLDER_RE, (_match, rawKey: string, fallback?: string) => {
    const key = rawKey.trim();
    const known = Object.prototype.hasOwnProperty.call(variables, key);
    if (!known) unknown.add(key);

    let value = known ? variables[key] : "";
    if (!value) {
      if (fallback !== undefined) {
        value = fallback.trim();
      } else if (known) {
        empty.add(key);
      }
    }
    // Un placeholder non résolu est retiré : jamais de « {{ville}} » en clair
    // dans la boîte de réception d'un prospect.
    return escapeValues ? escapeHtml(value) : value;
  });

  return { output, unknown: [...unknown], empty: [...empty] };
}

/**
 * Habillage du corps rédigé par le staff : en-tête léger, corps, puis mentions
 * légales et lien de désinscription.
 *
 * Volontairement sobre — un email de démarchage trop « marketing » (grosses
 * images, boutons multiples) dégrade la délivrabilité.
 */
export function wrapCampaignHtml(params: {
  bodyHtml: string;
  desinscriptionUrl: string;
  fromName?: string | null;
}): string {
  const expediteur = params.fromName?.trim() || "BYS Permis";
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;font-size:15px;line-height:1.6">
  <div style="padding:8px 0 20px">
    ${params.bodyHtml}
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 14px"/>
  <div style="color:#9ca3af;font-size:11px;line-height:1.6">
    <p style="margin:0 0 6px">
      ${escapeHtml(expediteur)} — plateforme de réservation de stages de récupération de points.
      Ce message vous est adressé dans un cadre professionnel, à l'adresse de votre centre agréé.
    </p>
    <p style="margin:0">
      Vous ne souhaitez plus recevoir nos messages ?
      <a href="${params.desinscriptionUrl}" style="color:#6b7280;text-decoration:underline">Se désinscrire en un clic</a>.
    </p>
  </div>
</div>`;
}

export interface RenderedCampaignEmail {
  subject: string;
  html: string;
  unknown: string[];
  empty: string[];
}

/** Rend l'objet + le corps complet (habillage inclus) pour un prospect donné. */
export function renderCampaignEmail(params: {
  sujet: string;
  contenu: string;
  fromName?: string | null;
  prospect: TemplateProspect;
}): RenderedCampaignEmail {
  const variables = buildProspectVariables(params.prospect);

  const subject = renderTemplate(params.sujet, variables, { escape: false });
  const body = renderTemplate(params.contenu, variables, { escape: true });

  return {
    subject: subject.output.trim(),
    html: wrapCampaignHtml({
      bodyHtml: body.output,
      desinscriptionUrl: variables.lienDesinscription,
      fromName: params.fromName,
    }),
    unknown: [...new Set([...subject.unknown, ...body.unknown])],
    empty: [...new Set([...subject.empty, ...body.empty])],
  };
}

/**
 * Contrôle de cohérence avant enregistrement / envoi d'une campagne.
 * Renvoie des messages prêts à afficher (bloquants et non bloquants).
 */
export function validateCampaignTemplate(params: { sujet: string; contenu: string }): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const known = new Set(PROSPECT_TEMPLATE_VARIABLES.map((v) => v.key));

  if (!params.sujet.trim()) errors.push("L'objet de l'email est obligatoire.");
  if (!params.contenu.trim()) errors.push("Le contenu de l'email est obligatoire.");
  if (params.sujet.length > 200) errors.push("L'objet dépasse 200 caractères.");

  const used = new Set<string>();
  for (const text of [params.sujet, params.contenu]) {
    for (const match of text.matchAll(PLACEHOLDER_RE)) used.add(match[1].trim());
  }
  const unknownVars = [...used].filter((k) => !known.has(k));
  if (unknownVars.length > 0) {
    errors.push(
      `Variable(s) inconnue(s) : ${unknownVars.map((v) => `{{${v}}}`).join(", ")}. ` +
        `Elles seraient remplacées par du vide à l'envoi.`,
    );
  }

  return { errors, warnings };
}
