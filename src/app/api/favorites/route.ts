import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";

// ─── GET /api/favorites — Liste des favoris de l'utilisateur ────
export async function GET() {
  try {
    const user = await requireAuth();

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        formation: {
          include: {
            centre: {
              select: {
                id: true,
                nom: true,
                slug: true,
                ville: true,
              },
            },
            sessions: {
              where: {
                status: "ACTIVE",
                dateDebut: { gte: new Date() },
              },
              orderBy: { dateDebut: "asc" },
              take: 1,
              select: {
                id: true,
                dateDebut: true,
                placesRestantes: true,
                formation: { select: { prix: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(favorites);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/favorites — Ajouter un favori ───────────────────
const addFavoriteSchema = z.object({
  formationId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = addFavoriteSchema.parse(body);

    // Check formation exists
    const formation = await prisma.formation.findUnique({
      where: { id: data.formationId },
    });
    if (!formation) {
      return NextResponse.json(
        { error: "Formation introuvable" },
        { status: 404 }
      );
    }

    // Upsert to handle duplicates
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_formationId: {
          userId: user.id,
          formationId: data.formationId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        formationId: data.formationId,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE /api/favorites — Retirer un favori ──────────────────
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = req.nextUrl;
    const formationId = searchParams.get("formationId");

    if (!formationId) {
      return NextResponse.json(
        { error: "formationId requis" },
        { status: 400 }
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        formationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
