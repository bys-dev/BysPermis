import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth0"

/** GET /api/questionnaires/pending — questionnaires à remplir après formation terminée */
export async function GET() {
  try {
    const user = await requireAuth()

    const reservations = await prisma.reservation.findMany({
      where: { userId: user.id, status: "TERMINEE" },
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
        questionnaireResponses: { select: { type: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    const pending = reservations
      .map((r) => {
        const done = new Set(r.questionnaireResponses.map((q) => q.type))
        const needsCentre = !done.has("CENTRE")
        const needsPlatform = !done.has("PLATFORM")
        if (!needsCentre && !needsPlatform) return null
        return {
          reservationId: r.id,
          formationTitre: r.session.formation.titre,
          centre: r.session.formation.centre,
          needsCentre,
          needsPlatform,
        }
      })
      .filter(Boolean)

    return NextResponse.json(pending)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur"
    if (message === "Non authentifié") {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
