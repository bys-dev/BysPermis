"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEuro,
  faBuilding,
  faUsers,
  faClipboardList,
  faArrowUp,
  faCheckCircle,
  faCircleXmark,
  faHeadset,
  faChartLine,
  faSpinner,
  faCrown,
  faShieldHalved,
  faUserShield,
  faCog,
  faPercent,
  faScrewdriverWrench,
  faCalendarDay,
  faTicket,
  faFileExport,
  faChevronDown,
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
    email?: string | null;
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
    CONFIRMEE: { cls: "bg-green-400/10 text-green-400 border-green-500/20", label: "Confirmee" },
    EN_ATTENTE: { cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20", label: "En attente" },
    ANNULEE: { cls: "bg-red-400/10 text-red-400 border-red-500/20", label: "Annulee" },
    TERMINEE: { cls: "bg-gray-400/10 text-gray-400 border-gray-500/20", label: "Terminee" },
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
    centre: { icon: faBuilding, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20" },
    ticket: { icon: faTicket, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-500/20" },
  };
  return map[type] ?? map.reservation;
};

const adminExportOptions = [
  { label: "Exporter les centres (CSV)", type: "centres" },
  { label: "Exporter les utilisateurs (CSV)", type: "users" },
  { label: "Exporter les reservations (CSV)", type: "reservations" },
  { label: "Exporter les revenus (CSV)", type: "revenus" },
];

export default function AdminDashboardClient({
  initialStats,
  user,
}: {
  initialStats: AdminStats;
  user: AdminUser;
}) {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [exportOpen, setExportOpen] = useState(false);
  const [patchLoadingId, setPatchLoadingId] = useState<string | null>(null);

  async function validateCentre(id: string) {
    setPatchLoadingId(id);
    const res = await fetch("/api/admin/centres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statut: "ACTIF" }),
    }).catch(() => null);
    setPatchLoadingId(null);
    if (res?.ok) {
      setStats((s) => ({
        ...s,
        centresEnAttenteList: s.centresEnAttenteList.filter((c) => c.id !== id),
        centresEnAttente: s.centresEnAttente - 1,
        centresActifs: s.centresActifs + 1,
      }));
    }
  }

  async function rejectCentre(id: string) {
    setPatchLoadingId(id);
    const res = await fetch("/api/admin/centres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statut: "SUSPENDU" }),
    }).catch(() => null);
    setPatchLoadingId(null);
    if (res?.ok) {
      setStats((s) => ({
        ...s,
        centresEnAttenteList: s.centresEnAttenteList.filter((c) => c.id !== id),
        centresEnAttente: s.centresEnAttente - 1,
      }));
    }
  }

  const isOwner = user?.role === "OWNER";

  const kpis = [
    {
      label: "Revenus plateforme",
      value: formatPrice(stats.revenusPlateforme),
      sub: "Commission percue ce mois",
      icon: faEuro,
      trend: `+${stats.revenusEvolution}%`,
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-500/20",
    },
    {
      label: "Centres actifs",
      value: String(stats.centresActifs),
      sub: `${stats.centresEnAttente} en attente de validation`,
      icon: faBuilding,
      trend: `${stats.centresEnAttente} att.`,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-500/20",
    },
    {
      label: "Reservations",
      value: stats.reservationsCeMois.toLocaleString("fr-FR"),
      sub: "Ce mois",
      icon: faClipboardList,
      trend: `+${stats.reservationsEvolution}%`,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-500/20",
    },
    {
      label: "Utilisateurs",
      value: stats.utilisateurs.toLocaleString("fr-FR"),
      sub: `${stats.ticketsOuverts} tickets ouverts`,
      icon: faUsers,
      trend: `${stats.ticketsOuverts} tickets`,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-500/20",
    },
  ];

  const quickActions = [
    { label: "Gerer les centres", href: "/admin/centres", icon: faBuilding, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20" },
    { label: "Voir les utilisateurs", href: "/admin/utilisateurs", icon: faUsers, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20" },
    { label: "Support", href: "/admin/support", icon: faHeadset, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-500/20" },
    { label: "Statistiques", href: "/admin/statistiques", icon: faChartLine, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-500/20" },
    ...(isOwner
      ? [
          { label: "Roles & Permissions", href: "/admin/roles", icon: faUserShield, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
          { label: "Taux de commission", href: "/admin/parametres", icon: faPercent, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
          { label: "Configuration avancee", href: "/admin/configuration", icon: faScrewdriverWrench, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
        ]
      : [{ label: "Parametres", href: "/admin/parametres", icon: faCog, color: "text-gray-400", bg: "bg-white/5", border: "border-white/10" }]),
  ];

  const activityFeed = stats.activityFeed ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border
                ${
                  isOwner
                    ? "bg-yellow-400/10 text-yellow-400 border-yellow-500/20"
                    : "bg-red-400/10 text-red-400 border-red-500/20"
                }`}
            >
              <FontAwesomeIcon icon={isOwner ? faCrown : faShieldHalved} className="text-[9px]" />
              {isOwner ? "Owner" : "Admin"}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            Bienvenue, {user.prenom}. Vue d&apos;ensemble de la plateforme BYS Permis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 transition-all hover:bg-white/5 bg-navy-900 border border-white/10"
            >
              <FontAwesomeIcon icon={faFileExport} className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Exporter</span>
              <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 text-gray-500" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl z-50 overflow-hidden bg-navy-800 border border-white/10">
                {adminExportOptions.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      // Exports now require from/to for most types (see API). We open with last 30 days by default.
                      const to = new Date();
                      const from = new Date();
                      from.setDate(to.getDate() - 30);
                      const qs = new URLSearchParams({
                        type: opt.type,
                        ...(opt.type === "revenus"
                          ? {}
                          : { from: from.toISOString(), to: to.toISOString(), limit: "1000" }),
                      });
                      window.open(`/api/admin/exports?${qs.toString()}`, "_blank");
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/6 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl p-5 border bg-navy-900 ${k.border}`}>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-navy-900 rounded-xl border border-white/8 p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Centres en attente</h2>
            {stats.centresEnAttenteList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">Aucun centre en attente</div>
            ) : (
              <div className="space-y-3">
                {stats.centresEnAttenteList.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{c.nom}</p>
                      <p className="text-gray-500 text-xs truncate">
                        {c.ville} • {c.email ?? ""} • {formatDate(new Date(c.createdAt))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => validateCentre(c.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors"
                        disabled={patchLoadingId === c.id}
                      >
                        {patchLoadingId === c.id ? (
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                            Valider
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => rejectCentre(c.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        disabled={patchLoadingId === c.id}
                      >
                        <FontAwesomeIcon icon={faCircleXmark} className="mr-1" />
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-navy-900 rounded-xl border border-white/8 p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Réservations récentes</h2>
            {stats.reservationsRecentes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">Aucune réservation récente</div>
            ) : (
              <div className="space-y-3">
                {stats.reservationsRecentes.map((r) => {
                  const badge = statusBadge(r.status);
                  return (
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-sm truncate">
                          <span className="text-white font-medium">{r.eleve}</span> —{" "}
                          <span className="text-gray-400">{r.stage}</span>
                        </p>
                        <p className="text-gray-600 text-xs mt-0.5">{timeAgo(r.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <p className="text-gray-500 text-xs mt-1">{formatPrice(r.montant)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-navy-900 rounded-xl border border-white/8 p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Actions rapides</h2>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-white/5 ${a.border}`}
                >
                  <div className={`w-9 h-9 rounded-lg ${a.bg} border ${a.border} flex items-center justify-center`}>
                    <FontAwesomeIcon icon={a.icon} className={`${a.color} text-sm`} />
                  </div>
                  <span className="text-gray-200 text-sm font-medium">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-navy-900 rounded-xl border border-white/8 p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Activité</h2>
            {activityFeed.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">Aucune activité</div>
            ) : (
              <div className="space-y-3">
                {activityFeed.map((it) => {
                  const cfg = activityIcon(it.type);
                  return (
                    <div key={it.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${cfg.bg} ${cfg.border}`}>
                        <FontAwesomeIcon icon={cfg.icon} className={`${cfg.color} text-xs`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold">{it.label}</p>
                        <p className="text-gray-500 text-xs truncate">{it.detail}</p>
                        <p className="text-gray-600 text-[11px] mt-0.5">{timeAgo(it.time)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

