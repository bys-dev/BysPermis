"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays, faPlus, faUsers, faLocationDot, faClock,
  faSpinner, faXmark, faBan, faPen, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

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
  status: string;
  reservationsCount: number;
}

interface FormationOption {
  id: string;
  titre: string;
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: "Active",   color: "text-green-400",  bg: "bg-green-400/10" },
  ANNULEE:  { label: "Annulée",  color: "text-red-400",    bg: "bg-red-400/10"   },
  COMPLETE: { label: "Complète", color: "text-blue-400",   bg: "bg-blue-400/10"  },
  PASSEE:   { label: "Terminée", color: "text-gray-400",   bg: "bg-gray-400/10"  },
};

export default function SessionsCentrePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formations, setFormations] = useState<FormationOption[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    formationId: "",
    dateDebut: "",
    dateFin: "",
    placesTotal: 10,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm cancel
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadSessions = useCallback(() => {
    setLoading(true);
    fetch("/api/centre/sessions")
      .then((r) => {
        if (!r.ok) throw new Error("Impossible de charger les sessions");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setSessions(data);
        else setSessions([]);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadFormations = useCallback(() => {
    fetch("/api/centre/formations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFormations(data.filter((f: { isActive: boolean }) => f.isActive).map((f: { id: string; titre: string }) => ({ id: f.id, titre: f.titre })));
        }
      })
      .catch(() => { /* silently fail - formations dropdown will be empty */ });
  }, []);

  useEffect(() => {
    loadSessions();
    loadFormations();
  }, [loadSessions, loadFormations]);

  function openCreateModal() {
    setEditingSession(null);
    setFormData({ formationId: formations[0]?.id ?? "", dateDebut: "", dateFin: "", placesTotal: 10 });
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(session: Session) {
    setEditingSession(session);
    setFormData({
      formationId: session.formationId,
      dateDebut: session.dateDebut.slice(0, 16),
      dateFin: session.dateFin.slice(0, 16),
      placesTotal: session.placesTotal,
    });
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingSession) {
        // PATCH existing
        const res = await fetch("/api/centre/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingSession.id,
            dateDebut: formData.dateDebut,
            dateFin: formData.dateFin,
            placesTotal: formData.placesTotal,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur lors de la modification");
        setSessions((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      } else {
        // POST new
        const res = await fetch("/api/centre/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formationId: formData.formationId,
            dateDebut: formData.dateDebut,
            dateFin: formData.dateFin,
            placesTotal: formData.placesTotal,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur lors de la création");
        setSessions((prev) => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelSession(id: string) {
    try {
      const res = await fetch("/api/centre/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "ANNULEE" } : s)));
    } catch {
      // Could show a toast here
    } finally {
      setCancellingId(null);
    }
  }

  const actives = sessions.filter((s) => s.status === "ACTIVE");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Mes sessions</h1>
          <p className="text-gray-500 text-sm">
            {loading ? "Chargement..." : `${actives.length} session${actives.length > 1 ? "s" : ""} active${actives.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Nouvelle session
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={loadSessions} className="text-xs text-blue-400 hover:text-blue-300 underline">Réessayer</button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && sessions.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FontAwesomeIcon icon={faCalendarDays} className="text-3xl mb-3" />
          <p className="font-medium text-white mb-1">Aucune session</p>
          <p className="text-sm">Créez votre première session en cliquant sur &quot;Nouvelle session&quot;.</p>
        </div>
      )}

      {/* Sessions list */}
      {!loading && !error && sessions.length > 0 && (
        <div className="space-y-4">
          {sessions.map((s) => {
            const placesOccupees = s.placesTotal - s.placesRestantes;
            const taux = Math.round((placesOccupees / s.placesTotal) * 100);
            const isFull = s.placesRestantes === 0;
            const isTerminee = s.status === "PASSEE" || s.status === "ANNULEE";
            const badge = statusLabels[s.status] ?? statusLabels["ACTIVE"];

            return (
              <div key={s.id} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", opacity: isTerminee ? 0.6 : 1 }}>
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
                      {isFull && s.status === "ACTIVE" && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-orange-400 bg-orange-400/10">
                          Complet
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                        {formatDate(new Date(s.dateDebut))} &rarr; {formatDate(new Date(s.dateFin))}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3" />
                        {s.ville}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                        {s.reservationsCount} réservation{s.reservationsCount > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Progress bar */}
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

                  {/* Actions */}
                  {s.status === "ACTIVE" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditModal(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                        Modifier
                      </button>
                      {cancellingId === s.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => cancelSession(s.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 transition-colors bg-red-400/10"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => setCancellingId(null)}
                            className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          >
                            <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancellingId(s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          <FontAwesomeIcon icon={faBan} className="w-3 h-3" />
                          Annuler
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "#0D1D3A", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-white">
                {editingSession ? "Modifier la session" : "Nouvelle session"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Formation select (only for creation) */}
              {!editingSession && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Formation</label>
                  {formations.length === 0 ? (
                    <p className="text-xs text-yellow-400">Aucune formation active. Créez d&apos;abord une formation.</p>
                  ) : (
                    <select
                      value={formData.formationId}
                      onChange={(e) => setFormData({ ...formData, formationId: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <option value="">Sélectionner une formation</option>
                      {formations.map((f) => (
                        <option key={f.id} value={f.id}>{f.titre}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Date de début</label>
                  <input
                    type="datetime-local"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Date de fin</label>
                  <input
                    type="datetime-local"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre de places</label>
                <input
                  type="number"
                  min={1}
                  value={formData.placesTotal}
                  onChange={(e) => setFormData({ ...formData, placesTotal: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5" />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!editingSession && formations.length === 0)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  {submitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3.5 h-3.5" />}
                  {editingSession ? "Enregistrer" : "Créer la session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
