import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupport } from "@/lib/auth0";

// GET /api/admin/moderation — Centres en attente + formations sans sessions
export async function GET() {
  try {
    await requireSupport();

    const [centresEnAttente, formationsSansSession] = await Promise.all([
      prisma.centre.findMany({
        where: { statut: "EN_ATTENTE" },
        select: {
          id: true,
          nom: true,
          ville: true,
          email: true,
          telephone: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.formation.findMany({
        where: {
          isActive: true,
          sessions: { none: {} },
        },
        select: {
          id: true,
          titre: true,
          createdAt: true,
          centre: {
            select: { id: true, nom: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return NextResponse.json({
      centresEnAttente: centresEnAttente.map((c) => ({
        id: c.id,
        nom: c.nom,
        ville: c.ville,
        email: c.email ?? "",
        telephone: c.telephone ?? "",
        createdAt: c.createdAt,
      })),
      formationsSansSession: formationsSansSession.map((f) => ({
        id: f.id,
        titre: f.titre,
        centreNom: f.centre.nom,
        centreId: f.centre.id,
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[GET /api/admin/moderation]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
