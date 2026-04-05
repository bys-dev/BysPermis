import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

const MONTH_LABELS: Record<string, string> = {
  "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
  "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
  "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre",
};

// GET /api/centre/stats — KPIs pour le dashboard centre
export async function GET() {
  try {
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }

    // Get centre with subscription plan for commission rate
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      include: { subscriptionPlan: { select: { commissionRate: true } } },
    });
    if (!centre) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }

    const commissionRate = centre.subscriptionPlan?.commissionRate ?? 10; // default 10%

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Reservations this month (confirmed + completed)
    const reservationsCeMois = await prisma.reservation.count({
      where: {
        session: { formation: { centreId } },
        createdAt: { gte: startOfMonth },
        status: { in: ["CONFIRMEE", "TERMINEE"] },
      },
    });

    // Revenue this month (after commission)
    const reservationsAvecMontant = await prisma.reservation.findMany({
      where: {
        session: { formation: { centreId } },
        createdAt: { gte: startOfMonth },
        status: { in: ["CONFIRMEE", "TERMINEE"] },
      },
      select: { montant: true },
    });
    const revenusNets = reservationsAvecMontant.reduce(
      (sum, r) => sum + r.montant * (1 - commissionRate / 100),
      0
    );

    // Active sessions count
    const sessionsActives = await prisma.session.count({
      where: {
        formation: { centreId },
        status: "ACTIVE",
        dateDebut: { gte: now },
      },
    });

    // Total formations count
    const formationsTotal = await prisma.formation.count({
      where: { centreId },
    });

    // Recent reservations (last 5) with student name, formation, date, status
    const reservationsRecentes = await prisma.reservation.findMany({
      where: { session: { formation: { centreId } } },
      include: {
        user: { select: { prenom: true, nom: true } },
        session: {
          include: {
            formation: { select: { titre: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Occupancy rate: (placesTotal - placesRestantes) / placesTotal across active sessions
    const activeSessions = await prisma.session.findMany({
      where: {
        formation: { centreId },
        status: "ACTIVE",
      },
      select: { placesTotal: true, placesRestantes: true },
    });

    let tauxRemplissage = 0;
    if (activeSessions.length > 0) {
      const totalPlaces = activeSessions.reduce((sum, s) => sum + s.placesTotal, 0);
      const restantes = activeSessions.reduce((sum, s) => sum + s.placesRestantes, 0);
      tauxRemplissage = totalPlaces > 0 ? Math.round(((totalPlaces - restantes) / totalPlaces) * 100) : 0;
    }

    // ── Monthly Revenue (last 6 months) ──
    const reservations6Months = await prisma.reservation.findMany({
      where: {
        session: { formation: { centreId } },
        createdAt: { gte: sixMonthsAgo },
        status: { in: ["CONFIRMEE", "TERMINEE"] },
      },
      select: { montant: true, createdAt: true },
    });

    const monthlyRevenue: { month: string; label: string; revenue: number; reservations: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthNum = String(d.getMonth() + 1).padStart(2, "0");
      const monthReservations = reservations6Months.filter((r) => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      });
      const monthRevenue = monthReservations.reduce(
        (sum, r) => sum + r.montant * (1 - commissionRate / 100), 0
      );
      monthlyRevenue.push({
        month: monthKey,
        label: MONTH_LABELS[monthNum] ?? monthNum,
        revenue: Math.round(monthRevenue),
        reservations: monthReservations.length,
      });
    }

    // ── Top 5 formations by reservation count ──
    const allReservationsWithFormation = await prisma.reservation.findMany({
      where: {
        session: { formation: { centreId } },
        status: { in: ["CONFIRMEE", "TERMINEE"] },
      },
      select: {
        montant: true,
        session: {
          select: {
            formation: { select: { id: true, titre: true } },
          },
        },
      },
    });

    const formationMap = new Map<string, { titre: string; reservations: number; revenue: number }>();
    for (const r of allReservationsWithFormation) {
      const fId = r.session.formation.id;
      const existing = formationMap.get(fId);
      if (existing) {
        existing.reservations++;
        existing.revenue += r.montant * (1 - commissionRate / 100);
      } else {
        formationMap.set(fId, {
          titre: r.session.formation.titre,
          reservations: 1,
          revenue: r.montant * (1 - commissionRate / 100),
        });
      }
    }
    const topFormations = Array.from(formationMap.values())
      .sort((a, b) => b.reservations - a.reservations)
      .slice(0, 5)
      .map((f) => ({ ...f, revenue: Math.round(f.revenue) }));

    // ── Status breakdown ──
    const allStatuses = await prisma.reservation.findMany({
      where: { session: { formation: { centreId } } },
      select: { status: true },
    });
    const statusBreakdown = {
      confirmees: allStatuses.filter((r) => r.status === "CONFIRMEE").length,
      enAttente: allStatuses.filter((r) => r.status === "EN_ATTENTE").length,
      annulees: allStatuses.filter((r) => r.status === "ANNULEE").length,
      terminees: allStatuses.filter((r) => r.status === "TERMINEE").length,
    };

    // ── Average rating ──
    const reviews = await prisma.review.findMany({
      where: { formation: { centreId } },
      select: { note: true, commentaire: true, createdAt: true, user: { select: { prenom: true, nom: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const averageRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.note, 0) / reviews.length) * 10) / 10
      : 0;

    // ── Session occupancy per active session ──
    const sessionsWithOccupancy = await prisma.session.findMany({
      where: {
        formation: { centreId },
        status: "ACTIVE",
      },
      select: {
        dateDebut: true,
        placesTotal: true,
        placesRestantes: true,
        formation: { select: { titre: true } },
      },
      orderBy: { dateDebut: "asc" },
      take: 10,
    });

    const sessionOccupancy = sessionsWithOccupancy.map((s) => ({
      formation: s.formation.titre,
      dateDebut: s.dateDebut,
      placesTotal: s.placesTotal,
      placesRestantes: s.placesRestantes,
      taux: s.placesTotal > 0
        ? Math.round(((s.placesTotal - s.placesRestantes) / s.placesTotal) * 100)
        : 0,
    }));

    return NextResponse.json({
      reservationsCeMois,
      revenusNets: Math.round(revenusNets * 100) / 100,
      sessionsActives,
      formationsTotal,
      tauxRemplissage,
      reservationsRecentes: reservationsRecentes.map((r) => ({
        id: r.numero,
        eleve: `${r.prenom} ${r.nom}`,
        formation: r.session.formation.titre,
        date: r.session.dateDebut,
        status: r.status,
        montant: r.montant,
      })),
      // Enhanced stats
      monthlyRevenue,
      topFormations,
      statusBreakdown,
      averageRating,
      sessionOccupancy,
      recentReviews: reviews.map((r) => ({
        note: r.note,
        commentaire: r.commentaire,
        createdAt: r.createdAt,
        user: `${r.user.prenom} ${r.user.nom}`,
      })),
    });
  } catch (err) {
    console.error("[GET /api/centre/stats]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
