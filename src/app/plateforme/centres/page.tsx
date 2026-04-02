"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faSpinner,
  faSearch,
  faCircle,
  faEuro,
  faUsers,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";

interface Centre {
  id: string;
  nom: string;
  ville: string;
  email: string;
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
  { id: "1", nom: "BYS Formation Osny", ville: "Osny", email: "osny@bysformation.fr", statut: "ACTIF", plan: "PRO", reservations: 312, revenu: 62400, createdAt: "2026-01-15T00:00:00Z" },
  { id: "2", nom: "Auto-Ecole Montmartre", ville: "Paris", email: "contact@ae-montmartre.fr", statut: "ACTIF", plan: "ENTREPRISE", reservations: 245, revenu: 48600, createdAt: "2026-02-01T00:00:00Z" },
  { id: "3", nom: "BYS Formation Cergy", ville: "Cergy", email: "cergy@bysformation.fr", statut: "ACTIF", plan: "STARTER", reservations: 189, revenu: 37800, createdAt: "2026-02-10T00:00:00Z" },
  { id: "4", nom: "Centre Conduite Nantes", ville: "Nantes", email: "conduite.nantes@gmail.com", statut: "EN_ATTENTE", plan: "GRATUIT", reservations: 0, revenu: 0, createdAt: "2026-03-21T00:00:00Z" },
  { id: "5", nom: "Auto-Ecole Bordelaise", ville: "Bordeaux", email: "ae-bordelaise@gmail.com", statut: "EN_ATTENTE", plan: "GRATUIT", reservations: 0, revenu: 0, createdAt: "2026-03-22T00:00:00Z" },
  { id: "6", nom: "Permis Express Lyon", ville: "Lyon", email: "contact@permisexpress.fr", statut: "SUSPENDU", plan: "STARTER", reservations: 45, revenu: 9000, createdAt: "2026-01-20T00:00:00Z" },
];

export default function PlateformeCentresPage() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("TOUS");

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

  const filtered = centres.filter((c) => {
    if (filterStatut !== "TOUS" && c.statut !== filterStatut) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.nom.toLowerCase().includes(q) || c.ville.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    }
    return true;
  });

  const totalRevenu = centres.reduce((sum, c) => sum + c.revenu, 0);
  const totalReservations = centres.reduce((sum, c) => sum + c.reservations, 0);
  const actifs = centres.filter((c) => c.statut === "ACTIF").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Centres partenaires</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Gerer et suivre les centres de formation partenaires
          </p>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A1628] rounded-xl border border-blue-500/20 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-400/10 border border-blue-500/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-400 text-sm" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">{loading ? "..." : actifs}</p>
            <p className="text-gray-500 text-xs">Centres actifs</p>
          </div>
        </div>
        <div className="bg-[#0A1628] rounded-xl border border-green-500/20 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-400/10 border border-green-500/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faEuro} className="text-green-400 text-sm" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">{loading ? "..." : formatPrice(totalRevenu)}</p>
            <p className="text-gray-500 text-xs">Revenu total</p>
          </div>
        </div>
        <div className="bg-[#0A1628] rounded-xl border border-purple-500/20 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-400/10 border border-purple-500/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faUsers} className="text-purple-400 text-sm" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">{loading ? "..." : totalReservations.toLocaleString("fr-FR")}</p>
            <p className="text-gray-500 text-xs">Reservations totales</p>
          </div>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un centre..."
            className="w-full bg-[#0A1628] border border-white/10 text-gray-300 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500/50 placeholder:text-gray-600"
          />
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="bg-[#0A1628] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="SUSPENDU">Suspendu</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faBuilding} className="text-gray-600 text-3xl mb-3" />
            <p className="text-gray-500 text-sm">Aucun centre trouve</p>
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
                  <th className="text-gray-500 font-medium text-xs pb-3 pr-4">Reservations</th>
                  <th className="text-gray-500 font-medium text-xs pb-3">Revenu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => {
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
                      <td className="py-3 pr-4 text-gray-300">{c.reservations}</td>
                      <td className="py-3 text-white font-semibold">{formatPrice(c.revenu)}</td>
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
