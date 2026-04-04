"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTag,
  faPlus,
  faToggleOn,
  faToggleOff,
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
  createdAt: string;
}

export default function CentrePromoPage() {
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
      const res = await fetch("/api/centre/promo");
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
      const res = await fetch("/api/centre/promo", {
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
          <p className="text-gray-500 text-sm mt-1">Créez des codes promotionnels pour votre centre</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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
                placeholder="MONCODE10"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description optionnelle"
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
          <p className="text-gray-500">Aucun code promo pour votre centre</p>
          <p className="text-gray-600 text-xs mt-1">Créez votre premier code promo pour attirer des clients</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className="rounded-xl border border-white/10 p-5 flex items-center justify-between gap-4"
              style={{ background: "#0D1D3A" }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-600/15 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={promo.type === "POURCENTAGE" ? faPercent : faEuroSign}
                    className="text-blue-400 text-sm"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{promo.code}</span>
                    {isExpired(promo.dateFin) ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/20">
                        Expiré
                      </span>
                    ) : promo.isActive ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                        Actif
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        Inactif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    -{promo.valeur}{promo.type === "POURCENTAGE" ? "%" : " €"}
                    {promo.minAchat ? ` · min. ${promo.minAchat} €` : ""}
                    {" · "}
                    {promo.utilisations}{promo.maxUtilisations ? ` / ${promo.maxUtilisations}` : ""} utilisations
                    {" · "}
                    {new Date(promo.dateDebut).toLocaleDateString("fr-FR")} → {new Date(promo.dateFin).toLocaleDateString("fr-FR")}
                  </p>
                  {promo.description && (
                    <p className="text-xs text-gray-600 mt-0.5">{promo.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleToggle(promo)}
                className="shrink-0"
                title={promo.isActive ? "Désactiver" : "Activer"}
              >
                <FontAwesomeIcon
                  icon={promo.isActive ? faToggleOn : faToggleOff}
                  className={`text-xl ${promo.isActive ? "text-green-400" : "text-gray-600"} hover:opacity-80 transition-opacity`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
