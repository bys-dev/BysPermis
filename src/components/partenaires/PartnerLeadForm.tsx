"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faCircleCheck,
  faSpinner,
  faHandshake,
} from "@fortawesome/free-solid-svg-icons";
import { trackLead } from "@/lib/analytics";

const volumeOptions = [
  { value: "", label: "Volume de stages estimé (optionnel)" },
  { value: "1-4", label: "1 à 4 stages / mois" },
  { value: "5-10", label: "5 à 10 stages / mois" },
  { value: "10+", label: "Plus de 10 stages / mois" },
  { value: "ne_sait_pas", label: "Je ne sais pas encore" },
];

const inputClass =
  "w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-gray-400 bg-gray-50/80 border border-gray-200 text-gray-800 hover:border-gray-300";

/**
 * Formulaire de captation de leads « centres partenaires ».
 * Rendu client-only ; posté vers /api/partenaires (Resend).
 */
export default function PartnerLeadForm() {
  const [formData, setFormData] = useState({
    centre: "",
    contact: "",
    email: "",
    telephone: "",
    ville: "",
    volume: "",
    message: "",
    consent: false,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/partenaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        // Conversion ads : GA4 generate_lead + Google Ads + Meta Lead.
        trackLead("devenir-partenaire", { volume: formData.volume || undefined });
        setSent(true);
        setFormData({
          centre: "",
          contact: "",
          email: "",
          telephone: "",
          ville: "",
          volume: "",
          message: "",
          consent: false,
        });
      } else {
        setError("Une erreur est survenue. Vérifiez vos informations et réessayez.");
      }
    } catch {
      setError("Impossible d'envoyer la demande. Réessayez dans un instant.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 lg:p-10 shadow-sm">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6 border-4 border-green-100 shadow-lg shadow-green-100">
            <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-4xl" />
          </div>
          <h3 className="font-display font-bold text-2xl text-gray-900 mb-3">
            Demande envoyée !
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Merci. Notre équipe partenariats étudie votre centre et vous recontacte
            sous 48h ouvrées pour organiser votre référencement.
          </p>
          <button
            onClick={() => setSent(false)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-blue-500 hover:text-blue-600 transition-all"
          >
            Envoyer une autre demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 lg:p-10 shadow-sm">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <FontAwesomeIcon icon={faHandshake} className="text-white w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-gray-900">
            Recevoir une proposition
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Sans engagement — réponse sous 48h ouvrées.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="centre" className="block text-sm font-semibold text-gray-700 mb-2">
              Nom du centre <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              id="centre"
              name="centre"
              value={formData.centre}
              onChange={handleChange}
              required
              placeholder="Centre de sensibilisation…"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-semibold text-gray-700 mb-2">
              Votre nom <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
              placeholder="Jean Dupont"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-blue-600">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="contact@moncentre.fr"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="telephone" className="block text-sm font-semibold text-gray-700 mb-2">
              Téléphone <span className="text-blue-600">*</span>
            </label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              required
              placeholder="06 12 34 56 78"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="ville" className="block text-sm font-semibold text-gray-700 mb-2">
              Ville / département <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              id="ville"
              name="ville"
              value={formData.ville}
              onChange={handleChange}
              required
              placeholder="Osny (95)"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="volume" className="block text-sm font-semibold text-gray-700 mb-2">
              Volume estimé
            </label>
            <div className="relative">
              <select
                id="volume"
                name="volume"
                value={formData.volume}
                onChange={handleChange}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                {volumeOptions.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.value === ""}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
            Message <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder="Parlez-nous de votre centre, vos agréments, vos disponibilités…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="consent"
            checked={formData.consent}
            onChange={handleChange}
            required
            className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/40 cursor-pointer"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            J&apos;accepte d&apos;être recontacté(e) par BYS Formation au sujet de ce
            partenariat. Mes données sont traitées conformément au RGPD et ne sont
            jamais revendues.
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white font-semibold px-8 py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
        >
          {sending ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} />
              Envoyer ma demande
            </>
          )}
        </button>
      </form>
    </div>
  );
}
