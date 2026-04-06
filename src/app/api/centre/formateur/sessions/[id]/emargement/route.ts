import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { z } from "zod";

const emargementSchema = z.object({
  attendance: z.record(z.string(), z.boolean()),
});

// POST /api/centre/formateur/sessions/[id]/emargement — save attendance
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    // Verify session belongs to this centre
    const session = await prisma.session.findFirst({
      where: { id: sessionId, formation: { centreId } },
    });
    if (!session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const { attendance } = emargementSchema.parse(body);

    // For now, we update reservation status based on attendance.
    // Users marked as present who have CONFIRMEE reservations -> TERMINEE
    // This is a v1 approach. V2 would use a dedicated Emargement table.
    const presentUserIds = Object.entries(attendance)
      .filter(([, present]) => present)
      .map(([userId]) => userId);

    if (presentUserIds.length > 0) {
      await prisma.reservation.updateMany({
        where: {
          sessionId,
          userId: { in: presentUserIds },
          status: "CONFIRMEE",
        },
        data: { status: "TERMINEE" },
      });

      // Notify users that their attestation is available
      const terminatedReservations = await prisma.reservation.findMany({
        where: {
          sessionId,
          userId: { in: presentUserIds },
          status: "TERMINEE",
        },
        include: {
          session: { include: { formation: true } },
        },
      });

      const notificationPromises = terminatedReservations.map((r) =>
        prisma.notification.create({
          data: {
            userId: r.userId,
            titre: "Attestation de formation disponible",
            contenu: `Votre attestation pour "${r.session.formation.titre}" est disponible. Rendez-vous dans vos formations pour la telecharger.`,
          },
        })
      );
      await Promise.all(notificationPromises);
    }

    return NextResponse.json({
      success: true,
      present: presentUserIds.length,
      total: Object.keys(attendance).length,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    console.error("[POST /api/centre/formateur/sessions/[id]/emargement]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
