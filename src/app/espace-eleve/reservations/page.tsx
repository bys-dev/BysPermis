"use client";

import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck, faLocationDot, faClock, faFileLines,
  faCircleCheck, faCircleXmark, faCircleExclamation, faHourglassHalf,
  faSpinner, faSearch, faTriangleExclamation, faChevronRight, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
interface Reservation {
  id: string;
  numero: string;
  status: "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "REMBOURSEE" | "TERMINEE";
  montant: number;
  createdAt: string;
  session: {
    dateDebut: string;
    dateFin: string;
    placesRestantes?: number;
    formation: {
      titre: string;
      slug?: string;
      prix?: number;
      lieu?: string | null;
      duree?: string;
      centre: { nom: string; ville: string };
    };
  };
}

const statusConfig = {
  CONFIRMEE:  { label: "Confirmée",  icon: faCircleCheck,      color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-500/20" },
  TERMINEE:   { label: "Terminée",   icon: faCircleCheck,      color: "text-gray-400",   bg: "bg-gray-400/10",   border: "border-gray-500/20"  },
  ANNULEE:    { label: "Annulée",    icon: faCircleXmark,      color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-500/20"   },
  EN_ATTENTE: { label: "En attente", icon: faHourglassHalf,    color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
  REMBOURSEE: { label: "Remboursée", icon: faCircleExclamation,color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-500/20"  },
} as const;

type StatusFilter = "TOUTES" | "CONFIRMEE" | "EN_ATTENTE" | "TERMINEE" | "ANNULEE";

const filterPills: { key: StatusFilter; label: string; color: string }[] = [
  { key: "TOUTES",     label: "Toutes",      color: "text-white"       },
  { key: "CONFIRMEE",  label: "Confirmées",  color: "text-green-400"   },
  { key: "EN_ATTENTE", label: "En attente",  color: "text-yellow-400"  },
  { key: "TERMINEE",   label: "Terminées",   color: "text-gray-400"    },
  { key: "ANNULEE",    label: "Annulées",    color: "text-red-400"     },
];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TOUTES");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/reservations")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Erreur lors du chargement");
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setReservations(data);
        } else {
          setReservations([]);
        }
      })
      .catch((err) => {
        setError(err.message || "Impossible de charger vos réservations.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered reservations
  const filtered = useMemo(() => {
    let result = reservations;

    // Status filter
    if (statusFilter !== "TOUTES") {
      if (statusFilter === "ANNULEE") {
        // Include both ANNULEE and REMBOURSEE
        result = result.filter((r) => r.status === "ANNULEE" || r.status === "REMBOURSEE");
      } else {
        result = result.filter((r) => r.status === statusFilter);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.session.formation.titre.toLowerCase().includes(q) ||
          r.session.formation.centre.nom.toLowerCase().includes(q) ||
          r.session.formation.centre.ville.toLowerCase().includes(q) ||
          r.numero.toLowerCase().includes(q)
      );
    }

    return result;
  }, [reservations, statusFilter, searchQuery]);

  const counts = {
    total: reservations.length,
    confirmees: reservations.filter((r) => r.status === "CONFIRMEE").length,
    terminees:  reservations.filter((r) => r.status === "TERMINEE").length,
    annulees:   reservations.filter((r) => r.status === "ANNULEE" || r.status === "REMBOURSEE").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Mes réservations</h1>
        <p className="text-gray-500 text-sm">Retrouvez l&apos;historique de tous vos stages</p>
      </div>

      {/* Stats — hidden during loading/error */}
      {!loading && !error && reservations.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total",       value: counts.total,      color: "text-white"      },
            { label: "Confirmées",  value: counts.confirmees, color: "text-green-400"  },
            { label: "Terminées",   value: counts.terminees,  color: "text-gray-400"   },
            { label: "Annulées",    value: counts.annulees,   color: "text-red-400"    },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters & Search — hidden during loading/error */}
      {!loading && !error && reservations.length > 0 && (
        <div className="mb-6 space-y-3">
          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setStatusFilter(pill.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  statusFilter === pill.key
                    ? `${pill.color} border-current bg-white/5`
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
            />
            <input
              type="text"
              placeholder="Rechercher par formation, centre, ville ou numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 border outline-none focus:border-blue-500/40 transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement de vos réservations...</span>
        </div>
      ) : error ? (
        /* Error */
        <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.15)" }}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-400 mb-3" />
          <p className="text-white font-medium mb-1">Erreur de chargement</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
            className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all"
          >
            Réessayer
          </button>
        </div>
      ) : reservations.length === 0 ? (
        /* Empty */
        <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
          <FontAwesomeIcon icon={faSearch} className="text-3xl text-gray-600 mb-3" />
          <p className="text-white font-medium mb-1">Aucune réservation</p>
          <p className="text-gray-500 text-sm mb-6">Vous n&apos;avez pas encore réservé de stage.</p>
          <Link href="/recherche" className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all">
            Réserver un stage
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        /* No results for filter */
        <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
          <FontAwesomeIcon icon={faSearch} className="text-3xl text-gray-600 mb-3" />
          <p className="text-white font-medium mb-1">Aucun résultat</p>
          <p className="text-gray-500 text-sm mb-4">Aucune réservation ne correspond à vos filtres.</p>
          <button
            onClick={() => { setStatusFilter("TOUTES"); setSearchQuery(""); }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        /* List */
        <div className="space-y-4">
          {filtered.map((r) => {
            const s = statusConfig[r.status];
            const dateDebut = new Date(r.session.dateDebut);
            const dateFin   = new Date(r.session.dateFin);
            return (
              <Link
                key={r.id}
                href={`/espace-eleve/reservations/${r.id}`}
                className="block rounded-xl p-5 border transition-all hover:border-blue-500/20 group"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faCalendarCheck} className="text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">{r.session.formation.titre}</h3>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${s.color} ${s.bg} ${s.border}`}>
                        <FontAwesomeIcon icon={s.icon} className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3" />
                        {r.session.formation.centre.nom} — {r.session.formation.centre.ville}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                        {formatDate(dateDebut)} — {formatDate(dateFin)}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                    <span className="font-bold text-white text-sm">{formatPrice(r.montant)}</span>
                    <span className="text-xs text-gray-600 font-mono">{r.numero}</span>
                    {r.status === "CONFIRMEE" && (
                      <span
                        className="flex items-center gap-1.5 text-xs text-blue-400 mt-1"
                      >
                        <FontAwesomeIcon icon={faFileLines} className="w-3 h-3" />
                        Convocation PDF
                      </span>
                    )}
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="w-3 h-3 text-gray-700 group-hover:text-blue-400 transition-colors ml-2 sm:ml-0 sm:mt-1"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* CTA */}
      {!loading && !error && (
        <div className="mt-10 text-center rounded-xl p-8 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-gray-400 mb-4 text-sm">Vous souhaitez réserver un nouveau stage ?</p>
          <Link href="/recherche" className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
            Rechercher un stage
          </Link>
        </div>
      )}
    </div>
  );
}
