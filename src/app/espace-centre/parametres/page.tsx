"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoadingOverlay, { PageHeaderSkeleton } from "@/components/ui/LoadingOverlay";
import {
  faBuilding,
  faLocationDot,
  faPhone,
  faEnvelope,
  faCreditCard,
  faCircleCheck,
  faCircleExclamation,
  faSpinner,
  faCrown,
  faArrowUpRightFromSquare,
  faCalendarDays,
  faXmark,
  faFileInvoice,
  faGavel,
  faUserTie,
  faTriangleExclamation,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { ImageUploadField } from "@/components/centre/ImageUploadField";

// ─── TYPES ────────────────────────────────────────────────

interface CentreInfo {
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  stripeOnboardingDone: boolean;
  // Champs juridiques / facturation
  raisonSociale?: string | null;
  siret?: string | null;
  tva?: string | null;
  ape?: string | null;
  iban?: string | null;
  bic?: string | null;
  // Mentions / CGV
  mentionsLegales?: string | null;
  cgv?: string | null;
  // Responsable / signature
  nomResponsable?: string | null;
  signatureUrl?: string | null;
  // Override commission
  commissionRateOverride?: number | null;
}

interface SubscriptionInfo {
  plan: {
    id: string;
    nom: string;
    prix: number;
    features: string[];
    commissionRate: number;
  } | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

type TabId =
  | "identite"
  | "juridique"
  | "mentions"
  | "responsable"
  | "stripe";

const TABS: { id: TabId; label: string; icon: typeof faBuilding }[] = [
  { id: "identite", label: "Identite & contact", icon: faBuilding },
  { id: "juridique", label: "Identite juridique & facturation", icon: faFileInvoice },
  { id: "mentions", label: "Mentions legales & CGV", icon: faGavel },
  { id: "responsable", label: "Responsable & signature", icon: faUserTie },
  { id: "stripe", label: "Stripe Connect", icon: faCreditCard },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Actif", color: "text-blue-400" },
  PAST_DUE: { label: "Paiement en retard", color: "text-red-400" },
  ANNULEE: { label: "Annule", color: "text-red-400" },
  TRIALING: { label: "Periode d'essai", color: "text-blue-400" },
};

// ─── VALIDATIONS ──────────────────────────────────────────

const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/;
const BIC_REGEX = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const SIRET_REGEX = /^\d{14}$/;
const TVA_REGEX = /^[A-Z]{2}[A-Z0-9]{2,12}$/;
const APE_REGEX = /^\d{4}[A-Z]$/;

function validateField(field: keyof CentreInfo, value: string): string | null {
  if (!value) return null;
  const v = value.replace(/\s+/g, "").toUpperCase();
  switch (field) {
    case "iban":
      return IBAN_REGEX.test(v) ? null : "IBAN invalide";
    case "bic":
      return BIC_REGEX.test(v) ? null : "BIC invalide";
    case "siret":
      return SIRET_REGEX.test(v) ? null : "SIRET doit contenir 14 chiffres";
    case "tva":
      return TVA_REGEX.test(v) ? null : "Numero de TVA invalide";
    case "ape":
      return APE_REGEX.test(v) ? null : "Code APE invalide (ex: 8559A)";
    default:
      return null;
  }
}

// ─── STYLES ───────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all";
const inputStyle = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.08)",
};
const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
};

// ─── PAGE ─────────────────────────────────────────────────

export default function ParametresCentrePage() {
  const [form, setForm] = useState<CentreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("identite");

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch("/api/centre/me")
      .then((r) => r.json())
      .then((data: CentreInfo) => {
        if (data && data.nom) setForm(data);
      })
      .catch(() => null)
      .finally(() => setLoading(false));

    fetch("/api/stripe/subscription")
      .then((r) => r.json())
      .then((data: SubscriptionInfo) => {
        if (data && !("error" in data)) setSubscription(data);
      })
      .catch(() => null)
      .finally(() => setLoadingSub(false));
  }, []);

  function update<K extends keyof CentreInfo>(key: K, value: CentreInfo[K]) {
    if (!form) return;
    setForm({ ...form, [key]: value });
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/centre/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          adresse: form.adresse,
          codePostal: form.codePostal,
          ville: form.ville,
          telephone: form.telephone,
          email: form.email,
          raisonSociale: form.raisonSociale ?? null,
          siret: form.siret ?? null,
          tva: form.tva ?? null,
          ape: form.ape ?? null,
          iban: form.iban ?? null,
          bic: form.bic ?? null,
          mentionsLegales: form.mentionsLegales ?? null,
          cgv: form.cgv ?? null,
          nomResponsable: form.nomResponsable ?? null,
          signatureUrl: form.signatureUrl ?? null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur serveur");
      }
      const updated: CentreInfo = await res.json();
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    }
    setSaving(false);
  }

  async function handleStripeConnect() {
    setConnectingStripe(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // silently fail
    }
    setConnectingStripe(false);
  }

  async function handleOpenPortal() {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // silently fail
    }
    setOpeningPortal(false);
  }

  async function handleCancelSubscription() {
    if (
      !confirm(
        "Etes-vous sur de vouloir annuler votre abonnement ? Il restera actif jusqu'a la fin de la periode en cours."
      )
    )
      return;
    setCancelling(true);
    try {
      const res = await fetch("/api/stripe/subscription", { method: "PUT" });
      if (res.ok) {
        const data = await res.json();
        setSubscription((prev) =>
          prev
            ? {
                ...prev,
                cancelAtPeriodEnd: data.cancelAtPeriodEnd,
                currentPeriodEnd: data.currentPeriodEnd,
              }
            : prev
        );
      }
    } catch {
      // silently fail
    }
    setCancelling(false);
  }

  if (!loading && !form) {
    return (
      <div className="text-center py-24 text-gray-500">
        <p>Impossible de charger les paramètres du centre.</p>
      </div>
    );
  }

  // Validation errors live
  const ibanError = form ? validateField("iban", form.iban || "") : undefined;
  const bicError = form ? validateField("bic", form.bic || "") : undefined;
  const siretError = form ? validateField("siret", form.siret || "") : undefined;
  const tvaError = form ? validateField("tva", form.tva || "") : undefined;
  const apeError = form ? validateField("ape", form.ape || "") : undefined;

  return (
    <div className="relative min-h-[50vh]">
      <div className={loading ? "opacity-40 pointer-events-none select-none" : ""}>
    <div className="max-w-3xl space-y-6">
      {loading ? (
        <>
          <PageHeaderSkeleton />
          <div className="h-96 rounded-xl bg-white/5 border border-white/5 animate-pulse" />
        </>
      ) : form ? (
        <>
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Parametres
        </h1>
        <p className="text-gray-500 text-sm">
          Gerez les informations de votre centre, votre abonnement et votre
          compte Stripe
        </p>
      </div>

      {/* Error global */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Tabs bar */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-blue-400 border-blue-500"
                  : "text-gray-400 hover:text-white border-transparent"
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB: IDENTITE & CONTACT ───────────────────────── */}
      {activeTab === "identite" && (
        <div className="rounded-xl p-6 space-y-4" style={cardStyle}>
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-400 w-4 h-4" />
            Identite & contact
          </h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Nom du centre
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => update("nom", e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Adresse
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
              />
              <input
                type="text"
                value={form.adresse}
                onChange={(e) => update("adresse", e.target.value)}
                className={`${inputClass} pl-9`}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Code postal
              </label>
              <input
                type="text"
                value={form.codePostal}
                onChange={(e) => update("codePostal", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={form.ville}
                onChange={(e) => update("ville", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Telephone
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
                />
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => update("telephone", e.target.value)}
                  className={`${inputClass} pl-9`}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Email
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={`${inputClass} pl-9`}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: JURIDIQUE & FACTURATION ──────────────────── */}
      {activeTab === "juridique" && (
        <div className="rounded-xl p-6 space-y-4" style={cardStyle}>
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faFileInvoice} className="text-blue-400 w-4 h-4" />
            Identite juridique & facturation
          </h2>
          <p className="text-xs text-gray-500">
            Ces informations apparaitront sur vos contrats et factures.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Raison sociale
            </label>
            <input
              type="text"
              value={form.raisonSociale || ""}
              onChange={(e) => update("raisonSociale", e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="Ex: BYS Formations SARL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                SIRET
              </label>
              <input
                type="text"
                value={form.siret || ""}
                onChange={(e) => update("siret", e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="14 chiffres"
              />
              {siretError && (
                <p className="text-[11px] text-red-400 mt-1">{siretError}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Code APE / NAF
              </label>
              <input
                type="text"
                value={form.ape || ""}
                onChange={(e) => update("ape", e.target.value.toUpperCase())}
                className={inputClass}
                style={inputStyle}
                placeholder="Ex: 8559A"
              />
              {apeError && (
                <p className="text-[11px] text-red-400 mt-1">{apeError}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Numero de TVA intracommunautaire
            </label>
            <input
              type="text"
              value={form.tva || ""}
              onChange={(e) => update("tva", e.target.value.toUpperCase())}
              className={inputClass}
              style={inputStyle}
              placeholder="Ex: FR12345678901"
            />
            {tvaError && (
              <p className="text-[11px] text-red-400 mt-1">{tvaError}</p>
            )}
          </div>

          <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-3">
              Coordonnees bancaires
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  value={form.iban || ""}
                  onChange={(e) => update("iban", e.target.value.toUpperCase())}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                />
                {ibanError && (
                  <p className="text-[11px] text-red-400 mt-1">{ibanError}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  BIC / SWIFT
                </label>
                <input
                  type="text"
                  value={form.bic || ""}
                  onChange={(e) => update("bic", e.target.value.toUpperCase())}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Ex: BNPAFRPPXXX"
                />
                {bicError && (
                  <p className="text-[11px] text-red-400 mt-1">{bicError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: MENTIONS & CGV ───────────────────────────── */}
      {activeTab === "mentions" && (
        <div className="space-y-6">
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
              <FontAwesomeIcon icon={faGavel} className="text-blue-400 w-4 h-4" />
              Mentions legales
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Apparaitront en pied de contrat. Renseignez votre forme juridique,
              capital, RCS, etc.
            </p>
            <textarea
              value={form.mentionsLegales || ""}
              onChange={(e) => update("mentionsLegales", e.target.value)}
              rows={12}
              className={inputClass}
              style={inputStyle}
              placeholder="SARL au capital de XX EUR, RCS Paris XXX XXX XXX, ..."
            />
          </div>

          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
              <FontAwesomeIcon icon={faGavel} className="text-blue-400 w-4 h-4" />
              Conditions generales de vente
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Les CGV seront annexees au contrat et a la facture envoyes au
              stagiaire.
            </p>
            <textarea
              value={form.cgv || ""}
              onChange={(e) => update("cgv", e.target.value)}
              rows={14}
              className={inputClass}
              style={inputStyle}
              placeholder="Article 1 - Objet&#10;Article 2 - Tarifs..."
            />
          </div>
        </div>
      )}

      {/* ─── TAB: RESPONSABLE & SIGNATURE ──────────────────── */}
      {activeTab === "responsable" && (
        <div className="rounded-xl p-6 space-y-6" style={cardStyle}>
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faUserTie} className="text-blue-400 w-4 h-4" />
            Responsable & cachet numérique
          </h2>
          <p className="text-xs text-gray-500">
            Le nom et le cachet qui apparaitront en bas des contrats et documents
            emis par votre centre.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Nom du responsable
            </label>
            <input
              type="text"
              value={form.nomResponsable || ""}
              onChange={(e) => update("nomResponsable", e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="Ex: Jean Dupont"
            />
          </div>

          <ImageUploadField
            kind="signature"
            currentUrl={form.signatureUrl}
            onUploaded={(url) => update("signatureUrl", url)}
            label="Cachet numérique"
            hint="PNG transparent recommandé, max 800x300px — affiché sur convocations et documents PDF"
            accept="image/png,image/jpeg,image/webp"
            previewClassName="h-40"
          />
        </div>
      )}

      {/* ─── TAB: STRIPE CONNECT ───────────────────────────── */}
      {activeTab === "stripe" && (
        <div className="space-y-6">
          {/* Abonnement */}
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
              <FontAwesomeIcon icon={faCrown} className="text-blue-400 w-4 h-4" />
              Abonnement
            </h2>

            {loadingSub ? (
              <div className="flex items-center gap-3 py-4 text-gray-500">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                <span className="text-sm">Chargement...</span>
              </div>
            ) : subscription?.plan ? (
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.15)",
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Plan {subscription.plan.nom}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {subscription.plan.prix}&euro;/mois &middot; Commission{" "}
                      {subscription.plan.commissionRate}%
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-semibold ${
                        STATUS_LABELS[subscription.status || ""]?.color ||
                        "text-gray-400"
                      }`}
                    >
                      {STATUS_LABELS[subscription.status || ""]?.label ||
                        subscription.status ||
                        "Inconnu"}
                    </span>
                  </div>
                </div>

                {subscription.currentPeriodEnd && (
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <FontAwesomeIcon icon={faCalendarDays} className="w-3.5 h-3.5" />
                    <span>
                      {subscription.cancelAtPeriodEnd
                        ? "Fin de l'abonnement le "
                        : "Prochain renouvellement le "}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                        "fr-FR",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </span>
                  </div>
                )}

                {subscription.cancelAtPeriodEnd && (
                  <div
                    className="flex items-start gap-3 p-4 rounded-lg"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCircleExclamation}
                      className="text-red-400 w-4 h-4 mt-0.5"
                    />
                    <p className="text-xs text-red-300">
                      Votre abonnement est programme pour etre annule. Il restera
                      actif jusqu&apos;a la fin de la periode en cours.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleOpenPortal}
                    disabled={openingPortal}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    {openingPortal ? (
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin w-3.5 h-3.5"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faArrowUpRightFromSquare}
                        className="w-3 h-3"
                      />
                    )}
                    Gerer mon abonnement
                  </button>

                  <Link
                    href="/tarifs-partenaires"
                    className="bg-transparent border text-gray-300 hover:text-white hover:border-gray-500 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.15)" }}
                  >
                    Changer de plan
                  </Link>

                  {!subscription.cancelAtPeriodEnd && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                      className="text-red-400 hover:text-red-300 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                    >
                      {cancelling ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin w-3 h-3"
                        />
                      ) : (
                        <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                      )}
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className="flex items-start gap-3 p-4 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className="text-gray-500 w-5 h-5 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-300">
                      Aucun abonnement actif
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Souscrivez un abonnement pour referencer votre centre sur
                      la marketplace et beneficier de commissions reduites.
                    </p>
                  </div>
                </div>
                <Link
                  href="/tarifs-partenaires"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5" />
                  Voir les plans
                </Link>
              </div>
            )}
          </div>

          {/* Stripe Connect */}
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
              <FontAwesomeIcon icon={faCreditCard} className="text-blue-400 w-4 h-4" />
              Paiements Stripe Connect
            </h2>

            {form.stripeOnboardingDone ? (
              <div
                className="flex items-center gap-3 p-4 rounded-lg"
                style={{
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="text-blue-400 w-5 h-5"
                />
                <div>
                  <p className="text-sm font-semibold text-blue-400">
                    Compte Stripe connecte
                  </p>
                  <p className="text-xs text-gray-400">
                    Vous recevez automatiquement les paiements de chaque
                    reservation (hors commission).
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className="flex items-start gap-3 p-4 rounded-lg mb-4"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className="text-red-400 w-5 h-5 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-red-400">
                      Compte Stripe non connecte
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sans compte Stripe Connect, vous ne pouvez pas recevoir
                      les paiements. Connectez votre compte pour recevoir les
                      paiements de chaque reservation.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStripeConnect}
                  disabled={connectingStripe}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                >
                  {connectingStripe && (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin w-3.5 h-3.5"
                    />
                  )}
                  {connectingStripe ? "Redirection..." : "Connecter Stripe"}
                </button>
              </div>
            )}

            <div
              className="mt-4 pt-4 border-t text-xs text-gray-600"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
            >
              Commission appliquee :{" "}
              <span className="text-gray-300 font-medium">
                {form.commissionRateOverride !== null &&
                form.commissionRateOverride !== undefined
                  ? `${form.commissionRateOverride}% (override centre)`
                  : subscription?.plan
                  ? `${subscription.plan.commissionRate}% (plan)`
                  : "COMMISSION_RATE global"}
              </span>{" "}
              &middot; Versements sous 2 jours ouvres
            </div>
          </div>
        </div>
      )}

      {/* ─── SAVE BUTTON (sauf onglet Stripe) ──────────────── */}
      {activeTab !== "stripe" && (
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSave}
            disabled={
              saving ||
              !!ibanError ||
              !!bicError ||
              !!siretError ||
              !!tvaError ||
              !!apeError
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="animate-spin w-3.5 h-3.5"
                />
                Sauvegarde...
              </>
            ) : saved ? (
              <>
                <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                Sauvegarde !
              </>
            ) : (
              "Sauvegarder"
            )}
          </button>
        </div>
      )}
        </>
      ) : null}
    </div>
      </div>
      <LoadingOverlay show={loading} label="Chargement des paramètres..." />
    </div>
  );
}
