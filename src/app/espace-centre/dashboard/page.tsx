"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faEuroSign,
  faChartPie,
  faGraduationCap,
  faCircleCheck,
  faTriangleExclamation,
  faFileExport,
  faChevronDown,
  faImage,
  faArrowRight,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";
import LoadingOverlay, { KpiGridSkeleton } from "@/components/ui/LoadingOverlay";

interface Stats {
  reservationsCeMois: number;
  revenusNets: number;
  sessionsActives: number;
  formationsTotal: number;
  tauxRemplissage: number;
  reservationsRecentes: {
    id: string;
    eleve: string;
    formation: string;
    date: string;
    status: string;
    montant: number;
  }[];
  questionnaires?: {
    averageRating: number;
    totalResponses: number;
    pendingCount: number;
    recent: {
      id: string;
      noteGlobale: number;
      commentaire: string | null;
      auteur: string;
      formation: string | null;
      createdAt: string;
    }[];
  };
}

const statusBadge: Record<string, { label: string; className: string }> = {
  CONFIRMEE: { label: "Confirmée", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  EN_ATTENTE: { label: "En attente", className: "bg-amber-100 text-amber-800 border-amber-200" },
  TERMINEE: { label: "Terminée", className: "bg-slate-100 text-slate-700 border-slate-200" },
  ANNULEE: { label: "Annulée", className: "bg-red-100 text-red-800 border-red-200" },
  REMBOURSEE: { label: "Remboursée", className: "bg-orange-100 text-orange-800 border-orange-200" },
};

const exportOptions = [
  { label: "Réservations (CSV)", type: "reservations" },
  { label: "Sessions (CSV)", type: "sessions" },
  { label: "Formations (CSV)", type: "formations" },
  { label: "Revenus (CSV)", type: "revenus" },
];

export default function DashboardCentrePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [hasLogo, setHasLogo] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/centre/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Impossible de charger les statistiques");
        return r.json();
      })
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    fetch("/api/centre/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object") setHasLogo(Boolean(data.logo));
      })
      .catch(() => null);
  }, []);

  if (!loading && (error || !stats)) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-500 mb-3" />
        <p className="text-slate-800 font-medium">{error ?? "Erreur inconnue"}</p>
        <button
          type="button"
          onClick={() => { setLoading(true); setError(null); location.reload(); }}
          className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const kpis = stats
    ? [
        {
          label: "Réservations ce mois",
          hint: "Confirmées et terminées",
          value: String(stats.reservationsCeMois),
          icon: faCalendarDays,
          accent: "text-blue-600 bg-blue-50",
        },
        {
          label: "Revenus nets",
          hint: "Après commission BYS",
          value: formatPrice(stats.revenusNets),
          icon: faEuroSign,
          accent: "text-emerald-600 bg-emerald-50",
        },
        {
          label: "Sessions actives",
          hint: "À venir",
          value: String(stats.sessionsActives),
          icon: faCalendarDays,
          accent: "text-violet-600 bg-violet-50",
        },
        {
          label: "Taux de remplissage",
          hint: `${stats.formationsTotal} formation${stats.formationsTotal > 1 ? "s" : ""}`,
          value: `${stats.tauxRemplissage}%`,
          icon: faChartPie,
          accent: "text-amber-600 bg-amber-50",
        },
      ]
    : [];

  return (
    <div className="relative max-w-6xl mx-auto">
      <div className={loading ? "opacity-50 pointer-events-none select-none" : ""}>
        {/* Bandeau logo */}
        {stats && hasLogo === false && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faImage} className="text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-950">Ajoutez le logo de votre centre</p>
              <p className="text-sm text-amber-900/80 mt-0.5">
                Visible sur la recherche, les convocations et vos factures PDF.
              </p>
            </div>
            <Link
              href="/espace-centre/profil-centre?tab=design"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shrink-0"
            >
              Téléverser
              <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* En-tête */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Tableau de bord
            </h1>
            <p className="text-slate-600 text-base mt-1">
              Vue d&apos;ensemble de votre activité
            </p>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
            >
              <FontAwesomeIcon icon={faFileExport} className="text-blue-600" />
              Exporter
              <FontAwesomeIcon icon={faChevronDown} className="text-slate-400 text-xs" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg z-50 py-1 overflow-hidden">
                {exportOptions.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      window.open(`/api/centre/exports?type=${opt.type}`, "_blank");
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {stats && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {kpis.map((k) => (
                <div
                  key={k.label}
                  className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${k.accent}`}>
                      <FontAwesomeIcon icon={k.icon} className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-snug">{k.label}</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">{k.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{k.hint}</p>
                </div>
              ))}
            </div>

            {/* Avis */}
            {stats.questionnaires && (
              <div className="mb-6 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <FontAwesomeIcon icon={faStar} className="text-amber-500" />
                    Avis stagiaires
                  </h2>
                  <Link href="/espace-centre/avis" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Gérer →
                  </Link>
                </div>
                <div className="p-5 grid sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-slate-500">Note moyenne</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {stats.questionnaires.averageRating > 0
                        ? `${stats.questionnaires.averageRating}/5`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Réponses reçues</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {stats.questionnaires.totalResponses}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">En attente de réponse</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      {stats.questionnaires.pendingCount}
                    </p>
                  </div>
                </div>
                {stats.questionnaires.recent.length > 0 && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-3 space-y-2">
                    {stats.questionnaires.recent.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="flex justify-between gap-3 py-2 border-b border-slate-50 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{r.auteur}</p>
                          <p className="text-sm text-slate-500 truncate">{r.formation}</p>
                        </div>
                        <span className="text-sm font-bold text-amber-600 shrink-0">
                          {r.noteGlobale.toFixed(1)}/5
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Réservations récentes */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Réservations récentes</h2>
                <Link
                  href="/espace-centre/sessions"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Voir tout
                </Link>
              </div>

              {stats.reservationsRecentes.length === 0 ? (
                <p className="text-center py-12 text-slate-500 text-sm">
                  Aucune réservation pour le moment.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.reservationsRecentes.map((r) => {
                    const badge = statusBadge[r.status] ?? statusBadge.EN_ATTENTE;
                    const initials = r.eleve
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <li
                        key={r.id}
                        className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/80"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-slate-600">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{r.eleve}</p>
                          <p className="text-sm text-slate-600 truncate">{r.formation}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <p className="text-sm text-slate-500 mt-1.5">
                            {formatDate(new Date(r.date))}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Actions rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Ajouter une session", href: "/espace-centre/sessions", icon: faCalendarDays, color: "text-blue-600" },
                { label: "Créer une formation", href: "/espace-centre/formations", icon: faGraduationCap, color: "text-violet-600" },
                { label: "Avis & questionnaires", href: "/espace-centre/avis", icon: faStar, color: "text-amber-600" },
                { label: "Voir les réservations", href: "/espace-centre/sessions", icon: faCircleCheck, color: "text-emerald-600" },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <FontAwesomeIcon icon={a.icon} className={`w-5 h-5 ${a.color}`} />
                  <span className="text-sm font-semibold text-slate-800">{a.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {loading && !stats && (
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <KpiGridSkeleton />
        </div>
      )}
      <LoadingOverlay show={loading} label="Chargement du tableau de bord..." />
    </div>
  );
}
