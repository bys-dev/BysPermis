import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { renderIndividualEmargementPdf } from "@/lib/pdf-helpers";

// GET /api/emargement/[reservationId] — feuille d'émargement individuelle (PDF)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;
    const user = await requireAuth();

    const reservation = await prisma.reservation.findFirst({
      where: { OR: [{ id: reservationId }, { numero: reservationId }] },
      include: { session: { include: { formation: { select: { centreId: true } } } } },
    });
    if (!reservation) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    // Autorisation : propriétaire, admin/owner plateforme, ou staff du centre concerné
    const isOwner = reservation.userId === user.id;
    const isPlatformAdmin = user.role === "ADMIN" || user.role === "OWNER";
    let isCentreStaff = false;
    if (!isOwner && !isPlatformAdmin && user.role.startsWith("CENTRE_")) {
      const centreId = await getUserCentreId(user.id, user.role);
      isCentreStaff = centreId === reservation.session.formation.centreId;
    }
    if (!isOwner && !isPlatformAdmin && !isCentreStaff) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { buffer, filename } = await renderIndividualEmargementPdf(reservation.id);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[GET /api/emargement/[reservationId]]", err);
    return NextResponse.json({ error: "Erreur génération PDF" }, { status: 500 });
  }
}
