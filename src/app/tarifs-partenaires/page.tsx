"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faArrowRight,
  faBuilding,
  faChevronDown,
  faChevronUp,
  faQuoteLeft,
} from "@fortawesome/free-solid-svg-icons";

// ─── TYPES ──────────────────────────────────────────────

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  location: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Depuis notre inscription sur BYS Permis, nous avons augmenté notre taux de remplissage de 40%. La plateforme est simple d'utilisation et le support est très réactif.",
    author: "Marie D.",
    role: "Directrice de centre",
    location: "Lyon (69)",
  },
  {
    quote:
      "Le dashboard analytics nous permet de piloter notre activité en temps réel. Nous avons une vision claire de nos performances et pouvons ajuster nos prix facilement.",
    author: "Thomas B.",
    role: "Responsable formation",
    location: "Marseille (13)",
  },
  {
    quote:
      "L'équipe BYS est à l'écoute et nous accompagne dans le développement de notre réseau. Le système de paiement automatique nous fait gagner un temps précieux.",
    author: "Sophie L.",
    role: "Gérante multi-centres",
    location: "Paris (75)",
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Y a-t-il des frais d'inscription ?",
    answer:
      "Non. L'inscription, la publication de vos sessions et votre vitrine en ligne sont gratuites : aucun abonnement, aucun engagement de durée. Nous nous rémunérons uniquement via la commission sur les réservations confirmées.",
  },
  {
    question: "Comment sont calculées les commissions ?",
    answer:
      "La commission est de 15 % du prix TTC du stage. Elle est prélevée automatiquement sur chaque réservation confirmée via la plateforme — jamais sur les inscriptions que vous réalisez de votre côté.",
  },
  {
    question: "Quand recevrai-je mes paiements ?",
    answer:
      "Vos revenus sont versés chaque semaine sur votre compte bancaire via Stripe Connect. Vous suivez vos encaissements et la commission prélevée en temps réel dans votre tableau de bord.",
  },
  {
    question: "Suis-je engagé sur une durée ?",
    answer:
      "Non. Vous restez libre de publier ou non des sessions, et de quitter la plateforme à tout moment depuis votre espace centre. Aucun préavis, aucun frais de résiliation.",
  },
  {
    question: "Quels documents sont nécessaires pour s'inscrire ?",
    answer:
      "Pour rejoindre la plateforme, vous aurez besoin de : votre agrément préfectoral en cours de validité, un KBIS de moins de 3 mois, et votre RIB pour les paiements.",
  },
  {
    question: "Combien de temps faut-il pour être référencé ?",
    answer:
      "Après soumission de votre dossier, notre équipe vérifie vos documents sous 48 heures ouvrées. Une fois validé, votre profil est visible immédiatement sur la marketplace.",
  },
];

// ─── COMPONENTS ─────────────────────────────────────────

export default function TarifsPartenairesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      <main>
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 lg:py-28">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-300 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-[1440px] mx-auto px-8 text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <FontAwesomeIcon icon={faBuilding} className="text-blue-200" />
              Espace partenaire
            </span>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
              Tarifs centres partenaires
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Rejoignez le réseau BYS Permis et développez votre activité.
              Sans abonnement ni engagement : 15 % de commission sur les
              réservations confirmées, versées chaque semaine.
            </p>
          </div>
        </section>

        {/* ─── Notre modèle ─── */}
        <section className="section">
          <div className="max-w-5xl mx-auto px-8">
            <div className="text-center mb-14">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                Notre modèle
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                Une commission unique, sans abonnement
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Pas de forfait, pas d&apos;engagement de durée. Vous ne payez que
                lorsque la plateforme vous apporte une réservation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                { valeur: "0 €", titre: "Pour rejoindre", texte: "Inscription, publication de vos sessions et vitrine en ligne : entièrement gratuites." },
                { valeur: "15 %", titre: "Sur chaque vente", texte: "Prélevés sur le prix TTC, uniquement sur les réservations confirmées via BYS Permis." },
                { valeur: "7 j", titre: "Versement hebdomadaire", texte: "Vos revenus sont virés chaque semaine sur votre compte via Stripe Connect." },
              ].map((c) => (
                <div key={c.titre} className="rounded-2xl border border-brand-border bg-white p-8 text-center">
                  <p className="font-display font-bold text-4xl text-brand-accent mb-2">{c.valeur}</p>
                  <p className="font-display font-semibold text-brand-text mb-2">{c.titre}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{c.texte}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white border border-brand-border p-8">
              <h3 className="font-display font-semibold text-lg text-brand-text mb-5">
                Ce qui est inclus, sans supplément
              </h3>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  "Fiche centre et pages ville optimisées SEO",
                  "Publication illimitée de sessions",
                  "Encaissement sécurisé Stripe",
                  "Convocations et attestations automatiques",
                  "Émargement numérique",
                  "Tableau de bord et suivi des revenus",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faCheck} className="text-brand-accent mt-1 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="section">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="text-center mb-14">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                Témoignages
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                Ils nous font confiance
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Découvrez les retours de nos centres partenaires sur leur
                expérience avec BYS Permis.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {testimonials.map((t) => (
                <div
                  key={t.author}
                  className="bg-white rounded-2xl border border-brand-border p-8 hover:shadow-lg transition-all duration-300"
                >
                  <FontAwesomeIcon
                    icon={faQuoteLeft}
                    className="text-2xl text-blue-100 mb-4"
                  />
                  <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-brand-border">
                    <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold text-sm">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-brand-text text-sm">
                        {t.author}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {t.role} — {t.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="section bg-white">
          <div className="max-w-3xl mx-auto px-8">
            <div className="text-center mb-14">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                FAQ partenaires
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                Questions fréquentes
              </h2>
            </div>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-[#F9FAFB] rounded-xl border border-brand-border overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setOpenFaq(openFaq === index ? null : index)
                    }
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-brand-text pr-4">
                      {item.question}
                    </span>
                    <FontAwesomeIcon
                      icon={openFaq === index ? faChevronUp : faChevronDown}
                      className="text-gray-400 flex-shrink-0"
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5 text-gray-500 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-16">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-10 lg:p-16 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-300 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
                  Prêt à développer votre activité ?
                </h2>
                <p className="text-blue-100 max-w-2xl mx-auto mb-8 text-lg">
                  Rejoignez BYS Permis pour remplir vos sessions de stage.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/devenir-partenaire"
                    className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Devenir centre partenaire
                    <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-transparent border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Nous contacter
                  </Link>
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
