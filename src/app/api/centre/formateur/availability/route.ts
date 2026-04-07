import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCentreStaff } from "@/lib/auth0";

// ─── GET /api/centre/formateur/availability — List availabilities ────
export async function GET(req: NextRequest) {
  try {
    const user = await requireCentreStaff();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = { userId: user.id };

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.date = dateFilter;
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(availabilities);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/centre/formateur/availability — Create availability ────
const createSchema = z.object({
  date: z.string(), // ISO date string
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // "09:00"
  endTime: z.string().regex(/^\d{2}:\d{2}$/), // "17:00"
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreStaff();
    const body = await req.json();
    const data = createSchema.parse(body);

    // Validate that endTime > startTime
    if (data.startTime >= data.endTime) {
      return NextResponse.json(
        { error: "L'heure de fin doit etre apres l'heure de debut." },
        { status: 400 }
      );
    }

    const availability = await prisma.availability.create({
      data: {
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        note: data.note ?? null,
        userId: user.id,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE /api/centre/formateur/availability — Remove availability ────
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireCentreStaff();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.availability.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Disponibilite introuvable" }, { status: 404 });
    }

    await prisma.availability.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
