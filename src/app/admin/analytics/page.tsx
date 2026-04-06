"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faSpinner,
  faCrown,
  faEuro,
  faUsers,
  faBuilding,
  faBolt,
  faArrowUp,
  faArrowDown,
  faMinus,
  faStar,
  faTag,
  faPercent,
  faChartLine,
  faTicket,
  faFire,
  faUserGroup,
  faCircleCheck,
  faRotate,
  faGaugeHigh,
  faRankingStar,
  faArrowTrendUp,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface MonthlyRevenue {
  month: string;
  label: string;
  total: number;
  commission: number;
  abonnement: number;
  reservations: number;
}

interface MonthlyCount {
  month: string;
  label: string;
  count: number;
}

interface AnalyticsData {
  revenue: {
    monthly: MonthlyRevenue[];
    byCategory: { nom: string; revenue: number; count: number }[];
    avgTicket: { current: number; previous: number };
    mrr: number;
    totalCommission12m: number;
    totalAbonnement12m: number;
  };
  users: {
    total: number;
    monthlyNew: MonthlyCount[];
    retention: number;
    conversion: number;
    activeThisMonth: number;
    funnel: {
      inscrits: number;
      premiereReservation: number;
      deuxiemeReservation: number;
      fideles: number;
    };
  };
  centres: {
    total: number;
    byStatus: { actif: number; enAttente: number; suspendu: number };
    avgCompletion: number;
    topByRevenue: {
      id: string;
      nom: string;
      ville: string;
      revenue: number;
      commission: number;
      reservations: number;
      rating: number | null;
      reviewCount: number;
    }[];
    growth: MonthlyCount[];
    avgFillRate: number;
  };
  formations: {
    total: number;
    topPopular: { titre: string; count: number; revenue: number; categorie: string }[];
    bottomPopular: { titre: string; count: number; revenue: number; categorie: string }[];
    bestRated: { titre: string; rating: number; reviewCount: number }[];
    worstRated: { titre: string; rating: number; reviewCount: number }[];
    categoryDistribution: { nom: string; count: number }[];
    avgPriceByCategory: { nom: string; avgPrice: number; count: number }[];
  };
  promos: {
    totalUsedThisMonth: number;
    revenueImpact: number;
    activeCount: number;
  };
  kpiComparisons: {
    revenue: { current: number; previous: number; change: number };
    reservations: { current: number; previous: number; change: number };
    newUsers: { current: number; previous: number; change: number };
    newCentres: { current: number; previous: number; change: number };
    avgTicket: { current: number; previous: number; change: number };
    activeUsers: { current: number; previous: number; change: number };
  };
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function fmtNum(n: number): string {
  return n.toLocaleString("fr-FR");
}

function fmtPct(n: number): string {
  return `${n.toLocaleString("fr-FR")}%`;
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
        <FontAwesomeIcon icon={faMinus} className="text-[10px]" />
        0%
      </span>
    );
  }
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
      <FontAwesomeIcon icon={isPositive ? faArrowUp : faArrowDown} className="text-[10px]" />
      {isPositive ? "+" : ""}{value}%
    </span>
  );
}

function BarChart({
  data,
  maxVal,
  color = "bg-blue-500",
  secondaryData,
  secondaryColor = "bg-yellow-500",
  height = "h-32",
}: {
  data: { label: string; value: number }[];
  maxVal?: number;
  color?: string;
  secondaryData?: { label: string; value: number }[];
  secondaryColor?: string;
  height?: string;
}) {
  const max = maxVal ?? Math.max(...data.map((d) => d.value + (secondaryData?.find((s) => s.label === d.label)?.value ?? 0)), 1);
  return (
    <div className={`flex items-end gap-1 ${height}`}>
      {data.map((d, i) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0;
        const secVal = secondaryData?.find((s) => s.label === d.label)?.value ?? 0;
        const secPct = max > 0 ? (secVal / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
            <div className="w-full flex flex-col items-stretch justify-end" style={{ height: "100%" }}>
              {secondaryData && secPct > 0 && (
                <div
                  className={`w-full ${secondaryColor} rounded-t opacity-70`}
                  style={{ height: `${secPct}%`, minHeight: secPct > 0 ? "2px" : "0" }}
                  title={`${d.label}: ${fmtNum(secVal)}`}
                />
              )}
              <div
                className={`w-full ${color} rounded-t-sm`}
                style={{ height: `${pct}%`, minHeight: pct > 0 ? "2px" : "0" }}
                title={`${d.label}: ${fmtNum(d.value)}`}
              />
            </div>
            <span className="text-[9px] text-gray-600 truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({ label, value, max, color = "bg-blue-500", suffix = "" }: {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 truncate max-w-[60%]">{label}</span>
        <span className="text-xs text-white font-semibold">{suffix === "EUR" ? formatPrice(value) : fmtNum(value)}{suffix && suffix !== "EUR" ? suffix : ""}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, border, bg, trend }: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof faEuro;
  color: string;
  border: string;
  bg: string;
  trend?: number;
}) {
  return (
    <div className={`rounded-xl p-4 border bg-[#0A1628] ${border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
          <FontAwesomeIcon icon={icon} className={`${color} text-sm`} />
        </div>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════

function TabRevenus({ data }: { data: AnalyticsData }) {
  const { revenue, kpiComparisons } = data;
  const maxMonthlyTotal = Math.max(...revenue.monthly.map((m) => m.commission + m.abonnement), 1);
  const maxCatRevenue = Math.max(...revenue.byCategory.map((c) => c.revenue), 1);

  const totalRevenue12m = revenue.totalCommission12m + revenue.totalAbonnement12m;
  const commissionPct = totalRevenue12m > 0 ? Math.round((revenue.totalCommission12m / totalRevenue12m) * 100) : 0;
  const abonnementPct = 100 - commissionPct;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Revenus ce mois"
          value={formatPrice(kpiComparisons.revenue.current)}
          sub="Commission plateforme"
          icon={faEuro}
          color="text-green-400" bg="bg-green-400/10" border="border-green-500/20"
          trend={kpiComparisons.revenue.change}
        />
        <StatCard
          label="Ticket moyen"
          value={formatPrice(revenue.avgTicket.current)}
          sub="Montant moyen par reservation"
          icon={faTicket}
          color="text-blue-400" bg="bg-blue-400/10" border="border-blue-500/20"
          trend={kpiComparisons.avgTicket.change}
        />
        <StatCard
          label="MRR Abonnements"
          value={formatPrice(revenue.mrr)}
          sub="Revenus recurrents mensuels"
          icon={faRotate}
          color="text-purple-400" bg="bg-purple-400/10" border="border-purple-500/20"
        />
        <StatCard
          label="Reservations ce mois"
          value={fmtNum(kpiComparisons.reservations.current)}
          sub={`vs ${fmtNum(kpiComparisons.reservations.previous)} le mois dernier`}
          icon={faChartLine}
          color="text-yellow-400" bg="bg-yellow-400/10" border="border-yellow-500/20"
          trend={kpiComparisons.reservations.change}
        />
      </div>

      {/* Revenue chart + split */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly revenue chart */}
        <div className="lg:col-span-2 bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Revenus mensuels</h3>
              <p className="text-gray-600 text-[11px] mt-0.5">Commissions + Abonnements (12 derniers mois)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-[10px] text-gray-500">Commissions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500 opacity-70" />
                <span className="text-[10px] text-gray-500">Abonnements</span>
              </div>
            </div>
          </div>
          <BarChart
            data={revenue.monthly.map((m) => ({ label: m.label, value: m.commission }))}
            secondaryData={revenue.monthly.map((m) => ({ label: m.label, value: m.abonnement }))}
            maxVal={maxMonthlyTotal}
            color="bg-blue-500"
            secondaryColor="bg-yellow-500"
            height="h-44"
          />
        </div>

        {/* Revenue split */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Repartition revenus (12 mois)</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Commissions</span>
                <span className="text-xs text-blue-400 font-semibold">{formatPrice(revenue.totalCommission12m)}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${commissionPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">{commissionPct}% du total</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Abonnements</span>
                <span className="text-xs text-yellow-400 font-semibold">{formatPrice(revenue.totalAbonnement12m)}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-yellow-500 transition-all duration-700" style={{ width: `${abonnementPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">{abonnementPct}% du total</p>
            </div>
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Total 12 mois</span>
                <span className="text-sm text-white font-bold">{formatPrice(totalRevenue12m)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Average ticket trend + Revenue by category */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ticket moyen trend */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <h3 className="text-white font-semibold text-sm mb-1">Evolution du ticket moyen</h3>
          <p className="text-gray-600 text-[11px] mb-4">Montant moyen par reservation par mois</p>
          <BarChart
            data={revenue.monthly.map((m) => ({
              label: m.label,
              value: m.reservations > 0 ? Math.round(m.total / m.reservations) : 0,
            }))}
            color="bg-emerald-500"
            height="h-32"
          />
        </div>

        {/* Revenue by category */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Revenus par categorie</h3>
          <div className="space-y-3">
            {revenue.byCategory.slice(0, 8).map((c, i) => (
              <HorizontalBar
                key={i}
                label={c.nom}
                value={c.revenue}
                max={maxCatRevenue}
                color={["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-yellow-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500", "bg-red-500"][i % 8]}
                suffix="EUR"
              />
            ))}
            {revenue.byCategory.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-6">Aucune donnee disponible</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabUtilisateurs({ data }: { data: AnalyticsData }) {
  const { users, kpiComparisons } = data;
  const maxNewUsers = Math.max(...users.monthlyNew.map((m) => m.count), 1);

  // Funnel percentages
  const funnelSteps = [
    { label: "Inscrits", value: users.funnel.inscrits, color: "bg-blue-500", icon: faUsers },
    { label: "1ere reservation", value: users.funnel.premiereReservation, color: "bg-purple-500", icon: faCircleCheck },
    { label: "2eme reservation", value: users.funnel.deuxiemeReservation, color: "bg-emerald-500", icon: faRotate },
    { label: "Fideles (3+)", value: users.funnel.fideles, color: "bg-yellow-500", icon: faFire },
  ];
  const funnelMax = Math.max(users.funnel.inscrits, 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Utilisateurs totaux"
          value={fmtNum(users.total)}
          sub="Eleves inscrits"
          icon={faUsers}
          color="text-blue-400" bg="bg-blue-400/10" border="border-blue-500/20"
        />
        <StatCard
          label="Nouveaux ce mois"
          value={fmtNum(kpiComparisons.newUsers.current)}
          sub={`vs ${fmtNum(kpiComparisons.newUsers.previous)} le mois dernier`}
          icon={faUserGroup}
          color="text-purple-400" bg="bg-purple-400/10" border="border-purple-500/20"
          trend={kpiComparisons.newUsers.change}
        />
        <StatCard
          label="Taux de conversion"
          value={fmtPct(users.conversion)}
          sub="Inscrits ayant reserve"
          icon={faArrowTrendUp}
          color="text-emerald-400" bg="bg-emerald-400/10" border="border-emerald-500/20"
        />
        <StatCard
          label="Taux de retention"
          value={fmtPct(users.retention)}
          sub="2+ reservations / total"
          icon={faRotate}
          color="text-yellow-400" bg="bg-yellow-400/10" border="border-yellow-500/20"
        />
      </div>

      {/* New users chart + funnel */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly new users */}
        <div className="lg:col-span-2 bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Nouvelles inscriptions</h3>
              <p className="text-gray-600 text-[11px] mt-0.5">12 derniers mois</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FontAwesomeIcon icon={faUsers} className="text-blue-400" />
              {fmtNum(users.total)} total
            </div>
          </div>
          <BarChart
            data={users.monthlyNew.map((m) => ({ label: m.label, value: m.count }))}
            maxVal={maxNewUsers}
            color="bg-blue-500"
            height="h-44"
          />
        </div>

        {/* Funnel */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Entonnoir de conversion</h3>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => {
              const pct = funnelMax > 0 ? Math.round((step.value / funnelMax) * 100) : 0;
              const dropOff = i > 0 && funnelSteps[i - 1].value > 0
                ? Math.round(((funnelSteps[i - 1].value - step.value) / funnelSteps[i - 1].value) * 100)
                : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={step.icon} className="text-gray-500 text-xs w-3.5" />
                      <span className="text-xs text-gray-400">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white font-semibold">{fmtNum(step.value)}</span>
                      {i > 0 && dropOff > 0 && (
                        <span className="text-[10px] text-red-400/70">-{dropOff}%</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${step.color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Actifs ce mois</span>
              <span className="text-sm text-white font-bold">{fmtNum(users.activeThisMonth)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabCentres({ data }: { data: AnalyticsData }) {
  const { centres, kpiComparisons } = data;
  const totalCentres = centres.byStatus.actif + centres.byStatus.enAttente + centres.byStatus.suspendu;
  const maxGrowth = Math.max(...centres.growth.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Centres totaux"
          value={fmtNum(centres.total)}
          icon={faBuilding}
          color="text-blue-400" bg="bg-blue-400/10" border="border-blue-500/20"
          trend={kpiComparisons.newCentres.change}
        />
        <StatCard
          label="Centres actifs"
          value={fmtNum(centres.byStatus.actif)}
          sub={`${centres.byStatus.enAttente} en attente`}
          icon={faCircleCheck}
          color="text-green-400" bg="bg-green-400/10" border="border-green-500/20"
        />
        <StatCard
          label="Profil moyen"
          value={fmtPct(centres.avgCompletion)}
          sub="Completion moyenne"
          icon={faGaugeHigh}
          color="text-purple-400" bg="bg-purple-400/10" border="border-purple-500/20"
        />
        <StatCard
          label="Taux remplissage"
          value={fmtPct(centres.avgFillRate)}
          sub="Moyenne toutes sessions"
          icon={faChartBar}
          color="text-yellow-400" bg="bg-yellow-400/10" border="border-yellow-500/20"
        />
      </div>

      {/* Status distribution + Growth */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status bars */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Repartition par statut</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">Actifs</span>
                <span className="text-xs text-green-400 font-semibold">{fmtNum(centres.byStatus.actif)}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${totalCentres > 0 ? (centres.byStatus.actif / totalCentres) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">En attente</span>
                <span className="text-xs text-yellow-400 font-semibold">{fmtNum(centres.byStatus.enAttente)}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-yellow-500 transition-all duration-500" style={{ width: `${totalCentres > 0 ? (centres.byStatus.enAttente / totalCentres) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">Suspendus</span>
                <span className="text-xs text-red-400 font-semibold">{fmtNum(centres.byStatus.suspendu)}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: `${totalCentres > 0 ? (centres.byStatus.suspendu / totalCentres) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Total centres</span>
              <span className="text-sm text-white font-bold">{fmtNum(totalCentres)}</span>
            </div>
          </div>
        </div>

        {/* Growth chart */}
        <div className="lg:col-span-2 bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Croissance des centres</h3>
              <p className="text-gray-600 text-[11px] mt-0.5">Nouveaux centres par mois (12 mois)</p>
            </div>
          </div>
          <BarChart
            data={centres.growth.map((m) => ({ label: m.label, value: m.count }))}
            maxVal={maxGrowth}
            color="bg-purple-500"
            height="h-36"
          />
        </div>
      </div>

      {/* Top 10 centres table */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-sm">Top 10 centres par chiffre d&apos;affaires</h3>
            <p className="text-gray-600 text-[11px] mt-0.5">12 derniers mois</p>
          </div>
          <FontAwesomeIcon icon={faRankingStar} className="text-yellow-400/50" />
        </div>
        {centres.topByRevenue.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Aucune donnee disponible</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">#</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Centre</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Ville</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4 text-right">CA</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4 text-right">Commission</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4 text-right">Reservations</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 text-right">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {centres.topByRevenue.map((c, i) => (
                  <tr key={c.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold
                        ${i === 0 ? "bg-yellow-400/15 text-yellow-400 border border-yellow-500/20" :
                          i === 1 ? "bg-gray-400/10 text-gray-300 border border-gray-500/20" :
                          i === 2 ? "bg-orange-400/10 text-orange-400 border border-orange-500/20" :
                          "bg-white/5 text-gray-500 border border-white/10"}`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-white font-medium">{c.nom}</td>
                    <td className="py-2.5 pr-4 text-gray-400">{c.ville}</td>
                    <td className="py-2.5 pr-4 text-white font-semibold text-right">{formatPrice(c.revenue)}</td>
                    <td className="py-2.5 pr-4 text-green-400 font-semibold text-right">{formatPrice(c.commission)}</td>
                    <td className="py-2.5 pr-4 text-gray-400 text-right">{fmtNum(c.reservations)}</td>
                    <td className="py-2.5 text-right">
                      {c.rating ? (
                        <span className="inline-flex items-center gap-1 text-yellow-400">
                          <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                          <span className="text-xs font-semibold">{c.rating}</span>
                          <span className="text-[10px] text-gray-600">({c.reviewCount})</span>
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">--</span>
                      )}
                    </td>
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

function TabPerformances({ data }: { data: AnalyticsData }) {
  const { kpiComparisons, formations, promos, centres } = data;

  const kpiCards = [
    {
      label: "Revenus plateforme",
      current: formatPrice(kpiComparisons.revenue.current),
      previous: formatPrice(kpiComparisons.revenue.previous),
      change: kpiComparisons.revenue.change,
      icon: faEuro,
      color: "text-green-400", bg: "bg-green-400/10", border: "border-green-500/20",
    },
    {
      label: "Reservations",
      current: fmtNum(kpiComparisons.reservations.current),
      previous: fmtNum(kpiComparisons.reservations.previous),
      change: kpiComparisons.reservations.change,
      icon: faChartLine,
      color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20",
    },
    {
      label: "Nouveaux utilisateurs",
      current: fmtNum(kpiComparisons.newUsers.current),
      previous: fmtNum(kpiComparisons.newUsers.previous),
      change: kpiComparisons.newUsers.change,
      icon: faUsers,
      color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20",
    },
    {
      label: "Nouveaux centres",
      current: fmtNum(kpiComparisons.newCentres.current),
      previous: fmtNum(kpiComparisons.newCentres.previous),
      change: kpiComparisons.newCentres.change,
      icon: faBuilding,
      color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-500/20",
    },
    {
      label: "Ticket moyen",
      current: formatPrice(kpiComparisons.avgTicket.current),
      previous: formatPrice(kpiComparisons.avgTicket.previous),
      change: kpiComparisons.avgTicket.change,
      icon: faTicket,
      color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20",
    },
    {
      label: "Taux remplissage",
      current: fmtPct(centres.avgFillRate),
      previous: "--",
      change: 0,
      icon: faGaugeHigh,
      color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI comparison cards */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Ce mois vs mois dernier</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {kpiCards.map((k, i) => (
            <div key={i} className={`rounded-xl p-4 border bg-[#0A1628] ${k.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${k.bg} border ${k.border} flex items-center justify-center`}>
                  <FontAwesomeIcon icon={k.icon} className={`${k.color} text-sm`} />
                </div>
                <TrendBadge value={k.change} />
              </div>
              <p className="text-lg font-bold text-white">{k.current}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{k.label}</p>
              <p className="text-[10px] text-gray-600 mt-1">Mois precedent : {k.previous}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top / Bottom formations + Promos */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top formations */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faArrowTrendUp} className="text-green-400 text-xs" />
            <h3 className="text-white font-semibold text-sm">Top formations</h3>
          </div>
          {formations.topPopular.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Aucune donnee</p>
          ) : (
            <div className="space-y-2.5">
              {formations.topPopular.slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/3 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                    ${i === 0 ? "bg-yellow-400/15 text-yellow-400" :
                      i === 1 ? "bg-gray-400/10 text-gray-300" :
                      i === 2 ? "bg-orange-400/10 text-orange-400" :
                      "bg-white/5 text-gray-500"}`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-medium truncate">{f.titre}</p>
                    <p className="text-gray-600 text-[10px]">{f.categorie}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-xs font-semibold">{fmtNum(f.count)} res.</p>
                    <p className="text-green-400 text-[10px]">{formatPrice(f.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom formations */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faArrowTrendDown} className="text-red-400 text-xs" />
            <h3 className="text-white font-semibold text-sm">Formations a surveiller</h3>
          </div>
          {formations.worstRated.length === 0 && formations.bottomPopular.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Aucune donnee</p>
          ) : (
            <div className="space-y-3">
              {formations.worstRated.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium mb-2">Moins bien notees</p>
                  {formations.worstRated.slice(0, 3).map((f, i) => (
                    <div key={`wr-${i}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/3 transition-colors">
                      <span className="text-xs text-gray-400 truncate max-w-[65%]">{f.titre}</span>
                      <span className="inline-flex items-center gap-1 text-yellow-400">
                        <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                        <span className="text-xs font-semibold">{f.rating}</span>
                        <span className="text-[10px] text-gray-600">({f.reviewCount})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {formations.bottomPopular.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium mb-2 mt-3">Moins reservees</p>
                  {formations.bottomPopular.slice(0, 3).map((f, i) => (
                    <div key={`bp-${i}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/3 transition-colors">
                      <span className="text-xs text-gray-400 truncate max-w-[65%]">{f.titre}</span>
                      <span className="text-xs text-white font-semibold">{fmtNum(f.count)} res.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Promos + Category distribution */}
        <div className="space-y-6">
          {/* Promo effectiveness */}
          <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faTag} className="text-pink-400 text-xs" />
              <h3 className="text-white font-semibold text-sm">Codes promo</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
                <div>
                  <p className="text-white text-sm font-semibold">{fmtNum(promos.totalUsedThisMonth)}</p>
                  <p className="text-gray-500 text-[10px]">Utilisations ce mois</p>
                </div>
                <FontAwesomeIcon icon={faPercent} className="text-pink-400/30 text-xl" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
                <div>
                  <p className="text-white text-sm font-semibold">{formatPrice(promos.revenueImpact)}</p>
                  <p className="text-gray-500 text-[10px]">Remises accordees</p>
                </div>
                <FontAwesomeIcon icon={faEuro} className="text-red-400/30 text-xl" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
                <div>
                  <p className="text-white text-sm font-semibold">{fmtNum(promos.activeCount)}</p>
                  <p className="text-gray-500 text-[10px]">Codes actifs</p>
                </div>
                <FontAwesomeIcon icon={faTag} className="text-green-400/30 text-xl" />
              </div>
            </div>
          </div>

          {/* Category distribution */}
          <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Formations par categorie</h3>
            <div className="space-y-2">
              {formations.categoryDistribution.slice(0, 6).map((c, i) => {
                const max = Math.max(...formations.categoryDistribution.map((d) => d.count), 1);
                return (
                  <HorizontalBar
                    key={i}
                    label={c.nom}
                    value={c.count}
                    max={max}
                    color={["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-yellow-500", "bg-pink-500", "bg-cyan-500"][i % 6]}
                  />
                );
              })}
              {formations.categoryDistribution.length === 0 && (
                <p className="text-gray-600 text-xs text-center py-4">Aucune donnee</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Best rated formations */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-xs" />
          <h3 className="text-white font-semibold text-sm">Meilleures formations par note</h3>
        </div>
        {formations.bestRated.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-6">Aucun avis disponible</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {formations.bestRated.slice(0, 10).map((f, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-1.5 mb-2">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <FontAwesomeIcon
                      key={s}
                      icon={faStar}
                      className={`text-[10px] ${s < Math.round(f.rating) ? "text-yellow-400" : "text-gray-700"}`}
                    />
                  ))}
                  <span className="text-xs text-white font-semibold ml-1">{f.rating}</span>
                </div>
                <p className="text-white text-xs font-medium truncate">{f.titre}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">{fmtNum(f.reviewCount)} avis</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Average price by category */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Prix moyen par categorie</h3>
        {formations.avgPriceByCategory.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-6">Aucune donnee</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {formations.avgPriceByCategory.map((c, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/3 border border-white/5">
                <p className="text-gray-400 text-xs truncate">{c.nom}</p>
                <p className="text-white text-lg font-bold mt-1">{formatPrice(c.avgPrice)}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">{fmtNum(c.count)} formation{c.count > 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

const tabs = [
  { id: "revenus", label: "Revenus", icon: faEuro },
  { id: "utilisateurs", label: "Utilisateurs", icon: faUsers },
  { id: "centres", label: "Centres", icon: faBuilding },
  { id: "performances", label: "Performances", icon: faBolt },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("revenus");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Erreur chargement analytics");
        return r.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" />
        <span className="text-sm">Chargement des analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <div className="bg-[#0A1628] rounded-xl border border-red-500/20 p-12 text-center">
          <p className="text-red-400 font-medium">Impossible de charger les analytics</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-yellow-400/10 text-yellow-400 border-yellow-500/20">
              <FontAwesomeIcon icon={faCrown} className="text-[9px]" />
              Owner
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            Business Intelligence — Vue strategique de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-500/20">
          <FontAwesomeIcon icon={faChartBar} className="text-yellow-400 text-xs" />
          <span className="text-yellow-400 text-xs font-medium">Donnees temps reel</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#0A1628] border border-white/8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
              }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="text-xs" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "revenus" && <TabRevenus data={data} />}
        {activeTab === "utilisateurs" && <TabUtilisateurs data={data} />}
        {activeTab === "centres" && <TabCentres data={data} />}
        {activeTab === "performances" && <TabPerformances data={data} />}
      </div>
    </div>
  );
}
