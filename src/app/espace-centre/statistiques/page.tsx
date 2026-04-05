"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEuroSign,
  faCalendarDays,
  faChartPie,
  faStar,
  faSpinner,
  faTriangleExclamation,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";

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

// ─── STAR COMPONENT ─────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          className={`text-xs ${i < Math.round(rating) ? "text-yellow-400" : "text-gray-700"}`}
        />
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement des statistiques...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-red-400" />
        <p className="text-sm text-red-400">{error ?? "Erreur inconnue"}</p>
        <button
          onClick={() => { setLoading(true); setError(null); location.reload(); }}
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Reessayer
        </button>
      </div>
    );
  }

  const maxMonthlyRevenue = Math.max(...stats.monthlyRevenue.map((m) => m.revenue), 1);
  const maxFormationRes = Math.max(...(stats.topFormations.map((f) => f.reservations) || [1]), 1);
  const totalStatus =
    stats.statusBreakdown.confirmees +
    stats.statusBreakdown.enAttente +
    stats.statusBreakdown.annulees +
    stats.statusBreakdown.terminees || 1;

  const statusItems = [
    { label: "Confirmees", value: stats.statusBreakdown.confirmees, color: "bg-green-500" },
    { label: "En attente", value: stats.statusBreakdown.enAttente, color: "bg-yellow-500" },
    { label: "Annulees", value: stats.statusBreakdown.annulees, color: "bg-red-500" },
    { label: "Terminees", value: stats.statusBreakdown.terminees, color: "bg-gray-500" },
  ];

  const kpis = [
    {
      label: "Revenus du mois",
      value: formatPrice(stats.revenusNets),
      icon: faEuroSign,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Reservations du mois",
      value: String(stats.reservationsCeMois),
      icon: faCalendarDays,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Taux de remplissage",
      value: `${stats.tauxRemplissage}%`,
      icon: faChartPie,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Note moyenne",
      value: stats.averageRating > 0 ? `${stats.averageRating}/5` : "N/A",
      icon: faStar,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-white mb-1">
          Statistiques
        </h1>
        <p className="text-gray-500 text-sm">
          Analyses detaillees de votre activite
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl p-4 sm:p-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.bg}`}>
                <FontAwesomeIcon icon={k.icon} className={`w-4 h-4 ${k.color}`} />
              </div>
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-gray-700 w-3.5 h-3.5" />
            </div>
            <p className="font-bold text-xl sm:text-2xl text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* ── Revenus mensuels (bar chart) ── */}
        <div
          className="rounded-xl p-5 sm:p-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h3 className="text-white font-semibold text-sm mb-5">
            Revenus mensuels (6 derniers mois)
          </h3>
          <div className="flex items-end gap-2 sm:gap-3 h-40">
            {stats.monthlyRevenue.map((m) => {
              const pct = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500 mb-1">
                    {formatPrice(m.revenue)}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-10 rounded-t bg-blue-500 transition-all duration-500"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">
                    {m.label.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Reservations par formation (horizontal bars) ���─ */}
        <div
          className="rounded-xl p-5 sm:p-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h3 className="text-white font-semibold text-sm mb-5">
            Reservations par formation
          </h3>
          {stats.topFormations.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              Aucune donnee disponible
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topFormations.map((f) => {
                const pct = (f.reservations / maxFormationRes) * 100;
                return (
                  <div key={f.titre}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-300 truncate max-w-[70%]">{f.titre}</span>
                      <span className="text-gray-500 shrink-0 ml-2">{f.reservations} res.</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Taux d'occupation des sessions ── */}
        <div
          className="rounded-xl p-5 sm:p-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h3 className="text-white font-semibold text-sm mb-5">
            Taux d&apos;occupation des sessions
          </h3>
          {stats.sessionOccupancy.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              Aucune session active
            </p>
          ) : (
            <div className="space-y-3 max-h-52 overflow-y-auto">
              {stats.sessionOccupancy.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-300 truncate max-w-[60%]">
                      {s.formation}
                    </span>
                    <span
                      className={`shrink-0 ml-2 font-semibold ${
                        s.taux >= 80 ? "text-green-400" : s.taux >= 50 ? "text-yellow-400" : "text-red-400"
                      }`}
                    >
                      {s.taux}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.taux >= 80 ? "bg-green-500" : s.taux >= 50 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${s.taux}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {s.placesTotal - s.placesRestantes}/{s.placesTotal} places &bull;{" "}
                    {new Date(s.dateDebut).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Repartition par statut ── */}
        <div
          className="rounded-xl p-5 sm:p-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h3 className="text-white font-semibold text-sm mb-5">
            Repartition par statut
          </h3>
          {/* Stacked bar */}
          <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex mb-4">
            {statusItems.map((s) => (
              <div
                key={s.label}
                className={`h-full ${s.color} transition-all duration-500`}
                style={{ width: `${(s.value / totalStatus) * 100}%` }}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-3">
            {statusItems.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm ${s.color} shrink-0`} />
                <div>
                  <span className="text-xs text-gray-300">{s.label}</span>
                  <span className="text-xs text-gray-500 ml-1">({s.value})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* ── Top 5 formations par revenu ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <h3 className="text-white font-semibold text-sm">
              Top 5 formations par revenu
            </h3>
          </div>
          {stats.topFormations.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              Aucune donnee disponible
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="text-gray-500 font-medium text-xs px-6 py-3">Formation</th>
                      <th className="text-gray-500 font-medium text-xs px-6 py-3 text-right">Reservations</th>
                      <th className="text-gray-500 font-medium text-xs px-6 py-3 text-right">Revenu net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {stats.topFormations.map((f, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3 text-gray-300 truncate max-w-[200px]">{f.titre}</td>
                        <td className="px-6 py-3 text-gray-400 text-right">{f.reservations}</td>
                        <td className="px-6 py-3 text-green-400 font-semibold text-right">{formatPrice(f.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {stats.topFormations.map((f, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-gray-300 text-sm truncate">{f.titre}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{f.reservations} reservation(s)</span>
                      <span className="text-xs text-green-400 font-semibold">{formatPrice(f.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Avis recents ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <h3 className="text-white font-semibold text-sm">
              Avis recents
            </h3>
          </div>
          {stats.recentReviews.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              Aucun avis pour le moment
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {stats.recentReviews.map((r, i) => (
                <div key={i} className="px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{r.user}</span>
                    <Stars rating={r.note} />
                  </div>
                  {r.commentaire && (
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">{r.commentaire}</p>
                  )}
                  <p className="text-[10px] text-gray-600 mt-1">
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
    </div>
  );
}
