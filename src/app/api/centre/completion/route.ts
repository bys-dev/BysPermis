import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff } from "@/lib/auth0";
import { calculateCentreCompletion } from "@/lib/centre-completion";

// GET /api/centre/completion — Get profile completion data for the current centre
export async function GET() {
  try {
    const user = await requireCentreStaff();

    const centre = await prisma.centre.findUnique({
      where: { userId: user.id },
      include: {
        formations: {
          where: { isActive: true },
          select: {
            id: true,
            sessions: {
              where: { status: "ACTIVE" },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!centre) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }

    // Count formations that have at least 1 active session
    const activeFormationsWithSessions = centre.formations.filter(
      (f) => f.sessions.length > 0
    ).length;

    const result = calculateCentreCompletion({
      ...centre,
      _activeFormationsWithSessions: activeFormationsWithSessions,
    });

    return NextResponse.json({
      ...result,
      profilCompletionPct: centre.profilCompletionPct,
      hasFormations: centre.formations.length > 0,
      hasFormationsWithSessions: activeFormationsWithSessions > 0,
    });
  } catch {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
}
