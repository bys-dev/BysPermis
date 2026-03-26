"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faBuilding, faCheckCircle, faCircleXmark,
  faClock, faEye, faFilter, faPlus, faArrowUp, faEllipsisVertical,
  faShieldHalved, faAward, faLocationDot, faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

type Statut = "ACTIF" | "EN_ATTENTE" | "SUSPENDU";

interface Centre {
  id: string;
  nom: string;
  ville: string;
  statut: Statut;
  isQualiopi?: boolean;
  email?: string;
  createdAt: string;
  _count?: { formations: number };
}

const statusMap: Record<Statut, { label: string; cls: string; dot: string }> = {
  ACTIF:      { label: "Actif",       cls: "bg-green-400/10 text-green-400 border-green-500/20",   dot: "bg-green-400"  },
  EN_ATTENTE: { label: "En attente",  cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  SUSPENDU:   { label: "Suspendu",    cls: "bg-red-400/10 text-red-400 border-red-500/20",           dot: "bg-red-400"    },
};

const MOCK: Centre[] = [
  { id: "C001", nom: "BYS Formation — Osny",    ville: "Osny",    statut: "ACTIF",      isQualiopi: true,  email: "bysforma95@gmail.com",    createdAt: "2026-03-09T00:00:00" },
  { id: "C002", nom: "BYS Formation — Cergy",   ville: "Cergy",   statut: "ACTIF",      isQualiopi: true,  email: "bysforma95@gmail.com",    createdAt: "2026-03-09T00:00:00" },
  { id: "C003", nom: "Auto-École Montmartre",   ville: "Paris",   statut: "ACTIF",      isQualiopi: true,  email: "contact@montmartre-ae.fr", createdAt: "2026-03-15T00:00:00" },
  { id: "C004", nom: "Auto-École Bordelaise",   ville: "Bordeaux",statut: "EN_ATTENTE", isQualiopi: true,  email: "ae-bordelaise@gmail.com",  createdAt: "2026-03-22T00:00:00" },
  { id: "C005", nom: "Centre Conduite Nantes",  ville: "Nantes",  statut: "EN_ATTENTE", isQualiopi: false, email: "conduite.nantes@gmail.com", createdAt: "2026-03-21T00:00:00" },
  { id: "C006", nom: "CFR Marseille Sud",        ville: "Marseille",statut: "SUSPENDU", isQualiopi: true,  email: "cfr-marseille@gmail.com",  createdAt: "2026-03-10T00:00:00" },
];

export default function AdminCentresPage() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<"tous" | Statut>("tous");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/centres?statut=all")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCentres(data);
        else setCentres(MOCK);
      })
      .catch(() => setCentres(MOCK))
      .finally(() => setLoading(false));
  }, []);

  async function changeStatut(id: string, statut: Statut) {
    const res = await fetch("/api/centres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statut }),
    }).catch(() => null);
    if (res?.ok) {
      setCentres((prev) => prev.map((c) => c.id === id ? { ...c, statut } : c));
      setOpenMenu(null);
    }
  }

  const filtered = centres.filter((c) => {
    const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase()) || c.ville.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "tous" || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const counts = {
    tous: centres.length,
    ACTIF:      centres.filter((c) => c.statut === "ACTIF").length,
    EN_ATTENTE: centres.filter((c) => c.statut === "EN_ATTENTE").length,
    SUSPENDU:   centres.filter((c) => c.statut === "SUSPENDU").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Centres partenaires</h1>
          <p className="text-gray-400 text-sm mt-0.5">{counts.tous} centres · {counts.EN_ATTENTE} en attente de validation</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors">
          <FontAwesomeIcon icon={faPlus} />
          Ajouter un centre
        </button>
      </div>

      {/* Tabs statut */}
      <div className="flex flex-wrap gap-2">
        {(["tous", "ACTIF", "EN_ATTENTE", "SUSPENDU"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${filterStatut === s
                ? "bg-white/10 text-white border-white/20"
                : "text-gray-400 border-white/8 hover:text-white hover:border-white/20"
              }`}
          >
            {s === "tous" ? "Tous" : statusMap[s].label}
            <span className="ml-2 text-xs opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Rechercher un centre, une ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-colors">
          <FontAwesomeIcon icon={faFilter} className="text-xs" />
          Filtres avancés
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-5">Centre</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Statut</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Certifications</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Contact</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Inscrit</th>
                  <th className="py-3 px-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => {
                  const st = statusMap[c.statut];
                  return (
                    <tr key={c.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                            <FontAwesomeIcon icon={faBuilding} className="text-xs text-gray-500" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{c.nom}</p>
                            <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                              <FontAwesomeIcon icon={faLocationDot} className="text-[9px]" />
                              {c.ville}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.isQualiopi ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-400/10 border border-purple-500/20 text-purple-400">
                            <FontAwesomeIcon icon={faAward} className="text-[9px]" />
                            Qualiopi
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs">{c.email ?? "—"}</td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                        {c.createdAt ? formatDate(new Date(c.createdAt)) : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          {c.statut === "EN_ATTENTE" && (
                            <>
                              <button
                                onClick={() => changeStatut(c.id, "ACTIF")}
                                className="p-1.5 rounded-lg bg-green-400/10 border border-green-500/20 text-green-400 hover:bg-green-400/20 transition-colors"
                                title="Valider"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                              </button>
                              <button
                                onClick={() => changeStatut(c.id, "SUSPENDU")}
                                className="p-1.5 rounded-lg bg-red-400/10 border border-red-500/20 text-red-400 hover:bg-red-400/20 transition-colors"
                                title="Refuser"
                              >
                                <FontAwesomeIcon icon={faCircleXmark} className="text-xs" />
                              </button>
                            </>
                          )}
                          <button className="p-1.5 rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors" title="Voir">
                            <FontAwesomeIcon icon={faEye} className="text-xs" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors"
                            >
                              <FontAwesomeIcon icon={faEllipsisVertical} className="text-xs" />
                            </button>
                            {openMenu === c.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-[#0D1D3A] border border-white/10 rounded-lg shadow-xl z-10 py-1">
                                {c.statut === "ACTIF" && (
                                  <button
                                    onClick={() => changeStatut(c.id, "SUSPENDU")}
                                    className="w-full text-left px-3 py-2 text-xs text-yellow-400 hover:bg-white/5 transition-colors"
                                  >
                                    Suspendre
                                  </button>
                                )}
                                {c.statut === "SUSPENDU" && (
                                  <button
                                    onClick={() => changeStatut(c.id, "ACTIF")}
                                    className="w-full text-left px-3 py-2 text-xs text-green-400 hover:bg-white/5 transition-colors"
                                  >
                                    Réactiver
                                  </button>
                                )}
                                <button className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                  Modifier
                                </button>
                                <button className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors">
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FontAwesomeIcon icon={faBuilding} className="text-2xl mb-2" />
            <p className="text-sm">Aucun centre trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
