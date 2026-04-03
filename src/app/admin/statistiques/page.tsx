"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine, faSpinner, faArrowUp, faArrowDown, faEuro,
  faClipboardList, faBuilding, faTrophy, faMedal,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";

interface MonthlyData {
  month: string;
  revenue: number;
  reservations: number;
}

interface TopFormation {
  titre: string;
  reservationCount: number;
  revenue: number;
}

interface TopCentre {
  nom: string;
  ville: string;
  reservationCount: number;
  revenue: number;
}

interface StatsData {
  revenusPlateforme: number;
  revenusEvolution: number;
  centresActifs: number;
  centresEnAttente: number;
  reservationsCeMois: number;
  reservationsEvolution: number;
  utilisateurs: number;
  ticketsOuverts: number;
  monthlyData: MonthlyData[];
  topFormations: TopFormation[];
  topCentres: TopCentre[];
  growth: {
    revenue: number;
    reservations: number;
  };
}

function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${year.slice(2)}`;
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-gray-500 text-xs">0%</span>;
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
      <FontAwesomeIcon icon={positive ? faArrowUp : faArrowDown} className="text-[10px]" />
      {positive ? "+" : ""}{value}%
    </span>
  );
}

export default function AdminStatistiquesPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Erreur lors du chargement");
        return r.json();
      })
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistiques</h1>
          <p className="text-gray-400 text-sm mt-0.5">Analyses et rapports de la plateforme</p>
        </div>
        <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" />
          <span className="text-sm">Chargement des statistiques...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistiques</h1>
          <p className="text-gray-400 text-sm mt-0.5">Analyses et rapports de la plateforme</p>
        </div>
        <div className="bg-[#0A1628] rounded-xl border border-red-500/20 p-12 text-center">
          <p className="text-red-400 font-medium">Impossible de charger les statistiques</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const monthlyData = stats.monthlyData ?? [];
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);
  const maxReservations = Math.max(...monthlyData.map((d) => d.reservations), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Statistiques</h1>
        <p className="text-gray-400 text-sm mt-0.5">Analyses et rapports de la plateforme</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#0A1628] rounded-xl border border-green-500/20 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-400/10 border border-green-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faEuro} className="text-green-400 text-sm" />
            </div>
            <GrowthBadge value={stats.growth.revenue} />
          </div>
          <p className="text-2xl font-bold text-white">{formatPrice(stats.revenusPlateforme)}</p>
          <p className="text-xs text-gray-500 mt-1">Revenus ce mois</p>
        </div>

        <div className="bg-[#0A1628] rounded-xl border border-purple-500/20 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-400/10 border border-purple-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faClipboardList} className="text-purple-400 text-sm" />
            </div>
            <GrowthBadge value={stats.growth.reservations} />
          </div>
          <p className="text-2xl font-bold text-white">{stats.reservationsCeMois.toLocaleString("fr-FR")}</p>
          <p className="text-xs text-gray-500 mt-1">Reservations ce mois</p>
        </div>

        <div className="bg-[#0A1628] rounded-xl border border-blue-500/20 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 border border-blue-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faBuilding} className="text-blue-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.centresActifs}</p>
          <p className="text-xs text-gray-500 mt-1">Centres actifs</p>
        </div>

        <div className="bg-[#0A1628] rounded-xl border border-yellow-500/20 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faChartLine} className="text-yellow-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.utilisateurs.toLocaleString("fr-FR")}</p>
          <p className="text-xs text-gray-500 mt-1">Utilisateurs inscrits</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-semibold text-sm">Revenus mensuels</h2>
              <p className="text-gray-500 text-xs mt-0.5">Commission plateforme (derniers 6 mois)</p>
            </div>
            <GrowthBadge value={stats.growth.revenue} />
          </div>
          {monthlyData.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">Aucune donnee</div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map((d) => {
                const height = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {d.revenue > 0 ? formatPrice(d.revenue) : "0"}
                    </span>
                    <div className="w-full flex justify-center" style={{ height: "140px" }}>
                      <div
                        className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-green-600 to-green-400 transition-all duration-500 self-end"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{monthLabel(d.month)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reservations Chart */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-semibold text-sm">Reservations mensuelles</h2>
              <p className="text-gray-500 text-xs mt-0.5">Nombre de reservations (derniers 6 mois)</p>
            </div>
            <GrowthBadge value={stats.growth.reservations} />
          </div>
          {monthlyData.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">Aucune donnee</div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map((d) => {
                const height = maxReservations > 0 ? (d.reservations / maxReservations) * 100 : 0;
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {d.reservations}
                    </span>
                    <div className="w-full flex justify-center" style={{ height: "140px" }}>
                      <div
                        className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-500 self-end"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{monthLabel(d.month)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rankings Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Formations */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center gap-2 mb-5">
            <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 text-sm" />
            <h2 className="text-white font-semibold text-sm">Top 5 formations</h2>
          </div>
          {stats.topFormations.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">Aucune donnee disponible</p>
          ) : (
            <div className="space-y-3">
              {stats.topFormations.map((f, i) => {
                const medalColors = ["text-yellow-400", "text-gray-300", "text-orange-400"];
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                      {i < 3 ? (
                        <FontAwesomeIcon icon={faMedal} className={`text-sm ${medalColors[i]}`} />
                      ) : (
                        <span className="text-gray-500 text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{f.titre}</p>
                      <p className="text-gray-500 text-xs">{f.reservationCount} reservation(s)</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-green-400 text-sm font-semibold">{formatPrice(f.revenue)}</p>
                      <p className="text-gray-600 text-[10px]">CA total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Centres */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center gap-2 mb-5">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-400 text-sm" />
            <h2 className="text-white font-semibold text-sm">Top 5 centres par revenus</h2>
          </div>
          {stats.topCentres.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">Aucune donnee disponible</p>
          ) : (
            <div className="space-y-3">
              {stats.topCentres.map((c, i) => {
                const medalColors = ["text-yellow-400", "text-gray-300", "text-orange-400"];
                const maxCentreRevenue = stats.topCentres[0]?.revenue || 1;
                const barWidth = (c.revenue / maxCentreRevenue) * 100;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                      {i < 3 ? (
                        <FontAwesomeIcon icon={faMedal} className={`text-sm ${medalColors[i]}`} />
                      ) : (
                        <span className="text-gray-500 text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{c.nom}</p>
                      <p className="text-gray-500 text-xs">{c.ville} — {c.reservationCount} reservation(s)</p>
                      <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-blue-400 text-sm font-semibold">{formatPrice(c.revenue)}</p>
                      <p className="text-gray-600 text-[10px]">CA total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
