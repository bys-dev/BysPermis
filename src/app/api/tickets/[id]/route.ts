import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, requireSupport, PLATFORM_ROLES } from "@/lib/auth0";

const STAFF_ROLES: readonly string[] = PLATFORM_ROLES;

// POST /api/tickets/:id — ajouter un message
const replySchema = z.object({ contenu: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await req.json();
    const { contenu } = replySchema.parse(body);

    const isStaff = STAFF_ROLES.includes(user.role);

    // Vérifier que le ticket appartient à l'utilisateur (ou staff plateforme)
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    if (ticket.userId !== user.id && !isStaff) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId: user.id,
        contenu,
        isAdmin: isStaff,
      },
    });

    // Mettre à jour le statut si staff répond et ticket est OUVERT
    if (isStaff && ticket.status === "OUVERT") {
      await prisma.ticket.update({
        where: { id },
        data: { status: "EN_COURS" as const },
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié") return NextResponse.json({ error: message }, { status: 401 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/tickets/:id — staff: changer le statut
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireSupport();
    const { status } = await req.json();
    if (!["OUVERT", "EN_COURS", "RESOLU", "FERME"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status: status as "OUVERT" | "EN_COURS" | "RESOLU" | "FERME" },
    });
    return NextResponse.json(ticket);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
