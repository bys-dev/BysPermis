"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEuro,
  faSpinner,
  faArrowUp,
  faBuilding,
  faFileExport,
  faChartBar,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";

interface RevenueStats {
  totalCommissions: number;
  commissionsEvolution: number;
  revenusTotal: number;
  centresActifs: number;
}

interface CentreRevenue {
  id: string;
  nom: string;
  ville: string;
  reservations: number;
  revenuBrut: number;
  commission: number;
}

interface MonthlyData {
  mois: string;
  montant: number;
}

const MOCK_STATS: RevenueStats = {
  totalCommissions: 18420,
  commissionsEvolution: 12,
  revenusTotal: 184200,
  centresActifs: 47,
};

const MOCK_CENTRES: CentreRevenue[] = [
  { id: "1", nom: "BYS Formation Osny", ville: "Osny", reservations: 312, revenuBrut: 62400, commission: 6240 },
  { id: "2", nom: "Auto-Ecole Montmartre", ville: "Paris", reservations: 245, revenuBrut: 48600, commission: 4860 },
  { id: "3", nom: "BYS Formation Cergy", ville: "Cergy", reservations: 189, revenuBrut: 37800, commission: 3780 },
  { id: "4", nom: "Centre Conduite Nantes", ville: "Nantes", reservations: 156, revenuBrut: 31200, commission: 3120 },
  { id: "5", nom: "Auto-Ecole Bordelaise", ville: "Bordeaux", reservations: 98, revenuBrut: 19600, commission: 1960 },
];

const MOCK_MONTHLY: MonthlyData[] = [
  { mois: "Oct", montant: 12400 },
  { mois: "Nov", montant: 14200 },
  { mois: "Dec", montant: 11800 },
  { mois: "Jan", montant: 15600 },
  { mois: "Fev", montant: 16900 },
  { mois: "Mar", montant: 18420 },
];

export default function PlateformeRevenusPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [centres] = useState<CentreRevenue[]>(MOCK_CENTRES);
  const [monthly] = useState<MonthlyData[]>(MOCK_MONTHLY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.revenusPlateforme === "number") {
          setStats({
            totalCommissions: data.revenusPlateforme,
            commissionsEvolution: data.revenusEvolution ?? 0,
            revenusTotal: data.revenusPlateforme * 10,
            centresActifs: data.centresActifs ?? 0,
          });
        } else {
          setStats(MOCK_STATS);
        }
      })
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  const s = stats ?? MOCK_STATS;
  const maxMontant = Math.max(...monthly.map((m) => m.montant));

  const kpis = [
    {
      label: "Commissions totales",
      value: loading ? "..." : formatPrice(s.totalCommissions),
      sub: "Ce mois",
      icon: faEuro,
      trend: `+${s.commissionsEvolution}%`,
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-500/20",
    },
    {
      label: "Revenus bruts plateforme",
      value: loading ? "..." : formatPrice(s.revenusTotal),
      sub: "Volume total de transactions",
      icon: faChartBar,
      trend: "",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-500/20",
    },
    {
      label: "Centres contribuant",
      value: loading ? "..." : String(s.centresActifs),
      sub: "Centres actifs avec revenus",
      icon: faBuilding,
      trend: "",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenus</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Suivi des commissions et revenus de la plateforme
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/15 text-blue-400 text-sm font-medium border border-blue-500/20 hover:bg-blue-600/25 transition-colors">
          <FontAwesomeIcon icon={faFileExport} className="text-xs" />
          Exporter
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl p-5 border bg-[#0A1628] ${k.border}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${k.bg} border ${k.border} flex items-center justify-center`}>
                <FontAwesomeIcon icon={k.icon} className={`${k.color} text-sm`} />
              </div>
              {k.trend && (
                <div className="flex items-center gap-1 text-xs font-semibold text-green-400">
                  <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" />
                  {k.trend}
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            <p className="text-[11px] text-gray-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Graphique mensuel */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h2 className="text-white font-semibold text-sm mb-6">Commissions mensuelles</h2>
        <div className="flex items-end gap-3 h-48">
          {monthly.map((m) => {
            const height = maxMontant > 0 ? (m.montant / maxMontant) * 100 : 0;
            return (
              <div key={m.mois} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-gray-400 text-[10px] font-medium">
                  {formatPrice(m.montant)}
                </span>
                <div className="w-full relative" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-gray-500 text-xs">{m.mois}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tableau par centre */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h2 className="text-white font-semibold text-sm mb-5">Revenus par centre</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Centre</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Ville</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Reservations</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Revenu brut</th>
                  <th className="text-gray-500 font-medium text-xs pb-3">Commission (10%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {centres.map((c) => (
                  <tr key={c.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 pr-4 text-white font-medium">{c.nom}</td>
                    <td className="py-3 pr-4 text-gray-400">{c.ville}</td>
                    <td className="py-3 pr-4 text-gray-300">{c.reservations}</td>
                    <td className="py-3 pr-4 text-white font-semibold">{formatPrice(c.revenuBrut)}</td>
                    <td className="py-3 text-green-400 font-semibold">{formatPrice(c.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
