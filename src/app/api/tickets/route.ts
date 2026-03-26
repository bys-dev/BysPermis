import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";

// GET /api/tickets — mes tickets
export async function GET() {
  try {
    const user = await requireAuth();
    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { prenom: true, nom: true, role: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(tickets);
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// POST /api/tickets — créer un ticket
const createSchema = z.object({
  sujet: z.string().min(5).max(200),
  message: z.string().min(10),
  categorie: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = createSchema.parse(body);

    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        sujet: data.sujet,
        categorie: data.categorie,
        messages: {
          create: {
            userId: user.id,
            contenu: data.message,
            isAdmin: false,
          },
        },
      },
      include: { messages: true },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error("[POST /api/tickets]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
