import { prisma } from "@/lib/prisma";
import {
  sendCentreEventEmail,
  sendEleveCancellationEmail,
  sendEleveEventEmail,
} from "@/lib/email";

const APP_URL = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

const STAFF_ROLES = ["CENTRE_ADMIN", "CENTRE_SECRETAIRE", "CENTRE_FORMATEUR"] as const;
const PLATFORM_STAFF_ROLES = ["ADMIN", "OWNER", "SUPPORT"] as const;

type CentreRecipients = {
  centreName: string;
  userIds: string[];
  emails: string[];
};

/** Propriétaire + email centre + admins/secrétaires (dédupliqués). */
export async function resolveCentreRecipients(centreId: string): Promise<CentreRecipients | null> {
  const centre = await prisma.centre.findUnique({
    where: { id: centreId },
    select: {
      nom: true,
      email: true,
      userId: true,
      user: { select: { id: true, email: true } },
      membres: {
        where: { role: { in: [...STAFF_ROLES] } },
        select: { user: { select: { id: true, email: true } } },
      },
    },
  });
  if (!centre) return null;

  const userIds = new Set<string>();
  const emails = new Set<string>();

  if (centre.userId) userIds.add(centre.userId);
  if (centre.user?.email) emails.add(centre.user.email.trim().toLowerCase());
  if (centre.email) emails.add(centre.email.trim().toLowerCase());

  for (const m of centre.membres) {
    userIds.add(m.user.id);
    if (m.user.email) emails.add(m.user.email.trim().toLowerCase());
  }

  return {
    centreName: centre.nom,
    userIds: [...userIds],
    emails: [...emails].filter(Boolean),
  };
}

async function createInAppNotifications(userIds: string[], titre: string, contenu: string) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({ userId, titre, contenu })),
  });
}

/** Staff plateforme (admin, owner, support). */
export async function resolvePlatformStaffRecipients() {
  const users = await prisma.user.findMany({
    where: { role: { in: [...PLATFORM_STAFF_ROLES] } },
    select: { id: true, email: true },
  });
  return {
    userIds: users.map((u) => u.id),
    emails: [...new Set(users.map((u) => u.email?.trim().toLowerCase()).filter(Boolean))] as string[],
  };
}

async function notifyCentreStaff(
  centreId: string,
  params: {
    titre: string;
    contenu: string;
    emailSubject: string;
    emailBody: string;
    ctaUrl?: string;
    ctaLabel?: string;
  },
) {
  const recipients = await resolveCentreRecipients(centreId);
  if (!recipients) return;

  await createInAppNotifications(recipients.userIds, params.titre, params.contenu);

  await Promise.allSettled(
    recipients.emails.map((to) =>
      sendCentreEventEmail({
        to,
        subject: params.emailSubject,
        title: params.titre,
        bodyHtml: params.emailBody,
        ctaUrl: params.ctaUrl ?? `${APP_URL}/espace-centre`,
        ctaLabel: params.ctaLabel ?? "Accéder à mon espace centre",
      }),
    ),
  );
}

async function notifyUser(
  userId: string,
  email: string | null | undefined,
  params: {
    titre: string;
    contenu: string;
    emailSubject?: string;
    emailBody?: string;
    ctaUrl?: string;
    ctaLabel?: string;
  },
) {
  await createInAppNotifications([userId], params.titre, params.contenu);

  if (email && params.emailSubject && params.emailBody) {
    await sendEleveEventEmail({
      to: email,
      subject: params.emailSubject,
      title: params.titre,
      bodyHtml: params.emailBody,
      ctaUrl: params.ctaUrl,
      ctaLabel: params.ctaLabel,
    }).catch((err) => console.error("[notifyUser] email:", err));
  }
}

/** Nouvelle réservation confirmée — notifie owner + équipe centre (email + cloche). */
export async function notifyCentreReservationConfirmed(params: {
  centreId: string;
  reservationNumber: string;
  eleveName: string;
  formationTitle: string;
  sessionDate: string;
  amount: number;
}): Promise<void> {
  const recipients = await resolveCentreRecipients(params.centreId);
  if (!recipients) return;

  const titre = "Nouvelle réservation";
  const contenu = `${params.eleveName} a réservé « ${params.formationTitle} » (${params.sessionDate}). Réf. ${params.reservationNumber}.`;

  await createInAppNotifications(recipients.userIds, titre, contenu);

  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(params.amount);

  const emailBody = `
    <p>Un nouvel élève vient de confirmer une réservation sur votre centre <strong>${recipients.centreName}</strong>.</p>
    <table style="border-collapse:collapse;margin:16px 0;width:100%">
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold;width:130px">Référence</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.reservationNumber}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Élève</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.eleveName}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Formation</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.formationTitle}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Date</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.sessionDate}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Montant net</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${formattedAmount}</td></tr>
    </table>
    <p>Consultez la fiche stagiaire depuis votre espace centre.</p>
  `;

  await Promise.allSettled(
    recipients.emails.map((to) =>
      sendCentreEventEmail({
        to,
        subject: `Nouvelle réservation — ${params.formationTitle}`,
        title: titre,
        bodyHtml: emailBody,
        ctaUrl: `${APP_URL}/espace-centre/sessions`,
        ctaLabel: "Voir mes sessions",
      })
    )
  );
}

/** Convocation envoyée à l'élève — informe le centre et l'owner. */
export async function notifyCentreConvocationSent(params: {
  centreId: string;
  reservationNumber: string;
  eleveName: string;
  eleveEmail: string;
  formationTitle: string;
  sessionDate: string;
}): Promise<void> {
  const recipients = await resolveCentreRecipients(params.centreId);
  if (!recipients) return;

  const titre = "Convocation envoyée";
  const contenu = `La convocation pour ${params.eleveName} (${params.reservationNumber}) — « ${params.formationTitle} » du ${params.sessionDate} a été envoyée à ${params.eleveEmail}.`;

  await createInAppNotifications(recipients.userIds, titre, contenu);

  const emailBody = `
    <p>Une convocation vient d'être envoyée à un stagiaire de votre centre.</p>
    <table style="border-collapse:collapse;margin:16px 0;width:100%">
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold;width:130px">Référence</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.reservationNumber}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Élève</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.eleveName}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Email élève</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.eleveEmail}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Formation</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.formationTitle}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Date session</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.sessionDate}</td></tr>
    </table>
  `;

  await Promise.allSettled(
    recipients.emails.map((to) =>
      sendCentreEventEmail({
        to,
        subject: `Convocation envoyée — ${params.eleveName}`,
        title: titre,
        bodyHtml: emailBody,
        ctaUrl: `${APP_URL}/espace-centre/sessions`,
        ctaLabel: "Gérer les inscriptions",
      })
    )
  );
}

/** Annulation — email élève + notif/email centre. */
export async function notifyReservationCancelled(params: {
  centreId: string;
  reservationNumber: string;
  eleveName: string;
  eleveEmail: string;
  elevePrenom?: string;
  formationTitle: string;
  sessionDate: string;
  centreName: string;
  refunded: boolean;
}): Promise<void> {
  const statusLabel = params.refunded ? "annulée et remboursée" : "annulée";

  // Email élève (la notif in-app est déjà créée dans la route)
  await sendEleveCancellationEmail({
    to: params.eleveEmail,
    prenom: params.elevePrenom,
    reservationNumber: params.reservationNumber,
    formationTitle: params.formationTitle,
    sessionDate: params.sessionDate,
    centreName: params.centreName,
    refunded: params.refunded,
  }).catch((err) => console.error("[notifyReservationCancelled] email élève:", err));

  const recipients = await resolveCentreRecipients(params.centreId);
  if (!recipients) return;

  const titre = "Réservation annulée";
  const contenu = `La réservation ${params.reservationNumber} de ${params.eleveName} pour « ${params.formationTitle} » (${params.sessionDate}) a été ${statusLabel}. Une place est de nouveau disponible.`;

  await createInAppNotifications(recipients.userIds, titre, contenu);

  const emailBody = `
    <p>Un stagiaire a annulé sa réservation sur votre centre <strong>${recipients.centreName}</strong>.</p>
    <table style="border-collapse:collapse;margin:16px 0;width:100%">
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold;width:130px">Référence</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.reservationNumber}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Élève</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.eleveName}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Formation</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.formationTitle}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Date</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.sessionDate}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Statut</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${statusLabel}</td></tr>
    </table>
    <p>La place a été libérée sur la session.</p>
  `;

  await Promise.allSettled(
    recipients.emails.map((to) =>
      sendCentreEventEmail({
        to,
        subject: `Annulation — ${params.reservationNumber}`,
        title: titre,
        bodyHtml: emailBody,
        ctaUrl: `${APP_URL}/espace-centre/sessions`,
        ctaLabel: "Voir le planning",
      })
    )
  );
}

// ─── Documents ───────────────────────────────────────────

/** Élève a déposé un document (permis, pièce d'identité…). */
export async function notifyCentreEleveDocumentUploaded(params: {
  centreId: string;
  eleveName: string;
  reservationNumber: string;
  documentLabel: string;
}): Promise<void> {
  await notifyCentreStaff(params.centreId, {
    titre: "Nouveau document élève",
    contenu: `${params.eleveName} a transmis « ${params.documentLabel} » (réservation ${params.reservationNumber}).`,
    emailSubject: `Document reçu — ${params.eleveName}`,
    emailBody: `<p>Un stagiaire a déposé un document sur la plateforme.</p>
      <table style="border-collapse:collapse;margin:16px 0;width:100%">
        <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold;width:130px">Élève</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.eleveName}</td></tr>
        <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Réservation</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.reservationNumber}</td></tr>
        <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Document</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB">${params.documentLabel}</td></tr>
      </table>`,
    ctaUrl: `${APP_URL}/espace-centre/sessions`,
    ctaLabel: "Voir les inscriptions",
  });
}

/** Élève a accepté un bon d'accord / document à valider. */
export async function notifyCentreBonAccordAccepted(params: {
  centreId: string;
  eleveName: string;
  documentName: string;
  reservationNumber?: string;
}): Promise<void> {
  await notifyCentreStaff(params.centreId, {
    titre: "Bon d'accord accepté",
    contenu: `${params.eleveName} a accepté le document « ${params.documentName} »${params.reservationNumber ? ` (${params.reservationNumber})` : ""}.`,
    emailSubject: `Bon d'accord accepté — ${params.eleveName}`,
    emailBody: `<p>Un stagiaire a validé un document obligatoire.</p>
      <p><strong>${params.eleveName}</strong> a accepté « <strong>${params.documentName}</strong> ».</p>
      ${params.reservationNumber ? `<p>Réservation : ${params.reservationNumber}</p>` : ""}`,
    ctaUrl: `${APP_URL}/espace-centre/sessions`,
    ctaLabel: "Voir les stagiaires",
  });
}

/** Documents auto-envoyés à la réservation — notification in-app élève. */
export async function notifyEleveDocumentsAvailable(params: {
  userId: string;
  centreName: string;
  needsAck: boolean;
}): Promise<void> {
  await createInAppNotifications(
    [params.userId],
    params.needsAck ? "Documents à valider" : "Nouveaux documents",
    params.needsAck
      ? `Votre centre ${params.centreName} a mis à disposition des documents, dont certains à accepter.`
      : `Votre centre ${params.centreName} a mis à disposition des documents pour votre stage.`,
  );
}

// ─── Sessions ────────────────────────────────────────────

/** Centre annule une session — notifie chaque stagiaire inscrit. */
export async function notifySessionCancelledByCentre(params: {
  centreId: string;
  centreName: string;
  formationTitle: string;
  sessionDate: string;
  reservations: Array<{
    userId: string;
    email: string;
    prenom: string;
    nom: string;
    numero: string;
  }>;
}): Promise<void> {
  await Promise.allSettled(
    params.reservations.map((r) =>
      notifyUser(r.userId, r.email, {
        titre: "Session annulée",
        contenu: `La session « ${params.formationTitle} » du ${params.sessionDate} chez ${params.centreName} a été annulée. Réf. ${r.numero}.`,
        emailSubject: `Session annulée — ${params.formationTitle}`,
        emailBody: `<p>Nous sommes au regret de vous informer que la session suivante a été <strong>annulée</strong> par le centre organisateur :</p>
          <ul style="line-height:1.8">
            <li><strong>Formation :</strong> ${params.formationTitle}</li>
            <li><strong>Date :</strong> ${params.sessionDate}</li>
            <li><strong>Centre :</strong> ${params.centreName}</li>
            <li><strong>Réservation :</strong> ${r.numero}</li>
          </ul>
          <p>Si un remboursement ou un report est prévu, vous serez contacté prochainement.</p>`,
        ctaUrl: `${APP_URL}/espace-eleve/reservations`,
        ctaLabel: "Voir mes réservations",
      }),
    ),
  );

  await notifyCentreStaff(params.centreId, {
    titre: "Session annulée",
    contenu: `La session « ${params.formationTitle} » du ${params.sessionDate} a été annulée. ${params.reservations.length} stagiaire(s) notifié(s).`,
    emailSubject: `Session annulée — ${params.formationTitle}`,
    emailBody: `<p>Vous avez annulé la session <strong>${params.formationTitle}</strong> du ${params.sessionDate}.</p>
      <p>${params.reservations.length} stagiaire(s) ont été notifié(s) par email.</p>`,
    ctaUrl: `${APP_URL}/espace-centre/sessions`,
    ctaLabel: "Voir le planning",
  });
}

// ─── Messagerie ──────────────────────────────────────────

export async function notifyNewMessage(params: {
  receiverId: string;
  receiverEmail: string;
  senderName: string;
  preview: string;
  ctaUrl?: string;
}): Promise<void> {
  const excerpt = params.preview.length > 120 ? `${params.preview.slice(0, 117)}…` : params.preview;
  await notifyUser(params.receiverId, params.receiverEmail, {
    titre: "Nouveau message",
    contenu: `${params.senderName} : ${excerpt}`,
    emailSubject: `Nouveau message de ${params.senderName}`,
    emailBody: `<p><strong>${params.senderName}</strong> vous a envoyé un message :</p>
      <blockquote style="margin:16px 0;padding:12px 16px;background:#F9FAFB;border-left:4px solid #2563EB;color:#374151">${excerpt}</blockquote>`,
    ctaUrl: params.ctaUrl ?? `${APP_URL}/espace-eleve/messages`,
    ctaLabel: "Lire le message",
  });
}

// ─── Support / tickets ─────────────────────────────────────

export async function notifySupportNewTicket(params: {
  sujet: string;
  authorName: string;
  authorEmail: string;
}): Promise<void> {
  const staff = await resolvePlatformStaffRecipients();
  const contenu = `Nouveau ticket de ${params.authorName} (${params.authorEmail}) : « ${params.sujet} ».`;
  await createInAppNotifications(staff.userIds, "Nouveau ticket support", contenu);

  const emailBody = `<p>Un utilisateur a ouvert un ticket support.</p>
    <table style="border-collapse:collapse;margin:16px 0;width:100%">
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold;width:100px">Auteur</td><td style="padding:8px 12px">${params.authorName}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Email</td><td style="padding:8px 12px">${params.authorEmail}</td></tr>
      <tr><td style="padding:8px 12px;background:#F9FAFB;font-weight:bold">Sujet</td><td style="padding:8px 12px">${params.sujet}</td></tr>
    </table>`;

  await Promise.allSettled(
    staff.emails.map((to) =>
      sendCentreEventEmail({
        to,
        subject: `[Support] ${params.sujet}`,
        title: "Nouveau ticket support",
        bodyHtml: emailBody,
        ctaUrl: `${APP_URL}/admin/support`,
        ctaLabel: "Traiter le ticket",
      }),
    ),
  );
}

export async function notifyEleveTicketReply(params: {
  userId: string;
  email: string;
  sujet: string;
  staffName: string;
}): Promise<void> {
  await notifyUser(params.userId, params.email, {
    titre: "Réponse à votre demande",
    contenu: `Notre équipe a répondu à votre ticket « ${params.sujet} ».`,
    emailSubject: `Réponse support — ${params.sujet}`,
    emailBody: `<p><strong>${params.staffName}</strong> a répondu à votre demande d'assistance concernant :</p>
      <p><strong>${params.sujet}</strong></p>`,
    ctaUrl: `${APP_URL}/espace-eleve/support`,
    ctaLabel: "Voir la conversation",
  });
}

export async function notifyEleveTicketStatus(params: {
  userId: string;
  email: string;
  sujet: string;
  status: string;
}): Promise<void> {
  const labels: Record<string, string> = {
    RESOLU: "résolu",
    FERME: "fermé",
    EN_COURS: "en cours de traitement",
  };
  const label = labels[params.status] ?? params.status.toLowerCase();
  await notifyUser(params.userId, params.email, {
    titre: "Mise à jour de votre ticket",
    contenu: `Votre ticket « ${params.sujet} » est maintenant ${label}.`,
    emailSubject: `Ticket ${label} — ${params.sujet}`,
    emailBody: `<p>Le statut de votre demande <strong>${params.sujet}</strong> a été mis à jour : <strong>${label}</strong>.</p>`,
    ctaUrl: `${APP_URL}/espace-eleve/support`,
    ctaLabel: "Voir mon ticket",
  });
}

// ─── Admin / validation centre ─────────────────────────────

export async function notifyAdminsCentreValidationRequest(params: {
  centreName: string;
  ville: string;
  completionPct: number;
}): Promise<void> {
  const staff = await resolvePlatformStaffRecipients();
  const contenu = `Le centre « ${params.centreName} » (${params.ville}) demande son activation (profil ${params.completionPct} %).`;
  await createInAppNotifications(staff.userIds, "Demande de validation centre", contenu);

  const emailBody = `<p>Un centre demande à être activé sur la marketplace.</p>
    <ul style="line-height:1.8">
      <li><strong>Centre :</strong> ${params.centreName}</li>
      <li><strong>Ville :</strong> ${params.ville}</li>
      <li><strong>Profil complété :</strong> ${params.completionPct} %</li>
    </ul>`;

  await Promise.allSettled(
    staff.emails.map((to) =>
      sendCentreEventEmail({
        to,
        subject: `Validation centre — ${params.centreName}`,
        title: "Demande de validation",
        bodyHtml: emailBody,
        ctaUrl: `${APP_URL}/admin/centres`,
        ctaLabel: "Examiner le centre",
      }),
    ),
  );
}

// ─── Questionnaires / avis ─────────────────────────────────

export async function notifyCentreQuestionnaireSubmitted(params: {
  centreId: string;
  eleveName: string;
  formationTitle: string;
  noteGlobale: number;
}): Promise<void> {
  await notifyCentreStaff(params.centreId, {
    titre: "Nouvel avis stagiaire",
    contenu: `${params.eleveName} a noté « ${params.formationTitle} » (${params.noteGlobale.toFixed(1)}/5).`,
    emailSubject: `Nouvel avis — ${params.formationTitle}`,
    emailBody: `<p>Un stagiaire vient de compléter le questionnaire satisfaction.</p>
      <p><strong>${params.eleveName}</strong> — ${params.formationTitle}<br/>
      Note globale : <strong>${params.noteGlobale.toFixed(1)} / 5</strong></p>`,
    ctaUrl: `${APP_URL}/espace-centre/stats`,
    ctaLabel: "Voir les statistiques",
  });
}

// ─── Rappels session (cron J-2) ────────────────────────────

export async function notifyEleveSessionReminder(params: {
  userId: string;
  formationTitle: string;
  sessionDate: string;
  centreName: string;
}): Promise<void> {
  await createInAppNotifications(
    [params.userId],
    "Rappel — votre stage approche",
    `Votre stage « ${params.formationTitle} » chez ${params.centreName} commence le ${params.sessionDate}. Pensez à imprimer votre convocation.`,
  );
}
