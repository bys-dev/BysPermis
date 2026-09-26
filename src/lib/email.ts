import { Resend } from "resend";
import { logEmail, EMAIL_KIND, type EmailLogContext } from "@/lib/email-log";
import {
  renderEmail,
  emailDetails,
  emailEncadre,
  emailEtapes,
  type GabaritEmail,
} from "@/lib/email-layout";

export const resend = new Resend(process.env.RESEND_API_KEY);

/** Normalise le destinataire Resend (string | string[]) en une chaîne journalisable. */
function formatDestinataire(to: unknown): string {
  if (Array.isArray(to)) return to.join(", ");
  return typeof to === "string" ? to : "";
}

/**
 * Envoie un email via Resend en surfaçant les erreurs.
 * Le SDK Resend ne THROW PAS sur erreur API (clé invalide, domaine non vérifié,
 * quota…) : il résout `{ data: null, error }`. Sans ce wrapper, tous les envois
 * échouaient silencieusement (faux succès côté UI, aucun log). Ici on loggue et
 * on throw pour que les try/catch appelants réagissent.
 *
 * Chaque envoi (succès ou échec) est journalisé dans `EmailLog` — traçabilité et
 * idempotence du pipeline de fulfillment. Passer `context` pour rattacher la
 * ligne de journal à une réservation / un centre / un élève.
 */
export async function sendMail(
  payload: Parameters<typeof resend.emails.send>[0],
  context?: EmailLogContext,
): Promise<void> {
  const destinataire = formatDestinataire(payload.to);
  const sujet = payload.subject ?? "";
  const { data, error } = await resend.emails.send(payload);

  if (error) {
    console.error("[resend] échec envoi email:", error);
    const message = error.message ?? error.name ?? "erreur inconnue";
    await logEmail({
      destinataire,
      sujet,
      status: "ECHEC",
      error: message,
      kind: context?.kind ?? EMAIL_KIND.AUTRE,
      reservationId: context?.reservationId,
      userId: context?.userId,
      centreId: context?.centreId,
    });
    throw new Error(`Resend: ${message}`);
  }

  await logEmail({
    destinataire,
    sujet,
    status: "ENVOYE",
    providerId: data?.id ?? null,
    kind: context?.kind ?? EMAIL_KIND.AUTRE,
    reservationId: context?.reservationId,
    userId: context?.userId,
    centreId: context?.centreId,
  });
}

const FROM = process.env.EMAIL_FROM ?? "BYS Permis <noreply@byspermis.fr>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

/** Construit le payload Resend (HTML + version texte) à partir du gabarit commun. */
function payloadGabarit(to: string, gabarit: Omit<GabaritEmail, "sujet"> & { sujet: string }) {
  const { html, text } = renderEmail(gabarit);
  return { from: FROM, to, subject: gabarit.sujet, html, text };
}

/** Bloc « identifiants de connexion » des emails d'invitation. */
function blocIdentifiants(email: string, tempPassword?: string): string {
  if (!tempPassword) return "";
  return emailEncadre(
    "info",
    "Vos identifiants de connexion",
    `${emailDetails([
      ["Email", email],
      ["Mot de passe temporaire", `<span style="font-family:'Courier New',monospace;letter-spacing:0.5px">${tempPassword}</span>`],
    ])}
    <p style="margin:0;font-size:12px">Pensez à changer ce mot de passe lors de votre première connexion.</p>`,
  );
}

/**
 * Send confirmation email after reservation.
 * Si `attachments` est fourni, joint la (les) PJ — typiquement la facture PDF.
 */
export async function sendConfirmationEmail(params: {
  to: string;
  reservationNumber: string;
  formationTitle: string;
  sessionDate: string;
  centreName: string;
  attachments?: { filename: string; content: Buffer }[];
  context?: EmailLogContext;
}): Promise<void> {
  await sendMail({
    ...payloadGabarit(params.to, {
      sujet: `Confirmation de réservation ${params.reservationNumber}`,
      badge: { ton: "succes", libelle: "✓ Réservation confirmée" },
      titre: "Votre place est réservée",
      sousTitre: `Réservation n° ${params.reservationNumber}`,
      apercu: `Votre stage du ${params.sessionDate} chez ${params.centreName} est confirmé. Dernière étape : vos justificatifs.`,
      corpsHtml: `<p>Bonjour,</p>
<p>Votre réservation a bien été enregistrée. Voici le récapitulatif de votre stage :</p>
${emailDetails([
  ["Stage", params.formationTitle],
  ["Date", params.sessionDate],
  ["Centre", params.centreName],
  ["Référence", params.reservationNumber],
])}
<p>Votre <strong>facture</strong> est jointe à cet email au format PDF. Votre <strong>convocation</strong> vous sera envoyée 48 h avant le stage.</p>
${emailEncadre(
  "alerte",
  "Dernière étape : transmettez vos justificatifs",
  `<p style="margin:0">Pour valider définitivement votre inscription, envoyez votre <strong>pièce d'identité</strong> et votre <strong>permis de conduire</strong> à votre centre depuis votre espace élève.</p>`,
)}`,
      cta: { url: `${APP_URL}/espace-eleve/documents`, libelle: "Envoyer mes documents" },
    }),
    ...(params.attachments && params.attachments.length > 0
      ? { attachments: params.attachments }
      : {}),
  }, params.context ?? { kind: EMAIL_KIND.CONFIRMATION });
}

/**
 * Accusé de réception d'un justificatif déposé par le stagiaire (permis, CNI,
 * lettre 48N). Jusqu'ici seul le centre était notifié : l'élève n'avait aucune
 * confirmation que son document était bien arrivé.
 */
export async function sendJustificatifRecuEmail(params: {
  to: string;
  prenom?: string;
  documentLabel: string;
  formationTitle: string;
  centreName: string;
  reservationNumber: string;
  context?: EmailLogContext;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY absent — accusé justificatif non envoyé à", params.to);
    return;
  }

  await sendMail(payloadGabarit(params.to, {
    sujet: `Justificatif bien reçu — ${params.documentLabel}`,
    badge: { ton: "succes", libelle: "✓ Document reçu" },
    titre: "Justificatif bien reçu",
    sousTitre: `Réservation n° ${params.reservationNumber}`,
    corpsHtml: `<p>Bonjour${params.prenom ? ` ${params.prenom}` : ""},</p>
<p>Nous avons bien reçu votre <strong>${params.documentLabel}</strong> pour le stage « ${params.formationTitle} » auprès de <strong>${params.centreName}</strong>.</p>
<p>Votre centre va le vérifier. Vous n'avez rien d'autre à faire pour ce document — vous serez prévenu si une pièce complémentaire est nécessaire.</p>`,
    cta: { url: `${APP_URL}/espace-eleve/documents`, libelle: "Voir mes documents" },
  }), params.context ?? { kind: EMAIL_KIND.JUSTIFICATIF_RECU });
}

/**
 * Email générique pour les événements élève (annulation, session, messages…).
 */
export async function sendEleveEventEmail(params: {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY absent — email élève non envoyé à", params.to);
    return;
  }

  await sendMail(payloadGabarit(params.to, {
    sujet: params.subject,
    titre: params.title,
    corpsHtml: params.bodyHtml,
    cta: params.ctaUrl ? { url: params.ctaUrl, libelle: params.ctaLabel ?? "Accéder à mon espace" } : undefined,
  }));
}

/**
 * Email générique pour les événements centre (réservation, convocation, annulation…).
 */
export async function sendCentreEventEmail(params: {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY absent — email centre non envoyé à", params.to);
    return;
  }

  await sendMail(payloadGabarit(params.to, {
    sujet: params.subject,
    titre: params.title,
    corpsHtml: params.bodyHtml,
    cta: params.ctaUrl ? { url: params.ctaUrl, libelle: params.ctaLabel ?? "Accéder à mon espace" } : undefined,
  }));
}

/**
 * Email de confirmation d'annulation pour l'élève.
 */
export async function sendEleveCancellationEmail(params: {
  to: string;
  prenom?: string;
  reservationNumber: string;
  formationTitle: string;
  sessionDate: string;
  centreName: string;
  refunded: boolean;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY absent — email annulation non envoyé à", params.to);
    return;
  }

  const remboursement = params.refunded
    ? emailEncadre("info", "Remboursement en cours", `<p style="margin:0">Votre remboursement a été initié et apparaîtra sur votre compte sous 5 à 10 jours ouvrés.</p>`)
    : emailEncadre("alerte", null, `<p style="margin:0">Aucun remboursement n'est prévu pour cette annulation selon les conditions applicables.</p>`);

  await sendMail(payloadGabarit(params.to, {
    sujet: `Annulation de votre réservation ${params.reservationNumber}`,
    badge: { ton: "danger", libelle: "Réservation annulée" },
    titre: "Votre réservation est annulée",
    sousTitre: `Réservation n° ${params.reservationNumber}`,
    corpsHtml: `<p>Bonjour${params.prenom ? ` ${params.prenom}` : ""},</p>
<p>L'annulation de votre réservation a bien été prise en compte :</p>
${emailDetails([
  ["Stage", params.formationTitle],
  ["Date", params.sessionDate],
  ["Centre", params.centreName],
])}
${remboursement}`,
    cta: { url: `${APP_URL}/espace-eleve/reservations`, libelle: "Voir mes réservations" },
  }));
}

/**
 * Send centre notification for new reservation.
 */
export async function sendCentreNotificationEmail(params: {
  to: string;
  eleveName: string;
  formationTitle: string;
  sessionDate: string;
  amount: number;
}): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(params.amount);

  await sendMail(payloadGabarit(params.to, {
    sujet: `Nouvelle réservation - ${params.formationTitle}`,
    badge: { ton: "succes", libelle: "Nouvelle réservation" },
    titre: "Un stagiaire vient de réserver",
    corpsHtml: `<p>Un nouvel élève a réservé une place dans l'un de vos stages.</p>
${emailDetails([
  ["Élève", params.eleveName],
  ["Stage", params.formationTitle],
  ["Date", params.sessionDate],
  ["Montant", formattedAmount],
])}
<p>Connectez-vous à votre espace pour gérer cette réservation.</p>`,
    cta: { url: `${APP_URL}/espace-centre`, libelle: "Voir la réservation" },
  }));
}

/**
 * Send centre invitation email to new centre owner.
 */
export async function sendCentreInvitationEmail(params: {
  to: string;
  centreName: string;
  loginUrl: string;
  tempPassword?: string;
}): Promise<void> {
  await sendMail(payloadGabarit(params.to, {
    sujet: `Bienvenue sur BYS Permis — Votre espace centre est prêt`,
    badge: { ton: "info", libelle: "Espace centre" },
    titre: "Bienvenue sur BYS Permis",
    sousTitre: "Votre espace centre est prêt !",
    corpsHtml: `<p>Bonjour,</p>
<p>Nous avons le plaisir de vous informer que votre centre <strong>${params.centreName}</strong> a été créé sur la plateforme <strong>BYS Permis</strong>.</p>
<p>Il ne reste plus qu'à compléter votre profil pour être visible sur la marketplace et commencer à recevoir des réservations.</p>
${blocIdentifiants(params.to, params.tempPassword)}
<h3>Les étapes pour démarrer</h3>
${emailEtapes([
  { titre: "Informations de base", detail: "Nom, adresse et description de votre centre (~2 min)" },
  { titre: "Contact", detail: "Téléphone, email et site web (~1 min)" },
  { titre: "Présentation", detail: "Texte de présentation, équipements, photos (~5 min)" },
  { titre: "Premier stage", detail: "Créez au moins un stage avec une session (~5 min)" },
  { titre: "Paiement", detail: "Connectez Stripe pour recevoir vos paiements (~3 min)" },
])}`,
    cta: { url: params.loginUrl, libelle: "Accéder à mon espace centre" },
    note: "Une question ? Notre équipe support est là pour vous aider.",
  }));
}

/**
 * Send invitation email to a new directeur de lieu (CENTRE_ADMIN on a single location).
 */
export async function sendDirecteurLieuInvitationEmail(params: {
  to: string;
  prenom: string;
  centreName: string;
  loginUrl: string;
  tempPassword?: string;
}): Promise<void> {
  await sendMail(payloadGabarit(params.to, {
    sujet: `BYS Permis — Votre accès directeur de lieu est prêt`,
    badge: { ton: "info", libelle: "Accès directeur de lieu" },
    titre: "Bienvenue sur BYS Permis",
    sousTitre: params.centreName,
    corpsHtml: `<p>Bonjour ${params.prenom},</p>
<p>Un accès directeur de lieu a été créé pour vous sur la plateforme <strong>BYS Permis</strong> pour le centre <strong>${params.centreName}</strong>.</p>
<p>En tant que directeur de lieu, vous pouvez gérer les stages, sessions, inscrits et l'émargement de votre lieu.</p>
${blocIdentifiants(params.to, params.tempPassword)}`,
    cta: { url: params.loginUrl, libelle: "Accéder à mon espace" },
    note: "Une question ? Contactez votre chef de centre ou notre équipe support.",
  }));
}

/**
 * Send centre activation email when admin approves the centre.
 */
export async function sendCentreActivationEmail(params: {
  to: string;
  centreName: string;
  dashboardUrl: string;
}): Promise<void> {
  await sendMail(payloadGabarit(params.to, {
    sujet: `Votre centre est maintenant visible sur BYS Permis !`,
    badge: { ton: "succes", libelle: "✓ Centre activé" },
    titre: "Félicitations, vous êtes en ligne !",
    sousTitre: params.centreName,
    corpsHtml: `<p>Bonjour,</p>
<p>Excellente nouvelle : votre centre <strong>${params.centreName}</strong> a été validé par notre équipe et est désormais <strong>visible sur la marketplace BYS Permis</strong>.</p>
${emailEncadre("succes", "Votre centre est en ligne", `<p style="margin:0">Les stagiaires peuvent dès maintenant découvrir et réserver vos stages.</p>`)}
<h3>Prochaines étapes recommandées</h3>
<ul>
  <li>Planifiez vos prochaines sessions</li>
  <li>Ajoutez des photos de vos salles</li>
  <li>Partagez votre page centre sur vos réseaux sociaux</li>
  <li>Suivez vos statistiques depuis votre tableau de bord</li>
</ul>`,
    cta: { url: params.dashboardUrl, libelle: "Accéder à mon tableau de bord" },
  }));
}

/**
 * Email post-stage : invitation à remplir le questionnaire satisfaction (centre + plateforme).
 */
export async function sendQuestionnaireEmail(params: {
  to: string;
  prenom: string;
  formationTitle: string;
  centreName: string;
  questionnaireUrl: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY absent — questionnaire non envoyé à", params.to);
    return;
  }

  await sendMail(payloadGabarit(params.to, {
    sujet: `Votre avis compte — ${params.formationTitle}`,
    badge: { ton: "info", libelle: "2 minutes" },
    titre: "Comment s'est passé votre stage ?",
    sousTitre: `${params.formationTitle} — ${params.centreName}`,
    corpsHtml: `<p>Bonjour ${params.prenom},</p>
<p>Merci d'avoir suivi votre stage chez <strong>${params.centreName}</strong>. Votre retour nous aide à améliorer la qualité des centres partenaires et de la plateforme.</p>
${emailEncadre(
  "info",
  "2 questionnaires rapides",
  `<ul style="margin:0;padding-left:20px">
    <li><strong>5 questions</strong> sur votre centre</li>
    <li><strong>5 questions</strong> sur BYS Permis (réservation, site, suivi)</li>
  </ul>
  <p style="margin:8px 0 0;font-size:12px">Notes de 1 à 5 — demi-étoiles possibles.</p>`,
)}`,
    cta: { url: params.questionnaireUrl, libelle: "Donner mon avis" },
    note: "Vous pouvez aussi répondre depuis votre espace élève → <strong>Mes avis</strong>.",
  }));
}

/**
 * Envoi générique d'un (ou plusieurs) document(s) à l'élève — utilisé pour
 * l'envoi manuel par le centre, l'envoi automatique à la confirmation, la
 * feuille d'émargement individuelle et le bon d'accord.
 */
export async function sendDocumentEmail(params: {
  to: string;
  prenom?: string;
  sujet: string;
  intro: string;
  ctaUrl?: string;
  ctaLabel?: string;
  attachments?: { filename: string; content: Buffer }[];
  context?: EmailLogContext;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY absent — document non envoyé à", params.to);
    return;
  }

  await sendMail({
    ...payloadGabarit(params.to, {
      sujet: params.sujet,
      badge: params.attachments && params.attachments.length > 0 ? { ton: "info", libelle: "📎 Document joint" } : undefined,
      titre: params.sujet,
      corpsHtml: `<p>Bonjour${params.prenom ? ` ${params.prenom}` : ""},</p>
<p>${params.intro}</p>`,
      cta: params.ctaUrl ? { url: params.ctaUrl, libelle: params.ctaLabel ?? "Voir le document" } : undefined,
      note: "Retrouvez tous vos documents dans votre espace élève → <strong>Mes documents</strong>.",
    }),
    ...(params.attachments && params.attachments.length > 0
      ? { attachments: params.attachments }
      : {}),
  }, params.context);
}

/**
 * Send centre rejection email when admin rejects the centre.
 */
export async function sendCentreRejectionEmail(params: {
  to: string;
  centreName: string;
  reason: string;
  onboardingUrl: string;
}): Promise<void> {
  await sendMail(payloadGabarit(params.to, {
    sujet: `BYS Permis — Votre demande d'activation nécessite des modifications`,
    badge: { ton: "alerte", libelle: "Action requise" },
    titre: "Quelques modifications sont nécessaires",
    sousTitre: params.centreName,
    corpsHtml: `<p>Bonjour,</p>
<p>Après examen de votre profil centre <strong>${params.centreName}</strong>, notre équipe a identifié des éléments à corriger avant de pouvoir l'activer sur la marketplace.</p>
${emailEncadre("danger", "Éléments à corriger", `<p style="margin:0">${params.reason}</p>`)}
<p>Corrigez les éléments mentionnés puis soumettez à nouveau votre centre pour validation.</p>`,
    cta: { url: params.onboardingUrl, libelle: "Modifier mon profil centre" },
    note: "Une question ? Notre équipe support est là pour vous aider.",
  }));
}
