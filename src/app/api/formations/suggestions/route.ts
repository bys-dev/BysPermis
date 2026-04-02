import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET /api/formations/suggestions?q=... ───────────────
// Lightweight endpoint for auto-suggestions
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ formations: [], villes: [] });
    }

    // Top 5 matching formation titles
    const formations = await prisma.formation.findMany({
      where: {
        isActive: true,
        centre: { statut: "ACTIF" },
        OR: [
          { titre: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, titre: true, slug: true, prix: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    // Top 3 matching ville names (from centres)
    const centres = await prisma.centre.findMany({
      where: {
        statut: "ACTIF",
        ville: { contains: q, mode: "insensitive" },
      },
      select: { ville: true },
      take: 10,
    });

    // Deduplicate villes
    const villeSet = new Set<string>();
    const villes: string[] = [];
    for (const c of centres) {
      const v = c.ville.trim();
      const key = v.toLowerCase();
      if (!villeSet.has(key)) {
        villeSet.add(key);
        villes.push(v);
        if (villes.length >= 3) break;
      }
    }

    return NextResponse.json({ formations, villes });
  } catch (err) {
    console.error("[GET /api/formations/suggestions]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
