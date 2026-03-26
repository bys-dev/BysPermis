import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/formations/slug/[slug]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const formation = await prisma.formation.findUnique({
      where: { slug },
      include: {
        centre: {
          select: {
            id: true, nom: true, ville: true, adresse: true, codePostal: true,
            telephone: true, email: true, slug: true,
          },
        },
        categorie: { select: { nom: true } },
        sessions: {
          where: {
            status: "ACTIVE",
            dateDebut: { gte: new Date() },
          },
          include: {
            formation: {
              select: {
                centre: { select: { nom: true, ville: true } },
              },
            },
          },
          orderBy: { dateDebut: "asc" },
          take: 20,
        },
      },
    });

    if (!formation) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

    return NextResponse.json({
      ...formation,
      sessions: formation.sessions.map((s) => ({
        id: s.id,
        dateDebut: s.dateDebut,
        dateFin: s.dateFin,
        placesRestantes: s.placesRestantes,
        placesTotal: s.placesTotal,
        prix: formation.prix,
        ville: s.formation.centre.ville,
        centre: s.formation.centre.nom,
      })),
    });
  } catch (err) {
    console.error("[GET /api/formations/slug/:slug]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
