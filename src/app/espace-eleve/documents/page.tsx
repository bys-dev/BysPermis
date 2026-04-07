"use client";

import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderOpen,
  faSpinner,
  faTriangleExclamation,
  faSearch,
  faFileLines,
  faFileContract,
  faFileInvoiceDollar,
  faCertificate,
  faDownload,
  faCircleCheck,
  faClock,
  faCircleMinus,
  faArrowDownWideShort,
  faArrowUpWideShort,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

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

type DocType = "convocation" | "contrat" | "facture" | "attestation";
type TabKey = "tous" | DocType;

interface DocumentItem {
  type: DocType;
  label: string;
  reservationId: string;
  reservationNumero: string;
  formationTitre: string;
  centreName: string;
  date: string;
  dateRaw: string;
  status: "disponible" | "en_attente" | "non_applicable";
  href: string | null;
}

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "convocation", label: "Convocations" },
  { key: "contrat", label: "Contrats" },
  { key: "facture", label: "Factures" },
  { key: "attestation", label: "Attestations" },
];

const DOC_CONFIG: Record<DocType, { icon: typeof faFileLines; color: string; bgColor: string; borderColor: string }> = {
  convocation:  { icon: faFileLines,          color: "text-blue-400",   bgColor: "bg-blue-400/10",   borderColor: "border-blue-500/20" },
  contrat:      { icon: faFileContract,       color: "text-indigo-400", bgColor: "bg-indigo-400/10", borderColor: "border-indigo-500/20" },
  facture:      { icon: faFileInvoiceDollar,  color: "text-green-400",  bgColor: "bg-green-400/10",  borderColor: "border-green-500/20" },
  attestation:  { icon: faCertificate,        color: "text-amber-400",  bgColor: "bg-amber-400/10",  borderColor: "border-amber-500/20" },
};

const STATUS_CONFIG = {
  disponible:     { label: "Disponible",     icon: faCircleCheck,  color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-500/20" },
  en_attente:     { label: "En attente",     icon: faClock,        color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
  non_applicable: { label: "Non applicable", icon: faCircleMinus,  color: "text-gray-500",   bg: "bg-gray-500/10",   border: "border-gray-500/20" },
};

export default function DocumentsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("tous");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/reservations").then(async (r) => {
        if (!r.ok) throw new Error("Erreur lors du chargement des reservations");
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

  // Build document list from reservations
  const allDocuments: DocumentItem[] = useMemo(() => {
    const docs: DocumentItem[] = [];

    for (const r of reservations) {
      const isConfirmee = r.status === "CONFIRMEE" || r.status === "TERMINEE";
      const isTerminee = r.status === "TERMINEE";

      const baseInfo = {
        reservationId: r.id,
        reservationNumero: r.numero,
        formationTitre: r.session.formation.titre,
        centreName: r.session.formation.centre.nom,
        date: formatDate(r.createdAt, "short"),
        dateRaw: r.createdAt,
      };

      // Convocation
      docs.push({
        ...baseInfo,
        type: "convocation",
        label: "Convocation",
        status: isConfirmee ? "disponible" : r.status === "EN_ATTENTE" ? "en_attente" : "non_applicable",
        href: isConfirmee ? `/api/convocation/${r.id}` : null,
      });

      // Contrat
      docs.push({
        ...baseInfo,
        type: "contrat",
        label: "Contrat de formation",
        status: isConfirmee ? "disponible" : r.status === "EN_ATTENTE" ? "en_attente" : "non_applicable",
        href: isConfirmee ? `/api/contrats/${r.id}` : null,
      });

      // Facture
      const invoice = invoices.find((inv) => inv.reservationNumero === r.numero);
      docs.push({
        ...baseInfo,
        type: "facture",
        label: "Facture",
        status: invoice ? "disponible" : isConfirmee ? "en_attente" : "non_applicable",
        href: invoice ? `/api/invoices/${invoice.id}` : null,
      });

      // Attestation
      docs.push({
        ...baseInfo,
        type: "attestation",
        label: "Attestation de formation",
        status: isTerminee ? "disponible" : isConfirmee ? "en_attente" : "non_applicable",
        href: isTerminee ? `/api/attestations/${r.id}` : null,
      });
    }

    return docs;
  }, [reservations, invoices]);

  // Filter and sort
  const filteredDocuments = useMemo(() => {
    let filtered = allDocuments;

    // Tab filter
    if (activeTab !== "tous") {
      filtered = filtered.filter((d) => d.type === activeTab);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.formationTitre.toLowerCase().includes(q) ||
          d.centreName.toLowerCase().includes(q) ||
          d.reservationNumero.toLowerCase().includes(q) ||
          d.label.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const da = new Date(a.dateRaw).getTime();
      const db = new Date(b.dateRaw).getTime();
      return sortAsc ? da - db : db - da;
    });

    return filtered;
  }, [allDocuments, activeTab, search, sortAsc]);

  // Stats
  const availableCount = allDocuments.filter((d) => d.status === "disponible").length;
  const pendingCount = allDocuments.filter((d) => d.status === "en_attente").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Mes Documents</h1>
        <p className="text-gray-500 text-sm">
          Retrouvez tous vos documents : convocations, contrats, factures et attestations
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
          {/* Stats cards */}
          {reservations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div
                className="rounded-xl p-4 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faFolderOpen} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{allDocuments.length}</p>
                    <p className="text-xs text-gray-500">Documents au total</p>
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
                    <p className="text-xl font-bold text-white">{availableCount}</p>
                    <p className="text-xs text-gray-500">Disponibles</p>
                  </div>
                </div>
              </div>
              <div
                className="rounded-xl p-4 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faClock} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{pendingCount}</p>
                    <p className="text-xs text-gray-500">En attente</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs + Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-lg overflow-x-auto shrink-0"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {TAB_LABELS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search + Sort */}
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
                />
                <input
                  type="text"
                  placeholder="Rechercher par formation, centre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-gray-500 border focus:outline-none focus:border-blue-500/50 transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                />
              </div>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="px-3 py-2 rounded-lg text-gray-400 hover:text-white border transition-colors shrink-0"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
                title={sortAsc ? "Plus recent d'abord" : "Plus ancien d'abord"}
              >
                <FontAwesomeIcon
                  icon={sortAsc ? faArrowUpWideShort : faArrowDownWideShort}
                  className="w-4 h-4"
                />
              </button>
            </div>
          </div>

          {/* Empty state */}
          {reservations.length === 0 ? (
            <div
              className="text-center py-16 rounded-xl border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <FontAwesomeIcon icon={faFolderOpen} className="text-3xl text-gray-600 mb-3" />
              <p className="text-white font-medium mb-1">Aucun document</p>
              <p className="text-gray-500 text-sm">
                Vos documents apparaitront ici apres votre premiere reservation.
              </p>
            </div>
          ) : filteredDocuments.length === 0 ? (
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
              {/* Documents list — Desktop table */}
              <div
                className="hidden sm:block rounded-xl border overflow-hidden"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Document</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Formation</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Reference</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Date</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">Statut</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc, idx) => {
                      const cfg = DOC_CONFIG[doc.type];
                      const st = STATUS_CONFIG[doc.status];
                      return (
                        <tr
                          key={`${doc.reservationId}-${doc.type}-${idx}`}
                          className="border-t"
                          style={{ borderColor: "rgba(255,255,255,0.05)" }}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${cfg.bgColor} flex items-center justify-center`}>
                                <FontAwesomeIcon icon={cfg.icon} className={`w-3.5 h-3.5 ${cfg.color}`} />
                              </div>
                              <span className="text-sm text-white font-medium">{doc.label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-white truncate max-w-[220px]">{doc.formationTitre}</p>
                            <p className="text-xs text-gray-500">{doc.centreName}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-gray-500 font-mono">{doc.reservationNumero}</span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-400">{doc.date}</td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${st.color} ${st.bg} ${st.border}`}
                            >
                              <FontAwesomeIcon icon={st.icon} className="w-3 h-3" />
                              {st.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {doc.href ? (
                              <a
                                href={doc.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20"
                              >
                                <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                                Telecharger
                              </a>
                            ) : (
                              <span className="text-xs text-gray-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Documents list — Mobile cards */}
              <div className="sm:hidden space-y-3">
                {filteredDocuments.map((doc, idx) => {
                  const cfg = DOC_CONFIG[doc.type];
                  const st = STATUS_CONFIG[doc.status];
                  return (
                    <div
                      key={`${doc.reservationId}-${doc.type}-${idx}-mobile`}
                      className="rounded-xl border p-4 space-y-3"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        borderColor: "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg ${cfg.bgColor} flex items-center justify-center shrink-0`}>
                            <FontAwesomeIcon icon={cfg.icon} className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium">{doc.label}</p>
                            <p className="text-xs text-gray-500 truncate">{doc.formationTitre}</p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${st.color} ${st.bg} ${st.border}`}
                        >
                          <FontAwesomeIcon icon={st.icon} className="w-2.5 h-2.5" />
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">{doc.centreName}</p>
                          <p className="text-xs text-gray-600 font-mono">{doc.reservationNumero}</p>
                        </div>
                        <span className="text-xs text-gray-400">{doc.date}</span>
                      </div>
                      {doc.href && (
                        <a
                          href={doc.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20"
                        >
                          <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                          Telecharger le PDF
                        </a>
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
