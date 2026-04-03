"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap, faPlus, faPen, faToggleOn, faToggleOff,
  faEuroSign, faClock, faAward, faSpinner, faTrash,
  faXmark, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

interface Formation {
  id: string;
  titre: string;
  slug: string;
  description: string;
  objectifs: string | null;
  programme: string | null;
  prerequis: string | null;
  publicCible: string | null;
  prix: number;
  duree: string;
  modalite: string;
  lieu: string | null;
  isQualiopi: boolean;
  isCPF: boolean;
  isActive: boolean;
  categorieId: string | null;
  categorie: string | null;
  sessionsCount: number;
  sessionsActives: number;
}

interface Categorie {
  id: string;
  nom: string;
}

const defaultFormData = {
  titre: "",
  description: "",
  prix: 0,
  duree: "",
  modalite: "PRESENTIEL",
  lieu: "",
  isQualiopi: false,
  isCPF: false,
  categorieId: "",
  objectifs: "",
  programme: "",
  prerequis: "",
  publicCible: "",
};

export default function FormationsCentrePage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFormations = useCallback(() => {
    setLoading(true);
    fetch("/api/centre/formations")
      .then((r) => {
        if (!r.ok) throw new Error("Impossible de charger les formations");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setFormations(data);
        else setFormations([]);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadCategories = useCallback(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => { /* silently fail */ });
  }, []);

  useEffect(() => {
    loadFormations();
    loadCategories();
  }, [loadFormations, loadCategories]);

  function openCreateModal() {
    setEditingFormation(null);
    setFormData(defaultFormData);
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(f: Formation) {
    setEditingFormation(f);
    setFormData({
      titre: f.titre,
      description: f.description,
      prix: f.prix,
      duree: f.duree,
      modalite: f.modalite,
      lieu: f.lieu ?? "",
      isQualiopi: f.isQualiopi,
      isCPF: f.isCPF,
      categorieId: f.categorieId ?? "",
      objectifs: f.objectifs ?? "",
      programme: f.programme ?? "",
      prerequis: f.prerequis ?? "",
      publicCible: f.publicCible ?? "",
    });
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      ...formData,
      prix: Number(formData.prix),
      categorieId: formData.categorieId || null,
      lieu: formData.lieu || null,
      objectifs: formData.objectifs || null,
      programme: formData.programme || null,
      prerequis: formData.prerequis || null,
      publicCible: formData.publicCible || null,
    };

    try {
      if (editingFormation) {
        const res = await fetch(`/api/centre/formations/${editingFormation.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur lors de la modification");
        setFormations((prev) => prev.map((f) => (f.id === data.id ? data : f)));
      } else {
        const res = await fetch("/api/centre/formations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur lors de la création");
        setFormations((prev) => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/centre/formations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setFormations((prev) => prev.map((f) => (f.id === id ? { ...f, isActive: !current } : f)));
      }
    } catch {
      /* silently fail */
    }
  }

  async function deleteFormation(id: string) {
    try {
      const res = await fetch(`/api/centre/formations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFormations((prev) => prev.map((f) => (f.id === id ? { ...f, isActive: false } : f)));
      }
    } catch {
      /* silently fail */
    } finally {
      setDeletingId(null);
    }
  }

  const actives = formations.filter((f) => f.isActive).length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Mes formations</h1>
          <p className="text-gray-500 text-sm">
            {loading ? "Chargement..." : `${actives} formation${actives > 1 ? "s" : ""} active${actives > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Nouvelle formation
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={loadFormations} className="text-xs text-blue-400 hover:text-blue-300 underline">Réessayer</button>
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
      {!loading && !error && formations.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FontAwesomeIcon icon={faGraduationCap} className="text-3xl mb-3" />
          <p className="font-medium text-white mb-1">Aucune formation</p>
          <p className="text-sm">Créez votre première formation en cliquant sur &quot;Nouvelle formation&quot;.</p>
        </div>
      )}

      {/* Formations list */}
      {!loading && !error && formations.length > 0 && (
        <div className="space-y-4">
          {formations.map((f) => (
            <div
              key={f.id}
              className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                opacity: f.isActive ? 1 : 0.6,
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faGraduationCap} className="text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white text-sm">{f.titre}</h3>
                  {f.isQualiopi && (
                    <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FontAwesomeIcon icon={faAward} className="w-3 h-3" />Qualiopi
                    </span>
                  )}
                  {f.isCPF && (
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">CPF</span>
                  )}
                  {f.categorie && (
                    <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">{f.categorie}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.isActive ? "text-green-400 bg-green-400/10" : "text-gray-500 bg-gray-500/10"}`}>
                    {f.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faEuroSign} className="w-3 h-3" />
                    {f.prix} EUR
                  </span>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                    {f.duree}
                  </span>
                  <span>{f.sessionsCount} session{f.sessionsCount > 1 ? "s" : ""} ({f.sessionsActives} active{f.sessionsActives > 1 ? "s" : ""})</span>
                  <span className="capitalize">{f.modalite.toLowerCase()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEditModal(f)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                  Modifier
                </button>
                <button
                  onClick={() => toggleActive(f.id, f.isActive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${f.isActive ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}`}
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <FontAwesomeIcon icon={f.isActive ? faToggleOn : faToggleOff} className="w-3.5 h-3.5" />
                  {f.isActive ? "Désactiver" : "Activer"}
                </button>
                {deletingId === f.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteFormation(f.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 transition-colors bg-red-400/10"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(f.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 my-8" style={{ background: "#0D1D3A", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-white">
                {editingFormation ? "Modifier la formation" : "Nouvelle formation"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  required
                  minLength={3}
                  maxLength={200}
                  placeholder="Stage de récupération de points"
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  minLength={10}
                  rows={3}
                  placeholder="Description détaillée de la formation..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Prix + Durée */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Prix (EUR) *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Durée *</label>
                  <input
                    type="text"
                    value={formData.duree}
                    onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                    required
                    placeholder="2 jours"
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              </div>

              {/* Modalité + Lieu */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Modalité</label>
                  <select
                    value={formData.modalite}
                    onChange={(e) => setFormData({ ...formData, modalite: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <option value="PRESENTIEL">Présentiel</option>
                    <option value="DISTANCIEL">Distanciel</option>
                    <option value="HYBRIDE">Hybride</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Lieu</label>
                  <input
                    type="text"
                    value={formData.lieu}
                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                    placeholder="Osny (95)"
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              </div>

              {/* Catégorie */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Catégorie</label>
                  <select
                    value={formData.categorieId}
                    onChange={(e) => setFormData({ ...formData, categorieId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <option value="">Aucune catégorie</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Certifications */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isQualiopi}
                    onChange={(e) => setFormData({ ...formData, isQualiopi: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-white/5 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-300">Qualiopi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCPF}
                    onChange={(e) => setFormData({ ...formData, isCPF: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-white/5 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-300">Éligible CPF</span>
                </label>
              </div>

              {/* Objectifs */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Objectifs</label>
                <textarea
                  value={formData.objectifs}
                  onChange={(e) => setFormData({ ...formData, objectifs: e.target.value })}
                  rows={2}
                  placeholder="Objectifs de la formation..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Programme */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Programme</label>
                <textarea
                  value={formData.programme}
                  onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                  rows={3}
                  placeholder="Programme détaillé..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Prérequis */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Prérequis</label>
                <textarea
                  value={formData.prerequis}
                  onChange={(e) => setFormData({ ...formData, prerequis: e.target.value })}
                  rows={2}
                  placeholder="Prérequis nécessaires..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Public cible */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Public cible</label>
                <textarea
                  value={formData.publicCible}
                  onChange={(e) => setFormData({ ...formData, publicCible: e.target.value })}
                  rows={2}
                  placeholder="À qui s'adresse cette formation..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5" />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 sticky bottom-0 pb-1" style={{ background: "#0D1D3A" }}>
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
                  disabled={submitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  {submitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3.5 h-3.5" />}
                  {editingFormation ? "Enregistrer" : "Créer la formation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
