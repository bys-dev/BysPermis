"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock, faCalendarDays, faLocationDot, faShieldHalved,
  faAward, faArrowLeft, faCircleCheck, faSpinner, faEuroSign,
  faTag, faCheck, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

// ─── Stripe publishable key ───────────────────────────────
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test_placeholder"
);

// ─── Session data type ────────────────────────────────────
interface SessionData {
  id: string;
  dateDebut: string;
  dateFin: string;
  placesRestantes: number;
  placesTotal: number;
  prix: number;
  formation: { titre: string; duree: string; isQualiopi: boolean; isCPF: boolean };
  centre: string;
  ville: string;
  adresse: string;
}

const MOCK_SESSION: SessionData = {
  id: "mock",
  dateDebut: new Date().toISOString(),
  dateFin: new Date().toISOString(),
  placesRestantes: 5,
  placesTotal: 20,
  prix: 199,
  formation: { titre: "Stage de récupération de points", duree: "2 jours", isQualiopi: true, isCPF: false },
  centre: "BYS Formation",
  ville: "À venir",
  adresse: "",
};

// ─── Formulaire Stripe intégré ─���──────────────────���───────
function CheckoutForm({ sessionId, prix, promoCode }: { sessionId: string; prix: number; promoCode: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMsg(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/reserver/${sessionId}/confirmation`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message ?? "Une erreur est survenue lors du paiement.");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // Créer la réservation en base
      let reservationNum = "";
      const stored = sessionStorage.getItem(`reserver_${sessionId}`);
      if (stored) {
        try {
          const res = await fetch("/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...JSON.parse(stored),
              sessionId,
              stripePaymentIntentId: paymentIntent.id,
            }),
          });
          const data = await res.json();
          if (data.numero) reservationNum = data.numero;
        } catch {
          console.error("Erreur création réservation");
        }
      }
      const query = new URLSearchParams({ pi: paymentIntent.id });
      if (reservationNum) query.set("num", reservationNum);
      router.push(`/reserver/${sessionId}/confirmation?${query}`);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: { billingDetails: { address: { country: "FR" } } },
          }}
        />
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <span>⚠️</span>
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-all shadow-lg shadow-red-600/25"
      >
        {loading ? (
          <><FontAwesomeIcon icon={faSpinner} className="animate-spin" />Traitement…</>
        ) : (
          <><FontAwesomeIcon icon={faLock} />Payer {prix} € — Confirmer ma réservation</>
        )}
      </button>

      {promoCode && (
        <input type="hidden" name="promoCode" value={promoCode} />
      )}

      <p className="text-center text-xs text-gray-400">
        En payant, vous acceptez nos{" "}
        <Link href="/cgu" className="text-blue-600 hover:underline">CGU</Link>{" "}
        et notre{" "}
        <Link href="/politique-de-confidentialite" className="text-blue-600 hover:underline">
          politique de remboursement
        </Link>.
      </p>
    </form>
  );
}

// ─── Page principale ──────────────────────────────────────
export default function PaiementPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stagiaire, setStagiaire] = useState<{ prenom: string; nom: string; email: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData>(MOCK_SESSION);

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoReduction, setPromoReduction] = useState<number>(0);
  const [promoDescription, setPromoDescription] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const s = session;
  const displayPrice = promoCode ? Math.round((s.prix - promoReduction) * 100) / 100 : s.prix;

  async function handleApplyPromo() {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), montant: s.prix }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoCode(promoInput.trim().toUpperCase());
        setPromoReduction(data.reduction);
        setPromoDescription(data.description);
        setPromoError(null);
      } else {
        setPromoError(data.error ?? "Code invalide");
        setPromoCode(null);
        setPromoReduction(0);
        setPromoDescription(null);
      }
    } catch {
      setPromoError("Erreur de validation. Veuillez réessayer.");
    } finally {
      setPromoLoading(false);
    }
  }

  function handleRemovePromo() {
    setPromoCode(null);
    setPromoReduction(0);
    setPromoDescription(null);
    setPromoError(null);
    setPromoInput("");
  }

  function createPaymentIntent(code?: string | null) {
    const bodyPayload: Record<string, string> = { sessionId };
    if (code) bodyPayload.promoCode = code;

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else {
          if (process.env.NODE_ENV === "development") {
            setClientSecret("pi_test_placeholder_secret_test");
          } else {
            setLoadError(data.error ?? "Impossible d'initialiser le paiement.");
          }
        }
      })
      .catch(() => {
        if (process.env.NODE_ENV === "development") {
          setClientSecret("pi_test_placeholder_secret_test");
        } else {
          setLoadError("Erreur de connexion. Veuillez réessayer.");
        }
      });
  }

  useEffect(() => {
    // Fetch session data
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => { if (data.id) setSession(data); })
      .catch(() => {});

    // Récupérer les infos du stagiaire
    const stored = sessionStorage.getItem(`reserver_${sessionId}`);
    if (!stored) {
      router.push(`/reserver/${sessionId}/donnees`);
      return;
    }
    setStagiaire(JSON.parse(stored));

    // Créer le PaymentIntent
    createPaymentIntent();
  }, [sessionId, router]);

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* ── Formulaire paiement ── */}
      <div className="lg:col-span-2 space-y-5">
        <button
          onClick={() => router.push(`/reserver/${sessionId}/donnees`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Modifier mes informations
        </button>

        {/* Stagiaire recap */}
        {stagiaire && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {stagiaire.prenom[0]}{stagiaire.nom[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{stagiaire.prenom} {stagiaire.nom}</p>
              <p className="text-gray-500 text-xs">{stagiaire.email}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-lg text-gray-900">Paiement sécurisé</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <FontAwesomeIcon icon={faLock} className="text-green-500" />
              SSL 256-bit · Stripe
            </div>
          </div>

          {/* Logos CB */}
          <div className="flex items-center gap-2 mb-6 pb-6 border-b border-gray-100">
            {["VISA", "MC", "CB", "AMEX"].map((brand) => (
              <div key={brand} className="px-2.5 py-1 border border-gray-200 rounded text-[10px] font-bold text-gray-500 bg-gray-50">
                {brand}
              </div>
            ))}
          </div>

          {loadError ? (
            <div className="text-center py-8">
              <p className="text-red-600 text-sm mb-4">{loadError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#2563EB", borderRadius: "12px" },
                },
                locale: "fr",
              }}
            >
              <CheckoutForm sessionId={sessionId} prix={displayPrice} promoCode={promoCode} />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
              <span className="text-sm">Initialisation du paiement…</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Récapitulatif ── */}
      <div className="space-y-4">
        {/* Code promo */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-display font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faTag} className="text-blue-500 text-xs" />
            Code promo
          </h3>
          {promoCode ? (
            <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 min-w-0">
                <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xs shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-green-800 truncate">{promoCode}</p>
                  <p className="text-xs text-green-600">-{promoReduction} € {promoDescription && `· ${promoDescription}`}</p>
                </div>
              </div>
              <button
                onClick={handleRemovePromo}
                className="text-green-500 hover:text-red-500 transition-colors shrink-0"
                title="Retirer le code"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                placeholder="Entrez votre code"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder-gray-400 uppercase"
              />
              <button
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {promoLoading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  "Appliquer"
                )}
              </button>
            </div>
          )}
          {promoError && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
              {promoError}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-display font-bold text-sm text-gray-900 mb-4 uppercase tracking-wider">Récapitulatif</h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-gray-900">{s.formation.titre}</p>
              <p className="text-gray-500 text-sm">{s.centre}</p>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarDays} className="w-4 text-gray-400" />
                {new Date(s.dateDebut).toLocaleDateString("fr-FR")} — {new Date(s.dateFin).toLocaleDateString("fr-FR")}
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="w-4 text-gray-400" />
                {s.ville}
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" /> Agréé Préfecture
              </span>
              {s.formation.isQualiopi && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                  <FontAwesomeIcon icon={faAward} className="text-[9px]" /> Qualiopi
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#0A1628] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Stage</span>
            <span>{s.prix} €</span>
          </div>
          {promoCode && promoReduction > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 text-sm flex items-center gap-1.5">
                <FontAwesomeIcon icon={faTag} className="text-[10px]" />
                Code promo ({promoCode})
              </span>
              <span className="text-green-400 font-medium">-{promoReduction} €</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <span className="text-gray-400 text-sm">Frais de dossier</span>
            <span className="text-green-400 text-sm font-medium">Offerts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">Total TTC</span>
            <span className="font-bold text-2xl">{displayPrice} €</span>
          </div>
          <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
            <FontAwesomeIcon icon={faEuroSign} className="text-[10px]" />
            TVA incluse · Facturation disponible
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2.5">
          <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">Après le paiement</p>
          {[
            "Convocation par email immédiatement",
            "Remboursement si annulation 48h avant",
            "Accès à votre espace élève",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 shrink-0 text-xs" />
              <span className="text-xs text-green-700">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
