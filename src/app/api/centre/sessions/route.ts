import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff, requireCentreManagement } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { z } from "zod";

// GET /api/centre/sessions — all sessions for this centre
export async function GET() {
  try {
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const sessions = await prisma.session.findMany({
      where: { formation: { centreId } },
      include: {
        formation: {
          select: { id: true, titre: true, prix: true, centre: { select: { ville: true } } },
        },
        _count: { select: { reservations: true } },
      },
      orderBy: { dateDebut: "desc" },
    });

    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        formationId: s.formation.id,
        formation: s.formation.titre,
        prix: s.formation.prix,
        dateDebut: s.dateDebut,
        dateFin: s.dateFin,
        ville: s.formation.centre.ville,
        placesTotal: s.placesTotal,
        placesRestantes: s.placesRestantes,
        status: s.status,
        reservationsCount: s._count.reservations,
      }))
    );
  } catch (err) {
    console.error("[GET /api/centre/sessions]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/centre/sessions — create a new session
const createSchema = z.object({
  formationId: z.string().min(1, "Formation requise"),
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().min(1, "Date de fin requise"),
  placesTotal: z.number().int().min(1, "Minimum 1 place"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const body = await req.json();
    const data = createSchema.parse(body);

    // Verify the formation belongs to this centre
    const formation = await prisma.formation.findFirst({
      where: { id: data.formationId, centreId },
    });
    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable ou non autorisée" }, { status: 404 });
    }

    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);

    if (dateFin <= dateDebut) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
    }

    const session = await prisma.session.create({
      data: {
        formationId: data.formationId,
        dateDebut,
        dateFin,
        placesTotal: data.placesTotal,
        placesRestantes: data.placesTotal,
        status: "ACTIVE",
      },
      include: {
        formation: {
          select: { id: true, titre: true, prix: true, centre: { select: { ville: true } } },
        },
        _count: { select: { reservations: true } },
      },
    });

    return NextResponse.json(
      {
        id: session.id,
        formationId: session.formation.id,
        formation: session.formation.titre,
        prix: session.formation.prix,
        dateDebut: session.dateDebut,
        dateFin: session.dateFin,
        ville: session.formation.centre.ville,
        placesTotal: session.placesTotal,
        placesRestantes: session.placesRestantes,
        status: session.status,
        reservationsCount: session._count.reservations,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    }
    console.error("[POST /api/centre/sessions]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/centre/sessions — update a session (status, dates, places)
const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "ANNULEE", "COMPLETE", "PASSEE"]).optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  placesTotal: z.number().int().min(1).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const body = await req.json();
    const data = patchSchema.parse(body);

    // Verify session belongs to this centre
    const session = await prisma.session.findFirst({
      where: { id: data.id, formation: { centreId } },
    });
    if (!session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.dateDebut) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) updateData.dateFin = new Date(data.dateFin);
    if (data.placesTotal !== undefined) {
      const currentOccupied = session.placesTotal - session.placesRestantes;
      if (data.placesTotal < currentOccupied) {
        return NextResponse.json(
          { error: `Impossible : ${currentOccupied} places déjà réservées` },
          { status: 400 }
        );
      }
      updateData.placesTotal = data.placesTotal;
      updateData.placesRestantes = data.placesTotal - currentOccupied;
    }

    const updated = await prisma.session.update({
      where: { id: data.id },
      data: updateData,
      include: {
        formation: {
          select: { id: true, titre: true, prix: true, centre: { select: { ville: true } } },
        },
        _count: { select: { reservations: true } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      formationId: updated.formation.id,
      formation: updated.formation.titre,
      prix: updated.formation.prix,
      dateDebut: updated.dateDebut,
      dateFin: updated.dateFin,
      ville: updated.formation.centre.ville,
      placesTotal: updated.placesTotal,
      placesRestantes: updated.placesRestantes,
      status: updated.status,
      reservationsCount: updated._count.reservations,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    }
    console.error("[PATCH /api/centre/sessions]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/centre/sessions — soft-delete (cancel) a session
const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const body = await req.json();
    const { id } = deleteSchema.parse(body);

    // Verify session belongs to this centre
    const session = await prisma.session.findFirst({
      where: { id, formation: { centreId } },
    });
    if (!session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    if (session.status === "ANNULEE") {
      return NextResponse.json({ error: "Session déjà annulée" }, { status: 400 });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: { status: "ANNULEE" },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    }
    console.error("[DELETE /api/centre/sessions]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
