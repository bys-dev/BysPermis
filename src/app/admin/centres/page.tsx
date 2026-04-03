"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faBuilding, faCheckCircle, faCircleXmark,
  faClock, faEye, faFilter, faSpinner, faChevronDown, faChevronUp,
  faAward, faLocationDot, faEuro, faUsers, faCalendarDay,
  faEnvelope, faPhone, faGlobe, faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate, formatPrice } from "@/lib/utils";

type Statut = "ACTIF" | "EN_ATTENTE" | "SUSPENDU";

interface FormationInfo {
  id: string;
  titre: string;
  prix: number;
  isQualiopi: boolean;
  isCPF: boolean;
  modalite: string;
  sessionCount: number;
}

interface Centre {
  id: string;
  nom: string;
  slug: string;
  ville: string;
  adresse: string;
  codePostal: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  statut: Statut;
  isActive: boolean;
  subscriptionStatus?: string;
  createdAt: string;
  updatedAt: string;
  certifications: string[];
  ownerEmail: string;
  ownerNom: string;
  subscriptionPlan?: { nom: string; prix: number } | null;
  formationCount: number;
  sessionCount: number;
  membreCount: number;
  revenue: number;
  formations: FormationInfo[];
}

const statusMap: Record<Statut, { label: string; cls: string; dot: string }> = {
  ACTIF:      { label: "Actif",       cls: "bg-green-400/10 text-green-400 border-green-500/20",   dot: "bg-green-400"  },
  EN_ATTENTE: { label: "En attente",  cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  SUSPENDU:   { label: "Suspendu",    cls: "bg-red-400/10 text-red-400 border-red-500/20",           dot: "bg-red-400"    },
};

export default function AdminCentresPage() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<"tous" | Statut>("tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCentres = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filterStatut !== "tous") params.set("statut", filterStatut);
    if (search) params.set("search", search);

    fetch(`/api/admin/centres?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Erreur lors du chargement");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setCentres(data);
        else setCentres([]);
      })
      .catch((err) => {
        setError(err.message);
        setCentres([]);
      })
      .finally(() => setLoading(false));
  }, [filterStatut, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchCentres, 300);
    return () => clearTimeout(timeout);
  }, [fetchCentres]);

  async function changeStatut(id: string, statut: Statut) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/centres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut }),
      });
      if (res.ok) {
        setCentres((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, statut, isActive: statut === "ACTIF" } : c
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
      setOpenMenu(null);
    }
  }

  const filtered = centres.filter((c) => {
    // Search is handled server-side, but also apply client-side for instant feedback
    if (search) {
      const q = search.toLowerCase();
      const matchSearch =
        c.nom.toLowerCase().includes(q) ||
        c.ville.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        c.ownerEmail.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }
    // Status filter is also server-side, but local fallback
    if (filterStatut !== "tous" && c.statut !== filterStatut) return false;
    return true;
  });

  // Count from full dataset (not filtered by search)
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
          <p className="text-gray-400 text-sm mt-0.5">
            {loading ? "Chargement..." : `${counts.tous} centres · ${counts.EN_ATTENTE} en attente de validation`}
          </p>
        </div>
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
            {!loading && <span className="ml-2 text-xs opacity-60">{counts[s]}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Rechercher un centre, une ville, un email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
          <button onClick={fetchCentres} className="ml-3 underline hover:no-underline">
            Reessayer
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FontAwesomeIcon icon={faBuilding} className="text-2xl mb-2" />
            <p className="text-sm">Aucun centre trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-5">Centre</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Statut</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Abonnement</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Formations</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">CA total</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Inscrit</th>
                  <th className="py-3 px-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => {
                  const st = statusMap[c.statut];
                  const isExpanded = expandedId === c.id;
                  return (
                    <tr key={c.id} className="group">
                      <td colSpan={7} className="p-0">
                        <div>
                          {/* Main row */}
                          <div className="flex items-center hover:bg-white/3 transition-colors">
                            <div className="py-3.5 px-5 flex-1 min-w-[200px]">
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
                            </div>
                            <div className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                            </div>
                            <div className="py-3.5 px-4">
                              {c.subscriptionPlan ? (
                                <span className="text-gray-300 text-xs">{c.subscriptionPlan.nom}</span>
                              ) : (
                                <span className="text-gray-600 text-xs">Aucun</span>
                              )}
                            </div>
                            <div className="py-3.5 px-4">
                              <span className="text-gray-300 text-xs">{c.formationCount} formation(s)</span>
                              <p className="text-gray-600 text-[10px]">{c.sessionCount} session(s)</p>
                            </div>
                            <div className="py-3.5 px-4">
                              <span className="text-green-400 text-xs font-semibold">
                                {c.revenue > 0 ? formatPrice(c.revenue) : "—"}
                              </span>
                            </div>
                            <div className="py-3.5 px-4 text-gray-500 text-xs">
                              <div className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                                {formatDate(new Date(c.createdAt))}
                              </div>
                            </div>
                            <div className="py-3.5 px-4">
                              <div className="flex items-center gap-1 justify-end">
                                {c.statut === "EN_ATTENTE" && (
                                  <>
                                    <button
                                      onClick={() => changeStatut(c.id, "ACTIF")}
                                      disabled={updatingId === c.id}
                                      className="p-1.5 rounded-lg bg-green-400/10 border border-green-500/20 text-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50"
                                      title="Activer"
                                    >
                                      {updatingId === c.id ? (
                                        <FontAwesomeIcon icon={faSpinner} className="text-xs animate-spin" />
                                      ) : (
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => changeStatut(c.id, "SUSPENDU")}
                                      disabled={updatingId === c.id}
                                      className="p-1.5 rounded-lg bg-red-400/10 border border-red-500/20 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                                      title="Refuser"
                                    >
                                      <FontAwesomeIcon icon={faCircleXmark} className="text-xs" />
                                    </button>
                                  </>
                                )}
                                {c.statut === "ACTIF" && (
                                  <button
                                    onClick={() => changeStatut(c.id, "SUSPENDU")}
                                    disabled={updatingId === c.id}
                                    className="p-1.5 rounded-lg bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-400/20 transition-colors disabled:opacity-50 text-[10px]"
                                    title="Suspendre"
                                  >
                                    {updatingId === c.id ? (
                                      <FontAwesomeIcon icon={faSpinner} className="text-xs animate-spin" />
                                    ) : (
                                      "Suspendre"
                                    )}
                                  </button>
                                )}
                                {c.statut === "SUSPENDU" && (
                                  <button
                                    onClick={() => changeStatut(c.id, "ACTIF")}
                                    disabled={updatingId === c.id}
                                    className="p-1.5 rounded-lg bg-green-400/10 border border-green-500/20 text-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50 text-[10px]"
                                    title="Reactiver"
                                  >
                                    {updatingId === c.id ? (
                                      <FontAwesomeIcon icon={faSpinner} className="text-xs animate-spin" />
                                    ) : (
                                      "Reactiver"
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                  className="p-1.5 rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors"
                                  title={isExpanded ? "Masquer les details" : "Voir les details"}
                                >
                                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-xs" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="px-5 pb-5 border-t border-white/5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                {/* Contact Info */}
                                <div className="space-y-3">
                                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Contact</h3>
                                  <div className="space-y-2">
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faUsers} className="text-gray-600 text-[10px] w-3" />
                                      Proprietaire : <span className="text-white">{c.ownerNom}</span>
                                    </p>
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faEnvelope} className="text-gray-600 text-[10px] w-3" />
                                      {c.email ?? c.ownerEmail}
                                    </p>
                                    {c.telephone && (
                                      <p className="text-gray-400 text-xs flex items-center gap-2">
                                        <FontAwesomeIcon icon={faPhone} className="text-gray-600 text-[10px] w-3" />
                                        {c.telephone}
                                      </p>
                                    )}
                                    {c.siteWeb && (
                                      <p className="text-gray-400 text-xs flex items-center gap-2">
                                        <FontAwesomeIcon icon={faGlobe} className="text-gray-600 text-[10px] w-3" />
                                        {c.siteWeb}
                                      </p>
                                    )}
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faLocationDot} className="text-gray-600 text-[10px] w-3" />
                                      {c.adresse}, {c.codePostal} {c.ville}
                                    </p>
                                  </div>
                                </div>

                                {/* Subscription & Stats */}
                                <div className="space-y-3">
                                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Abonnement & chiffres</h3>
                                  <div className="space-y-2">
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faEuro} className="text-gray-600 text-[10px] w-3" />
                                      Plan : <span className="text-white">{c.subscriptionPlan?.nom ?? "Aucun"}</span>
                                      {c.subscriptionPlan && (
                                        <span className="text-gray-500">({formatPrice(c.subscriptionPlan.prix)}/mois)</span>
                                      )}
                                    </p>
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faCalendarDay} className="text-gray-600 text-[10px] w-3" />
                                      {c.formationCount} formation(s) · {c.sessionCount} session(s)
                                    </p>
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faUsers} className="text-gray-600 text-[10px] w-3" />
                                      {c.membreCount} membre(s) dans l'equipe
                                    </p>
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faEuro} className="text-gray-600 text-[10px] w-3" />
                                      CA total : <span className="text-green-400 font-semibold">{formatPrice(c.revenue)}</span>
                                    </p>
                                    {c.certifications.length > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {c.certifications.map((cert, i) => (
                                          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-400/10 border border-purple-500/20 text-purple-400">
                                            <FontAwesomeIcon icon={faAward} className="text-[9px]" />
                                            {cert}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Formations list */}
                                <div className="space-y-3">
                                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Formations actives</h3>
                                  {c.formations.length === 0 ? (
                                    <p className="text-gray-600 text-xs">Aucune formation active</p>
                                  ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {c.formations.map((f) => (
                                        <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-white/3 border border-white/5">
                                          <div className="min-w-0 flex-1">
                                            <p className="text-white text-xs truncate">{f.titre}</p>
                                            <p className="text-gray-600 text-[10px]">
                                              {f.sessionCount} session(s) · {f.modalite}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0 ml-2">
                                            {f.isQualiopi && (
                                              <span className="text-[9px] text-purple-400">Qualiopi</span>
                                            )}
                                            <span className="text-green-400 text-xs font-semibold">{formatPrice(f.prix)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
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
