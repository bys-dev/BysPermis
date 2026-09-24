import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapAuthError, requireAdmin } from "@/lib/auth0";
import type { PartnerLeadStatus, Prisma } from "@/generated/prisma/client";

const STATUTS: PartnerLeadStatus[] = ["NOUVEAU", "EN_COURS", "COMPTE_CREE", "REFUSE", "ARCHIVE"];

// GET /api/admin/partenaires — demandes de partenariat (owner / admin)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const statut = req.nextUrl.searchParams.get("statut");
    const search = req.nextUrl.searchParams.get("search")?.trim();

    const where: Prisma.PartnerLeadWhereInput = {
      ...(statut && STATUTS.includes(statut as PartnerLeadStatus)
        ? { statut: statut as PartnerLeadStatus }
        : {}),
      ...(search
        ? {
            OR: [
              { centreNom: { contains: search, mode: "insensitive" } },
              { ville: { contains: search, mode: "insensitive" } },
              { contactEmail: { contains: search, mode: "insensitive" } },
              { agrementNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [leads, grouped] = await Promise.all([
      prisma.partnerLead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          traitePar: { select: { prenom: true, nom: true, email: true } },
          centre: { select: { id: true, nom: true, slug: true, statut: true } },
        },
      }),
      prisma.partnerLead.groupBy({ by: ["statut"], _count: { _all: true } }),
    ]);

    const counts = Object.fromEntries(STATUTS.map((s) => [s, 0])) as Record<PartnerLeadStatus, number>;
    for (const g of grouped) counts[g.statut] = g._count._all;

    return NextResponse.json({ leads, counts });
  } catch (err) {
    const authResponse = mapAuthError(err);
    if (authResponse) return authResponse;
    console.error("[GET /api/admin/partenaires]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
