"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEuro,
  faBuilding,
  faCalendarCheck,
  faHeadset,
  faArrowUp,
  faSpinner,
  faClock,
  faCheckCircle,
  faUser,
  faCreditCard,
  faBan,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";

interface DashboardStats {
  revenusPlateforme: number;
  revenusEvolution: number;
  centresActifs: number;
  centresEnAttente: number;
  reservationsCeMois: number;
  reservationsEvolution: number;
  ticketsOuverts: number;
  reservationsRecentes: ReservationRecente[];
}

interface ReservationRecente {
  id: string;
  eleve: string;
  centre: string;
  stage: string;
  montant: number;
  status: string;
  createdAt: string;
}

interface UserInfo {
  prenom: string;
  nom: string;
  role: string;
}

const roleWelcome: Record<string, string> = {
  SUPPORT: "Agent support",
  COMPTABLE: "Comptable",
  COMMERCIAL: "Commercial",
  ADMIN: "Administrateur",
  OWNER: "Proprietaire",
};

const activityIcon: Record<string, { icon: typeof faCheckCircle; cls: string }> = {
  CONFIRMEE: { icon: faCheckCircle, cls: "text-green-400" },
  TERMINEE: { icon: faCalendarCheck, cls: "text-blue-400" },
  ANNULEE: { icon: faBan, cls: "text-red-400" },
  REMBOURSEE: { icon: faCreditCard, cls: "text-orange-400" },
  EN_ATTENTE: { icon: faClock, cls: "text-yellow-400" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hier";
  if (diffD < 30) return `Il y a ${diffD} jours`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function PlateformeDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => {
        if (!r.ok) throw new Error("Erreur stats");
        return r.json();
      }),
      fetch("/api/auth/me").then((r) => r.json()).catch(() => null),
    ])
      .then(([statsData, userData]) => {
        if (statsData && typeof statsData.centresActifs === "number") {
          setStats(statsData);
        } else {
          throw new Error("Donnees invalides");
        }
        if (userData?.role) {
          setUser(userData);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => setLoading(false));
  }, []);

  const s = stats;

  const kpis = [
    {
      label: "Revenus plateforme",
      value: loading || !s ? "..." : formatPrice(s.revenusPlateforme),
      sub: "Commission percue ce mois",
      icon: faEuro,
      trend: s ? `${s.revenusEvolution >= 0 ? "+" : ""}${s.revenusEvolution}%` : "",
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-500/20",
    },
    {
      label: "Centres actifs",
      value: loading || !s ? "..." : String(s.centresActifs),
      sub: s ? `${s.centresEnAttente} en attente de validation` : "",
      icon: faBuilding,
      trend: s ? `${s.centresEnAttente} att.` : "",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-500/20",
    },
    {
      label: "Reservations ce mois",
      value: loading || !s ? "..." : s.reservationsCeMois.toLocaleString("fr-FR"),
      sub: "Reservations confirmees",
      icon: faCalendarCheck,
      trend: s ? `${s.reservationsEvolution >= 0 ? "+" : ""}${s.reservationsEvolution}%` : "",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-500/20",
    },
    {
      label: "Tickets ouverts",
      value: loading || !s ? "..." : String(s.ticketsOuverts),
      sub: "En attente de traitement",
      icon: faHeadset,
      trend: "",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-500/20",
    },
  ];

  const welcomeName = user?.prenom ? `${user.prenom} ${user.nom}` : "";
  const welcomeRole = user?.role ? (roleWelcome[user.role] ?? "Staff") : "Staff";
  const recentActivity = s?.reservationsRecentes ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bonjour{welcomeName ? `, ${welcomeName}` : ""} !
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Espace {welcomeRole} &mdash; Vue d&apos;ensemble de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-400/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-medium">Plateforme en ligne</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      {/* Activite recente */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Activite recente</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-6">
            <FontAwesomeIcon icon={faClock} className="text-gray-600 text-2xl mb-2" />
            <p className="text-gray-500 text-sm">Aucune activite recente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((a) => {
              const iconCfg = activityIcon[a.status] ?? activityIcon.EN_ATTENTE;
              const statusLabel =
                a.status === "CONFIRMEE" ? "Reservation confirmee"
                : a.status === "TERMINEE" ? "Formation terminee"
                : a.status === "ANNULEE" ? "Reservation annulee"
                : a.status === "REMBOURSEE" ? "Remboursement effectue"
                : "Reservation en attente";
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5"
                >
                  <div className="mt-0.5">
                    <FontAwesomeIcon
                      icon={iconCfg.icon}
                      className={`text-xs ${iconCfg.cls}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm">
                      <span className="text-white font-medium">{a.eleve}</span>
                      {" "}&mdash;{" "}
                      <span className="text-gray-400">{a.stage}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <FontAwesomeIcon icon={faBuilding} className="text-[10px]" />
                        {a.centre}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <FontAwesomeIcon icon={faEuro} className="text-[10px]" />
                        {formatPrice(a.montant)}
                      </span>
                      <span className={`text-[10px] font-medium ${iconCfg.cls}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs mt-0.5">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
