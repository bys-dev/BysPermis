"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTag,
  faPlus,
  faToggleOn,
  faToggleOff,
  faTrash,
  faSpinner,
  faPercent,
  faEuroSign,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  type: string;
  valeur: number;
  minAchat: number | null;
  maxUtilisations: number | null;
  utilisations: number;
  dateDebut: string;
  dateFin: string;
  isActive: boolean;
  centreId: string | null;
  centre: { id: string; nom: string } | null;
  createdAt: string;
}

export default function AdminPromoPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"POURCENTAGE" | "MONTANT_FIXE">("POURCENTAGE");
  const [formValeur, setFormValeur] = useState("");
  const [formMinAchat, setFormMinAchat] = useState("");
  const [formMaxUtilisations, setFormMaxUtilisations] = useState("");
  const [formDateDebut, setFormDateDebut] = useState("");
  const [formDateFin, setFormDateFin] = useState("");

  async function fetchPromos() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo");
      if (res.ok) {
        const data = await res.json();
        setPromos(data);
      }
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPromos();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          description: formDescription || undefined,
          type: formType,
          valeur: parseFloat(formValeur),
          minAchat: formMinAchat ? parseFloat(formMinAchat) : null,
          maxUtilisations: formMaxUtilisations ? parseInt(formMaxUtilisations) : null,
          dateDebut: formDateDebut,
          dateFin: formDateFin,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        resetForm();
        await fetchPromos();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Erreur lors de la création");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(promo: PromoCode) {
    try {
      await fetch("/api/admin/promo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: promo.id, isActive: !promo.isActive }),
      });
      await fetchPromos();
    } catch {
      setError("Erreur lors de la mise à jour");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce code promo définitivement ?")) return;
    try {
      const res = await fetch("/api/admin/promo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchPromos();
      } else {
        setError("Seul le propriétaire peut supprimer un code promo");
      }
    } catch {
      setError("Erreur lors de la suppression");
    }
  }

  function resetForm() {
    setFormCode("");
    setFormDescription("");
    setFormType("POURCENTAGE");
    setFormValeur("");
    setFormMinAchat("");
    setFormMaxUtilisations("");
    setFormDateDebut("");
    setFormDateFin("");
  }

  function isExpired(dateFin: string) {
    return new Date(dateFin) < new Date();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Codes promo</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les codes promotionnels de la plateforme</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <FontAwesomeIcon icon={showForm ? faXmark : faPlus} className="text-xs" />
          {showForm ? "Annuler" : "Créer un code promo"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-white/10 p-6 space-y-4" style={{ background: "#0D1D3A" }}>
          <h2 className="text-white font-semibold text-lg mb-2">Nouveau code promo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Code *</label>
              <input
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                required
                placeholder="BIENVENUE10"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="10% de réduction bienvenue"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type *</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as "POURCENTAGE" | "MONTANT_FIXE")}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="POURCENTAGE">Pourcentage (%)</option>
                <option value="MONTANT_FIXE">Montant fixe (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Valeur * ({formType === "POURCENTAGE" ? "%" : "€"})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formValeur}
                onChange={(e) => setFormValeur(e.target.value)}
                required
                placeholder="10"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Montant minimum d'achat (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formMinAchat}
                onChange={(e) => setFormMinAchat(e.target.value)}
                placeholder="Aucun"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max utilisations</label>
              <input
                type="number"
                min="1"
                value={formMaxUtilisations}
                onChange={(e) => setFormMaxUtilisations(e.target.value)}
                placeholder="Illimité"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date de début *</label>
              <input
                type="date"
                value={formDateDebut}
                onChange={(e) => setFormDateDebut(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date de fin *</label>
              <input
                type="date"
                value={formDateFin}
                onChange={(e) => setFormDateFin(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
              Créer
            </button>
          </div>
        </form>
      )}

      {/* Promo list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl mr-3" />
          Chargement...
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20">
          <FontAwesomeIcon icon={faTag} className="text-4xl text-gray-700 mb-4" />
          <p className="text-gray-500">Aucun code promo pour le moment</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "#0D1D3A" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Code</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-left px-5 py-3 font-medium">Valeur</th>
                  <th className="text-left px-5 py-3 font-medium">Utilisations</th>
                  <th className="text-left px-5 py-3 font-medium">Période</th>
                  <th className="text-left px-5 py-3 font-medium">Portée</th>
                  <th className="text-left px-5 py-3 font-medium">Statut</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {promos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded text-xs">
                        {promo.code}
                      </span>
                      {promo.description && (
                        <p className="text-gray-500 text-xs mt-1">{promo.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <FontAwesomeIcon
                          icon={promo.type === "POURCENTAGE" ? faPercent : faEuroSign}
                          className="text-[10px]"
                        />
                        {promo.type === "POURCENTAGE" ? "Pourcentage" : "Montant fixe"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white font-medium">
                      {promo.valeur}{promo.type === "POURCENTAGE" ? "%" : " €"}
                      {promo.minAchat && (
                        <p className="text-gray-600 text-xs">min. {promo.minAchat} €</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {promo.utilisations}{promo.maxUtilisations ? ` / ${promo.maxUtilisations}` : " / ∞"}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(promo.dateDebut).toLocaleDateString("fr-FR")}
                      <br />
                      → {new Date(promo.dateFin).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-4">
                      {promo.centre ? (
                        <span className="text-xs text-blue-400">{promo.centre.nom}</span>
                      ) : (
                        <span className="text-xs text-gray-500">Plateforme</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isExpired(promo.dateFin) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/20">
                          Expiré
                        </span>
                      ) : promo.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(promo)}
                          className="text-gray-500 hover:text-white transition-colors"
                          title={promo.isActive ? "Désactiver" : "Activer"}
                        >
                          <FontAwesomeIcon
                            icon={promo.isActive ? faToggleOn : faToggleOff}
                            className={`text-lg ${promo.isActive ? "text-green-400" : "text-gray-600"}`}
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
