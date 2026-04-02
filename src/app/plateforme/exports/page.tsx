"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faSpinner,
  faDownload,
  faCalendar,
  faEuro,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";

interface MonthlyRevenue {
  mois: string;
  label: string;
  reservations: number;
  revenuBrut: number;
  commission: number;
}

interface CentreCommission {
  id: string;
  nom: string;
  ville: string;
  reservations: number;
  revenuBrut: number;
  commission: number;
}

const MOIS_LABELS = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

const MOCK_MONTHLY: MonthlyRevenue[] = [
  { mois: "2026-01", label: "Janvier 2026", reservations: 980, revenuBrut: 124000, commission: 12400 },
  { mois: "2026-02", label: "Fevrier 2026", reservations: 1120, revenuBrut: 142000, commission: 14200 },
  { mois: "2026-03", label: "Mars 2026", reservations: 1284, revenuBrut: 184200, commission: 18420 },
];

const MOCK_CENTRES: CentreCommission[] = [
  { id: "1", nom: "BYS Formation Osny", ville: "Osny", reservations: 312, revenuBrut: 62400, commission: 6240 },
  { id: "2", nom: "Auto-Ecole Montmartre", ville: "Paris", reservations: 245, revenuBrut: 48600, commission: 4860 },
  { id: "3", nom: "BYS Formation Cergy", ville: "Cergy", reservations: 189, revenuBrut: 37800, commission: 3780 },
  { id: "4", nom: "Centre Conduite Nantes", ville: "Nantes", reservations: 156, revenuBrut: 31200, commission: 3120 },
  { id: "5", nom: "Auto-Ecole Bordelaise", ville: "Bordeaux", reservations: 98, revenuBrut: 19600, commission: 1960 },
];

function generateCSV(monthly: MonthlyRevenue[], centres: CentreCommission[]): string {
  const lines: string[] = [];

  // Section: Revenus mensuels
  lines.push("=== REVENUS MENSUELS ===");
  lines.push("Mois,Reservations,Revenu brut (EUR),Commission (EUR)");
  for (const m of monthly) {
    lines.push(`${m.label},${m.reservations},${(m.revenuBrut / 100).toFixed(2)},${(m.commission / 100).toFixed(2)}`);
  }

  lines.push("");

  // Section: Commissions par centre
  lines.push("=== COMMISSIONS PAR CENTRE ===");
  lines.push("Centre,Ville,Reservations,Revenu brut (EUR),Commission (EUR)");
  for (const c of centres) {
    lines.push(`"${c.nom}",${c.ville},${c.reservations},${(c.revenuBrut / 100).toFixed(2)},${(c.commission / 100).toFixed(2)}`);
  }

  return lines.join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PlateformeExportsPage() {
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [centres, setCentres] = useState<CentreCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(() => {
        // L'API ne retourne pas encore les donnees mensuelles detaillees, on utilise les mocks
        setMonthly(MOCK_MONTHLY);
        setCentres(MOCK_CENTRES);
      })
      .catch(() => {
        setMonthly(MOCK_MONTHLY);
        setCentres(MOCK_CENTRES);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalRevenuBrut = monthly.reduce((sum, m) => sum + m.revenuBrut, 0);
  const totalCommissions = monthly.reduce((sum, m) => sum + m.commission, 0);
  const totalReservations = monthly.reduce((sum, m) => sum + m.reservations, 0);

  const handleExportCSV = () => {
    const csv = generateCSV(monthly, centres);
    const filename = `export-byspermis-${MOIS_LABELS[selectedMonth]?.toLowerCase() ?? "mois"}-${selectedYear}.csv`;
    downloadCSV(csv, filename);
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Exports</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Exporter les donnees financieres de la plateforme
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faDownload} className="text-xs" />
          Exporter CSV
        </button>
      </div>

      {/* Selecteur de periode */}
      <div className="flex items-center gap-3 flex-wrap">
        <FontAwesomeIcon icon={faCalendar} className="text-gray-500 text-sm" />
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="bg-[#0A1628] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
        >
          {MOIS_LABELS.map((label, i) => (
            <option key={i} value={i}>{label}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-[#0A1628] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-gray-500 text-xs ml-2">
          Periode selectionnee : {MOIS_LABELS[selectedMonth]} {selectedYear}
        </span>
      </div>

      {/* KPIs resume */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 border bg-[#0A1628] border-green-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-400/10 border border-green-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faEuro} className="text-green-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : formatPrice(totalCommissions)}</p>
          <p className="text-xs text-gray-500 mt-1">Total commissions</p>
        </div>
        <div className="rounded-xl p-5 border bg-[#0A1628] border-blue-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 border border-blue-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faFileExport} className="text-blue-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : formatPrice(totalRevenuBrut)}</p>
          <p className="text-xs text-gray-500 mt-1">Revenu brut total</p>
        </div>
        <div className="rounded-xl p-5 border bg-[#0A1628] border-purple-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-400/10 border border-purple-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faBuilding} className="text-purple-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : totalReservations.toLocaleString("fr-FR")}</p>
          <p className="text-xs text-gray-500 mt-1">Total reservations</p>
        </div>
      </div>

      {/* Tableau revenus mensuels */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h2 className="text-white font-semibold text-sm mb-5">Resume mensuel des revenus</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Mois</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Reservations</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Revenu brut</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Commission (10%)</th>
                  <th className="text-gray-500 font-medium text-xs pb-3">Taux commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {monthly.map((m) => (
                  <tr key={m.mois} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 pr-4 text-white font-medium">{m.label}</td>
                    <td className="py-3 pr-4 text-gray-300">{m.reservations.toLocaleString("fr-FR")}</td>
                    <td className="py-3 pr-4 text-white font-semibold">{formatPrice(m.revenuBrut)}</td>
                    <td className="py-3 pr-4 text-green-400 font-semibold">{formatPrice(m.commission)}</td>
                    <td className="py-3 text-gray-400">10%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td className="py-3 pr-4 text-white font-bold">Total</td>
                  <td className="py-3 pr-4 text-white font-bold">{totalReservations.toLocaleString("fr-FR")}</td>
                  <td className="py-3 pr-4 text-white font-bold">{formatPrice(totalRevenuBrut)}</td>
                  <td className="py-3 pr-4 text-green-400 font-bold">{formatPrice(totalCommissions)}</td>
                  <td className="py-3 text-gray-400">10%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Tableau commissions par centre */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-sm">Commissions par centre</h2>
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/15 text-blue-400 text-xs font-medium border border-blue-500/20 hover:bg-blue-600/25 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faDownload} className="text-[10px]" />
            CSV
          </button>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
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
                  <th className="text-gray-500 font-medium text-xs pb-3">Commission</th>
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
