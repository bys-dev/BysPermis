"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faSpinner,
  faCircle,
  faChartLine,
  faCheckCircle,
  faClock,
  faEnvelope,
  faPhone,
  faPercent,
} from "@fortawesome/free-solid-svg-icons";

interface Centre {
  id: string;
  nom: string;
  ville: string;
  email: string;
  telephone?: string;
  statut: "ACTIF" | "EN_ATTENTE" | "SUSPENDU";
  plan: "GRATUIT" | "STARTER" | "PRO" | "ENTREPRISE";
  reservations: number;
  revenu: number;
  createdAt: string;
}

const statusConfig: Record<string, { cls: string; label: string; dot: string }> = {
  ACTIF: { cls: "bg-green-400/10 text-green-400 border-green-500/20", label: "Actif", dot: "text-green-400" },
  EN_ATTENTE: { cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20", label: "En attente", dot: "text-yellow-400" },
  SUSPENDU: { cls: "bg-red-400/10 text-red-400 border-red-500/20", label: "Suspendu", dot: "text-red-400" },
};

const planConfig: Record<string, { cls: string }> = {
  GRATUIT: { cls: "text-gray-400" },
  STARTER: { cls: "text-blue-400" },
  PRO: { cls: "text-purple-400" },
  ENTREPRISE: { cls: "text-yellow-400" },
};

const MOCK_CENTRES: Centre[] = [
  { id: "1", nom: "BYS Formation Osny", ville: "Osny", email: "osny@bysformation.fr", telephone: "01 34 56 78 90", statut: "ACTIF", plan: "PRO", reservations: 312, revenu: 62400, createdAt: "2026-01-15T00:00:00Z" },
  { id: "2", nom: "Auto-Ecole Montmartre", ville: "Paris", email: "contact@ae-montmartre.fr", telephone: "01 42 58 12 34", statut: "ACTIF", plan: "ENTREPRISE", reservations: 245, revenu: 48600, createdAt: "2026-02-01T00:00:00Z" },
  { id: "3", nom: "BYS Formation Cergy", ville: "Cergy", email: "cergy@bysformation.fr", telephone: "01 30 75 42 10", statut: "ACTIF", plan: "STARTER", reservations: 189, revenu: 37800, createdAt: "2026-02-10T00:00:00Z" },
  { id: "4", nom: "Centre Conduite Nantes", ville: "Nantes", email: "conduite.nantes@gmail.com", telephone: "02 40 35 67 89", statut: "EN_ATTENTE", plan: "GRATUIT", reservations: 0, revenu: 0, createdAt: "2026-03-21T00:00:00Z" },
  { id: "5", nom: "Auto-Ecole Bordelaise", ville: "Bordeaux", email: "ae-bordelaise@gmail.com", telephone: "05 56 12 34 56", statut: "EN_ATTENTE", plan: "GRATUIT", reservations: 0, revenu: 0, createdAt: "2026-03-22T00:00:00Z" },
  { id: "6", nom: "Permis Express Lyon", ville: "Lyon", email: "contact@permisexpress.fr", telephone: "04 72 10 20 30", statut: "SUSPENDU", plan: "STARTER", reservations: 45, revenu: 9000, createdAt: "2026-01-20T00:00:00Z" },
];

export default function PlateformeCommercialPage() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/centres").then((r) => r.json()).catch(() => null),
      fetch("/api/admin/stats").then((r) => r.json()).catch(() => null),
    ]).then(([centresData]) => {
      if (Array.isArray(centresData) && centresData.length > 0) {
        setCentres(centresData);
      } else {
        setCentres(MOCK_CENTRES);
      }
    }).finally(() => setLoading(false));
  }, []);

  const total = centres.length;
  const actifs = centres.filter((c) => c.statut === "ACTIF").length;
  const enAttente = centres.filter((c) => c.statut === "EN_ATTENTE").length;
  const tauxConversion = total > 0 ? Math.round((actifs / total) * 100) : 0;
  const prospects = centres.filter((c) => c.statut === "EN_ATTENTE");

  const kpis = [
    {
      label: "Total centres",
      value: loading ? "..." : String(total),
      sub: "Centres inscrits sur la plateforme",
      icon: faBuilding,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-500/20",
    },
    {
      label: "Centres actifs",
      value: loading ? "..." : String(actifs),
      sub: `${enAttente} en attente de validation`,
      icon: faCheckCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-500/20",
    },
    {
      label: "En attente",
      value: loading ? "..." : String(enAttente),
      sub: "Prospects a contacter",
      icon: faClock,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-500/20",
    },
    {
      label: "Taux de conversion",
      value: loading ? "..." : `${tauxConversion}%`,
      sub: "Centres actifs / total",
      icon: faPercent,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Espace commercial</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Suivi des centres partenaires et des prospects
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-400/10 border border-blue-500/20">
          <FontAwesomeIcon icon={faChartLine} className="text-blue-400 text-xs" />
          <span className="text-blue-400 text-xs font-medium">
            {actifs} actifs / {total} total
          </span>
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
            </div>
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            <p className="text-[11px] text-gray-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Liste des centres */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h2 className="text-white font-semibold text-sm mb-5">Tous les centres</h2>
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
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Statut</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Plan</th>
                  <th className="text-gray-500 font-medium text-xs pb-3">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {centres.map((c) => {
                  const sc = statusConfig[c.statut] ?? statusConfig.ACTIF;
                  const pc = planConfig[c.plan] ?? planConfig.GRATUIT;
                  return (
                    <tr key={c.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="text-white font-medium">{c.nom}</p>
                        <p className="text-gray-600 text-xs">{c.email}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-400">{c.ville}</td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faCircle} className={`text-[6px] ${sc.dot}`} />
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>
                            {sc.label}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-sm font-medium ${pc.cls}`}>{c.plan}</span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">
                        {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prospects - Centres en attente */}
      <div className="bg-[#0A1628] rounded-xl border border-yellow-500/20 p-5">
        <div className="flex items-center gap-2 mb-5">
          <FontAwesomeIcon icon={faClock} className="text-yellow-400 text-sm" />
          <h2 className="text-white font-semibold text-sm">Prospects &mdash; Centres en attente</h2>
          <span className="ml-auto text-yellow-400 text-xs font-semibold bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
            {prospects.length}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : prospects.length === 0 ? (
          <div className="text-center py-6">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-2xl mb-2" />
            <p className="text-gray-500 text-sm">Aucun prospect en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prospects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/3 border border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{p.nom}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{p.ville}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <FontAwesomeIcon icon={faEnvelope} className="text-[10px]" />
                      {p.email}
                    </span>
                    {p.telephone && (
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <FontAwesomeIcon icon={faPhone} className="text-[10px]" />
                        {p.telephone}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-[11px] mt-1">
                    Inscrit le {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <a
                  href={`mailto:${p.email}?subject=BYS Permis - Bienvenue sur la plateforme`}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                  Contacter
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
