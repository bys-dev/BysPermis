"use client";

/**
 * Bannière de consentement RGPD compatible Google Consent Mode v2.
 *
 * Affiche les choix : tout accepter / tout refuser / personnaliser.
 * Persiste la décision dans localStorage (1 an) et met à jour gtag/fbq.
 *
 * À placer une fois dans le layout racine.
 */

import { useEffect, useState, useCallback } from "react";
import {
  CONSENT_ALL_GRANTED,
  CONSENT_STORAGE_KEY,
  DEFAULT_CONSENT_DENIED,
  type ConsentState,
  hasAnyTracking,
  loadConsentFromStorage,
  saveConsentToStorage,
  updateConsent,
} from "@/lib/analytics";

type View = "banner" | "settings" | "hidden";

export default function ConsentBanner() {
  const [view, setView] = useState<View>("hidden");
  const [prefs, setPrefs] = useState<ConsentState>(DEFAULT_CONSENT_DENIED);

  useEffect(() => {
    if (!hasAnyTracking()) {
      setView("hidden");
      return;
    }
    const stored = loadConsentFromStorage();
    if (stored) {
      updateConsent(stored);
      setPrefs(stored);
      setView("hidden");
    } else {
      setView("banner");
    }
  }, []);

  const acceptAll = useCallback(() => {
    saveConsentToStorage(CONSENT_ALL_GRANTED);
    updateConsent(CONSENT_ALL_GRANTED);
    setPrefs(CONSENT_ALL_GRANTED);
    setView("hidden");
  }, []);

  const rejectAll = useCallback(() => {
    saveConsentToStorage(DEFAULT_CONSENT_DENIED);
    updateConsent(DEFAULT_CONSENT_DENIED);
    setPrefs(DEFAULT_CONSENT_DENIED);
    setView("hidden");
  }, []);

  const saveCustom = useCallback(() => {
    saveConsentToStorage(prefs);
    updateConsent(prefs);
    setView("hidden");
  }, [prefs]);

  if (view === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-[9999] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 overflow-hidden">
        {view === "banner" ? (
          <div className="p-5 sm:p-6">
            <h2 id="consent-title" className="font-display text-base font-semibold text-gray-900">
              Vos préférences de confidentialité
            </h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Nous utilisons des cookies pour mesurer l&apos;audience du site, améliorer votre
              expérience et vous proposer des offres pertinentes. Vous pouvez accepter, refuser
              ou personnaliser à tout moment. Consultez notre{" "}
              <a href="/politique-de-confidentialite" className="text-blue-600 underline">
                politique de confidentialité
              </a>.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end sm:flex-wrap">
              <button
                type="button"
                onClick={() => setView("settings")}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Personnaliser
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <h2 id="consent-title" className="font-display text-base font-semibold text-gray-900">
              Préférences détaillées
            </h2>
            <div className="mt-4 space-y-3">
              <ConsentRow
                title="Cookies nécessaires"
                description="Indispensables au bon fonctionnement du site (session, panier, sécurité). Toujours activés."
                checked
                disabled
              />
              <ConsentRow
                title="Mesure d'audience"
                description="Statistiques anonymes (Google Analytics) pour comprendre comment le site est utilisé."
                checked={prefs.analytics_storage === "granted"}
                onChange={(c) =>
                  setPrefs((p) => ({
                    ...p,
                    analytics_storage: c ? "granted" : "denied",
                  }))
                }
              />
              <ConsentRow
                title="Publicité personnalisée"
                description="Cookies Google Ads et Meta (Facebook) pour mesurer l'efficacité des campagnes et vous proposer des publicités pertinentes."
                checked={prefs.ad_storage === "granted"}
                onChange={(c) =>
                  setPrefs((p) => ({
                    ...p,
                    ad_storage: c ? "granted" : "denied",
                    ad_user_data: c ? "granted" : "denied",
                    ad_personalization: c ? "granted" : "denied",
                  }))
                }
              />
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setView("banner")}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={saveCustom}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsentRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (c: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-3 ${
        disabled ? "bg-gray-50 border-gray-200" : "border-gray-200 hover:border-blue-200"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium text-gray-900">{title}</span>
        <span className="mt-1 block text-xs text-gray-500 leading-relaxed">{description}</span>
      </span>
    </label>
  );
}
