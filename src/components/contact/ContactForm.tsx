"use client";

import { useState, useSyncExternalStore } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faCircleCheck,
  faSpinner,
  faComments,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const subjectOptions = [
  { value: "", label: "Sélectionnez un sujet" },
  { value: "reservation", label: "Réservation / Stage" },
  { value: "partenariat", label: "Devenir centre partenaire" },
  { value: "support", label: "Support technique" },
  { value: "facturation", label: "Facturation / Paiement" },
  { value: "autre", label: "Autre demande" },
];

const noopSubscribe = () => () => {};

/**
 * `false` dans le HTML rendu côté serveur, `true` dès que React a hydraté le
 * composant. Tant que ce n'est pas le cas, `onSubmit` n'est pas encore attaché :
 * un clic (ou Entrée) déclenchait la soumission native du navigateur, c'est-à-dire
 * un GET `/contact?nom=…&email=…&message=…` — la page se rechargeait vide, rien
 * n'était envoyé et les données du visiteur atterrissaient dans l'URL.
 */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * Formulaire de contact (client-only).
 * Tout le reste de la page contact est rendu côté serveur.
 */
export default function ContactForm() {
  const hydrated = useHydrated();
  const [formData, setFormData] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSent(true);
        setFormData({ nom: "", email: "", sujet: "", message: "" });
      } else if (res.status === 429) {
        const secondes = Number(res.headers.get("Retry-After")) || 60;
        setError(
          `Trop de messages envoyés coup sur coup. Réessayez dans ${secondes} seconde${secondes > 1 ? "s" : ""}.`,
        );
      } else if (res.status === 400) {
        setError("Certains champs sont incomplets ou invalides. Vérifiez le formulaire.");
      } else {
        setError("L'envoi a échoué. Réessayez, ou écrivez-nous à contact@byspermis.fr.");
      }
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <FontAwesomeIcon icon={faComments} className="text-white w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-gray-900">
            Envoyez-nous un message
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Réponse garantie sous 24 heures ouvrées.
          </p>
        </div>
      </div>

      {sent ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6 border-4 border-green-100 shadow-lg shadow-green-100">
            <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-4xl" />
          </div>
          <h3 className="font-display font-bold text-2xl text-gray-900 mb-3">
            Message envoyé !
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Merci pour votre message. Notre équipe vous répondra dans les meilleurs délais.
          </p>
          <button
            onClick={() => setSent(false)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-blue-500 hover:text-blue-600 transition-all"
          >
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="nom" className="block text-sm font-semibold text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                placeholder="Jean Dupont"
                className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-gray-400 bg-gray-50/80 border border-gray-200 text-gray-800 hover:border-gray-300"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="jean@exemple.fr"
                className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-gray-400 bg-gray-50/80 border border-gray-200 text-gray-800 hover:border-gray-300"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sujet" className="block text-sm font-semibold text-gray-700 mb-2">
              Sujet
            </label>
            <div className="relative">
              <select
                id="sujet"
                name="sujet"
                value={formData.sujet}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all bg-gray-50/80 border border-gray-200 text-gray-800 hover:border-gray-300 appearance-none cursor-pointer"
              >
                {subjectOptions.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.value === ""}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              minLength={10}
              rows={6}
              placeholder="Décrivez votre demande en détail... (10 caractères minimum)"
              className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-gray-400 bg-gray-50/80 border border-gray-200 text-gray-800 hover:border-gray-300 resize-none"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400 hidden sm:block">
              Vos données sont protégées conformément au RGPD.
            </p>
            <button
              type="submit"
              // Désactivé tant que React n'a pas hydraté le formulaire (cf. useHydrated).
              disabled={sending || !hydrated}
              aria-busy={sending}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
            >
              {sending ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Envoyer le message
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
