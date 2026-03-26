import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";

// GET /api/centre/stats — KPIs pour le dashboard centre
export async function GET() {
  try {
    const user = await requireAuth();

    // Récupérer le centre lié à l'utilisateur
    const centre = await prisma.centre.findUnique({ where: { userId: user.id } });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Réservations ce mois (sessions du centre)
    const reservationsCeMois = await prisma.reservation.count({
      where: {
        session: { formation: { centreId: centre.id } },
        createdAt: { gte: startOfMonth },
        status: { in: ["CONFIRMEE", "TERMINEE"] },
      },
    });

    // Revenus nets ce mois (90% du montant, commission 10% BYS)
    const reservationsAvecMontant = await prisma.reservation.findMany({
      where: {
        session: { formation: { centreId: centre.id } },
        createdAt: { gte: startOfMonth },
        status: { in: ["CONFIRMEE", "TERMINEE"] },
      },
      select: { montant: true },
    });
    const revenusNets = reservationsAvecMontant.reduce((sum, r) => sum + r.montant * 0.9, 0);

    // Total élèves formés (toutes réservations TERMINEE)
    const elevesFormes = await prisma.reservation.count({
      where: {
        session: { formation: { centreId: centre.id } },
        status: "TERMINEE",
      },
    });

    // Formations actives
    const formationsActives = await prisma.formation.count({
      where: { centreId: centre.id, isActive: true },
    });

    // Formations en attente de validation
    const formationsEnAttente = await prisma.formation.count({
      where: { centreId: centre.id, isActive: false },
    });

    // Réservations récentes (10 dernières)
    const reservationsRecentes = await prisma.reservation.findMany({
      where: { session: { formation: { centreId: centre.id } } },
      include: {
        user: { select: { prenom: true, nom: true } },
        session: {
          include: {
            formation: { select: { titre: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      reservationsCeMois,
      revenusNets: Math.round(revenusNets),
      elevesFormes,
      formationsActives,
      formationsEnAttente,
      reservationsRecentes: reservationsRecentes.map((r) => ({
        id: r.numero,
        eleve: `${r.user.prenom} ${r.user.nom}`,
        formation: r.session.formation.titre,
        date: r.session.dateDebut,
        status: r.status,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
