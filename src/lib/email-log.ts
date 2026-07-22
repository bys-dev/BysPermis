import { prisma } from "@/lib/prisma";

/**
 * Journal des emails sortants.
 *
 * Deux usages :
 *   1. Traçabilité — savoir qui a reçu quoi, quand, avec l'id Resend et l'erreur
 *      éventuelle (avant, on ne disposait que de `console.error`).
 *   2. Idempotence — le webhook Stripe rejoue le pipeline de fulfillment en filet
 *      de sécurité ; le journal permet de ne pas renvoyer un email déjà parti.
 *
 * Toutes les écritures sont best-effort : un journal indisponible ne doit JAMAIS
 * empêcher l'envoi d'un email.
 */

/** Identifiants fonctionnels des emails journalisés (évite les fautes de frappe). */
export const EMAIL_KIND = {
  CONFIRMATION: "confirmation_reservation",
  CONVOCATION: "convocation",
  DOCUMENTS_AUTO: "documents_auto",
  CENTRE_RESERVATION: "centre_reservation",
  CENTRE_CONVOCATION: "centre_convocation",
  JUSTIFICATIF_RECU: "justificatif_recu",
  JUSTIFICATIF_VERIFIE: "justificatif_verifie",
  PURGE_RGPD: "purge_rgpd",
  RAPPEL_SESSION: "rappel_session",
  QUESTIONNAIRE: "questionnaire",
  EMARGEMENT: "emargement",
  AUTRE: "autre",
} as const;

export interface EmailLogContext {
  /** Identifiant fonctionnel — de préférence une valeur de EMAIL_KIND. */
  kind: string;
  reservationId?: string | null;
  userId?: string | null;
  centreId?: string | null;
}

export async function logEmail(entry: {
  destinataire: string;
  sujet: string;
  status: "ENVOYE" | "ECHEC";
  error?: string | null;
  providerId?: string | null;
} & EmailLogContext): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        destinataire: entry.destinataire.slice(0, 500),
        sujet: entry.sujet.slice(0, 500),
        kind: entry.kind,
        status: entry.status,
        error: entry.error ? entry.error.slice(0, 1000) : null,
        providerId: entry.providerId ?? null,
        reservationId: entry.reservationId ?? null,
        userId: entry.userId ?? null,
        centreId: entry.centreId ?? null,
      },
    });
  } catch (err) {
    // Ne jamais faire échouer un envoi à cause du journal.
    console.error("[email-log] écriture impossible:", err);
  }
}

/**
 * Un email de ce type est-il déjà parti avec succès pour cette réservation ?
 * Utilisé par le pipeline de fulfillment pour ne pas doubler les envois quand le
 * webhook Stripe rejoue après la route de réservation.
 */
export async function emailAlreadySent(
  reservationId: string,
  kind: string,
): Promise<boolean> {
  try {
    const existing = await prisma.emailLog.findFirst({
      where: { reservationId, kind, status: "ENVOYE" },
      select: { id: true },
    });
    return existing !== null;
  } catch (err) {
    // Journal illisible : on considère l'email comme déjà envoyé. Un email
    // manquant est moins grave qu'un envoi en double à chaque retry Stripe.
    console.error("[email-log] lecture impossible, envoi supposé déjà fait:", err);
    return true;
  }
}
