/**
 * Gabarit HTML des emails transactionnels (réservation, documents, espace
 * centre, administration).
 *
 * Même charte que les emails de campagne (`lib/prospects/email-layout.ts`) :
 * mise en page à base de tables, 600 px max, en-tête blanc avec le logo — le
 * logo est bleu marine sur fond transparent, il doit donc être posé sur du
 * blanc — carte blanche et pied de page commun.
 *
 * Les blocs (`emailBouton`, `emailDetails`, `emailEncadre`, `emailEtapes`)
 * produisent du HTML « bulletproof » (styles inline, tables) lisible dans
 * Gmail, Outlook et les webmails FAI.
 */

import { COULEURS_EMAIL, htmlVersTexte, stylerCorps } from "@/lib/prospects/email-layout";
import { escapeHtml } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";
const LOGO_URL = `${SITE_URL}/colored-logo.png`;
const CONTACT_EMAIL = "contact@byspermis.fr";
const POLICE = "Arial,'Helvetica Neue',Helvetica,sans-serif";

export type TonEmail = "info" | "succes" | "alerte" | "danger";

const TONS: Record<TonEmail, { fond: string; bordure: string; titre: string; texte: string }> = {
  info: { fond: "#EFF6FF", bordure: "#BFDBFE", titre: "#1E40AF", texte: "#1E3A8A" },
  succes: { fond: "#F0FDF4", bordure: "#BBF7D0", titre: "#166534", texte: "#14532D" },
  alerte: { fond: "#FFFBEB", bordure: "#FDE68A", titre: "#92400E", texte: "#78350F" },
  danger: { fond: "#FEF2F2", bordure: "#FECACA", titre: "#991B1B", texte: "#7F1D1D" },
};

// ─── Blocs ───────────────────────────────────────────────

/** Bouton d'action « bulletproof » (table + fond), centré. */
export function emailBouton(url: string, libelle: string): string {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px">
  <tr><td align="center" bgcolor="${COULEURS_EMAIL.bleu}" style="border-radius:8px;background-color:${COULEURS_EMAIL.bleu}">
    <a href="${url}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${POLICE};font-size:15px;font-weight:bold;line-height:1.2;color:#FFFFFF;text-decoration:none;border-radius:8px">${libelle}</a>
  </td></tr>
</table>`;
}

/** Tableau récapitulatif libellé / valeur (valeurs déjà échappées ou HTML de confiance). */
export function emailDetails(lignes: Array<[libelle: string, valeur: string] | null | false | undefined>): string {
  const rows = lignes
    .filter((l): l is [string, string] => Boolean(l))
    .map(
      ([libelle, valeur], i, all) => `<tr>
    <td style="padding:12px 16px;${i < all.length - 1 ? `border-bottom:1px solid ${COULEURS_EMAIL.bordure};` : ""}font-family:${POLICE};font-size:13px;line-height:1.4;color:${COULEURS_EMAIL.texteDoux};width:38%;vertical-align:top">${libelle}</td>
    <td style="padding:12px 16px;${i < all.length - 1 ? `border-bottom:1px solid ${COULEURS_EMAIL.bordure};` : ""}font-family:${POLICE};font-size:14px;line-height:1.4;color:#0F172A;font-weight:bold;vertical-align:top">${valeur}</td>
  </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F8FAFC" style="width:100%;margin:8px 0 20px;background-color:#F8FAFC;border:1px solid ${COULEURS_EMAIL.bordure};border-radius:10px;border-collapse:separate">${rows}</table>`;
}

/** Encadré coloré (information, succès, alerte, refus). */
export function emailEncadre(ton: TonEmail, titre: string | null, contenuHtml: string): string {
  const c = TONS[ton];
  return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${c.fond}" style="width:100%;margin:8px 0 20px;background-color:${c.fond};border:1px solid ${c.bordure};border-radius:10px;border-collapse:separate">
  <tr><td style="padding:16px 20px;font-family:${POLICE};font-size:14px;line-height:1.6;color:${c.texte}">
    ${titre ? `<p style="margin:0 0 6px;font-family:${POLICE};font-size:14px;font-weight:bold;color:${c.titre}">${titre}</p>` : ""}
    ${contenuHtml}
  </td></tr>
</table>`;
}

/** Liste d'étapes numérotées (pastilles). */
export function emailEtapes(etapes: Array<{ titre: string; detail?: string }>): string {
  const rows = etapes
    .map(
      (e, i) => `<tr>
    <td style="padding:0 14px 16px 0;vertical-align:top;width:30px">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="${COULEURS_EMAIL.navy}" style="width:28px;height:28px;border-radius:14px;background-color:${COULEURS_EMAIL.navy};font-family:${POLICE};font-size:13px;font-weight:bold;color:#FFFFFF;line-height:28px">${i + 1}</td></tr></table>
    </td>
    <td style="padding:3px 0 16px;vertical-align:top;font-family:${POLICE};font-size:14px;line-height:1.5;color:#0F172A">
      <strong>${e.titre}</strong>${e.detail ? `<br/><span style="font-size:13px;color:${COULEURS_EMAIL.texteDoux}">${e.detail}</span>` : ""}
    </td>
  </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 12px">${rows}</table>`;
}

// ─── Gabarit complet ─────────────────────────────────────

export interface GabaritEmail {
  /** Objet, pour le `<title>` et l'aperçu en boîte de réception par défaut. */
  sujet: string;
  titre: string;
  /** Ligne sous le titre (référence, nom du centre…). */
  sousTitre?: string;
  /** Pastille au-dessus du titre (« Réservation confirmée », « Action requise »…). */
  badge?: { ton: TonEmail; libelle: string };
  /** Corps HTML ; les balises courantes (p, ul, a…) reçoivent les styles par défaut. */
  corpsHtml: string;
  cta?: { url: string; libelle: string };
  /** Petite note après le bouton (ex. « retrouvez aussi vos documents dans… »). */
  note?: string;
  /** Texte d'aperçu dans la boîte de réception (sinon : début du corps). */
  apercu?: string;
}

export interface EmailRendu {
  html: string;
  text: string;
}

export function renderEmail(g: GabaritEmail): EmailRendu {
  const corps = stylerCorps(g.corpsHtml);
  const cta = g.cta ? emailBouton(g.cta.url, g.cta.libelle) : "";
  const note = g.note
    ? `<p style="margin:16px 0 0;font-family:${POLICE};font-size:13px;line-height:1.6;color:${COULEURS_EMAIL.texteDoux};text-align:center">${g.note}</p>`
    : "";
  const badge = g.badge
    ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border-collapse:separate"><tr><td bgcolor="${TONS[g.badge.ton].fond}" style="background-color:${TONS[g.badge.ton].fond};border:1px solid ${TONS[g.badge.ton].bordure};border-radius:999px;padding:5px 12px;font-family:${POLICE};font-size:12px;font-weight:bold;letter-spacing:0.3px;color:${TONS[g.badge.ton].titre}">${g.badge.libelle}</td></tr></table>`
    : "";
  const sousTitre = g.sousTitre
    ? `<p style="margin:6px 0 0;font-family:${POLICE};font-size:14px;line-height:1.5;color:${COULEURS_EMAIL.texteDoux}">${g.sousTitre}</p>`
    : "";

  const texteCorps = htmlVersTexte(`<h1>${g.titre}</h1>${g.sousTitre ? `<p>${g.sousTitre}</p>` : ""}${corps}${cta}${note}`);
  const apercu = escapeHtml((g.apercu ?? htmlVersTexte(corps)).replace(/\s+/g, " ").slice(0, 140));
  const site = escapeHtml(SITE_URL);
  const hote = escapeHtml(SITE_URL.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, ""));

  const html = `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(g.sujet)}</title>
<style>
  body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table{border-collapse:collapse}
  img{border:0;outline:none;text-decoration:none}
  a{color:${COULEURS_EMAIL.bleu}}
  @media only screen and (max-width:620px){
    .bys-cadre{padding:16px 8px!important}
    .bys-entete{padding:20px 22px 0!important}
    .bys-carte{padding:24px 22px 28px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COULEURS_EMAIL.fond}">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all">${apercu}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
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
                        <td style="padding:0 10px 0 0;vertical-align:middle"><img src="${escapeHtml(LOGO_URL)}" alt="" width="36" height="36" style="display:block;width:36px;height:36px;border:0"/></td>
                        <td style="vertical-align:middle;font-family:${POLICE};font-size:18px;font-weight:bold;letter-spacing:1px;color:${COULEURS_EMAIL.navy}">BYS PERMIS</td>
                      </tr>
                    </table>
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="bys-carte" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid ${COULEURS_EMAIL.bordure};border-top:0;border-radius:0 0 12px 12px;padding:28px 40px 32px;font-family:${POLICE};font-size:15px;line-height:1.65;color:${COULEURS_EMAIL.texte};text-align:left">
            ${badge}
            <h1 style="margin:0;font-family:${POLICE};font-size:24px;line-height:1.3;font-weight:bold;color:${COULEURS_EMAIL.navy}">${g.titre}</h1>
            ${sousTitre}
            <div style="height:24px;line-height:24px;font-size:0">&nbsp;</div>
${corps}
            ${cta}
            ${note}
            <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${COULEURS_EMAIL.bordure};font-family:${POLICE};font-size:14px;line-height:1.6;color:${COULEURS_EMAIL.texte}">
              Cordialement,<br/><strong style="color:${COULEURS_EMAIL.navy}">L'équipe BYS Permis</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 16px 0;font-family:${POLICE};font-size:12px;line-height:1.6;color:${COULEURS_EMAIL.texteDoux};text-align:center">
            <p style="margin:0 0 8px;font-family:${POLICE};font-size:12px;line-height:1.6;color:${COULEURS_EMAIL.texteDoux}">
              BYS Permis — réservation de stages de récupération de points agréés par la préfecture.
            </p>
            <p style="margin:0 0 8px;font-family:${POLICE};font-size:12px;line-height:1.6;color:${COULEURS_EMAIL.texteDoux}">
              Cet email est envoyé automatiquement, merci de ne pas y répondre.<br/>
              Une question ? <a href="mailto:${CONTACT_EMAIL}" style="color:#475569;text-decoration:underline">${CONTACT_EMAIL}</a>
            </p>
            <p style="margin:0;font-family:${POLICE};font-size:12px;line-height:1.6">
              <a href="${site}" target="_blank" style="color:${COULEURS_EMAIL.texteDoux};text-decoration:none">${hote}</a>
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

  const text = `${texteCorps}\n\nCordialement,\nL'équipe BYS Permis\n\n--\nBYS Permis — ${SITE_URL}\nUne question ? ${CONTACT_EMAIL}`;
  return { html, text };
}
