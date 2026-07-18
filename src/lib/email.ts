import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envoie un email via Resend en surfaçant les erreurs.
 * Le SDK Resend ne THROW PAS sur erreur API (clé invalide, domaine non vérifié,
 * quota…) : il résout `{ data: null, error }`. Sans ce wrapper, tous les envois
 * échouaient silencieusement (faux succès côté UI, aucun log). Ici on loggue et
 * on throw pour que les try/catch appelants réagissent.
 */
export async function sendMail(
  payload: Parameters<typeof resend.emails.send>[0],
): Promise<void> {
  const { error } = await resend.emails.send(payload);
  if (error) {
    console.error("[resend] échec envoi email:", error);
    throw new Error(`Resend: ${error.message ?? error.name ?? "erreur inconnue"}`);
  }
}

const FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@byspermis.fr>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";
// Logo embed pour emails — PNG fiable sur tous les clients (Outlook compris).
const LOGO_IMG = `<img src="${APP_URL}/colored-logo.png" alt="BYS Formation" height="48" style="display:block;height:48px;width:auto;margin:0 auto 12px"/>`;

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
}): Promise<void> {
  await sendMail({
    from: FROM,
    to: params.to,
    subject: `Confirmation de réservation ${params.reservationNumber}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">Réservation confirmée</h1>
    <p style="color:#9CA3AF;margin:8px 0 0;font-size:13px">Numéro : ${params.reservationNumber}</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour,</p>
    <p>Votre réservation <strong>${params.reservationNumber}</strong> a bien été enregistrée.</p>
    <table style="border-collapse:collapse;margin:16px 0;width:100%">
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold;width:120px">Formation</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.formationTitle}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Date</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.sessionDate}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Centre</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.centreName}</td></tr>
    </table>
    <p>Votre <strong>facture</strong> est jointe à ce mail au format PDF. Votre <strong>convocation</strong> vous sera envoyée 48h avant la session.</p>
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 6px;font-weight:bold;color:#92400E">Dernière étape : transmettez vos justificatifs</p>
      <p style="margin:0 0 12px;font-size:14px;color:#78350F">Pour valider définitivement votre inscription, envoyez votre <strong>pièce d'identité</strong> et votre <strong>permis de conduire</strong> à votre centre depuis votre espace élève.</p>
      <a href="${APP_URL}/espace-eleve/documents" style="display:inline-block;background:#F59E0B;color:#fff;font-weight:bold;font-size:14px;text-decoration:none;padding:10px 18px;border-radius:8px">Envoyer mes documents</a>
    </div>
    <p style="color:#6B7280;font-size:12px;margin-top:24px">Cordialement,<br/>L'équipe BYS Formation Permis</p>
  </div>
</div>`,
    ...(params.attachments && params.attachments.length > 0
      ? { attachments: params.attachments }
      : {}),
  });
}

/**
 * Send convocation email with PDF attachment.
 */
export async function sendConvocationEmail(params: {
  to: string;
  reservationNumber: string;
  formationTitle: string;
  pdfBuffer: Buffer;
}): Promise<void> {
  await sendMail({
    from: FROM,
    to: params.to,
    subject: `Convocation - ${params.formationTitle}`,
    html: `
      <h1>Convocation</h1>
      <p>Veuillez trouver ci-joint votre convocation pour la formation <strong>${params.formationTitle}</strong>.</p>
      <p>Numéro de réservation : <strong>${params.reservationNumber}</strong></p>
      <p>Cordialement,<br/>L'équipe BYS Formation Permiss</p>
    `,
    attachments: [
      {
        filename: `convocation-${params.reservationNumber}.pdf`,
        content: params.pdfBuffer,
      },
    ],
  });
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

  const cta = params.ctaUrl
    ? `<p style="text-align:center;margin:24px 0">
         <a href="${params.ctaUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">${params.ctaLabel ?? "Accéder à mon espace"}</a>
       </p>`
    : "";

  await sendMail({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">${params.title}</h1>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    ${params.bodyHtml}
    ${cta}
    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">
      Cordialement,<br/>L'équipe BYS Formation Permis
    </p>
  </div>
</div>`,
  });
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

  const cta = params.ctaUrl
    ? `<p style="text-align:center;margin:24px 0">
         <a href="${params.ctaUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">${params.ctaLabel ?? "Accéder à mon espace"}</a>
       </p>`
    : "";

  await sendMail({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">${params.title}</h1>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    ${params.bodyHtml}
    ${cta}
    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">
      Cordialement,<br/>L'équipe BYS Formation Permis
    </p>
  </div>
</div>`,
  });
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

  const refundLine = params.refunded
    ? "<p>Votre remboursement a été initié et apparaîtra sur votre compte sous 5 à 10 jours ouvrés.</p>"
    : "<p>Aucun remboursement n'est prévu pour cette annulation selon les conditions applicables.</p>";

  await sendMail({
    from: FROM,
    to: params.to,
    subject: `Annulation de votre réservation ${params.reservationNumber}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">Réservation annulée</h1>
    <p style="color:#9CA3AF;margin:8px 0 0;font-size:13px">Réf. ${params.reservationNumber}</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour${params.prenom ? ` ${params.prenom}` : ""},</p>
    <p>Votre réservation <strong>${params.reservationNumber}</strong> pour le stage <strong>${params.formationTitle}</strong> chez <strong>${params.centreName}</strong> (${params.sessionDate}) a bien été annulée.</p>
    ${refundLine}
    <p style="text-align:center;margin:24px 0">
      <a href="${APP_URL}/espace-eleve/reservations" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">Voir mes réservations</a>
    </p>
    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">
      Cordialement,<br/>L'équipe BYS Formation Permis
    </p>
  </div>
</div>`,
  });
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

  await sendMail({
    from: FROM,
    to: params.to,
    subject: `Nouvelle réservation - ${params.formationTitle}`,
    html: `
      <h1>Nouvelle réservation</h1>
      <p>Un nouvel élève a réservé une place dans votre formation.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Élève</td><td>${params.eleveName}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Formation</td><td>${params.formationTitle}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Date</td><td>${params.sessionDate}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Montant</td><td>${formattedAmount}</td></tr>
      </table>
      <p>Connectez-vous à votre espace pour gérer cette réservation.</p>
      <p>Cordialement,<br/>L'équipe BYS Formation Permiss</p>
    `,
  });
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
  const credentialsBlock = params.tempPassword
    ? `<div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#0369A1;font-size:14px">Vos identifiants de connexion :</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 16px 4px 0;font-weight:bold;color:#0C4A6E;font-size:13px">Email</td><td style="font-size:13px;color:#1E3A5F">${params.to}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:bold;color:#0C4A6E;font-size:13px">Mot de passe temporaire</td><td style="font-size:13px;color:#1E3A5F;font-family:monospace;background:#E0F2FE;padding:2px 8px;border-radius:4px">${params.tempPassword}</td></tr>
        </table>
        <p style="margin:8px 0 0;color:#64748B;font-size:11px">Nous vous recommandons de changer votre mot de passe lors de votre premiere connexion.</p>
      </div>`
    : "";

  await sendMail({
    from: FROM,
    to: params.to,
    subject: `Bienvenue sur BYS Formation — Votre espace centre est pret`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">Bienvenue sur BYS Formation</h1>
    <p style="color:#9CA3AF;margin:8px 0 0;font-size:13px">Votre espace centre est pret !</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour,</p>
    <p>Nous avons le plaisir de vous informer que votre centre <strong>${params.centreName}</strong> a ete cree sur la plateforme <strong>BYS Formation</strong>.</p>
    <p>Votre espace est pret — il ne reste plus qu'a completer votre profil pour etre visible sur notre marketplace et commencer a recevoir des reservations.</p>

    ${credentialsBlock}

    <h3 style="color:#1E293B;font-size:15px;margin:24px 0 12px">Les etapes pour demarrer :</h3>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
      <tr><td style="padding:10px 12px;vertical-align:top;width:36px"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background:#2563EB;color:#fff;border-radius:50%;font-weight:bold;font-size:13px">1</span></td><td style="padding:10px 12px"><strong>Informations de base</strong><br/><span style="color:#6B7280;font-size:13px">Nom, adresse et description de votre centre (~2 min)</span></td></tr>
      <tr style="background:#f9fafb"><td style="padding:10px 12px;vertical-align:top"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background:#2563EB;color:#fff;border-radius:50%;font-weight:bold;font-size:13px">2</span></td><td style="padding:10px 12px"><strong>Contact</strong><br/><span style="color:#6B7280;font-size:13px">Telephone, email et site web (~1 min)</span></td></tr>
      <tr><td style="padding:10px 12px;vertical-align:top"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background:#2563EB;color:#fff;border-radius:50%;font-weight:bold;font-size:13px">3</span></td><td style="padding:10px 12px"><strong>Presentation</strong><br/><span style="color:#6B7280;font-size:13px">Texte de presentation, equipements, certifications (~5 min)</span></td></tr>
      <tr style="background:#f9fafb"><td style="padding:10px 12px;vertical-align:top"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background:#2563EB;color:#fff;border-radius:50%;font-weight:bold;font-size:13px">4</span></td><td style="padding:10px 12px"><strong>Premiere formation</strong><br/><span style="color:#6B7280;font-size:13px">Creez au moins une formation avec une session (~5 min)</span></td></tr>
      <tr><td style="padding:10px 12px;vertical-align:top"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background:#2563EB;color:#fff;border-radius:50%;font-weight:bold;font-size:13px">5</span></td><td style="padding:10px 12px"><strong>Paiement</strong><br/><span style="color:#6B7280;font-size:13px">Connectez Stripe pour recevoir vos paiements (~3 min)</span></td></tr>
    </table>

    <p style="text-align:center;margin:24px 0">
      <a href="${params.loginUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">Acceder a mon espace centre</a>
    </p>

    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">
      Si vous avez des questions, n'hesitez pas a contacter notre equipe support.<br/>
      Cordialement,<br/>L'equipe BYS Formation
    </p>
  </div>
</div>`,
  });
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
  const credentialsBlock = params.tempPassword
    ? `<div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#0369A1;font-size:14px">Vos identifiants de connexion :</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 16px 4px 0;font-weight:bold;color:#0C4A6E;font-size:13px">Email</td><td style="font-size:13px;color:#1E3A5F">${params.to}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-weight:bold;color:#0C4A6E;font-size:13px">Mot de passe temporaire</td><td style="font-size:13px;color:#1E3A5F;font-family:monospace;background:#E0F2FE;padding:2px 8px;border-radius:4px">${params.tempPassword}</td></tr>
        </table>
        <p style="margin:8px 0 0;color:#64748B;font-size:11px">Nous vous recommandons de changer votre mot de passe lors de votre premiere connexion.</p>
      </div>`
    : "";

  await sendMail({
    from: FROM,
    to: params.to,
    subject: `BYS Formation — Votre acces directeur de lieu est pret`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">Bienvenue sur BYS Formation</h1>
    <p style="color:#9CA3AF;margin:8px 0 0;font-size:13px">Acces directeur de lieu</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour ${params.prenom},</p>
    <p>Un acces directeur de lieu a ete cree pour vous sur la plateforme <strong>BYS Formation</strong> pour le centre <strong>${params.centreName}</strong>.</p>
    <p>En tant que directeur de lieu, vous pouvez gerer les formations, sessions, inscrits et l'emargement de votre lieu.</p>

    ${credentialsBlock}

    <p style="text-align:center;margin:24px 0">
      <a href="${params.loginUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">Acceder a mon espace</a>
    </p>

    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">
      Si vous avez des questions, contactez votre chef de centre ou notre equipe support.<br/>
      Cordialement,<br/>L'equipe BYS Formation
    </p>
  </div>
</div>`,
  });
}

/**
 * Send centre activation email when admin approves the centre.
 */
export async function sendCentreActivationEmail(params: {
  to: string;
  centreName: string;
  dashboardUrl: string;
}): Promise<void> {
  await sendMail({
    from: FROM,
    to: params.to,
    subject: `Votre centre est maintenant visible sur BYS Formation !`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">Felicitations !</h1>
    <p style="color:#4ADE80;margin:8px 0 0;font-size:14px;font-weight:bold">Votre centre est maintenant actif</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour,</p>
    <p>Excellente nouvelle ! Votre centre <strong>${params.centreName}</strong> a ete valide par notre equipe et est desormais <strong>visible sur la marketplace BYS Formation</strong>.</p>

    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center">
      <p style="margin:0;color:#166534;font-size:15px;font-weight:bold">Votre centre est en ligne !</p>
      <p style="margin:8px 0 0;color:#15803D;font-size:13px">Les stagiaires peuvent desormais decouvrir et reserver vos formations.</p>
    </div>

    <h3 style="color:#1E293B;font-size:15px;margin:24px 0 12px">Prochaines etapes recommandees :</h3>
    <ul style="color:#4B5563;line-height:2;font-size:14px;padding-left:20px">
      <li>Ajoutez d'autres formations pour attirer plus de stagiaires</li>
      <li>Planifiez vos prochaines sessions</li>
      <li>Partagez votre profil sur vos reseaux sociaux</li>
      <li>Consultez votre dashboard pour suivre vos statistiques</li>
    </ul>

    <p style="text-align:center;margin:24px 0">
      <a href="${params.dashboardUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">Acceder a mon dashboard</a>
    </p>

    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">
      Cordialement,<br/>L'equipe BYS Formation
    </p>
  </div>
</div>`,
  });
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

  await sendMail({
    from: FROM,
    to: params.to,
    subject: `Votre avis compte — ${params.formationTitle}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">Questionnaire satisfaction</h1>
    <p style="color:#9CA3AF;margin:8px 0 0;font-size:13px">${params.formationTitle}</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour ${params.prenom},</p>
    <p>Merci d'avoir suivi votre formation <strong>${params.formationTitle}</strong> chez <strong>${params.centreName}</strong>.</p>
    <p>Votre retour nous aide à améliorer la qualité des centres partenaires et de la plateforme BYS Permis.</p>
    <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#0369A1;font-size:14px">2 questionnaires rapides :</p>
      <ul style="margin:0;padding-left:20px;color:#0C4A6E;font-size:13px;line-height:1.8">
        <li><strong>5 questions</strong> sur votre centre de formation</li>
        <li><strong>5 questions</strong> sur BYS Permis (réservation, site, suivi)</li>
      </ul>
      <p style="margin:8px 0 0;color:#64748B;font-size:12px">Notes de 1 à 5 — demi-étoiles possibles.</p>
    </div>
    <p style="text-align:center;margin:24px 0">
      <a href="${params.questionnaireUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">Donner mon avis</a>
    </p>
    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">
      Vous pouvez aussi répondre depuis votre espace élève → <strong>Mes avis</strong>.<br/>
      Cordialement,<br/>L'équipe BYS Formation Permis
    </p>
  </div>
</div>`,
  });
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
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY absent — document non envoyé à", params.to);
    return;
  }
  const cta = params.ctaUrl
    ? `<p style="text-align:center;margin:24px 0">
         <a href="${params.ctaUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">${params.ctaLabel ?? "Voir le document"}</a>
       </p>`
    : "";

  await sendMail({
    from: FROM,
    to: params.to,
    subject: params.sujet,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">${params.sujet}</h1>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour${params.prenom ? ` ${params.prenom}` : ""},</p>
    <p>${params.intro}</p>
    ${cta}
    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">
      Vous pouvez aussi retrouver vos documents depuis votre espace élève → <strong>Mes documents</strong>.<br/>
      Cordialement,<br/>L'équipe BYS Formation Permis
    </p>
  </div>
</div>`,
    ...(params.attachments && params.attachments.length > 0
      ? { attachments: params.attachments }
      : {}),
  });
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
  await sendMail({
    from: FROM,
    to: params.to,
    subject: `BYS Formation — Votre demande d'activation necessite des modifications`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    ${LOGO_IMG}
    <h1 style="color:#fff;margin:0;font-size:22px">Modifications requises</h1>
    <p style="color:#9CA3AF;margin:8px 0 0;font-size:13px">${params.centreName}</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour,</p>
    <p>Apres examen de votre profil centre <strong>${params.centreName}</strong>, notre equipe a identifie des elements a corriger avant de pouvoir activer votre centre sur la marketplace.</p>

    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#991B1B;font-size:14px">Raison du refus :</p>
      <p style="margin:0;color:#7F1D1D;font-size:13px">${params.reason}</p>
    </div>

    <p>Veuillez corriger les elements mentionnes et soumettre a nouveau votre centre pour validation.</p>

    <p style="text-align:center;margin:24px 0">
      <a href="${params.onboardingUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">Modifier mon profil centre</a>
    </p>

    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">
      Si vous avez des questions, n'hesitez pas a contacter notre equipe support.<br/>
      Cordialement,<br/>L'equipe BYS Formation
    </p>
  </div>
</div>`,
  });
}
