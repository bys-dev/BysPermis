import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

/**
 * Vérifie la signature Svix (format utilisé par Resend).
 *
 * Le contenu signé est `${svix-id}.${svix-timestamp}.${body}`, en HMAC-SHA256
 * avec la partie base64 du secret `whsec_…`. L'en-tête `svix-signature` peut
 * contenir plusieurs signatures (rotation de secret) séparées par des espaces :
 * il suffit qu'une seule corresponde.
 */
function verifySignature(params: {
  body: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  secret: string;
}): boolean {
  const secretBytes = Buffer.from(params.secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${params.svixId}.${params.svixTimestamp}.${params.body}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  const provided = params.svixSignature
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1,"))
    .map((part) => part.slice(3));

  return provided.some((sig) => {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    // Comparaison à temps constant — timingSafeEqual exige des longueurs égales.
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

/** Rejeu : l'horodatage Svix doit rester dans une fenêtre de 5 minutes. */
function timestampIsFresh(svixTimestamp: string): boolean {
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(Date.now() / 1000 - ts) < 300;
}

interface ResendEvent {
  type: string;
  created_at?: string;
  data?: { email_id?: string; to?: string | string[]; subject?: string };
}

/**
 * POST /api/webhooks/resend
 *
 * Rattache les événements de délivrabilité (ouverture, clic, rejet, plainte) aux
 * destinataires de campagne, via l'id du message Resend.
 *
 * Deux conséquences importantes côté données :
 *   - un rejet définitif (bounce) invalide l'adresse : le prospect ne sera plus
 *     jamais ciblé, ce qui protège la réputation du domaine ;
 *   - une plainte pour spam vaut opposition au démarchage — traitée exactement
 *     comme une désinscription.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();

  // ── Authentification du webhook ──
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (WEBHOOK_SECRET) {
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
    }
    if (!timestampIsFresh(svixTimestamp)) {
      return NextResponse.json({ error: "Horodatage hors fenêtre" }, { status: 400 });
    }
    if (!verifySignature({ body, svixId, svixTimestamp, svixSignature, secret: WEBHOOK_SECRET })) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Sans secret en production, n'importe qui pourrait falsifier des
    // événements : on refuse plutôt que de traiter des données non authentifiées.
    console.error("[webhooks/resend] RESEND_WEBHOOK_SECRET absent — événement rejeté");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(body) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return NextResponse.json({ ok: true, ignore: "email_id absent" });
  }

  try {
    // ── Idempotence : Svix réessaie en cas d'erreur ou de timeout ──
    if (svixId) {
      const already = await prisma.webhookEvent.findUnique({
        where: { provider_id: { provider: "resend", id: svixId } },
      });
      if (already) return NextResponse.json({ ok: true, deja: true });
    }

    const recipient = await prisma.campaignRecipient.findFirst({
      where: { providerId: emailId },
      select: {
        id: true,
        campaignId: true,
        prospectId: true,
        status: true,
        openedAt: true,
        clickedAt: true,
        prospect: { select: { statut: true } },
      },
    });

    // Les emails transactionnels passent aussi par ce webhook : sans
    // destinataire de campagne, il n'y a rien à mettre à jour.
    if (!recipient) {
      if (svixId) {
        await prisma.webhookEvent.create({
          data: { id: svixId, provider: "resend", type: event.type },
        });
      }
      return NextResponse.json({ ok: true, ignore: "hors campagne" });
    }

    const now = event.created_at ? new Date(event.created_at) : new Date();

    switch (event.type) {
      case "email.opened": {
        // Compteurs en ouvertures *uniques* : une relecture de l'email ne doit
        // pas gonfler le taux d'ouverture.
        const premiere = recipient.openedAt === null;
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            openedAt: recipient.openedAt ?? now,
            // Un clic est un signal plus fort : on ne rétrograde pas.
            status: recipient.status === "CLIQUE" ? "CLIQUE" : "OUVERT",
          },
        });
        if (premiere) {
          await prisma.$transaction([
            prisma.prospect.update({
              where: { id: recipient.prospectId },
              data: { nbOuvertures: { increment: 1 } },
            }),
            prisma.emailCampaign.update({
              where: { id: recipient.campaignId },
              data: { nbOuvertures: { increment: 1 } },
            }),
          ]);
        }
        break;
      }

      case "email.clicked": {
        const premier = recipient.clickedAt === null;
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { clickedAt: recipient.clickedAt ?? now, status: "CLIQUE" },
        });
        if (premier) {
          // Un clic marque un intérêt — mais on ne rétrograde pas un prospect
          // déjà qualifié (INSCRIT, REFUSE) sur la seule base d'un clic.
          const remonterStatut = ["NOUVEAU", "A_CONTACTER", "CONTACTE", "RELANCE"].includes(
            recipient.prospect.statut,
          );
          await prisma.$transaction([
            prisma.prospect.update({
              where: { id: recipient.prospectId },
              data: {
                nbClics: { increment: 1 },
                ...(remonterStatut ? { statut: "INTERESSE" as const } : {}),
              },
            }),
            prisma.emailCampaign.update({
              where: { id: recipient.campaignId },
              data: { nbClics: { increment: 1 } },
            }),
          ]);
        }
        break;
      }

      case "email.bounced": {
        await prisma.$transaction([
          prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "BOUNCE", bouncedAt: now, error: "Rejet du serveur destinataire" },
          }),
          prisma.prospect.update({
            where: { id: recipient.prospectId },
            data: { emailValide: false, bouncedAt: now, statut: "INJOIGNABLE" },
          }),
        ]);
        break;
      }

      case "email.complained": {
        // Signalement en spam : obligation d'arrêt immédiat de tout envoi.
        await prisma.$transaction([
          prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "PLAINTE", error: "Signalé comme spam" },
          }),
          prisma.prospect.update({
            where: { id: recipient.prospectId },
            data: { unsubscribedAt: now, statut: "DESABONNE", emailValide: false },
          }),
          prisma.campaignRecipient.updateMany({
            where: { prospectId: recipient.prospectId, status: "EN_ATTENTE" },
            data: { status: "IGNORE", error: "Plainte spam du prospect" },
          }),
        ]);
        break;
      }

      // email.sent / email.delivered / email.delivery_delayed : pas d'action,
      // le statut ENVOYE est déjà posé à l'expédition.
      default:
        break;
    }

    if (svixId) {
      await prisma.webhookEvent.create({
        data: { id: svixId, provider: "resend", type: event.type },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/webhooks/resend]", err);
    // 500 → Svix réessaiera, et l'idempotence ci-dessus évite le double comptage.
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
  }
}
