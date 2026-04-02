"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCalendarDays,
  faUsers,
  faClock,
  faSpinner,
  faClipboardCheck,
  faCircleCheck,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

interface Stagiaire {
  id: string;
  nom: string;
  prenom: string;
  present: boolean;
}

interface SessionFormateur {
  id: string;
  formation: string;
  dateDebut: string;
  dateFin: string;
  nbStagiaires: number;
  placesTotal: number;
  status: string;
  stagiaires: Stagiaire[];
}

const MOCK_SESSIONS: SessionFormateur[] = [
  {
    id: "s1",
    formation: "Stage de récupération de points",
    dateDebut: "2026-04-12T08:30:00",
    dateFin: "2026-04-13T17:30:00",
    nbStagiaires: 7,
    placesTotal: 10,
    status: "ACTIVE",
    stagiaires: [
      { id: "u1", nom: "Dupont", prenom: "Jean", present: false },
      { id: "u2", nom: "Martin", prenom: "Marie", present: false },
      { id: "u3", nom: "Bernard", prenom: "Paul", present: false },
      { id: "u4", nom: "Leroy", prenom: "Sophie", present: false },
      { id: "u5", nom: "Moreau", prenom: "Lucas", present: false },
      { id: "u6", nom: "Thomas", prenom: "Emma", present: false },
      { id: "u7", nom: "Robert", prenom: "Hugo", present: false },
    ],
  },
  {
    id: "s2",
    formation: "Stage de récupération de points",
    dateDebut: "2026-04-19T08:30:00",
    dateFin: "2026-04-20T17:30:00",
    nbStagiaires: 0,
    placesTotal: 10,
    status: "ACTIVE",
    stagiaires: [],
  },
  {
    id: "s3",
    formation: "Sensibilisation sécurité routière",
    dateDebut: "2026-03-28T08:30:00",
    dateFin: "2026-03-29T17:30:00",
    nbStagiaires: 8,
    placesTotal: 8,
    status: "PASSEE",
    stagiaires: [],
  },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: "À venir",   color: "text-green-400",  bg: "bg-green-400/10" },
  PASSEE:   { label: "Terminée",  color: "text-gray-400",   bg: "bg-gray-400/10"  },
  ANNULEE:  { label: "Annulée",   color: "text-red-400",    bg: "bg-red-400/10"   },
  COMPLETE: { label: "Complète",  color: "text-blue-400",   bg: "bg-blue-400/10"  },
};

export default function MesSessionsPage() {
  const [sessions, setSessions] = useState<SessionFormateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionFormateur | null>(null);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/centre/formateur/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setSessions(data);
        else setSessions(MOCK_SESSIONS);
      })
      .catch(() => setSessions(MOCK_SESSIONS))
      .finally(() => setLoading(false));
  }, []);

  function openEmargement(session: SessionFormateur) {
    setSelectedSession(session);
    const initial: Record<string, boolean> = {};
    session.stagiaires.forEach((s) => {
      initial[s.id] = s.present;
    });
    setAttendance(initial);
  }

  function togglePresence(stagiaireId: string) {
    setAttendance((prev) => ({ ...prev, [stagiaireId]: !prev[stagiaireId] }));
  }

  async function saveEmargement() {
    if (!selectedSession) return;
    setSaving(true);
    try {
      await fetch(`/api/centre/formateur/sessions/${selectedSession.id}/emargement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance }),
      });
    } catch {
      // silently fail in dev
    } finally {
      setSaving(false);
    }
  }

  // Emargement view
  if (selectedSession) {
    const badge = statusMap[selectedSession.status] ?? statusMap["ACTIVE"];
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setSelectedSession(null)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Émargement</h1>
            <p className="text-gray-500 text-sm">
              {selectedSession.formation} — {formatDate(new Date(selectedSession.dateDebut))}
            </p>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faClipboardCheck} className="text-blue-400" />
              <span className="text-white text-sm font-semibold">Liste des stagiaires</span>
            </div>
            <span className="text-gray-500 text-xs">
              {Object.values(attendance).filter(Boolean).length}/{selectedSession.stagiaires.length} présents
            </span>
          </div>

          {selectedSession.stagiaires.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FontAwesomeIcon icon={faUsers} className="text-2xl mb-3" />
              <p className="text-sm">Aucun stagiaire inscrit pour cette session.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {selectedSession.stagiaires.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={attendance[s.id] ?? false}
                    onChange={() => togglePresence(s.id)}
                    className="w-5 h-5 rounded border-gray-600 bg-white/5 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-gray-400">
                      {s.prenom[0]}{s.nom[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{s.prenom} {s.nom}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${attendance[s.id] ? "text-green-400 bg-green-400/10" : "text-gray-500 bg-white/5"}`}>
                    {attendance[s.id] ? "Présent" : "Absent"}
                  </span>
                </label>
              ))}
            </div>
          )}

          {selectedSession.stagiaires.length > 0 && (
            <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <button
                onClick={saveEmargement}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {saving ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                ) : (
                  <FontAwesomeIcon icon={faCircleCheck} className="text-xs" />
                )}
                Valider l&apos;émargement
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sessions list
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Mes sessions</h1>
        <p className="text-gray-500 text-sm">
          {loading ? "Chargement…" : `${sessions.filter((s) => s.status === "ACTIVE").length} session(s) à venir`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FontAwesomeIcon icon={faBookOpen} className="text-3xl mb-3" />
          <p className="font-medium text-white mb-1">Aucune session</p>
          <p className="text-sm">Aucune session ne vous est attribuée pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const badge = statusMap[s.status] ?? statusMap["ACTIVE"];
            const isActive = s.status === "ACTIVE";

            return (
              <div
                key={s.id}
                className="rounded-xl p-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white text-sm">{s.formation}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color} ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                        {formatDate(new Date(s.dateDebut))} → {formatDate(new Date(s.dateFin))}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                        {s.nbStagiaires}/{s.placesTotal} stagiaires
                      </span>
                    </div>

                    {isActive && s.nbStagiaires > 0 && (
                      <button
                        onClick={() => openEmargement(s)}
                        className="inline-flex items-center gap-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <FontAwesomeIcon icon={faClipboardCheck} className="w-3.5 h-3.5" />
                        Émargement
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
