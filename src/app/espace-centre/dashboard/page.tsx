"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays, faEuroSign, faUsers, faGraduationCap,
  faArrowTrendUp, faCircleCheck, faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";

interface Stats {
  reservationsCeMois: number;
  revenusNets: number;
  elevesFormes: number;
  formationsActives: number;
  formationsEnAttente: number;
  reservationsRecentes: {
    id: string;
    eleve: string;
    formation: string;
    date: string;
    status: string;
  }[];
}

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMEE:  { label: "Confirmée",  color: "text-green-400",  bg: "bg-green-400/10"  },
  EN_ATTENTE: { label: "En attente", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  TERMINEE:   { label: "Terminée",   color: "text-gray-400",   bg: "bg-gray-400/10"   },
  ANNULEE:    { label: "Annulée",    color: "text-red-400",    bg: "bg-red-400/10"    },
};

const MOCK_STATS: Stats = {
  reservationsCeMois: 24,
  revenusNets: 4320,
  elevesFormes: 147,
  formationsActives: 3,
  formationsEnAttente: 1,
  reservationsRecentes: [
    { id: "BYS-2026-0042", eleve: "Jean Dupont",   formation: "Stage récupération de points", date: new Date("2026-04-12").toISOString(), status: "CONFIRMEE"  },
    { id: "BYS-2026-0041", eleve: "Marie Martin",  formation: "Stage récupération de points", date: new Date("2026-04-12").toISOString(), status: "CONFIRMEE"  },
    { id: "BYS-2026-0040", eleve: "Paul Bernard",  formation: "Sensibilisation sécurité",     date: new Date("2026-04-05").toISOString(), status: "EN_ATTENTE" },
    { id: "BYS-2026-0039", eleve: "Sophie Leroy",  formation: "Stage récupération de points", date: new Date("2026-03-28").toISOString(), status: "TERMINEE"   },
  ],
};

export default function DashboardCentrePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/centre/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.reservationsCeMois === "number") setStats(data);
        else setStats(MOCK_STATS);
      })
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  const s = stats ?? MOCK_STATS;

  const kpis = [
    { label: "Réservations ce mois",   value: loading ? "…" : String(s.reservationsCeMois), delta: "Confirmées + terminées", icon: faCalendarDays, color: "text-blue-400",   bg: "bg-blue-400/10"   },
    { label: "Revenus nets",            value: loading ? "…" : formatPrice(s.revenusNets),    delta: "Après commission BYS (10%)",  icon: faEuroSign,      color: "text-green-400",  bg: "bg-green-400/10"  },
    { label: "Élèves formés",           value: loading ? "…" : String(s.elevesFormes),        delta: "Depuis l'ouverture",          icon: faUsers,         color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Formations actives",      value: loading ? "…" : String(s.formationsActives),   delta: s.formationsEnAttente > 0 ? `${s.formationsEnAttente} en attente de validation` : "Toutes validées", icon: faGraduationCap, color: "text-yellow-400", bg: "bg-yellow-400/10" },
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
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-3 text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {s.reservationsRecentes.map((r) => {
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
          { label: "Ajouter une session",    href: "/espace-centre/sessions",   icon: faCalendarDays,  color: "text-blue-400"   },
          { label: "Créer une formation",    href: "/espace-centre/formations", icon: faGraduationCap, color: "text-purple-400" },
          { label: "Voir les réservations",  href: "/espace-centre/sessions",   icon: faCircleCheck,   color: "text-green-400"  },
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
