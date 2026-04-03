import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

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
    });
  } catch (err) {
    console.error("[GET /api/centre/stats]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
