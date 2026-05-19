import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET /api/categories ─────────────────────────────────
export async function GET() {
  try {
    // Scope V1 : on n'expose publiquement que les catégories du périmètre
    // "stage de récupération de points". Les autres catégories historiques
    // (FIMO, Permis B, Moto, Eco-conduite, etc.) restent en DB pour
    // l'extensibilité mais ne sont pas proposées dans les filtres publics.
    const categories = await prisma.categorie.findMany({
      where: {
        OR: [
          { nom: { contains: "récup", mode: "insensitive" } },
          { nom: { contains: "sensib", mode: "insensitive" } },
          { nom: { contains: "48", mode: "insensitive" } },
          { nom: { contains: "probatoire", mode: "insensitive" } },
        ],
      },
      orderBy: { ordre: "asc" },
      select: { id: true, nom: true, icon: true, couleur: true },
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error("[GET /api/categories]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
