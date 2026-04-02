"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
} from "@fortawesome/free-solid-svg-icons";

interface CentreInfo {
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  stripeOnboardingDone: boolean;
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

const MOCK: CentreInfo = {
  nom: "BYS Formation",
  adresse: "Bât. 7, 9 Chaussée Jules César",
  codePostal: "95520",
  ville: "Osny",
  telephone: "01 30 30 30 30",
  email: "bysforma95@gmail.com",
  stripeOnboardingDone: false,
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Actif", color: "text-green-400" },
  PAST_DUE: { label: "Paiement en retard", color: "text-orange-400" },
  ANNULEE: { label: "Annulé", color: "text-red-400" },
  TRIALING: { label: "Période d'essai", color: "text-blue-400" },
};

export default function ParametresCentrePage() {
  const [form, setForm] = useState<CentreInfo>(MOCK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    // Fetch centre info
    fetch("/api/centre/me")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.nom) setForm(data);
      })
      .catch(() => null)
      .finally(() => setLoading(false));

    // Fetch subscription info
    fetch("/api/stripe/subscription")
      .then((r) => r.json())
      .then((data: SubscriptionInfo) => {
        if (data && !("error" in data)) setSubscription(data);
      })
      .catch(() => null)
      .finally(() => setLoadingSub(false));
  }, []);

  async function handleSave() {
    setSaving(true);
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
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setForm(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silently fail
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
    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement ? Il restera actif jusqu'à la fin de la période en cours.")) return;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Paramètres
        </h1>
        <p className="text-gray-500 text-sm">
          Gérez les informations de votre centre, votre abonnement et votre
          compte Stripe
        </p>
      </div>

      {/* Infos centre */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
          <FontAwesomeIcon
            icon={faBuilding}
            className="text-blue-400 w-4 h-4"
          />
          Informations du centre
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Nom du centre
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
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
                onChange={(e) =>
                  setForm({ ...form, adresse: e.target.value })
                }
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
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
                onChange={(e) =>
                  setForm({ ...form, codePostal: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
                />
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) =>
                    setForm({ ...form, telephone: e.target.value })
                  }
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
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
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          >
            {saving ? "Sauvegarde..." : saved ? "Sauvegardé !" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Abonnement */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
          <FontAwesomeIcon
            icon={faCrown}
            className="text-blue-400 w-4 h-4"
          />
          Abonnement
        </h2>

        {loadingSub ? (
          <div className="flex items-center gap-3 py-4 text-gray-500">
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin text-sm"
            />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : subscription?.plan ? (
          <div className="space-y-4">
            {/* Plan info */}
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

            {/* Billing date */}
            {subscription.currentPeriodEnd && (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <FontAwesomeIcon
                  icon={faCalendarDays}
                  className="w-3.5 h-3.5"
                />
                <span>
                  {subscription.cancelAtPeriodEnd
                    ? "Fin de l'abonnement le "
                    : "Prochain renouvellement le "}
                  {new Date(
                    subscription.currentPeriodEnd
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {subscription.cancelAtPeriodEnd && (
              <div
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{
                  background: "rgba(251,146,60,0.1)",
                  border: "1px solid rgba(251,146,60,0.2)",
                }}
              >
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                  className="text-orange-400 w-4 h-4 mt-0.5"
                />
                <p className="text-xs text-orange-300">
                  Votre abonnement est programmé pour être annulé. Il restera
                  actif jusqu&apos;à la fin de la période en cours.
                </p>
              </div>
            )}

            {/* Actions */}
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
                Gérer mon abonnement
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
                  Souscrivez un abonnement pour référencer votre centre sur la
                  marketplace et bénéficier de commissions réduites.
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
      <div
        className="rounded-xl p-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
          <FontAwesomeIcon
            icon={faCreditCard}
            className="text-blue-400 w-4 h-4"
          />
          Paiements Stripe Connect
        </h2>

        {form.stripeOnboardingDone ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-400/10 border border-green-400/20">
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="text-green-400 w-5 h-5"
            />
            <div>
              <p className="text-sm font-semibold text-green-400">
                Compte Stripe connecté
              </p>
              <p className="text-xs text-gray-500">
                Vous recevez automatiquement les paiements de chaque
                réservation (hors commission).
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div
              className="flex items-start gap-3 p-4 rounded-lg mb-4"
              style={{
                background: "rgba(251,146,60,0.1)",
                border: "1px solid rgba(251,146,60,0.2)",
              }}
            >
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="text-orange-400 w-5 h-5 mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-orange-400">
                  Compte Stripe non connecté
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Sans compte Stripe Connect, vous ne pouvez pas recevoir les
                  paiements. Connectez votre compte pour recevoir les paiements
                  de chaque réservation.
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
              {connectingStripe ? "Redirection..." : "Connecter Stripe ->"}
            </button>
          </div>
        )}

        <div
          className="mt-4 pt-4 border-t text-xs text-gray-600"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          Commission BYS Formation :{" "}
          <span className="text-gray-400 font-medium">
            {subscription?.plan
              ? `${subscription.plan.commissionRate}%`
              : "10%"}
          </span>{" "}
          par réservation · Versements sous 2 jours ouvrés
        </div>
      </div>
    </div>
  );
}
