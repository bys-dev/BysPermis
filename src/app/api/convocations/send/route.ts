import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreManagement, PLATFORM_ADMIN_ROLES } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { renderEmailTemplate } from "@/lib/email-templates";
import { sendMail } from "@/lib/email";
import { notifyCentreConvocationSent } from "@/lib/event-notifications";
import { formatDate } from "@/lib/utils";
import { z } from "zod";

const FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@byspermis.fr>";
const APP_URL = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

const sendSchema = z.object({
  reservationId: z.string().min(1),
});

/**
 * POST /api/convocations/send
 * Send or re-send a convocation email for a reservation.
 *
 * Anti-IDOR: après requireCentreManagement(), vérifier que la réservation
 * appartient bien à un centre que l'utilisateur gère.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreManagement();

    const body = await req.json();
    const { reservationId } = sendSchema.parse(body);

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        session: {
          include: {
            formation: {
              include: { centre: true },
            },
          },
        },
        user: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const { session } = reservation;
    const { formation } = session;
    const centre = formation.centre;

    // ─── Anti-IDOR: vérifier que l'utilisateur gère ce centre ──
    const isPlatformAdmin = (PLATFORM_ADMIN_ROLES as readonly string[]).includes(user.role);
    if (!isPlatformAdmin) {
      const userCentreId = await getUserCentreId(user.id, user.role);
      if (userCentreId !== centre.id) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    const lienConvocation = `${APP_URL}/api/convocation/${reservation.id}`;

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
      lienConvocation,
    };

    const { subject, html } = await renderEmailTemplate(
      "convocation",
      centre.id,
      variables
    );

    await sendMail({
      from: FROM,
      to: reservation.email,
      subject,
      html,
    });

    // Notifier owner + équipe centre (email + cloche)
    await notifyCentreConvocationSent({
      centreId: centre.id,
      reservationNumber: reservation.numero,
      eleveName: `${reservation.prenom} ${reservation.nom}`,
      eleveEmail: reservation.email,
      formationTitle: formation.titre,
      sessionDate: formatDate(session.dateDebut),
    }).catch((err) => {
      console.error("[POST /api/convocations/send] Centre notification error:", err);
    });

    // Notification in-app élève
    if (reservation.userId) {
      await prisma.notification.create({
        data: {
          userId: reservation.userId,
          titre: "Convocation envoyée",
          contenu: `Votre convocation pour « ${formation.titre} » (${formatDate(session.dateDebut)}) vous a été envoyée par email.`,
        },
      }).catch((err) => console.error("[POST /api/convocations/send] Notif élève:", err));
    }

    return NextResponse.json({ success: true, message: "Convocation envoyée" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[POST /api/convocations/send]", err);
    if (err instanceof Error && err.message === "Non autorisé") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
