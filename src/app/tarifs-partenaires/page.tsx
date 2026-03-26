"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faXmark,
  faArrowRight,
  faBuilding,
  faStar,
  faRocket,
  faChevronDown,
  faChevronUp,
  faQuoteLeft,
  faCrown,
  faGem,
  faCubes,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// ─── DATA ────────────────────────────────────────────────

interface Plan {
  name: string;
  icon: IconDefinition;
  commission: string;
  commissionLabel: string;
  description: string;
  popular: boolean;
  features: { label: string; included: boolean }[];
  cta: string;
}

const plans: Plan[] = [
  {
    name: "Essentiel",
    icon: faCubes,
    commission: "10%",
    commissionLabel: "par réservation",
    description:
      "L'offre idéale pour démarrer sur la marketplace et tester la plateforme.",
    popular: false,
    features: [
      { label: "Listing sur la marketplace", included: true },
      { label: "Gestion des sessions", included: true },
      { label: "Convocations automatiques", included: true },
      { label: "Support par email", included: true },
      { label: "Paiements automatiques", included: true },
      { label: "Mise en avant dans les résultats", included: false },
      { label: "Dashboard analytics", included: false },
      { label: "Support prioritaire", included: false },
      { label: "Account manager dédié", included: false },
      { label: "Accès API", included: false },
    ],
    cta: "Commencer gratuitement",
  },
  {
    name: "Pro",
    icon: faGem,
    commission: "8%",
    commissionLabel: "par réservation",
    description:
      "Pour les centres qui souhaitent maximiser leur visibilité et piloter leur activité.",
    popular: true,
    features: [
      { label: "Listing sur la marketplace", included: true },
      { label: "Gestion des sessions", included: true },
      { label: "Convocations automatiques", included: true },
      { label: "Support par email", included: true },
      { label: "Paiements automatiques", included: true },
      { label: "Mise en avant dans les résultats", included: true },
      { label: "Dashboard analytics", included: true },
      { label: "Support prioritaire", included: true },
      { label: "Account manager dédié", included: false },
      { label: "Accès API", included: false },
    ],
    cta: "Choisir Pro",
  },
  {
    name: "Entreprise",
    icon: faCrown,
    commission: "Sur mesure",
    commissionLabel: "commission négociable",
    description:
      "Pour les réseaux de centres et groupes de formation avec des besoins spécifiques.",
    popular: false,
    features: [
      { label: "Listing sur la marketplace", included: true },
      { label: "Gestion des sessions", included: true },
      { label: "Convocations automatiques", included: true },
      { label: "Support par email", included: true },
      { label: "Paiements automatiques", included: true },
      { label: "Mise en avant dans les résultats", included: true },
      { label: "Dashboard analytics", included: true },
      { label: "Support prioritaire", included: true },
      { label: "Account manager dédié", included: true },
      { label: "Accès API", included: true },
    ],
    cta: "Nous contacter",
  },
];

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  location: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Depuis notre inscription sur BYS Formation, nous avons augmenté notre taux de remplissage de 40%. La plateforme est simple d'utilisation et le support est très réactif.",
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
      "Non, l'inscription sur BYS Formation est entièrement gratuite. Vous ne payez qu'une commission sur les réservations effectivement réalisées via la plateforme.",
  },
  {
    question: "Comment sont calculées les commissions ?",
    answer:
      "La commission est prélevée automatiquement sur chaque réservation confirmée. Elle est calculée sur le prix TTC du stage. Par exemple, pour un stage à 250 € avec une commission de 10%, vous recevez 225 € et BYS Formation perçoit 25 €.",
  },
  {
    question: "Quand recevrai-je mes paiements ?",
    answer:
      "Les paiements sont versés automatiquement sur votre compte bancaire via Stripe Connect, sous 7 jours ouvrés après la fin du stage. Vous pouvez suivre vos paiements en temps réel dans votre tableau de bord.",
  },
  {
    question: "Puis-je changer de plan en cours de route ?",
    answer:
      "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre espace centre. Le changement prend effet immédiatement.",
  },
  {
    question: "Quels documents sont nécessaires pour s'inscrire ?",
    answer:
      "Pour rejoindre la plateforme, vous aurez besoin de : votre agrément préfectoral en cours de validité, un KBIS de moins de 3 mois, votre RIB pour les paiements, et optionnellement votre certification Qualiopi.",
  },
  {
    question: "Combien de temps faut-il pour être référencé ?",
    answer:
      "Après soumission de votre dossier, notre équipe vérifie vos documents sous 48 heures ouvrées. Une fois validé, votre profil est visible immédiatement sur la marketplace.",
  },
];

// ─── COMPONENTS ──────────────────────────────────────────

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={`relative bg-white rounded-2xl border ${
        plan.popular
          ? "border-brand-accent shadow-xl shadow-blue-100 scale-105"
          : "border-brand-border"
      } p-8 flex flex-col hover:shadow-lg transition-all duration-300`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-xs font-bold px-4 py-1.5 rounded-full">
          Le plus populaire
        </div>
      )}

      <div className="text-center mb-6">
        <div
          className={`w-14 h-14 rounded-xl ${
            plan.popular
              ? "bg-brand-accent text-white"
              : "bg-blue-50 text-blue-600"
          } flex items-center justify-center mx-auto mb-4`}
        >
          <FontAwesomeIcon icon={plan.icon} className="text-xl" />
        </div>
        <h3 className="font-display font-bold text-xl text-brand-text">
          {plan.name}
        </h3>
        <p className="text-gray-500 text-sm mt-2">{plan.description}</p>
      </div>

      <div className="text-center mb-6 pb-6 border-b border-brand-border">
        <div className="font-display font-bold text-4xl text-brand-text">
          {plan.commission}
        </div>
        <div className="text-gray-500 text-sm mt-1">
          {plan.commissionLabel}
        </div>
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={feature.included ? faCheck : faXmark}
              className={`flex-shrink-0 ${
                feature.included ? "text-green-500" : "text-gray-300"
              }`}
            />
            <span
              className={`text-sm ${
                feature.included ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/inscription"
        className={`w-full text-center py-3 rounded-lg font-semibold transition-colors ${
          plan.popular
            ? "bg-brand-accent text-white hover:bg-brand-accent-hover"
            : "bg-gray-100 text-brand-text hover:bg-gray-200"
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────

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
              Rejoignez le réseau BYS Formation et développez votre activité.
              Inscription gratuite, commission uniquement sur les réservations.
            </p>
          </div>
        </section>

        {/* ─── Pricing Plans ─── */}
        <section className="section">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="text-center mb-14">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                Nos offres
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                Choisissez le plan adapté à votre centre
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Aucun frais d&apos;inscription. Vous ne payez qu&apos;une
                commission sur les réservations effectuées via la plateforme.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
              {plans.map((plan) => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Feature Comparison Table ─── */}
        <section className="section bg-white">
          <div className="max-w-5xl mx-auto px-8">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mb-4">
                Comparaison détaillée
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Retrouvez en détail toutes les fonctionnalités incluses dans
                chaque plan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-brand-border">
                    <th className="text-left py-4 px-4 font-display font-semibold text-brand-text">
                      Fonctionnalité
                    </th>
                    <th className="text-center py-4 px-4 font-display font-semibold text-brand-text">
                      Essentiel
                    </th>
                    <th className="text-center py-4 px-4 font-display font-semibold text-brand-accent">
                      Pro
                    </th>
                    <th className="text-center py-4 px-4 font-display font-semibold text-brand-text">
                      Entreprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: "Commission",
                      essentiel: "10%",
                      pro: "8%",
                      entreprise: "Négociable",
                    },
                    {
                      feature: "Listing marketplace",
                      essentiel: true,
                      pro: true,
                      entreprise: true,
                    },
                    {
                      feature: "Gestion des sessions",
                      essentiel: true,
                      pro: true,
                      entreprise: true,
                    },
                    {
                      feature: "Convocations automatiques",
                      essentiel: true,
                      pro: true,
                      entreprise: true,
                    },
                    {
                      feature: "Paiements automatiques",
                      essentiel: true,
                      pro: true,
                      entreprise: true,
                    },
                    {
                      feature: "Mise en avant (listing premium)",
                      essentiel: false,
                      pro: true,
                      entreprise: true,
                    },
                    {
                      feature: "Dashboard analytics",
                      essentiel: false,
                      pro: true,
                      entreprise: true,
                    },
                    {
                      feature: "Support prioritaire",
                      essentiel: false,
                      pro: true,
                      entreprise: true,
                    },
                    {
                      feature: "Account manager dédié",
                      essentiel: false,
                      pro: false,
                      entreprise: true,
                    },
                    {
                      feature: "Accès API",
                      essentiel: false,
                      pro: false,
                      entreprise: true,
                    },
                    {
                      feature: "Formation commerciale",
                      essentiel: false,
                      pro: false,
                      entreprise: true,
                    },
                    {
                      feature: "Multi-centres",
                      essentiel: false,
                      pro: false,
                      entreprise: true,
                    },
                  ].map((row, index) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-brand-border ${
                        index % 2 === 0 ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-sm text-gray-700 font-medium">
                        {row.feature}
                      </td>
                      {(["essentiel", "pro", "entreprise"] as const).map(
                        (plan) => (
                          <td key={plan} className="py-3.5 px-4 text-center">
                            {typeof row[plan] === "boolean" ? (
                              <FontAwesomeIcon
                                icon={row[plan] ? faCheck : faXmark}
                                className={
                                  row[plan]
                                    ? "text-green-500"
                                    : "text-gray-300"
                                }
                              />
                            ) : (
                              <span className="text-sm font-semibold text-brand-text">
                                {row[plan]}
                              </span>
                            )}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                expérience avec BYS Formation.
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
                  Rejoignez les 150+ centres qui font confiance à BYS Formation
                  pour remplir leurs sessions de stage.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/inscription"
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
