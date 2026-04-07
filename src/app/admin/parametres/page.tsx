"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faPercent,
  faEnvelope,
  faShieldHalved,
  faSpinner,
  faCheck,
  faTriangleExclamation,
  faCrown,
  faBuilding,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";

type MonetisationModel = "COMMISSION" | "ABONNEMENT" | "HYBRIDE";

interface Settings {
  commissionRate: number;
  monetisationModel: MonetisationModel;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

interface AdminUser {
  role: "ADMIN" | "OWNER";
}

const monetisationLabels: Record<MonetisationModel, string> = {
  COMMISSION: "Commission par reservation",
  ABONNEMENT: "Abonnement mensuel des centres",
  HYBRIDE: "Hybride (abonnement + commission reduite)",
};

export default function AdminParametresPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [commissionRate, setCommissionRate] = useState(10);
  const [monetisationModel, setMonetisationModel] = useState<MonetisationModel>("COMMISSION");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [platformName] = useState("BYS Permis");
  const [contactEmail] = useState("bysforma95@gmail.com");

  const isOwner = user?.role === "OWNER";

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()).catch(() => null),
      fetch("/api/admin/me").then((r) => r.json()).catch(() => null),
    ]).then(([settingsData, userData]) => {
      if (settingsData && !settingsData.error) {
        setSettings(settingsData);
        setCommissionRate(settingsData.commissionRate);
        setMonetisationModel(settingsData.monetisationModel);
        setMaintenanceMode(settingsData.maintenanceMode ?? false);
        setMaintenanceMessage(settingsData.maintenanceMessage ?? "");
      }
      if (userData && userData.role) {
        setUser(userData);
      } else {
        setUser({ role: "ADMIN" });
      }
      setLoading(false);
    });
  }, []);

  async function saveSettings() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionRate, monetisationModel }),
    }).catch(() => null);

    if (res?.ok) {
      const data = await res.json();
      setSettings(data);
      setMessage({ type: "success", text: "Parametres enregistres avec succes." });
    } else {
      const errData = await res?.json().catch(() => null);
      if (errData?.error === "Non autorise") {
        setMessage({ type: "error", text: "Seul le Owner peut modifier ces parametres." });
      } else {
        setMessage({ type: "error", text: "Erreur lors de la sauvegarde." });
      }
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 5000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
        <span className="text-sm">Chargement des parametres...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Parametres</h1>
          <p className="text-gray-400 text-sm mt-0.5">Configuration globale de la plateforme</p>
        </div>
        {isOwner && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-500/20">
            <FontAwesomeIcon icon={faCrown} className="text-[9px]" />
            Mode Owner
          </span>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === "success" ? "bg-green-400/10 border border-green-500/20 text-green-400" : "bg-red-400/10 border border-red-500/20 text-red-400"}`}>
          <FontAwesomeIcon icon={message.type === "success" ? faCheck : faTriangleExclamation} className="text-xs" />
          {message.text}
        </div>
      )}

      {/* Platform info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="w-10 h-10 rounded-lg bg-blue-400/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-400 text-sm" />
          </div>
          <label className="text-gray-400 text-xs font-medium mb-1.5 block">Nom de la plateforme</label>
          <input
            type="text"
            value={platformName}
            readOnly
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none opacity-60 cursor-not-allowed"
          />
          <p className="text-gray-600 text-[11px] mt-2">Nom affiche sur la plateforme</p>
        </div>
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <div className="w-10 h-10 rounded-lg bg-blue-400/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faEnvelope} className="text-blue-400 text-sm" />
          </div>
          <label className="text-gray-400 text-xs font-medium mb-1.5 block">Email de contact</label>
          <input
            type="email"
            value={contactEmail}
            readOnly
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none opacity-60 cursor-not-allowed"
          />
          <p className="text-gray-600 text-[11px] mt-2">Email utilise pour les notifications plateforme</p>
        </div>
      </div>

      {/* Commission & monetisation */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`bg-[#0A1628] rounded-xl border p-5 ${isOwner ? "border-green-500/20" : "border-white/8"}`}>
          <div className="w-10 h-10 rounded-lg bg-green-400/10 border border-green-500/20 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faPercent} className="text-green-400 text-sm" />
          </div>
          <label className="text-gray-400 text-xs font-medium mb-1.5 block">Taux de commission (%)</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              disabled={!isOwner}
              className={`w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50 ${!isOwner ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
          <p className="text-gray-600 text-[11px] mt-2">Commission percue sur chaque reservation</p>
          {!isOwner && (
            <p className="text-yellow-400/60 text-[10px] mt-1 flex items-center gap-1">
              <FontAwesomeIcon icon={faCrown} className="text-[8px]" />
              Modification reservee au Owner
            </p>
          )}
        </div>

        <div className={`bg-[#0A1628] rounded-xl border p-5 ${isOwner ? "border-green-500/20" : "border-white/8"}`}>
          <div className="w-10 h-10 rounded-lg bg-green-400/10 border border-green-500/20 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faCoins} className="text-green-400 text-sm" />
          </div>
          <label className="text-gray-400 text-xs font-medium mb-1.5 block">Modele de monetisation</label>
          <select
            value={monetisationModel}
            onChange={(e) => setMonetisationModel(e.target.value as MonetisationModel)}
            disabled={!isOwner}
            className={`w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50 appearance-none ${!isOwner ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {(Object.entries(monetisationLabels) as [MonetisationModel, string][]).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#0A1628]">
                {label}
              </option>
            ))}
          </select>
          <p className="text-gray-600 text-[11px] mt-2">Comment la plateforme genere ses revenus</p>
          {!isOwner && (
            <p className="text-yellow-400/60 text-[10px] mt-1 flex items-center gap-1">
              <FontAwesomeIcon icon={faCrown} className="text-[8px]" />
              Modification reservee au Owner
            </p>
          )}
        </div>
      </div>

      {/* Save button (OWNER only) */}
      {isOwner && (
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
          >
            {saving ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
            ) : (
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
            )}
            Enregistrer les parametres
          </button>
        </div>
      )}

      {/* Danger zone - OWNER only */}
      {isOwner && (
        <div className="bg-[#0A1628] rounded-xl border border-red-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400" />
            <h2 className="text-red-400 font-semibold text-sm">Zone dangereuse</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-400/5 border border-red-500/10">
              <div>
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-red-400 text-xs" />
                  Mode maintenance
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Desactiver temporairement l&apos;acces public a la plateforme
                </p>
              </div>
              <button
                aria-label="Activer ou desactiver le mode maintenance"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  maintenanceMode ? "bg-red-600" : "bg-white/10 border border-white/10 hover:bg-white/15"
                }`}
                onClick={async () => {
                  const newValue = !maintenanceMode;
                  setMaintenanceMode(newValue);
                  const res = await fetch("/api/admin/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ maintenanceMode: newValue, maintenanceMessage: maintenanceMessage || null }),
                  }).catch(() => null);
                  if (res?.ok) {
                    setMessage({ type: "success", text: newValue ? "Mode maintenance active." : "Mode maintenance desactive." });
                  } else {
                    setMaintenanceMode(!newValue); // revert
                    setMessage({ type: "error", text: "Erreur lors du changement." });
                  }
                  setTimeout(() => setMessage(null), 3000);
                }}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            {maintenanceMode && (
              <div className="p-4 rounded-lg bg-red-400/5 border border-red-500/10">
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Message de maintenance (optionnel)</label>
                <textarea
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 resize-none"
                  placeholder="Nous effectuons une maintenance. Revenez bientot..."
                />
                <button
                  onClick={async () => {
                    const res = await fetch("/api/admin/settings", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ maintenanceMode: true, maintenanceMessage: maintenanceMessage || null }),
                    }).catch(() => null);
                    if (res?.ok) {
                      setMessage({ type: "success", text: "Message de maintenance mis a jour." });
                    } else {
                      setMessage({ type: "error", text: "Erreur lors de la sauvegarde." });
                    }
                    setTimeout(() => setMessage(null), 3000);
                  }}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-red-600/20 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-600/30 transition-colors"
                >
                  Mettre a jour le message
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
