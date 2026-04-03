"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEuro,
  faSpinner,
  faArrowUp,
  faArrowDown,
  faBuilding,
  faFileExport,
  faChartBar,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";

interface MonthlyRevenue {
  month: string;
  label: string;
  reservations: number;
  revenuBrut: number;
  commission: number;
  revenuCentres: number;
}

interface CentreRevenue {
  centreId: string;
  nom: string;
  ville: string;
  reservations: number;
  revenuBrut: number;
  commission: number;
}

interface RevenuData {
  monthly: MonthlyRevenue[];
  parCentre: CentreRevenue[];
  totaux: { revenuBrut: number; commission: number; reservations: number };
}

export default function PlateformeRevenusPage() {
  const [data, setData] = useState<RevenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenus = async () => {
      try {
        setError(null);
        const res = await fetch("/api/admin/revenus?months=6");
        if (!res.ok) throw new Error("Erreur lors du chargement des revenus");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchRevenus();
  }, []);

  const monthly = data?.monthly ?? [];
  const centres = data?.parCentre ?? [];
  const totaux = data?.totaux ?? { revenuBrut: 0, commission: 0, reservations: 0 };

  // Evolution: compare last 2 months
  const currentMonth = monthly.length > 0 ? monthly[monthly.length - 1] : null;
  const previousMonth = monthly.length > 1 ? monthly[monthly.length - 2] : null;
  const evolution = previousMonth && previousMonth.commission > 0
    ? Math.round(((currentMonth!.commission - previousMonth.commission) / previousMonth.commission) * 100)
    : 0;

  const maxMontant = monthly.length > 0 ? Math.max(...monthly.map((m) => m.commission)) : 1;

  const kpis = [
    {
      label: "Commissions totales",
      value: loading ? "..." : formatPrice(totaux.commission),
      sub: "Sur la periode",
      icon: faEuro,
      trend: evolution !== 0 ? `${evolution > 0 ? "+" : ""}${evolution}%` : "",
      trendUp: evolution >= 0,
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-500/20",
    },
    {
      label: "Revenus bruts plateforme",
      value: loading ? "..." : formatPrice(totaux.revenuBrut),
      sub: "Volume total de transactions",
      icon: faChartBar,
      trend: "",
      trendUp: true,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-500/20",
    },
    {
      label: "Centres contribuant",
      value: loading ? "..." : String(centres.length),
      sub: "Centres actifs avec revenus",
      icon: faBuilding,
      trend: "",
      trendUp: true,
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
        <button
          onClick={() => {
            if (!data) return;
            const lines: string[] = [];
            lines.push("=== REVENUS MENSUELS ===");
            lines.push("Mois,Reservations,Revenu brut (EUR),Commission (EUR),Revenu Centres (EUR)");
            for (const m of monthly) {
              lines.push(`${m.label},${m.reservations},${m.revenuBrut.toFixed(2)},${m.commission.toFixed(2)},${m.revenuCentres.toFixed(2)}`);
            }
            lines.push("");
            lines.push("=== PAR CENTRE ===");
            lines.push("Centre,Ville,Reservations,Revenu brut (EUR),Commission (EUR)");
            for (const c of centres) {
              lines.push(`"${c.nom}",${c.ville},${c.reservations},${c.revenuBrut.toFixed(2)},${c.commission.toFixed(2)}`);
            }
            const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `export-revenus-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}
          disabled={loading || !data}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/15 text-blue-400 text-sm font-medium border border-blue-500/20 hover:bg-blue-600/25 transition-colors disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faFileExport} className="text-xs" />
          Exporter
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl p-5 border bg-[#0A1628] ${k.border}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${k.bg} border ${k.border} flex items-center justify-center`}>
                <FontAwesomeIcon icon={k.icon} className={`${k.color} text-sm`} />
              </div>
              {k.trend && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${k.trendUp ? "text-green-400" : "text-red-400"}`}>
                  <FontAwesomeIcon icon={k.trendUp ? faArrowUp : faArrowDown} className="text-[10px]" />
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
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : monthly.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Aucune donnee pour cette periode</p>
          </div>
        ) : (
          <div className="flex items-end gap-3 h-48">
            {monthly.map((m) => {
              const height = maxMontant > 0 ? (m.commission / maxMontant) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-gray-400 text-[10px] font-medium">
                    {formatPrice(m.commission)}
                  </span>
                  <div className="w-full relative" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-xs">{m.label.split(" ")[0]?.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tableau par centre */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h2 className="text-white font-semibold text-sm mb-5">Revenus par centre</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : centres.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">Aucun revenu enregistre</p>
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
                  <th className="text-gray-500 font-medium text-xs pb-3">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {centres.map((c) => (
                  <tr key={c.centreId} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 pr-4 text-white font-medium">{c.nom}</td>
                    <td className="py-3 pr-4 text-gray-400">{c.ville}</td>
                    <td className="py-3 pr-4 text-gray-300">{c.reservations}</td>
                    <td className="py-3 pr-4 text-white font-semibold">{formatPrice(c.revenuBrut)}</td>
                    <td className="py-3 text-green-400 font-semibold">{formatPrice(c.commission)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td className="py-3 pr-4 text-white font-bold">Total</td>
                  <td className="py-3 pr-4"></td>
                  <td className="py-3 pr-4 text-white font-bold">{totaux.reservations}</td>
                  <td className="py-3 pr-4 text-white font-bold">{formatPrice(totaux.revenuBrut)}</td>
                  <td className="py-3 text-green-400 font-bold">{formatPrice(totaux.commission)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
