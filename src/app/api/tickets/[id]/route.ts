import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, requireAdmin } from "@/lib/auth0";

// POST /api/tickets/:id — ajouter un message
const replySchema = z.object({ contenu: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await req.json();
    const { contenu } = replySchema.parse(body);

    // Vérifier que le ticket appartient à l'utilisateur (ou admin)
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    if (ticket.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId: user.id,
        contenu,
        isAdmin: user.role === "ADMIN",
      },
    });

    // Mettre à jour le statut si admin répond
    if (user.role === "ADMIN") {
      await prisma.ticket.update({
        where: { id },
        data: { status: "EN_COURS" as const },
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/tickets/:id — admin: changer le statut
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const { status } = await req.json();
    if (!["OUVERT", "EN_COURS", "RESOLU", "FERME"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status: status as "OUVERT" | "EN_COURS" | "RESOLU" | "FERME" },
    });
    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
