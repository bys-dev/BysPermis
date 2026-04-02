import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";

// GET /api/admin/tickets — tous les tickets (admin seulement)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(status && status !== "tous" ? { status: status as "OUVERT" | "EN_COURS" | "RESOLU" | "FERME" } : {}),
        ...(search ? {
          OR: [
            { sujet: { contains: search, mode: "insensitive" } },
            { user: { nom: { contains: search, mode: "insensitive" } } },
            { user: { prenom: { contains: search, mode: "insensitive" } } },
          ],
        } : {}),
      },
      include: {
        user: { select: { prenom: true, nom: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { prenom: true, nom: true, role: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(tickets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
