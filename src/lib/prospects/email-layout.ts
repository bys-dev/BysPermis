/**
 * Gabarit HTML des emails de campagne.
 *
 * Le staff rédige un corps « libre » (HTML plus ou moins complet, parfois du
 * texte brut avec des retours à la ligne). Ce module le transforme en email
 * propre et lisible dans tous les clients :
 *
 *  1. `normaliserCorps` — le texte hors balises de bloc devient des paragraphes
 *     (ligne vide = nouveau paragraphe, retour simple = `<br/>`) et les URL nues
 *     deviennent des liens. Le HTML déjà structuré n'est pas retouché.
 *  2. `stylerCorps` — styles inline sur les balises courantes : les clients
 *     mail (Gmail en tête) ignorent souvent les feuilles de style.
 *  3. `boutonsInscription` — un lien vers le formulaire partenaire seul (ou en
 *     fin) de paragraphe devient un bouton « bulletproof » (table + fond).
 *  4. `habillerEmail` — mise en page à base de tables, 600 px max, logo, carte
 *     blanche et pied de page légal avec le lien de désinscription.
 *
 * `htmlVersTexte` produit la version texte envoyée en parallèle (meilleure
 * délivrabilité, lisible par les clients sans HTML).
 *
 * Module pur, sans dépendance serveur : il est rendu côté serveur (envoi et
 * API d'aperçu) — l'aperçu de l'admin affiche exactement ce qui part.
 */

import { escapeHtml } from "@/lib/utils";

// Même construction que `LOGO_IMG` dans `lib/email.ts` : PNG servi par le site,
// fiable sur tous les clients (Outlook compris).
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";
const LOGO_URL = `${SITE_URL}/colored-logo.png`;

export const COULEURS_EMAIL = {
  navy: "#14306B",
  bleu: "#2563EB",
  texte: "#1F2937",
  texteDoux: "#64748B",
  fond: "#F1F5F9",
  bordure: "#E2E8F0",
} as const;

const POLICE = "Arial,'Helvetica Neue',Helvetica,sans-serif";

/** Libellé du bouton quand le lien affiche une URL brute. */
export const LIBELLE_BOUTON_INSCRIPTION = "Devenir centre partenaire";

// ─── 1. Normalisation du corps ───────────────────────────

/** Balises qui structurent déjà le contenu : leur intérieur n'est pas retouché. */
const BALISES_BLOC = new Set([
  "p", "div", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "center", "section",
  "article", "header", "footer", "figure", "dl", "dt", "dd",
]);
const BALISES_BLOC_VIDES = new Set(["hr"]);

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

/** Transforme les URL nues d'un fragment en liens, sans toucher aux attributs ni aux liens existants. */
function lierUrlsNues(fragment: string): string {
  let dansLien = 0;
  return fragment
    .split(/(<[^>]*>)/g)
    .map((morceau) => {
      if (morceau.startsWith("<")) {
        if (/^<a[\s>]/i.test(morceau)) dansLien++;
        else if (/^<\/a\s*>/i.test(morceau)) dansLien = Math.max(0, dansLien - 1);
        return morceau;
      }
      if (dansLien > 0) return morceau;
      return morceau.replace(/https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g, (url) => `<a href="${url}">${url}</a>`);
    })
    .join("");
}

/** Texte hors bloc → paragraphes. */
function enParagraphes(texte: string): string {
  return texte
    .split(/\n[ \t]*\n+/)
    .map((bloc) => bloc.trim())
    .filter(Boolean)
    .map((bloc) => {
      // Un retour simple devient `<br/>` — sauf s'il suit déjà un `<br>`.
      const lignes = bloc.replace(/(<br\s*\/?>)?[ \t]*\n[ \t]*/gi, (_m, br?: string) => br ?? "<br/>");
      return `<p>${lierUrlsNues(lignes)}</p>`;
    })
    .join("\n");
}

/**
 * Structure le corps rédigé par le staff.
 *
 * Seul le texte situé *hors* de toute balise de bloc est converti : un modèle
 * déjà écrit en `<p>…</p>` ressort à l'identique, un modèle en texte brut (ou
 * un mélange des deux) gagne des paragraphes au lieu d'un bloc compact où les
 * retours à la ligne disparaissent.
 */
export function normaliserCorps(html: string): string {
  const source = html.replace(/\r\n?/g, "\n");
  const sortie: string[] = [];
  let tampon = "";
  let profondeur = 0;
  let curseur = 0;

  const vider = () => {
    if (tampon.trim()) sortie.push(enParagraphes(tampon));
    tampon = "";
  };

  for (const match of source.matchAll(TAG_RE)) {
    const balise = match[0];
    const nom = match[1].toLowerCase();
    const index = match.index ?? 0;
    const avant = source.slice(curseur, index);
    curseur = index + balise.length;

    if (profondeur > 0) {
      sortie.push(avant);
    } else {
      tampon += avant;
    }

    const fermante = balise.startsWith("</");
    if (BALISES_BLOC.has(nom)) {
      if (!fermante) {
        if (profondeur === 0) vider();
        // `<p/>` auto-fermant : aucun contenu, pas de niveau ouvert.
        if (!/\/>$/.test(balise)) profondeur++;
      } else {
        profondeur = Math.max(0, profondeur - 1);
      }
      sortie.push(balise);
    } else if (BALISES_BLOC_VIDES.has(nom) && profondeur === 0) {
      vider();
      sortie.push(balise);
    } else if (profondeur > 0) {
      sortie.push(balise);
    } else {
      tampon += balise;
    }
  }

  const reste = source.slice(curseur);
  if (profondeur > 0) sortie.push(reste);
  else tampon += reste;
  vider();

  return sortie.join("").trim();
}

// ─── 2. Bouton d'inscription ─────────────────────────────

function echapperRegExp(texte: string): string {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function texteSansBalises(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function boutonEmail(url: string, libelle: string): string {
  return (
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:4px 0 22px">` +
    `<tr><td align="center" bgcolor="${COULEURS_EMAIL.bleu}" style="border-radius:8px;background-color:${COULEURS_EMAIL.bleu}">` +
    `<a href="${url}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${POLICE};font-size:15px;font-weight:bold;line-height:1.2;color:#FFFFFF;text-decoration:none;border-radius:8px">${libelle}</a>` +
    `</td></tr></table>`
  );
}

/**
 * Un lien vers le formulaire partenaire seul dans son paragraphe — ou placé en
 * fin de paragraphe après un `<br/>` (« déposez votre demande ici :<br/>lien »)
 * — devient un bouton. Un lien pris dans une phrase reste un lien.
 */
export function boutonsInscription(html: string, lienInscription: string): string {
  const href = echapperRegExp(escapeHtml(lienInscription));
  const horsParagraphe = "(?:(?!<\\/?p[\\s>/])[\\s\\S])*";
  const motif = new RegExp(
    `<p(\\s[^>]*)?>(?:(${horsParagraphe})<br\\s*\\/?>)?\\s*<a\\s[^>]*href=["']${href}\\/?["'][^>]*>(${horsParagraphe})<\\/a>\\s*<\\/p>`,
    "gi",
  );
  return html.replace(motif, (_m, attrs: string | undefined, avant: string | undefined, contenu: string) => {
    const texte = texteSansBalises(contenu);
    const libelle = !texte || /^https?:\/\//i.test(texte) ? LIBELLE_BOUTON_INSCRIPTION : contenu.trim();
    const intro = avant && texteSansBalises(avant) ? `<p${attrs ?? ""}>${avant.trim()}</p>` : "";
    return `${intro}${boutonEmail(escapeHtml(lienInscription), libelle)}`;
  });
}

// ─── 3. Styles inline ────────────────────────────────────

const STYLES_BALISES: Record<string, string> = {
  p: `margin:0 0 16px;font-family:${POLICE};font-size:15px;line-height:1.65;color:${COULEURS_EMAIL.texte}`,
  a: `color:${COULEURS_EMAIL.bleu};text-decoration:underline;word-break:break-word`,
  h1: `margin:0 0 16px;font-family:${POLICE};font-size:22px;line-height:1.3;font-weight:bold;color:${COULEURS_EMAIL.navy}`,
  h2: `margin:0 0 14px;font-family:${POLICE};font-size:19px;line-height:1.35;font-weight:bold;color:${COULEURS_EMAIL.navy}`,
  h3: `margin:0 0 12px;font-family:${POLICE};font-size:16px;line-height:1.4;font-weight:bold;color:${COULEURS_EMAIL.navy}`,
  ul: `margin:0 0 16px;padding:0 0 0 22px;font-family:${POLICE};font-size:15px;line-height:1.65;color:${COULEURS_EMAIL.texte}`,
  ol: `margin:0 0 16px;padding:0 0 0 22px;font-family:${POLICE};font-size:15px;line-height:1.65;color:${COULEURS_EMAIL.texte}`,
  li: "margin:0 0 6px",
  blockquote: `margin:0 0 16px;padding:12px 16px;border-left:3px solid ${COULEURS_EMAIL.bleu};background-color:${COULEURS_EMAIL.fond};color:#334155`,
  hr: `border:none;border-top:1px solid ${COULEURS_EMAIL.bordure};margin:24px 0`,
  img: "max-width:100%;height:auto;border:0",
};

/** Ajoute des styles par défaut à une balise ; ses propres styles gardent la priorité. */
function ajouterStyle(balise: string, defaut: string): string {
  const existant = balise.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i);
  if (existant) {
    return balise.replace(existant[0], ` style=${existant[1]}${defaut};${existant[2]}${existant[1]}`);
  }
  return balise.replace(/\s*(\/?)>$/, ` style="${defaut}"$1>`);
}

export function stylerCorps(html: string): string {
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (balise, nom: string) => {
    const style = STYLES_BALISES[nom.toLowerCase()];
    return style ? ajouterStyle(balise, style) : balise;
  });
}

// ─── 4. Version texte ────────────────────────────────────

function decoderEntites(texte: string): string {
  return texte
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

/** Conversion HTML → texte brut, pour la partie `text/plain` du message. */
export function htmlVersTexte(html: string): string {
  const texte = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(head|style|script|title)\b[\s\S]*?<\/\1>/gi, "")
    // Les retours à la ligne du source HTML ne sont que des espaces.
    .replace(/\s+/g, " ")
    .replace(/<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, contenu: string) => {
      const libelle = texteSansBalises(contenu);
      const url = decoderEntites(href);
      if (!libelle || decoderEntites(libelle) === url || url.startsWith("mailto:")) return libelle || url;
      return `${libelle} : ${url}`;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<hr\b[^>]*>/gi, "\n\n----\n\n")
    .replace(/<\/(p|div|h[1-6]|ul|ol|table|tr|blockquote|pre|section)>/gi, "\n\n")
    .replace(/<[^>]*>/g, "");

  return decoderEntites(texte)
    .split("\n")
    .map((ligne) => ligne.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── 5. Mise en page complète ────────────────────────────

export interface HabillageEmail {
  /** Objet, pour le `<title>` du document. */
  sujet: string;
  /** Corps déjà personnalisé (variables résolues, valeurs échappées). */
  corpsHtml: string;
  lienInscription: string;
  desinscriptionUrl: string;
  fromName?: string | null;
}

export interface EmailHabille {
  html: string;
  text: string;
}

function hoteSite(): string {
  try {
    return new URL(SITE_URL).host.replace(/^www\./, "");
  } catch {
    return "byspermis.fr";
  }
}

export function habillerEmail(params: HabillageEmail): EmailHabille {
  const expediteur = escapeHtml(params.fromName?.trim() || "BYS Permis");
  // Le bouton est posé après les styles par défaut : il garde exactement les siens.
  const corps = boutonsInscription(stylerCorps(normaliserCorps(params.corpsHtml)), params.lienInscription);
  const texteCorps = htmlVersTexte(corps);
  const apercuBoite = escapeHtml(texteCorps.replace(/\s+/g, " ").slice(0, 140));
  const desinscription = escapeHtml(params.desinscriptionUrl);
  const site = escapeHtml(SITE_URL);

  const html = `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(params.sujet)}</title>
<style>
  body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table{border-collapse:collapse}
  img{border:0;outline:none;text-decoration:none}
  a{color:${COULEURS_EMAIL.bleu}}
  @media only screen and (max-width:620px){
    .bys-cadre{padding:20px 10px!important}
    .bys-entete{padding:20px 20px 0!important}
    .bys-carte{padding:24px 20px 12px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COULEURS_EMAIL.fond}">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all">${apercuBoite}</div>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${COULEURS_EMAIL.fond}" style="background-color:${COULEURS_EMAIL.fond};width:100%">
  <tr>
    <td align="center" class="bys-cadre" style="padding:32px 16px">
      <!--[if mso]><table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-collapse:separate">
        <tr>
          <td class="bys-entete" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid ${COULEURS_EMAIL.bordure};border-top:4px solid ${COULEURS_EMAIL.navy};border-bottom:0;border-radius:12px 12px 0 0;padding:24px 40px 0">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 0 20px;border-bottom:1px solid ${COULEURS_EMAIL.bordure}">
                  <a href="${site}" target="_blank" style="text-decoration:none">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 10px 0 0;vertical-align:middle"><img src="${escapeHtml(LOGO_URL)}" alt="" width="40" height="40" style="display:block;width:40px;height:40px;border:0"/></td>
                        <td style="vertical-align:middle;font-family:${POLICE};font-size:19px;font-weight:bold;letter-spacing:0.3px;color:${COULEURS_EMAIL.navy}">BYS Permis</td>
                      </tr>
                    </table>
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="bys-carte" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid ${COULEURS_EMAIL.bordure};border-top:0;border-radius:0 0 12px 12px;padding:28px 40px 20px;font-family:${POLICE};font-size:15px;line-height:1.65;color:${COULEURS_EMAIL.texte};text-align:left">
${corps}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 16px 0;font-family:${POLICE};font-size:12px;line-height:1.6;color:${COULEURS_EMAIL.texteDoux};text-align:center">
            <p style="margin:0 0 8px;font-family:${POLICE};font-size:12px;line-height:1.6;color:${COULEURS_EMAIL.texteDoux}">
              ${expediteur} — plateforme de réservation de stages de récupération de points.<br/>
              Ce message vous est adressé dans un cadre professionnel, à l'adresse de votre centre agréé.
            </p>
            <p style="margin:0 0 8px;font-family:${POLICE};font-size:12px;line-height:1.6;color:${COULEURS_EMAIL.texteDoux}">
              Vous ne souhaitez plus recevoir nos messages ?
              <a href="${desinscription}" target="_blank" style="color:#475569;text-decoration:underline">Se désinscrire en un clic</a>.
            </p>
            <p style="margin:0;font-family:${POLICE};font-size:12px;line-height:1.6">
              <a href="${site}" target="_blank" style="color:${COULEURS_EMAIL.texteDoux};text-decoration:none">${escapeHtml(hoteSite())}</a>
            </p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;

  const piedTexte = [
    `${decoderEntites(expediteur)} — plateforme de réservation de stages de récupération de points.`,
    "Ce message vous est adressé dans un cadre professionnel, à l'adresse de votre centre agréé.",
    `Vous ne souhaitez plus recevoir nos messages ? Se désinscrire : ${params.desinscriptionUrl}`,
    SITE_URL,
  ].join("\n");
  const text = `${texteCorps}\n\n--\n${piedTexte}`;

  return { html, text };
}
