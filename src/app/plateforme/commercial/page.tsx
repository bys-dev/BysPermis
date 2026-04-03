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
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

interface Centre {
  id: string;
  nom: string;
  ville: string;
  email: string;
  telephone?: string;
  statut: "ACTIF" | "EN_ATTENTE" | "SUSPENDU";
  createdAt: string;
  // Fields from /api/centres
  slug?: string;
  adresse?: string;
  codePostal?: string;
}

const statusConfig: Record<string, { cls: string; label: string; dot: string }> = {
  ACTIF: { cls: "bg-green-400/10 text-green-400 border-green-500/20", label: "Actif", dot: "text-green-400" },
  EN_ATTENTE: { cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20", label: "En attente", dot: "text-yellow-400" },
  SUSPENDU: { cls: "bg-red-400/10 text-red-400 border-red-500/20", label: "Suspendu", dot: "text-red-400" },
};

export default function PlateformeCommercialPage() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        setError(null);
        const res = await fetch("/api/centres?statut=all");
        if (!res.ok) throw new Error("Erreur lors du chargement des centres");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Donnees invalides");
        setCentres(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setCentres([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCentres();
  }, []);

  const total = centres.length;
  const actifs = centres.filter((c) => c.statut === "ACTIF").length;
  const enAttente = centres.filter((c) => c.statut === "EN_ATTENTE").length;
  const suspendus = centres.filter((c) => c.statut === "SUSPENDU").length;
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
      sub: `${suspendus} suspendu${suspendus !== 1 ? "s" : ""}`,
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
        ) : centres.length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faBuilding} className="text-gray-600 text-3xl mb-3" />
            <p className="text-gray-500 text-sm">Aucun centre inscrit</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Centre</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Ville</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Statut</th>
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Contact</th>
                  <th className="text-gray-500 font-medium text-xs pb-3">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {centres.map((c) => {
                  const sc = statusConfig[c.statut] ?? statusConfig.ACTIF;
                  return (
                    <tr key={c.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="text-white font-medium">{c.nom}</p>
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
                        <div className="flex items-center gap-3">
                          {c.email && (
                            <span className="text-gray-400 text-xs">{c.email}</span>
                          )}
                        </div>
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
                    {p.email && (
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <FontAwesomeIcon icon={faEnvelope} className="text-[10px]" />
                        {p.email}
                      </span>
                    )}
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
