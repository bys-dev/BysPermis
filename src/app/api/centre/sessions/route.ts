import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";

// GET /api/centre/sessions — sessions du centre connecté
export async function GET() {
  try {
    const user = await requireAuth();

    const centre = await prisma.centre.findUnique({ where: { userId: user.id } });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const sessions = await prisma.session.findMany({
      where: { formation: { centreId: centre.id } },
      include: {
        formation: {
          select: { titre: true, centre: { select: { ville: true } } },
        },
        _count: { select: { reservations: true } },
      },
      orderBy: { dateDebut: "asc" },
    });

    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        formation: s.formation.titre,
        dateDebut: s.dateDebut,
        dateFin: s.dateFin,
        ville: s.formation.centre.ville,
        placesTotal: s.placesTotal,
        placesRestantes: s.placesRestantes,
        status: s.status,
        reservationsCount: s._count.reservations,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
