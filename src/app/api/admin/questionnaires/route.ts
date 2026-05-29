import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth0"
import { DEFAULT_PLATFORM_QUESTIONS } from "@/lib/questionnaires"

/** GET /api/admin/questionnaires — avis plateforme (logiciel BYS Permis) */
export async function GET() {
  try {
    await requireAdmin()

    const [responses, stats] = await Promise.all([
      prisma.questionnaireResponse.findMany({
        where: { type: "PLATFORM" },
        include: {
          user: { select: { prenom: true, nom: true, email: true } },
          reservation: {
            include: {
              session: {
                include: {
                  formation: {
                    select: {
                      titre: true,
                      centre: { select: { nom: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.questionnaireResponse.aggregate({
        where: { type: "PLATFORM" },
        _avg: { noteGlobale: true },
        _count: true,
      }),
    ])

    return NextResponse.json({
      defaultQuestions: DEFAULT_PLATFORM_QUESTIONS,
      responses: responses.map((r) => ({
        id: r.id,
        noteGlobale: r.noteGlobale,
        reponses: r.reponses,
        commentaire: r.commentaire,
        createdAt: r.createdAt.toISOString(),
        auteur: `${r.user.prenom} ${r.user.nom}`,
        email: r.user.email,
        formation: r.reservation.session.formation.titre,
        centre: r.reservation.session.formation.centre.nom,
      })),
      averageRating: stats._avg.noteGlobale
        ? Math.round(stats._avg.noteGlobale * 10) / 10
        : null,
      totalCount: stats._count,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur"
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: message === "Non authentifié" ? 401 : 403 })
    }
    console.error("[GET /api/admin/questionnaires]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
