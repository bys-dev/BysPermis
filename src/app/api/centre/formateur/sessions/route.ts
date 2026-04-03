import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

// GET /api/centre/formateur/sessions — sessions for the formateur (currently: all sessions for the centre)
export async function GET() {
  try {
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    // For now, return all sessions for the centre.
    // V2: filter by formateur assignment when the model supports it.
    const sessions = await prisma.session.findMany({
      where: { formation: { centreId } },
      include: {
        formation: {
          select: { titre: true },
        },
        reservations: {
          where: { status: { in: ["CONFIRMEE", "TERMINEE"] } },
          include: {
            user: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
      orderBy: { dateDebut: "asc" },
    });

    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        formation: s.formation.titre,
        dateDebut: s.dateDebut,
        dateFin: s.dateFin,
        nbStagiaires: s.reservations.length,
        placesTotal: s.placesTotal,
        status: s.status,
        stagiaires: s.reservations.map((r) => ({
          id: r.user.id,
          nom: r.user.nom,
          prenom: r.user.prenom,
          present: false, // V2: read from emargement table
        })),
      }))
    );
  } catch (err) {
    console.error("[GET /api/centre/formateur/sessions]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
