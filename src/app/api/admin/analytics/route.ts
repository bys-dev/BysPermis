import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth0";

// GET /api/admin/analytics — Advanced BI metrics (OWNER only)
export async function GET() {
  try {
    await requireOwner();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // ═══════════════════════════════════════════════════════════
    // Parallel data fetching
    // ═══════════════════════════════════════════════════════════

    const [
      // Revenue data
      reservations12Months,
      reservationsThisMonth,
      reservationsLastMonth,
      // Subscription data (MRR)
      activeSubscriptions,
      centrePaymentsAll,
      // User data
      allUsers,
      usersWithReservations,
      // Centre data
      allCentres,
      // Formation data
      allFormationsWithCategory,
      allReviews,
      // Session data
      allSessions,
      // Promo data
      promoCodesThisMonth,
      allPromoCodes,
      // Categories
      allCategories,
    ] = await Promise.all([
      // Last 12 months reservations (confirmed/completed)
      prisma.reservation.findMany({
        where: {
          createdAt: { gte: twelveMonthsAgo },
          status: { in: ["CONFIRMEE", "TERMINEE"] },
        },
        select: {
          montant: true,
          commissionMontant: true,
          createdAt: true,
          userId: true,
          session: {
            select: {
              formation: {
                select: {
                  id: true,
                  titre: true,
                  prix: true,
                  centreId: true,
                  categorieId: true,
                  categorie: { select: { id: true, nom: true } },
                  centre: { select: { id: true, nom: true, ville: true } },
                },
              },
            },
          },
        },
      }),
      // This month reservations count
      prisma.reservation.count({
        where: { createdAt: { gte: startOfMonth }, status: { in: ["CONFIRMEE", "TERMINEE"] } },
      }),
      // Last month reservations count
      prisma.reservation.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { in: ["CONFIRMEE", "TERMINEE"] },
        },
      }),
      // Active subscriptions for MRR
      prisma.centre.findMany({
        where: { subscriptionStatus: "ACTIVE" },
        select: {
          id: true,
          subscriptionPlan: { select: { prix: true } },
        },
      }),
      // All centre payments
      prisma.centrePayment.findMany({
        where: { createdAt: { gte: twelveMonthsAgo }, status: "PAYE" },
        select: { type: true, montant: true, createdAt: true, centreId: true },
      }),
      // All users with creation date
      prisma.user.findMany({
        where: { role: "ELEVE" },
        select: { id: true, createdAt: true },
      }),
      // Users who have at least 1 reservation
      prisma.reservation.findMany({
        where: { status: { in: ["CONFIRMEE", "TERMINEE"] } },
        select: { userId: true },
      }),
      // All centres
      prisma.centre.findMany({
        select: {
          id: true,
          nom: true,
          ville: true,
          statut: true,
          profilCompletionPct: true,
          createdAt: true,
        },
      }),
      // All formations with category
      prisma.formation.findMany({
        where: { isActive: true },
        select: {
          id: true,
          titre: true,
          prix: true,
          categorieId: true,
          categorie: { select: { id: true, nom: true } },
          centreId: true,
        },
      }),
      // All reviews
      prisma.review.findMany({
        select: {
          note: true,
          formationId: true,
          formation: { select: { titre: true } },
        },
      }),
      // All sessions
      prisma.session.findMany({
        where: { status: { in: ["ACTIVE", "COMPLETE", "PASSEE"] } },
        select: {
          id: true,
          placesTotal: true,
          placesRestantes: true,
          formationId: true,
          formation: {
            select: { centreId: true },
          },
        },
      }),
      // Promo codes used this month
      prisma.promoCode.findMany({
        where: {
          utilisations: { gt: 0 },
        },
        select: {
          code: true,
          type: true,
          valeur: true,
          utilisations: true,
          createdAt: true,
        },
      }),
      // All promo codes
      prisma.promoCode.findMany({
        select: {
          code: true,
          type: true,
          valeur: true,
          utilisations: true,
          isActive: true,
          dateDebut: true,
          dateFin: true,
        },
      }),
      // All categories
      prisma.categorie.findMany({
        select: { id: true, nom: true },
      }),
    ]);

    // ═══════════════════════════════════════════════════════════
    // 1. REVENUE ANALYTICS
    // ═══════════════════════════════════════════════════════════

    // Monthly revenue (last 12 months)
    const monthlyRevenue: { month: string; label: string; total: number; commission: number; abonnement: number; reservations: number }[] = [];
    const monthNames = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;

      const monthReservations = reservations12Months.filter((r) => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      });

      const totalRevenue = monthReservations.reduce((sum, r) => sum + r.montant, 0);
      const commissionRevenue = monthReservations.reduce((sum, r) => sum + (r.commissionMontant ?? r.montant * 0.1), 0);

      // Subscription revenue for this month from payments
      const monthPayments = centrePaymentsAll.filter((p) => {
        const pd = new Date(p.createdAt);
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth() && p.type === "ABONNEMENT";
      });
      const abonnementRevenue = monthPayments.reduce((sum, p) => sum + p.montant, 0);

      monthlyRevenue.push({
        month: monthKey,
        label,
        total: Math.round(totalRevenue * 100) / 100,
        commission: Math.round(commissionRevenue * 100) / 100,
        abonnement: Math.round(abonnementRevenue * 100) / 100,
        reservations: monthReservations.length,
      });
    }

    // Revenue by centre
    const revenueByCentre = new Map<string, { nom: string; ville: string; revenue: number; commission: number; reservations: number }>();
    for (const r of reservations12Months) {
      const cId = r.session.formation.centre.id;
      const existing = revenueByCentre.get(cId);
      const comm = r.commissionMontant ?? r.montant * 0.1;
      if (existing) {
        existing.revenue += r.montant;
        existing.commission += comm;
        existing.reservations++;
      } else {
        revenueByCentre.set(cId, {
          nom: r.session.formation.centre.nom,
          ville: r.session.formation.centre.ville,
          revenue: r.montant,
          commission: comm,
          reservations: 1,
        });
      }
    }

    // Revenue by category
    const revenueByCategory = new Map<string, { nom: string; revenue: number; count: number }>();
    for (const r of reservations12Months) {
      const catName = r.session.formation.categorie?.nom ?? "Sans categorie";
      const catId = r.session.formation.categorieId ?? "none";
      const existing = revenueByCategory.get(catId);
      if (existing) {
        existing.revenue += r.montant;
        existing.count++;
      } else {
        revenueByCategory.set(catId, { nom: catName, revenue: r.montant, count: 1 });
      }
    }

    // Average ticket
    const thisMonthReservations = reservations12Months.filter((r) => {
      const rd = new Date(r.createdAt);
      return rd.getFullYear() === now.getFullYear() && rd.getMonth() === now.getMonth();
    });
    const lastMonthReservationsList = reservations12Months.filter((r) => {
      const rd = new Date(r.createdAt);
      return rd.getFullYear() === startOfLastMonth.getFullYear() && rd.getMonth() === startOfLastMonth.getMonth();
    });

    const avgTicketThisMonth = thisMonthReservations.length > 0
      ? thisMonthReservations.reduce((s, r) => s + r.montant, 0) / thisMonthReservations.length
      : 0;
    const avgTicketLastMonth = lastMonthReservationsList.length > 0
      ? lastMonthReservationsList.reduce((s, r) => s + r.montant, 0) / lastMonthReservationsList.length
      : 0;

    // MRR from active subscriptions
    const mrr = activeSubscriptions.reduce((sum, c) => sum + (c.subscriptionPlan?.prix ?? 0), 0);

    // Total commission vs abonnement
    const totalCommission12m = reservations12Months.reduce((s, r) => s + (r.commissionMontant ?? r.montant * 0.1), 0);
    const totalAbonnement12m = centrePaymentsAll
      .filter((p) => p.type === "ABONNEMENT")
      .reduce((s, p) => s + p.montant, 0);

    // ═══════════════════════════════════════════════════════════
    // 2. USER ANALYTICS
    // ═══════════════════════════════════════════════════════════

    // New users per month (last 12 months)
    const monthlyNewUsers: { month: string; label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      const count = allUsers.filter((u) => {
        const ud = new Date(u.createdAt);
        return ud.getFullYear() === d.getFullYear() && ud.getMonth() === d.getMonth();
      }).length;
      monthlyNewUsers.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label,
        count,
      });
    }

    // User retention: users who made 2+ reservations / total users with reservations
    const userReservationCount = new Map<string, number>();
    for (const r of usersWithReservations) {
      userReservationCount.set(r.userId, (userReservationCount.get(r.userId) ?? 0) + 1);
    }
    const usersWithAtLeast1 = userReservationCount.size;
    const usersWithAtLeast2 = Array.from(userReservationCount.values()).filter((c) => c >= 2).length;
    const usersWithAtLeast3 = Array.from(userReservationCount.values()).filter((c) => c >= 3).length;
    const retentionRate = allUsers.length > 0 ? Math.round((usersWithAtLeast2 / allUsers.length) * 100) : 0;

    // Conversion rate: users who reserved / total users
    const conversionRate = allUsers.length > 0 ? Math.round((usersWithAtLeast1 / allUsers.length) * 100) : 0;

    // Active users this month (made a reservation)
    const activeUsersThisMonth = new Set(
      thisMonthReservations.map((r) => r.userId)
    ).size;

    // Funnel: Inscriptions -> First reservation -> Second -> Loyal (3+)
    const funnel = {
      inscrits: allUsers.length,
      premiereReservation: usersWithAtLeast1,
      deuxiemeReservation: usersWithAtLeast2,
      fideles: usersWithAtLeast3,
    };

    // ═══════════════════════════════════════════════════════════
    // 3. CENTRE ANALYTICS
    // ═══════════════════════════════════════════════════════════

    // Centres by status
    const centresByStatus = {
      actif: allCentres.filter((c) => c.statut === "ACTIF").length,
      enAttente: allCentres.filter((c) => c.statut === "EN_ATTENTE").length,
      suspendu: allCentres.filter((c) => c.statut === "SUSPENDU").length,
    };

    // Average completion %
    const avgCompletion = allCentres.length > 0
      ? Math.round(allCentres.reduce((s, c) => s + c.profilCompletionPct, 0) / allCentres.length)
      : 0;

    // Top 10 centres by revenue
    const topCentresRevenue = Array.from(revenueByCentre.entries())
      .map(([id, data]) => ({
        id,
        ...data,
        revenue: Math.round(data.revenue * 100) / 100,
        commission: Math.round(data.commission * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Add rating to top centres
    const centreRatings = new Map<string, { total: number; count: number }>();
    for (const review of allReviews) {
      // Find which centre owns this formation
      const formation = allFormationsWithCategory.find((f) => f.id === review.formationId);
      if (formation) {
        const existing = centreRatings.get(formation.centreId);
        if (existing) {
          existing.total += review.note;
          existing.count++;
        } else {
          centreRatings.set(formation.centreId, { total: review.note, count: 1 });
        }
      }
    }

    const topCentresWithRating = topCentresRevenue.map((c) => {
      const rating = centreRatings.get(c.id);
      return {
        ...c,
        rating: rating ? Math.round((rating.total / rating.count) * 10) / 10 : null,
        reviewCount: rating?.count ?? 0,
      };
    });

    // Centre growth (new centres per month)
    const centreGrowth: { month: string; label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      const count = allCentres.filter((c) => {
        const cd = new Date(c.createdAt);
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
      }).length;
      centreGrowth.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label,
        count,
      });
    }

    // Average fill rate
    const sessionsWithPlaces = allSessions.filter((s) => s.placesTotal > 0);
    const avgFillRate = sessionsWithPlaces.length > 0
      ? Math.round(
          sessionsWithPlaces.reduce((s, sess) => {
            const filled = sess.placesTotal - sess.placesRestantes;
            return s + (filled / sess.placesTotal) * 100;
          }, 0) / sessionsWithPlaces.length
        )
      : 0;

    // ═══════════════════════════════════════════════════════════
    // 4. FORMATION ANALYTICS
    // ═══════════════════════════════════════════════════════════

    // Most popular formations by reservation count
    const formationPopularity = new Map<string, { titre: string; count: number; revenue: number; categorie: string }>();
    for (const r of reservations12Months) {
      const fId = r.session.formation.id;
      const existing = formationPopularity.get(fId);
      if (existing) {
        existing.count++;
        existing.revenue += r.montant;
      } else {
        formationPopularity.set(fId, {
          titre: r.session.formation.titre,
          count: 1,
          revenue: r.montant,
          categorie: r.session.formation.categorie?.nom ?? "Sans categorie",
        });
      }
    }
    const topFormations = Array.from(formationPopularity.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((f) => ({ ...f, revenue: Math.round(f.revenue * 100) / 100 }));

    // Bottom formations (least popular with at least 1 reservation)
    const bottomFormations = Array.from(formationPopularity.values())
      .sort((a, b) => a.count - b.count)
      .slice(0, 5)
      .map((f) => ({ ...f, revenue: Math.round(f.revenue * 100) / 100 }));

    // Best rated formations
    const formationRatings = new Map<string, { titre: string; total: number; count: number }>();
    for (const review of allReviews) {
      const existing = formationRatings.get(review.formationId);
      if (existing) {
        existing.total += review.note;
        existing.count++;
      } else {
        formationRatings.set(review.formationId, {
          titre: review.formation.titre,
          total: review.note,
          count: 1,
        });
      }
    }
    const bestRatedFormations = Array.from(formationRatings.values())
      .map((f) => ({
        titre: f.titre,
        rating: Math.round((f.total / f.count) * 10) / 10,
        reviewCount: f.count,
      }))
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, 10);

    // Worst rated
    const worstRatedFormations = Array.from(formationRatings.values())
      .filter((f) => f.count >= 1)
      .map((f) => ({
        titre: f.titre,
        rating: Math.round((f.total / f.count) * 10) / 10,
        reviewCount: f.count,
      }))
      .sort((a, b) => a.rating - b.rating)
      .slice(0, 5);

    // Formations by category distribution
    const categoryDistribution: { nom: string; count: number }[] = [];
    const catCountMap = new Map<string, { nom: string; count: number }>();
    for (const f of allFormationsWithCategory) {
      const catName = f.categorie?.nom ?? "Sans categorie";
      const catId = f.categorieId ?? "none";
      const existing = catCountMap.get(catId);
      if (existing) {
        existing.count++;
      } else {
        catCountMap.set(catId, { nom: catName, count: 1 });
      }
    }
    categoryDistribution.push(...Array.from(catCountMap.values()).sort((a, b) => b.count - a.count));

    // Average price by category
    const avgPriceByCategory: { nom: string; avgPrice: number; count: number }[] = [];
    const catPriceMap = new Map<string, { nom: string; totalPrice: number; count: number }>();
    for (const f of allFormationsWithCategory) {
      const catName = f.categorie?.nom ?? "Sans categorie";
      const catId = f.categorieId ?? "none";
      const existing = catPriceMap.get(catId);
      if (existing) {
        existing.totalPrice += f.prix;
        existing.count++;
      } else {
        catPriceMap.set(catId, { nom: catName, totalPrice: f.prix, count: 1 });
      }
    }
    for (const [, data] of catPriceMap) {
      avgPriceByCategory.push({
        nom: data.nom,
        avgPrice: Math.round((data.totalPrice / data.count) * 100) / 100,
        count: data.count,
      });
    }
    avgPriceByCategory.sort((a, b) => b.avgPrice - a.avgPrice);

    // ═══════════════════════════════════════════════════════════
    // 5. PROMO ANALYTICS
    // ═══════════════════════════════════════════════════════════

    const totalPromoUsedThisMonth = promoCodesThisMonth.reduce((s, p) => s + p.utilisations, 0);

    // Estimated discount impact (approximate)
    const promoImpact = promoCodesThisMonth.reduce((s, p) => {
      if (p.type === "POURCENTAGE") {
        // Approximate: avg ticket * usage * percentage
        return s + (avgTicketThisMonth * p.utilisations * p.valeur) / 100;
      }
      return s + p.utilisations * p.valeur;
    }, 0);

    const activePromos = allPromoCodes.filter((p) => p.isActive && new Date(p.dateFin) > now).length;

    // ═══════════════════════════════════════════════════════════
    // 6. KPI COMPARISONS (this month vs last month)
    // ═══════════════════════════════════════════════════════════

    const revenueThisMonth = thisMonthReservations.reduce((s, r) => s + (r.commissionMontant ?? r.montant * 0.1), 0);
    const revenueLastMonth = lastMonthReservationsList.reduce((s, r) => s + (r.commissionMontant ?? r.montant * 0.1), 0);

    const newUsersThisMonth = allUsers.filter((u) => {
      const ud = new Date(u.createdAt);
      return ud.getFullYear() === now.getFullYear() && ud.getMonth() === now.getMonth();
    }).length;
    const newUsersLastMonth = allUsers.filter((u) => {
      const ud = new Date(u.createdAt);
      return ud.getFullYear() === startOfLastMonth.getFullYear() && ud.getMonth() === startOfLastMonth.getMonth();
    }).length;

    const newCentresThisMonth = allCentres.filter((c) => {
      const cd = new Date(c.createdAt);
      return cd.getFullYear() === now.getFullYear() && cd.getMonth() === now.getMonth();
    }).length;
    const newCentresLastMonth = allCentres.filter((c) => {
      const cd = new Date(c.createdAt);
      return cd.getFullYear() === startOfLastMonth.getFullYear() && cd.getMonth() === startOfLastMonth.getMonth();
    }).length;

    function pctChange(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    const kpiComparisons = {
      revenue: {
        current: Math.round(revenueThisMonth * 100) / 100,
        previous: Math.round(revenueLastMonth * 100) / 100,
        change: pctChange(revenueThisMonth, revenueLastMonth),
      },
      reservations: {
        current: reservationsThisMonth,
        previous: reservationsLastMonth,
        change: pctChange(reservationsThisMonth, reservationsLastMonth),
      },
      newUsers: {
        current: newUsersThisMonth,
        previous: newUsersLastMonth,
        change: pctChange(newUsersThisMonth, newUsersLastMonth),
      },
      newCentres: {
        current: newCentresThisMonth,
        previous: newCentresLastMonth,
        change: pctChange(newCentresThisMonth, newCentresLastMonth),
      },
      avgTicket: {
        current: Math.round(avgTicketThisMonth * 100) / 100,
        previous: Math.round(avgTicketLastMonth * 100) / 100,
        change: pctChange(avgTicketThisMonth, avgTicketLastMonth),
      },
      activeUsers: {
        current: activeUsersThisMonth,
        previous: 0, // Would need last month active users tracking
        change: 0,
      },
    };

    // Fill rate by centre (for performance tab)
    const fillRateByCentre = new Map<string, { total: number; filled: number; sessions: number }>();
    for (const s of allSessions) {
      const cId = s.formation.centreId;
      const existing = fillRateByCentre.get(cId);
      const filled = s.placesTotal - s.placesRestantes;
      if (existing) {
        existing.total += s.placesTotal;
        existing.filled += filled;
        existing.sessions++;
      } else {
        fillRateByCentre.set(cId, { total: s.placesTotal, filled, sessions: 1 });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════

    return NextResponse.json({
      // Revenue
      revenue: {
        monthly: monthlyRevenue,
        byCategory: Array.from(revenueByCategory.values())
          .map((c) => ({ ...c, revenue: Math.round(c.revenue * 100) / 100 }))
          .sort((a, b) => b.revenue - a.revenue),
        avgTicket: {
          current: Math.round(avgTicketThisMonth * 100) / 100,
          previous: Math.round(avgTicketLastMonth * 100) / 100,
        },
        mrr: Math.round(mrr * 100) / 100,
        totalCommission12m: Math.round(totalCommission12m * 100) / 100,
        totalAbonnement12m: Math.round(totalAbonnement12m * 100) / 100,
      },

      // Users
      users: {
        total: allUsers.length,
        monthlyNew: monthlyNewUsers,
        retention: retentionRate,
        conversion: conversionRate,
        activeThisMonth: activeUsersThisMonth,
        funnel,
      },

      // Centres
      centres: {
        total: allCentres.length,
        byStatus: centresByStatus,
        avgCompletion,
        topByRevenue: topCentresWithRating,
        growth: centreGrowth,
        avgFillRate,
      },

      // Formations
      formations: {
        total: allFormationsWithCategory.length,
        topPopular: topFormations,
        bottomPopular: bottomFormations,
        bestRated: bestRatedFormations,
        worstRated: worstRatedFormations,
        categoryDistribution,
        avgPriceByCategory,
      },

      // Promos
      promos: {
        totalUsedThisMonth: totalPromoUsedThisMonth,
        revenueImpact: Math.round(promoImpact * 100) / 100,
        activeCount: activePromos,
      },

      // KPIs
      kpiComparisons,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifi\u00e9" || message === "Non autoris\u00e9") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[GET /api/admin/analytics]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
