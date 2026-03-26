import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";

// GET /api/admin/stats — KPIs super-admin
export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      reservationsCeMois,
      reservationsMoisDernier,
      centresActifs,
      centresEnAttente,
      utilisateurs,
      ticketsOuverts,
      reservationsRecentes,
      centresEnAttenteList,
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
    ]);

    // Calcul revenus (10% de commission)
    const montantsRes = await prisma.reservation.findMany({
      where: { createdAt: { gte: startOfMonth }, status: { in: ["CONFIRMEE", "TERMINEE"] } },
      select: { montant: true },
    });
    const revenusPlateforme = montantsRes.reduce((sum, r) => sum + r.montant * 0.1, 0);

    const montantsMoisDernier = await prisma.reservation.findMany({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { in: ["CONFIRMEE", "TERMINEE"] } },
      select: { montant: true },
    });
    const revenusMoisDernier = montantsMoisDernier.reduce((sum, r) => sum + r.montant * 0.1, 0);

    const revenusEvolution = revenusMoisDernier > 0
      ? Math.round(((revenusPlateforme - revenusMoisDernier) / revenusMoisDernier) * 100)
      : 0;

    const reservationsEvolution = reservationsMoisDernier > 0
      ? Math.round(((reservationsCeMois - reservationsMoisDernier) / reservationsMoisDernier) * 100)
      : 0;

    return NextResponse.json({
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
        status: r.status,
        createdAt: r.createdAt,
      })),
      centresEnAttenteList,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
