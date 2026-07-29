import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";

/**
 * GET /api/admin/prospects/imports
 *
 * Historique des imports + valeurs de filtres disponibles (départements,
 * sources, commerciaux). L'écran prospects a besoin des deux au montage : on
 * les sert ensemble pour éviter une cascade de requêtes.
 */
export async function GET() {
  try {
    await requireCommercial();

    const [imports, departements, sources, commerciaux] = await Promise.all([
      prisma.prospectImport.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          filename: true,
          format: true,
          source: true,
          totalRows: true,
          nbCrees: true,
          nbMisAJour: true,
          nbIgnores: true,
          nbErreurs: true,
          createdAt: true,
          importedBy: { select: { prenom: true, nom: true } },
          _count: { select: { prospects: true } },
        },
      }),
      prisma.prospect.groupBy({
        by: ["departement"],
        _count: { _all: true },
        where: { departement: { not: null } },
        orderBy: { departement: "asc" },
      }),
      prisma.prospect.groupBy({
        by: ["source"],
        _count: { _all: true },
        where: { source: { not: null } },
        orderBy: { source: "asc" },
      }),
      prisma.user.findMany({
        where: { role: { in: ["COMMERCIAL", "ADMIN", "OWNER"] } },
        select: { id: true, prenom: true, nom: true, email: true },
        orderBy: { nom: "asc" },
      }),
    ]);

    return NextResponse.json({
      imports,
      facettes: {
        departements: departements.map((d) => ({ valeur: d.departement as string, nb: d._count._all })),
        sources: sources.map((s) => ({ valeur: s.source as string, nb: s._count._all })),
        commerciaux,
      },
    });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[GET /api/admin/prospects/imports]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
