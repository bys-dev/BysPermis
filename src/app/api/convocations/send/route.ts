import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreManagement } from "@/lib/auth0";
import { renderEmailTemplate } from "@/lib/email-templates";
import { resend } from "@/lib/email";
import { formatDate } from "@/lib/utils";

const FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@bysformations.fr>";
const APP_URL = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

/**
 * POST /api/convocations/send
 * Send or re-send a convocation email for a reservation.
 */
export async function POST(req: NextRequest) {
  try {
    await requireCentreManagement();

    const body = await req.json();
    const { reservationId } = body as { reservationId: string };

    if (!reservationId) {
      return NextResponse.json({ error: "reservationId requis" }, { status: 400 });
    }

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

    await resend.emails.send({
      from: FROM,
      to: reservation.email,
      subject,
      html,
    });

    return NextResponse.json({ success: true, message: "Convocation envoyée" });
  } catch (err) {
    console.error("[POST /api/convocations/send]", err);
    if (err instanceof Error && err.message === "Non autorisé") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
