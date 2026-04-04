"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faSpinner,
  faTriangleExclamation,
  faSearch,
  faFileLines,
  faCircleCheck,
  faCircleXmark,
  faReceipt,
  faFileInvoiceDollar,
} from "@fortawesome/free-solid-svg-icons";
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
    formation: {
      titre: string;
      slug: string;
      prix: number;
      lieu: string | null;
      duree: string;
      centre: { nom: string; ville: string };
    };
  };
}

interface Invoice {
  id: string;
  numero: string;
  montantTTC: number;
  status: string;
  createdAt: string;
  reservationNumero: string | null;
  formationTitre: string | null;
}

const paymentStatusConfig = {
  CONFIRMEE:  { label: "Payé",       icon: faCircleCheck, color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-500/20" },
  TERMINEE:   { label: "Payé",       icon: faCircleCheck, color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-500/20" },
  EN_ATTENTE: { label: "En attente", icon: faReceipt,     color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
  REMBOURSEE: { label: "Remboursé",  icon: faCircleXmark, color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-500/20" },
  ANNULEE:    { label: "Annulé",     icon: faCircleXmark, color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-500/20" },
} as const;

export default function PaiementsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/reservations").then(async (r) => {
        if (!r.ok) throw new Error("Erreur lors du chargement");
        return r.json();
      }),
      fetch("/api/invoices").then(async (r) => {
        if (!r.ok) return [];
        return r.json();
      }),
    ])
      .then(([resData, invData]) => {
        setReservations(Array.isArray(resData) ? resData : []);
        setInvoices(Array.isArray(invData) ? invData : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper: find invoice for a reservation
  const getInvoiceForReservation = (reservationNumero: string): Invoice | undefined => {
    return invoices.find((inv) => inv.reservationNumero === reservationNumero);
  };

  // ─── Stats ─────────────────────────────────────────────
  const totalPaye = reservations
    .filter((r) => r.status === "CONFIRMEE" || r.status === "TERMINEE")
    .reduce((sum, r) => sum + r.montant, 0);

  const totalRembourse = reservations
    .filter((r) => r.status === "REMBOURSEE")
    .reduce((sum, r) => sum + r.montant, 0);

  const nbPaiements = reservations.filter(
    (r) => r.status === "CONFIRMEE" || r.status === "TERMINEE"
  ).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Historique des paiements</h1>
        <p className="text-gray-500 text-sm">Retrouvez tous vos paiements et factures</p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.15)" }}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-400 mb-3" />
          <p className="text-white font-medium mb-1">Erreur de chargement</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          {reservations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{formatPrice(totalPaye)}</p>
                    <p className="text-xs text-gray-500">Total dépensé</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCircleXmark} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{formatPrice(totalRembourse)}</p>
                    <p className="text-xs text-gray-500">Total remboursé</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCreditCard} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{nbPaiements}</p>
                    <p className="text-xs text-gray-500">Paiement{nbPaiements > 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {reservations.length === 0 ? (
            <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
              <FontAwesomeIcon icon={faSearch} className="text-3xl text-gray-600 mb-3" />
              <p className="text-white font-medium mb-1">Aucun paiement</p>
              <p className="text-gray-500 text-sm">Vous n&apos;avez pas encore effectué de paiement.</p>
            </div>
          ) : (
            /* Payments table */
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Formation</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Référence</th>
                      <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Montant</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">Statut</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r) => {
                      const ps = paymentStatusConfig[r.status];
                      return (
                        <tr
                          key={r.id}
                          className="border-t"
                          style={{ borderColor: "rgba(255,255,255,0.05)" }}
                        >
                          <td className="px-5 py-4 text-sm text-gray-400">
                            {formatDate(r.createdAt, "short")}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-white font-medium truncate max-w-[250px]">
                              {r.session.formation.titre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {r.session.formation.centre.nom}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-gray-500 font-mono">{r.numero}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-semibold text-white">
                              {formatPrice(r.montant)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${ps.color} ${ps.bg} ${ps.border}`}>
                              <FontAwesomeIcon icon={ps.icon} className="w-3 h-3" />
                              {ps.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {(r.status === "CONFIRMEE" || r.status === "TERMINEE") && (
                              <div className="flex flex-col items-center gap-1">
                                <a
                                  href={`/api/convocation/${r.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  <FontAwesomeIcon icon={faFileLines} className="w-3 h-3" />
                                  Convocation
                                </a>
                                {(() => {
                                  const inv = getInvoiceForReservation(r.numero);
                                  return inv ? (
                                    <a
                                      href={`/api/invoices/${inv.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-3 h-3" />
                                      Facture
                                    </a>
                                  ) : null;
                                })()}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {reservations.map((r) => {
                  const ps = paymentStatusConfig[r.status];
                  return (
                    <div
                      key={r.id}
                      className="p-4 space-y-2"
                      style={{ background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {r.session.formation.titre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {r.session.formation.centre.nom} - {formatDate(r.createdAt, "short")}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${ps.color} ${ps.bg} ${ps.border}`}>
                          <FontAwesomeIcon icon={ps.icon} className="w-2.5 h-2.5" />
                          {ps.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-mono">{r.numero}</span>
                        <span className="text-sm font-semibold text-white">{formatPrice(r.montant)}</span>
                      </div>
                      {(r.status === "CONFIRMEE" || r.status === "TERMINEE") && (
                        <div className="flex items-center gap-4">
                          <a
                            href={`/api/convocation/${r.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <FontAwesomeIcon icon={faFileLines} className="w-3 h-3" />
                            Convocation
                          </a>
                          {(() => {
                            const inv = getInvoiceForReservation(r.numero);
                            return inv ? (
                              <a
                                href={`/api/invoices/${inv.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
                              >
                                <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-3 h-3" />
                                Facture
                              </a>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
