import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreOwner } from "@/lib/auth0";

// ─── GET /api/centre/payments — historique des paiements du centre ────
export async function GET(req: NextRequest) {
  try {
    const user = await requireCentreOwner();

    const centre = await prisma.centre.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!centre) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // COMMISSION | ABONNEMENT | REMBOURSEMENT
    const status = searchParams.get("status"); // EN_ATTENTE | PAYE | ECHOUE
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    const where: Record<string, unknown> = { centreId: centre.id };
    if (type) where.type = type;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.centrePayment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          montant: true,
          description: true,
          stripeId: true,
          status: true,
          periode: true,
          createdAt: true,
        },
      }),
      prisma.centrePayment.count({ where }),
    ]);

    // Totaux par statut
    const totaux = await prisma.centrePayment.groupBy({
      by: ["status"],
      where: { centreId: centre.id },
      _sum: { montant: true },
      _count: true,
    });

    const totalPaye = totaux.find((t) => t.status === "PAYE")?._sum.montant ?? 0;
    const totalEnAttente = totaux.find((t) => t.status === "EN_ATTENTE")?._sum.montant ?? 0;

    return NextResponse.json({
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totaux: {
        paye: totalPaye,
        enAttente: totalEnAttente,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "Non autorisé") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    console.error("[GET /api/centre/payments]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
