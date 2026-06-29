"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEuroSign,
  faCalendarDays,
  faChartPie,
  faStar,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";
import LoadingOverlay, { KpiGridSkeleton, PageHeaderSkeleton } from "@/components/ui/LoadingOverlay";

// ─── TYPES ──────────────────────────────────────────────

interface MonthlyRevenue {
  month: string;
  label: string;
  revenue: number;
  reservations: number;
}

interface TopFormation {
  titre: string;
  reservations: number;
  revenue: number;
}

interface StatusBreakdown {
  confirmees: number;
  enAttente: number;
  annulees: number;
  terminees: number;
}

interface SessionOccupancy {
  formation: string;
  dateDebut: string;
  placesTotal: number;
  placesRestantes: number;
  taux: number;
}

interface RecentReview {
  note: number;
  commentaire: string | null;
  createdAt: string;
  user: string;
}

interface Stats {
  reservationsCeMois: number;
  revenusNets: number;
  tauxRemplissage: number;
  averageRating: number;
  monthlyRevenue: MonthlyRevenue[];
  topFormations: TopFormation[];
  statusBreakdown: StatusBreakdown;
  sessionOccupancy: SessionOccupancy[];
  recentReviews: RecentReview[];
}

const cardClass = "rounded-xl bg-white border border-slate-200 shadow-sm";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          className={`text-xs ${i < Math.round(rating) ? "text-amber-500" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}

export default function StatistiquesPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/centre/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Impossible de charger les statistiques");
        return r.json();
      })
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const maxMonthlyRevenue = stats
    ? Math.max(...stats.monthlyRevenue.map((m) => m.revenue), 1)
    : 1;
  const maxFormationRes = stats
    ? Math.max(...(stats.topFormations.map((f) => f.reservations) || [1]), 1)
    : 1;
  const totalStatus = stats
    ? stats.statusBreakdown.confirmees +
      stats.statusBreakdown.enAttente +
      stats.statusBreakdown.annulees +
      stats.statusBreakdown.terminees || 1
    : 1;

  const statusItems = stats
    ? [
        { label: "Confirmées", value: stats.statusBreakdown.confirmees, color: "bg-emerald-500" },
        { label: "En attente", value: stats.statusBreakdown.enAttente, color: "bg-amber-500" },
        { label: "Annulées", value: stats.statusBreakdown.annulees, color: "bg-red-500" },
        { label: "Terminées", value: stats.statusBreakdown.terminees, color: "bg-slate-400" },
      ]
    : [];

  const kpis = stats
    ? [
        {
          label: "Revenus du mois",
          value: formatPrice(stats.revenusNets),
          icon: faEuroSign,
          accent: "text-emerald-600 bg-emerald-50",
        },
        {
          label: "Réservations du mois",
          value: String(stats.reservationsCeMois),
          icon: faCalendarDays,
          accent: "text-blue-600 bg-blue-50",
        },
        {
          label: "Taux de remplissage",
          value: `${stats.tauxRemplissage}%`,
          icon: faChartPie,
          accent: "text-violet-600 bg-violet-50",
        },
        {
          label: "Note moyenne",
          value: stats.averageRating > 0 ? `${stats.averageRating}/5` : "N/A",
          icon: faStar,
          accent: "text-amber-600 bg-amber-50",
        },
      ]
    : [];

  return (
    <div className="relative max-w-6xl mx-auto min-h-[50vh]">
      <div className={loading ? "opacity-50 pointer-events-none select-none" : ""}>
        {loading ? (
          <PageHeaderSkeleton />
        ) : (
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Statistiques
            </h1>
            <p className="text-gray-400 text-base mt-1">
              Analyses détaillées de votre activité
            </p>
          </div>
        )}

        {!loading && (error || !stats) ? (
          <div className={`${cardClass} flex flex-col items-center justify-center py-16 gap-3`}>
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-red-500" />
            <p className="text-sm font-medium text-slate-800">{error ?? "Erreur inconnue"}</p>
            <button
              type="button"
              onClick={() => { setLoading(true); setError(null); location.reload(); }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              Réessayer
            </button>
          </div>
        ) : stats ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {kpis.map((k) => (
                <div key={k.label} className={`${cardClass} p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${k.accent}`}>
                      <FontAwesomeIcon icon={k.icon} className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-snug">{k.label}</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">{k.value}</p>
                </div>
              ))}
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Revenus mensuels */}
              <div className={`${cardClass} p-5 sm:p-6`}>
                <h3 className="text-slate-900 font-semibold text-base mb-5">
                  Revenus mensuels (6 derniers mois)
                </h3>
                <div className="flex items-end gap-2 sm:gap-3 h-44">
                  {stats.monthlyRevenue.map((m) => {
                    const pct = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 100 : 0;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-xs font-medium text-slate-600 mb-1 tabular-nums">
                          {formatPrice(m.revenue)}
                        </span>
                        <div className="w-full h-32 flex items-end justify-center bg-slate-50 rounded-t-lg">
                          <div
                            className="w-full max-w-10 rounded-t-md bg-blue-600 transition-all duration-500"
                            style={{ height: `${Math.max(pct, 6)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 mt-1 truncate w-full text-center">
                          {m.label.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Réservations par formation */}
              <div className={`${cardClass} p-5 sm:p-6`}>
                <h3 className="text-slate-900 font-semibold text-base mb-5">
                  Réservations par formation
                </h3>
                {stats.topFormations.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">
                    Aucune donnée disponible
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.topFormations.map((f) => {
                      const pct = (f.reservations / maxFormationRes) * 100;
                      return (
                        <div key={f.titre}>
                          <div className="flex items-center justify-between text-sm mb-1.5 gap-2">
                            <span className="text-slate-800 font-medium truncate">{f.titre}</span>
                            <span className="text-slate-500 shrink-0 tabular-nums">{f.reservations} rés.</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-600 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Taux d'occupation */}
              <div className={`${cardClass} p-5 sm:p-6`}>
                <h3 className="text-slate-900 font-semibold text-base mb-5">
                  Taux d&apos;occupation des sessions
                </h3>
                {stats.sessionOccupancy.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">
                    Aucune session active
                  </p>
                ) : (
                  <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                    {stats.sessionOccupancy.map((s, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1.5 gap-2">
                          <span className="text-slate-800 font-medium truncate">
                            {s.formation}
                          </span>
                          <span
                            className={`shrink-0 font-bold tabular-nums ${
                              s.taux >= 80 ? "text-emerald-600" : s.taux >= 50 ? "text-amber-600" : "text-red-600"
                            }`}
                          >
                            {s.taux}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              s.taux >= 80 ? "bg-emerald-500" : s.taux >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${s.taux}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {s.placesTotal - s.placesRestantes}/{s.placesTotal} places ·{" "}
                          {new Date(s.dateDebut).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Répartition par statut */}
              <div className={`${cardClass} p-5 sm:p-6`}>
                <h3 className="text-slate-900 font-semibold text-base mb-5">
                  Réservations par statut
                </h3>
                <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden flex mb-5">
                  {statusItems.map((s) => (
                    <div
                      key={s.label}
                      className={`h-full ${s.color} transition-all duration-500`}
                      style={{ width: `${(s.value / totalStatus) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {statusItems.map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-sm ${s.color} shrink-0`} />
                      <div>
                        <span className="text-sm text-slate-800 font-medium">{s.label}</span>
                        <span className="text-sm text-slate-500 ml-1 tabular-nums">({s.value})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className={`${cardClass} overflow-hidden`}>
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
                  <h3 className="text-slate-900 font-semibold text-base">
                    Top formations par revenu
                  </h3>
                </div>
                {stats.topFormations.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">
                    Aucune donnée disponible
                  </p>
                ) : (
                  <>
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left bg-slate-50">
                            <th className="text-slate-600 font-semibold text-xs px-6 py-3">Formation</th>
                            <th className="text-slate-600 font-semibold text-xs px-6 py-3 text-right">Réservations</th>
                            <th className="text-slate-600 font-semibold text-xs px-6 py-3 text-right">Revenu net</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stats.topFormations.map((f, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 text-slate-800 font-medium truncate max-w-[200px]">{f.titre}</td>
                              <td className="px-6 py-3 text-slate-600 text-right tabular-nums">{f.reservations}</td>
                              <td className="px-6 py-3 text-emerald-700 font-bold text-right tabular-nums">{formatPrice(f.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="sm:hidden divide-y divide-slate-100">
                      {stats.topFormations.map((f, i) => (
                        <div key={i} className="px-4 py-3">
                          <p className="text-slate-800 text-sm font-medium truncate">{f.titre}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-slate-500">{f.reservations} réservation(s)</span>
                            <span className="text-sm text-emerald-700 font-bold">{formatPrice(f.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className={`${cardClass} overflow-hidden`}>
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
                  <h3 className="text-slate-900 font-semibold text-base">
                    Avis récents
                  </h3>
                </div>
                {stats.recentReviews.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">
                    Aucun avis pour le moment
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {stats.recentReviews.map((r, i) => (
                      <div key={i} className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="text-sm font-semibold text-slate-900">{r.user}</span>
                          <Stars rating={r.note} />
                        </div>
                        {r.commentaire && (
                          <p className="text-sm text-slate-600 line-clamp-2 mt-1">{r.commentaire}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1.5">
                          {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : loading ? (
          <>
            <KpiGridSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div className="h-56 rounded-xl bg-white border border-slate-200 animate-pulse" />
              <div className="h-56 rounded-xl bg-white border border-slate-200 animate-pulse" />
            </div>
          </>
        ) : null}
      </div>
      <LoadingOverlay show={loading} label="Chargement des statistiques..." />
    </div>
  );
}
