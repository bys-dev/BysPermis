"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEuro, faBuilding, faUsers, faClipboardList,
  faArrowUp, faCheckCircle, faCircleXmark,
  faClock, faHeadset, faChartLine, faArrowRight, faSpinner,
  faCrown, faShieldHalved, faUserShield, faCog,
  faPercent, faScrewdriverWrench,
  faCalendarDay, faTicket,
  faFileExport, faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice, formatDate } from "@/lib/utils";

interface AdminStats {
  revenusPlateforme: number;
  revenusEvolution: number;
  centresActifs: number;
  centresEnAttente: number;
  reservationsCeMois: number;
  reservationsEvolution: number;
  utilisateurs: number;
  ticketsOuverts: number;
  reservationsRecentes: {
    id: string;
    eleve: string;
    centre: string;
    stage: string;
    montant: number;
    status: string;
    createdAt: string;
  }[];
  centresEnAttenteList: {
    id: string;
    nom: string;
    ville: string;
    email?: string;
    createdAt: string;
  }[];
  activityFeed?: {
    id: string;
    type: "reservation" | "centre" | "ticket";
    label: string;
    detail: string;
    time: string;
  }[];
}

interface AdminUser {
  prenom: string;
  nom: string;
  role: "ADMIN" | "OWNER";
}

const statusBadge = (s: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    CONFIRMEE:  { cls: "bg-green-400/10 text-green-400 border-green-500/20",   label: "Confirmee"  },
    EN_ATTENTE: { cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20", label: "En attente" },
    ANNULEE:    { cls: "bg-red-400/10 text-red-400 border-red-500/20",           label: "Annulee"    },
    TERMINEE:   { cls: "bg-gray-400/10 text-gray-400 border-gray-500/20",        label: "Terminee"   },
  };
  return map[s] ?? { cls: "bg-gray-400/10 text-gray-400 border-gray-500/20", label: s };
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} jour(s)`;
}

const activityIcon = (type: string) => {
  const map: Record<string, { icon: typeof faCalendarDay; color: string; bg: string; border: string }> = {
    reservation: { icon: faCalendarDay, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20" },
    centre:      { icon: faBuilding,    color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20" },
    ticket:      { icon: faTicket,      color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-500/20" },
  };
  return map[type] ?? map.reservation;
};

const adminExportOptions = [
  { label: "Exporter les centres (CSV)", type: "centres" },
  { label: "Exporter les utilisateurs (CSV)", type: "users" },
  { label: "Exporter les reservations (CSV)", type: "reservations" },
  { label: "Exporter les revenus (CSV)", type: "revenus" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats")
        .then((r) => {
          if (!r.ok) throw new Error("Erreur stats");
          return r.json();
        }),
      fetch("/api/admin/me")
        .then((r) => {
          if (!r.ok) throw new Error("Erreur auth");
          return r.json();
        }),
    ])
      .then(([statsData, userData]) => {
        setStats(statsData);
        setUser(userData);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function validateCentre(id: string) {
    const res = await fetch("/api/admin/centres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statut: "ACTIF" }),
    }).catch(() => null);
    if (res?.ok && stats) {
      setStats({
        ...stats,
        centresEnAttenteList: stats.centresEnAttenteList.filter((c) => c.id !== id),
        centresEnAttente: stats.centresEnAttente - 1,
        centresActifs: stats.centresActifs + 1,
      });
    }
  }

  async function rejectCentre(id: string) {
    const res = await fetch("/api/admin/centres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statut: "SUSPENDU" }),
    }).catch(() => null);
    if (res?.ok && stats) {
      setStats({
        ...stats,
        centresEnAttenteList: stats.centresEnAttenteList.filter((c) => c.id !== id),
        centresEnAttente: stats.centresEnAttente - 1,
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" />
        <span className="text-sm">Chargement du dashboard...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="bg-[#0A1628] rounded-xl border border-red-500/20 p-12 text-center">
          <p className="text-red-400 font-medium">Impossible de charger le dashboard</p>
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

  const isOwner = user?.role === "OWNER";

  const kpis = [
    {
      label: "Revenus plateforme", value: formatPrice(stats.revenusPlateforme),
      sub: "Commission percue ce mois", icon: faEuro, trend: `+${stats.revenusEvolution}%`,
      color: "text-green-400", bg: "bg-green-400/10", border: "border-green-500/20",
    },
    {
      label: "Centres actifs", value: String(stats.centresActifs),
      sub: `${stats.centresEnAttente} en attente de validation`, icon: faBuilding, trend: `${stats.centresEnAttente} att.`,
      color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20",
    },
    {
      label: "Reservations", value: stats.reservationsCeMois.toLocaleString("fr-FR"),
      sub: "Ce mois", icon: faClipboardList, trend: `+${stats.reservationsEvolution}%`,
      color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20",
    },
    {
      label: "Utilisateurs", value: stats.utilisateurs.toLocaleString("fr-FR"),
      sub: `${stats.ticketsOuverts} tickets ouverts`, icon: faUsers,
      trend: `${stats.ticketsOuverts} tickets`,
      color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20",
    },
  ];

  // Quick actions based on role
  const quickActions = [
    { label: "Gerer les centres", href: "/admin/centres", icon: faBuilding, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20" },
    { label: "Voir les utilisateurs", href: "/admin/utilisateurs", icon: faUsers, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20" },
    { label: "Support", href: "/admin/support", icon: faHeadset, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-500/20" },
    { label: "Statistiques", href: "/admin/statistiques", icon: faChartLine, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-500/20" },
    ...(isOwner ? [
      { label: "Roles & Permissions", href: "/admin/roles", icon: faUserShield, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
      { label: "Taux de commission", href: "/admin/parametres", icon: faPercent, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
      { label: "Configuration avancee", href: "/admin/configuration", icon: faScrewdriverWrench, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
    ] : [
      { label: "Parametres", href: "/admin/parametres", icon: faCog, color: "text-gray-400", bg: "bg-white/5", border: "border-white/10" },
    ]),
  ];

  const activityFeed = stats.activityFeed ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {user && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border
                ${isOwner
                  ? "bg-yellow-400/10 text-yellow-400 border-yellow-500/20"
                  : "bg-red-400/10 text-red-400 border-red-500/20"
                }`}
              >
                <FontAwesomeIcon icon={isOwner ? faCrown : faShieldHalved} className="text-[9px]" />
                {isOwner ? "Owner" : "Admin"}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            Bienvenue{user ? `, ${user.prenom}` : ""}. Vue d&apos;ensemble de la plateforme BYS Permis
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 transition-all hover:bg-white/5 bg-[#0A1628] border border-white/10"
            >
              <FontAwesomeIcon icon={faFileExport} className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Exporter</span>
              <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 text-gray-500" />
            </button>
            {exportOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                style={{ background: "#0D1D3A", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {adminExportOptions.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      window.open(`/api/admin/exports?type=${opt.type}`, "_blank");
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-400/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Plateforme en ligne</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl p-3 sm:p-5 border bg-[#0A1628] ${k.border}`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 rounded-lg ${k.bg} border ${k.border} flex items-center justify-center`}>
                <FontAwesomeIcon icon={k.icon} className={`${k.color} text-sm`} />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-green-400">
                <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" />
                {k.trend}
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-white">{k.value}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{k.label}</p>
            <p className="text-[10px] sm:text-[11px] text-gray-600 mt-0.5 hidden sm:block">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3">Actions rapides</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-[#0A1628] border ${action.border} hover:bg-white/5 transition-all group`}
            >
              <div className={`w-9 h-9 rounded-lg ${action.bg} border ${action.border} flex items-center justify-center`}>
                <FontAwesomeIcon icon={action.icon} className={`${action.color} text-sm`} />
              </div>
              <span className="text-gray-400 text-[11px] font-medium text-center group-hover:text-white transition-colors leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity feed + Centres en attente */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent activity feed — real data */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Activite recente</h2>
            <span className="text-gray-600 text-[10px] uppercase tracking-wider font-medium">Temps reel</span>
          </div>
          {activityFeed.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">Aucune activite recente</p>
          ) : (
            <div className="space-y-3">
              {activityFeed.map((item) => {
                const ai = activityIcon(item.type);
                return (
                  <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/3 transition-colors">
                    <div className={`w-8 h-8 rounded-lg ${ai.bg} border ${ai.border} flex items-center justify-center shrink-0 mt-0.5`}>
                      <FontAwesomeIcon icon={ai.icon} className={`${ai.color} text-xs`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-gray-500 text-xs truncate">{item.detail}</p>
                    </div>
                    <span className="text-gray-600 text-[10px] whitespace-nowrap shrink-0 mt-1">{timeAgo(item.time)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Centres en attente */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Centres en attente de validation</h2>
            <Link href="/admin/centres" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Voir tout <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </Link>
          </div>
          {stats.centresEnAttenteList.length === 0 ? (
            <p className="text-gray-600 text-sm py-4">Aucun centre en attente.</p>
          ) : (
            <div className="space-y-3">
              {stats.centresEnAttenteList.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
                  <div>
                    <p className="text-white text-sm font-medium">{c.nom}</p>
                    <p className="text-gray-500 text-xs">{c.ville}</p>
                    <p className="text-gray-600 text-[11px] mt-0.5">Soumis le {formatDate(new Date(c.createdAt))}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => validateCentre(c.id)} className="p-2 rounded-lg bg-green-400/10 border border-green-500/20 text-green-400 hover:bg-green-400/20 transition-colors" title="Valider">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                    </button>
                    <button onClick={() => rejectCentre(c.id)} className="p-2 rounded-lg bg-red-400/10 border border-red-500/20 text-red-400 hover:bg-red-400/20 transition-colors" title="Refuser">
                      <FontAwesomeIcon icon={faCircleXmark} className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tickets ouverts */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm">Tickets support ouverts</h2>
          <Link href="/admin/support" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Voir tout <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
          </Link>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/3 border border-white/5">
          <FontAwesomeIcon icon={faHeadset} className="text-blue-400 text-2xl" />
          <div>
            <p className="text-white font-semibold">{stats.ticketsOuverts} tickets ouverts</p>
            <Link href="/admin/support" className="text-xs text-blue-400 hover:underline">
              Gerer le support
            </Link>
          </div>
        </div>
      </div>

      {/* Dernieres reservations */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-sm">Dernieres reservations</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FontAwesomeIcon icon={faChartLine} className="text-blue-400" />
              Commission ce mois : <span className="text-blue-400 font-semibold">{formatPrice(stats.revenusPlateforme)}</span>
            </div>
          </div>
        </div>

        {stats.reservationsRecentes.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Aucune reservation recente</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Reference</th>
                    <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Eleve</th>
                    <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Centre</th>
                    <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Stage</th>
                    <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Montant</th>
                    <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Commission</th>
                    <th className="text-gray-500 font-medium text-xs pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.reservationsRecentes.map((r) => {
                    const badge = statusBadge(r.status);
                    return (
                      <tr key={r.id} className="hover:bg-white/3 transition-colors">
                        <td className="py-3 pr-4 text-blue-400 font-mono text-xs">{r.id.slice(0, 12)}</td>
                        <td className="py-3 pr-4 text-white">{r.eleve}</td>
                        <td className="py-3 pr-4 text-gray-400">{r.centre}</td>
                        <td className="py-3 pr-4 text-gray-400 max-w-[160px] truncate">{r.stage}</td>
                        <td className="py-3 pr-4 text-white font-semibold">{formatPrice(r.montant)}</td>
                        <td className="py-3 pr-4 text-green-400 font-semibold">{formatPrice(r.montant * 0.1)}</td>
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {stats.reservationsRecentes.map((r) => {
                const badge = statusBadge(r.status);
                return (
                  <div key={r.id} className="p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium truncate">{r.eleve}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs truncate mb-1">{r.stage}</p>
                    <p className="text-gray-500 text-xs mb-2">{r.centre}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-sm">{formatPrice(r.montant)}</span>
                      <span className="text-green-400 text-xs font-semibold">Com. {formatPrice(r.montant * 0.1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
