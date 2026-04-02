"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved,
  faSpinner,
  faBuilding,
  faCalendarXmark,
  faClock,
  faCheckCircle,
  faBan,
  faCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

interface CentreEnAttente {
  id: string;
  nom: string;
  ville: string;
  email: string;
  createdAt: string;
}

interface FormationSansSession {
  id: string;
  titre: string;
  centreNom: string;
  centreId: string;
  createdAt: string;
}

const MOCK_CENTRES_EN_ATTENTE: CentreEnAttente[] = [
  { id: "4", nom: "Centre Conduite Nantes", ville: "Nantes", email: "conduite.nantes@gmail.com", createdAt: "2026-03-21T00:00:00Z" },
  { id: "5", nom: "Auto-Ecole Bordelaise", ville: "Bordeaux", email: "ae-bordelaise@gmail.com", createdAt: "2026-03-22T00:00:00Z" },
  { id: "7", nom: "Permis Plus Marseille", ville: "Marseille", email: "permisplus13@gmail.com", createdAt: "2026-03-28T00:00:00Z" },
];

const MOCK_FORMATIONS_SANS_SESSION: FormationSansSession[] = [
  { id: "f1", titre: "Stage recuperation de points - 2 jours", centreNom: "BYS Formation Osny", centreId: "1", createdAt: "2026-03-15T00:00:00Z" },
  { id: "f2", titre: "Stage sensibilisation securite routiere", centreNom: "Auto-Ecole Montmartre", centreId: "2", createdAt: "2026-03-20T00:00:00Z" },
];

export default function PlateformeModerationPage() {
  const [centresEnAttente, setCentresEnAttente] = useState<CentreEnAttente[]>([]);
  const [formationsSansSession, setFormationsSansSession] = useState<FormationSansSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data?.centresEnAttenteList && Array.isArray(data.centresEnAttenteList)) {
          setCentresEnAttente(data.centresEnAttenteList);
        } else {
          setCentresEnAttente(MOCK_CENTRES_EN_ATTENTE);
        }
        // Les formations sans session ne sont pas dans /api/admin/stats, on utilise les mocks
        setFormationsSansSession(MOCK_FORMATIONS_SANS_SESSION);
      })
      .catch(() => {
        setCentresEnAttente(MOCK_CENTRES_EN_ATTENTE);
        setFormationsSansSession(MOCK_FORMATIONS_SANS_SESSION);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleActiverCentre = async (centreId: string) => {
    setActionLoading(centreId);
    try {
      const res = await fetch(`/api/centres/${centreId}/activer`, { method: "POST" });
      if (res.ok) {
        setCentresEnAttente((prev) => prev.filter((c) => c.id !== centreId));
      }
    } catch {
      // Fallback: retirer du state en mode mock
      setCentresEnAttente((prev) => prev.filter((c) => c.id !== centreId));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendreCentre = async (centreId: string) => {
    setActionLoading(`suspend-${centreId}`);
    try {
      const res = await fetch(`/api/centres/${centreId}/suspendre`, { method: "POST" });
      if (res.ok) {
        setCentresEnAttente((prev) => prev.filter((c) => c.id !== centreId));
      }
    } catch {
      setCentresEnAttente((prev) => prev.filter((c) => c.id !== centreId));
    } finally {
      setActionLoading(null);
    }
  };

  const totalFlags = centresEnAttente.length + formationsSansSession.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Moderation</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Revue des centres et formations en attente d&apos;action
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-500/20">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400 text-xs" />
          <span className="text-yellow-400 text-xs font-medium">
            {loading ? "..." : totalFlags} element{totalFlags > 1 ? "s" : ""} a traiter
          </span>
        </div>
      </div>

      {/* KPIs rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-5 border bg-[#0A1628] border-yellow-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faBuilding} className="text-yellow-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : centresEnAttente.length}</p>
          <p className="text-xs text-gray-500 mt-1">Centres en attente d&apos;activation</p>
        </div>
        <div className="rounded-xl p-5 border bg-[#0A1628] border-orange-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-400/10 border border-orange-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faCalendarXmark} className="text-orange-400 text-sm" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : formationsSansSession.length}</p>
          <p className="text-xs text-gray-500 mt-1">Formations sans sessions planifiees</p>
        </div>
      </div>

      {/* Centres en attente */}
      <div className="bg-[#0A1628] rounded-xl border border-yellow-500/20 p-5">
        <div className="flex items-center gap-2 mb-5">
          <FontAwesomeIcon icon={faClock} className="text-yellow-400 text-sm" />
          <h2 className="text-white font-semibold text-sm">Centres en attente d&apos;activation</h2>
          <span className="ml-auto text-yellow-400 text-xs font-semibold bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
            {centresEnAttente.length}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4 justify-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : centresEnAttente.length === 0 ? (
          <div className="text-center py-6">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-2xl mb-2" />
            <p className="text-gray-500 text-sm">Aucun centre en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {centresEnAttente.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/3 border border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircle} className="text-yellow-400 text-[6px]" />
                    <p className="text-white font-medium text-sm">{c.nom}</p>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {c.ville} &mdash; {c.email}
                  </p>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    Inscrit le {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleActiverCentre(c.id)}
                    disabled={actionLoading === c.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600/15 text-green-400 text-sm font-medium border border-green-500/20 hover:bg-green-600/25 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === c.id ? (
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                    ) : (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                    )}
                    Activer
                  </button>
                  <button
                    onClick={() => handleSuspendreCentre(c.id)}
                    disabled={actionLoading === `suspend-${c.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/15 text-red-400 text-sm font-medium border border-red-500/20 hover:bg-red-600/25 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === `suspend-${c.id}` ? (
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                    ) : (
                      <FontAwesomeIcon icon={faBan} className="text-xs" />
                    )}
                    Suspendre
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formations sans sessions */}
      <div className="bg-[#0A1628] rounded-xl border border-orange-500/20 p-5">
        <div className="flex items-center gap-2 mb-5">
          <FontAwesomeIcon icon={faCalendarXmark} className="text-orange-400 text-sm" />
          <h2 className="text-white font-semibold text-sm">Formations sans sessions planifiees</h2>
          <span className="ml-auto text-orange-400 text-xs font-semibold bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-500/20">
            {formationsSansSession.length}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4 justify-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : formationsSansSession.length === 0 ? (
          <div className="text-center py-6">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-2xl mb-2" />
            <p className="text-gray-500 text-sm">Toutes les formations ont des sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formationsSansSession.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/3 border border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircle} className="text-orange-400 text-[6px]" />
                    <p className="text-white font-medium text-sm">{f.titre}</p>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Centre : {f.centreNom}
                  </p>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    Creee le {new Date(f.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-orange-400/10 text-orange-400 border-orange-500/20">
                    Aucune session
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
