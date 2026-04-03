"use client";

import { useState, useEffect, useCallback } from "react";
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
  faReceipt,
  faFilter,
  faCheck,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────

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

interface CentrePayment {
  id: string;
  type: string;
  montant: number;
  description: string;
  stripeId: string | null;
  status: string;
  periode: string | null;
  createdAt: string;
  centre: { id: string; nom: string; ville: string };
}

interface CentreEnAttente {
  centreId: string;
  nom: string;
  ville: string;
  montantEnAttente: number;
  count: number;
}

interface PaymentsData {
  payments: CentrePayment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totaux: { paye: number; enAttente: number; echoue: number };
  enAttenteparCentre: CentreEnAttente[];
}

// ─── Component ──────────────────────────────────────────────

type TabKey = "revenus" | "paiements";

export default function PlateformeRevenusPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("revenus");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Revenus</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Suivi des commissions, revenus et paiements centres
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
        <button
          onClick={() => setActiveTab("revenus")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "revenus"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Revenus
        </button>
        <button
          onClick={() => setActiveTab("paiements")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "paiements"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Paiements centres
        </button>
      </div>

      {activeTab === "revenus" && <RevenusTab />}
      {activeTab === "paiements" && <PaiementsCentresTab />}
    </div>
  );
}

// ─── Revenus Tab (original) ─────────────────────────────────

function RevenusTab() {
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

  function exportCSV() {
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
  }

  return (
    <div className="space-y-8">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={exportCSV}
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

// ─── Paiements Centres Tab ──────────────────────────────────

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  COMMISSION: { label: "Commission", color: "text-blue-400", bg: "bg-blue-400/10" },
  ABONNEMENT: { label: "Abonnement", color: "text-purple-400", bg: "bg-purple-400/10" },
  REMBOURSEMENT: { label: "Remboursement", color: "text-orange-400", bg: "bg-orange-400/10" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PAYE: { label: "Paye", color: "text-green-400", bg: "bg-green-400/10" },
  EN_ATTENTE: { label: "En attente", color: "text-orange-400", bg: "bg-orange-400/10" },
  ECHOUE: { label: "Echoue", color: "text-red-400", bg: "bg-red-400/10" },
};

function PaiementsCentresTab() {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [centreFilter, setCentreFilter] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (centreFilter) params.set("centreId", centreFilter);
      const res = await fetch(`/api/admin/payments?${params}`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const json = await res.json();
      if (json.error) throw new Error(typeof json.error === "string" ? json.error : "Erreur");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, centreFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  async function markAsPaid(paymentId: string) {
    setUpdatingId(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: "PAYE" }),
      });
      if (res.ok) {
        await fetchPayments();
      }
    } catch {
      // silently fail
    }
    setUpdatingId(null);
  }

  function formatDateShort(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function exportCSV() {
    if (!data?.payments.length) return;
    const lines = ["Date,Centre,Ville,Type,Description,Montant (EUR),Statut"];
    for (const p of data.payments) {
      lines.push(`${formatDateShort(p.createdAt)},"${p.centre.nom}",${p.centre.ville},${p.type},"${p.description}",${p.montant.toFixed(2)},${p.status}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `paiements-centres-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 border bg-[#0A1628] border-green-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-400/10 border border-green-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} className="text-green-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : formatPrice(data?.totaux.paye ?? 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Total paye</p>
        </div>
        <div className="rounded-xl p-5 border bg-[#0A1628] border-orange-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-400/10 border border-orange-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faClock} className="text-orange-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : formatPrice(data?.totaux.enAttente ?? 0)}</p>
          <p className="text-xs text-gray-500 mt-1">En attente de paiement</p>
        </div>
        <div className="rounded-xl p-5 border bg-[#0A1628] border-red-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-400/10 border border-red-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : formatPrice(data?.totaux.echoue ?? 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Echoues</p>
        </div>
      </div>

      {/* Centres en attente */}
      {data?.enAttenteparCentre && data.enAttenteparCentre.length > 0 && (
        <div className="bg-[#0A1628] rounded-xl border border-orange-500/20 p-5">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} className="text-orange-400 w-4 h-4" />
            Centres avec paiements en attente
          </h3>
          <div className="space-y-2">
            {data.enAttenteparCentre.map((c) => (
              <div
                key={c.centreId}
                className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                style={{ background: "rgba(255,255,255,0.02)" }}
                onClick={() => { setCentreFilter(c.centreId); setPage(1); }}
              >
                <div>
                  <p className="text-sm text-white font-medium">{c.nom}</p>
                  <p className="text-xs text-gray-500">{c.ville} &middot; {c.count} paiement{c.count > 1 ? "s" : ""}</p>
                </div>
                <p className="text-sm font-semibold text-orange-400">{formatPrice(c.montantEnAttente)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <FontAwesomeIcon icon={faFilter} className="text-gray-500 w-3 h-3" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="text-sm rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="">Tous les types</option>
            <option value="COMMISSION">Commissions</option>
            <option value="ABONNEMENT">Abonnements</option>
            <option value="REMBOURSEMENT">Remboursements</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="">Tous les statuts</option>
            <option value="PAYE">Paye</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="ECHOUE">Echoue</option>
          </select>
          {centreFilter && (
            <button
              onClick={() => { setCentreFilter(""); setPage(1); }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              Filtre centre actif &times;
            </button>
          )}
        </div>
        <button
          onClick={exportCSV}
          disabled={!data?.payments.length}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/15 text-blue-400 text-sm font-medium border border-blue-500/20 hover:bg-blue-600/25 transition-colors disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faFileExport} className="text-xs" />
          Exporter CSV
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#0A1628] overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-12 justify-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : !data?.payments.length ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faReceipt} className="text-gray-700 text-2xl mb-3" />
            <p className="text-gray-500 text-sm">Aucun paiement trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/8">
                  <th className="text-gray-500 font-medium text-xs px-4 py-3">Date</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3">Centre</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3">Type</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3">Description</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3 text-right">Montant</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3 text-right">Statut</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDateShort(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm">{p.centre.nom}</p>
                      <p className="text-gray-500 text-xs">{p.centre.ville}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_LABELS[p.type]?.bg ?? "bg-gray-400/10"} ${TYPE_LABELS[p.type]?.color ?? "text-gray-400"}`}>
                        {TYPE_LABELS[p.type]?.label ?? p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate">{p.description}</td>
                    <td className="px-4 py-3 text-white font-semibold text-right">{formatPrice(p.montant)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[p.status]?.bg ?? "bg-gray-400/10"} ${STATUS_LABELS[p.status]?.color ?? "text-gray-400"}`}>
                        {STATUS_LABELS[p.status]?.label ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "EN_ATTENTE" && (
                        <button
                          onClick={() => markAsPaid(p.id)}
                          disabled={updatingId === p.id}
                          className="text-xs px-3 py-1 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-colors disabled:opacity-50"
                        >
                          {updatingId === p.id ? (
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />
                          ) : (
                            "Marquer paye"
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
            <p className="text-xs text-gray-500">
              Page {data.page} sur {data.totalPages} ({data.total} resultats)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                Precedent
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= (data?.totalPages ?? 1)}
                className="px-3 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
