import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCentreStaff } from "@/lib/auth0"
import { getUserCentreId } from "@/lib/centre-utils"
import { ensureCentreDefaultQuestions } from "@/lib/questionnaires"
import { z } from "zod"

/** GET /api/centre/questionnaires — avis centre + questions configurées */
export async function GET() {
  try {
    const user = await requireCentreStaff()
    const centreId = await getUserCentreId(user.id, user.role)
    if (!centreId) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 })
    }

    await ensureCentreDefaultQuestions(centreId)

    const [questions, responses, stats] = await Promise.all([
      prisma.questionnaireQuestion.findMany({
        where: { centreId, type: "CENTRE", actif: true },
        orderBy: { ordre: "asc" },
      }),
      prisma.questionnaireResponse.findMany({
        where: { centreId, type: "CENTRE" },
        include: {
          user: { select: { prenom: true, nom: true } },
          formation: { select: { titre: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.questionnaireResponse.aggregate({
        where: { centreId, type: "CENTRE" },
        _avg: { noteGlobale: true },
        _count: true,
      }),
    ])

    return NextResponse.json({
      questions,
      responses: responses.map((r) => ({
        id: r.id,
        noteGlobale: r.noteGlobale,
        reponses: r.reponses,
        commentaire: r.commentaire,
        createdAt: r.createdAt.toISOString(),
        auteur: `${r.user.prenom} ${r.user.nom}`,
        formation: r.formation?.titre ?? null,
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
    console.error("[GET /api/centre/questionnaires]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

const updateQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().optional(),
        libelle: z.string().min(5).max(300),
      }),
    )
    .length(5),
})

/** PUT /api/centre/questionnaires — personnaliser les 5 questions centre */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireCentreStaff()
    const centreId = await getUserCentreId(user.id, user.role)
    if (!centreId) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 })
    }

    const { questions } = updateQuestionsSchema.parse(await req.json())

    await prisma.$transaction(async (tx) => {
      await tx.questionnaireQuestion.deleteMany({
        where: { centreId, type: "CENTRE" },
      })
      await tx.questionnaireQuestion.createMany({
        data: questions.map((q, ordre) => ({
          centreId,
          type: "CENTRE" as const,
          libelle: q.libelle.trim(),
          ordre,
        })),
      })
    })

    const updated = await prisma.questionnaireQuestion.findMany({
      where: { centreId, type: "CENTRE" },
      orderBy: { ordre: "asc" },
    })

    return NextResponse.json({ questions: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "5 questions requises (5 à 300 caractères)." }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : "Erreur serveur"
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: message === "Non authentifié" ? 401 : 403 })
    }
    console.error("[PUT /api/centre/questionnaires]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
