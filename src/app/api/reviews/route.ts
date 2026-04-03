import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";

// GET /api/reviews — avis de l'utilisateur connecté
export async function GET() {
  try {
    const user = await requireAuth();
    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: {
        formation: { select: { id: true, titre: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// POST /api/reviews — créer un avis
const createSchema = z.object({
  formationId: z.string().min(1),
  note: z.number().int().min(1).max(5),
  commentaire: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = createSchema.parse(body);

    // Vérifier que l'utilisateur a une réservation TERMINEE pour cette formation
    const reservation = await prisma.reservation.findFirst({
      where: {
        userId: user.id,
        status: "TERMINEE",
        session: { formationId: data.formationId },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Vous devez avoir terminé cette formation pour laisser un avis." },
        { status: 403 }
      );
    }

    // Vérifier qu'il n'y a pas déjà un avis (contrainte unique)
    const existing = await prisma.review.findUnique({
      where: {
        userId_formationId: {
          userId: user.id,
          formationId: data.formationId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un avis pour cette formation." },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        formationId: data.formationId,
        note: data.note,
        commentaire: data.commentaire,
      },
      include: {
        formation: { select: { id: true, titre: true, slug: true } },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[POST /api/reviews]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
