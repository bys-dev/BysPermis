import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";

// GET /api/invoices — list invoices for current user (or all if admin)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type");

    const isAdmin = user.role === "ADMIN" || user.role === "OWNER";

    const where: Record<string, unknown> = {};

    if (!isAdmin) {
      where.userId = user.id;
    }

    if (typeFilter) {
      where.type = typeFilter;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        reservation: {
          select: {
            numero: true,
            session: {
              select: {
                formation: {
                  select: { titre: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = invoices.map((inv) => ({
      id: inv.id,
      numero: inv.numero,
      type: inv.type,
      montantHT: inv.montantHT,
      tva: inv.tva,
      montantTTC: inv.montantTTC,
      status: inv.status,
      createdAt: inv.createdAt,
      reservationNumero: inv.reservation?.numero ?? null,
      formationTitre: inv.reservation?.session?.formation?.titre ?? null,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}
