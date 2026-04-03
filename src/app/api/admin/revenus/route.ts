import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireComptable } from "@/lib/auth0";

const MOIS_LABELS = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

// GET /api/admin/revenus — Revenus mensuels + par centre
export async function GET(req: NextRequest) {
  try {
    await requireComptable();

    const { searchParams } = req.nextUrl;
    const months = Math.min(Math.max(Number(searchParams.get("months") ?? 6), 1), 24);

    const now = new Date();

    // Build date ranges for each month
    const monthlyRanges: { start: Date; end: Date; key: string; label: string }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const d = new Date(year, month, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MOIS_LABELS[d.getMonth()]} ${d.getFullYear()}`;
      monthlyRanges.push({ start, end, key, label });
    }

    const globalStart = monthlyRanges[0].start;

    // Fetch all confirmed/completed reservations in period
    const reservations = await prisma.reservation.findMany({
      where: {
        createdAt: { gte: globalStart },
        status: { in: ["CONFIRMEE", "TERMINEE"] },
      },
      select: {
        id: true,
        montant: true,
        commissionMontant: true,
        createdAt: true,
        session: {
          select: {
            formation: {
              select: {
                centreId: true,
                centre: { select: { id: true, nom: true, ville: true } },
              },
            },
          },
        },
      },
    });

    // Get platform commission rate
    const settings = await prisma.platformSettings.findFirst({
      where: { id: "default" },
    });
    const commissionRate = (settings?.commissionRate ?? 10) / 100;

    // Build monthly breakdown
    const monthly = monthlyRanges.map(({ start, end, key, label }) => {
      const monthReservations = reservations.filter(
        (r) => r.createdAt >= start && r.createdAt <= end
      );
      const revenuBrut = monthReservations.reduce((sum, r) => sum + r.montant, 0);
      const commission = monthReservations.reduce(
        (sum, r) => sum + (r.commissionMontant ?? r.montant * commissionRate),
        0
      );
      const revenuCentres = revenuBrut - commission;

      return {
        month: key,
        label,
        reservations: monthReservations.length,
        revenuBrut: Math.round(revenuBrut * 100) / 100,
        commission: Math.round(commission * 100) / 100,
        revenuCentres: Math.round(revenuCentres * 100) / 100,
      };
    });

    // Build per-centre breakdown
    const centreMap = new Map<string, {
      centreId: string;
      nom: string;
      ville: string;
      reservations: number;
      revenuBrut: number;
      commission: number;
    }>();

    for (const r of reservations) {
      const centre = r.session.formation.centre;
      const existing = centreMap.get(centre.id);
      const comm = r.commissionMontant ?? r.montant * commissionRate;

      if (existing) {
        existing.reservations += 1;
        existing.revenuBrut += r.montant;
        existing.commission += comm;
      } else {
        centreMap.set(centre.id, {
          centreId: centre.id,
          nom: centre.nom,
          ville: centre.ville,
          reservations: 1,
          revenuBrut: r.montant,
          commission: comm,
        });
      }
    }

    const parCentre = Array.from(centreMap.values())
      .map((c) => ({
        ...c,
        revenuBrut: Math.round(c.revenuBrut * 100) / 100,
        commission: Math.round(c.commission * 100) / 100,
      }))
      .sort((a, b) => b.revenuBrut - a.revenuBrut);

    // Totals
    const totaux = {
      revenuBrut: Math.round(reservations.reduce((sum, r) => sum + r.montant, 0) * 100) / 100,
      commission: Math.round(
        reservations.reduce(
          (sum, r) => sum + (r.commissionMontant ?? r.montant * commissionRate),
          0
        ) * 100
      ) / 100,
      reservations: reservations.length,
    };

    return NextResponse.json({ monthly, parCentre, totaux });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[GET /api/admin/revenus]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
