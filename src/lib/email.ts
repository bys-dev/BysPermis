import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@bysformations.fr>";

/**
 * Send confirmation email after reservation.
 */
export async function sendConfirmationEmail(params: {
  to: string;
  reservationNumber: string;
  formationTitle: string;
  sessionDate: string;
  centreName: string;
}): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Confirmation de réservation ${params.reservationNumber}`,
    html: `
      <h1>Réservation confirmée</h1>
      <p>Votre réservation <strong>${params.reservationNumber}</strong> a bien été enregistrée.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Formation</td><td>${params.formationTitle}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Date</td><td>${params.sessionDate}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Centre</td><td>${params.centreName}</td></tr>
      </table>
      <p>Vous recevrez votre convocation par email avant la date de la session.</p>
      <p>Cordialement,<br/>L'équipe BYS Formations</p>
    `,
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
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Convocation - ${params.formationTitle}`,
    html: `
      <h1>Convocation</h1>
      <p>Veuillez trouver ci-joint votre convocation pour la formation <strong>${params.formationTitle}</strong>.</p>
      <p>Numéro de réservation : <strong>${params.reservationNumber}</strong></p>
      <p>Cordialement,<br/>L'équipe BYS Formations</p>
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

  await resend.emails.send({
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
      <p>Cordialement,<br/>L'équipe BYS Formations</p>
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

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Bienvenue sur BYS Formation — Votre espace centre est pret`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    <div style="display:inline-block;background:#2563EB;border-radius:8px;padding:8px 16px;margin-bottom:12px">
      <span style="color:#fff;font-weight:bold;font-size:18px">BYS</span>
    </div>
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
 * Send centre activation email when admin approves the centre.
 */
export async function sendCentreActivationEmail(params: {
  to: string;
  centreName: string;
  dashboardUrl: string;
}): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Votre centre est maintenant visible sur BYS Formation !`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    <div style="display:inline-block;background:#2563EB;border-radius:8px;padding:8px 16px;margin-bottom:12px">
      <span style="color:#fff;font-weight:bold;font-size:18px">BYS</span>
    </div>
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
 * Send centre rejection email when admin rejects the centre.
 */
export async function sendCentreRejectionEmail(params: {
  to: string;
  centreName: string;
  reason: string;
  onboardingUrl: string;
}): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `BYS Formation — Votre demande d'activation necessite des modifications`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    <div style="display:inline-block;background:#2563EB;border-radius:8px;padding:8px 16px;margin-bottom:12px">
      <span style="color:#fff;font-weight:bold;font-size:18px">BYS</span>
    </div>
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
