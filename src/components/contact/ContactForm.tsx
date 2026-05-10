"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faCircleCheck,
  faSpinner,
  faComments,
} from "@fortawesome/free-solid-svg-icons";

const subjectOptions = [
  { value: "", label: "Sélectionnez un sujet" },
  { value: "reservation", label: "Réservation / Stage" },
  { value: "partenariat", label: "Devenir centre partenaire" },
  { value: "support", label: "Support technique" },
  { value: "facturation", label: "Facturation / Paiement" },
  { value: "autre", label: "Autre demande" },
];

/**
 * Formulaire de contact (client-only).
 * Tout le reste de la page contact est rendu côté serveur.
 */
export default function ContactForm() {
  const [formData, setFormData] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSent(true);
        setFormData({ nom: "", email: "", sujet: "", message: "" });
      }
    } catch {
      // silently fail in dev
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
              rows={6}
              placeholder="Décrivez votre demande en détail..."
              className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-gray-400 bg-gray-50/80 border border-gray-200 text-gray-800 hover:border-gray-300 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400 hidden sm:block">
              Vos données sont protégées conformément au RGPD.
            </p>
            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white font-semibold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
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
