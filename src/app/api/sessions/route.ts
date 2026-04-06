import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCentre } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

// GET /api/sessions?formationId=xxx
export async function GET(req: NextRequest) {
  try {
    const formationId = req.nextUrl.searchParams.get("formationId");
    const sessions = await prisma.session.findMany({
      where: {
        ...(formationId ? { formationId } : {}),
        status: "ACTIVE",
        dateDebut: { gte: new Date() },
        placesRestantes: { gt: 0 },
      },
      include: {
        formation: { select: { titre: true, prix: true, centre: { select: { nom: true } } } },
        _count: { select: { reservations: true } },
      },
      orderBy: { dateDebut: "asc" },
    });
    return NextResponse.json(sessions);
  } catch (err) {
    console.error("[GET /api/sessions]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/sessions — créer une session (centre)
const createSchema = z.object({
  formationId: z.string().min(1),
  dateDebut: z.string().datetime(),
  dateFin: z.string().datetime(),
  placesTotal: z.number().int().positive().max(50),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireCentre();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    const centre = await prisma.centre.findUnique({ where: { id: centreId } });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const body = await req.json();
    const data = createSchema.parse(body);

    // Vérifier que la formation appartient au centre
    const formation = await prisma.formation.findFirst({
      where: { id: data.formationId, centreId: centre.id },
    });
    if (!formation) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

    const session = await prisma.session.create({
      data: {
        formationId: data.formationId,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        placesTotal: data.placesTotal,
        placesRestantes: data.placesTotal,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error("[POST /api/sessions]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
