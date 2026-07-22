import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendDocumentEmail, sendMail } from "@/lib/email";
import { EMAIL_KIND, emailAlreadySent, logEmail } from "@/lib/email-log";
import { renderEmailTemplate } from "@/lib/email-templates";
import { archiveConvocation, archiveFacture } from "@/lib/documents";
import {
  notifyCentreConvocationSent,
  notifyCentreReservationConfirmed,
  notifyEleveDocumentsAvailable,
} from "@/lib/event-notifications";
import { formatDate, getCommissionRate } from "@/lib/utils";

/**
 * Pipeline post-paiement d'une réservation : archivage des PDF + envoi des emails.
 *
 * Appelé à DEUX endroits :
 *   1. `POST /api/reservations` — chemin nominal, juste après la confirmation.
 *   2. Le webhook Stripe `payment_intent.succeeded` — FILET DE SÉCURITÉ. Avant,
 *      le webhook ne faisait que passer le statut à CONFIRMEE : si la route
 *      synchrone échouait après le paiement, l'élève était débité sans jamais
 *      recevoir sa confirmation ni sa convocation.
 *
 * Idempotence à deux niveaux :
 *   - Verrou atomique `Reservation.fulfilledAt` (UPDATE ... WHERE fulfilledAt IS
 *     NULL) : un seul appelant exécute le pipeline même en cas de course entre la
 *     route et le webhook.
 *   - Journal `EmailLog` : chaque email est re-vérifié individuellement, donc une
 *     reprise après échec partiel ne renvoie que ce qui manque.
 *
 * Ne throw jamais : un incident d'email ou de storage ne doit pas invalider un
 * paiement encaissé.
 */

const APP_URL =
  process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";
const FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@byspermis.fr>";

export interface FulfillResult {
  /** true si le pipeline a tourné, false s'il était déjà fait / non applicable. */
  executed: boolean;
  reason?: string;
  factureUrl?: string | null;
  convocationUrl?: string | null;
  emailsSent: string[];
}

export async function fulfillReservation(
  reservationId: string,
  opts: { force?: boolean; source?: string } = {},
): Promise<FulfillResult> {
  const source = opts.source ?? "inconnu";
  const emailsSent: string[] = [];

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { session: { include: { formation: { include: { centre: true } } } } },
  });

  if (!reservation) {
    return { executed: false, reason: "réservation introuvable", emailsSent };
  }
  // On ne « fulfill » que des réservations effectivement payées.
  if (reservation.status !== "CONFIRMEE" && reservation.status !== "TERMINEE") {
    return { executed: false, reason: `statut ${reservation.status}`, emailsSent };
  }

  // ─── Verrou atomique ────────────────────────────────────
  if (!opts.force) {
    const claim = await prisma.reservation.updateMany({
      where: { id: reservationId, fulfilledAt: null },
      data: { fulfilledAt: new Date() },
    });
    if (claim.count === 0) {
      return { executed: false, reason: "déjà traité", emailsSent };
    }
  }

  console.info(`[fulfillment] démarrage ${reservation.numero} (source: ${source})`);

  const centre = reservation.session.formation.centre;
  const formation = reservation.session.formation;
  const logCtx = {
    reservationId: reservation.id,
    userId: reservation.userId,
    centreId: centre.id,
  };

  let factureUrl: string | null = null;
  let convocationUrl: string | null = null;

  try {
    // ─── 1. Archivage des PDF (idempotent) ────────────────
    const [facture, convocation] = await Promise.all([
      archiveFacture(reservation.id, centre.id).catch((err) => {
        console.error("[fulfillment] archivage facture:", err);
        return null;
      }),
      archiveConvocation(reservation.id, centre.id).catch((err) => {
        console.error("[fulfillment] archivage convocation:", err);
        return null;
      }),
    ]);
    factureUrl = facture?.url ?? null;
    convocationUrl = convocation?.url ?? null;

    // ─── 2. Email de confirmation (+ facture jointe) ──────
    if (!(await emailAlreadySent(reservation.id, EMAIL_KIND.CONFIRMATION))) {
      try {
        await sendConfirmationEmail({
          to: reservation.email,
          reservationNumber: reservation.numero,
          formationTitle: formation.titre,
          sessionDate: reservation.session.dateDebut.toLocaleDateString("fr-FR"),
          centreName: centre.nom,
          attachments: facture
            ? [{ filename: facture.filename, content: facture.buffer }]
            : undefined,
          context: { kind: EMAIL_KIND.CONFIRMATION, ...logCtx },
        });
        emailsSent.push(EMAIL_KIND.CONFIRMATION);
      } catch (err) {
        console.error("[fulfillment] email confirmation:", err);
      }
    }

    // ─── 3. Email de convocation (+ convocation jointe) ───
    if (!(await emailAlreadySent(reservation.id, EMAIL_KIND.CONVOCATION))) {
      try {
        const vars: Record<string, string> = {
          prenom: reservation.prenom,
          nom: reservation.nom,
          email: reservation.email,
          formation: formation.titre,
          centre: centre.nom,
          dateDebut: formatDate(reservation.session.dateDebut),
          dateFin: formatDate(reservation.session.dateFin),
          lieu:
            formation.lieu ?? `${centre.adresse}, ${centre.codePostal} ${centre.ville}`,
          prix: `${reservation.montant} €`,
          numero: reservation.numero,
          lienConvocation: `${APP_URL}/api/convocation/${reservation.id}`,
        };
        const { subject, html } = await renderEmailTemplate("convocation", centre.id, vars);
        await sendMail(
          {
            from: FROM,
            to: reservation.email,
            subject,
            html,
            ...(convocation
              ? {
                  attachments: [
                    { filename: convocation.filename, content: convocation.buffer },
                  ],
                }
              : {}),
          },
          { kind: EMAIL_KIND.CONVOCATION, ...logCtx },
        );
        emailsSent.push(EMAIL_KIND.CONVOCATION);
      } catch (err) {
        console.error("[fulfillment] email convocation:", err);
      }
    }

    // ─── 4. Notification du centre (réservation + convocation) ──
    if (!(await emailAlreadySent(reservation.id, EMAIL_KIND.CENTRE_RESERVATION))) {
      try {
        await notifyCentreReservationConfirmed({
          centreId: centre.id,
          reservationNumber: reservation.numero,
          eleveName: `${reservation.prenom} ${reservation.nom}`,
          formationTitle: formation.titre,
          sessionDate: reservation.session.dateDebut.toLocaleDateString("fr-FR"),
          amount: reservation.montant * (1 - getCommissionRate(centre)),
        });
        // Marqueur explicite : notifyCentre* écrit ses propres lignes de journal
        // mais sans rattachement à la réservation — inutilisable comme garde.
        await logEmail({
          destinataire: centre.email ?? centre.nom,
          sujet: `Nouvelle réservation ${reservation.numero}`,
          status: "ENVOYE",
          kind: EMAIL_KIND.CENTRE_RESERVATION,
          ...logCtx,
        });
        emailsSent.push(EMAIL_KIND.CENTRE_RESERVATION);
      } catch (err) {
        console.error("[fulfillment] notification centre réservation:", err);
      }
    }

    if (!(await emailAlreadySent(reservation.id, EMAIL_KIND.CENTRE_CONVOCATION))) {
      try {
        await notifyCentreConvocationSent({
          centreId: centre.id,
          reservationNumber: reservation.numero,
          eleveName: `${reservation.prenom} ${reservation.nom}`,
          eleveEmail: reservation.email,
          formationTitle: formation.titre,
          sessionDate: reservation.session.dateDebut.toLocaleDateString("fr-FR"),
        });
        await logEmail({
          destinataire: centre.email ?? centre.nom,
          sujet: `Convocation envoyée — ${reservation.numero}`,
          status: "ENVOYE",
          kind: EMAIL_KIND.CENTRE_CONVOCATION,
          ...logCtx,
        });
        emailsSent.push(EMAIL_KIND.CENTRE_CONVOCATION);
      } catch (err) {
        console.error("[fulfillment] notification centre convocation:", err);
      }
    }

    // ─── 5. Documents auto configurés par le centre ───────
    await sendCentreAutoDocuments(reservation.id, centre.id, {
      email: reservation.email,
      prenom: reservation.prenom,
      userId: reservation.userId,
      centreName: centre.nom,
    })
      .then((sent) => {
        if (sent) emailsSent.push(EMAIL_KIND.DOCUMENTS_AUTO);
      })
      .catch((err) => console.error("[fulfillment] documents auto:", err));

    console.info(
      `[fulfillment] terminé ${reservation.numero} — emails: ${emailsSent.join(", ") || "aucun (déjà envoyés)"}`,
    );

    return { executed: true, factureUrl, convocationUrl, emailsSent };
  } catch (err) {
    // Échec global inattendu : on relâche le verrou pour que le filet de sécurité
    // (webhook Stripe / nouvel appel) puisse retenter. Les emails déjà partis sont
    // protégés par le journal, il n'y aura pas de doublon.
    console.error("[fulfillment] échec global, verrou relâché:", err);
    await prisma.reservation
      .updateMany({ where: { id: reservationId }, data: { fulfilledAt: null } })
      .catch(() => undefined);
    return { executed: false, reason: "erreur", factureUrl, convocationUrl, emailsSent };
  }
}

/**
 * Crée les documents que le centre a configurés en envoi automatique (règlement,
 * bon d'accord…) et prévient l'élève. Idempotent via le couple (réservation, template).
 * Retourne true si un email a été envoyé.
 */
async function sendCentreAutoDocuments(
  reservationId: string,
  centreId: string,
  eleve: { email: string; prenom: string; userId: string; centreName: string },
): Promise<boolean> {
  const templates = await prisma.centreDocumentTemplate.findMany({
    where: { centreId, actif: true, autoSend: true },
    orderBy: { ordre: "asc" },
  });
  if (templates.length === 0) return false;

  for (const t of templates) {
    const exists = await prisma.document.findFirst({
      where: { reservationId, templateId: t.id },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.document.create({
      data: {
        kind: t.kind,
        direction: "CENTRE_VERS_ELEVE",
        nom: t.nom,
        description: t.description,
        blobUrl: t.blobUrl,
        contenu: t.contenu,
        requiresAck: t.requiresAck,
        status: "ENVOYE",
        reservationId,
        centreId,
        templateId: t.id,
      },
    });
  }

  if (await emailAlreadySent(reservationId, EMAIL_KIND.DOCUMENTS_AUTO)) return false;

  const needsAck = templates.some((t) => t.requiresAck);
  await sendDocumentEmail({
    to: eleve.email,
    prenom: eleve.prenom,
    sujet: `Documents de votre stage — ${eleve.centreName}`,
    intro: needsAck
      ? `Votre centre a mis à disposition des documents pour votre stage, dont un ou plusieurs à lire et accepter. Rendez-vous dans votre espace élève pour les consulter et valider le bon d'accord.`
      : `Votre centre a mis à disposition des documents pour votre stage. Retrouvez-les dans votre espace élève.`,
    ctaUrl: `${APP_URL}/espace-eleve/documents`,
    ctaLabel: "Voir mes documents",
    context: {
      kind: EMAIL_KIND.DOCUMENTS_AUTO,
      reservationId,
      userId: eleve.userId,
      centreId,
    },
  });

  await notifyEleveDocumentsAvailable({
    userId: eleve.userId,
    centreName: eleve.centreName,
    needsAck,
  }).catch((err) => console.error("[fulfillment] notif documents élève:", err));

  return true;
}
