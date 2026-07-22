import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { renderAttestationPdf } from "@/lib/pdf-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;
    const user = await requireAuth();

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, userId: true, status: true, numero: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation introuvable" }, { status: 404 });
    }

    // Verification : l'utilisateur doit etre le proprietaire ou un admin
    if (reservation.userId !== user.id && user.role !== "ADMIN" && user.role !== "OWNER") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    // Seules les reservations TERMINEE peuvent generer une attestation
    if (reservation.status !== "TERMINEE") {
      return NextResponse.json(
        { error: "L'attestation n'est disponible que pour les formations terminées" },
        { status: 400 }
      );
    }

    const { buffer, filename } = await renderAttestationPdf(reservation.id);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/attestations]", err);
    return NextResponse.json({ error: "Erreur generation PDF" }, { status: 500 });
  }
}
