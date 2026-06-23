import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth0"
import { averageRating, getQuestionsForContext, roundedStarNote } from "@/lib/questionnaires"
import { notifyCentreQuestionnaireSubmitted } from "@/lib/event-notifications"
import { z } from "zod"
import type { Prisma } from "@/generated/prisma/client"

const answerSchema = z.object({
  questionId: z.string().min(1),
  libelle: z.string().min(1).max(500),
  note: z.number().min(1).max(5).refine((n) => Math.round(n * 2) === n * 2, {
    message: "La note doit être par pas de 0,5",
  }),
})

const submitSchema = z.object({
  type: z.enum(["CENTRE", "PLATFORM"]),
  reservationId: z.string().min(1),
  answers: z.array(answerSchema).min(1).max(10),
  commentaire: z.string().max(1000).optional(),
})

/** POST /api/questionnaires/submit — enregistrer un questionnaire (centre ou plateforme) */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = submitSchema.parse(await req.json())

    const reservation = await prisma.reservation.findFirst({
      where: { id: body.reservationId, userId: user.id, status: "TERMINEE" },
      include: {
        session: {
          include: {
            formation: { select: { id: true, centreId: true, titre: true } },
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: "Vous devez avoir terminé cette formation pour répondre au questionnaire." },
        { status: 403 },
      )
    }

    const existing = await prisma.questionnaireResponse.findUnique({
      where: {
        userId_reservationId_type: {
          userId: user.id,
          reservationId: body.reservationId,
          type: body.type,
        },
      },
    })
    if (existing) {
      return NextResponse.json({ error: "Questionnaire déjà complété." }, { status: 409 })
    }

    const centreId = reservation.session.formation.centreId
    const expectedQuestions = await getQuestionsForContext(body.type, body.type === "CENTRE" ? centreId : null)
    const expectedIds = new Set(expectedQuestions.map((q) => q.id))
    for (const answer of body.answers) {
      if (!expectedIds.has(answer.questionId)) {
        return NextResponse.json({ error: "Question invalide." }, { status: 400 })
      }
    }

    const noteGlobale = averageRating(body.answers)
    const formationId = reservation.session.formation.id

    const response = await prisma.$transaction(async (tx) => {
      const created = await tx.questionnaireResponse.create({
        data: {
          type: body.type,
          userId: user.id,
          reservationId: body.reservationId,
          centreId: body.type === "CENTRE" ? centreId : null,
          formationId: body.type === "CENTRE" ? formationId : null,
          noteGlobale,
          reponses: body.answers as unknown as Prisma.InputJsonValue,
          commentaire: body.commentaire,
        },
      })

      if (body.type === "CENTRE") {
        await tx.review.upsert({
          where: {
            userId_formationId: { userId: user.id, formationId },
          },
          create: {
            userId: user.id,
            formationId,
            reservationId: body.reservationId,
            note: roundedStarNote(noteGlobale),
            notePrecise: noteGlobale,
            commentaire: body.commentaire,
          },
          update: {
            note: roundedStarNote(noteGlobale),
            notePrecise: noteGlobale,
            commentaire: body.commentaire,
            reservationId: body.reservationId,
          },
        })
      }

      return created
    })

    if (body.type === "CENTRE") {
      notifyCentreQuestionnaireSubmitted({
        centreId,
        eleveName: [user.prenom, user.nom].filter(Boolean).join(" ") || user.email,
        formationTitle: reservation.session.formation.titre,
        noteGlobale,
      }).catch((err) => console.error("[questionnaires/submit] notify centre:", err))
    }

    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: err.issues }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : "Erreur serveur"
    if (message === "Non authentifié") {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    console.error("[POST /api/questionnaires/submit]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
