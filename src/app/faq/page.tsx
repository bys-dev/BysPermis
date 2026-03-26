"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faEnvelope,
  faPhone,
  faShieldHalved,
  faCalendarCheck,
  faCreditCard,
  faClipboardList,
  faCircleCheck,
  faMagnifyingGlass,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// ─── TYPES ────────────────────────────────────────────────

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  icon: IconDefinition;
  items: FaqItem[];
}

// ─── FAQ DATA ─────────────────────────────────────────────

const faqCategories: FaqCategory[] = [
  {
    title: "Le stage de récupération de points",
    icon: faShieldHalved,
    items: [
      {
        question: "Combien de points peut-on récupérer lors d'un stage ?",
        answer:
          "Un stage de sensibilisation à la sécurité routière permet de récupérer jusqu'à 4 points sur votre permis de conduire. Attention, le nombre de points ne peut pas dépasser le plafond de votre permis (12 points pour un permis classique, 6 à 10 points pour un permis probatoire selon l'ancienneté). Les points sont crédités le lendemain du dernier jour de stage.",
      },
      {
        question: "Quelle est la durée d'un stage de récupération de points ?",
        answer:
          "Le stage dure obligatoirement 2 jours consécutifs, soit 14 heures de formation au total (7 heures par jour, généralement de 8h30 à 12h30 et de 13h30 à 17h30). Le programme est fixé par arrêté ministériel et comprend des modules sur l'accidentologie, la vitesse, l'alcool et les produits psychoactifs, ainsi qu'un bilan personnel de votre conduite.",
      },
      {
        question: "À quelle fréquence peut-on faire un stage ?",
        answer:
          "Vous pouvez effectuer un stage de récupération de points une fois par an (12 mois minimum entre deux stages volontaires). Ce délai court à partir du dernier jour du précédent stage. En revanche, si vous recevez une lettre 48N (permis probatoire), le stage est obligatoire et ne suit pas cette limite de fréquence.",
      },
      {
        question: "Peut-on faire un stage avec un permis suspendu ?",
        answer:
          "Non, il n'est pas possible d'effectuer un stage volontaire de récupération de points si votre permis est suspendu, annulé ou invalidé (solde à zéro). Le stage volontaire s'adresse uniquement aux conducteurs dont le permis est encore valide. Si vous avez reçu la lettre 48SI (invalidation pour solde nul), vous devrez repasser votre permis. En revanche, pendant une période de rétention (72h après une infraction), le stage reste possible.",
      },
      {
        question: "Stage volontaire ou stage obligatoire : quelle différence ?",
        answer:
          "Le stage volontaire est une démarche personnelle pour récupérer des points avant d'atteindre un solde critique. Le stage obligatoire (lettre 48N) concerne les conducteurs en permis probatoire qui commettent une infraction entraînant un retrait de 3 points ou plus. Dans ce dernier cas, le stage doit être effectué dans les 4 mois suivant la réception de la lettre recommandée, sous peine d'une amende de 135 € et d'une suspension de permis.",
      },
    ],
  },
  {
    title: "Inscription et réservation",
    icon: faCalendarCheck,
    items: [
      {
        question: "Comment réserver un stage sur BYS Formation ?",
        answer:
          "La réservation se fait en quelques étapes simples : 1) Recherchez un stage par ville, département ou code postal sur notre page de recherche. 2) Sélectionnez le stage qui vous convient (date, lieu, prix). 3) Créez votre compte ou connectez-vous. 4) Renseignez vos informations personnelles et votre numéro de permis. 5) Procédez au paiement sécurisé. Vous recevrez immédiatement un e-mail de confirmation avec votre convocation.",
      },
      {
        question: "Quels documents sont nécessaires pour s'inscrire ?",
        answer:
          "Pour vous inscrire à un stage, vous aurez besoin de : votre permis de conduire original (pas de photocopie), une pièce d'identité en cours de validité (carte d'identité ou passeport), votre relevé d'information intégral (disponible sur le site de l'ANTS — telepoints.info), et si vous êtes en permis probatoire, votre lettre 48N. Le jour du stage, vous devrez présenter les originaux de ces documents.",
      },
      {
        question: "Puis-je m'inscrire pour une autre personne ?",
        answer:
          "Oui, vous pouvez réserver un stage pour un proche. Vous devrez renseigner les informations du participant (nom, prénom, date de naissance, numéro de permis). Le paiement peut être effectué par un tiers, mais le participant devra obligatoirement se présenter en personne le jour du stage avec ses documents originaux.",
      },
      {
        question: "Comment recevoir ma convocation ?",
        answer:
          "Dès votre réservation confirmée et le paiement validé, votre convocation vous est envoyée automatiquement par e-mail. Vous pouvez également la retrouver dans votre espace personnel sur BYS Formation, rubrique \"Mes réservations\". La convocation précise l'adresse exacte du centre, les horaires et les documents à apporter. Nous vous envoyons un rappel 48h avant le début du stage.",
      },
      {
        question: "Puis-je changer la date ou le lieu de mon stage ?",
        answer:
          "Oui, la modification est possible jusqu'à 7 jours avant la date du stage, sans frais supplémentaires (sous réserve de disponibilité). Pour modifier votre réservation, rendez-vous dans votre espace personnel ou contactez notre support. Au-delà de ce délai, une modification peut entraîner des frais administratifs de 30 €.",
      },
    ],
  },
  {
    title: "Paiement",
    icon: faCreditCard,
    items: [
      {
        question: "Combien coûte un stage de récupération de points ?",
        answer:
          "Le prix d'un stage de récupération de points varie généralement entre 200 € et 300 € selon le centre de formation, la ville et la période. Sur BYS Formation, vous pouvez comparer les prix de tous les centres agréés dans votre région pour trouver la meilleure offre. Le prix affiché est le prix final, sans frais cachés.",
      },
      {
        question: "Quels moyens de paiement sont acceptés ?",
        answer:
          "Nous acceptons les paiements par carte bancaire (Visa, Mastercard, American Express) via notre plateforme de paiement sécurisée Stripe. Le paiement est chiffré SSL et conforme à la norme PCI-DSS. Nous ne stockons jamais vos données bancaires. Un reçu de paiement vous est automatiquement envoyé par e-mail.",
      },
      {
        question: "Le stage peut-il être pris en charge par le CPF ?",
        answer:
          "Non, les stages de récupération de points ne sont pas éligibles au CPF (Compte Personnel de Formation). En revanche, certaines formations professionnelles proposées sur notre plateforme (FIMO, FCO, permis B) peuvent être éligibles au CPF. Les centres concernés affichent le badge \"Éligible CPF\" sur leur fiche.",
      },
      {
        question: "Quelle est la politique d'annulation et de remboursement ?",
        answer:
          "Annulation gratuite : vous bénéficiez d'un remboursement intégral si l'annulation intervient au moins 10 jours avant le stage. Annulation entre 10 et 3 jours : remboursement de 70 % du montant. Annulation moins de 3 jours avant ou absence sans prévenir : aucun remboursement. En cas de force majeure (hospitalisation, décès d'un proche), un remboursement exceptionnel peut être étudié sur présentation de justificatifs. Le remboursement est crédité sous 5 à 10 jours ouvrés sur votre carte bancaire.",
      },
    ],
  },
  {
    title: "Le jour du stage",
    icon: faClipboardList,
    items: [
      {
        question: "Comment se déroule un stage de récupération de points ?",
        answer:
          "Le stage se déroule sur 2 jours consécutifs dans les locaux du centre de formation. Il est animé par deux professionnels : un psychologue et un expert en sécurité routière (BAFM). Le programme comprend : une présentation du cadre légal, un module sur l'accidentologie et les facteurs de risque, des échanges et discussions en groupe, une analyse des comportements de conduite, et un bilan individuel. L'objectif est de sensibiliser les participants, pas de les sanctionner.",
      },
      {
        question: "Quels documents apporter le jour du stage ?",
        answer:
          "Le jour du stage, vous devez impérativement vous munir de : votre permis de conduire original, une pièce d'identité en cours de validité (CNI ou passeport), votre convocation (imprimée ou sur smartphone), et un stylo. En cas d'oubli de votre permis de conduire, vous ne pourrez pas participer au stage et aucun remboursement ne sera possible.",
      },
      {
        question: "Que se passe-t-il si j'arrive en retard ?",
        answer:
          "La ponctualité est obligatoire. En cas de retard de plus de 15 minutes, le centre peut vous refuser l'accès au stage conformément à la réglementation. Dans ce cas, vous devrez vous réinscrire à une autre session et aucun remboursement ne sera effectué. Nous vous recommandons d'arriver 15 minutes avant l'horaire prévu pour les formalités d'accueil.",
      },
      {
        question: "Le stage est-il un examen ? Peut-on échouer ?",
        answer:
          "Non, le stage n'est pas un examen et il n'y a pas de note ni d'évaluation. Il s'agit d'une formation de sensibilisation. La seule condition pour valider le stage est d'être présent pendant l'intégralité des 14 heures sur les 2 jours. Toute absence, même partielle, entraîne l'invalidation du stage. Il n'y a donc pas de risque d'\"échec\" si vous êtes présent et participez aux échanges.",
      },
      {
        question: "Le stage est-il confidentiel ?",
        answer:
          "Oui, les échanges qui ont lieu pendant le stage sont strictement confidentiels. Les animateurs sont tenus au secret professionnel et les participants s'engagent à respecter la confidentialité des discussions. Aucune information partagée pendant le stage ne sera communiquée à un tiers (employeur, assurance, etc.).",
      },
    ],
  },
  {
    title: "Après le stage",
    icon: faCircleCheck,
    items: [
      {
        question: "Quand les points sont-ils recrédités sur mon permis ?",
        answer:
          "Les 4 points sont crédités sur votre permis le lendemain du dernier jour du stage (J+1). Le centre de formation transmet une attestation de stage à la Préfecture, qui procède à la mise à jour de votre solde de points. Vous pouvez vérifier votre solde de points sur le site Télépoints (telepoints.info) environ 2 à 3 semaines après le stage, le temps du traitement administratif.",
      },
      {
        question: "Vais-je recevoir une attestation ?",
        answer:
          "Oui, à l'issue du stage, le centre de formation vous remet une attestation de stage. Ce document officiel est à conserver précieusement. Il prouve que vous avez suivi le stage et peut être demandé en cas de contrôle ou de litige. Une copie est également disponible dans votre espace personnel sur BYS Formation.",
      },
      {
        question: "Que faire si mes points ne sont pas recrédités ?",
        answer:
          "Si après 3 semaines votre solde de points n'a pas évolué sur Télépoints, contactez d'abord le centre de formation pour vérifier que l'attestation a bien été transmise à la Préfecture. Si le problème persiste, vous pouvez contacter la Préfecture de votre département avec votre attestation de stage. Notre service client BYS Formation peut également vous assister dans ces démarches via l'espace support.",
      },
      {
        question: "Le stage apparaît-il sur mon relevé d'information intégral ?",
        answer:
          "Oui, le stage apparaît sur votre relevé d'information intégral (RII) accessible via Télépoints. Il est mentionné avec la date du stage et le nombre de points récupérés. Ce relevé est le document officiel qui retrace l'historique complet de votre permis (infractions, retraits et reconstitutions de points).",
      },
      {
        question: "Mon assurance auto sera-t-elle informée du stage ?",
        answer:
          "Non, votre compagnie d'assurance n'est pas informée de votre participation à un stage de récupération de points. Le stage est une démarche personnelle et confidentielle. En revanche, votre assureur peut être informé des infractions (via le fichier national des permis de conduire en cas de sinistre), mais pas du stage en lui-même.",
      },
    ],
  },
];

// ─── ACCORDION COMPONENT ──────────────────────────────────

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-brand-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-brand-text pr-4">{item.question}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-gray-400 text-sm shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-brand-border pt-4">
          {item.answer}
        </div>
      )}
    </div>
  );
}

// ─── PAGE COMPONENT ───────────────────────────────────────

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter FAQ items by search
  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
        );
      }),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      {/* Hero */}
      <section className="bg-[#0A1628] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl mb-4">
            Questions fréquentes
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Retrouvez toutes les réponses à vos questions sur les stages de
            récupération de points, l&apos;inscription, le paiement et le déroulement du stage.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3.5 pl-11 rounded-lg bg-white text-brand-text"
            />
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* Category nav */}
      <section className="border-b border-brand-border bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-3 scrollbar-hide">
            {faqCategories.map((cat) => (
              <button
                key={cat.title}
                onClick={() => {
                  setActiveCategory(activeCategory === cat.title ? null : cat.title);
                  setSearchQuery("");
                  const el = document.getElementById(cat.title);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat.title
                    ? "bg-brand-accent text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FontAwesomeIcon icon={cat.icon} className="mr-1.5" />
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {filteredCategories.length > 0 ? (
          <div className="space-y-12">
            {filteredCategories.map((cat) => (
              <div key={cat.title} id={cat.title}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FontAwesomeIcon icon={cat.icon} className="text-brand-accent" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-brand-text">
                    {cat.title}
                  </h2>
                </div>
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <AccordionItem key={item.question} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-4xl text-gray-300 mb-4"
            />
            <h3 className="font-display font-semibold text-xl text-brand-text mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-500 mb-6">
              Essayez avec d&apos;autres mots-clés ou consultez toutes les catégories.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="btn-secondary text-sm px-6 py-2.5 rounded-lg"
            >
              Voir toutes les questions
            </button>
          </div>
        )}
      </section>

      {/* Still have questions CTA */}
      <section className="bg-white border-t border-brand-border py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-brand-text mb-4">
            Vous n&apos;avez pas trouvé la réponse à votre question ?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Notre équipe est disponible du lundi au vendredi de 9h à 18h pour
            répondre à toutes vos questions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="btn-primary px-8 py-3.5 rounded-lg inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faEnvelope} />
              Contactez-nous
              <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
            </Link>
            <a
              href="tel:+33100000000"
              className="btn-secondary px-8 py-3.5 rounded-lg inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPhone} />
              01 00 00 00 00
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
