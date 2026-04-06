import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff } from "@/lib/auth0";
import { z } from "zod";

const switchSchema = z.object({
  centreId: z.string().min(1, "centreId requis"),
});

// POST /api/centre/switch — Switch the user's active centre
export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreStaff();
    const body = await req.json();
    const { centreId } = switchSchema.parse(body);

    // Verify user has access to this centre
    let hasAccess = false;

    if (user.role === "CENTRE_OWNER") {
      const centre = await prisma.centre.findFirst({
        where: { id: centreId, userId: user.id },
      });
      if (centre) hasAccess = true;
    }

    if (!hasAccess) {
      const membre = await prisma.centreMembre.findFirst({
        where: { userId: user.id, centreId },
      });
      if (membre) hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à ce centre" },
        { status: 403 }
      );
    }

    // Update user's activeCentreId
    await prisma.user.update({
      where: { id: user.id },
      data: { activeCentreId: centreId },
    });

    // Fetch the centre info to return
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      select: { id: true, nom: true, ville: true, statut: true, profilCompletionPct: true },
    });

    return NextResponse.json({
      success: true,
      centre,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    }
    console.error("[POST /api/centre/switch]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
