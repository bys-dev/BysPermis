"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faCreditCard,
  faEnvelopeOpenText,
  faIdCard,
  faArrowRight,
  faShieldHalved,
  faLock,
  faCalendarCheck,
  faBuilding,
  faChartLine,
  faHeadset,
  faChevronDown,
  faChevronUp,
  faCheckCircle,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// ─── DATA ────────────────────────────────────────────────

interface Step {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: IconDefinition;
  color: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Recherchez",
    subtitle: "Trouvez un stage près de chez vous",
    description:
      "Utilisez notre moteur de recherche pour trouver un stage de récupération de points par ville, date ou prix. Comparez les offres et consultez les avis des anciens stagiaires.",
    icon: faMagnifyingGlass,
    color: "from-blue-500 to-blue-600",
  },
  {
    number: "02",
    title: "Réservez",
    subtitle: "Payez en ligne de façon sécurisée",
    description:
      "Choisissez votre session parmi les dates disponibles et réservez en quelques clics. Paiement 100% sécurisé par carte bancaire via Stripe.",
    icon: faCreditCard,
    color: "from-green-500 to-green-600",
  },
  {
    number: "03",
    title: "Recevez",
    subtitle: "Convocation immédiate par email",
    description:
      "Dès votre réservation confirmée, recevez votre convocation par email avec toutes les informations pratiques : adresse du centre, horaires, documents à apporter.",
    icon: faEnvelopeOpenText,
    color: "from-amber-500 to-amber-600",
  },
  {
    number: "04",
    title: "Récupérez",
    subtitle: "Jusqu'à 4 points sur votre permis",
    description:
      "Suivez le stage sur 2 jours consécutifs (14 heures) dans votre centre agréé. À l'issue du stage, récupérez jusqu'à 4 points sur votre permis de conduire.",
    icon: faIdCard,
    color: "from-red-500 to-red-600",
  },
];

interface Guarantee {
  icon: IconDefinition;
  title: string;
  description: string;
}

const guarantees: Guarantee[] = [
  {
    icon: faShieldHalved,
    title: "Agréé préfecture",
    description:
      "Tous nos stages sont dispensés par des centres titulaires d'un agrément préfectoral en cours de validité.",
  },
  {
    icon: faLock,
    title: "Paiement sécurisé",
    description:
      "Transactions cryptées et sécurisées via Stripe. Vos données bancaires ne sont jamais stockées sur nos serveurs.",
  },
  {
    icon: faCalendarCheck,
    title: "Annulation gratuite 7j avant",
    description:
      "Changement de plan ? Annulez gratuitement jusqu'à 7 jours avant le début du stage et recevez un remboursement intégral.",
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Combien de points puis-je récupérer avec un stage ?",
    answer:
      "Un stage de sensibilisation à la sécurité routière permet de récupérer jusqu'à 4 points sur votre permis de conduire, dans la limite du plafond de 12 points (ou 6 points pour les permis probatoires).",
  },
  {
    question: "Combien de temps dure un stage ?",
    answer:
      "Un stage dure 2 jours consécutifs, soit 14 heures de formation au total. Il est animé par un binôme composé d'un psychologue et d'un expert en sécurité routière.",
  },
  {
    question: "Puis-je faire un stage si mon permis est invalidé ?",
    answer:
      "Non, le stage volontaire est réservé aux conducteurs dont le permis est encore valide (solde de points supérieur à 0). Si votre permis a été invalidé, vous devez repasser l'examen.",
  },
  {
    question: "Comment savoir combien de points il me reste ?",
    answer:
      "Vous pouvez consulter votre solde de points sur le site du Service Télépoints (telepoints.info) avec votre numéro de permis et votre code confidentiel.",
  },
  {
    question: "Le stage est-il remboursé si je ne récupère pas de points ?",
    answer:
      "Le stage vous permet de récupérer des points uniquement si votre solde est inférieur à 12 points au moment du stage. Si votre solde est déjà à 12 points, le stage n'aura aucun effet sur votre solde.",
  },
];

// ─── PAGE ────────────────────────────────────────────────

export default function CommentCaMarchePage() {
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
              <FontAwesomeIcon icon={faIdCard} className="text-blue-200" />
              Récupération de points
            </span>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
              Comment ça marche ?
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Réservez votre stage de récupération de points en 4 étapes simples
              et récupérez jusqu&apos;à 4 points sur votre permis.
            </p>
          </div>
        </section>

        {/* ─── Steps ─── */}
        <section className="section">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="text-center mb-16">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                4 étapes simples
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                De la recherche à la récupération de points
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Un parcours simplifié pour vous accompagner à chaque étape de
                votre démarche.
              </p>
            </div>

            <div className="space-y-8 max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="bg-white rounded-2xl border border-brand-border p-8 lg:p-10 flex flex-col lg:flex-row gap-8 items-center hover:shadow-lg transition-all duration-300"
                >
                  {/* Number + Icon */}
                  <div className="flex-shrink-0 text-center">
                    <div
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                    >
                      <FontAwesomeIcon
                        icon={step.icon}
                        className="text-white text-2xl"
                      />
                    </div>
                    <div className="font-display font-bold text-sm text-gray-300 mt-3">
                      ÉTAPE {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    <h3 className="font-display font-bold text-2xl text-brand-text mb-2">
                      {step.title}
                    </h3>
                    <p className="text-brand-accent font-semibold mb-3">
                      {step.subtitle}
                    </p>
                    <p className="text-gray-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow (desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block text-gray-200">
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="text-xl"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA under steps */}
            <div className="text-center mt-12">
              <Link
                href="/recherche"
                className="btn-primary text-lg px-10 py-4 rounded-xl inline-flex items-center gap-3"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                Trouver un stage
              </Link>
            </div>
          </div>
        </section>

        {/* ─── For Training Centers ─── */}
        <section className="section bg-white">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                  Espace partenaire
                </span>
                <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-6">
                  Pour les centres de formation
                </h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Vous êtes un centre de formation agréé préfecture ? Rejoignez
                  le réseau BYS Formation et bénéficiez d&apos;une marketplace
                  performante pour remplir vos sessions.
                </p>
                <div className="space-y-5">
                  {[
                    {
                      icon: faUserPlus,
                      title: "Inscription gratuite",
                      desc: "Créez votre profil centre en quelques minutes et publiez vos sessions de stage.",
                    },
                    {
                      icon: faChartLine,
                      title: "Visibilité accrue",
                      desc: "Touchez des milliers de conducteurs qui recherchent un stage près de chez eux.",
                    },
                    {
                      icon: faBuilding,
                      title: "Gestion simplifiée",
                      desc: "Tableau de bord dédié pour gérer vos sessions, réservations et paiements.",
                    },
                    {
                      icon: faHeadset,
                      title: "Support dédié",
                      desc: "Une équipe à votre écoute pour vous accompagner dans le développement de votre activité.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={item.icon} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-text mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link
                    href="/inscription"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Devenir centre partenaire
                    <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                  </Link>
                </div>
              </div>

              {/* Visual card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-10 border border-blue-100">
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className="text-brand-accent text-4xl mb-4"
                    />
                    <h3 className="font-display font-bold text-xl text-brand-text">
                      Pourquoi nous rejoindre ?
                    </h3>
                  </div>
                  {[
                    "Commission transparente, sans frais cachés",
                    "Paiements versés automatiquement sur votre compte",
                    "Tableau de bord analytics en temps réel",
                    "Gestion automatique des convocations",
                    "Avis clients vérifiés pour renforcer votre crédibilité",
                  ].map((text) => (
                    <div
                      key={text}
                      className="flex items-center gap-3 bg-white rounded-xl p-4 border border-brand-border"
                    >
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-green-500 flex-shrink-0"
                      />
                      <span className="text-gray-700 text-sm font-medium">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Guarantees ─── */}
        <section className="section">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="text-center mb-14">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                Nos garanties
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                Réservez en toute confiance
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {guarantees.map((g) => (
                <div
                  key={g.title}
                  className="bg-white rounded-2xl border border-brand-border p-8 text-center hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5">
                    <FontAwesomeIcon icon={g.icon} className="text-2xl" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-brand-text mb-3">
                    {g.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {g.description}
                  </p>
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
                FAQ
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
                  Prêt à récupérer vos points ?
                </h2>
                <p className="text-blue-100 max-w-2xl mx-auto mb-8 text-lg">
                  Trouvez un stage de récupération de points près de chez vous
                  et réservez en quelques clics.
                </p>
                <Link
                  href="/recherche"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                  Trouver un stage
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
