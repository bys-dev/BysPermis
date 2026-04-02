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

const MOCK_STATS: DashboardStats = {
  revenusPlateforme: 18420,
  revenusEvolution: 12,
  centresActifs: 47,
  centresEnAttente: 8,
  reservationsCeMois: 1284,
  reservationsEvolution: 8,
  ticketsOuverts: 3,
};

const MOCK_ACTIVITY = [
  { id: 1, type: "reservation", text: "Nouvelle reservation de Jean Dupont pour un stage recuperation de points", time: "Il y a 15 min" },
  { id: 2, type: "ticket", text: "Ticket #127 resolu par le support", time: "Il y a 45 min" },
  { id: 3, type: "centre", text: "Auto-Ecole Bordelaise a soumis une demande d'inscription", time: "Il y a 2h" },
  { id: 4, type: "paiement", text: "Commission de 19,90 EUR percue sur la reservation RES-2847", time: "Il y a 3h" },
  { id: 5, type: "reservation", text: "Annulation de la reservation de Marie Martin", time: "Il y a 5h" },
];

export default function PlateformeDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()).catch(() => null),
      fetch("/api/auth/me").then((r) => r.json()).catch(() => null),
    ]).then(([statsData, userData]) => {
      if (statsData && typeof statsData.centresActifs === "number") {
        setStats(statsData);
      } else {
        setStats(MOCK_STATS);
      }
      if (userData?.role) {
        setUser(userData);
      }
    }).finally(() => setLoading(false));
  }, []);

  const s = stats ?? MOCK_STATS;

  const kpis = [
    {
      label: "Revenus plateforme",
      value: loading ? "..." : formatPrice(s.revenusPlateforme),
      sub: "Commission percue ce mois",
      icon: faEuro,
      trend: `+${s.revenusEvolution}%`,
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-500/20",
    },
    {
      label: "Centres actifs",
      value: loading ? "..." : String(s.centresActifs),
      sub: `${s.centresEnAttente} en attente de validation`,
      icon: faBuilding,
      trend: `${s.centresEnAttente} att.`,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-500/20",
    },
    {
      label: "Reservations ce mois",
      value: loading ? "..." : s.reservationsCeMois.toLocaleString("fr-FR"),
      sub: "Reservations confirmees",
      icon: faCalendarCheck,
      trend: `+${s.reservationsEvolution}%`,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-500/20",
    },
    {
      label: "Tickets ouverts",
      value: loading ? "..." : String(s.ticketsOuverts),
      sub: "En attente de traitement",
      icon: faHeadset,
      trend: "",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-500/20",
    },
  ];

  const welcomeName = user?.prenom
    ? `${user.prenom} ${user.nom}`
    : "";
  const welcomeRole = user?.role ? (roleWelcome[user.role] ?? "Staff") : "Staff";

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
        ) : (
          <div className="space-y-3">
            {MOCK_ACTIVITY.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5"
              >
                <div className="mt-0.5">
                  <FontAwesomeIcon
                    icon={a.type === "ticket" ? faCheckCircle : faClock}
                    className={`text-xs ${a.type === "ticket" ? "text-green-400" : "text-gray-500"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-sm">{a.text}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
