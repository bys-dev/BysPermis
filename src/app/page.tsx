"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { TricoloreParticles } from "@/components/ui/TricoloreParticles";
import { CentresProximite } from "@/components/marketplace/CentresProximite";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faLocationDot,
  faChevronDown,
  faChevronUp,
  faShieldHalved,
  faCar,
  faTruck,
  faIdCard,
  faGavel,
  faBalanceScale,
  faArrowRight,
  faCircleCheck,
  faBuilding,
  faLock,
  faUsers,
  faCalendarCheck,
  faEnvelopeOpenText,
  faAward,
  faCreditCard,
  faUserShield,
  faClock,
  faMapMarkerAlt,
  faCheck,
  faXmark,
  faStar,
  faClipboardList,
  faRoad,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// ─── DATA ────────────────────────────────────────────────

interface StageType {
  name: string;
  subtitle: string;
  desc: string;
  icon: IconDefinition;
  badge: string;
  badgeStyle: string;
  price: string;
  slug: string;
}

const stageTypes: StageType[] = [
  {
    name: "Stage volontaire",
    subtitle: "Récupération de points",
    desc: "Après une infraction, récupérez 4 points sur votre permis. Possibilité de faire un stage 1 fois par an maximum.",
    icon: faShieldHalved,
    badge: "+4 points",
    badgeStyle: "bg-red-50 text-red-600 font-bold",
    price: "À partir de 200 €",
    slug: "stage-volontaire",
  },
  {
    name: "Stage 48N",
    subtitle: "Permis probatoire",
    desc: "Lettre 48N reçue ? Vous avez 4 mois pour effectuer ce stage obligatoire et récupérer 4 points.",
    icon: faIdCard,
    badge: "Obligatoire",
    badgeStyle: "bg-red-50 text-red-600 font-bold",
    price: "À partir de 200 €",
    slug: "stage-48n",
  },
  {
    name: "Composition pénale",
    subtitle: "Alternative aux poursuites",
    desc: "Stage proposé par le Procureur de la République comme alternative aux poursuites judiciaires.",
    icon: faGavel,
    badge: "0 point récupéré",
    badgeStyle: "bg-gray-100 text-gray-500",
    price: "À partir de 250 €",
    slug: "composition-penale",
  },
  {
    name: "Peine complémentaire",
    subtitle: "Décision de justice",
    desc: "Stage ordonné par un tribunal en complément d'une condamnation. Aucun point n'est restitué.",
    icon: faBalanceScale,
    badge: "0 point récupéré",
    badgeStyle: "bg-gray-100 text-gray-500",
    price: "À partir de 250 €",
    slug: "peine-complementaire",
  },
];

interface EligibilityItem {
  text: string;
}

const canDoStage: EligibilityItem[] = [
  { text: "Votre permis est valide (pas de lettre 48SI reçue)" },
  { text: "Vous n'avez pas fait de stage depuis 12 mois" },
  { text: "Vous avez perdu au moins 1 point" },
  { text: "Votre permis est suspendu (le stage reste possible)" },
  { text: "Vous habitez un autre département que le centre" },
];

const cannotDoStage: EligibilityItem[] = [
  { text: "Vous avez reçu la lettre 48SI (permis invalidé)" },
  { text: "Stage effectué il y a moins de 12 mois" },
  { text: "Permis annulé par décision judiciaire" },
];

interface Step {
  number: string;
  title: string;
  desc: string;
  icon: IconDefinition;
}

const steps: Step[] = [
  { number: "1", title: "Recherchez", desc: "Trouvez un stage agréé préfecture près de chez vous parmi 150+ centres en France", icon: faMagnifyingGlass },
  { number: "2", title: "Réservez", desc: "Choisissez votre date, payez en ligne de manière sécurisée", icon: faCalendarCheck },
  { number: "3", title: "Recevez votre convocation", desc: "Convocation officielle envoyée par email en 5 minutes", icon: faEnvelopeOpenText },
  { number: "4", title: "Récupérez vos points", desc: "Participez au stage 2 jours et récupérez jusqu'à 4 points (crédités le lendemain)", icon: faAward },
];

interface DayProgram {
  day: string;
  title: string;
  items: string[];
}

const stageProgram: DayProgram[] = [
  {
    day: "Jour 1",
    title: "Bilan et sensibilisation",
    items: [
      "Accueil des participants et présentation",
      "Bilan personnel : analyse de vos infractions",
      "Étude des accidents de la route (statistiques)",
      "Vitesse, alcool, drogues : comprendre les risques",
      "Exercices interactifs en groupe",
    ],
  },
  {
    day: "Jour 2",
    title: "Conduite sécurisée",
    items: [
      "Règles de circulation et signalisation",
      "Fatigue au volant : la détecter, l'éviter",
      "Distances de sécurité et freinage d'urgence",
      "Mises en situation et études de cas",
      "Remise de l'attestation de stage",
    ],
  },
];

interface FeaturedCourse {
  title: string;
  desc: string;
  tag: string;
  duration: string;
  modality: string;
  centre: string;
  price: string;
  places: number;
  icon: IconDefinition;
}

const featuredCourses: FeaturedCourse[] = [
  {
    title: "Stage récupération de points — 2 jours",
    desc: "Stage agréé préfecture permettant de récupérer jusqu'à 4 points sur votre permis de conduire. Encadré par des formateurs certifiés.",
    tag: "Récupération de points",
    duration: "2 jours",
    modality: "Présentiel",
    centre: "BYS Formation Osny",
    price: "250 €",
    places: 8,
    icon: faShieldHalved,
  },
  {
    title: "FIMO Marchandises — 140h",
    desc: "Formation Initiale Minimale Obligatoire pour le transport de marchandises. Qualification indispensable pour exercer le métier de conducteur routier.",
    tag: "FIMO",
    duration: "140h (4 semaines)",
    modality: "Présentiel",
    centre: "Centre Pro Transport",
    price: "2 800 €",
    places: 12,
    icon: faTruck,
  },
  {
    title: "Permis B accéléré — 30h",
    desc: "Formule intensive pour obtenir votre permis de conduire rapidement. Cours de code et heures de conduite inclus dans un programme condensé.",
    tag: "Permis B",
    duration: "30h",
    modality: "Hybride",
    centre: "Auto-école BYS",
    price: "1 500 €",
    places: 5,
    icon: faCar,
  },
];

interface CityGroup {
  region: string;
  cities: string[];
}

const cityGroups: CityGroup[] = [
  {
    region: "Île-de-France",
    cities: ["Paris", "Cergy", "Osny", "Nanterre", "Créteil", "Versailles", "Saint-Denis", "Argenteuil"],
  },
  {
    region: "Grandes villes",
    cities: ["Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Bordeaux", "Lille", "Strasbourg", "Montpellier", "Rennes"],
  },
];

const trustBadges = [
  { icon: faShieldHalved, title: "Agréé Ministère de l'Intérieur", desc: "Tous nos stages sont agréés par la préfecture" },
  { icon: faAward, title: "Certifié Qualiopi", desc: "Certification qualité des organismes de formation" },
  { icon: faCreditCard, title: "Paiement sécurisé Stripe", desc: "Transactions cryptées et 100% sécurisées" },
  { icon: faUserShield, title: "Données protégées RGPD", desc: "Vos données personnelles sont protégées" },
];

interface FaqEntry {
  question: string;
  answer: string;
}

const faqItems: FaqEntry[] = [
  {
    question: "Combien de points puis-je récupérer avec un stage ?",
    answer: "Un stage de sensibilisation à la sécurité routière permet de récupérer 4 points, crédités le lendemain du 2ème jour de stage (art. R223-8 du Code de la route). Le total de vos points ne peut pas dépasser 12 (ou 6 en permis probatoire).",
  },
  {
    question: "Combien coûte un stage de récupération de points ?",
    answer: "Le prix varie entre 200 € et 300 € selon le centre et la région. Sur BYS Formation, vous pouvez comparer les prix de tous les centres agréés près de chez vous pour trouver le meilleur tarif. Attention : les stages ne sont pas remboursés par la Sécurité sociale ni éligibles CPF.",
  },
  {
    question: "Quels documents dois-je apporter le jour du stage ?",
    answer: "Vous devez impérativement présenter votre permis de conduire ORIGINAL (pas de copie), une pièce d'identité en cours de validité (carte d'identité ou passeport), et votre convocation reçue par email (imprimée ou sur smartphone).",
  },
  {
    question: "Puis-je faire un stage avec un permis suspendu ?",
    answer: "Oui, la suspension administrative ou judiciaire de votre permis ne vous empêche pas de suivre un stage de récupération de points. En revanche, si votre permis est invalidé (lettre 48SI), vous ne pouvez plus faire de stage.",
  },
  {
    question: "À quelle fréquence puis-je faire un stage ?",
    answer: "Vous pouvez effectuer un stage volontaire 1 fois par an maximum (délai de 1 an entre la date du dernier stage et le nouveau stage, art. L223-6 du Code de la route). Ce délai s'applique aussi au stage 48N.",
  },
  {
    question: "Comment vérifier mon solde de points ?",
    answer: "Rendez-vous sur le site officiel mespoints.permisdeconduire.gouv.fr et connectez-vous avec France Connect. Vous obtiendrez un relevé intégral d'information qui indique votre solde exact et l'historique de vos infractions.",
  },
];

const popularTags: string[] = ["Récupération de points", "Stage 48N", "Permis B accéléré", "FIMO", "Sécurité routière"];

interface KeyStat {
  value: string;
  label: string;
  icon: IconDefinition;
}

const keyStats: KeyStat[] = [
  { value: "4", label: "points récupérés", icon: faStar },
  { value: "2", label: "jours de stage", icon: faCalendarCheck },
  { value: "150+", label: "centres agréés", icon: faMapMarkerAlt },
  { value: "5 min", label: "convocation email", icon: faBolt },
];

// ─── HELPERS ─────────────────────────────────────────────

function citySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

// ─── COMPONENT ───────────────────────────────────────────

interface LiveFormation {
  id: string;
  titre: string;
  slug: string;
  prix: number;
  duree: string;
  modalite: string;
  isQualiopi: boolean;
  categorie?: { nom: string } | null;
  centre: { nom: string; ville: string };
  sessions: { placesRestantes: number }[];
}

function iconForCategorie(nom: string): IconDefinition {
  if (nom.includes("point") || nom.includes("sensib")) return faShieldHalved;
  if (nom.includes("FIMO") || nom.includes("FCO") || nom.includes("transport")) return faTruck;
  if (nom.includes("Permis") || nom.includes("moto")) return faCar;
  return faClipboardList;
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [liveCourses, setLiveCourses] = useState<LiveFormation[]>([]);

  useEffect(() => {
    fetch("/api/formations?perPage=3")
      .then((r) => r.json())
      .then((data) => { if (data.formations?.length) setLiveCourses(data.formations); })
      .catch(() => {});
  }, []);

  return (
    <>
      <Header />
      <main>
        {/* ═══ 1. HERO — Dark navy, bold typography ═══ */}
        <section className="relative bg-[#0A1628] pt-20 pb-24 px-4 sm:px-8 min-h-[720px] flex items-center overflow-hidden">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(37,99,235,0.1) 0%, transparent 70%)" }} />

          {/* Particules bleu-blanc-rouge animées */}
          <TricoloreParticles />
          <div className="max-w-[1440px] mx-auto w-full relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="max-w-4xl mx-auto lg:mx-0 lg:max-w-2xl text-center lg:text-left flex-1">
              <div className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
                {/* Mini drapeau français */}
                <span className="inline-flex mr-2 rounded overflow-hidden">
                  <span className="w-1.5 h-4 bg-blue-500" />
                  <span className="w-1.5 h-4 bg-white" />
                  <span className="w-1.5 h-4 bg-red-500" />
                </span>
                <span className="text-sm font-medium text-gray-300">
                  Agréé Ministère de l&apos;Intérieur — Stages agréés préfecture 🇫🇷
                </span>
              </div>

              <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-[3.5rem] text-white mb-6 leading-tight tracking-tight">
                Récupérez vos{" "}
                <span className="text-red-400">points</span> près de chez vous
                <br className="hidden sm:block" /> au meilleur prix
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
                Stage agréé préfecture — Récupérez jusqu&apos;à 4 points en 2 jours.
                Convocation immédiate par email. Plus de 150 centres partenaires en France.
              </p>

              {/* Search Card — glass effect */}
              <div className="bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/10 p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-5">
                    <label className="block text-sm font-medium text-gray-300 mb-2 text-left">Quel stage ?</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="text" placeholder="Récupération de points, FIMO..." className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200" />
                    </div>
                  </div>
                  <div className="sm:col-span-5">
                    <label className="block text-sm font-medium text-gray-300 mb-2 text-left">Où ? (ville ou code postal)</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faLocationDot} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="text" placeholder="Paris, 95000, Lyon..." className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200" />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <Link href="/recherche" className="w-full bg-red-600 text-white py-3.5 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 text-center block shadow-lg shadow-red-600/25">
                      Rechercher
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-white/10">
                  <span className="text-sm text-gray-500 mr-1">Populaires :</span>
                  {popularTags.map((tag) => (
                    <Link key={tag} href="/recherche" className="px-3 py-1.5 bg-white/5 hover:bg-blue-600/20 hover:text-blue-300 text-gray-400 text-sm rounded-full transition-all duration-200 border border-white/10">
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Trusted by strip */}
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-gray-300">
                <span className="flex items-center gap-2">
                  <svg className="inline-block w-5 h-3.5 rounded-sm overflow-hidden" viewBox="0 0 30 20">
                    <rect width="10" height="20" x="0" fill="#002395"/>
                    <rect width="10" height="20" x="10" fill="#FFFFFF"/>
                    <rect width="10" height="20" x="20" fill="#ED2939"/>
                  </svg>
                  Agréé Préfecture
                </span>
                <span className="hidden sm:inline text-gray-700">|</span>
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faAward} className="text-blue-600/60" />
                  Certifié Qualiopi
                </span>
                <span className="hidden sm:inline text-gray-700">|</span>
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600/60" />
                  +150 centres en France
                </span>
                <span className="hidden sm:inline text-gray-700">|</span>
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faEnvelopeOpenText} className="text-blue-600/60" />
                  Convocation immédiate
                </span>
              </div>
            </div>

            {/* Image radar + permis — desktop only */}
            <div className="hidden lg:block lg:flex-1 lg:max-w-xl">
              <img
                src="/hero-radar-permis.jpg"
                alt="Radar et permis de conduire — Récupérez vos points"
                className="relative z-10 w-full max-w-lg mx-auto lg:max-w-none rounded-2xl shadow-2xl border border-white/10 object-cover"
              />
            </div>
            </div>
          </div>
        </section>

        {/* ═══ 2. KEY NUMBERS BAR — Rouge strip (BBR: le rouge prend sa place) ═══ */}
        <section className="py-5 px-4 sm:px-8 bg-red-600">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
              {keyStats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-center gap-3 text-white">
                  <FontAwesomeIcon icon={stat.icon} className="text-white/80 text-lg" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-display font-bold">{stat.value}</span>
                    <span className="text-sm text-red-100">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 3. CENTRES À PROXIMITÉ ═══ */}
        <CentresProximite />

        {/* ═══ 4. LES 4 TYPES DE STAGES ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Quel stage est fait pour vous ?
              </h2>
              <p className="text-lg text-gray-500">4 cas différents selon votre situation</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stageTypes.map((stage) => (
                <div
                  key={stage.name}
                  className="bg-white rounded-2xl border border-brand-border p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-200">
                      <FontAwesomeIcon icon={stage.icon} className="text-blue-600 text-lg group-hover:text-white transition-colors duration-200" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stage.badgeStyle}`}>
                      {stage.badge}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-lg text-brand-text mb-1">{stage.name}</h3>
                  <p className="text-xs font-medium text-blue-600 mb-3">{stage.subtitle}</p>
                  <p className="text-gray-500 text-sm mb-5 flex-1">{stage.desc}</p>
                  <div className="pt-4 border-t border-brand-border">
                    <p className="text-sm font-semibold text-brand-text mb-3">{stage.price}</p>
                    <Link
                      href={`/formations/${stage.slug}`}
                      className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <span>En savoir plus</span>
                      <FontAwesomeIcon icon={faArrowRight} className="ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 4. ÉLIGIBILITÉ ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Êtes-vous éligible au stage ?
              </h2>
              <p className="text-lg text-gray-500">Vérifiez rapidement votre situation avant de réserver</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CAN do stage */}
              <div className="bg-white rounded-2xl border border-brand-border p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faCheck} className="text-blue-600" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-brand-text">
                    Vous POUVEZ faire le stage si...
                  </h3>
                </div>
                <ul className="space-y-4">
                  {canDoStage.map((item) => (
                    <li key={item.text} className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faCheck} className="text-blue-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CANNOT do stage */}
              <div className="bg-white rounded-2xl border border-brand-border p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faXmark} className="text-red-400" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-brand-text">
                    Vous NE POUVEZ PAS si...
                  </h3>
                </div>
                <ul className="space-y-4">
                  {cannotDoStage.map((item) => (
                    <li key={item.text} className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faXmark} className="text-red-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Legal note */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Vérifiez votre solde de points sur{" "}
                <a
                  href="https://mespoints.permisdeconduire.gouv.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  mespoints.permisdeconduire.gouv.fr
                </a>
                {" "}— Réf. article L223-6 du Code de la route
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 5. COMMENT ÇA MARCHE ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">Comment ça marche ?</h2>
              <p className="text-base text-gray-500">Réservez votre stage en 4 étapes simples</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={step.icon} className="text-white text-lg" />
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mb-2">ÉTAPE {step.number}</div>
                  <h3 className="font-display font-semibold text-lg text-brand-text mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 6. DÉROULÉ DU STAGE ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Comment se déroule un stage ?
              </h2>
              <p className="text-lg text-gray-500">2 jours de sensibilisation à la sécurité routière (14 heures)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stageProgram.map((day) => (
                <div key={day.day} className="bg-white rounded-2xl border border-brand-border overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <FontAwesomeIcon icon={faClipboardList} className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-blue-600">{day.day}</div>
                        <h3 className="font-display font-semibold text-lg text-brand-text">{day.title}</h3>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {day.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <FontAwesomeIcon icon={faCircleCheck} className="text-blue-600 mt-0.5 flex-shrink-0 text-sm" />
                          <span className="text-gray-600 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional info strip */}
            <div className="mt-8 bg-white rounded-2xl border border-brand-border p-6 text-center">
              <p className="text-sm text-gray-500">
                Animé par <span className="font-medium text-brand-text">1 psychologue + 1 formateur BAFM agréés</span> • 6 à 20 participants • Pas de contrôle de connaissances
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 7. FORMATIONS VEDETTES ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
              <div>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-2">Stages et formations à la une</h2>
                <p className="text-lg text-gray-500">Les prochains stages disponibles près de chez vous</p>
              </div>
              <Link href="/recherche" className="flex items-center space-x-2 text-blue-600 font-medium hover:underline">
                <span>Voir tous les stages</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(liveCourses.length > 0 ? liveCourses.map((f) => ({
                id: f.id,
                title: f.titre,
                slug: f.slug,
                desc: "",
                tag: f.categorie?.nom ?? "Formation",
                duration: f.duree,
                modality: f.modalite === "PRESENTIEL" ? "Présentiel" : f.modalite === "DISTANCIEL" ? "Distanciel" : "Hybride",
                centre: f.centre.nom,
                ville: f.centre.ville,
                price: `${f.prix} €`,
                places: f.sessions[0]?.placesRestantes ?? 0,
                icon: iconForCategorie(f.categorie?.nom ?? ""),
              })) : featuredCourses.map((c) => ({ ...c, id: c.title, slug: "recherche", ville: "Île-de-France" }))).map((course) => (
                <div key={course.id} className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer flex flex-col">
                  {/* Gradient top border */}
                  <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                  <div className="p-6 flex flex-col flex-1">
                    {/* Tag + icon inline */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={course.icon} className="text-blue-600 text-sm" />
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">{course.tag}</span>
                      <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full flex items-center">
                        <FontAwesomeIcon icon={faClock} className="mr-1 text-[10px]" />
                        {course.duration}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-lg text-brand-text mb-2 group-hover:text-blue-600 transition-colors duration-200">
                      {course.title}
                    </h3>
                    {"desc" in course && course.desc && <p className="text-gray-500 text-sm mb-5 line-clamp-2">{course.desc}</p>}

                    {/* Centre info */}
                    <div className="flex items-center space-x-2 mb-5">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">{course.centre.charAt(0)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{course.centre}</span>
                        <span className="text-xs text-gray-400 flex items-center">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-[10px]" />
                          {course.ville}
                        </span>
                      </div>
                    </div>

                    {/* Places restantes — progress bar */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="flex items-center text-gray-400">
                          <FontAwesomeIcon icon={faUsers} className="mr-1" />
                          {course.places} places restantes
                        </span>
                        <span className="text-gray-400">{course.modality}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(100 - (course.places / 15) * 100, 15)}%` }}
                        />
                      </div>
                    </div>

                    {/* Price + CTA — pushed to bottom */}
                    <div className="flex items-center justify-between pt-4 border-t border-brand-border mt-auto">
                      <div className="text-2xl font-display font-bold text-brand-text">{course.price}</div>
                      <Link href={`/formations/${course.slug}`} className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-red-600/20">
                        Réserver
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 8. VILLES POPULAIRES — SEO section ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Trouvez un stage près de chez vous
              </h2>
              <p className="text-lg text-gray-500">Stages de récupération de points dans toute la France</p>
            </div>

            <div className="space-y-10">
              {cityGroups.map((group) => (
                <div key={group.region}>
                  <h3 className="font-display font-semibold text-lg text-brand-text mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 text-sm" />
                    {group.region}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.cities.map((city) => (
                      <Link
                        key={city}
                        href={`/recherche?ville=${citySlug(city)}`}
                        className="px-4 py-2 bg-white border border-brand-border rounded-full text-sm text-gray-600 hover:text-blue-600 hover:border-blue-600 transition-all duration-200"
                      >
                        {city}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 9. ESPACE PRO CTA — Navy bg, fake dashboard ═══ */}
        <section className="py-24 px-4 sm:px-8 bg-[#0A1628]">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
                  <FontAwesomeIcon icon={faBuilding} className="text-blue-300 mr-2" />
                  <span className="text-sm font-medium text-gray-300">Pour les centres de formation</span>
                </div>
                <h2 className="font-display font-bold text-3xl sm:text-5xl text-white mb-6 leading-tight">
                  Vous êtes centre de formation ?{" "}
                  <span className="text-blue-300">Rejoignez le réseau BYS</span>
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Ouvrez votre boutique en ligne et accédez à des milliers de conducteurs qui cherchent un stage.
                </p>
                <ul className="space-y-4 mb-10">
                  {["Visibilité accrue sur toute la France", "Gestion simplifiée des inscriptions et convocations", "Paiements sécurisés et virements automatiques", "Dashboard complet avec statistiques en temps réel"].map((item) => (
                    <li key={item} className="flex items-start">
                      <FontAwesomeIcon icon={faCircleCheck} className="text-blue-300 text-lg mr-3 mt-1" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href="/inscription" className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 shadow-xl shadow-red-600/20">
                    Devenir partenaire
                  </Link>
                  <Link href="/a-propos" className="border border-white/20 text-gray-300 px-8 py-4 rounded-lg font-semibold hover:bg-white/5 transition-colors duration-200">
                    En savoir plus
                  </Link>
                </div>
              </div>

              {/* Fake dashboard mockup — built with divs */}
              <div className="relative">
                <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-2xl">
                  {/* Dashboard header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">BYS Dashboard</div>
                        <div className="text-xs text-gray-500">Centre de formation</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    </div>
                  </div>
                  {/* Mini stat cards */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { val: "127", lbl: "Réservations" },
                      { val: "4 850 €", lbl: "Revenus" },
                      { val: "98%", lbl: "Satisfaction" },
                    ].map((s) => (
                      <div key={s.lbl} className="bg-white/[0.06] border border-white/10 rounded-xl p-3 text-center">
                        <div className="text-lg font-display font-bold text-white">{s.val}</div>
                        <div className="text-[10px] text-gray-500">{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                  {/* Fake chart bars */}
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 mb-4">
                    <div className="text-xs text-gray-500 mb-3">Réservations (7 derniers jours)</div>
                    <div className="flex items-end gap-2 h-20">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === 5 ? "#2563EB" : "rgba(37,99,235,0.2)" }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-gray-600">
                      <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
                    </div>
                  </div>
                  {/* Fake list */}
                  <div className="space-y-2">
                    {[
                      { name: "J. Dupont", status: "Confirmée" },
                      { name: "M. Martin", status: "En attente" },
                    ].map((r) => (
                      <div key={r.name} className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                            <span className="text-[10px] text-blue-300 font-bold">{r.name.charAt(0)}</span>
                          </div>
                          <span className="text-xs text-gray-300">{r.name}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === "Confirmée" ? "bg-blue-600/20 text-blue-300" : "bg-white/10 text-gray-400"}`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 10. TRUST BADGES — Horizontal strip ═══ */}
        <section className="py-8 px-4 sm:px-8 bg-gray-50 border-y border-brand-border">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustBadges.map((badge) => (
                <div key={badge.title} className="flex items-center gap-3 justify-center sm:justify-start">
                  <FontAwesomeIcon icon={badge.icon} className="text-blue-600 text-lg flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-brand-text">{badge.title}</div>
                    <div className="text-xs text-gray-400">{badge.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 11. FAQ ═══ */}
        <section className="py-24 px-4 sm:px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">Questions fréquentes</h2>
              <p className="text-lg text-gray-500">Tout ce que vous devez savoir sur les stages de récupération de points</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {faqItems.map((item, index) => (
                <div key={item.question} className="bg-gray-50 rounded-2xl border border-brand-border overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span className="font-semibold text-lg text-brand-text pr-4">{item.question}</span>
                    <FontAwesomeIcon icon={openFaq === index ? faChevronUp : faChevronDown} className="text-gray-400 flex-shrink-0" />
                  </button>
                  {openFaq === index && (
                    <div className="px-8 pb-6">
                      <p className="text-gray-500 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-500 mb-4">Vous ne trouvez pas la réponse à votre question ?</p>
              <Link href="/faq" className="text-blue-600 font-semibold hover:underline">
                Voir toutes les questions <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ 12. NEWSLETTER — Clean strip, navy bg ═══ */}
        <section className="py-12 px-4 sm:px-8 bg-[#0A1628]">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h3 className="font-display font-bold text-xl text-white mb-1">
                  Restez informé des prochains stages près de chez vous
                </h3>
                <p className="text-gray-300 text-sm">
                  Recevez les alertes de nouveaux stages et formations dans votre région.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="w-full sm:w-72 px-5 py-3 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-white placeholder-gray-400 transition-all duration-200"
                />
                <button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 whitespace-nowrap">
                  S&apos;inscrire
                </button>
              </div>
              <p className="text-gray-600 text-xs flex items-center gap-1 lg:hidden">
                <FontAwesomeIcon icon={faLock} />
                Données protégées. Désinscription à tout moment.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
