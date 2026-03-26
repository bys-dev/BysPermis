import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";

// GET /api/centres — liste publique des centres actifs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const ville = searchParams.get("ville");
    const statut = searchParams.get("statut");

    const validStatuts = ["ACTIF", "EN_ATTENTE", "SUSPENDU"];
    const statutFilter = statut && validStatuts.includes(statut)
      ? { statut: statut as "ACTIF" | "EN_ATTENTE" | "SUSPENDU" }
      : statut === "all"
        ? {}
        : { statut: "ACTIF" as const, isActive: true };

    const centres = await prisma.centre.findMany({
      where: {
        ...statutFilter,
        ...(ville ? { ville: { contains: ville, mode: "insensitive" } } : {}),
      },
      include: {
        formations: {
          where: { isActive: true },
          select: { id: true, titre: true, prix: true, isQualiopi: true },
          take: 5,
        },
        _count: { select: { formations: true } },
      },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json(centres);
  } catch (err) {
    console.error("[GET /api/centres]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/centres/:id — admin: valider/suspendre un centre
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, statut } = body;

    if (!id || !statut) return NextResponse.json({ error: "id et statut requis" }, { status: 400 });
    if (!["ACTIF", "SUSPENDU", "EN_ATTENTE"].includes(statut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const centre = await prisma.centre.update({
      where: { id },
      data: { statut, isActive: statut === "ACTIF" },
    });

    return NextResponse.json(centre);
  } catch (err) {
    console.error("[PATCH /api/centres]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
