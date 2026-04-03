import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireComptable } from "@/lib/auth0";
import { z } from "zod";

// ─── GET /api/admin/payments — tous les paiements centres (admin) ────
export async function GET(req: NextRequest) {
  try {
    await requireComptable();

    const { searchParams } = new URL(req.url);
    const centreId = searchParams.get("centreId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    const where: Record<string, unknown> = {};
    if (centreId) where.centreId = centreId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.centrePayment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          centre: {
            select: { id: true, nom: true, ville: true },
          },
        },
      }),
      prisma.centrePayment.count({ where }),
    ]);

    // Totaux globaux
    const totaux = await prisma.centrePayment.groupBy({
      by: ["status"],
      where,
      _sum: { montant: true },
      _count: true,
    });

    const totalPaye = totaux.find((t) => t.status === "PAYE")?._sum.montant ?? 0;
    const totalEnAttente = totaux.find((t) => t.status === "EN_ATTENTE")?._sum.montant ?? 0;
    const totalEchoue = totaux.find((t) => t.status === "ECHOUE")?._sum.montant ?? 0;

    // Totaux par centre
    const parCentre = await prisma.centrePayment.groupBy({
      by: ["centreId"],
      where: { ...where, status: "EN_ATTENTE" },
      _sum: { montant: true },
      _count: true,
    });

    // Récupérer les noms des centres
    const centreIds = parCentre.map((c) => c.centreId);
    const centres = centreIds.length > 0
      ? await prisma.centre.findMany({
          where: { id: { in: centreIds } },
          select: { id: true, nom: true, ville: true },
        })
      : [];

    const centreMap = new Map(centres.map((c) => [c.id, c]));
    const enAttenteparCentre = parCentre.map((c) => ({
      centreId: c.centreId,
      nom: centreMap.get(c.centreId)?.nom ?? "Inconnu",
      ville: centreMap.get(c.centreId)?.ville ?? "",
      montantEnAttente: c._sum.montant ?? 0,
      count: c._count,
    }));

    return NextResponse.json({
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totaux: {
        paye: totalPaye,
        enAttente: totalEnAttente,
        echoue: totalEchoue,
      },
      enAttenteparCentre,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "Non authentifié" || err.message === "Non autorisé")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "Non authentifié" ? 401 : 403 });
    }
    console.error("[GET /api/admin/payments]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/admin/payments — créer un paiement manuel ────
const createSchema = z.object({
  centreId: z.string().min(1),
  type: z.enum(["COMMISSION", "ABONNEMENT", "REMBOURSEMENT"]),
  montant: z.number().positive(),
  description: z.string().min(1),
  status: z.enum(["EN_ATTENTE", "PAYE", "ECHOUE"]).optional().default("PAYE"),
});

export async function POST(req: NextRequest) {
  try {
    await requireComptable();

    const body = await req.json();
    const data = createSchema.parse(body);

    // Vérifier que le centre existe
    const centre = await prisma.centre.findUnique({
      where: { id: data.centreId },
      select: { id: true },
    });
    if (!centre) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }

    const payment = await prisma.centrePayment.create({
      data: {
        centreId: data.centreId,
        type: data.type,
        montant: data.montant,
        description: data.description,
        status: data.status,
        periode: new Date().toISOString().slice(0, 7),
      },
      include: {
        centre: { select: { id: true, nom: true, ville: true } },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof Error && (err.message === "Non authentifié" || err.message === "Non autorisé")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "Non authentifié" ? 401 : 403 });
    }
    console.error("[POST /api/admin/payments]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/payments — marquer un paiement comme payé ────
const patchSchema = z.object({
  paymentId: z.string().min(1),
  status: z.enum(["EN_ATTENTE", "PAYE", "ECHOUE"]),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireComptable();

    const body = await req.json();
    const data = patchSchema.parse(body);

    const payment = await prisma.centrePayment.update({
      where: { id: data.paymentId },
      data: { status: data.status },
      include: {
        centre: { select: { id: true, nom: true, ville: true } },
      },
    });

    return NextResponse.json(payment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof Error && (err.message === "Non authentifié" || err.message === "Non autorisé")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "Non authentifié" ? 401 : 403 });
    }
    console.error("[PATCH /api/admin/payments]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
