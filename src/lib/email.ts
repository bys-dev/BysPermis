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
