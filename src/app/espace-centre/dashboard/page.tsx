"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays, faEuroSign, faChartPie, faGraduationCap,
  faArrowTrendUp, faCircleCheck, faSpinner, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";

interface Stats {
  reservationsCeMois: number;
  revenusNets: number;
  sessionsActives: number;
  formationsTotal: number;
  tauxRemplissage: number;
  reservationsRecentes: {
    id: string;
    eleve: string;
    formation: string;
    date: string;
    status: string;
    montant: number;
  }[];
}

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMEE:  { label: "Confirmée",  color: "text-green-400",  bg: "bg-green-400/10"  },
  EN_ATTENTE: { label: "En attente", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  TERMINEE:   { label: "Terminée",   color: "text-gray-400",   bg: "bg-gray-400/10"   },
  ANNULEE:    { label: "Annulée",    color: "text-red-400",    bg: "bg-red-400/10"    },
  REMBOURSEE: { label: "Remboursée", color: "text-orange-400", bg: "bg-orange-400/10" },
};

export default function DashboardCentrePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/centre/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Impossible de charger les statistiques");
        return r.json();
      })
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement du tableau de bord...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-red-400" />
        <p className="text-sm text-red-400">{error ?? "Erreur inconnue"}</p>
        <button
          onClick={() => { setLoading(true); setError(null); location.reload(); }}
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: "Réservations ce mois",
      value: String(stats.reservationsCeMois),
      delta: "Confirmées + terminées",
      icon: faCalendarDays,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Revenus nets",
      value: formatPrice(stats.revenusNets),
      delta: "Après commission BYS",
      icon: faEuroSign,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Sessions actives",
      value: String(stats.sessionsActives),
      delta: "À venir",
      icon: faCalendarDays,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Taux de remplissage",
      value: `${stats.tauxRemplissage}%`,
      delta: `${stats.formationsTotal} formation${stats.formationsTotal > 1 ? "s" : ""} au total`,
      icon: faChartPie,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Tableau de bord</h1>
        <p className="text-gray-500 text-sm">Bienvenue sur votre espace partenaire BYS Formation</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.bg}`}>
                <FontAwesomeIcon icon={k.icon} className={`w-4 h-4 ${k.color}`} />
              </div>
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-gray-700 w-3.5 h-3.5" />
            </div>
            <p className="font-bold text-2xl text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            <p className="text-xs text-gray-700 mt-0.5">{k.delta}</p>
          </div>
        ))}
      </div>

      {/* Réservations récentes */}
      <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <h2 className="font-semibold text-white text-sm">Réservations récentes</h2>
          <Link href="/espace-centre/sessions" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Voir tout
          </Link>
        </div>

        {stats.reservationsRecentes.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-sm">Aucune réservation pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {stats.reservationsRecentes.map((r) => {
              const badge = statusBadge[r.status] ?? statusBadge["EN_ATTENTE"];
              const initials = r.eleve.split(" ").map((n) => n[0]).join("");
              return (
                <div key={r.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-gray-400">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.eleve}</p>
                    <p className="text-xs text-gray-500 truncate">{r.formation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color} ${badge.bg}`}>{badge.label}</span>
                    <p className="text-xs text-gray-600 mt-1">{formatDate(new Date(r.date))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Ajouter une session",   href: "/espace-centre/sessions",   icon: faCalendarDays,  color: "text-blue-400"   },
          { label: "Créer une formation",   href: "/espace-centre/formations", icon: faGraduationCap, color: "text-purple-400" },
          { label: "Voir les réservations", href: "/espace-centre/sessions",   icon: faCircleCheck,   color: "text-green-400"  },
        ].map((a) => (
          <Link key={a.label} href={a.href} className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/[0.07]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <FontAwesomeIcon icon={a.icon} className={`w-5 h-5 ${a.color}`} />
            <span className="text-sm font-medium text-gray-300">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
