"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faPlus,
  faTrash,
  faClock,
  faCalendarCheck,
  faTriangleExclamation,
  faCheck,
  faStickyNote,
} from "@fortawesome/free-solid-svg-icons";
import { Calendar, CalendarEvent } from "@/components/ui/Calendar";

// ─── Types ────────────────────────────────────────────────
interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  note: string | null;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Page Component ───────────────────────────────────────
export default function DisponibilitesPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Fetch availabilities
  const fetchSlots = useCallback(async () => {
    try {
      // Fetch a wide range (3 months back and forward)
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      const to = new Date();
      to.setMonth(to.getMonth() + 3);

      const res = await fetch(
        `/api/centre/formateur/availability?from=${from.toISOString()}&to=${to.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch {
      // Ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Calendar events from availability slots
  const calendarEvents: CalendarEvent[] = slots.map((slot) => ({
    id: slot.id,
    date: slot.date,
    title: `${slot.startTime} - ${slot.endTime}${slot.isBooked ? " (reserve)" : ""}`,
    color: slot.isBooked ? "#DC2626" : "#059669",
  }));

  // Handle day click — open form
  function handleDayClick(date: Date) {
    setSelectedDate(date);
    setStartTime("09:00");
    setEndTime("17:00");
    setNote("");
    setShowForm(true);
  }

  // Create slot
  async function createSlot() {
    if (!selectedDate) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/centre/formateur/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: toDateKey(selectedDate),
          startTime,
          endTime,
          note: note || undefined,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Disponibilite ajoutee." });
        setShowForm(false);
        fetchSlots();
      } else {
        const data = await res.json().catch(() => null);
        setMessage({ type: "error", text: data?.error ?? "Erreur lors de l'ajout." });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion." });
    }

    setSaving(false);
    setTimeout(() => setMessage(null), 4000);
  }

  // Delete slot
  async function deleteSlot(id: string) {
    if (!confirm("Supprimer cette disponibilite ?")) return;

    try {
      const res = await fetch(`/api/centre/formateur/availability?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== id));
        setMessage({ type: "success", text: "Disponibilite supprimee." });
      } else {
        setMessage({ type: "error", text: "Erreur lors de la suppression." });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion." });
    }
    setTimeout(() => setMessage(null), 4000);
  }

  // Upcoming slots (future only, sorted by date)
  const upcomingSlots = slots
    .filter((s) => new Date(s.date) >= new Date(toDateKey(new Date())))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 15);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
        <span className="text-sm">Chargement des disponibilites...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Disponibilites</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Gerez vos creneaux de disponibilite pour les formations
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Ajouter
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-400/10 border border-green-500/20 text-green-400"
              : "bg-red-400/10 border border-red-500/20 text-red-400"
          }`}
        >
          <FontAwesomeIcon
            icon={message.type === "success" ? faCheck : faTriangleExclamation}
            className="text-xs"
          />
          {message.text}
        </div>
      )}

      {/* Add form modal */}
      {showForm && selectedDate && (
        <div className="rounded-xl border p-5" style={{ background: "#0D1D3A", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarCheck} className="text-blue-400 text-xs" />
              Nouveau creneau — {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-white text-sm"
            >
              Fermer
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">Date</label>
              <input
                type="date"
                value={toDateKey(selectedDate)}
                onChange={(e) => setSelectedDate(new Date(e.target.value + "T12:00:00"))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">Heure de debut</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">Heure de fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-gray-400 text-xs font-medium mb-1.5 block">Note (optionnel)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
              placeholder="Ex: Disponible uniquement pour stages recuperation de points"
            />
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={createSlot}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
            >
              {saving ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
              ) : (
                <FontAwesomeIcon icon={faCheck} className="text-xs" />
              )}
              Ajouter le creneau
            </button>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-xl border p-5" style={{ background: "#0D1D3A", borderColor: "rgba(255,255,255,0.07)" }}>
        <Calendar
          events={calendarEvents}
          onDayClick={handleDayClick}
        />
        <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
            <span className="text-xs text-gray-500">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span className="text-xs text-gray-500">Reserve</span>
          </div>
        </div>
      </div>

      {/* Upcoming slots list */}
      <div className="rounded-xl border p-5" style={{ background: "#0D1D3A", borderColor: "rgba(255,255,255,0.07)" }}>
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faClock} className="text-blue-400 text-xs" />
          Prochaines disponibilites
        </h2>

        {upcomingSlots.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">
            Aucune disponibilite a venir. Cliquez sur un jour du calendrier pour en ajouter.
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingSlots.map((slot) => {
              const date = new Date(slot.date);
              return (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[48px]">
                      <div className="text-xs text-gray-500 uppercase">
                        {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                      </div>
                      <div className="text-lg font-bold text-white">{date.getDate()}</div>
                      <div className="text-[10px] text-gray-600">
                        {date.toLocaleDateString("fr-FR", { month: "short" })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${slot.isBooked ? "bg-red-500" : "bg-green-500"}`}
                        />
                        <span className="text-white text-sm font-medium">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        {slot.isBooked && (
                          <span className="text-[10px] font-semibold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                            Reserve
                          </span>
                        )}
                      </div>
                      {slot.note && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <FontAwesomeIcon icon={faStickyNote} className="text-[9px] text-gray-600" />
                          <span className="text-xs text-gray-500">{slot.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!slot.isBooked && (
                    <button
                      onClick={() => deleteSlot(slot.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-2"
                      title="Supprimer"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
