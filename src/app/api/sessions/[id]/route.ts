import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sessions/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        formation: {
          select: {
            titre: true,
            duree: true,
            prix: true,
            isQualiopi: true,
            isCPF: true,
            centre: {
              select: { nom: true, ville: true, adresse: true, codePostal: true, telephone: true },
            },
          },
        },
      },
    });

    if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

    return NextResponse.json({
      id: session.id,
      dateDebut: session.dateDebut,
      dateFin: session.dateFin,
      placesRestantes: session.placesRestantes,
      placesTotal: session.placesTotal,
      prix: session.formation.prix,
      formation: {
        titre: session.formation.titre,
        duree: session.formation.duree,
        isQualiopi: session.formation.isQualiopi,
        isCPF: session.formation.isCPF,
      },
      centre: session.formation.centre.nom,
      ville: session.formation.centre.ville,
      adresse: `${session.formation.centre.adresse}, ${session.formation.centre.codePostal} ${session.formation.centre.ville}`,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
