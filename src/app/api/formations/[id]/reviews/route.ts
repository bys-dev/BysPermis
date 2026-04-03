import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/formations/:id/reviews — avis publics d'une formation
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reviews = await prisma.review.findMany({
      where: { formationId: id },
      include: {
        user: { select: { prenom: true, nom: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculer la moyenne et le nombre d'avis
    const count = reviews.length;
    const average =
      count > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.note, 0) / count) * 10
          ) / 10
        : 0;

    // Anonymiser partiellement le nom (prénom + première lettre du nom)
    const publicReviews = reviews.map((r) => ({
      id: r.id,
      note: r.note,
      commentaire: r.commentaire,
      createdAt: r.createdAt,
      user: {
        prenom: r.user.prenom,
        nom: r.user.nom ? r.user.nom.charAt(0) + "." : "",
      },
    }));

    return NextResponse.json({
      reviews: publicReviews,
      average,
      count,
    });
  } catch (err) {
    console.error("[GET /api/formations/[id]/reviews]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
