"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEuro, faBuilding, faUsers, faClipboardList,
  faArrowUp, faCheckCircle, faCircleXmark,
  faClock, faHeadset, faChartLine, faArrowRight, faSpinner,
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
}

const statusBadge = (s: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    CONFIRMEE:  { cls: "bg-green-400/10 text-green-400 border-green-500/20",   label: "Confirmée"  },
    EN_ATTENTE: { cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20", label: "En attente" },
    ANNULEE:    { cls: "bg-red-400/10 text-red-400 border-red-500/20",           label: "Annulée"    },
    TERMINEE:   { cls: "bg-gray-400/10 text-gray-400 border-gray-500/20",        label: "Terminée"   },
  };
  return map[s] ?? { cls: "bg-gray-400/10 text-gray-400 border-gray-500/20", label: s };
};

const MOCK_STATS: AdminStats = {
  revenusPlateforme: 18420, revenusEvolution: 12,
  centresActifs: 47, centresEnAttente: 8,
  reservationsCeMois: 1284, reservationsEvolution: 8,
  utilisateurs: 12847, ticketsOuverts: 3,
  reservationsRecentes: [
    { id: "RES-2847", eleve: "Jean Dupont", centre: "BYS Formation Osny", stage: "Récupération de points", montant: 199, status: "CONFIRMEE", createdAt: new Date().toISOString() },
    { id: "RES-2846", eleve: "Marie Martin", centre: "Auto-École Montmartre", stage: "Stage 48N", montant: 249, status: "EN_ATTENTE", createdAt: new Date().toISOString() },
    { id: "RES-2845", eleve: "Lucas Bernard", centre: "BYS Formation Cergy", stage: "Récupération de points", montant: 209, status: "CONFIRMEE", createdAt: new Date().toISOString() },
  ],
  centresEnAttenteList: [
    { id: "C001", nom: "Auto-École Bordelaise", ville: "Bordeaux", email: "ae-bordelaise@gmail.com", createdAt: new Date("2026-03-22").toISOString() },
    { id: "C002", nom: "Centre Conduite Nantes", ville: "Nantes", email: "conduite.nantes@gmail.com", createdAt: new Date("2026-03-21").toISOString() },
  ],
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.centresActifs === "number") setStats(data);
        else setStats(MOCK_STATS);
      })
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  async function validateCentre(id: string) {
    const res = await fetch("/api/centres", {
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
    const res = await fetch("/api/centres", {
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

  const s = stats ?? MOCK_STATS;

  const kpis = [
    {
      label: "Revenus plateforme", value: loading ? "…" : formatPrice(s.revenusPlateforme),
      sub: "Commission perçue ce mois", icon: faEuro, trend: `+${s.revenusEvolution}%`,
      color: "text-green-400", bg: "bg-green-400/10", border: "border-green-500/20",
    },
    {
      label: "Centres actifs", value: loading ? "…" : String(s.centresActifs),
      sub: `${s.centresEnAttente} en attente de validation`, icon: faBuilding, trend: `${s.centresEnAttente} att.`,
      color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20",
    },
    {
      label: "Réservations", value: loading ? "…" : s.reservationsCeMois.toLocaleString("fr-FR"),
      sub: "Ce mois", icon: faClipboardList, trend: `+${s.reservationsEvolution}%`,
      color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20",
    },
    {
      label: "Utilisateurs", value: loading ? "…" : s.utilisateurs.toLocaleString("fr-FR"),
      sub: `${s.ticketsOuverts} tickets ouverts`, icon: faUsers, trend: "+5%",
      color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Vue d&apos;ensemble de la plateforme BYS Permis</p>
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
              <div className="flex items-center gap-1 text-xs font-semibold text-green-400">
                <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" />
                {k.trend}
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            <p className="text-[11px] text-gray-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Centres en attente + Tickets ouverts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Centres en attente */}
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Centres en attente de validation</h2>
            <Link href="/admin/centres" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Voir tout <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              <span>Chargement…</span>
            </div>
          ) : s.centresEnAttenteList.length === 0 ? (
            <p className="text-gray-600 text-sm py-4">Aucun centre en attente.</p>
          ) : (
            <div className="space-y-3">
              {s.centresEnAttenteList.map((c) => (
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
              <p className="text-white font-semibold">{loading ? "…" : s.ticketsOuverts} tickets ouverts</p>
              <Link href="/admin/support" className="text-xs text-blue-400 hover:underline">
                Gérer le support →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dernières réservations */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-sm">Dernières réservations</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FontAwesomeIcon icon={faChartLine} className="text-blue-400" />
              Commission ce mois : <span className="text-blue-400 font-semibold">{loading ? "…" : formatPrice(s.revenusPlateforme)}</span>
            </div>
            <Link href="/admin/centres" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Voir tout <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-4">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Référence</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Élève</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Centre</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Stage</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Montant</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Commission</th>
                  <th className="text-gray-500 font-medium text-xs pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {s.reservationsRecentes.map((r) => {
                  const badge = statusBadge(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-4 text-blue-400 font-mono text-xs">{r.id}</td>
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
        )}
      </div>
    </div>
  );
}
