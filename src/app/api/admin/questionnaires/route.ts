import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth0"
import { DEFAULT_PLATFORM_QUESTIONS, ensurePlatformDefaultQuestions } from "@/lib/questionnaires"
import { z } from "zod"

/** GET /api/admin/questionnaires — avis plateforme (logiciel BYS Permis) */
export async function GET() {
  try {
    await requireAdmin()

    await ensurePlatformDefaultQuestions()

    const [questions, responses, stats] = await Promise.all([
      prisma.questionnaireQuestion.findMany({
        where: { type: "PLATFORM", centreId: null },
        orderBy: { ordre: "asc" },
      }),
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
      questions: questions.map((q) => ({ id: q.id, libelle: q.libelle, ordre: q.ordre, actif: q.actif })),
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

const updateQuestionsSchema = z.object({
  questions: z
    .array(z.object({ libelle: z.string().min(5).max(300) }))
    .min(1)
    .max(10),
})

/** PUT /api/admin/questionnaires — éditer les questions du questionnaire plateforme */
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()
    const { questions } = updateQuestionsSchema.parse(await req.json())

    await prisma.$transaction(async (tx) => {
      await tx.questionnaireQuestion.deleteMany({ where: { type: "PLATFORM", centreId: null } })
      await tx.questionnaireQuestion.createMany({
        data: questions.map((q, ordre) => ({
          type: "PLATFORM" as const,
          centreId: null,
          libelle: q.libelle.trim(),
          ordre,
        })),
      })
    })

    const updated = await prisma.questionnaireQuestion.findMany({
      where: { type: "PLATFORM", centreId: null },
      orderBy: { ordre: "asc" },
    })

    return NextResponse.json({ questions: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "1 à 10 questions, chacune de 5 à 300 caractères." }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : "Erreur serveur"
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: message === "Non authentifié" ? 401 : 403 })
    }
    console.error("[PUT /api/admin/questionnaires]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
