"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLocationDot,
  faClock,
  faBuilding,
  faArrowRight,
  faPaperPlane,
  faCircleCheck,
  faSpinner,
  faShieldHalved,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const subjectOptions = [
  { value: "", label: "Sélectionnez un sujet" },
  { value: "reservation", label: "Réservation / Stage" },
  { value: "partenariat", label: "Devenir centre partenaire" },
  { value: "support", label: "Support technique" },
  { value: "facturation", label: "Facturation / Paiement" },
  { value: "autre", label: "Autre demande" },
];

const faqLinks = [
  { question: "Comment réserver un stage ?", href: "/comment-ca-marche" },
  { question: "Tarifs pour les centres partenaires ?", href: "/tarifs-partenaires" },
  { question: "Comment devenir centre partenaire ?", href: "/inscription" },
  { question: "Consulter toute la FAQ", href: "/faq" },
];

const inputClass = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder-gray-400 bg-gray-50 border border-gray-200 text-gray-800";

export default function ContactPage() {
  const [formData, setFormData] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      <main>
        {/* ─── Hero dark navy ─── */}
        <section className="relative overflow-hidden bg-[#0A1628] text-white py-20 lg:py-28 px-4">
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(37,99,235,0.12) 0%, transparent 70%)" }} />
          {/* Barre tricolore */}
          <div className="absolute bottom-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-500" />
          </div>

          <div className="relative max-w-[1440px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border" style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)" }}>
              <FontAwesomeIcon icon={faEnvelope} className="text-blue-400 text-xs" />
              <span className="text-gray-300">Contact & Support</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6 text-white">
              Contactez-nous
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Une question sur un stage, un partenariat ou besoin d&apos;aide ?<br />
              Notre équipe répond sous 24h ouvrées.
            </p>

            {/* Infos rapides */}
            <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <FontAwesomeIcon icon={faEnvelope} className="text-blue-400 w-4 h-4" />
                <a href="mailto:bysforma95@gmail.com" className="hover:text-white transition-colors">bysforma95@gmail.com</a>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <FontAwesomeIcon icon={faLocationDot} className="text-blue-400 w-4 h-4" />
                Osny (95) — Val-d&apos;Oise
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <FontAwesomeIcon icon={faClock} className="text-blue-400 w-4 h-4" />
                Lun – Ven : 9h – 18h
              </div>
            </div>
          </div>
        </section>

        {/* ─── Form + Sidebar ─── */}
        <section className="py-16 px-4 sm:px-8">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid lg:grid-cols-3 gap-10">

              {/* ── Formulaire (2/3) ── */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-brand-border p-8 lg:p-10 shadow-sm">
                  <h2 className="font-display font-bold text-2xl text-brand-text mb-1">Envoyez-nous un message</h2>
                  <p className="text-gray-500 text-sm mb-8">Réponse garantie sous 24 heures ouvrées.</p>

                  {sent ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
                        <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-4xl" />
                      </div>
                      <h3 className="font-display font-bold text-2xl text-brand-text mb-3">Message envoyé !</h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                        Merci pour votre message. Notre équipe vous répondra dans les meilleurs délais.
                      </p>
                      <button
                        onClick={() => setSent(false)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-brand-border text-brand-text font-semibold text-sm hover:border-blue-600 hover:text-blue-600 transition-all"
                      >
                        Envoyer un autre message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                          <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleChange} required placeholder="Jean Dupont" className={inputClass} />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
                          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="jean@exemple.fr" className={inputClass} />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="sujet" className="block text-sm font-medium text-gray-700 mb-1.5">Sujet</label>
                        <select id="sujet" name="sujet" value={formData.sujet} onChange={handleChange} required className={inputClass}>
                          {subjectOptions.map((o) => (
                            <option key={o.value} value={o.value} disabled={o.value === ""}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                        <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={6} placeholder="Décrivez votre demande en détail..." className={`${inputClass} resize-none`} />
                      </div>

                      <button
                        type="submit"
                        disabled={sending}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
                      >
                        {sending
                          ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" />Envoi en cours…</>
                          : <><FontAwesomeIcon icon={faPaperPlane} />Envoyer le message</>
                        }
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* ── Sidebar (1/3) ── */}
              <div className="space-y-5">

                {/* Carte dark navy — centre partenaire */}
                <div className="rounded-2xl p-7 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0f2044 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl" />
                  <div className="w-11 h-11 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4 border border-blue-500/30">
                    <FontAwesomeIcon icon={faBuilding} className="text-blue-400 w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">Vous êtes un centre ?</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-5">
                    Rejoignez le réseau BYS Formation. Remplissez vos sessions et recevez 90% de chaque réservation.
                  </p>
                  <Link href="/inscription" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all">
                    Devenir partenaire
                    <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                  </Link>
                </div>

                {/* Infos contact */}
                <div className="bg-white rounded-2xl border border-brand-border p-7 shadow-sm">
                  <h3 className="font-display font-bold text-base text-brand-text mb-5 flex items-center gap-2">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-blue-600 w-4 h-4" />
                    Informations
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: faEnvelope, label: "Email", value: "bysforma95@gmail.com", href: "mailto:bysforma95@gmail.com" },
                      { icon: faLocationDot, label: "Adresse", value: "Bât. 7, 9 Chaussée Jules César, 95520 Osny" },
                      { icon: faClock, label: "Horaires", value: "Lun – Ven : 9h – 18h" },
                    ].map((info) => (
                      <div key={info.label} className="flex gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <FontAwesomeIcon icon={info.icon} className="text-blue-600 w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{info.label}</p>
                          {info.href
                            ? <a href={info.href} className="text-sm text-brand-text font-medium hover:text-blue-600 transition-colors">{info.value}</a>
                            : <p className="text-sm text-brand-text font-medium">{info.value}</p>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ rapide */}
                <div className="bg-white rounded-2xl border border-brand-border p-7 shadow-sm">
                  <h3 className="font-display font-bold text-base text-brand-text mb-1">Questions fréquentes</h3>
                  <p className="text-gray-400 text-xs mb-4">Peut-être avez-vous déjà votre réponse ?</p>
                  <ul className="space-y-1">
                    {faqLinks.map((faq) => (
                      <li key={faq.href}>
                        <Link href={faq.href} className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all group border border-transparent hover:border-gray-100">
                          <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" />
                          {faq.question}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
