import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

// GET /api/centre/contrats — all reservations for this centre's formations (for contrat management)
export async function GET() {
  try {
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const reservations = await prisma.reservation.findMany({
      where: {
        session: {
          formation: { centreId },
        },
      },
      include: {
        session: {
          include: {
            formation: {
              select: { titre: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      reservations.map((r) => ({
        id: r.id,
        numero: r.numero,
        status: r.status,
        montant: r.montant,
        prenom: r.prenom,
        nom: r.nom,
        email: r.email,
        createdAt: r.createdAt,
        session: {
          dateDebut: r.session.dateDebut,
          dateFin: r.session.dateFin,
          formation: {
            titre: r.session.formation.titre,
          },
        },
      }))
    );
  } catch (err) {
    console.error("[GET /api/centre/contrats]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
