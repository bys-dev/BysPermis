import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderEmailTemplate } from "@/lib/email-templates";
import { resend } from "@/lib/email";
import { formatDate } from "@/lib/utils";

const FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@bysformations.fr>";
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/session-reminders
 * Called by Vercel Cron or external scheduler.
 * Sends "rappel_session" emails for sessions starting within the next 48h.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find sessions starting in the next 48h
    const sessions = await prisma.session.findMany({
      where: {
        dateDebut: {
          gte: now,
          lte: in48h,
        },
        status: "ACTIVE",
      },
      include: {
        formation: {
          include: { centre: true },
        },
        reservations: {
          where: {
            status: "CONFIRMEE",
            rappelEnvoye: false,
          },
        },
      },
    });

    let totalSent = 0;

    for (const session of sessions) {
      const { formation } = session;
      const centre = formation.centre;

      for (const reservation of session.reservations) {
        try {
          const variables: Record<string, string> = {
            prenom: reservation.prenom,
            nom: reservation.nom,
            email: reservation.email,
            formation: formation.titre,
            centre: centre.nom,
            dateDebut: formatDate(session.dateDebut),
            dateFin: formatDate(session.dateFin),
            lieu: formation.lieu ?? `${centre.adresse}, ${centre.codePostal} ${centre.ville}`,
            prix: `${reservation.montant} €`,
            numero: reservation.numero,
            lienConvocation: `${process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr"}/api/convocation/${reservation.id}`,
          };

          const { subject, html } = await renderEmailTemplate(
            "rappel_session",
            centre.id,
            variables
          );

          await resend.emails.send({
            from: FROM,
            to: reservation.email,
            subject,
            html,
          });

          // Mark as notified
          await prisma.reservation.update({
            where: { id: reservation.id },
            data: { rappelEnvoye: true },
          });

          totalSent++;
        } catch (emailErr) {
          console.error(
            `[CRON] Erreur envoi rappel pour réservation ${reservation.numero}:`,
            emailErr
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      sessionsProcessed: sessions.length,
      emailsSent: totalSent,
    });
  } catch (err) {
    console.error("[GET /api/cron/session-reminders]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
