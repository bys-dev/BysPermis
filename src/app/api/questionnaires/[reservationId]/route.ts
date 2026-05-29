import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth0"
import { getQuestionsForContext } from "@/lib/questionnaires"
import type { QuestionnaireType } from "@/generated/prisma/client"

/** GET /api/questionnaires/[reservationId] — questions + statut pour une réservation */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> },
) {
  try {
    const user = await requireAuth()
    const { reservationId } = await params

    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, userId: user.id, status: "TERMINEE" },
      include: {
        session: {
          include: {
            formation: {
              select: {
                id: true,
                titre: true,
                centre: { select: { id: true, nom: true, ville: true } },
              },
            },
          },
        },
        questionnaireResponses: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable ou non terminée." }, { status: 404 })
    }

    const centreId = reservation.session.formation.centre.id
    const completed = {
      CENTRE: reservation.questionnaireResponses.some((r) => r.type === "CENTRE"),
      PLATFORM: reservation.questionnaireResponses.some((r) => r.type === "PLATFORM"),
    }

    const [centreQuestions, platformQuestions] = await Promise.all([
      getQuestionsForContext("CENTRE", centreId),
      getQuestionsForContext("PLATFORM", null),
    ])

    return NextResponse.json({
      reservationId: reservation.id,
      formationTitre: reservation.session.formation.titre,
      centre: reservation.session.formation.centre,
      completed,
      questions: {
        CENTRE: centreQuestions,
        PLATFORM: platformQuestions,
      } satisfies Record<QuestionnaireType, Awaited<ReturnType<typeof getQuestionsForContext>>>,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur"
    if (message === "Non authentifié") {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
