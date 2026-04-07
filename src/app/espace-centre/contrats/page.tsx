"use client";

import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileContract,
  faSpinner,
  faTriangleExclamation,
  faSearch,
  faDownload,
  faCircleCheck,
  faClock,
  faEnvelope,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate, formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────

interface ContratReservation {
  id: string;
  numero: string;
  status: "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "REMBOURSEE" | "TERMINEE";
  montant: number;
  prenom: string;
  nom: string;
  email: string;
  createdAt: string;
  session: {
    dateDebut: string;
    dateFin: string;
    formation: {
      titre: string;
    };
  };
}

const statusConfig = {
  CONFIRMEE:  { label: "Confirmee", color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-500/20", icon: faCircleCheck },
  TERMINEE:   { label: "Terminee",  color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-500/20",  icon: faCircleCheck },
  EN_ATTENTE: { label: "En attente",color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20", icon: faClock },
  ANNULEE:    { label: "Annulee",   color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-500/20",   icon: faClock },
  REMBOURSEE: { label: "Remboursee",color: "text-gray-400",   bg: "bg-gray-400/10",   border: "border-gray-500/20",  icon: faClock },
} as const;

export default function CentreContratsPage() {
  const [reservations, setReservations] = useState<ContratReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterFormation, setFilterFormation] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/centre/contrats")
      .then(async (r) => {
        if (!r.ok) throw new Error("Erreur lors du chargement des contrats");
        return r.json();
      })
      .then((data) => {
        setReservations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => setLoading(false));
  }, []);

  // Unique formation titles for filter dropdown
  const formationTitles = useMemo(() => {
    const titles = new Set<string>();
    for (const r of reservations) {
      titles.add(r.session.formation.titre);
    }
    return Array.from(titles).sort();
  }, [reservations]);

  // Filter eligible reservations (only CONFIRMEE or TERMINEE have contrats)
  const contratReservations = useMemo(() => {
    let filtered = reservations;

    // Status filter
    if (filterStatus === "contrat") {
      filtered = filtered.filter((r) => r.status === "CONFIRMEE" || r.status === "TERMINEE");
    } else if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    // Formation filter
    if (filterFormation) {
      filtered = filtered.filter((r) => r.session.formation.titre === filterFormation);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          `${r.prenom} ${r.nom}`.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.numero.toLowerCase().includes(q) ||
          r.session.formation.titre.toLowerCase().includes(q)
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }, [reservations, filterStatus, filterFormation, search]);

  const hasContrat = (status: string) => status === "CONFIRMEE" || status === "TERMINEE";

  const handleSendEmail = async (reservationId: string) => {
    setSendingEmail(reservationId);
    // Placeholder: In production this would call an email API
    setTimeout(() => {
      setSendingEmail(null);
      alert("Email de contrat envoye (fonctionnalite en cours d'integration)");
    }, 1000);
  };

  // Stats
  const totalContrats = reservations.filter((r) => hasContrat(r.status)).length;
  const totalConfirmees = reservations.filter((r) => r.status === "CONFIRMEE").length;
  const totalTerminees = reservations.filter((r) => r.status === "TERMINEE").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Contrats de formation</h1>
        <p className="text-gray-500 text-sm">
          Gerez et telechargez les contrats de formation de vos stagiaires
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement...</span>
        </div>
      ) : error ? (
        <div
          className="text-center py-16 rounded-xl border"
          style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.15)" }}
        >
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-400 mb-3" />
          <p className="text-white font-medium mb-1">Erreur de chargement</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all"
          >
            Reessayer
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          {reservations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div
                className="rounded-xl p-4 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faFileContract} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{totalContrats}</p>
                    <p className="text-xs text-gray-500">Contrats generes</p>
                  </div>
                </div>
              </div>
              <div
                className="rounded-xl p-4 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{totalConfirmees}</p>
                    <p className="text-xs text-gray-500">En cours</p>
                  </div>
                </div>
              </div>
              <div
                className="rounded-xl p-4 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{totalTerminees}</p>
                    <p className="text-xs text-gray-500">Terminees</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
              />
              <input
                type="text"
                placeholder="Rechercher par nom, email, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-gray-500 border focus:outline-none focus:border-blue-500/50 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              />
            </div>

            {/* Formation filter */}
            {formationTitles.length > 1 && (
              <div className="relative">
                <FontAwesomeIcon
                  icon={faFilter}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
                />
                <select
                  value={filterFormation}
                  onChange={(e) => setFilterFormation(e.target.value)}
                  className="pl-9 pr-8 py-2 rounded-lg text-sm text-white border focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                >
                  <option value="">Toutes les formations</option>
                  {formationTitles.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm text-white border focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="contrat">Avec contrat</option>
              <option value="CONFIRMEE">Confirmees</option>
              <option value="TERMINEE">Terminees</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
          </div>

          {/* Empty state */}
          {reservations.length === 0 ? (
            <div
              className="text-center py-16 rounded-xl border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <FontAwesomeIcon icon={faFileContract} className="text-3xl text-gray-600 mb-3" />
              <p className="text-white font-medium mb-1">Aucun contrat</p>
              <p className="text-gray-500 text-sm">
                Les contrats apparaitront ici lorsque des stagiaires reserveront vos formations.
              </p>
            </div>
          ) : contratReservations.length === 0 ? (
            <div
              className="text-center py-16 rounded-xl border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <FontAwesomeIcon icon={faSearch} className="text-3xl text-gray-600 mb-3" />
              <p className="text-white font-medium mb-1">Aucun resultat</p>
              <p className="text-gray-500 text-sm">
                Essayez de modifier votre recherche ou vos filtres.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div
                className="hidden sm:block rounded-xl border overflow-hidden"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Stagiaire</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Formation</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Dates</th>
                      <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Montant</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">Statut</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contratReservations.map((r) => {
                      const st = statusConfig[r.status];
                      const canDownload = hasContrat(r.status);
                      return (
                        <tr
                          key={r.id}
                          className="border-t"
                          style={{ borderColor: "rgba(255,255,255,0.05)" }}
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm text-white font-medium">
                              {r.prenom} {r.nom}
                            </p>
                            <p className="text-xs text-gray-500">{r.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-white truncate max-w-[200px]">
                              {r.session.formation.titre}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">{r.numero}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-400">
                              {formatDate(r.session.dateDebut, "short")}
                            </p>
                            <p className="text-xs text-gray-500">
                              au {formatDate(r.session.dateFin, "short")}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-semibold text-white">
                              {formatPrice(r.montant)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${st.color} ${st.bg} ${st.border}`}
                            >
                              <FontAwesomeIcon icon={st.icon} className="w-3 h-3" />
                              {st.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {canDownload ? (
                                <>
                                  <a
                                    href={`/api/contrats/${r.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors px-2.5 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20"
                                    title="Telecharger le contrat"
                                  >
                                    <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                                    PDF
                                  </a>
                                  <button
                                    onClick={() => handleSendEmail(r.id)}
                                    disabled={sendingEmail === r.id}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors px-2.5 py-1.5 rounded-lg bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 disabled:opacity-50"
                                    title="Envoyer par email"
                                  >
                                    {sendingEmail === r.id ? (
                                      <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3" />
                                    )}
                                    Email
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-gray-600">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {contratReservations.map((r) => {
                  const st = statusConfig[r.status];
                  const canDownload = hasContrat(r.status);
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border p-4 space-y-3"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        borderColor: "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium">
                            {r.prenom} {r.nom}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{r.session.formation.titre}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${st.color} ${st.bg} ${st.border}`}
                        >
                          <FontAwesomeIcon icon={st.icon} className="w-2.5 h-2.5" />
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-mono">{r.numero}</span>
                        <span className="text-white font-semibold">{formatPrice(r.montant)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>
                          {formatDate(r.session.dateDebut, "short")} — {formatDate(r.session.dateFin, "short")}
                        </span>
                      </div>
                      {canDownload && (
                        <div className="flex gap-2">
                          <a
                            href={`/api/contrats/${r.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors py-2 rounded-lg bg-blue-600/10 border border-blue-500/20"
                          >
                            <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                            Telecharger
                          </a>
                          <button
                            onClick={() => handleSendEmail(r.id)}
                            disabled={sendingEmail === r.id}
                            className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors py-2 rounded-lg bg-amber-600/10 border border-amber-500/20 disabled:opacity-50"
                          >
                            {sendingEmail === r.id ? (
                              <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                            ) : (
                              <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3" />
                            )}
                            Email
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
