import { prisma } from "@/lib/prisma";

export async function getAdminStatsForDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Start of 6 months ago
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    reservationsCeMois,
    reservationsMoisDernier,
    centresActifs,
    centresEnAttente,
    utilisateurs,
    ticketsOuverts,
    reservationsRecentes,
    centresEnAttenteList,
    reservations6Months,
    allReservationsWithFormation,
    recentCentres,
    recentTickets,
    montantsRes,
    montantsMoisDernier,
  ] = await Promise.all([
    prisma.reservation.count({
      where: { createdAt: { gte: startOfMonth }, status: { in: ["CONFIRMEE", "TERMINEE"] } },
    }),
    prisma.reservation.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { in: ["CONFIRMEE", "TERMINEE"] } },
    }),
    prisma.centre.count({ where: { statut: "ACTIF" } }),
    prisma.centre.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.user.count({ where: { role: "ELEVE" } }),
    prisma.ticket.count({ where: { status: { in: ["OUVERT", "EN_COURS"] } } }),
    prisma.reservation.findMany({
      where: { status: { in: ["CONFIRMEE", "TERMINEE"] } },
      include: {
        user: { select: { prenom: true, nom: true } },
        session: {
          include: {
            formation: {
              select: {
                titre: true,
                centre: { select: { nom: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.centre.findMany({
      where: { statut: "EN_ATTENTE" },
      select: { id: true, nom: true, ville: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.reservation.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, status: { in: ["CONFIRMEE", "TERMINEE"] } },
      select: { montant: true, createdAt: true },
    }),
    prisma.reservation.findMany({
      where: { status: { in: ["CONFIRMEE", "TERMINEE"] } },
      select: {
        montant: true,
        session: {
          select: {
            formation: {
              select: {
                id: true,
                titre: true,
                centre: { select: { id: true, nom: true, ville: true } },
              },
            },
          },
        },
      },
    }),
    prisma.centre.findMany({
      select: { id: true, nom: true, ville: true, createdAt: true, statut: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.ticket.findMany({
      select: { id: true, sujet: true, createdAt: true, status: true, user: { select: { prenom: true, nom: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.reservation.findMany({
      where: { createdAt: { gte: startOfMonth }, status: { in: ["CONFIRMEE", "TERMINEE"] } },
      select: { montant: true },
    }),
    prisma.reservation.findMany({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { in: ["CONFIRMEE", "TERMINEE"] } },
      select: { montant: true },
    }),
  ]);

  // Calcul revenus (10% de commission)
  const revenusPlateforme = montantsRes.reduce((sum, r) => sum + r.montant * 0.1, 0);
  const revenusMoisDernier = montantsMoisDernier.reduce((sum, r) => sum + r.montant * 0.1, 0);
  const revenusEvolution = revenusMoisDernier > 0
    ? Math.round(((revenusPlateforme - revenusMoisDernier) / revenusMoisDernier) * 100)
    : 0;

  const reservationsEvolution = reservationsMoisDernier > 0
    ? Math.round(((reservationsCeMois - reservationsMoisDernier) / reservationsMoisDernier) * 100)
    : 0;

  // ── Monthly data (last 6 months) ──
  const monthlyData: { month: string; revenue: number; reservations: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthReservations = reservations6Months.filter((r) => {
      const rd = new Date(r.createdAt);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    });
    const monthRevenue = monthReservations.reduce((sum, r) => sum + r.montant * 0.1, 0);
    monthlyData.push({ month: monthKey, revenue: Math.round(monthRevenue), reservations: monthReservations.length });
  }

  // ── Top 5 formations by reservations ──
  const formationMap = new Map<string, { titre: string; reservationCount: number; revenue: number }>();
  const centreMap = new Map<string, { nom: string; ville: string; reservationCount: number; revenue: number }>();

  for (const r of allReservationsWithFormation) {
    const fId = r.session.formation.id;
    const existingF = formationMap.get(fId);
    if (existingF) {
      existingF.reservationCount++;
      existingF.revenue += r.montant;
    } else {
      formationMap.set(fId, { titre: r.session.formation.titre, reservationCount: 1, revenue: r.montant });
    }

    const cId = r.session.formation.centre.id;
    const existingC = centreMap.get(cId);
    if (existingC) {
      existingC.reservationCount++;
      existingC.revenue += r.montant;
    } else {
      centreMap.set(cId, {
        nom: r.session.formation.centre.nom,
        ville: r.session.formation.centre.ville,
        reservationCount: 1,
        revenue: r.montant,
      });
    }
  }

  const topFormations = Array.from(formationMap.values())
    .sort((a, b) => b.reservationCount - a.reservationCount)
    .slice(0, 5)
    .map((f) => ({ ...f, revenue: Math.round(f.revenue) }));

  const topCentres = Array.from(centreMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((c) => ({ ...c, revenue: Math.round(c.revenue) }));

  const lastMonthRevenue = monthlyData.length >= 2 ? monthlyData[monthlyData.length - 2].revenue : 0;
  const thisMonthRevenue = monthlyData.length >= 1 ? monthlyData[monthlyData.length - 1].revenue : 0;
  const revenueGrowth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

  const lastMonthReservations = monthlyData.length >= 2 ? monthlyData[monthlyData.length - 2].reservations : 0;
  const thisMonthReservations = monthlyData.length >= 1 ? monthlyData[monthlyData.length - 1].reservations : 0;
  const reservationsGrowth = lastMonthReservations > 0
    ? Math.round(((thisMonthReservations - lastMonthReservations) / lastMonthReservations) * 100)
    : 0;

  type ActivityItem = {
    id: string;
    type: "reservation" | "centre" | "ticket";
    label: string;
    detail: string;
    time: string;
  };

  const activityItems: ActivityItem[] = [];
  for (const r of reservationsRecentes.slice(0, 3)) {
    activityItems.push({
      id: `res-${r.numero}`,
      type: "reservation",
      label: "Nouvelle reservation",
      detail: `${r.user.prenom} ${r.user.nom} — ${r.session.formation.centre.nom}`,
      time: r.createdAt.toISOString(),
    });
  }
  for (const c of recentCentres.slice(0, 3)) {
    activityItems.push({
      id: `centre-${c.id}`,
      type: "centre",
      label: c.statut === "EN_ATTENTE" ? "Nouveau centre inscrit" : "Centre actif",
      detail: `${c.nom} — ${c.ville}`,
      time: c.createdAt.toISOString(),
    });
  }
  for (const t of recentTickets.slice(0, 3)) {
    activityItems.push({
      id: `ticket-${t.id}`,
      type: "ticket",
      label: "Ticket support",
      detail: `${t.sujet} — ${t.user.prenom} ${t.user.nom}`,
      time: t.createdAt.toISOString(),
    });
  }
  activityItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return {
    revenusPlateforme: Math.round(revenusPlateforme),
    revenusEvolution,
    centresActifs,
    centresEnAttente,
    reservationsCeMois,
    reservationsEvolution,
    utilisateurs,
    ticketsOuverts,
    reservationsRecentes: reservationsRecentes.map((r) => ({
      id: r.numero,
      eleve: `${r.user.prenom} ${r.user.nom}`,
      centre: r.session.formation.centre.nom,
      stage: r.session.formation.titre,
      montant: r.montant,
      status: String(r.status),
      createdAt: r.createdAt.toISOString(),
    })),
    centresEnAttenteList: centresEnAttenteList.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    monthlyData,
    topFormations,
    topCentres,
    growth: { revenue: revenueGrowth, reservations: reservationsGrowth },
    activityFeed: activityItems.slice(0, 10),
  };
}

