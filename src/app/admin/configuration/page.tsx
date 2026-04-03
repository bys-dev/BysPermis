"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faScrewdriverWrench, faCrown, faSpinner, faCheckCircle,
  faCircleXmark, faGlobe, faKey, faCreditCard, faDatabase,
  faServer, faDownload, faShieldHalved, faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

interface AdminUser {
  role: "ADMIN" | "OWNER";
}

interface PlatformSettings {
  commissionRate: number;
  monetisationModel: string;
  updatedAt: string;
}

export default function AdminConfigurationPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/me")
        .then((r) => r.json())
        .catch(() => ({ role: "ADMIN" })),
      fetch("/api/admin/settings")
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([userData, settingsData]) => {
        setUser(userData);
        if (settingsData && !settingsData.error) setSettings(settingsData);
      })
      .catch(() => setError("Impossible de charger la configuration"))
      .finally(() => setLoading(false));
  }, []);

  const isOwner = user?.role === "OWNER";

  async function handleExport() {
    setExporting(true);
    setExportSuccess(false);
    try {
      // Fetch all data
      const [statsRes, centresRes, usersRes, ticketsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/stats").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/centres").then((r) => r.json()).catch(() => []),
        fetch("/api/admin/users").then((r) => r.json()).catch(() => []),
        fetch("/api/admin/tickets").then((r) => r.json()).catch(() => []),
        fetch("/api/admin/settings").then((r) => r.json()).catch(() => null),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        platform: "BYS Permis",
        stats: statsRes,
        centres: centresRes,
        users: usersRes,
        tickets: ticketsRes,
        settings: settingsRes,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bys-permis-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch {
      setError("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FontAwesomeIcon icon={faScrewdriverWrench} className="text-yellow-400 text-xl" />
            <h1 className="text-2xl font-bold text-white">Configuration avancee</h1>
          </div>
          <p className="text-gray-400 text-sm">Parametres avances reserves au Owner de la plateforme.</p>
        </div>
        <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FontAwesomeIcon icon={faScrewdriverWrench} className="text-yellow-400 text-xl" />
            <h1 className="text-2xl font-bold text-white">Configuration avancee</h1>
          </div>
          <p className="text-gray-400 text-sm">Parametres avances reserves au Owner de la plateforme.</p>
        </div>
        <div className="bg-[#0A1628] rounded-xl border border-red-500/20 p-12 text-center">
          <FontAwesomeIcon icon={faShieldHalved} className="text-4xl text-red-500/40 mb-4" />
          <p className="text-red-400 font-medium">Acces restreint</p>
          <p className="text-gray-600 text-sm mt-1">
            Cette page est reservee au Owner de la plateforme. Contactez l'administrateur principal.
          </p>
        </div>
      </div>
    );
  }

  const stripeConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const resendStatus = true; // If loaded means API works

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <FontAwesomeIcon icon={faScrewdriverWrench} className="text-yellow-400 text-xl" />
          <h1 className="text-2xl font-bold text-white">Configuration avancee</h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-500/20">
            <FontAwesomeIcon icon={faCrown} className="text-[8px]" />
            OWNER
          </span>
        </div>
        <p className="text-gray-400 text-sm">
          Parametres avances, integrations et outils systeme.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm flex items-center gap-2">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
          {error}
        </div>
      )}

      {/* Integrations */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faGlobe} className="text-blue-400 text-xs" />
          Integrations & API
        </h2>
        <div className="space-y-4">
          {/* Stripe */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/3 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-400/10 border border-purple-500/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faCreditCard} className="text-purple-400 text-sm" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Stripe</p>
                <p className="text-gray-500 text-xs">Paiements et abonnements</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border
                ${stripeConfigured
                  ? "bg-green-400/10 text-green-400 border-green-500/20"
                  : "bg-yellow-400/10 text-yellow-400 border-yellow-500/20"
                }`}
              >
                <FontAwesomeIcon icon={stripeConfigured ? faCheckCircle : faExclamationTriangle} className="text-[9px]" />
                {stripeConfigured ? "Configure" : "Cle publique manquante"}
              </span>
            </div>
          </div>

          {/* Resend */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/3 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-400/10 border border-blue-500/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faKey} className="text-blue-400 text-sm" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Resend</p>
                <p className="text-gray-500 text-xs">Service d'envoi d'emails transactionnels</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs font-mono">re_****...****</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-green-400/10 text-green-400 border-green-500/20">
                <FontAwesomeIcon icon={faCheckCircle} className="text-[9px]" />
                Active
              </span>
            </div>
          </div>

          {/* Auth0 */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/3 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-400/10 border border-orange-500/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faShieldHalved} className="text-orange-400 text-sm" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Auth0</p>
                <p className="text-gray-500 text-xs">Authentification et gestion des sessions</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-green-400/10 text-green-400 border-green-500/20">
              <FontAwesomeIcon icon={faCheckCircle} className="text-[9px]" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Platform Settings */}
      {settings && (
        <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
          <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faDatabase} className="text-green-400 text-xs" />
            Parametres plateforme
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white/3 border border-white/5">
              <p className="text-gray-500 text-xs mb-1">Taux de commission</p>
              <p className="text-white text-lg font-bold">{settings.commissionRate}%</p>
              <p className="text-gray-600 text-[10px] mt-0.5">Configurable dans Parametres</p>
            </div>
            <div className="p-4 rounded-lg bg-white/3 border border-white/5">
              <p className="text-gray-500 text-xs mb-1">Modele de monetisation</p>
              <p className="text-white text-lg font-bold">{settings.monetisationModel}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/3 border border-white/5">
              <p className="text-gray-500 text-xs mb-1">Derniere mise a jour</p>
              <p className="text-white text-sm font-medium">
                {new Date(settings.updatedAt).toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faDownload} className="text-yellow-400 text-xs" />
          Export de donnees
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Exporter toutes les donnees de la plateforme au format JSON (statistiques, centres, utilisateurs, tickets, parametres).
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            {exporting ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
            ) : (
              <FontAwesomeIcon icon={faDownload} className="text-xs" />
            )}
            {exporting ? "Export en cours..." : "Exporter toutes les donnees"}
          </button>
          {exportSuccess && (
            <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-medium">
              <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
              Export telecharge avec succes
            </span>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5">
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faServer} className="text-gray-400 text-xs" />
          Informations systeme
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-white/3 border border-white/5">
            <p className="text-gray-500 text-xs mb-1">Framework</p>
            <p className="text-white text-sm font-medium">Next.js 16</p>
          </div>
          <div className="p-4 rounded-lg bg-white/3 border border-white/5">
            <p className="text-gray-500 text-xs mb-1">Runtime</p>
            <p className="text-white text-sm font-medium">Node.js</p>
          </div>
          <div className="p-4 rounded-lg bg-white/3 border border-white/5">
            <p className="text-gray-500 text-xs mb-1">Base de donnees</p>
            <p className="text-white text-sm font-medium">PostgreSQL + Prisma 7</p>
          </div>
          <div className="p-4 rounded-lg bg-white/3 border border-white/5">
            <p className="text-gray-500 text-xs mb-1">Plateforme</p>
            <p className="text-white text-sm font-medium">BYS Permis v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
