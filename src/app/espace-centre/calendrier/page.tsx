"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faTriangleExclamation,
  faCalendarDays,
  faXmark,
  faPlus,
  faUsers,
  faMapMarkerAlt,
  faEuroSign,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { Calendar, CalendarEvent } from "@/components/ui/Calendar";
import { formatDate, formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
interface Session {
  id: string;
  formationId: string;
  formation: string;
  prix: number;
  dateDebut: string;
  dateFin: string;
  ville: string;
  placesTotal: number;
  placesRestantes: number;
  status: "ACTIVE" | "ANNULEE" | "COMPLETE" | "PASSEE";
  reservationsCount: number;
}

const statusColors: Record<string, string> = {
  ACTIVE: "#2563EB",
  COMPLETE: "#059669",
  ANNULEE: "#DC2626",
  PASSEE: "#6B7280",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETE: "Complète",
  ANNULEE: "Annulée",
  PASSEE: "Passée",
};

// ─── Page Component ───────────────────────────────────────
export default function CalendrierPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role
  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.role) setUserRole(data.role);
      })
      .catch(() => null);
  }, []);

  // Fetch sessions
  useEffect(() => {
    fetch("/api/centre/sessions")
      .then(async (r) => {
        if (!r.ok) throw new Error("Erreur lors du chargement");
        return r.json();
      })
      .then((data: Session[]) => {
        setSessions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter sessions for formateur (only their sessions)
  // The API already handles this since it uses getUserCentreId,
  // but if formateur should only see their own sessions we note it.
  // For now, the API returns all centre sessions — formateurs see the full centre calendar.

  // Transform sessions to calendar events
  const calendarEvents: CalendarEvent[] = sessions.map((s) => ({
    id: s.id,
    date: s.dateDebut,
    title: s.formation,
    color: statusColors[s.status] ?? "#2563EB",
  }));

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      const session = sessions.find((s) => s.id === event.id);
      if (session) setSelectedSession(session);
    },
    [sessions]
  );

  const handleDayClick = useCallback(
    (date: Date) => {
      // Check if there are sessions on this day
      const dayStr = date.toISOString().slice(0, 10);
      const daySessions = sessions.filter(
        (s) => new Date(s.dateDebut).toISOString().slice(0, 10) === dayStr
      );

      if (daySessions.length === 1) {
        setSelectedSession(daySessions[0]);
      } else if (daySessions.length === 0 && (userRole === "CENTRE_OWNER" || userRole === "CENTRE_ADMIN")) {
        // Quick create: redirect to sessions page with pre-filled date
        const dateParam = date.toISOString().slice(0, 10);
        window.location.href = `/espace-centre/sessions?newSession=true&date=${dateParam}`;
      }
    },
    [sessions, userRole]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">
            <FontAwesomeIcon icon={faCalendarDays} className="text-blue-400 mr-3" />
            Calendrier des sessions
          </h1>
          <p className="text-gray-500 text-sm">
            Visualisez et gérez toutes vos sessions de formation
          </p>
        </div>
        {(userRole === "CENTRE_OWNER" || userRole === "CENTRE_ADMIN") && (
          <a
            href="/espace-centre/sessions?newSession=true"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            Nouvelle session
          </a>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColors[key] }}
            />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement du calendrier...</span>
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
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* Calendar */}
          <div
            className="rounded-xl border p-4 sm:p-6"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <Calendar
              events={calendarEvents}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Sessions actives", value: sessions.filter((s) => s.status === "ACTIVE").length, color: "text-blue-400" },
              { label: "Complètes", value: sessions.filter((s) => s.status === "COMPLETE").length, color: "text-green-400" },
              { label: "Passées", value: sessions.filter((s) => s.status === "PASSEE").length, color: "text-gray-400" },
              { label: "Annulées", value: sessions.filter((s) => s.status === "ANNULEE").length, color: "text-red-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border p-3 text-center"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Session Detail Popup */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSession(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg rounded-xl border overflow-hidden"
            style={{ background: "#0D1D3A", borderColor: "rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Color bar */}
            <div
              className="h-1.5"
              style={{ backgroundColor: statusColors[selectedSession.status] ?? "#2563EB" }}
            />

            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {selectedSession.formation}
                </h3>
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${statusColors[selectedSession.status]}20`,
                      color: statusColors[selectedSession.status],
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[selectedSession.status] }} />
                    {statusLabels[selectedSession.status]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-500 hover:text-white transition-colors p-1"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faClock} className="text-blue-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dates</p>
                    <p className="text-sm text-white font-medium">
                      {formatDate(selectedSession.dateDebut, "short")}
                    </p>
                    <p className="text-xs text-gray-400">
                      au {formatDate(selectedSession.dateFin, "short")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-purple-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lieu</p>
                    <p className="text-sm text-white font-medium">{selectedSession.ville}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUsers} className="text-green-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Places</p>
                    <p className="text-sm text-white font-medium">
                      {selectedSession.reservationsCount} / {selectedSession.placesTotal}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedSession.placesRestantes} restante{selectedSession.placesRestantes !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faEuroSign} className="text-yellow-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Prix</p>
                    <p className="text-sm text-white font-medium">{formatPrice(selectedSession.prix)}</p>
                  </div>
                </div>
              </div>

              {/* Progress bar places */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Taux de remplissage</span>
                  <span className="text-white font-medium">
                    {Math.round(((selectedSession.placesTotal - selectedSession.placesRestantes) / selectedSession.placesTotal) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((selectedSession.placesTotal - selectedSession.placesRestantes) / selectedSession.placesTotal) * 100}%`,
                      backgroundColor: statusColors[selectedSession.status] ?? "#2563EB",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3 p-5 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <a
                href={`/espace-centre/sessions`}
                className="flex-1 text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Voir la session
              </a>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg border transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
