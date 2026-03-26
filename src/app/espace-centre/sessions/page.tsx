"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faPlus, faUsers, faLocationDot, faClock, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

interface Session {
  id: string;
  formation: string;
  dateDebut: string;
  dateFin: string;
  ville: string;
  placesTotal: number;
  placesRestantes: number;
  status: string;
}

const MOCK: Session[] = [
  { id: "s1", formation: "Stage de récupération de points", dateDebut: "2026-04-12T08:30:00", dateFin: "2026-04-13T17:30:00", ville: "Osny (95)", placesTotal: 10, placesRestantes: 3, status: "ACTIVE" },
  { id: "s2", formation: "Stage de récupération de points", dateDebut: "2026-04-19T08:30:00", dateFin: "2026-04-20T17:30:00", ville: "Osny (95)", placesTotal: 10, placesRestantes: 10, status: "ACTIVE" },
  { id: "s3", formation: "Sensibilisation sécurité routière", dateDebut: "2026-04-26T09:00:00", dateFin: "2026-04-26T17:00:00", ville: "Cergy (95)", placesTotal: 8, placesRestantes: 5, status: "ACTIVE" },
  { id: "s4", formation: "Stage de récupération de points", dateDebut: "2026-03-28T08:30:00", dateFin: "2026-03-29T17:30:00", ville: "Osny (95)", placesTotal: 10, placesRestantes: 0, status: "TERMINEE" },
];

export default function SessionsCentrePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/centre/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setSessions(data);
        else setSessions(MOCK);
      })
      .catch(() => setSessions(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const actives = sessions.filter((s) => s.status === "ACTIVE" || s.status === "PLANIFIEE");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Mes sessions</h1>
          <p className="text-gray-500 text-sm">
            {loading ? "Chargement…" : `${actives.length} session${actives.length > 1 ? "s" : ""} à venir`}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all">
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Nouvelle session
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const placesOccupees = s.placesTotal - s.placesRestantes;
            const taux = Math.round((placesOccupees / s.placesTotal) * 100);
            const isFull = s.placesRestantes === 0;
            const isTerminee = s.status === "TERMINEE" || s.status === "ANNULEE";

            return (
              <div key={s.id} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white text-sm">{s.formation}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isFull ? "text-orange-400 bg-orange-400/10"
                        : isTerminee ? "text-gray-400 bg-gray-400/10"
                        : "text-green-400 bg-green-400/10"
                      }`}>
                        {isFull ? "Complet" : isTerminee ? "Terminée" : "Disponible"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                        {formatDate(new Date(s.dateDebut))} → {formatDate(new Date(s.dateFin))}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3" />
                        {s.ville}
                      </span>
                    </div>

                    {/* Progress bar places */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                          {placesOccupees}/{s.placesTotal} places
                        </span>
                        <span>{taux}% rempli</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${taux}%`,
                            background: taux >= 90 ? "#f97316" : taux >= 50 ? "#3b82f6" : "#22c55e",
                          }}
                        />
                      </div>
                    </div>
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
