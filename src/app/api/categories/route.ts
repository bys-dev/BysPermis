import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET /api/categories ─────────────────────────────────
export async function GET() {
  try {
    const categories = await prisma.categorie.findMany({
      orderBy: { ordre: "asc" },
      select: { id: true, nom: true, icon: true, couleur: true },
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error("[GET /api/categories]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
